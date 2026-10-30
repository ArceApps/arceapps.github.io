import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('derived surfaces', () => {
  it('footer con atribucion de fotos stock', () => {
    const s = readFileSync('src/components/Footer.astro', 'utf8');
    expect(s).toContain('Unsplash');
    expect(s).toContain('6D6omiCxHWM');
    expect(s).toContain('3no88nSvK88');
  });

  it('proyectos y contacto con lenguaje visual', () => {
    const legacyLiterals = [
      '#007F7D',
      '#F8F9FA',
      '#111E26',
      '#111827',
      '#9CA3AF',
      '#2DD4BF',
      'bg-white',
      'text-gray-',
      'hover:scale',
    ];

    for (const f of ['src/pages/projects.astro', 'src/pages/contact.astro', 'src/pages/es/projects.astro', 'src/pages/es/contact.astro']) {
      const s = readFileSync(f, 'utf8');
      expect(s).toContain('material-card');
      expect(s).toContain('text-content-muted');
      for (const literal of legacyLiterals) {
        expect(s, `${f} no debe contener el literal legado "${literal}"`).not.toContain(literal);
      }
    }
  });
});
