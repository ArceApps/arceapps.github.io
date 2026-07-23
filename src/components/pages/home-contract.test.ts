import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ui } from '../../i18n/ui';

const ROOT_DIR = path.resolve(__dirname, '../../..');

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

describe('contrato editorial de portada', () => {
  it('usa un hero editorial sin mockup ni métricas inventadas', () => {
    const hero = readSource('src/components/Hero.astro');

    expect(hero).not.toContain('phone-mockup');
    expect(hero).not.toContain('phone-body');
    expect(hero).not.toContain('60 FPS');
    expect(hero).not.toContain('12:00');
    expect(hero).not.toContain('ArceApps Hub');
    expect(hero).not.toContain('Rendimiento (Kotlin)');
    expect(hero).not.toContain('blur-3xl');
    expect(hero).not.toContain('bg-gradient');
    expect(hero).toContain("t('home.hero.eyebrow')");
    expect(hero).toContain("t('home.hero.prefix')");
    expect(hero).toContain("t('home.hero.note')");
  });

  it('mantiene contenido real, anchors públicos y composición por superficies', () => {
    const home = readSource('src/components/pages/HomePage.astro');

    expect(home).toContain('latestDevlog.data.title');
    expect(home).toContain('<Card variant="feature"');
    expect(home).toContain('href={`${linkPrefix}/devlog/${devlogSlug}`}');
    expect(home).toContain('id="apps"');
    expect(home).toContain('apps.map');
    expect(home).toContain('<ProjectCard');
    expect(home).not.toContain('spatial-card');
    expect(home).not.toContain('radial-gradient');
    expect(home).not.toContain('Bento');
  });

  it('declara el copy editorial del hero en ambos idiomas', () => {
    const heroKeys = ['home.hero.eyebrow', 'home.hero.prefix', 'home.hero.note'] as const;

    for (const key of heroKeys) {
      expect(ui.en[key], `Falta ${key} en inglés`).toBeTruthy();
      expect(ui.es[key], `Falta ${key} en español`).toBeTruthy();
    }
  });
});
