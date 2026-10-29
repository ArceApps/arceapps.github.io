import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ui } from '../../i18n/ui';

const ROOT_DIR = path.resolve(__dirname, '../../..');
const readSource = (relativePath: string) =>
  readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

const BLOG_PAGES = [
  { path: 'src/pages/blog/[...page].astro', lang: 'en' },
  { path: 'src/pages/es/blog/[...page].astro', lang: 'es' },
] as const;

describe('blog listing', () => {
  it('buscador y chips de tags del blog', () => {
    for (const { path: pagePath, lang } of BLOG_PAGES) {
      const s = readSource(pagePath);
      expect(s, pagePath).toContain('Search.astro');
      expect(s, pagePath).toContain('data-filter');
      expect(s, pagePath).toContain('aria-pressed="true"');
      expect(s, pagePath).toContain('aria-pressed="false"');
      expect(s, pagePath).toContain('data-blog-card');
      expect(s, pagePath).toContain('data-tags');
      expect(s, pagePath).toContain("t('blog.title')");
      expect(s, pagePath).toContain("t('blog.filter_more')");
      expect(s, pagePath).toContain(`useTranslations('${lang}')`);
      expect(s, pagePath).not.toMatch(/lang\s*===\s*'es'/);
    }
  });

  it('chip "Más +" revela los tags ocultos, alterna aria-expanded y no filtra', () => {
    for (const { path: pagePath } of BLOG_PAGES) {
      const s = readSource(pagePath);

      // El chip "Más +" existe en ambos gemelos, al final de la fila de chips.
      const moreButton = s.match(/<button\b[^>]*\bdata-more-toggle\b[^>]*>[\s\S]*?<\/button>/);
      expect(moreButton, `${pagePath}: falta el chip "Más +"`).not.toBeNull();
      const moreMarkup = moreButton![0];
      expect(moreMarkup, `${pagePath}: "Más +" debe arrancar plegado`).toContain('aria-expanded="false"');
      expect(moreMarkup, `${pagePath}: "Más +" debe referenciar la fila que revela`).toContain('aria-controls="blog-more-tags"');
      expect(moreMarkup, `${pagePath}: "Más +" conserva la etiqueta traducida`).toContain("t('blog.filter_more')");

      // El chip "Más +" NO comparte el mecanismo de data-filter de los chips de tag.
      expect(moreMarkup, `${pagePath}: "Más +" no debe llevar data-filter`).not.toMatch(/data-filter/);
      expect(moreMarkup, `${pagePath}: "Más +" no debe usar aria-pressed`).not.toMatch(/aria-pressed/);
      expect(s, `${pagePath}: no debe existir el filtro roto data-filter="more"`).not.toMatch(/data-filter=["']more["']/);

      // Vive dentro de la fila de chips, no en un bloque aparte.
      const chipsNav = s.match(/<nav\b[^>]*\bdata-blog-chips\b[\s\S]*?<\/nav>/);
      expect(chipsNav, `${pagePath}: falta el nav de chips`).not.toBeNull();
      expect(chipsNav![0], `${pagePath}: "Más +" debe ir al final de la fila de chips`).toContain('data-more-toggle');

      // Existe la fila extra de chips ocultos que el chip revela, y sus chips sí filtran.
      expect(s).toMatch(/<div\b[^>]*\bid="blog-more-tags"[^>]*\bdata-more-tags\b[^>]*\shidden\b/);
      const moreRow = s.match(/<div\b[^>]*\bdata-more-tags\b[\s\S]*?<\/div>/);
      expect(moreRow, `${pagePath}: falta la fila de tags ocultos`).not.toBeNull();
      expect(moreRow![0], `${pagePath}: los chips revelados deben filtrar`).toContain('data-filter=');

      // El script escucha los chips de ambas filas y deja al toggle fuera de la colección de filtros.
      const chipsSelector = s.match(/querySelectorAll<HTMLButtonElement>\('([^']+)'\)/);
      expect(chipsSelector, `${pagePath}: falta la colección de chips`).not.toBeNull();
      expect(chipsSelector![1]).toContain('[data-filter]');
      expect(chipsSelector![1], `${pagePath}: "Más +" no debe entrar en la colección de filtros`).not.toContain('data-more-toggle');

      // El handler del toggle solo alterna estado y visibilidad; no aplica filtros.
      const toggleHandler = s.match(/moreToggle\.addEventListener\('click',[\s\S]*?\n\s*\}\);/);
      expect(toggleHandler, `${pagePath}: falta el handler de "Más +"`).not.toBeNull();
      expect(toggleHandler![0]).toContain("moreToggle.getAttribute('aria-expanded')");
      expect(toggleHandler![0]).toContain('moreToggle.setAttribute(');
      expect(toggleHandler![0]).toContain('moreTags.hidden');
      expect(toggleHandler![0], `${pagePath}: "Más +" no debe aplicar filtros`).not.toMatch(/\bapply\(/);

      // Un solo mecanismo de revelado: ni <details> ni <summary> duplican el de "Más +".
      expect(s, `${pagePath}: el <details> duplica el revelado de "Más +"`).not.toMatch(/<details\b/);
      expect(s, `${pagePath}: el <summary> duplica el revelado de "Más +"`).not.toMatch(/<summary\b/);
    }
  });

  it('no deja topicCounts muerto en el listado', () => {
    for (const { path: pagePath } of BLOG_PAGES) {
      const s = readSource(pagePath);
      expect(s, `${pagePath}: topicCounts no debe seguir declarado`).not.toContain('topicCounts');
    }
  });

  it('filas editoriales del blog con meta', () => {
    const s = readFileSync('src/components/BlogCard.astro', 'utf8');
    expect(s).toContain('min');
    expect(s).toContain('heroImage');
    expect(s).toContain('aspect-video');
    expect(s).toContain('sm:w-48');
    expect(s).toContain('text-content-muted');
    expect(s).toContain('<time');
  });

  it('copy localizado de blog con paridad ES/EN', () => {
    for (const key of ['blog.title', 'blog.filter_all', 'blog.filter_more', 'blog.filter_aria', 'blog.search_placeholder'] as const) {
      expect(ui.en[key], `Falta ${key} en ingles`).toBeTruthy();
      expect(ui.es[key], `Falta ${key} en espanol`).toBeTruthy();
      expect(ui.en[key], `${key} debe estar traducido`).not.toBe(ui.es[key]);
    }
    expect(ui.en['blog.title']).toBe('Technical articles and guides');
    expect(ui.es['blog.title']).toBe('Artículos técnicos y guías');
    expect(ui.en['blog.filter_more']).toBe('More +');
    expect(ui.es['blog.filter_more']).toBe('Más +');
    expect(ui.en['blog.filter_all']).toBe('All');
    expect(ui.es['blog.filter_all']).toBe('Todas');
  });
});
