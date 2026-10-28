import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('editorial discovery', () => {
  it('limits initial tag overload in both blogs', () => {
    for (const path of ['src/pages/blog/[...page].astro', 'src/pages/es/blog/[...page].astro']) {
      const s = readFileSync(path, 'utf8');
      expect(s).toContain('allTags.slice(0, 12)');
      expect(s).toContain('allTags.slice(12)');
    }
  });
  it('offers project/topic filters for the devlog index', () => {
    const src = readFileSync('src/components/pages/DevlogIndexPage.astro', 'utf8');
    expect(src).toContain('data-devlog-filters');
    expect(src).toContain('data-devlog-topic');
    expect(src).toContain('aria-pressed');
  });
  it('offers a hero and table of contents for devlog entries', () => {
    for (const path of ['src/pages/devlog/[...slug].astro', 'src/pages/es/devlog/[...slug].astro']) {
      const s = readFileSync(path, 'utf8');
      expect(s).toContain('tocHeadings');
      expect(s).toContain('post.data.heroImage');
    }
  });
});
