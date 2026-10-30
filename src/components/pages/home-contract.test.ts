import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ui } from '../../i18n/ui';

const ROOT_DIR = path.resolve(__dirname, '../../..');

const readSource = (relativePath: string) =>
  readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const readConsumedSource = () =>
  walk(path.join(ROOT_DIR, 'src'))
    .filter((file) => /\.(astro|ts|tsx)$/.test(file))
    .filter((file) => !file.endsWith('.test.ts'))
    .filter((file) => !file.endsWith(path.join('i18n', 'ui.ts')))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

const HOME_SECTIONS = [
  'HomeFeaturedWork',
  'HomeBlog',
  'HomeCta',
] as const;

const HARDCODED_HOME_COPY = [
  'Proyecto destacado',
  'Ver proyecto',
  'Ver en Google Play',
  'Últimos artículos',
  'Ver todas',
  'Leer artículo',
  '¿Hablamos?',
  'Contactar',
  'Una aplicación moderna de radio por internet',
] as const;

const DEAD_HOME_KEYS = [
  'home.work.cta',
  'home.work.title',
  'home.devlog.all',
  'home.explore_code',
  'home.explore_code_desc',
  'home.read_entry',
  'home.view_all_projects',
  'home.view_all_articles',
  'home.view_github',
  'home.tech_articles',
  'home.tech_articles_desc',
  'blog.subtitle',
  'devlog.subtitle',
] as const;

describe('contrato editorial de portada', () => {
  it('el hero es editorial: marca gigante, manifiesto y sin Bento', () => {
    const hero = readSource('src/components/home/HomeHero.astro');

    expect(hero).toContain('ArceApps');
    expect(hero).toContain("t('home.manifesto')");
    expect(hero).not.toContain('Bento');
    expect(hero).toContain('section-work');
    expect(hero).not.toContain('animate-bounce');
    expect(hero).toContain('keyboard_arrow_down');
  });

  it('hero fotografico con CTAs de la maqueta', () => {
    const hero = readSource('src/components/home/HomeHero.astro');

    expect(hero).toContain('hero-mountain-sunset');
    expect(hero).toContain('Explorar proyectos');
    expect(hero).toContain('Leer artículos');
    expect(hero).toContain('object-cover');
    expect(hero).toContain('bg-gradient-to-r');
    expect(hero).toContain('from-surface/95');
    expect(hero).toContain('dark:from-dark-surface/95');
    expect(hero).not.toContain('text-center');
  });

  it('fila de 4 pilares de la home', () => {
    const pillars = readSource('src/components/home/HomePillars.astro');
    const hero = readSource('src/components/home/HomeHero.astro');
    const home = readSource('src/components/pages/HomePage.astro');

    const pillarKeys = [
      ['apps', 'Apps Android', 'Productos en Google Play'],
      ['ai', 'Herramientas de IA', 'Agentes y automatización'],
      ['open_source', 'Proyectos open source', 'Ideas que exploro'],
      ['content', 'Contenido técnico', 'Blog y devlog'],
    ] as const;

    for (const [key, esTitle, esSubtitle] of pillarKeys) {
      expect(pillars).toContain(`t('home.pillars.${key}.title')`);
      expect(pillars).toContain(`t('home.pillars.${key}.subtitle')`);
      expect(ui.es[`home.pillars.${key}.title`]).toBe(esTitle);
      expect(ui.es[`home.pillars.${key}.subtitle`]).toBe(esSubtitle);
      expect(ui.en[`home.pillars.${key}.title`]).toBeTruthy();
      expect(ui.en[`home.pillars.${key}.subtitle`]).toBeTruthy();
    }

    for (const color of ['#059669', '#F97316', '#038C8E', '#E11D48']) {
      expect(pillars).toContain(color);
    }

    expect(hero).not.toContain('quickAccessPills');
    expect(home).toContain('import HomePillars');
    expect(home).toContain('<HomePillars lang={lang} />');
  });

  it('la home compone las secciones numeradas en orden editorial', () => {
    const home = readSource('src/components/pages/HomePage.astro');

    const blog = home.indexOf('<HomeBlog');
    const work = home.indexOf('<HomeFeaturedWork');
    const cta = home.indexOf('<HomeCta');

    expect(blog).toBeGreaterThan(work);
    expect(cta).toBeGreaterThan(blog);

    // D7: la sección HomeDevlog queda absorbida por "Últimos artículos".
    expect(home).not.toContain('<HomeDevlog');

    expect(home).not.toContain('Bento');
    expect(home).not.toContain('home.tech_articles');
    expect(home).toContain('useTranslations');
    expect(home).toContain('isPublished(data.pubDate)');
    expect(home).toContain("=== 'radiohub'");
  });

  it('las secciones usan la cabecera numerada compartida', () => {
    const sectionNames = [
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
      'home.work.section_title',
      'home.work.fallback_description',
      'home.work.project_cta',
      'home.work.play_cta',
      'home.work.android_badge',
      'home.work.screenshots_aria',
      'home.work.carousel_prev',
      'home.work.carousel_next',
      'home.articles.title',
      'home.articles.view_all',
      'home.articles.filter_blog',
      'home.articles.filter_devlog',
      'home.articles.filter_aria',
      'home.articles.reading_time',
      'home.articles.read_aria',
      'home.cta.title',
      'home.cta.subtitle',
      'home.cta.button',
    ] as const;

    for (const key of requiredKeys) {
      expect(ui.en[key], `Falta ${key} en inglés`).toBeTruthy();
      expect(ui.es[key], `Falta ${key} en español`).toBeTruthy();
    }

    expect(ui.es['home.articles.title']).toBe('Últimos artículos');
    expect(ui.es['home.articles.view_all']).toBe('Ver todas');
    expect(ui.es['home.work.section_title']).toBe('Proyecto destacado');
    expect(ui.es['home.cta.title']).toBe('¿Hablamos?');
  });

  it('las secciones de la home consumen claves sin copy ES hardcodeada', () => {
    for (const name of HOME_SECTIONS) {
      const source = readSource(`src/components/home/${name}.astro`);

      expect(source, `${name} debe usar useTranslations`).toContain(
        'useTranslations',
      );
      expect(source, `${name} debe consumir t()`).toMatch(/t\('home\./);

      for (const copy of HARDCODED_HOME_COPY) {
        expect(source, `${name} no debe incluir "${copy}"`).not.toContain(copy);
      }
    }
  });

  it('no quedan claves muertas de la home en ui.ts', () => {
    for (const key of DEAD_HOME_KEYS) {
      expect(key in ui.en, `${key} sigue declarada en inglés`).toBe(false);
      expect(key in ui.es, `${key} sigue declarada en español`).toBe(false);
    }
  });

  it('toda clave de la home declarada se consume en src/', () => {
    const consumed = readConsumedSource();
    const homeKeys = Object.keys(ui.en).filter((key) =>
      key.startsWith('home.'),
    );

    expect(homeKeys.length).toBeGreaterThan(0);

    for (const key of homeKeys) {
      expect(consumed, `${key} no se consume en src/`).toContain(key);
    }
  });

  it('ultimos articulos con chips Blog y Devlog', () => {
    const s = readSource('src/components/home/HomeBlog.astro');
    expect(s).toContain("t('home.articles.title')");
    expect(s).toContain("t('home.articles.view_all')");
    expect(s).toContain("t('home.articles.read_aria')");
    expect(s).toContain('data-filter');
  });

  it('los chips Blog y Devlog conmutan las tarjetas y el enlace Ver todas', () => {
    const s = readSource('src/components/home/HomeBlog.astro');

    // Chips de filtro con estado accesible y conmutables en cliente.
    expect(s).toContain('data-filter="blog"');
    expect(s).toContain('data-filter="devlog"');
    expect(s).toContain('aria-pressed="true"');
    expect(s).toContain('aria-pressed="false"');
    expect(s).toContain('data-active');
    expect(s).toContain('home.articles.filter_aria');

    // El enlace "Ver todas →" sigue al chip activo.
    expect(s).toContain('data-view-all');
    expect(s).toContain("filter === 'devlog' ? devlogUrl : blogUrl");

    // Cada tarjeta se marca con su origen para poder filtrarse.
    expect(s).toContain('data-article-card');
    expect(s).toContain("card.getAttribute('data-filter') !== filter");

    // Grid de 3 tarjetas con imagen, título y meta fecha · lectura.
    expect(s).toContain('md:grid-cols-3');
    expect(s).toContain('<img');
    expect(s).toContain('estimateReadingTime');
    expect(s).toContain('/ 200');
    expect(s).toContain('home.articles.reading_time');

    // Accesibilidad de los controles.
    expect(s).toContain('focus-visible:ring-2');
    expect(s).toContain('aria-label={filterAriaLabel}');
  });

  it('la seccion de articulos absorbe HomeDevlog en la home', () => {
    const home = readSource('src/components/pages/HomePage.astro');
    const blog = readSource('src/components/home/HomeBlog.astro');

    // D7: HomeDevlog deja de renderizarse; sus entradas pasan por chips.
    expect(home).not.toContain('<HomeDevlog');
    expect(home).not.toContain('import HomeDevlog');
    expect(blog).toContain('devlogs');
    expect(blog).toContain('devlogCards');
  });

  it('cta final Hablamos de la home', () => {
    const s = readSource('src/components/home/HomeCta.astro');

    expect(s).toContain("t('home.cta.title')");
    expect(s).toContain("t('home.cta.subtitle')");
    expect(s).toContain("t('home.cta.button')");
    expect(s).not.toContain('¿Hablamos?');
    expect(s).not.toContain('Contactar');

    // El CTA usa la cabecera numerada compartida: bg-primary y enlace a contacto.
    expect(s).toContain('bg-primary');
    expect(s).toContain('href={contactHref}');
    expect(s).toContain("lang === 'es' ? '/es/contact' : '/contact'");

    // Sin titulo duplicado: el titulo vive solo en la cabecera numerada.
    const headingMatches = s.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g) ?? [];
    const headingsWithTitle = headingMatches.filter((tag) =>
      tag.includes('ctaTitle'),
    );
    expect(headingsWithTitle).toHaveLength(0);

    // La seccion del CTA continua la numeracion (01 proyectos, 02 articulos, 03 CTA).
    expect(s).toContain('number="03"');
    expect(s).not.toContain('number="04"');
  });

  it('split-card Proyecto destacado con carrusel', () => {
    const s = readSource('src/components/home/HomeFeaturedWork.astro');
    expect(s).toContain("t('home.work.section_title')");
    expect(s).toContain("t('home.work.project_cta')");
    expect(s).toContain("t('home.work.play_cta')");
    expect(s).not.toContain('Proyecto destacado');
    expect(s).not.toContain('Ver proyecto');
    expect(s).not.toContain('Ver en Google Play');
    expect(s).toContain('aria-label');
    expect(s).toContain('smartphone');
    expect(s).toContain('item.tags');
    expect(s).toContain('item.screenshots');
    expect(s).toContain('overflow-x-auto');
    expect(s).toContain('snap-x');
    expect(s).toContain('data-home-work-prev');
    expect(s).toContain('data-home-work-next');
    expect(s).toContain('aria-label={carouselPrevLabel}');
    expect(s).toContain('aria-label={carouselNextLabel}');
  });
});
