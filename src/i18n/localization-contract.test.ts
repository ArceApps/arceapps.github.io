import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ui } from './ui';

const ROOT_DIR = path.resolve(__dirname, '../..');

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

const requiredKeys = [
  'nav.theme',
  'nav.menu',
  'apps.updated',
  'apps.live_demo',
  'apps.code',
  'apps.no_image',
  'apps.gallery',
  'apps.gallery_aria',
  'apps.screenshot_alt',
  'blog.table_of_contents',
  'blog.reading_time',
  'blog.related',
  'blog.back_to_blog',
] as const;

describe('contrato de localización de UI', () => {
  it('declara las mismas claves de UI en inglés y español', () => {
    for (const key of requiredKeys) {
      expect(ui.en[key], `Falta ${key} en inglés`).toBeTruthy();
      expect(ui.es[key], `Falta ${key} en español`).toBeTruthy();
    }

    expect(ui.en['apps.live_demo']).not.toBe(ui.es['apps.live_demo']);
    expect(ui.en['apps.gallery']).not.toBe(ui.es['apps.gallery']);
    expect(ui.en['blog.table_of_contents']).not.toBe(ui.es['blog.table_of_contents']);
  });

  it('las páginas dinámicas usan el idioma de su ruta', () => {
    const englishApp = readSource('src/pages/apps/[...slug].astro');
    const spanishApp = readSource('src/pages/es/apps/[...slug].astro');
    const englishBlog = readSource('src/pages/blog/[...slug].astro');
    const spanishBlog = readSource('src/pages/es/blog/[...slug].astro');

    expect(englishApp).toContain("useTranslations('en')");
    expect(spanishApp).toContain("useTranslations('es')");
    expect(englishBlog).toContain("useTranslations('en')");
    expect(spanishBlog).toContain("useTranslations('es')");
  });

  it('no deja textos de UI objetivo hardcodeados en las rutas dinámicas', () => {
    const englishApp = readSource('src/pages/apps/[...slug].astro');
    const spanishApp = readSource('src/pages/es/apps/[...slug].astro');
    const englishBlog = readSource('src/pages/blog/[...slug].astro');
    const spanishBlog = readSource('src/pages/es/blog/[...slug].astro');

    expect(englishApp).not.toContain('Live Demo');
    expect(englishApp).not.toContain('No Image Available');
    expect(spanishApp).not.toContain('Live Demo');
    expect(spanishApp).not.toContain('No Image Available');
    expect(englishBlog).not.toContain('Table of Contents');
    expect(spanishBlog).not.toContain('Índice de contenidos');
  });
});
