import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('navigation at tablet widths', () => {
  it('uses mobile navigation until there is enough room for all links', () => {
    const s = readFileSync('src/components/Header.astro','utf8');
    expect(s).toContain('hidden xl:flex');
    expect(s).toContain('xl:hidden');
    expect(s).toContain('aria-expanded="false"');
  });

  it('nav de 7 items con Sobre mi', () => {
    const s = readFileSync('src/components/Header.astro','utf8');
    expect(s).toContain("'nav.about'");
    const ui = readFileSync('src/i18n/ui.ts','utf8');
    expect(ui).toContain("'nav.about': 'Sobre mí'");
    expect(ui).toContain("'nav.about': 'About me'");
  });
});
