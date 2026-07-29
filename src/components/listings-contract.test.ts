import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ui } from '../i18n/ui';

const ROOT_DIR = path.resolve(__dirname, '../..');

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

const listingFiles = [
  'src/pages/apps/index.astro',
  'src/pages/es/apps/index.astro',
  'src/pages/blog/[...page].astro',
  'src/pages/es/blog/[...page].astro',
] as const;

describe('contrato de listados visuales', () => {
  it('usa PageIntro y la retícula común en Apps y Blog EN/ES', () => {
    for (const file of listingFiles) {
      const source = readSource(file);

      expect(source, `${file} debe importar PageIntro`).toContain('PageIntro');
      expect(source, `${file} debe renderizar PageIntro`).toMatch(/<PageIntro[\s\S]*title=/);
      expect(source, `${file} debe conservar la retícula responsive`).toMatch(
        /grid-cols-1[\s\S]*md:grid-cols-2[\s\S]*lg:grid-cols-3/
      );
    }
  });

  it('mantiene las fuentes de datos y el idioma de cada ruta', () => {
    expect(readSource('src/pages/apps/index.astro')).toContain('id.startsWith(\'en/\')');
    expect(readSource('src/pages/es/apps/index.astro')).toContain('id.startsWith(\'es/\')');
    expect(readSource('src/pages/blog/[...page].astro')).toContain('id.startsWith(\'en/\')');
    expect(readSource('src/pages/es/blog/[...page].astro')).toContain('id.startsWith(\'es/\')');
    expect(readSource('src/components/pages/DevlogIndexPage.astro')).toContain('id.startsWith(`${lang}/`)');
  });

  it('declara estados, paginación y filtros equivalentes en ambos idiomas', () => {
    const requiredKeys = [
      'apps.empty',
      'blog.empty',
      'blog.filter_tags',
      'blog.previous',
      'blog.next',
      'blog.tag_title',
      'blog.tag_count_one',
      'blog.tag_count_many',
      'blog.tag_empty',
      'devlog.empty',
    ] as const;

    for (const key of requiredKeys) {
      expect(ui.en[key], `Falta ${key} en inglés`).toBeTruthy();
      expect(ui.es[key], `Falta ${key} en español`).toBeTruthy();
    }
  });

  it('expone el listado de Projects en ambos idiomas con el mismo contrato visual', () => {
    const projectFiles = ['src/pages/projects.astro', 'src/pages/es/projects.astro'];

    for (const file of projectFiles) {
      const source = readSource(file);
      expect(source).toContain('getCollection("projects"');
      expect(source).toContain('PageIntro');
      expect(source).toContain('<ProjectCard');
      expect(source).toMatch(/grid-cols-1[\s\S]*md:grid-cols-2[\s\S]*lg:grid-cols-3/);
    }
  });

  it('conserva los prefijos localizados en enlaces de etiquetas y retorno', () => {
    const spanishBlog = readSource('src/pages/es/blog/[...page].astro');
    const spanishTag = readSource('src/pages/es/blog/tag/[tag].astro');

    expect(spanishBlog).toContain('`/es/blog/tag/${slugify(tag)}/`');
    expect(spanishTag).toContain('href="/es/blog"');
  });
});
