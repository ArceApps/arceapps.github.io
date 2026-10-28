import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

const base = 'http://127.0.0.1:4321';
const output = 'artifacts/portfolio-visual-qa';
const routes = [
  ['home-en', '/'], ['home-es', '/es/'],
  ['apps-en', '/apps'], ['apps-es', '/es/apps'],
  ['blog-en', '/blog'], ['blog-es', '/es/blog'],
  ['devlog-en', '/devlog'], ['devlog-es', '/es/devlog'],
  ['about-en', '/about-me'], ['about-es', '/es/about-me'],
];
const sizes = { mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
const server = spawn('pnpm', ['preview', '--host', '127.0.0.1', '--port', '4321'], { stdio: ['ignore', 'pipe', 'pipe'], detached: true });
server.stdout.on('data', data => process.stdout.write(data));
server.stderr.on('data', data => process.stderr.write(data));
let browser;

async function waitForPreview() {
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw new Error('Astro preview terminated before starting');
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error('Timed out waiting for Astro preview');
}

try {
  await mkdir(output, { recursive: true });
  await waitForPreview();
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const report = [];
  for (const theme of ['light', 'dark']) {
    for (const [size, viewport] of Object.entries(sizes)) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      await context.addInitScript(value => {
        localStorage.setItem('theme', value);
        // Inspect the page itself without the fixed first-visit cookie overlay.
        localStorage.setItem('cookie-consent', 'dismissed');
      }, theme);
      try {
        for (const [name, route] of routes) {
          const page = await context.newPage();
          // Home redirects browser-language visitors to /es/ unless they already
          // selected a language. Pin the preference for each route so QA tests
          // the requested EN/ES page, not the browser's automatic redirect.
          await page.addInitScript(preference => localStorage.setItem('lang-preference', preference), name.endsWith('-es') ? 'es' : 'en');
          try {
            const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
            if (!response?.ok()) throw new Error(`HTTP ${response?.status()} for ${route}`);
            await page.locator('#main-content').waitFor({ state: 'visible', timeout: 15000 });
            await page.evaluate(() => document.fonts.ready);
            // Screenshots taken immediately after DOMContentLoaded can show
            // blank lazy-loaded Google Play icons. Let visible images decode.
            await page.evaluate(async () => {
              const visible = [...document.images].filter(img => {
                const box = img.getBoundingClientRect();
                return box.top < innerHeight * 1.5 && box.bottom > -innerHeight * 0.5;
              });
              visible.forEach(img => { img.loading = 'eager'; });
              await Promise.race([
                Promise.all(visible.map(img => img.decode().catch(() => undefined))),
                new Promise(resolve => setTimeout(resolve, 6000))
              ]);
              const broken = visible.filter(img => img.complete && img.naturalWidth === 0);
              if (broken.length) console.warn('Images unavailable in browser:', broken.map(img => img.currentSrc || img.src));
            });
            const metrics = await page.evaluate(() => ({
              lang: document.documentElement.lang,
              dark: document.documentElement.classList.contains('dark'),
              width: document.documentElement.clientWidth,
              scrollWidth: document.documentElement.scrollWidth,
              bodyBackground: getComputedStyle(document.body).backgroundColor,
              mainText: document.querySelector('#main-content')?.textContent || '',
            }));
            const expectedLang = name.endsWith('-es') ? 'es' : 'en';
            if (metrics.lang !== expectedLang) throw new Error(`Wrong locale on ${route}: ${metrics.lang}`);
            if (metrics.dark !== (theme === 'dark')) throw new Error(`Wrong theme on ${route}: ${theme}`);
            if (metrics.scrollWidth > metrics.width + 4) throw new Error(`Horizontal overflow on ${route}: ${metrics.scrollWidth} > ${metrics.width}`);
            if (name.startsWith('about-') && /\b(?:19|20)\d{2}\b|\b(?:employer|empleador|employment history|experiencia laboral|currículum)\b/i.test(metrics.mainText)) {
              throw new Error(`About page contains biographical or employment content: ${route}`);
            }
            await page.screenshot({ path: `${output}/${name}-${size}-${theme}.png`, fullPage: true, animations: 'disabled', timeout: 30000 });
            report.push({ route, name, size, theme, width: metrics.width, scrollWidth: metrics.scrollWidth, bodyBackground: metrics.bodyBackground });
            console.log(`OK ${name} ${size} ${theme}`);
          } finally {
            await page.close();
          }
        }
      } finally {
        await context.close();
      }
    }
  }
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(`Visual QA: ${report.length} responsive/theme/locale snapshots validated`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  // pnpm launches Astro as a child: terminate the entire POSIX process group.
  if (server.pid) {
    try { process.kill(-server.pid, 'SIGTERM'); } catch {}
  }
  server.stdout.destroy();
  server.stderr.destroy();
}
