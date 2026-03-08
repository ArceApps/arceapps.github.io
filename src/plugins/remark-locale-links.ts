/**
 * remark-locale-links
 *
 * Remark plugin that automatically prefixes internal links with the correct
 * locale path based on the source file's language folder.
 *
 * Problem it solves:
 *   Content authors writing Spanish blog posts naturally write links like
 *   `/blog/my-article`. Without this plugin those links point to the
 *   English route instead of the Spanish one (`/es/blog/my-article`).
 *
 * How it works:
 *   At build time, Astro passes each Markdown file through the remark
 *   pipeline together with its VFile, which carries the absolute file path.
 *   This plugin inspects that path, detects the locale folder (`es/`, etc.),
 *   and rewrites every internal absolute link that starts with a known
 *   localised route (blog, apps, devlog) to include the correct prefix.
 *
 * Examples (for a file inside `content/blog/es/`):
 *   `/blog/my-article`          → `/es/blog/my-article`
 *   `/apps/my-app`              → `/es/apps/my-app`
 *   `/es/blog/already-prefixed` → unchanged  (already has locale prefix)
 *   `https://external.com`      → unchanged  (external URL)
 *   `/images/photo.png`         → unchanged  (not a localised route)
 */

import type { Root, Link } from 'mdast';
import type { VFile } from 'vfile';

/** Routes that have locale-specific counterparts under `/es/`, etc. */
const LOCALE_ROUTES = ['blog', 'apps', 'devlog'] as const;

/** Non-default locales supported by the site (must match `astro.config.mjs`). */
const NON_DEFAULT_LOCALES = ['es'] as const;

type Locale = (typeof NON_DEFAULT_LOCALES)[number];

/**
 * Detects the locale of a content file from its absolute path.
 * Returns `null` for English (default locale) or unrecognised paths.
 *
 * File paths follow the pattern: `.../content/<collection>/<locale>/file.md`
 * e.g. `.../content/blog/es/my-post.md`
 */
function detectLocale(filePath: string): Locale | null {
  const marker = `/content/`;
  const idx = filePath.indexOf(marker);
  if (idx === -1) return null;

  // afterContent is like "blog/es/file.md" or "apps/en/file.md"
  const afterContent = filePath.slice(idx + marker.length);
  const parts = afterContent.split('/');
  // parts[0] = collection name, parts[1] = locale folder
  const maybeLocale = parts[1] as Locale;

  return (NON_DEFAULT_LOCALES as readonly string[]).includes(maybeLocale)
    ? maybeLocale
    : null;
}

/** Recursively walks an MDAST node and calls `fn` for every `link` node. */
function walkLinks(node: unknown, fn: (link: Link) => void): void {
  if (!node || typeof node !== 'object') return;
  const n = node as Record<string, unknown>;
  if (n['type'] === 'link') {
    fn(n as unknown as Link);
  }
  if (Array.isArray(n['children'])) {
    for (const child of n['children'] as unknown[]) {
      walkLinks(child, fn);
    }
  }
}

/**
 * Returns the remark plugin function.
 * Register in `astro.config.mjs` under `markdown.remarkPlugins`.
 */
export function remarkLocaleLinks() {
  return function transformer(tree: Root, file: VFile): void {
    const filePath = (file.history?.[0] ?? (file as unknown as { path?: string }).path ?? '') as string;
    const locale = detectLocale(filePath);

    // Default locale (English) — no transformation needed
    if (!locale) return;

    walkLinks(tree, (node) => {
      const url = node.url;

      // Skip non-absolute links (relative, hash-only, query-only)
      if (!url.startsWith('/')) return;
      // Skip protocol-relative external links
      if (url.startsWith('//')) return;

      const segments = url.slice(1).split('/'); // strip leading '/' then split
      const firstSegment = segments[0];

      // Skip if already prefixed with any known locale
      if ((NON_DEFAULT_LOCALES as readonly string[]).includes(firstSegment)) return;

      // Only transform known locale-specific routes
      if (!(LOCALE_ROUTES as readonly string[]).includes(firstSegment)) return;

      node.url = `/${locale}${url}`;
    });
  };
}
