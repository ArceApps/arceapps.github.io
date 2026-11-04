# Rediseño visual 1:1 — Diseños aprobados

**Status:** APPROVED (deriva de la maqueta y de las decisiones del grill-me: solo diseño + contenido real; stock libre; checklist + Gate UA)
**Feature ID:** 20261029-rediseno-web-visual-1-1

## Paleta medida (literales de contrato)
| Token | Modo claro | Modo oscuro | Origen |
|---|---|---|---|
| `--color-primary` (CTA/links/activo) | `#038D90` | `#00ACB0` (override `.dark`) | moda teal medida en la maqueta |
| `--color-secondary` (estrella, acentos cálidos) | `#FF9800` | `#FF9800` | se conserva (RadioHub icon/star) |
| body bg | `#FCFCFC` | `#091117` | modas medidas |
| `--color-surface` / tarjeta | `#FFFFFF` | `#0E171D` (raised) | modas medidas |
| `--color-border` | `#E5E7EB` | `#1F333E` | medido ≈ `#E4E6E7`; se conserva `#E5E7EB` |
| `--color-content` | `#0B1014` | `#F3F4F6` | moda texto medida (claro) |
| `--color-content-muted` | `#4B5563` | `#BDC0C2` | medido dark `#BDC0C2` |

Otros: iconos de pilares emerald `#059669`, naranja `#F97316`, teal `#038C8E`, rojo `#E11D48` con fondos tintados al 10%.

## Tipografía
Inter Variable (conservar). Titulares font-medium/extrabold según maqueta (H1 hero extrabold, headings de sección bold). Meta y captions en `--color-content-muted`.

## Estructura por pantalla (orden de secciones)
- **Home:** Header → Hero(foto+eyebrow+H1+sub+2CTA) → Pilares(4) → "Proyecto destacado"(split-card + flechas) → "Últimos artículos"(chips Blog/Devlog + 3 cards + "Ver todas →") → "¿Hablamos?" → Footer.
- **Aplicaciones:** Header → Intro("Aplicaciones Android"+sub) → Chips categoría → Grid apps (2 col) → Destacada RadioHub("La radio, como te gusta" + 4 features) → Footer.
- **Blog:** Header → Eyebrow "BLOG" + H1 "Artículos técnicos y guías" → Buscador → Chips tags ("Más +") → Filas artículo (thumb, título, resumen, fecha · min, badge) → Paginación → Footer.
- **Devlog:** Header → H1 "Devlog" + intro → Chips → Destacada (imagen grande, badge, título, resumen, meta, "Leer artículo →") → Grid 2 col → Footer.
- **Sobre mí:** Header → H1 "Hola, soy ArceApps" + intro → Foto portada → Bio → Stats(3) → "En qué trabajo"(4 ítems) → "¿Hablamos?"(botón Contactar) → Footer.
- **Modo oscuro:** misma composición; tokens dark; acento `#00ACB0`.
- **Móvil:** single column; chips scrollables; menú móvil existente con nuevo estilo.

## Mapa de archivos
| Archivo | Responsabilidad |
|---|---|
| `src/styles/global.css` | tokens `@theme`, overrides `.dark` de acento, utilidades |
| `src/styles/design-contract.test.ts` | contrato de literales de paleta |
| `src/components/Header.astro` | nav 7 ítems, buscador, toggles |
| `src/components/Footer.astro` | footer + atribución de fotos |
| `src/components/home/HomeHero.astro` | hero fotográfico |
| `src/components/home/HomePillars.astro` | fila de 4 pilares (nuevo) |
| `src/components/home/HomeFeaturedWork.astro` | split-card destacada + carrusel |
| `src/components/home/HomeArticles.astro` | "Últimos artículos" con chips (nuevo; sustituye HomeBlog/HomeDevlog) |
| `src/components/home/HomeCta.astro` | "¿Hablamos?" |
| `src/components/pages/HomePage.astro` | composición de la Home |
| `src/components/AppCard.astro`, `AppGallery.astro`, `pages/apps/index.astro` | chips, grid, destacada de Apps |
| `src/components/BlogCard.astro`, `pages/blog/[...page].astro` | buscador, chips, filas |
| `src/components/pages/DevlogIndexPage.astro`, `pages/devlog/index.astro` | chips, destacada, grid |
| `src/components/pages/AboutPage.astro` | hero foto, stats, "En qué trabajo", CTA |
| `src/pages/projects.astro`, `contact.astro`, `404.astro`, `cookies.astro`, `privacy-policy.astro`, `series/*`, `search-index` | superficies derivadas |
| `src/pages/{apps,blog,devlog,projects}/[...]` | detalles derivados |
| `src/i18n/ui.ts` | strings ES/EN |
| `src/assets/hero-mountain-sunset.jpg`, `src/assets/about-mountains.jpg` | fotos stock (fallback: `public/images/portfolio-landscape.svg`) |
| `scripts/portfolio-visual-qa.mjs` | pliego comparativo |

## Flujo de datos
`getCollection("apps"|"blog"|"devlog"|"projects")` → filtros `draft`/`isPublished`/lang → orden por `pubDate` → props de componentes. Stats de Sobre mí: conteos en build. Tiempo de lectura: palabras del cuerpo / 200. Chips: frecuencia de `tags` reales.

## Decisiones (log)
- **D1:** hero = foto a sangre con overlay + contenido izquierda (no split-columnas) — medida de la maqueta.
- **D2:** sin ratings reales → chips de tags + badge Android en vez de "N reseñas".
- **D3:** stats dinámicos reales (5 / 162 / 3) en lugar de los textos literales de la maqueta.
- **D4:** acento dark `#00ACB0` mediante overrides `:root.dark` de `bg-primary/text-primary/border-primary` (patrón existente).
- **D5:** fotos stock libres con atribución en Footer; fallback SVG documentado si la descarga falla.
- **D6:** chips derivados de tags reales con desborde "Más +"; "Blog/Devlog" en Home como filtro en cliente de dos listas.
- **D7:** "Últimos artículos" absorbe las secciones HomeBlog/HomeDevlog actuales (composición de la maqueta).
