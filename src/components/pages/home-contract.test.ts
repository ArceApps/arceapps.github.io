import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ui } from '../../i18n/ui';

const ROOT_DIR = path.resolve(__dirname, '../../..');

const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

describe('contrato editorial de portada', () => {
  it('el hero es editorial: marca gigante, manifiesto y sin Bento', () => {
    const hero = readSource('src/components/home/HomeHero.astro');

    expect(hero).toContain('ArceApps');
    expect(hero).toContain("t('home.manifesto')");
    expect(hero).not.toContain('Bento');
    expect(hero).not.toContain('bg-gradient');
    expect(hero).not.toContain('animate-bounce');
    expect(hero).toContain('keyboard_arrow_down');
  });

  it('la home compone las cuatro secciones numeradas en orden editorial', () => {
    const home = readSource('src/components/pages/HomePage.astro');

    const devlog = home.indexOf('<HomeDevlog');
    const blog = home.indexOf('<HomeBlog');
    const work = home.indexOf('<HomeFeaturedWork');
    const cta = home.indexOf('<HomeCta');

    expect(devlog).toBeGreaterThan(-1);
    expect(blog).toBeGreaterThan(devlog);
    expect(work).toBeGreaterThan(blog);
    expect(cta).toBeGreaterThan(work);

    expect(home).not.toContain('Bento');
    expect(home).not.toContain('home.tech_articles');
    expect(home).toContain('useTranslations');
  });

  it('las secciones usan la cabecera numerada compartida', () => {
    const sectionNames = [
      'HomeDevlog',
      'HomeBlog',
      'HomeFeaturedWork',
      'HomeCta',
    ] as const;

    for (const name of sectionNames) {
      const source = readSource(`src/components/home/${name}.astro`);

      expect(source, `${name} debe usar HomeSectionHeader`).toContain(
        'HomeSectionHeader',
      );
      expect(source, `${name} debe pasar prop number=`).toMatch(/number=/);
    }

    const header = readSource('src/components/home/HomeSectionHeader.astro');
    expect(header).toContain('aria-hidden');
    expect(header).toContain('number');
  });

  it('declara el copy editorial nuevo en ambos idiomas', () => {
    const requiredKeys = [
      'home.manifesto',
      'home.scroll_hint',
      'home.work.title',
      'home.work.cta',
      'home.devlog.all',
    ] as const;

    for (const key of requiredKeys) {
      expect(ui.en[key], `Falta ${key} en inglés`).toBeTruthy();
      expect(ui.es[key], `Falta ${key} en español`).toBeTruthy();
    }
  });
});
