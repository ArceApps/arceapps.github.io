/**
 * Broken Internal Link Validator
 *
 * This Vitest test reads every Markdown file in `src/content/blog/` and
 * validates that every internal link (`/blog/<slug>`) points to a file that
 * actually exists in the content collection.
 *
 * Rules:
 *  - English files  → `/blog/<slug>`   must resolve to `en/<slug>.md`
 *  - Spanish files  → `/blog/<slug>`   must resolve to `es/<slug>.md`
 *    (Authors write `/blog/<slug>` without the `/es/` prefix; the
 *     `remarkLocaleLinks` plugin adds it at build time.)
 *
 * Why run this at test time and not just rely on the remark plugin?
 * The plugin silently rewrites links — it cannot tell you when a linked
 * article simply does not exist. This test provides that safety net.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.resolve(__dirname, '../content/blog');
const LOCALES = ['en', 'es'] as const;

/** Returns the slugs (filename without .md) for all posts in a locale. */
function getSlugsForLocale(locale: string): Set<string> {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return new Set();
  return new Set(
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
  );
}

/** Extracts all `/blog/<slug>` links from markdown text. */
function extractInternalBlogLinks(content: string): string[] {
  // Matches Markdown links: [text](/blog/slug) or [text](/blog/slug#hash)
  const mdLinkRe = /\]\(\/blog\/([^)\s#]+)/g;
  const slugs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = mdLinkRe.exec(content)) !== null) {
    slugs.push(m[1]);
  }
  return slugs;
}

// ---------------------------------------------------------------------------
// Build the test matrix
// ---------------------------------------------------------------------------

interface BrokenLink {
  file: string;
  slug: string;
  expectedLocale: string;
}

const brokenLinks: BrokenLink[] = [];
const checkedCount = { value: 0 };

for (const locale of LOCALES) {
  const slugsInLocale = getSlugsForLocale(locale);
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const linkedSlugs = extractInternalBlogLinks(content);

    for (const slug of linkedSlugs) {
      checkedCount.value++;
      if (!slugsInLocale.has(slug)) {
        brokenLinks.push({
          file: `src/content/blog/${locale}/${file}`,
          slug,
          expectedLocale: locale,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Internal blog link validation', () => {
  it('should find at least one blog post to validate', () => {
    expect(checkedCount.value).toBeGreaterThan(0);
  });

  if (brokenLinks.length === 0) {
    it('all internal /blog/ links resolve to existing posts', () => {
      // Nothing broken — this is the happy path
      expect(brokenLinks).toHaveLength(0);
    });
  } else {
    // Report each broken link as a separate failing test for clarity
    for (const { file, slug, expectedLocale } of brokenLinks) {
      it(`[${expectedLocale}] "${file}" links to /blog/${slug} which does not exist`, () => {
        expect.fail(
          `Broken link detected!\n` +
            `  File:   ${file}\n` +
            `  Link:   /blog/${slug}\n` +
            `  Reason: No file found at src/content/blog/${expectedLocale}/${slug}.md\n\n` +
            `  Fix:    Either create the missing post or update the link to point to an existing post.`
        );
      });
    }
  }
});
