import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { ui } from '../../i18n/ui';

const notFoundKeys = [
  '404.title',
  '404.heading',
  '404.description',
  '404.back_home',
  '404.read_blog',
  '404.helpful',
  '404.about',
  '404.contact',
] as const;

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
    const files = ['src/pages/404.astro', 'src/pages/cookies.astro', 'src/pages/privacy-policy.astro', 'src/pages/series/[slug].astro', 'src/pages/es/404.astro', 'src/pages/es/cookies.astro', 'src/pages/es/privacy-policy.astro', 'src/pages/es/series/[slug].astro'];
    for (const f of files) {
      const s = readFileSync(f, 'utf8');
      expect(s).toContain('text-content');
      for (const legacy of ['#007F7D', '#F8F9FA', '#111E26', '#111827', '#9CA3AF', '#2DD4BF', 'bg-white', 'text-gray-']) {
        expect(s, f + ' contiene literal legado ' + legacy).not.toContain(legacy);
      }
      expect(s).not.toContain('hover:scale');
    }
  });

  it('404 localizado ES/EN con claves i18n', () => {
    const files = [
      ['src/pages/404.astro', "useTranslations('en')"],
      ['src/pages/es/404.astro', "useTranslations('es')"],
    ] as const;

    for (const [f, hook] of files) {
      const s = readFileSync(f, 'utf8');
      expect(s, f + ' debe usar ' + hook).toContain(hook);
      for (const key of notFoundKeys) {
        expect(s, f + ' debe consumir la clave ' + key).toContain(`t('${key}')`);
      }
    }

    const en = readFileSync('src/pages/404.astro', 'utf8');
    for (const literal of ['Página no encontrada', '¡Bug detectado!', 'Volver al Inicio', 'Leer el Blog', 'Quizás buscabas', 'garbage collector o nunca existió']) {
      expect(en, '404 EN no debe contener el literal ES "' + literal + '"').not.toContain(literal);
    }

    for (const key of notFoundKeys) {
      expect(ui.en[key], 'Falta ' + key + ' en inglés').toBeTruthy();
      expect(ui.es[key], 'Falta ' + key + ' en español').toBeTruthy();
      expect(ui.en[key], key + ' debe estar traducida').not.toBe(ui.es[key]);
    }
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.es).sort());
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
