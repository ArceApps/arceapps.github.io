/**
 * Deployment smoke test for ArceApps' five-part ES/EN agent series.
 *
 * Runs on GitHub-hosted runner AFTER successful Pages deployment. An article
 * is expected at the canonical route only on/after its Europe/Madrid pubDate.
 * This tests live HTTP, including the absence of future articles; it never
 * reads private source, credentials, or publication artifacts.
 */
const site = process.env.SITE_URL || 'https://arceapps.com';
const today = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const episodes = [
  ['2026-11-07', 'chatgpt-desktop-agent-orchestration'],
  ['2026-11-09', 'claude-desktop-external-coding-agents'],
  ['2026-11-11', 'mcp-acp-a2a-agent-protocols'],
  ['2026-11-14', 'multi-provider-coding-agent-workflow'],
  ['2026-11-17', 'multi-agent-routing-cost-control'],
];
const checks = episodes.flatMap(([date, slug]) =>
  ['es', 'en'].map(lang => ({
    date, slug, lang,
    url: new URL(`${lang === 'es' ? '/es' : ''}/blog/${slug}/`, site).href,
    expected: date <= today ? 200 : 404,
  })),
);

console.log(`Release smoke test — Europe/Madrid date: ${today}; site: ${site}`);
let pending = checks;
for (let round = 1; round <= 7 && pending.length; round++) {
  const attempts = await Promise.all(pending.map(async check => {
    try {
      const response = await fetch(check.url, {
        redirect: 'follow',
        headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'ArceApps-Pages-Release-Smoke/1.0' },
        signal: AbortSignal.timeout(15_000),
      });
      const page = check.expected === 200 ? await response.text() : '';
      const validPage = check.expected === 404 || (page.includes('article-detail') && page.includes(check.slug));
      const ok = response.status === check.expected && validPage;
      return { ...check, observed: response.status, ok,
        reason: !validPage ? 'article markup or slug missing' : null };
    } catch (error) {
      return { ...check, observed: 'network error', ok: false, reason: String(error) };
    }
  }));
  pending = attempts.filter(item => !item.ok);
  for (const item of attempts) {
    console.log(`${item.ok ? 'PASS' : 'RETRY'} ${item.lang} ${item.slug}: expected ${item.expected}, got ${item.observed}${item.reason ? ' — ' + item.reason : ''}`);
  }
  // GitHub Pages/CDN may take a short time to expose an already completed deploy.
  if (pending.length && round < 7) await new Promise(resolve => setTimeout(resolve, 10_000));
}
if (pending.length) {
  console.error('FAILED: Canonical publication or future-route isolation could not be verified.');
  process.exitCode = 1;
} else {
  console.log('PASS: Every released ES/EN article is live and all future ES/EN routes return 404.');
}
