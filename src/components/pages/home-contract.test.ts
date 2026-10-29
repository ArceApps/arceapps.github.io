import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ui } from '../../i18n/ui';

const ROOT_DIR = path.resolve(__dirname, '../../..');

const readSource = (relativePath: string) =>
  readFileSync(path.join(ROOT_DIR, relativePath), 'utf8');

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
      'home.work.title',
      'home.work.cta',
      'home.work.project_cta',
      'home.work.play_cta',
      'home.work.android_badge',
      'home.work.screenshots_aria',
      'home.work.carousel_prev',
      'home.work.carousel_next',
      'home.devlog.all',
      'home.articles.title',
      'home.articles.view_all',
      'home.articles.filter_blog',
      'home.articles.filter_devlog',
      'home.articles.filter_aria',
      'home.articles.reading_time',
    ] as const;

    for (const key of requiredKeys) {
      expect(ui.en[key], `Falta ${key} en inglés`).toBeTruthy();
      expect(ui.es[key], `Falta ${key} en español`).toBeTruthy();
    }

    expect(ui.es['home.articles.title']).toBe('Últimos artículos');
    expect(ui.es['home.articles.view_all']).toBe('Ver todas');
  });

  it('ultimos articulos con chips Blog y Devlog', () => {
    const s = readFileSync('src/components/home/HomeBlog.astro', 'utf8');
    expect(s).toContain('Últimos artículos');
    expect(s).toContain('Ver todas');
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
    const s = readFileSync('src/components/home/HomeCta.astro', 'utf8');

    expect(s).toContain('Hablamos');
    expect(s).toContain('Contactar');

    // El CTA usa la cabecera numerada compartida: bg-primary y enlace a contacto.
    expect(s).toContain('bg-primary');
    expect(s).toContain('href={contactHref}');
    expect(s).toContain("lang === 'es' ? '/es/contact' : '/contact'");

    // Sin titulo duplicado: "Hablamos" solo aparece en el literal de la cabecera.
    const headingMatches = s.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g) ?? [];
    const headingsWithTitle = headingMatches.filter((tag) =>
      tag.includes('ctaTitle'),
    );
    expect(headingsWithTitle).toHaveLength(0);
    expect(s.match(/Hablamos/g) ?? []).toHaveLength(1);

    // La seccion del CTA continua la numeracion (01 proyectos, 02 articulos, 03 CTA).
    expect(s).toContain('number="03"');
    expect(s).not.toContain('number="04"');
  });

  it('split-card Proyecto destacado con carrusel', () => {
    const s = readFileSync('src/components/home/HomeFeaturedWork.astro', 'utf8');
    expect(s).toContain('Proyecto destacado');
    expect(s).toContain('Ver proyecto');
    expect(s).toContain('Ver en Google Play');
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
