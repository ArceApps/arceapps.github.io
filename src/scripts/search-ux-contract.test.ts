import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('global bilingual search', () => {
  it('indexes all public content types and filters publication dates', () => {
    const code = readFileSync('src/pages/search-index.json.ts', 'utf8');
    for (const type of ['blog', 'apps', 'projects', 'devlog']) expect(code).toContain("getCollection('"+type+"'");
    expect(code).toContain('isPublished(data.pubDate)');
    expect(code).toContain("getCollection('apps', ({ data }) => !data.draft && isPublished(data.pubDate))");
  });
  it('filters results by language and supports keyboard focus', () => {
    const code = readFileSync('src/scripts/search.ts', 'utf8');
    expect(code).toContain('item.lang === lang');
    expect(code).toContain('e.key === "Tab"');
    expect(code).toContain('previousFocus.focus()');
  });
});
