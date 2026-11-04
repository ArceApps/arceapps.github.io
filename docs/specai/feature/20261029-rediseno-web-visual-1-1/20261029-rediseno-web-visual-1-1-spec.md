# Rediseño visual 1:1 — Contrato funcional

**Status:** APPROVED
**Delta status:** applied
**Feature ID:** 20261029-rediseno-web-visual-1-1
**Fuente de diseño:** `.orca/drops/Presentación UI de ArceApps en modo claro y oscuro.png` (10 pantallas: Home, Aplicaciones, Blog, Devlog, Sobre mí × claro/oscuro)
**PRD:** `20261029-rediseno-web-visual-1-1-prd.md`

## Glosario
- **Maqueta:** el PNG aprobado, única fuente de verdad visual (no hay Figma).
- **Pantalla maquetada:** cada una de las 5 vistas de la maqueta en modo claro y modo oscuro.
- **Superficie derivada:** vista del sitio no incluida en la maqueta; se diseña con el mismo lenguaje visual.
- **Contenido real:** colecciones `src/content/{apps,blog,devlog,projects}/{es,en}`; no se alteran.
- **Pliego comparativo:** conjunto de capturas (ES/EN × móvil/escritorio × claro/oscuro) para validación visual manual en el Gate UA.

## Mapeo de contenido (maqueta → real)
| Elemento de la maqueta | Fuente real |
|---|---|
| Apps QRKit, TapFlow, HabitTrack | NO se implementan (fuera de alcance); el grid usa las 5 apps reales |
| "Proyecto destacado: RadioHub" | `src/content/apps/*/radiohub.md` (flagship) |
| "⭐ 6 reseñas" en destacado | Sin dato real de reseñas → chips de tags reales (`Music`, `Radio`, `Streaming`) + badge `Android` |
| Titulares de artículos de la maqueta | Titulares reales más recientes de `blog` |
| Chips de Blog (`Android`, `Kotlin`, `IA`…) | Tags reales más frecuentes de `blog` + desborde "Más +" |
| Chips de Devlog (`Coucou`, `RadioHub`…) | Tags/series reales más frecuentes de `devlog` + "Otros" |
| Stats "4 apps / 50+ artículos / 3 proyectos" | Conteo dinámico real: 5 apps, 162 artículos ES, 3 proyectos |
| "Miles de emisoras / Favoritos / Sin registros / Material 3" | Características reales de `radiohub.md` (30,000+ emisoras, ecualizador, temporizador, Material 3) |
| Fecha · tiempo de lectura | `pubDate` + tiempo de lectura estimado del cuerpo |
| Fotos de montaña/atardecer | Stock libre (Unsplash/Pexels) con atribución; fallback `public/images/portfolio-landscape.svg` |

## Requisitos funcionales
- **R1 — Header global:** nav con 7 ítems (Inicio, Proyectos, Apps, Blog, Devlog, Sobre mí, Contacto), buscador, toggle ES/EN y toggle de tema; ítem activo por `isPathActive`. Cubierto por `C2`. [verified]
- **R2 — Home hero:** foto de montaña a sangre con overlay; eyebrow "DESARROLLO · ANDROID · IA · PROYECTOS"; titular "Software independiente que resuelve problemas reales"; subtítulo; CTA primario "Explorar proyectos →" (relleno teal) y CTA secundario "Leer artículos" (contorno). `C3`. [verified]
- **R3 — Home pilares:** fila de 4 pilares (Apps Android, Herramientas de IA, Proyectos open source, Contenido técnico) con icono en cuadrado tintado, título y subtítulo, separados por divisores. `C3`. [verified]
- **R4 — Home Proyecto destacado:** split-card con icono de app, título, meta real (chips de tags + badge Android), descripción, botones "Ver proyecto →" y "Ver en Google Play", screenshots a la derecha y flechas de carrusel. `C3`. [verified]
- **R5 — Home Últimos artículos:** chips "Blog"/"Devlog" (filtrado en cliente), grid de 3 tarjetas (imagen, título, fecha · tiempo de lectura) y enlace "Ver todas →". `C3`. [verified]
- **R6 — Home CTA + Footer:** bloque "¿Hablamos?" con botón Contactar y footer con logo, navegación, redes y atribución de fotos; mismo lenguaje visual. `C3`, `C8`. [verified]
- **R7 — Aplicaciones:** intro, chips de categoría derivados de tags reales, grid de tarjetas de apps (icono, título, descripción, badges, flecha) y sección destacada de RadioHub ("La radio, como te gusta") con 4 características reales. `C4`. [verified]
- **R8 — Blog:** eyebrow "BLOG", titular "Artículos técnicos y guías", buscador, chips de tags con "Más +", filas editoriales (miniatura, título, resumen, fecha · lectura, badge de tag). `C5`. [verified]
- **R9 — Devlog:** titular "Devlog", intro, chips de filtro, tarjeta destacada (imagen grande, badge, título, resumen, fecha · lectura, "Leer artículo →") y grid de tarjetas. `C6`. [verified]
- **R10 — Sobre mí:** titular "Hola, soy ArceApps", foto de portada, bio, stats dinámicos (apps, artículos, proyectos), bloque "En qué trabajo" (4 ítems con icono) y CTA "¿Hablamos?" con botón Contactar. `C7`. [verified]
- **R11 — Superficies derivadas:** Proyectos, Contacto, detalle de app/artículo/devlog/proyecto, series, cookies, privacidad, 404 y búsqueda con el mismo lenguaje visual (tipografía, tokens, tarjetas, botones). `C8`. [verified]
- **R12 — Modos y paridad:** todas las pantallas en claro y oscuro; ES/EN con paridad; contrastes AA. `C1`, `C9`. [verified]

## Delta contra el estado actual
- `global.css`: paleta `@theme` y body (`#F8F9FA` → `#FCFCFC`; `#007F7D` → `#038D90`; dark accent `#2DD4BF` → `#00ACB0`; dark raised `#111E26` → `#0E171D`; content `#111827` → `#0B1014`).
- `Header.astro`: + ítem `nav.about`; etiquetas del nav alineadas con la maqueta ("Sobre mí").
- `src/i18n/ui.ts`: `nav.about` = "Sobre mí" (ES) / "About me" (EN); nuevas claves de UI (chips, stats, CTA, footer).
- `HomeHero.astro`: de hero centrado sin foto a hero fotográfico a sangre con contenido a la izquierda.
- `HomePage.astro`: secciones nuevas/renovadas (pilares, destacado, artículos con chips); se retiren HomeDevlog como sección independiente (absorbida por chips Blog/Devlog).
- `apps/index.astro`, `BlogCard.astro`, `DevlogIndexPage.astro`, `AboutPage.astro`: reconstruidos según la maqueta.
- Superficies derivadas: adaptación de estilo, sin cambios de URL ni de contenido.

## Fuera de alcance
Ver PRD §6. Sin cambios de contenido, sin dependencias nuevas, sin pixel-diff obligatorio.
