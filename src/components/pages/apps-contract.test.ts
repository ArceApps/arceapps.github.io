import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ui } from '../../i18n/ui';

const ROOT_DIR = path.resolve(__dirname, '../../..');

const readSource = (relativePath: string) =>
  readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

const APP_PAGES = [
  { path: 'src/pages/apps/index.astro', lang: 'en' },
  { path: 'src/pages/es/apps/index.astro', lang: 'es' },
] as const;

describe('apps listing', () => {
  it('chips de categoria de aplicaciones', () => {
    for (const { path: pagePath, lang } of APP_PAGES) {
      const s = readSource(pagePath);

      // El patron de chips es identico en ambos idiomas.
      expect(s, pagePath).toContain('data-filter');
      expect(s, pagePath).toContain('data-apps-chips');
      expect(s, pagePath).toContain("t('apps.filter_all')");
      expect(s, pagePath).toContain("t('apps.filter_aria')");
      expect(s, pagePath).toContain("t('apps.list_title')");
      expect(s, pagePath).toContain("t('apps.list_subtitle')");

      // Cada pagina usa su propio idioma, sin literales incrustados.
      expect(s, pagePath).toContain(`useTranslations('${lang}')`);
      expect(s, pagePath).not.toMatch(/lang\s*===\s*'es'/);
      expect(s, pagePath).not.toMatch(/const\s+lang\s*=/);

      // Sin residuo muerto: el filtrado usa data-tags, no data-app-category.
      expect(s, pagePath).toContain('data-app-card');
      expect(s, pagePath).toContain('data-tags');
      expect(s, pagePath).not.toContain('data-app-category');
      expect(s, pagePath).not.toContain('filterClasses');
    }
  });

  it('los chips de categoria se derivan de los tags reales de las apps', () => {
    for (const { path: pagePath } of APP_PAGES) {
      const s = readSource(pagePath);

      // D6: sin categorias inventadas; los chips salen de los tags publicados.
      expect(s, pagePath).toContain('data-filter={chip.filter}');
      expect(s, pagePath).toContain('data-app-card');
      expect(s, pagePath).toContain('data-tags');

      // Accesibilidad del patron de chips.
      expect(s, pagePath).toContain('aria-pressed="true"');
      expect(s, pagePath).toContain('aria-pressed="false"');
      expect(s, pagePath).toContain('focus-visible:ring-2');
    }
  });

  it('la intro de aplicaciones tiene h1 y subtitulo', () => {
    for (const { path: pagePath } of APP_PAGES) {
      const s = readSource(pagePath);

      expect(s, pagePath).toContain("t('apps.list_title')");
      expect(s, pagePath).toContain("t('apps.list_subtitle')");
      expect(s, pagePath).toContain('PageIntro');
    }
  });

  it('el copy de apps esta en ambos idiomas', () => {
    const requiredKeys = [
      'apps.list_title',
      'apps.list_subtitle',
      'apps.filter_all',
      'apps.filter_aria',
    ] as const;

    for (const key of requiredKeys) {
      expect(ui.en[key], `Falta ${key} en ingles`).toBeTruthy();
      expect(ui.es[key], `Falta ${key} en espanol`).toBeTruthy();
      expect(ui.en[key], `${key} debe estar traducido`).not.toBe(ui.es[key]);
    }

    expect(ui.es['apps.list_title']).toBe('Aplicaciones Android');
    expect(ui.es['apps.filter_all']).toBe('Todas');
    expect(ui.en['apps.list_title']).toBe('Android Applications');
    expect(ui.en['apps.filter_all']).toBe('All');
  });
});
