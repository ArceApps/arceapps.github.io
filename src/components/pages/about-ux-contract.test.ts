import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const about = readFileSync('src/components/pages/AboutPage.astro', 'utf8');
const translations = readFileSync('src/i18n/ui.ts', 'utf8');

type Locale = 'en' | 'es';

// Aísla el bloque de cada idioma para verificar que la clave existe y tiene el
// texto correcto en su rama, sin que un idioma tape al otro.
const localeBlock = (locale: Locale) => {
  const start = translations.indexOf(`\n  ${locale}: {`);
  expect(start, `missing ${locale} locale block`).toBeGreaterThan(-1);
  const end = translations.indexOf('\n  },', start);
  expect(end, `unterminated ${locale} locale block`).toBeGreaterThan(start);
  return translations.slice(start, end);
};

const enBlock = localeBlock('en');
const esBlock = localeBlock('es');

const translationValue = (block: string, key: string) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = block.match(new RegExp(`'${escaped}':\\s*'((?:[^'\\\\]|\\\\.)*)'`));
  return match?.[1];
};

const ABOUT_I18N_KEYS = [
  'about.work.title',
  'about.work.android.title',
  'about.work.android.subtitle',
  'about.work.ai.title',
  'about.work.ai.subtitle',
  'about.work.software.title',
  'about.work.software.subtitle',
  'about.work.content.title',
  'about.work.content.subtitle',
  'about.cta.title',
  'about.cta.subtitle',
  'about.cta.button',
] as const;

// Copias que vivían duplicadas en la rama ES del componente. Ahora deben salir
// sólo de las traducciones y no aparecer como literales en el .astro.
const ES_COPY = [
  'En qué trabajo',
  'Desarrollo Android',
  'Apps nativas con Kotlin y Jetpack Compose.',
  'Inteligencia artificial',
  'Agentes, automatización y herramientas prácticas.',
  'Proyectos de software',
  'Herramientas, librerías y experimentos.',
  'Contenido técnico',
  'Blog, devlog y guías prácticas.',
  '¿Hablamos?',
  'Si quieres comentar un proyecto, hacer una sugerencia o simplemente saludar, estaré encantado de leerte.',
  'Contactar',
];

const EN_COPY = [
  'What I work on',
  'Android development',
  'Native apps with Kotlin and Jetpack Compose.',
  'Artificial intelligence',
  'Agents, automation, and practical tools.',
  'Software projects',
  'Tools, libraries, and experiments.',
  'Technical content',
  'Blog, devlog, and practical guides.',
  'Let’s talk?',
];

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
    expect(translations).toContain("'nav.about': 'About me'");
    expect(translations).toContain("'nav.about': 'Sobre mí'");
  });

  it('sobre mi con foto y stats dinamicos', () => {
    const s = readFileSync('src/components/pages/AboutPage.astro', 'utf8');
    expect(s).toContain('Hola, soy ArceApps');
    expect(s).toContain('about-mountains');
    expect(s).toContain('Apps publicadas');
  });

  it('bloque en que trabajo y cta contactar', () => {
    const s = readFileSync('src/components/pages/AboutPage.astro', 'utf8');

    // 4 areas con iconos Material y cuadrado tintado al 10%.
    expect(s).toContain('id="about-work"');
    expect(s).toContain("t('about.work.title')");
    for (const icon of ['smartphone', 'psychology', 'code', 'menu_book']) {
      expect(s).toContain(icon);
    }
    for (const color of ['#059669', '#F97316', '#038C8E', '#E11D48']) {
      expect(s).toContain(color);
    }

    // CTA "¿Hablamos?" con boton primario que enlaza a Contacto.
    expect(s).toContain('id="about-cta"');
    expect(s).toContain("t('about.cta.title')");
    expect(s).toContain("t('about.cta.button')");
    expect(s).toContain('bg-primary');
    expect(s).toContain('href={contactHref}');
    expect(s).toContain("lang === 'es' ? '/es/contact' : '/contact'");
  });

  it('consume cada clave i18n del bloque desde el componente', () => {
    for (const key of ABOUT_I18N_KEYS) {
      expect(about.split(`t('${key}')`).length - 1, `${key} should be consumed once`).toBe(1);
    }
  });

  it('define cada clave en la rama ES y en la rama EN', () => {
    for (const key of ABOUT_I18N_KEYS) {
      expect(translationValue(esBlock, key), `ES ${key}`).toBeTruthy();
      expect(translationValue(enBlock, key), `EN ${key}`).toBeTruthy();
    }
  });

  it('no deja traducciones muertas duplicadas como literales en el componente', () => {
    // Los comentarios no se renderizan: se valida el markup real.
    const markup = about.replace(/<!--[\s\S]*?-->/g, '');
    for (const copy of [...ES_COPY, ...EN_COPY]) {
      expect(markup).not.toContain(copy);
    }
    // Las ramas ES/EN deben resolver copy por t(), no con literales condicionales.
    expect(markup).not.toMatch(/es \?\s*'[^']*'\s*:\s*t\('about\.(work|cta)\./);
    expect(markup).not.toMatch(/es \?\s*t\('about\.(work|cta)\.[^)]*\)\s*:\s*'/);
  });

  it('renderiza cada idioma con su texto correcto', () => {
    expect(translationValue(esBlock, 'about.work.title')).toBe('En qué trabajo');
    expect(translationValue(enBlock, 'about.work.title')).toBe('What I work on');
    expect(translationValue(esBlock, 'about.cta.title')).toBe('¿Hablamos?');
    expect(translationValue(enBlock, 'about.cta.title')).toBe('Let’s talk?');
    expect(translationValue(esBlock, 'about.cta.button')).toBe('Contactar');
    expect(translationValue(enBlock, 'about.cta.button')).toBe('Contact');
  });

  it('restaura la jerarquía semántica de encabezados', () => {
    const levels = [...about.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));

    // Un único h1 y sin saltos de nivel al bajar en el documento.
    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    expect(levels[0]).toBe(1);
    let previous = levels[0];
    for (const level of levels.slice(1)) {
      expect(level - previous, `heading jump from h${previous} to h${level}`).toBeLessThanOrEqual(1);
      previous = level;
    }

    const workSection = about.slice(
      about.indexOf('id="about-work"'),
      about.indexOf('id="about-cta"')
    );
    expect(workSection).toContain("t('about.work.title')");
    expect(workSection.match(/<h2\b/g)).toHaveLength(1);
    // Cada ítem del grid es un h3 (dentro del map).
    expect(workSection.match(/<h3\b/g)).toHaveLength(1);
    expect(workSection).toContain('{area.title}');
    expect(workSection).not.toMatch(/<h4\b/);

    const ctaSection = about.slice(
      about.indexOf('id="about-cta"'),
      about.indexOf('id="contact"')
    );
    expect(ctaSection).toContain("t('about.cta.title')");
    expect(ctaSection.match(/<h2\b/g)).toHaveLength(1);
    expect(ctaSection).not.toMatch(/<h3\b/);
  });
});
