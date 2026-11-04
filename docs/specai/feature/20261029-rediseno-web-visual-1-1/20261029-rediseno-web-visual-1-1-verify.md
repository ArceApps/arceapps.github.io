# Rediseño visual 1:1 — Verification Contract

**Goal ID:** `G-rediseno-web-visual-1-1`
**Goal:** Las cinco pantallas de la maqueta (Home, Aplicaciones, Blog, Devlog, Sobre mí) se renderizan 1:1 en modo claro y oscuro y el resto de superficies usan el mismo lenguaje visual, con contenido real intacto y paridad ES/EN.
**Goal completion invariant:** `GOAL_COMPLETE` iff every criterion is PASS, every task is completed, no corrective task is open, and the latest evidence belongs to the current `HEAD`.
**Status:** `PASS`
**Feature ID:** 20261029-rediseno-web-visual-1-1

## Acceptance Criteria

### C1 — Paleta de tokens de la maqueta
- **Requirement:** Los tokens de `global.css` declaran la paleta medida de la maqueta y el acento dark `#00ACB0`.
- **Criterion type:** `MECHANICAL`
- **Invariant:** `src/styles/global.css` contiene exactamente los literales `#038D90`, `#0B1014`, `#0E171D`, `#BDC0C2`, `#FCFCFC` y `#00ACB0`, y no conserva `#007F7D`, `#F8F9FA`, `#111E26`, `#9CA3AF` ni `#2DD4BF`.
- **Verification seam:** `src/styles/global.css`, bloque `@theme` y `@layer utilities`; `src/styles/design-contract.test.ts`
- **Given:** el archivo `src/styles/global.css` del HEAD actual
- **When:** se ejecuta el contrato de diseño
- **Then:** el test `paleta de la maqueta declarada en @theme` y el test `override dark del acento a #00ACB0` pasan y el contenido contiene los seis literales objetivo
- **Tasks:** `T1`, `T2`, `T24`, `T25`, `T26`
- **Verification command:** `pnpm vitest run src/styles/design-contract.test.ts`
- **Expected:** PASS con ambas pruebas de paleta y acento dark
- **Evidence:** `src/styles/global.css` declara los seis literales objetivo de la paleta y el contrato de diseño pasa 8/8, incluido el override dark del acento a `#00ACB0`.
- **Status:** `PASS`

### C2 — Navegacion global con Sobre mi
- **Requirement:** El header muestra 7 ítems (Inicio, Proyectos, Apps, Blog, Devlog, Sobre mí, Contacto) en ES y EN, con buscador, toggle de idioma y toggle de tema.
- **Criterion type:** `BEHAVIOR`
- **Invariant:** `navItems` contiene el ítem `nav.about` con hrefs `/about-me` y `/es/about-me`, y las etiquetas i18n son "Sobre mí" (ES) y "About me" (EN).
- **Verification seam:** `src/components/Header.astro`, array `navItems`; `src/i18n/ui.ts`, claves `nav.about`; `src/components/header-ux-contract.test.ts`
- **Given:** el header del HEAD actual en ambos idiomas
- **When:** se ejecuta el contrato de header
- **Then:** el test `nav de 7 items con Sobre mi` pasa y el contrato previo de navegación responsive sigue pasando
- **Tasks:** `T4`
- **Verification command:** `pnpm vitest run src/components/header-ux-contract.test.ts`
- **Expected:** PASS en todos los tests del archivo
- **Evidence:** Header con 7 ítems verificados en ES y EN; `src/components/header-ux-contract.test.ts` pasa 2/2 con buscador y toggles de idioma y tema.
- **Status:** `PASS`

### C3 — Home 1:1 con la maqueta
- **Requirement:** La Home contiene hero fotográfico con eyebrow, titular y 2 CTAs; fila de 4 pilares; "Proyecto destacado" split-card con carrusel; "Últimos artículos" con chips Blog/Devlog y CTA final.
- **Criterion type:** `VISUAL`
- **Invariant:** El orden de secciones de la Home es hero → pilares → proyecto destacado → últimos artículos → CTA, con las clases de tokens nuevos y las fotos stock referenciadas.
- **Verification seam:** `src/components/home/HomeHero.astro`, `src/components/home/HomePillars.astro`, `src/components/home/HomeFeaturedWork.astro`, `src/components/home/HomeBlog.astro`, `src/components/home/HomeCta.astro`; `src/components/pages/home-contract.test.ts`; `src/components/pages/imagery-contract.test.ts`
- **Given:** los componentes de la Home y los assets fotográficos del HEAD actual
- **When:** se ejecutan los contratos de home e imaginería
- **Then:** pasan los tests `hero fotografico con CTAs de la maqueta`, `fila de 4 pilares de la home`, `split-card Proyecto destacado con carrusel`, `ultimos articulos con chips Blog y Devlog`, `cta final Hablamos de la home` y `fotos stock presentes en src/assets`
- **Tasks:** `T3`, `T6`, `T7`, `T8`, `T9`, `T10`, `T29`
- **Verification command:** `pnpm vitest run src/components/pages/home-contract.test.ts src/components/pages/imagery-contract.test.ts`
- **Expected:** PASS en los seis tests nombrados
- **Evidence:** `src/components/pages/home-contract.test.ts` pasa 14/14 y `imagery-contract.test.ts` 1/1, cubriendo hero, pilares, split-card con carrusel, artículos con chips y CTA final.
- **Status:** `PASS`

### C4 — Aplicaciones 1:1 con la maqueta
- **Requirement:** La página Aplicaciones contiene intro, chips de categoría derivados de tags reales, grid de tarjetas con badges y flecha, y destacada de RadioHub con 4 características reales.
- **Criterion type:** `BEHAVIOR`
- **Invariant:** Los chips derivan de tags reales (sin categorías inventadas) y la destacada usa datos de `radiohub.md` sin alterar `src/content`.
- **Verification seam:** `src/pages/apps/index.astro`, `src/components/AppCard.astro`, `src/components/AppGallery.astro`; `src/components/pages/apps-contract.test.ts`
- **Given:** la página de Aplicaciones y las 5 apps reales del HEAD actual
- **When:** se ejecuta el contrato de apps
- **Then:** pasan `chips de categoria de aplicaciones`, `grid de tarjetas de aplicaciones` y `destacada RadioHub con 4 caracteristicas`
- **Tasks:** `T11`, `T12`, `T13`, `T30`
- **Verification command:** `pnpm vitest run src/components/pages/apps-contract.test.ts`
- **Expected:** PASS en los tres tests nombrados
- **Evidence:** `src/components/pages/apps-contract.test.ts` pasa 7/7; chips derivados de tags reales y destacada RadioHub con 4 características, contenido intacto.
- **Status:** `PASS`

### C5 — Blog 1:1 con la maqueta
- **Requirement:** El Blog contiene eyebrow "BLOG", titular "Artículos técnicos y guías", buscador, chips de tags con "Más +" y filas editoriales con miniatura, resumen, fecha · lectura estimada y badge de tag.
- **Criterion type:** `BEHAVIOR`
- **Invariant:** El listado usa solo contenido real de `blog` y conserva la paginación existente.
- **Verification seam:** `src/pages/blog/[...page].astro`, `src/components/BlogCard.astro`; `src/components/pages/blog-contract.test.ts`
- **Given:** el listado de Blog con los artículos reales del HEAD actual
- **When:** se ejecuta el contrato de blog
- **Then:** pasan `buscador y chips de tags del blog` y `filas editoriales del blog con meta`
- **Tasks:** `T14`, `T15`
- **Verification command:** `pnpm vitest run src/components/pages/blog-contract.test.ts`
- **Expected:** PASS en los dos tests nombrados
- **Evidence:** `src/components/pages/blog-contract.test.ts` pasa 5/5; buscador, chips con "Más +" y filas editoriales sobre contenido real con paginación conservada.
- **Status:** `PASS`

### C6 — Devlog 1:1 con la maqueta
- **Requirement:** El Devlog contiene titular "Devlog", intro, chips de filtro derivados de tags reales, entrada destacada con badge y "Leer artículo →", y grid de 2 columnas con el resto de entradas.
- **Criterion type:** `BEHAVIOR`
- **Invariant:** La destacada es la entrada más reciente real y el grid excluye dicha entrada; sin contenido inventado.
- **Verification seam:** `src/components/pages/DevlogIndexPage.astro`, `src/pages/devlog/index.astro`; `src/components/pages/devlog-contract.test.ts`
- **Given:** el Devlog con las entradas reales del HEAD actual
- **When:** se ejecuta el contrato de devlog
- **Then:** pasan `devlog con chips y entrada destacada` y `grid de tarjetas del devlog`
- **Tasks:** `T16`, `T17`
- **Verification command:** `pnpm vitest run src/components/pages/devlog-contract.test.ts`
- **Expected:** PASS en los dos tests nombrados
- **Evidence:** `src/components/pages/devlog-contract.test.ts` pasa 6/6; destacada como entrada más reciente real y grid que la excluye, sin contenido inventado.
- **Status:** `PASS`

### C7 — Sobre mi 1:1 con la maqueta
- **Requirement:** Sobre mí contiene "Hola, soy ArceApps", foto de portada, bio, stats dinámicos reales, bloque "En qué trabajo" con 4 ítems y CTA "¿Hablamos?" con botón Contactar.
- **Criterion type:** `VISUAL`
- **Invariant:** Los stats reflejan conteos reales dinámicos (apps, artículos, proyectos publicados) y no literales de la maqueta.
- **Verification seam:** `src/components/pages/AboutPage.astro`; `src/components/pages/about-ux-contract.test.ts`
- **Given:** la página Sobre mí y las colecciones reales del HEAD actual
- **When:** se ejecuta el contrato de about
- **Then:** pasan `sobre mi con foto y stats dinamicos` y `bloque en que trabajo y cta contactar`
- **Tasks:** `T3`, `T18`, `T19`
- **Verification command:** `pnpm vitest run src/components/pages/about-ux-contract.test.ts`
- **Expected:** PASS en los dos tests nombrados
- **Evidence:** `src/components/pages/about-ux-contract.test.ts` pasa 9/9; foto de portada, stats dinámicos desde colecciones reales, bloque "En qué trabajo" y CTA Contactar.
- **Status:** `PASS`

### C8 — Superficies derivadas con el mismo lenguaje visual
- **Requirement:** Footer, Proyectos, Contacto, los 4 tipos de detalle y las superficies secundarias (404, cookies, privacidad, series) usan los tokens y patrones de la maqueta.
- **Criterion type:** `BEHAVIOR`
- **Invariant:** Ninguna superficie derivada conserva clases de color legadas de la paleta vieja y ninguna ruta URL cambia.
- **Verification seam:** `src/components/Footer.astro`, `src/pages/projects.astro`, `src/pages/contact.astro`, `src/pages/{apps,blog,devlog,projects}/*.astro`, `src/pages/{404,cookies,privacy-policy}.astro`, `src/pages/series/[slug].astro`; `src/components/pages/derived-surfaces-contract.test.ts`
- **Given:** las superficies derivadas del HEAD actual
- **When:** se ejecuta el contrato de superficies derivadas
- **Then:** pasan `footer con atribucion de fotos stock`, `proyectos y contacto con lenguaje visual`, `paginas de detalle con lenguaje visual` y `superficies secundarias con lenguaje visual`
- **Tasks:** `T5`, `T20`, `T21`, `T22`, `T25`, `T27`, `T28`, `T30`
- **Verification command:** `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts`
- **Expected:** PASS en los cuatro tests nombrados
- **Evidence:** `src/components/pages/derived-surfaces-contract.test.ts` pasa 9/9 con sweeps anti-regresión; footer incluye la atribución de fotos stock y ninguna ruta cambia.
- **Status:** `PASS`

### C9 — Paridad ES/EN y suite completa en verde
- **Requirement:** La paridad ES/EN se conserva y la suite completa (unit tests + build) pasa en el HEAD final.
- **Criterion type:** `NONFUNCTIONAL`
- **Invariant:** Ningún cambio rompe `src/i18n-parity-check.test.ts`, los contratos existentes ni `astro build`; las claves i18n nuevas existen en ambos idiomas.
- **Verification seam:** suite `vitest` completa y build de Astro; `src/i18n/ui.ts`
- **Given:** el repositorio completo del HEAD actual
- **When:** se ejecutan la suite completa y el build
- **Then:** `pnpm test` termina sin fallos y `pnpm build` completa el build de Astro sin errores
- **Tasks:** `T1`, `T2`, `T3`, `T4`, `T5`, `T6`, `T7`, `T8`, `T9`, `T10`, `T11`, `T12`, `T13`, `T14`, `T15`, `T16`, `T17`, `T18`, `T19`, `T20`, `T21`, `T22`, `T23`, `T24`, `T25`, `T26`, `T27`, `T28`, `T29`, `T30`
- **Verification command:** `pnpm test && pnpm build`
- **Expected:** todos los tests PASS y build completado
- **Evidence:** `pnpm test` pasa 238/238 y `pnpm build` completa con 1267 páginas generadas y sin errores.
- **Status:** `PASS`

### C10 — Pliego comparativo para el Gate UA
- **Requirement:** Existe un pliego de capturas comparativas (ES/EN × móvil/escritorio × claro/oscuro) con reporte asociado para la validación visual manual.
- **Criterion type:** `VISUAL`
- **Invariant:** `artifacts/portfolio-visual-qa/` contiene el reporte y las capturas generadas desde el HEAD actual.
- **Verification seam:** `scripts/portfolio-visual-qa.mjs`; `artifacts/portfolio-visual-qa/portfolio-visual-report.md`
- **Given:** el build del HEAD actual servido con `pnpm preview`
- **When:** se ejecuta el QA visual
- **Then:** se genera `artifacts/portfolio-visual-qa/portfolio-visual-report.md` con capturas de las 5 pantallas en las 4 combinaciones de tamaño y tema
- **Tasks:** `T23`
- **Verification command:** `node scripts/portfolio-visual-qa.mjs`
- **Expected:** reporte y capturas generados sin errores de render
- **Evidence:** Pliego con 40 capturas y `report.json` con 0 desbordamientos; reporte generado desde el árbol de código de `fc9d879`, idéntico al HEAD salvo el propio reporte.
- **Status:** `PASS`

## Coverage Matrix

| Criterion | Task IDs | Verification command | Status |
|---|---|---|---|
| `C1` | `T1`, `T2`, `T24`, `T25`, `T26` | `pnpm vitest run src/styles/design-contract.test.ts` | `PASS` |
| `C2` | `T4` | `pnpm vitest run src/components/header-ux-contract.test.ts` | `PASS` |
| `C3` | `T3`, `T6`, `T7`, `T8`, `T9`, `T10`, `T29` | `pnpm vitest run src/components/pages/home-contract.test.ts src/components/pages/imagery-contract.test.ts` | `PASS` |
| `C4` | `T11`, `T12`, `T13`, `T30` | `pnpm vitest run src/components/pages/apps-contract.test.ts` | `PASS` |
| `C5` | `T14`, `T15` | `pnpm vitest run src/components/pages/blog-contract.test.ts` | `PASS` |
| `C6` | `T16`, `T17` | `pnpm vitest run src/components/pages/devlog-contract.test.ts` | `PASS` |
| `C7` | `T3`, `T18`, `T19` | `pnpm vitest run src/components/pages/about-ux-contract.test.ts` | `PASS` |
| `C8` | `T5`, `T20`, `T21`, `T22`, `T25`, `T27`, `T28`, `T30` | `pnpm vitest run src/components/pages/derived-surfaces-contract.test.ts` | `PASS` |
| `C9` | `T1`, `T2`, `T3`, `T4`, `T5`, `T6`, `T7`, `T8`, `T9`, `T10`, `T11`, `T12`, `T13`, `T14`, `T15`, `T16`, `T17`, `T18`, `T19`, `T20`, `T21`, `T22`, `T23`, `T24`, `T25`, `T26`, `T27`, `T28`, `T29`, `T30` | `pnpm test && pnpm build` | `PASS` |
| `C10` | `T23` | `node scripts/portfolio-visual-qa.mjs` | `PASS` |

## Verification State

- **Verifier verdict:** `PASS`
**Verifier:** PASS
- **Last verified HEAD:** `f215e23`
- **Open failures:** `none`
- **Corrective loop:** `none`
- **Gate UA:** accepted 2026-10-30 02:55 (texto: 'acepto')
