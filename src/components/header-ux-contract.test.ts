import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('navigation at tablet widths', () => {
  it('uses mobile navigation until there is enough room for all links', () => {
    const s = readFileSync('src/components/Header.astro','utf8');
    expect(s).toContain('hidden xl:flex');
    expect(s).toContain('xl:hidden');
    expect(s).toContain('aria-expanded="false"');
  });
});
