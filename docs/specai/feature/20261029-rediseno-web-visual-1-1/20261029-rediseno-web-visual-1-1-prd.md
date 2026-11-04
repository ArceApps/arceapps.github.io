# Product Requirements Document: Rediseño visual 1:1 del portfolio ArceApps

**Date:** 2026-10-29
**Status:** APPROVED
**Feature ID:** 20261029-rediseno-web-visual-1-1

## 1. Problem Statement & Solution

### Problem Statement
- La web actual (Astro 5 + Tailwind 4, ES/EN) se aproxima al diseño objetivo pero no coincide con la maqueta aprobada `Presentación UI de ArceApps en modo claro y oscuro.png` (10 pantallas: Home, Aplicaciones, Blog, Devlog, Sobre mí × modo claro/oscuro).
- Deltas concretos observados frente a la maqueta:
  - Home: el hero actual es centrado y sin foto; la maqueta pide hero con foto de montaña a sangre y contenido a la izquierda (eyebrow, titular, subtítulo, 2 CTAs), fila de 4 pilares (Apps Android, Herramientas de IA, Proyectos open source, Contenido técnico), sección "Proyecto destacado" tipo split-card (RadioHub) y "Últimos artículos" en 3 columnas con chips Blog/Devlog.
  - Header: la navegación actual (Inicio, Proyectos, Apps, Blog, Devlog, Contacto) no incluye "Sobre mí", que sí aparece en la maqueta.
  - Tokens: el tema claro usa primario teal `#007F7D` y fondo `#F8F9FA`; la maqueta mide acento `#038D90` (claro) / `#00ACB0` (oscuro) y fondo claro `#FCFCFC`. El dark actual `#091117` coincide con la maqueta pero sus tarjetas y acento no.
  - Aplicaciones, Blog, Devlog y Sobre mí: la maqueta define chips de categoría/tags, buscador en Blog, tarjetas con badges, entradas destacadas, stats y bloques "En qué trabajo" / "¿Hablamos?" que la implementación actual solo aproxima.
- Varias superficies no aparecen en la maqueta (Proyectos, Contacto, detalle de app/artículo/devlog, series, cookies, privacidad, 404, búsqueda) y carecen de un diseño coherente con el nuevo lenguaje visual.

### Solution
- Rediseñar el sitio completo aplicando 1:1 las 5 pantallas de la maqueta (Home, Aplicaciones, Blog, Devlog, Sobre mí) en modo claro y modo oscuro, en tamaño escritorio.
- Crear o re-diseñar todas las superficies no mostradas (Proyectos, Contacto, detalles, series, legales, 404, búsqueda, footer y layouts móviles) siguiendo el mismo tipo de diseño de la maqueta, como delegó el usuario.
- Conservar íntegro el contenido real existente (apps RadioHub, Sudoku+, 4Line, 2048 Puzzle, PuzzleHub; artículos y devlogs publicados). No se crea contenido ficticio: las apps QRKit, TapFlow y HabitTrack de la maqueta NO se implementan.
- Sustituir la imaginería fotográfica de la maqueta por fotos de stock libres (Unsplash/Pexels) de estilo equivalente (montaña/atardecer), optimizadas y con atribución cuando la licencia lo requiera.
- Mantener la paridad ES/EN con los checks existentes (`src/i18n-parity-check.test.ts`, `scripts/i18n-parity-check.ts`).

---

## 2. User Stories

1. **As a** visitante, **I want to** ver la Home idéntica a la maqueta (hero con foto de montaña, fila de 4 pilares, "Proyecto destacado" con RadioHub, "Últimos artículos" en 3 columnas con chips Blog/Devlog) **so that** perciba un portfolio profesional y coherente con la marca.
2. **As a** visitante, **I want to** explorar la página Aplicaciones con chips de categoría, grid de tarjetas de las apps reales y sección destacada de RadioHub con sus características **so that** encuentre el catálogo de apps rápidamente.
3. **As a** visitante, **I want to** usar el Blog con buscador, chips de tags y listado editorial de artículos reales (miniatura, título, resumen, fecha, tiempo de lectura y badge de tag) **so that** localice contenido técnico relevante.
4. **As a** visitante, **I want to** leer el Devlog con chips de filtro, entrada destacada y grid de entradas reales **so that** siga la evolución de los proyectos.
5. **As a** visitante, **I want to** ver Sobre mí con foto de portada, biografía, stats reales del sitio, bloque "En qué trabajo" y CTA "¿Hablamos?" **so that** conozca a ArceApps y pueda contactar.
6. **As a** visitante, **I want to** recorrer las páginas no mostradas en la maqueta (Proyectos, Contacto, detalle de app, artículo, devlog y proyecto, series, cookies, privacidad, 404 y búsqueda) con el mismo lenguaje visual **so that** la experiencia sea coherente en todo el sitio.
7. **As a** visitante, **I want to** alternar entre modo claro y modo oscuro con la misma composición que la maqueta en ambas **so that** el diseño sea fiel en cualquiera de los dos temas.
8. **As a** visitante en móvil, **I want to** ver el mismo lenguaje visual adaptado a pantallas pequeñas (incluido el menú móvil) **so that** la fidelidad no dependa del dispositivo.
9. **As a** visitante, **I want to** navegar con "Sobre mí" incluido en el header **so that** acceda a esa página desde cualquier punto.
10. **As a** autor, **I want to** que el contenido publicado (apps, artículos, devlogs) no sea alterado por el rediseño **so that** la información real se preserve.
11. **As a** mantenedor, **I want to** conservar la paridad ES/EN y los contratos de test existentes **so that** el sitio no regresione en calidad.

---

## 3. Architectural Decisions

### Module Architecture
- **Tokens de diseño** (`src/styles/global.css`, bloque `@theme`): paleta medida de la maqueta — acento teal `#038D90` (claro) y `#00ACB0` (oscuro), fondo claro `#FCFCFC`, tarjeta dark `#0E171D` — conservando los nombres semánticos existentes (`--color-primary`, `--color-surface`, `--color-border`, `--color-dark-*`, etc.) para minimizar el blast radius en los componentes que ya los consumen.
- **Header** (`src/components/Header.astro`): añadir ítem "Sobre mí" a `navItems` (ES: `/es/about-me`, EN: `/about-me`) respetando `isPathActive`, y alinear estilos del nav/búsqueda/toggle de idioma y tema con la maqueta.
- **Home**: `HomeHero.astro` con foto de montaña a sangre + overlay degradado + contenido a la izquierda; fila de 4 pilares; `HomeFeaturedWork.astro` como split-card destacada (RadioHub real con `heroImage`, `icon`, `googlePlayUrl`, `screenshots` del frontmatter); "Últimos artículos" con chips Blog/Devlog y grid de 3 tarjetas; CTA y footer con el mismo lenguaje.
- **Aplicaciones** (`src/pages/apps/index.astro` + `src/components/AppCard.astro`/`AppGallery.astro`): chips de categoría derivados de tags reales, grid de tarjetas (icono, título, descripción, badges Google Play/Android, flecha) y sección destacada RadioHub con 4 características reales derivadas de su contenido.
- **Blog** (`src/pages/blog/[...page].astro` + `src/components/BlogCard.astro`): buscador existente (`Search.astro`), chips de tags reales, listado en filas con miniatura, resumen, fecha, tiempo de lectura y badge.
- **Devlog** (`src/pages/devlog/index.astro` + `src/components/pages/DevlogIndexPage.astro`): chips, tarjeta destacada con imagen grande y badge, grid de entradas.
- **Sobre mí** (`src/components/pages/AboutPage.astro`): foto de portada, bio, stats calculados del contenido real (5 apps publicadas, 162 artículos ES, 3 proyectos open source), bloque "En qué trabajo" y CTA "¿Hablamos?" con botón a Contacto.
- **Superficies derivadas** (Proyectos, Contacto, detalle de app/artículo/devlog/proyecto, series, cookies, privacidad, 404, búsqueda): reutilizan tokens y patrones de tarjeta/tipografía de las pantallas maquetadas.
- **Imaginería**: fotos de stock libres (Unsplash/Pexels) para hero y Sobre mí, servidas con optimización existente; si la descarga o licencia no es viable, fallback documentado a `public/images/portfolio-landscape.svg`.
- **i18n**: toda string nueva de UI en `src/i18n/ui.ts` (ES y EN); el nav usa `nav.about` con valor "Sobre mí" (ES) / "About me" (EN).

### Verification Seams (Costuras)
- **Contratos DOM/estructura** (vitest): `src/styles/design-contract.test.ts` y `src/components/*-contract.test.ts` — se amplían/crean con aserciones de orden de secciones, clases de tokens literales y elementos clave por pantalla.
- **Tokens literales**: aserciones sobre `src/styles/global.css` (colores exactos de la paleta medida).
- **Capturas comparativas**: `scripts/portfolio-visual-qa.mjs` (ES/EN × móvil/escritorio × claro/oscuro) genera el pliego para el Gate UA.
- **Suite completa**: `pnpm test` y `pnpm build` (idénticos a Content CI).

### Avoiding Side Effects
- No se modifica `src/content/**` (contenido real intacto); solo presentación.
- No se cambian rutas URL, `CNAME`, RSS, sitemaps ni lógica de publicación (`src/utils/publishing.ts`).
- Los cambios de estilo se encapsulan en tokens y componentes; los contratos de test existentes solo se actualizan cuando el cambio visual es intencional y aprobado.
- Sin nuevas dependencias npm sin `checkpoint:human-verify` previo.

---

## 4. System Constraints (Must-NOTs)

- El código NO DEBE modificar archivos de `src/content/**` ni crear apps/artículos ficticios (QRKit, TapFlow, HabitTrack y titulares de la maqueta quedan fuera).
- NO SE DEBE cambiar ninguna ruta URL ni romper enlaces internos existentes.
- NO SE DEBE eliminar la paridad ES/EN ni los checks de i18n.
- NO SE DEBE introducir ninguna dependencia npm nueva sin checkpoint de verificación humana previa.
- NO SE DEBE exigir pixel-diff literal contra la maqueta como criterio de aceptación (el contenido real difiere del de la maqueta): la fidelidad se verifica con checklist estructurada Given/When/Then y validación visual manual en el Gate UA.
- NO SE DEBE incrustar contenido de la maqueta que contradiga datos reales (p. ej. stats "Apps publicadas 4" cuando el contenido real publicado es 5).
- NO SE DEBE romper el contrato de accesibilidad existente (foco visible, aria en controles interactivos).

---

## 5. Edge Case Analysis

- **Empty/Null States**: listados sin resultados (búsqueda sin hits, blog/devlog/apps vacíos), apps sin `googlePlayUrl` o sin `heroImage` (fallback a placeholders existentes en `public/images`), posts sin `tags` (sin badge).
- **Error Boundaries**: si la descarga de fotos de stock falla o la licencia no es clara, se usa `public/images/portfolio-landscape.svg` y se documenta; el build no depende de la red.
- **Scale/Limits**: 162 artículos ES — el listado de Blog conserva paginación existente; los chips de tags cubren los tags más usados con desborde "Más +".
- **Responsive**: 390px, 768px, 1440px; el menú móvil existente se conserva con el nuevo lenguaje visual.
- **Tema oscuro**: todos los tokens nuevos con contraste AA sobre `--color-dark-surface`.
- **i18n**: textos de UI nuevos con paridad exacta ES/EN (verificado por `src/i18n-parity-check.test.ts`).

---

## 6. Out of Scope

- Crear el contenido ficticio que muestra la maqueta (apps QRKit/TapFlow/HabitTrack, titulares de artículos inventados).
- Redactar, editar o traducir el contenido editorial existente.
- Cambios en lógica de publicación, RSS, sitemaps, OG images más allá de lo que el diseño exija.
- Migración de framework o de sistema de estilos (se mantiene Astro 5 + Tailwind 4 + Material Icons).
- Nuevos idiomas además de ES/EN.
- Rendimiento/SEO estructural salvo regresiones introducidas por el rediseño.
