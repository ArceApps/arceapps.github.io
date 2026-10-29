import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ui } from '../../i18n/ui';

const ROOT_DIR = path.resolve(__dirname, '../../..');
const readSource = (relativePath: string) =>
  readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

const COMPONENT = 'src/components/pages/DevlogIndexPage.astro';
const DEVLOG_TWINS = [
  { path: 'src/pages/devlog/index.astro', lang: 'en' },
  { path: 'src/pages/es/devlog/index.astro', lang: 'es' },
] as const;

describe('devlog listing', () => {
  it('devlog con chips y entrada destacada', () => {
    const s = readSource(COMPONENT);

    // Chips de filtro y tarjeta destacada.
    expect(s).toContain('data-filter');
    expect(s).toContain('data-devlog-featured');
    expect(s).toContain('arrow_forward');
    expect(s).toContain("t('devlog.read_article')");
    expect(s).toContain('bg-primary');

    // La destacada es la entrada más reciente real (sin contenido inventado).
    expect(s).toContain('const featured = devlogs[0]');
    expect(s).toContain('restDevlogs');
    expect(s).toContain('body.split');
    expect(s).toContain('data-devlog-topic');
  });

  it('chips derivados de series reales con "Otros" que revela y no filtra', () => {
    const s = readSource(COMPONENT);

    // "Todos" activo y el resto inactivos.
    expect(s).toContain('aria-pressed="true"');
    expect(s).toContain('aria-pressed="false"');

    // "Otros" es el único mecanismo de revelado.
    const moreButton = s.match(/<button\b[^>]*\bdata-more-toggle\b[^>]*>[\s\S]*?<\/button>/);
    expect(moreButton, 'falta el chip "Otros"').not.toBeNull();
    const moreMarkup = moreButton![0];
    expect(moreMarkup).toContain('aria-expanded="false"');
    expect(moreMarkup).toContain('aria-controls="devlog-more-filters"');
    expect(moreMarkup).toContain("t('devlog.filter_others')");
    expect(moreMarkup, '"Otros" no debe filtrar').not.toMatch(/data-filter/);
    expect(moreMarkup, '"Otros" no debe usar aria-pressed').not.toMatch(/aria-pressed/);

    expect(s).toContain('data-more-filters');
    expect(s).not.toMatch(/<details\b/);
    expect(s).not.toMatch(/<summary\b/);

    // Los chips se derivan de series reales del contenido publicado.
    expect(s).toContain('seriesCounts');
    expect(s).toContain('getSeries');
  });

  it('los literales de color legados se migran a tokens', () => {
    const s = readSource(COMPONENT);
    expect(s).not.toMatch(/\[#(?:E5E7EB|1F333E|FFFFFF|111E26)\]/i);
    expect(s).toContain('border-border');
    expect(s).toContain('dark:border-dark-border');
    expect(s).toContain('bg-surface-raised');
    expect(s).toContain('dark:bg-dark-surface-raised');
  });

  it('ambos gemelos montan el componente con su idioma, sin literales cruzados', () => {
    for (const { path: pagePath, lang } of DEVLOG_TWINS) {
      const s = readSource(pagePath);
      expect(s, pagePath).toContain('DevlogIndexPage');
      expect(s, pagePath).toContain(`lang="${lang}"`);
    }

    // El gemelo EN no lleva copy en español y el ES no lleva copy en inglés.
    const english = readSource('src/pages/devlog/index.astro');
    for (const spanish of ['Leer artículo', 'Todos', 'Otros', 'Herramientas']) {
      expect(english, `EN no debe contener "${spanish}"`).not.toContain(spanish);
    }
    const spanish = readSource('src/pages/es/devlog/index.astro');
    for (const text of ['Read article', 'All', 'Others', 'Tools']) {
      expect(spanish, `ES no debe contener "${text}"`).not.toContain(text);
    }
  });

  it('copy localizado del devlog con paridad ES/EN', () => {
    const requiredKeys = [
      'devlog.heading',
      'devlog.intro',
      'devlog.filter_all',
      'devlog.filter_others',
      'devlog.filter_aria',
      'devlog.read_article',
      'devlog.reading_time',
      'devlog.series_coucou',
      'devlog.series_radiohub',
      'devlog.series_puzzlehub',
      'devlog.series_tools',
    ] as const;

    for (const key of requiredKeys) {
      expect(ui.en[key], `Falta ${key} en inglés`).toBeTruthy();
      expect(ui.es[key], `Falta ${key} en español`).toBeTruthy();
    }

    expect(ui.en['devlog.heading']).toBe('Devlog');
    expect(ui.es['devlog.heading']).toBe('Devlog');
    expect(ui.en['devlog.read_article']).toBe('Read article');
    expect(ui.es['devlog.read_article']).toBe('Leer artículo');
    expect(ui.en['devlog.filter_all']).toBe('All');
    expect(ui.es['devlog.filter_all']).toBe('Todos');
    expect(ui.en['devlog.filter_others']).toBe('Others');
    expect(ui.es['devlog.filter_others']).toBe('Otros');
    expect(ui.en['devlog.series_tools']).toBe('Tools');
    expect(ui.es['devlog.series_tools']).toBe('Herramientas');
  });
});
