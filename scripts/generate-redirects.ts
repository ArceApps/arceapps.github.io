import { execSync } from 'node:child_process';

const lines = execSync(
  `git log --diff-filter=R --name-status -2 -- 'src/content/'`,
  { encoding: 'utf8' },
);

const redirects: string[] = [];
for (const line of lines.split('\n')) {
  if (!line.startsWith('R100')) continue;
  const [, from, to] = line.split('\t');
  if (!from || !to) continue;
  if (!from.includes('/es/')) continue;
  // from: src/content/blog/es/old-slug.md
  // to:   src/content/blog/es/new-slug.md
  const fromSlug = from.replace(/^src\/content\/([^/]+)\/es\/(.+)\.md$/, '$1/$2');
  const toSlug = to.replace(/^src\/content\/([^/]+)\/es\/(.+)\.md$/, '$1/$2');
  const fromUrl = '/es/' + fromSlug;
  const toUrl = '/es/' + toSlug;
  redirects.push(`    '${fromUrl}': '${toUrl}',`);
}

// Dedupe (the previous PRs may already include some)
const unique = Array.from(new Set(redirects)).sort();
console.log(`# ${unique.length} unique ES redirects generated (from last 2 commits).`);
// Group by collection
const byCol: Record<string, string[]> = {};
for (const r of unique) {
  const col = r.match(/^\s*'\/es\/(blog|devlog)\//)?.[1] ?? 'other';
  byCol[col] = byCol[col] ?? [];
  byCol[col].push(r);
}
for (const [col, lines] of Object.entries(byCol)) {
  console.log(`# ${col} (${lines.length}):`);
  for (const l of lines) console.log(l);
}
