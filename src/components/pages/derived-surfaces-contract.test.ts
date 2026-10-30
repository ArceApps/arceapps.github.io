import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
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

  it('paginas de detalle con lenguaje visual', () => {
    const files = ['src/pages/apps/[...slug].astro', 'src/pages/blog/[...slug].astro', 'src/pages/devlog/[...slug].astro', 'src/pages/projects/[...slug].astro', 'src/pages/es/apps/[...slug].astro', 'src/pages/es/blog/[...slug].astro', 'src/pages/es/devlog/[...slug].astro', 'src/pages/es/projects/[...slug].astro'];
    for (const f of files) {
      const s = readFileSync(f, 'utf8');
      expect(s).toContain('text-content-muted');
      for (const legacy of ['#007F7D', '#F8F9FA', '#111E26', '#111827', '#9CA3AF', '#2DD4BF', 'bg-white', 'text-gray-']) {
        expect(s, f + ' contiene literal legado ' + legacy).not.toContain(legacy);
      }
      expect(s).not.toContain('hover:scale');
    }
  });

  it('superficies secundarias con lenguaje visual', () => {
    const files = ['src/pages/404.astro', 'src/pages/cookies.astro', 'src/pages/privacy-policy.astro', 'src/pages/series/[slug].astro', 'src/pages/es/cookies.astro', 'src/pages/es/privacy-policy.astro', 'src/pages/es/series/[slug].astro'];
    for (const f of files) {
      const s = readFileSync(f, 'utf8');
      expect(s).toContain('text-content');
      for (const legacy of ['#007F7D', '#F8F9FA', '#111E26', '#111827', '#9CA3AF', '#2DD4BF', 'bg-white', 'text-gray-']) {
        expect(s, f + ' contiene literal legado ' + legacy).not.toContain(legacy);
      }
      expect(s).not.toContain('hover:scale');
    }
  });

  it('ProjectCard con tokens semanticos', () => {
    const s = readFileSync('src/components/ProjectCard.astro', 'utf8');
    expect(s).toContain('bg-surface-raised');
    for (const legacy of ['#111E26', '#1F333E', '#0D171F', '#16242E', 'bg-white', 'teal-']) {
      expect(s, 'literal legado ' + legacy).not.toContain(legacy);
    }
  });

  it('pliego comparativo generado', () => {
    expect(existsSync('artifacts/portfolio-visual-qa/portfolio-visual-report.md')).toBe(true);
  });
});
