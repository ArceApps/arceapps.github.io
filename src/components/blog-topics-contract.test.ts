import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('blog categories match editorial browse intent', () => {
  it('uses one shared categorizer for category pages and both indexes', () => {
    const taxonomy = readFileSync('src/utils/blog-topics.ts','utf8');
    expect(taxonomy).toContain('export function topicOf');
    for (const route of ['src/pages/blog/[...page].astro', 'src/pages/es/blog/[...page].astro',
      'src/pages/blog/topic/[topic]/[...page].astro', 'src/pages/es/blog/topic/[topic]/[...page].astro']) {
      const source = readFileSync(route, 'utf8');
      expect(source).toContain('topicOf');
    }
  });
  it('does not expose drafts and future posts in category pages', () => {
    for (const path of ['src/pages/blog/topic/[topic]/[...page].astro','src/pages/es/blog/topic/[topic]/[...page].astro']) {
      const s = readFileSync(path,'utf8');
      expect(s).toContain('!data.draft');
      expect(s).toContain('isPublished(data.pubDate)');
      expect(s).toContain('paginate(matches');
    }
  });
});
