# 20260729-editorial-home-redesign — Task List

> **For agentic workers:** Read this file once, then dispatch one implementer per task with minimal context.
> Tasks are atomic (2-5 min). Do not bundle tasks. Do not skip the order.
> TDD first: la primera tarea reescribe el test del contrato y debe FALLAR antes de implementar.

## Contexto rápido para el implementador

- Rama de trabajo: `feature/arceapps.github.io_editorial-home-redesign` (ya creada, ya estamos en ella).
- Directorio de la home actual: `src/components/pages/HomePage.astro` (143 líneas, usa 6 componentes `bento/*`).
- Componentes bento a eliminar (verificado grep): `src/components/bento/{BentoCard,BentoGrid,BentoHeroCard,BentoFeaturedWorkCard,BentoDevlogCard,BentoTechStackCard,BentoQuickLinksCard}.astro`.
- Hero a eliminar: `src/components/Hero.astro`.
- Clave i18n clave existente: `home.building_public` (título sección 01), `home.read_entry` (CTA devlog), `home.tech_articles` (título sección 02), `home.view_all_articles`, `home.explore_code` (título sección 04), `home.explore_code_desc`, `home.view_github`, `home.google_play`.
- `BlogCard.astro`: NO tocar. Reutilizar tal cual en sección 02.
- `@fontsource/material-icons` ya provee `material-icons` (clase CSS) e iconos como `keyboard_arrow_down`, `arrow_forward`, `code`, `shop`, `open_in_new`, `star`, `phone_android`.
- Keyframe `fade-in-up` ya existe en `global.css:412`. Reutilizar.
- Bloque `@media (prefers-reduced-motion: no-preference)` ya existe en `global.css:426`.

---

## Task 1: Reescribir el test del contrato editorial (TDD — debe FALLAR)

**Files:**
- Modify: `src/components/pages/home-contract.test.ts` (reescritura completa)
- Test: `pnpm test`

**Control Metadata:**
- Complexity: 6
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- El test actual (`src/components/pages/home-contract.test.ts`) está desactualizado: lee `src/components/Hero.astro` (sin uso actual) y espera `<Card variant="feature">` + `<ProjectCard` + `id="apps"` (estructura anterior). Se reescribe completo al nuevo contrato.
- vitest ya está configurado. El comando es `pnpm test` (corre `vitest run`).

**Spec context (mínimo):**
El nuevo contrato valida cuatro aspectos del diseño editorial: (a) hero con `ArceApps` + manifiesto + sin `Bento`/gradientes; (b) `HomePage` compone 4 secciones en orden devlog→blog→work→cta y no contiene la palabra `Bento`; (c) cada sección usa `<HomeSectionHeader number="..."`; (d) las 5 claves i18n nuevas existen en EN y ES.

**Acceptance for this task:**
- [ ] El archivo reescrito compila bajo TypeScript estricto.
- [ ] `pnpm test` se ejecuta sin errores de tipo.
- [ ] Los nuevos 4 tests FALLAN con mensajes que indican qué archivos faltan (no error de compilación roto, sino fallos de expectativas).

**Steps:**

- [ ] **Step 1: Sobrescribir `src/components/pages/home-contract.test.ts` con el siguiente contenido completo**

```ts
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
```

- [ ] **Step 2: Ejecutar el test y verificar que FALLA en los 4 casos**

```bash
cd /home/arceappspc/Projects/ArceApps/arceapps.github.io && pnpm test 2>&1 | tail -40
```

Expected: 4 tests fallidos. Los mensajes de error deben ser de tipo `expected ... to contain ...` (no errores de compilación de TS). Anotar los mensajes exactos en el Execution Log del `plan.md` (tarea del documenter).

- [ ] **Step 3: Commit del test rojo**

```bash
git add src/components/pages/home-contract.test.ts
git commit -m "test: rewrite home contract to editorial spec (red)"
```

---

## Task 2: Añadir las 5 nuevas claves i18n en EN y ES

**Files:**
- Modify: `src/i18n/ui.ts` (insertar nuevas claves en ambos bloques)

**Control Metadata:**
- Complexity: 2
- Risk: Low
- Checkpoint: No

**Research & Context:**
- `ui.ts` tiene dos bloques literales: `ui.en` (líneas 9-113) y `ui.es` (líneas 114-218). Las claves de la home están al principio de cada bloque, líneas 27-46 (EN) y 132-151 (ES).
- NO borrar claves todavía. La limpieza se hace en Task 10.

**Spec context (mínimo):**
La home editorial necesita 5 nuevos strings que no existían. Estos son los valores aprobados en la fase de brainstorming.

**Acceptance for this task:**
- [ ] Las 5 claves añadidas en `ui.en` con los textos EN aprobados.
- [ ] Las 5 claves añadidas en `ui.es` con los textos ES aprobados.
- [ ] `pnpm test` muestra el cuarto test ("declara el copy editorial nuevo en ambos idiomas") en VERDE.
- [ ] `pnpm build` no rompe por tipos.

**Steps:**

- [ ] **Step 1: Insertar en el bloque `ui.en` justo después de la línea `'home.google_play': 'Google Play Store',` (línea 45)**

Insertar (texto exacto, comillas simples, coma al final):

```ts
    'home.manifesto': 'One person. Spare hours. Android apps crafted slowly, in public.',
    'home.scroll_hint': 'Scroll',
    'home.work.title': 'Latest from the workshop',
    'home.work.cta': 'View project details',
    'home.devlog.all': 'All devlog entries',
```

- [ ] **Step 2: Insertar en el bloque `ui.es` justo después de la línea `'home.google_play': 'Google Play Store',` (línea 150)**

Insertar (texto exacto, comillas simples, coma al final):

```ts
    'home.manifesto': 'Una persona. Horas robadas. Apps Android hechas a fuego lento y en público.',
    'home.scroll_hint': 'Desliza',
    'home.work.title': 'Lo último del taller',
    'home.work.cta': 'Ver detalles del proyecto',
    'home.devlog.all': 'Todas las entradas',
```

- [ ] **Step 3: Ejecutar el test**

```bash
cd /home/arceappspc/Projects/ArceApps/arceapps.github.io && pnpm test 2>&1 | tail -25
```

Expected: el test "declara el copy editorial nuevo en ambos idiomas" PASA; los otros 3 siguen en rojo.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/ui.ts
git commit -m "feat(i18n): add editorial home manifesto and section keys"
```

---

## Task 3: Crear `HomeHero.astro` (hero editorial) + clases CSS de entrada

**Files:**
- Create: `src/components/home/HomeHero.astro`
- Modify: `src/styles/global.css` (append de 3 clases dentro del bloque `@media (prefers-reduced-motion: no-preference)` existente)

**Control Metadata:**
- Complexity: 5
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- El keyframe `fade-in-up` ya existe en `global.css:412`.
- El bloque `@media (prefers-reduced-motion: no-preference)` ya existe en `global.css:426` y contiene las reglas `.fade-in` y `.fade-in-section`. Hay que añadir las 3 clases nuevas DENTRO de ese bloque, antes de su `}` de cierre.
- `useTranslations` se importa de `../../i18n/utils` (ruta relativa desde `src/components/home/`).

**Spec context (mínimo):**
El hero ocupa el primer viewport, tipografía gigante con la marca, manifiesto debajo, indicador de scroll anclado al `#section-devlog`.

**Acceptance for this task:**
- [ ] `pnpm test` muestra el primer test ("el hero es editorial") en VERDE.
- [ ] El archivo respeta `prefers-reduced-motion`.
- [ ] Sin gradientes ni Bento en el archivo.

**Steps:**

- [ ] **Step 1: Crear `src/components/home/HomeHero.astro` con el siguiente contenido**

```astro
---
import { useTranslations } from "../../i18n/utils";

interface Props {
  lang: 'en' | 'es';
}

const { lang } = Astro.props;
const t = useTranslations(lang);
---

<section
  class="home-hero relative flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center px-4 text-center"
  aria-labelledby="home-hero-title"
>
  <h1
    id="home-hero-title"
    class="home-hero-title text-[clamp(3.5rem,14vw,11rem)] font-black leading-[0.95] tracking-tighter text-on-surface dark:text-dark-on-surface"
  >
    ArceApps<span class="text-secondary" aria-hidden="true">.</span>
  </h1>

  <p class="home-hero-manifesto mt-6 max-w-xl text-lg font-light leading-snug text-on-surface-variant dark:text-dark-on-surface-variant md:text-2xl">
    {t('home.manifesto')}
  </p>

  <a
    href="#section-devlog"
    class="home-hero-scroll mt-12 inline-flex h-12 w-12 items-center justify-center rounded-full border border-border text-on-surface-variant transition-colors hover:border-secondary hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary motion-reduce:transition-none dark:border-dark-border dark:text-dark-on-surface-variant dark:hover:border-secondary dark:hover:text-secondary"
    aria-label={t('home.scroll_hint')}
  >
    <span class="material-icons text-2xl" aria-hidden="true">keyboard_arrow_down</span>
  </a>
</section>
```

- [ ] **Step 2: Añadir las clases de animación al final del bloque `@media (prefers-reduced-motion: no-preference)` en `global.css`**

Localizar el bloque (línea 426-446). Justo antes del `}` de cierre del bloque (línea 446), insertar:

```css

  .home-hero-title {
    animation: fade-in-up 0.7s ease-out both;
  }

  .home-hero-manifesto {
    animation: fade-in-up 0.7s ease-out 0.15s both;
  }

  .home-hero-scroll {
    animation: fade-in-up 0.7s ease-out 0.3s both;
  }
```

- [ ] **Step 3: Ejecutar el test y verificar el primer test en VERDE**

```bash
cd /home/arceappspc/Projects/ArceApps/arceapps.github.io && pnpm test 2>&1 | tail -25
```

Expected: primer test PASA; los otros 3 siguen en rojo.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/HomeHero.astro src/styles/global.css
git commit -m "feat(home): add editorial hero with manifesto"
```

---

## Task 4: Crear `HomeSectionHeader.astro` (cabecera numerada compartida)

**Files:**
- Create: `src/components/home/HomeSectionHeader.astro`

**Control Metadata:**
- Complexity: 3
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Componente puro de presentación. Recibe `number` (string tipo "01"), `title` (string), `id` (string para anchor), `href?` (string), `linkText?` (string).
- El número es decorativo: `aria-hidden="true"`.
- Enlace opcional a la derecha con icono `arrow_forward`.

**Spec context (mínimo):**
Cabecera compartida por las 4 secciones. Número ghost al 15% de opacidad, título, divisor fino, acción opcional.

**Acceptance for this task:**
- [ ] El archivo compila y respeta el patrón visual acordado.
- [ ] El test "las secciones usan la cabecera numerada compartida" pasa la parte de `HomeSectionHeader` (cuando se verifique tras la creación de las secciones en Tasks 5-8).

**Steps:**

- [ ] **Step 1: Crear `src/components/home/HomeSectionHeader.astro`**

```astro
---
interface Props {
  number: string;
  title: string;
  id: string;
  href?: string;
  linkText?: string;
}

const { number, title, id, href, linkText } = Astro.props;
---

<header
  id={id}
  class="mb-10 border-b border-border/60 pb-4 dark:border-dark-border/60 md:mb-14"
>
  <div class="flex flex-wrap items-end justify-between gap-6">
    <div class="flex items-baseline gap-4 md:gap-6">
      <span
        class="select-none text-5xl font-black leading-none text-primary/15 dark:text-teal-400/15 md:text-7xl"
        aria-hidden="true"
      >
        {number}
      </span>
      <h2 class="text-2xl font-extrabold tracking-tight text-on-surface dark:text-dark-on-surface md:text-4xl">
        {title}
      </h2>
    </div>

    {href && linkText && (
      <a
        href={href}
        class="inline-flex items-center text-sm font-bold text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary dark:text-teal-400"
      >
        {linkText}
        <span class="material-icons ml-1 text-base" aria-hidden="true">arrow_forward</span>
      </a>
    )}
  </div>
</header>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/HomeSectionHeader.astro
git commit -m "feat(home): add numbered shared section header"
```

---

## Task 5: Crear `HomeDevlog.astro` (sección 01)

**Files:**
- Create: `src/components/home/HomeDevlog.astro`

**Control Metadata:**
- Complexity: 5
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Patrón inspirado en `BentoDevlogCard.astro` (a eliminar) pero con presentación editorial: el contenido NO es una tarjeta con borde, sino una cita editorial dentro de la sección.
- `useTranslations` desde `../../i18n/utils`.

**Spec context (mínimo):**
Sección 01: cabecera numerada + última entrada del devlog con título grande + fecha + descripción + CTA "read entry". Fallback si no hay devlog.

**Acceptance for this task:**
- [ ] El componente renderiza `HomeSectionHeader` con `number="01"` y el título localizado.
- [ ] Si hay devlog: muestra título, fecha, descripción, enlace "read entry" a `${linkPrefix}/devlog/${slug}`.
- [ ] Si NO hay devlog: fallback con `home.explore_code`, `home.explore_code_desc` y enlace a `${linkPrefix}/projects`.

**Steps:**

- [ ] **Step 1: Crear `src/components/home/HomeDevlog.astro`**

```astro
---
import HomeSectionHeader from "./HomeSectionHeader.astro";
import { useTranslations } from "../../i18n/utils";

interface Props {
  lang: 'en' | 'es';
  latestDevlog?: {
    data: {
      title: string;
      description: string;
      pubDate: Date;
    };
    slug: string;
  };
}

const { lang, latestDevlog } = Astro.props;
const t = useTranslations(lang);
const linkPrefix = lang === 'es' ? '/es' : '';
const devlogSlug = latestDevlog ? latestDevlog.slug.split('/').pop() : '';
---

<section class="py-16 cv-auto fade-in-section md:py-24" style="contain-intrinsic-size: 500px;">
  <div class="container mx-auto max-w-7xl px-4 md:px-6">
    <HomeSectionHeader
      number="01"
      title={t('home.building_public')}
      id="section-devlog"
      href={`${linkPrefix}/devlog`}
      linkText={t('home.devlog.all')}
    />

    {latestDevlog ? (
      <article class="max-w-3xl">
        <span class="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-on-surface-variant dark:text-dark-on-surface-variant">
          <span class="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden="true"></span>
          {latestDevlog.data.pubDate.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>

        <h3 class="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-on-surface dark:text-dark-on-surface md:text-5xl">
          {latestDevlog.data.title}
        </h3>

        <p class="mt-4 text-base leading-relaxed text-on-surface-variant dark:text-dark-on-surface-variant md:text-lg">
          {latestDevlog.data.description}
        </p>

        <a
          href={`${linkPrefix}/devlog/${devlogSlug}`}
          class="mt-6 inline-flex items-center text-sm font-bold text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary dark:text-teal-400"
        >
          {t('home.read_entry')}
          <span class="material-icons ml-1 text-base" aria-hidden="true">arrow_forward</span>
        </a>
      </article>
    ) : (
      <article class="max-w-3xl rounded-2xl border border-border bg-surface-raised p-8 dark:border-dark-border dark:bg-dark-surface-raised">
        <span class="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary">
          <span class="material-icons text-xs" aria-hidden="true">code</span>
          {t('home.explore_code')}
        </span>
        <h3 class="mt-4 text-2xl font-extrabold text-on-surface dark:text-dark-on-surface md:text-3xl">
          {t('home.explore_code')}
        </h3>
        <p class="mt-2 text-base text-on-surface-variant dark:text-dark-on-surface-variant">
          {t('home.explore_code_desc')}
        </p>
        <a
          href={`${linkPrefix}/projects`}
          class="mt-6 inline-flex items-center text-sm font-bold text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary dark:text-teal-400"
        >
          {t('home.view_all_projects')}
          <span class="material-icons ml-1 text-base" aria-hidden="true">arrow_forward</span>
        </a>
      </article>
    )}
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/HomeDevlog.astro
git commit -m "feat(home): add editorial devlog section (01)"
```

---

## Task 6: Crear `HomeBlog.astro` (sección 02)

**Files:**
- Create: `src/components/home/HomeBlog.astro`

**Control Metadata:**
- Complexity: 4
- Risk: Low
- Checkpoint: No

**Research & Context:**
- `BlogCard.astro` se reutiliza tal cual. Importar desde `../BlogCard.astro` (ruta desde `src/components/home/` → `src/components/`).
- Posts vienen ya filtrados y limitados a 3 desde `HomePage.astro`.

**Spec context (mínimo):**
Sección 02: cabecera numerada + subtítulo + grid de 3 BlogCard + enlace "ver todos" en la cabecera (ya integrado en `HomeSectionHeader`).

**Acceptance for this task:**
- [ ] El componente renderiza `HomeSectionHeader` con `number="02"`, título `home.tech_articles` y enlace a `/blog`.
- [ ] Subtítulo `home.tech_articles_desc` debajo del header.
- [ ] Grid de 1/3 columnas con `BlogCard` por cada post.

**Steps:**

- [ ] **Step 1: Crear `src/components/home/HomeBlog.astro`**

```astro
---
import HomeSectionHeader from "./HomeSectionHeader.astro";
import BlogCard from "../BlogCard.astro";
import { useTranslations } from "../../i18n/utils";

interface Props {
  lang: 'en' | 'es';
  linkPrefix: string;
  posts: any[];
}

const { lang, linkPrefix, posts } = Astro.props;
const t = useTranslations(lang);
---

<section class="border-t border-border/50 bg-surface py-16 cv-auto fade-in-section dark:border-dark-border/50 dark:bg-dark-surface md:py-24" style="contain-intrinsic-size: 700px;">
  <div class="container mx-auto max-w-7xl px-4 md:px-6">
    <HomeSectionHeader
      number="02"
      title={t('home.tech_articles')}
      id="section-blog"
      href={`${linkPrefix}/blog`}
      linkText={t('home.view_all_articles')}
    />

    <p class="mb-10 max-w-2xl text-base text-on-surface-variant dark:text-dark-on-surface-variant md:text-lg">
      {t('home.tech_articles_desc')}
    </p>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
      {posts.map((post) => (
        <div class="transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none">
          <BlogCard post={post} />
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/HomeBlog.astro
git commit -m "feat(home): add editorial blog section (02)"
```

---

## Task 7: Crear `HomeFeaturedWork.astro` (sección 03)

**Files:**
- Create: `src/components/home/HomeFeaturedWork.astro`

**Control Metadata:**
- Complexity: 5
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Patrón inspirado en `BentoFeaturedWorkCard.astro` (a eliminar) pero con layout asimétrico (imagen grande a la izquierda, contenido a la derecha).
- `loading="eager" fetchpriority="high"` en la imagen (LCP candidate).

**Spec context (mínimo):**
Sección 03: cabecera numerada + layout `md:grid-cols-[1.2fr_1fr]` con imagen grande + título + descripción + tags + CTA. Fallback si no hay `featuredWork`.

**Acceptance for this task:**
- [ ] El componente renderiza `HomeSectionHeader` con `number="03"` y `home.work.title`.
- [ ] Si hay `featuredWork`: imagen con aspect ratio, realIconUrl overlay si existe, etiqueta de tipo, título, descripción, tags, CTA con `home.work.cta`.
- [ ] Si NO hay: mensaje centrado con `apps.empty`.

**Steps:**

- [ ] **Step 1: Crear `src/components/home/HomeFeaturedWork.astro`**

```astro
---
import HomeSectionHeader from "./HomeSectionHeader.astro";
import { useTranslations } from "../../i18n/utils";

interface Props {
  lang: 'en' | 'es';
  featuredWork?: {
    title: string;
    description: string;
    href: string;
    heroImage?: string;
    kind: 'app' | 'project';
    realIconUrl?: string;
    tags?: string[];
  };
}

const { lang, featuredWork } = Astro.props;
const t = useTranslations(lang);
---

<section class="py-16 cv-auto fade-in-section md:py-24" style="contain-intrinsic-size: 600px;">
  <div class="container mx-auto max-w-7xl px-4 md:px-6">
    <HomeSectionHeader
      number="03"
      title={t('home.work.title')}
      id="section-work"
    />

    {featuredWork ? (
      <article class="grid grid-cols-1 items-center gap-8 md:grid-cols-[1.2fr_1fr] md:gap-12">
        <a
          href={featuredWork.href}
          class="group block overflow-hidden rounded-2xl border border-border bg-surface-variant/30 transition-transform duration-300 hover:scale-[1.01] motion-reduce:transition-none dark:border-dark-border dark:bg-dark-surface-variant/30"
        >
          <div class="relative aspect-[16/10] w-full">
            {featuredWork.heroImage ? (
              <img
                src={featuredWork.heroImage}
                alt={featuredWork.title}
                loading="eager"
                fetchpriority="high"
                class="absolute inset-0 h-full w-full object-cover object-center"
              />
            ) : (
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="material-icons text-6xl text-primary opacity-60">phone_android</span>
              </div>
            )}

            {featuredWork.realIconUrl && (
              <img
                src={featuredWork.realIconUrl}
                alt={`${featuredWork.title} icon`}
                class="absolute bottom-3 left-3 h-12 w-12 rounded-xl border-2 border-surface object-cover shadow-lg dark:border-dark-surface"
              />
            )}
          </div>
        </a>

        <div>
          <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant/70 dark:text-dark-on-surface-variant/70">
            <span class="material-icons text-xs" aria-hidden="true">star</span>
            {featuredWork.kind === 'app' ? t('apps.title') : t('projects.title')}
          </span>

          <h3 class="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-on-surface transition-colors group-hover:text-primary dark:text-dark-on-surface dark:group-hover:text-teal-400 md:text-3xl">
            {featuredWork.title}
          </h3>

          <p class="mt-3 text-base leading-relaxed text-on-surface-variant dark:text-dark-on-surface-variant">
            {featuredWork.description}
          </p>

          {featuredWork.tags && featuredWork.tags.length > 0 && (
            <div class="mt-4 flex flex-wrap gap-1.5">
              {featuredWork.tags.slice(0, 4).map((tag) => (
                <span class="rounded-md bg-surface-variant/60 px-2.5 py-0.5 text-xs font-medium text-on-surface-variant dark:bg-dark-surface-variant/60 dark:text-dark-on-surface-variant">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <a
            href={featuredWork.href}
            class="mt-6 inline-flex items-center text-sm font-bold text-primary transition-colors hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary dark:text-teal-400"
          >
            {t('home.work.cta')}
            <span class="material-icons ml-1 text-base" aria-hidden="true">arrow_forward</span>
          </a>
        </div>
      </article>
    ) : (
      <p class="py-12 text-center text-on-surface-variant dark:text-dark-on-surface-variant">
        {t('apps.empty')}
      </p>
    )}
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/HomeFeaturedWork.astro
git commit -m "feat(home): add editorial featured work section (03)"
```

---

## Task 8: Crear `HomeCta.astro` (sección 04)

**Files:**
- Create: `src/components/home/HomeCta.astro`

**Control Metadata:**
- Complexity: 3
- Risk: Low
- Checkpoint: No

**Research & Context:**
- Banner editorial con fondo teal sólido (sin gradiente), borde naranja arriba/abajo.
- Dos botones lado a lado: GitHub (fondo blanco) y Google Play (fondo primary-strong, borde naranja).

**Spec context (mínimo):**
Sección 04: cabecera numerada + banner con título `home.explore_code`, subtítulo, y dos botones CTA.

**Acceptance for this task:**
- [ ] El componente renderiza `HomeSectionHeader` con `number="04"` y `home.explore_code`.
- [ ] Banner sin `bg-gradient` (sólido teal), con borde naranja.
- [ ] Dos botones: GitHub (`https://github.com/arceapps`) y Google Play (`https://play.google.com/store/apps/dev?id=8812775800441745731`).

**Steps:**

- [ ] **Step 1: Crear `src/components/home/HomeCta.astro`**

```astro
---
import HomeSectionHeader from "./HomeSectionHeader.astro";
import { useTranslations } from "../../i18n/utils";

interface Props {
  lang: 'en' | 'es';
}

const { lang } = Astro.props;
const t = useTranslations(lang);
---

<section class="border-y-2 border-secondary/80 bg-primary py-16 text-white cv-auto fade-in-section md:py-20" style="contain-intrinsic-size: 400px;">
  <div class="container mx-auto max-w-5xl px-4 text-center md:px-6">
    <h2 class="text-3xl font-black tracking-tight md:text-4xl">
      {t('home.explore_code')}
    </h2>
    <p class="mt-4 text-base leading-relaxed opacity-90 md:text-lg">
      {t('home.explore_code_desc')}
    </p>

    <div class="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
      <a
        href="https://github.com/arceapps"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-bold text-primary shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 motion-reduce:transition-none"
      >
        <span class="material-icons mr-2 text-lg" aria-hidden="true">code</span>
        {t('home.view_github')}
      </a>
      <a
        href="https://play.google.com/store/apps/dev?id=8812775800441745731"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center justify-center rounded-2xl border-2 border-secondary bg-primary-strong px-8 py-4 text-base font-bold text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-primary-strong/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 motion-reduce:transition-none"
      >
        <span class="material-icons mr-2 text-lg" aria-hidden="true">shop</span>
        {t('home.google_play')}
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/HomeCta.astro
git commit -m "feat(home): add editorial CTA section (04)"
```

---

## Task 9: Reescribir `HomePage.astro` para componer las nuevas secciones

**Files:**
- Modify: `src/components/pages/HomePage.astro` (reescritura completa)

**Control Metadata:**
- Complexity: 6
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- Mantener toda la lógica de `getCollection` con los filtros actuales (idioma, draft, fecha, orden desc, slice 3).
- Mantener `recentWork` combinando apps+projects.
- Mantener el script inline de detección de idioma.
- Reemplazar las 6 secciones bento por las 4 nuevas.
- Eliminar `latestDevlog` es `optional`; las nuevas secciones lo manejan internamente.

**Spec context (mínimo):**
La home compone las 4 secciones en orden editorial (Devlog → Blog → Featured Work → CTA). El test verifica ese orden.

**Acceptance for this task:**
- [ ] `pnpm test` muestra los 4 tests en VERDE.
- [ ] `pnpm build` finaliza sin errores (ni TS ni Astro).
- [ ] El archivo no contiene la palabra `Bento`.

**Steps:**

- [ ] **Step 1: Sobrescribir `src/components/pages/HomePage.astro`**

```astro
---
import Layout from "../../layouts/Layout.astro";
import HomeHero from "../home/HomeHero.astro";
import HomeDevlog from "../home/HomeDevlog.astro";
import HomeBlog from "../home/HomeBlog.astro";
import HomeFeaturedWork from "../home/HomeFeaturedWork.astro";
import HomeCta from "../home/HomeCta.astro";
import { getCollection } from "astro:content";
import { useTranslations } from "../../i18n/utils";

interface Props {
  lang: 'en' | 'es';
}

const { lang } = Astro.props;
const t = useTranslations(lang);

const prefix = lang === 'es' ? 'es/' : 'en/';
const linkPrefix = lang === 'es' ? '/es' : '';

const allPosts = (await getCollection("blog", ({ data, id }) => !data.draft && data.pubDate <= new Date() && id.startsWith(prefix)))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 3);

const latestDevlog = (await getCollection("devlog", ({ data, id }) => !data.draft && data.pubDate <= new Date() && id.startsWith(prefix)))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())[0];

const apps = (await getCollection("apps", ({ data, id }) => !data.draft && id.startsWith(prefix)))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 3);

const projects = await getCollection("projects", ({ data, id }) => !data.draft && id.startsWith(prefix));
const recentWork = [
  ...apps.map((app) => ({ type: 'app' as const, entry: app, pubDate: app.data.pubDate })),
  ...projects.map((project) => ({ type: 'project' as const, entry: project, pubDate: project.data.pubDate })),
].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()).slice(0, 3);

const featuredWork = recentWork[0]
  ? {
      title: recentWork[0].entry.data.title,
      description: recentWork[0].entry.data.description,
      href: `${linkPrefix}/${recentWork[0].type === 'project' ? 'projects' : 'apps'}/${recentWork[0].entry.slug.split('/').pop() || ''}`,
      heroImage: recentWork[0].entry.data.heroImage,
      kind: recentWork[0].type,
      realIconUrl: recentWork[0].type === 'app' && 'realIconUrl' in recentWork[0].entry.data ? (recentWork[0].entry.data as { realIconUrl?: string }).realIconUrl : undefined,
      tags: recentWork[0].entry.data.tags,
    }
  : undefined;
---

<Layout title={lang === 'es' ? "ArceApps - Apps Android Premium" : "ArceApps - Premium Android Apps"}>
  {lang === 'en' && (
    <script is:inline>
        if (typeof localStorage !== 'undefined' && !localStorage.getItem('lang-preference')) {
          const lang = navigator.language || navigator.userUserLanguage;
          if (lang && lang.startsWith('es')) {
              window.location.href = '/es/';
          }
        }
    </script>
  )}

  <HomeHero lang={lang} />
  <HomeDevlog lang={lang} latestDevlog={latestDevlog} />
  <HomeBlog lang={lang} linkPrefix={linkPrefix} posts={allPosts} />
  <HomeFeaturedWork lang={lang} featuredWork={featuredWork} />
  <HomeCta lang={lang} />
</Layout>
```

> Nota: el script inline conserva la misma lógica que tenía la home actual. `navigator.userUserLanguage` queda como está (typo preexistente; no tocar en este rediseño — es ortogonal y podría romper comportamiento en navegadores viejos).

- [ ] **Step 2: Ejecutar tests**

```bash
cd /home/arceappspc/Projects/ArceApps/arceapps.github.io && pnpm test 2>&1 | tail -20
```

Expected: 4/4 tests PASA.

- [ ] **Step 3: Ejecutar build**

```bash
cd /home/arceappspc/Projects/ArceApps/arceapps.github.io && pnpm build 2>&1 | tail -30
```

Expected: build finaliza sin errores. Anotar warnings (si los hay) en el Execution Log.

- [ ] **Step 4: Commit**

```bash
git add src/components/pages/HomePage.astro
git commit -m "feat(home): compose editorial sections and replace bento"
```

---

## Task 10: Eliminar código muerto (bento/, Hero.astro, claves i18n obsoletas)

**Files:**
- Delete: `src/components/bento/` (directorio completo)
- Delete: `src/components/Hero.astro`
- Modify: `src/i18n/ui.ts` (eliminar claves obsoletas)

**Control Metadata:**
- Complexity: 4
- Risk: Medium
- Checkpoint: No

**Research & Context:**
- ANTES de borrar, verificar con grep que ningún archivo fuera de los eliminados usa estos componentes o claves.
- Claves a borrar en `ui.ts` (verificadas en fase de brainstorming):
  - EN (líneas 27-31 + 46-57): `home.hero.eyebrow`, `home.hero.prefix`, `home.hero.note`, `home.hero.title`, `home.hero.subtitle`, `home.latest_devlog`, `home.building`, `home.building_desc`, `home.view_all_apps`, `home.bento.hero_badge`, `home.bento.hero_title`, `home.bento.hero_subtitle`, `home.bento.featured_badge`, `home.bento.featured_cta`, `home.bento.devlog_badge`, `home.bento.devlog_fallback`, `home.bento.tech_badge`, `home.bento.tech_title`, `home.bento.links_badge`, `home.bento.github_desc`, `home.bento.playstore_desc`.
  - ES: mismas claves con sus valores traducidos.

**Spec context (mínimo):**
Limpieza final del código de la era bento. Solo se ejecuta tras validar que nada lo referencia.

**Acceptance for this task:**
- [ ] `grep -r "from.*bento" src/` devuelve 0 resultados.
- [ ] `grep -r "import.*Hero" src/` devuelve 0 resultados.
- [ ] `grep -r "home.bento\." src/` devuelve 0 resultados.
- [ ] `grep -r "home.hero\." src/` devuelve 0 resultados.
- [ ] `grep -r "home.latest_devlog\|home.building\|home.building_desc\|home.view_all_apps" src/` devuelve 0 resultados.
- [ ] `pnpm test` PASA.
- [ ] `pnpm build` finaliza sin errores.

**Steps:**

- [ ] **Step 1: Verificación previa con grep**

```bash
cd /home/arceappspc/Projects/ArceApps/arceapps.github.io
echo "=== bento refs ==="; grep -rn "from.*bento" src/ || echo "(none)"
echo "=== Hero refs ==="; grep -rn "import.*Hero" src/ || echo "(none)"
echo "=== home.bento refs ==="; grep -rn "home.bento\." src/ || echo "(none)"
echo "=== home.hero refs ==="; grep -rn "home.hero\." src/ || echo "(none)"
echo "=== other home keys ==="; grep -rn "home.latest_devlog\|home\.building[^_]\|home\.building_desc\|home\.view_all_apps" src/ || echo "(none)"
```

Expected: cada bloque imprime `(none)`. Si alguno tiene resultados, ABORTAR y ajustar las claves antes de borrar.

- [ ] **Step 2: Eliminar el directorio bento y el archivo Hero.astro**

```bash
cd /home/arceappspc/Projects/ArceApps/arceapps.github.io
git rm -r src/components/bento
git rm src/components/Hero.astro
```

- [ ] **Step 3: Eliminar las claves obsoletas de `src/i18n/ui.ts`**

Borrar exactamente estas líneas en el bloque `ui.en` (dentro del objeto `ui.en: { ... }`):

```ts
    'home.hero.eyebrow': 'Indie Android developer',
    'home.hero.prefix': 'Tools made with care',
    'home.hero.note': 'Android · Kotlin · open source notes',
    'home.hero.title': 'Premium Android Apps',
    'home.hero.subtitle': 'Modern, functional and high quality applications.',
    'home.latest_devlog': 'Latest Devlog',
    'home.building': 'What I am building',
    'home.building_desc': 'Personal projects focused on solving real problems and exploring new technologies in Android.',
    'home.view_all_apps': 'View all applications',
    'home.bento.hero_badge': 'Active Developer',
    'home.bento.hero_title': 'Crafting clean Android software & open tools',
    'home.bento.hero_subtitle': 'Indie apps built with passion, Jetpack Compose, Kotlin, and modern architecture.',
    'home.bento.featured_badge': 'Featured Work',
    'home.bento.featured_cta': 'View Project Details',
    'home.bento.devlog_badge': 'Live Devlog',
    'home.bento.devlog_fallback': 'Open Source Repositories',
    'home.bento.tech_badge': 'Stack & Mindset',
    'home.bento.tech_title': 'Native Kotlin & Clean Architecture',
    'home.bento.links_badge': 'Quick Access',
    'home.bento.github_desc': 'Source code & open repos',
    'home.bento.playstore_desc': 'Published Android apps',
```

Borrar exactamente estas líneas en el bloque `ui.es` (dentro del objeto `ui.es: { ... }`):

```ts
    'home.hero.eyebrow': 'Desarrollador Android indie',
    'home.hero.prefix': 'Herramientas hechas con cuidado',
    'home.hero.note': 'Android · Kotlin · notas sobre código abierto',
    'home.hero.title': 'Apps Android Premium',
    'home.hero.subtitle': 'Aplicaciones modernas, funcionales y de alta calidad.',
    'home.latest_devlog': 'Última Bitácora',
    'home.building': 'Lo que estoy construyendo',
    'home.building_desc': 'Proyectos personales enfocados en resolver problemas reales y explorar nuevas tecnologías en Android.',
    'home.view_all_apps': 'Ver todas las aplicaciones',
    'home.bento.hero_badge': 'Desarrollador Activo',
    'home.bento.hero_title': 'Artesanía en software Android y herramientas abiertas',
    'home.bento.hero_subtitle': 'Aplicaciones indie creadas con pasión, Jetpack Compose, Kotlin y arquitectura limpia.',
    'home.bento.featured_badge': 'Trabajo Destacado',
    'home.bento.featured_cta': 'Ver Detalles del Proyecto',
    'home.bento.devlog_badge': 'Diario en Vivo',
    'home.bento.devlog_fallback': 'Repositorios Open Source',
    'home.bento.tech_badge': 'Stack & Filosofía',
    'home.bento.tech_title': 'Kotlin Nativo & Arquitectura Limpia',
    'home.bento.links_badge': 'Acceso Rápido',
    'home.bento.github_desc': 'Código fuente y repos abiertos',
    'home.bento.playstore_desc': 'Apps Android publicadas',
```

> Importante: cuidar la coma final. La línea inmediatamente anterior a cada bloque eliminado debe mantener su coma final si la siguiente línea (la siguiente clave que se conserva) la necesita. Tras el bloque, la siguiente clave existente (`home.building_public` en EN, `home.building_public` en ES) ya tiene su propia coma.

- [ ] **Step 4: Ejecutar test y build**

```bash
cd /home/arceappspc/Projects/ArceApps/arceapps.github.io && pnpm test 2>&1 | tail -15 && echo "---BUILD---" && pnpm build 2>&1 | tail -20
```

Expected: ambos finalizan en VERDE / éxito.

- [ ] **Step 5: Commit**

```bash
git add -A src/
git commit -m "chore(home): remove bento grid and obsolete i18n keys"
```

---

## Task 11: Entrada de bitácora en `src/content/devlog/` (agente Palette)

**Files:**
- Create: `public/images/2026-W30-editorial-home-redesign-cover.svg`
- Create: `src/content/devlog/en/2026-W30-editorial-home-redesign.md`
- Create: `src/content/devlog/es/2026-W30-editorial-home-redesign.md`

**Control Metadata:**
- Complexity: 5
- Risk: Low
- Checkpoint: No

**Research & Context:**
- AGENTS.md §7: imagen SVG geométrica con colores de marca (Teal `#018786` y Orange `#FF9800`).
- AGENTS.md §8: fecha real verificada (2026-07-29), formato ISO en `pubDate`.
- Frontmatter debe cumplir `src/content/config.ts` (verificar antes de escribir).
- Patrón de entradas existentes en `src/content/devlog/{en,es}/` (revisar `2026-W25-redesign-bento-grid-ai-agents.md` para ver estructura).

**Spec context (mínimo):**
Documentar el rediseño como devlog "building in public", tono técnico y sobrio, manteniendo el "espíritu indie" (AGENTS.md §1).

**Acceptance for this task:**
- [ ] Imagen SVG creada con formas geométricas (cuadrados/círculos) en Teal/Naranja sobre fondo neutro.
- [ ] Entrada EN creada con frontmatter válido (title, description, pubDate 2026-07-29, tags, heroImage).
- [ ] Entrada ES creada con frontmatter válido (title, description, pubDate 2026-07-29, tags, heroImage).
- [ ] `pnpm build` finaliza sin errores (las nuevas entradas son recogidas por `getCollection('devlog')`).

**Steps:**

- [ ] **Step 1: Verificar el frontmatter esperado por `src/content/config.ts`**

```bash
cd /home/arceappspc/Projects/ArceApps/arceapps.github.io && grep -A 30 "devlog" src/content/config.ts
```

Anotar los campos obligatorios.

- [ ] **Step 2: Crear `public/images/2026-W30-editorial-home-redesign-cover.svg`**

Contenido (SVG geométrico sobrio, 1200×630, OG-like):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="Editorial home redesign">
  <rect width="1200" height="630" fill="#018786"/>
  <circle cx="900" cy="315" r="180" fill="#FF9800" opacity="0.9"/>
  <rect x="60" y="200" width="60" height="60" fill="#FFFFFF" opacity="0.9"/>
  <text x="60" y="380" font-family="Roboto, sans-serif" font-size="120" font-weight="900" fill="#FFFFFF">ArceApps</text>
  <text x="60" y="500" font-family="Roboto, sans-serif" font-size="32" font-weight="300" fill="#FFFFFF" opacity="0.9">Editorial home, week 30</text>
</svg>
```

- [ ] **Step 3: Crear `src/content/devlog/en/2026-W30-editorial-home-redesign.md`**

> El contenido exacto del cuerpo del devlog se delega al agente Scribe (bot_Scribe). El implementador solo crea el archivo con frontmatter válido y un cuerpo placeholder mínimo (~200 palabras) para que el Scribe lo enriquezca después. NO dejar TBDs en el frontmatter.

Frontmatter obligatorio (ajustar campos según `src/content/config.ts`):

```markdown
---
title: "Editorial home, week 30"
description: "Rebuilding the ArceApps landing page as an editorial cover: a typographic hero with the indie manifesto and four numbered sections (Devlog, Blog, Featured Work, CTA)."
pubDate: 2026-07-29
heroImage: /images/2026-W30-editorial-home-redesign-cover.svg
keywords: ["ArceApps", "devlog", "editorial", "home", "tailwind", "i18n"]
tags: ["home", "editorial", "redesign", "typography", "i18n"]
canonical: "https://arceapps.com/devlog/2026-w30-editorial-home-redesign/"
---

# Editorial home, week 30

The landing page of **ArceApps** has lived two lives in the last few weeks. First it was a classic linear layout, then it became a Bento Grid. Today it becomes something closer to a magazine cover: a single oversized headline, a two-line indie manifesto, and four numbered chapters.

## Why change everything

The Bento Grid was dense and modern, but it buried the **why** behind the work. Anyone arriving at the site had to scan five tiles to figure out what kind of developer this was. The new layout makes the answer immediate: *one person, spare hours, Android apps crafted slowly and in public*.

## What changed

- **Hero:** "ArceApps" at `clamp(14vw)` weight 900, a single orange dot as the brand accent, and the manifesto below in a light weight. Scroll hint anchored to the first section.
- **Sections:** `01 Devlog`, `02 Blog`, `03 Featured Work`, `04 CTA`. Each has a ghost number, a bold title, and an optional "view all" link.
- **Accessibility:** every animation respects `prefers-reduced-motion`, decorative numbers are `aria-hidden`, focus rings stay visible on the orange accent.
- **i18n:** the manifesto and the new section titles exist in both English and Spanish. Five new keys landed in `ui.ts`; the obsolete `home.bento.*` keys were removed.

## What stayed

- **Brand colors:** Teal `#018786` and Orange `#FF9800`. No other colors.
- **`BlogCard.astro`:** reused as-is in section 02.
- **Data fetching:** the same `getCollection` filters and ordering as before.

The devlog stays short on purpose. The next entry will be about the typography pairing and the scroll-driven animations.
```

- [ ] **Step 4: Crear `src/content/devlog/es/2026-W30-editorial-home-redesign.md`**

```markdown
---
title: "Home editorial, semana 30"
description: "Reconstruimos la portada de ArceApps como una portada de revista: hero tipográfico con el manifiesto indie y cuatro secciones numeradas (Devlog, Blog, Trabajo destacado, CTA)."
pubDate: 2026-07-29
heroImage: /images/2026-W30-editorial-home-redesign-cover.svg
keywords: ["ArceApps", "bitacora", "editorial", "home", "tailwind", "i18n"]
tags: ["home", "editorial", "redesign", "tipografia", "i18n"]
canonical: "https://arceapps.com/es/devlog/2026-w30-editorial-home-redesign/"
---

# Home editorial, semana 30

La portada de **ArceApps** ha vivido dos vidas en las últimas semanas. Primero fue un layout lineal clásico, después se convirtió en un Bento Grid. Hoy se vuelve algo más parecido a la portada de una revista: un único titular enorme, un manifiesto indie de dos líneas y cuatro capítulos numerados.

## Por qué cambiarlo todo

El Bento Grid era denso y moderno, pero enterraba el **porqué** detrás del trabajo. Cualquiera que llegase al sitio tenía que escanear cinco tarjetas para entender qué tipo de desarrollador había detrás. El nuevo layout hace la respuesta inmediata: *una persona, horas robadas, apps Android hechas a fuego lento y en público*.

## Qué cambió

- **Hero:** "ArceApps" a `clamp(14vw)` peso 900, un único punto naranja como acento de marca y el manifiesto debajo en peso ligero. Indicador de scroll anclado a la primera sección.
- **Secciones:** `01 Devlog`, `02 Blog`, `03 Trabajo destacado`, `04 CTA`. Cada una con número ghost, título en negrita y enlace "ver todo" opcional.
- **Accesibilidad:** cada animación respeta `prefers-reduced-motion`, los números decorativos son `aria-hidden`, los anillos de foco se mantienen visibles sobre el acento naranja.
- **i18n:** el manifiesto y los nuevos títulos de sección existen en inglés y español. Cinco claves nuevas aterrizaron en `ui.ts`; las obsoletas `home.bento.*` se eliminaron.

## Qué se quedó

- **Colores de marca:** Teal `#018786` y Orange `#FF9800`. Ningún otro color.
- **`BlogCard.astro`:** reutilizado tal cual en la sección 02.
- **Obtención de datos:** los mismos filtros y orden de `getCollection` que antes.

La bitácora se queda corta a propósito. La próxima entrada hablará del emparejamiento tipográfico y las animaciones scroll-driven.
```

- [ ] **Step 5: Ejecutar build y verificar que la nueva entrada se recoge**

```bash
cd /home/arceappspc/Projects/ArceApps/arceapps.github.io && pnpm build 2>&1 | tail -20
```

Expected: build finaliza OK. La entrada aparece en `/devlog/2026-W30-editorial-home-redesign/` y `/es/devlog/2026-W30-editorial-home-redesign/`.

- [ ] **Step 6: Commit**

```bash
git add public/images/2026-W30-editorial-home-redesign-cover.svg src/content/devlog/
git commit -m "docs(devlog): editorial home redesign (W30)"
```
