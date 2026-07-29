# 20260729-editorial-home-redesign — Design Doc

> Documento de diseño surgido de las rondas de entrevista socrática (3 rondas de 3 preguntas) y la fase de brainstorming. Toda la web está construida con Astro 5.16.3, Tailwind v4 + DaisyUI, i18n EN/ES. Los colores de marca Teal `#018786` y Orange `#FF9800` son intocables.

## 1. Resumen ejecutivo

La pantalla principal actual (`src/components/pages/HomePage.astro`) está construida como una rejilla **Bento** (cinco tarjetas: hero, trabajo destacado, devlog, tech stack, enlaces rápidos) seguida de un grid de tres artículos del blog y un banner CTA. El dueño del sitio considera que el diseño "no le gusta nada" y pide **cambiarlo todo**, conservando únicamente los colores de marca.

La nueva portada se concibe como **la portada de una revista personal**: un hero editorial tipográfico que ocupa la primera vista, seguido de cuatro secciones numeradas estilo índice de revista (`01`, `02`, `03`, `04`) con abundante espacio en blanco y micro-interacciones sobrias.

## 2. Decisiones acordadas (entrevista socrática)

| Decisión | Acuerdo |
|---|---|
| Objetivo principal de la home | **Marca personal + contenido.** Tú como persona eres el centro; el blog y el devlog son la prueba. |
| Dirección estética/estructural | **Hero editorial tipográfico.** Titular gigante, mucho aire, estilo revista/portfolio moderno. |
| Secciones a conservar (rediseñadas) | Blog (3 últimos), Trabajo destacado, Devlog, CTA GitHub/Google Play. |
| Contenido del hero | **Tipografía + manifiesto indie.** Titular + 1-2 líneas de manifiesto que conecten emocionalmente. |
| Ritmo visual de las secciones | **Secciones numeradas (01, 02, …).** Cada sección con número grande + título + divisor fino, estilo índice de revista. |
| Movimiento | **Micro-interacciones.** Fade-in + hovers elegantes + números con transición; respetando `prefers-reduced-motion`. |
| Identidad del titular | **`ArceApps` como titular** gigante, con la marca por encima del nombre personal. |
| Test de contrato | **Actualizar** `home-contract.test.ts` al nuevo contrato editorial. |
| Orden de las secciones | **01 Devlog → 02 Blog → 03 Trabajo destacado → 04 CTA.** |

## 3. Concepto creativo — "Índice de revista"

La home se percibe como la portada y la página de sumario de una revista personal. El titular gigante ("ArceApps" con el punto en naranja) funciona como portada, y cada sección numerada como un capítulo. La estética es sobria, editorial, con mucho aire y tipografía como protagonista.

### 3.1 Hero (viewport completo)

- **Tipografía protagonista:** `ArceApps` con tamaño `clamp(3.5rem, 14vw, 11rem)`, `font-weight: 900`, `tracking-tighter`, `leading-none`. El `.` final en color naranja `#FF9800` como acento de marca (sin animar).
- **Manifiesto indie:** debajo, en peso ligero (`font-light`), `clamp(1.125rem, 1.8vw, 1.5rem)`, color `on-surface-variant`. Máximo ~18 palabras. Propuesta:
  - EN: *"One person. Spare hours. Android apps crafted slowly, in public."*
  - ES: *"Una persona. Horas robadas. Apps Android hechas a fuego lento y en público."*
- **Indicador de scroll:** flecha con `material-icons:keyboard_arrow_down` y `animate-bounce`, anclada al `#section-devlog`.
- **Entrada escalonada:** titular → manifiesto → indicador, con `animation-delay` 0 / 0.15s / 0.3s, usando el keyframe `fade-in-up` existente en `global.css`. Todo dentro de `@media (prefers-reduced-motion: no-preference)`.
- **Altura:** `min-h-[calc(100svh-4rem)]` (compensa el header). Tipografía centrada vertical y horizontalmente.

### 3.2 Cabecera numerada compartida (`HomeSectionHeader`)

Reutilizada por las cuatro secciones para dar cohesión:

- **Número "ghost":** texto enorme (`text-5xl md:text-7xl`, `font-black`), color `primary/15` (15% de opacidad), `select-none`, `aria-hidden`.
- **Título:** `text-2xl md:text-4xl`, `font-extrabold`, `tracking-tight`.
- **Divisor:** `border-b border-border/60` debajo del bloque.
- **Acción "ver todo"** opcional a la derecha (cuando aplica), alineada a la línea base del título.

### 3.3 01 — Devlog ("Building in public")

- Cabecera con número `01` y título de `home.building_public`.
- Cita editorial: la última entrada, título enorme (`text-3xl md:text-5xl`, `font-extrabold`), fecha formateada con `toLocaleDateString` localizada, descripción, y un divisor fino con el enlace `home.read_entry` (`→`).
- Fallback (sin devlogs en el idioma): tarjeta secundaria con icono `code`, `home.explore_code`, `home.explore_code_desc`, y enlace a `/projects`.
- Enlace "ver todo": `home.devlog.all` → `/devlog`.

### 3.4 02 — Blog ("Technical Articles")

- Cabecera con número `02` y título `home.tech_articles`.
- Subtítulo `home.tech_articles_desc` debajo (opcional, en color `on-surface-variant`).
- Grid `md:grid-cols-3` reutilizando `BlogCard.astro` sin tocar. Cada tarjeta con `hover:-translate-y-1`.
- Enlace "ver todo" en la cabecera → `/blog` con `home.view_all_articles`.

### 3.5 03 — Trabajo destacado ("Lo último del taller")

- Cabecera con número `03` y título `home.work.title`.
- Layout asimétrico: `md:grid-cols-[1.2fr_1fr]` con `gap-8 md:gap-12`.
- **Imagen a la izquierda:** contenedor con `aspect-ratio`, `rounded-2xl`, `overflow-hidden`, `border`, hover `scale-[1.01]`. Si hay `realIconUrl` (apps), se superpone abajo-izquierda con `absolute bottom-3 left-3` (mismo patrón que `BentoFeaturedWorkCard`).
- **Contenido a la derecha:** etiqueta del tipo (`Apps` / `Proyectos`, `text-xs uppercase`), título (`text-2xl md:text-3xl font-extrabold`), descripción, tags (`text-xs #tag`), CTA → `/apps/{slug}` o `/projects/{slug}`.
- Fallback: si no hay `featuredWork`, mensaje centrado `apps.empty`.

### 3.6 04 — CTA ("Explora mi código y herramientas")

- Cabecera con número `04` y título `home.explore_code`.
- Banner editorial: fondo sólido `bg-primary` (sin `bg-gradient`, alineado con el espíritu sobrio), borde naranja arriba y abajo (`border-y-2 border-secondary/80`), texto blanco, `py-16`.
- Subtítulo `home.explore_code_desc`.
- Dos botones lado a lado: GitHub (`open_in_new` icon, fondo blanco, texto teal) y Google Play (`shop` icon, fondo `primary-strong`, borde naranja, texto blanco). Hover `hover:scale-105`.

### 3.7 Eliminaciones (explícitas)

- `src/components/bento/*` (siete archivos): verificado que solo los importa `HomePage.astro` actual y el test viejo.
- `src/components/Hero.astro`: verificado que solo lo lee el test viejo.
- Claves i18n `home.bento.*` (12) y `home.hero.*` (5): eliminadas tras verificar que ningún otro componente las usa.
- Claves auxiliares obsoletas: `home.latest_devlog`, `home.building`, `home.building_desc`, `home.view_all_apps` (verificado que tampoco las usa ningún otro componente).

### 3.8 Conservaciones explícitas

- `BlogCard.astro` sin cambios (reutilizado tal cual en sección 02).
- Script inline de detección de idioma en la home EN → `/es/`.
- `Layout.astro` sin cambios.
- `global.css`: se reutiliza el keyframe `fade-in-up` (línea 412) y la utilidad `fade-in-section`. Solo se añaden 3 nuevas clases `.home-hero-*` con animación.
- Devlog histórico `2026-W25-redesign-bento-grid-ai-agents.md`: no se modifica, es historia.

## 4. Supuestos técnicos (numerados)

1. Las colecciones y filtros existentes (blog/devlog/apps/projects, prefijos `en/`/`es/`, `draft`, `pubDate`) no cambian; solo cambia la presentación.
2. `BlogCard.astro` se reutiliza sin modificaciones dentro de la sección 02.
3. El script inline de detección de idioma (redirect a `/es/`) se conserva intacto en la home EN.
4. Todas las animaciones respetan `prefers-reduced-motion` con el patrón `motion-reduce` y el `@media (prefers-reduced-motion: no-preference)` ya usado en `global.css`.
5. Los siete componentes `bento/*` y `Hero.astro` se eliminan: verificado por grep que solo los usa `HomePage.astro` y el test viejo.
6. Se mantienen las claves i18n `home.building_public`, `home.read_entry` (usadas por páginas de devlog), `home.tech_articles`, `home.tech_articles_desc`, `home.view_all_articles`, `home.explore_code`, `home.explore_code_desc`, `home.view_github`, `home.google_play`, `home.view_all_projects`. El resto de `home.*` obsoletas se eliminan tras grep de verificación.
7. Cero dependencias nuevas: solo Tailwind v4 + DaisyUI + Material Icons ya instalados.
8. El `title` SEO del `Layout` y el prebuild de OG images (`scripts/generate-og-images.ts`) no dependen del markup específico de la home; se confirmará con `pnpm build`.
9. El devlog histórico `2026-W25-redesign-bento-grid-ai-agents.md` NO se modifica.
10. El nuevo contrato del test validará: hero editorial con manifiesto, cuatro secciones numeradas en orden `devlog → blog → work → cta`, ausencia de `Bento`, y claves i18n nuevas presentes en ambos idiomas.

## 5. Estructura final de archivos (post-implementación)

```
src/
├── components/
│   ├── pages/
│   │   ├── HomePage.astro          (reescrito)
│   │   └── home-contract.test.ts   (reescrito al nuevo contrato)
│   └── home/                        (nuevo)
│       ├── HomeHero.astro
│       ├── HomeSectionHeader.astro
│       ├── HomeDevlog.astro
│       ├── HomeBlog.astro
│       ├── HomeFeaturedWork.astro
│       └── HomeCta.astro
├── content/devlog/{en,es}/2026-W30-...md   (nueva entrada en bitácora Palette)
├── i18n/
│   └── ui.ts                        (claves nuevas + limpieza)
└── styles/
    └── global.css                   (3 nuevas clases .home-hero-*)
```

Archivos eliminados:

```
src/components/bento/BentoCard.astro
src/components/bento/BentoGrid.astro
src/components/bento/BentoHeroCard.astro
src/components/bento/BentoFeaturedWorkCard.astro
src/components/bento/BentoDevlogCard.astro
src/components/bento/BentoTechStackCard.astro
src/components/bento/BentoQuickLinksCard.astro
src/components/Hero.astro
```

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Romper `pnpm build` por i18n keys usadas que se eliminan | Grep antes de borrar; eliminación en la tarea 10 (cleanup), no antes. |
| Romper `pnpm test` por el contrato viejo | Reescribir el test ANTES de tocar la home (TDD). |
| Accesibilidad (lectores de pantalla, foco, contraste) | ARIA en el scroll-hint (`sr-only`), `aria-hidden` en el número ghost, `prefers-reduced-motion` respetado, contraste suficiente (teal/naranja sobre `bg-surface`). |
| SEO | Mantener `<h1>` único con la marca, subtítulos `<h2>` por sección, alt-text en imágenes del trabajo destacado. |
| CLS / Performance | Mantener `cv-auto` + `contain-intrinsic-size` en secciones pesadas; `loading="eager" fetchpriority="high"` en la imagen del trabajo destacado (lcp candidate). |
| Test del Hero.astro que ya no existe | Reescribir el test en la primera tarea; el archivo viejo se elimina al final. |
| Bitácora del agente Palette | Nueva entrada EN+ES en `src/content/devlog/` siguiendo el patrón de entradas existentes. |
