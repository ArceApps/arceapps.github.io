import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '../..');

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

const detailFiles = [
  'src/pages/blog/[...slug].astro',
  'src/pages/es/blog/[...slug].astro',
] as const;

describe('contrato editorial del detalle de artículo', () => {
  it('separa encabezado, hero, TOC y columna de lectura sin un main anidado', () => {
    for (const file of detailFiles) {
      const source = readSource(file);

      expect(source, `${file} debe declarar el layout editorial`).toContain('article-detail');
      expect(source).toContain('article-hero');
      expect(source).toContain('article-reading-layout');
      expect(source).toContain('article-reading-column');
      expect(source).toContain('article-prose');
      expect(source).toContain('data-article-progress');
      expect(source).toContain('Breadcrumbs');
      expect(source).toContain('SocialShare');
      expect(source).toContain('PostNavigation');
      expect(source).toContain('tocHeadings');
      expect(source).toContain('href={`#${heading.slug}`}');
      expect(source).not.toContain('<main>');
    }
  });

  it('mantiene los controles localizados en ambas rutas', () => {
    const english = readSource(detailFiles[0]);
    const spanish = readSource(detailFiles[1]);
    const socialShare = readSource('src/components/SocialShare.astro');

    expect(english).toContain('useTranslations(\'en\')');
    expect(spanish).toContain('useTranslations(\'es\')');
    expect(english).toContain('SocialShare url={Astro.url.href} title={post.data.title} lang="en"');
    expect(spanish).toContain('SocialShare url={Astro.url.href} title={post.data.title} lang="es"');
    expect(english).toContain('PostNavigation prevPost={prevPost} nextPost={nextPost} lang="en"');
    expect(spanish).toContain('PostNavigation prevPost={prevPost} nextPost={nextPost} lang="es"');
    expect(english).toContain("href=\"/blog\"");
    expect(spanish).toContain("href=\"/es/blog\"");
    expect(socialShare).toContain("const shareOnLabel = lang === 'es' ? 'Compartir en' : 'Share on';");
    expect(socialShare).toContain('aria-label={`${shareOnLabel} ${link.name}`}');
  });

  it('permite medios editoriales mayores de 500px sin desbordar', () => {
    const styles = readSource('src/styles/global.css');

    expect(styles).toContain('.article-prose :where(img, video, iframe)');
    expect(styles).toContain('max-inline-size: 100%;');
    expect(styles).toContain('.article-prose table');
    expect(styles).toContain('overflow-x: auto;');
    expect(styles).not.toContain('max-inline-size: min(100%, 500px)');
  });
});
