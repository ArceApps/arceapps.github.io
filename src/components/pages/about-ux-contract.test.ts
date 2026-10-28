import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const about = readFileSync('src/components/pages/AboutPage.astro', 'utf8');
const translations = readFileSync('src/i18n/ui.ts', 'utf8');

describe('ArceApps project-focused About page', () => {
  it('highlights real public content and navigation instead of professional biography', () => {
    for (const type of ['apps', 'blog', 'projects']) {
      expect(about).toContain(`getCollection('${type}'`);
    }
    for (const path of ['/apps', '/projects', '/blog', '/devlog']) {
      expect(about).toContain(path);
    }
    expect(about).not.toContain('const experience');
    expect(about).not.toContain('experience.map');
    expect(about).not.toContain('type="profile"');
    expect(about).toContain('type="website"');
    expect(about).toContain('href={area.href}');
    expect(about).not.toContain('const sections =');
  });

  it('supports ES/EN and both light/dark themes', () => {
    expect(about).toContain("const es = lang === 'es'");
    expect(about).toContain('dark:bg-dark-surface');
    expect(translations).toContain("'nav.about': 'About'");
    expect(translations).toContain("'nav.about': 'Sobre ArceApps'");
  });
});
