import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '../..');

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

const detailFiles = [
  'src/pages/apps/[...slug].astro',
  'src/pages/es/apps/[...slug].astro',
] as const;

describe('contrato editorial del detalle de app', () => {
  it('usa una composición estable sin efectos decorativos ni rotación obligatoria', () => {
    for (const file of detailFiles) {
      const source = readSource(file);

      expect(source, `${file} no debe depender de gradientes`).not.toContain('bg-gradient');
      expect(source, `${file} no debe depender de blur decorativo`).not.toMatch(/blur-\[/);
      expect(source, `${file} no debe rotar el hero`).not.toContain('rotate-y-12');
      expect(source).toContain('bg-surface-raised');
      expect(source).toContain('border-border');
      expect(source).toContain('motion-reduce');
      expect(source).toContain('prose-lg break-words');
      expect(source).toContain('aspect-[2/1]');
      expect(source).toContain('class="h-full w-full object-contain"');
      expect(source).not.toContain('lg:order-');
      expect(source).not.toContain('<main>');
      expect(source).not.toContain('</main>');
    }
  });

  it('mantiene la jerarquía de propuesta, CTA primaria y CTAs secundarios', () => {
    for (const file of detailFiles) {
      const source = readSource(file);
      const descriptionIndex = source.indexOf('app.data.description');
      const heroIndex = source.indexOf('app.data.heroImage');
      const metadataIndex = source.indexOf('{app.data.rating}');
      const tagsIndex = source.indexOf('app.data.tags');
      const googlePlayIndex = source.indexOf('href={app.data.googlePlayUrl}');
      const demoIndex = source.indexOf('href={app.data.demoUrl}');
      const repoIndex = source.indexOf('href={app.data.repoUrl}');

      expect(descriptionIndex, `${file} debe mostrar la propuesta`).toBeGreaterThan(-1);
      expect(heroIndex, `${file} debe mostrar hero o fallback`).toBeGreaterThan(descriptionIndex);
      expect(googlePlayIndex).toBeGreaterThan(heroIndex);
      expect(metadataIndex, `${file} debe conservar metadatos`).toBeGreaterThan(googlePlayIndex);
      expect(tagsIndex, `${file} debe conservar tags`).toBeGreaterThan(googlePlayIndex);
      expect(googlePlayIndex, `${file} debe conservar Google Play`).toBeGreaterThan(descriptionIndex);
      expect(demoIndex === -1 || googlePlayIndex < demoIndex).toBe(true);
      expect(repoIndex === -1 || googlePlayIndex < repoIndex).toBe(true);
    }
  });

  it('conserva accesibilidad, galería y enlaces localizados', () => {
    const english = readSource(detailFiles[0]);
    const spanish = readSource(detailFiles[1]);

    for (const source of [english, spanish]) {
      expect(source).toContain('aria-label={t(\'apps.gallery_aria\')}');
      expect(source).toContain('alt={`${t(\'apps.screenshot_alt\')} ${index + 1}`}');
      expect(source).toContain('focus-visible:');
    }

    expect(english).toContain('href="/apps"');
    expect(spanish).toContain('href="/es/apps"');
    expect(english).toContain("useTranslations('en')");
    expect(spanish).toContain("useTranslations('es')");
  });
});
