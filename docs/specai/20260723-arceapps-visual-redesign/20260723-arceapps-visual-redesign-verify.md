# Rediseño visual de ArceApps — Verification Plan

Este archivo es la única fuente de verdad de los criterios de aceptación de la feature. Ningún criterio se considera verificado sin evidencia de comando, inspección visual o recorrido funcional.

## 1. Baseline conocido antes de implementar

- `pnpm build`: PASS; genera 1.043 páginas estáticas y 301 imágenes OG, con warning conocido porque `CONTACT_FORM_KEY` no está definido.
- `pnpm test`: FAIL baseline; 2 ficheros fallan, con 276 fallos y 111 tests correctos de 387. Los fallos conocidos están en `src/scripts/header.test.ts` y `src/utils/links-validation.test.ts`.
- La revisión local interactiva quedó limitada por el aislamiento del navegador integrado; la verificación final debe incluir una inspección visual local o de preview con capturas/recorrido documentado.

La implementación no puede aumentar el número de fallos, introducir nuevas rutas rotas ni convertir el warning de `CONTACT_FORM_KEY` en un error de build. Los fallos baseline no se presentan como resueltos por esta feature.

## 2. Contrato visual y tokens

- [x] `src/styles/global.css` declara tokens semánticos para colores de marca, superficies, contenido, bordes, foco, radios y elevación en claro y oscuro.
- [x] `rg -n "primary-dark|elevation-4" src` no encuentra usos activos de tokens inexistentes.
- [x] No existe hover global de `h1`–`h6` que cambie el peso tipográfico o el ancho del texto.
- [x] La UI usa teal `#018786` como estructura y orange `#FF9800` como acento, sin introducir una paleta paralela.
- [ ] Las superficies se limitan a una jerarquía coherente de página, raised/subtle y feature; no hay una card distinta por cada sección.

**Evidencia:** `rg`, inspección de `global.css`, `pnpm build` y recorrido visual en tema claro/oscuro.

## 3. Cards y composición

- [x] Existe `src/components/Card.astro` con variantes `article`, `app` y `feature`, props tipadas y estados de foco accesibles.
- [x] `BlogCard.astro`, `ProjectCard.astro` y `AppCard.astro` consumen la gramática común sin perder sus enlaces, imágenes, metadatos o datos de colección.
- [x] Existe `src/components/PageIntro.astro` y los listados de Apps, Blog y Bitácora comparten su estructura de encabezado.
- [ ] Las cards no dependen de hover para revelar título, CTA o información necesaria.
- [ ] No se observa overflow horizontal en retículas, tags, galerías o botones en widths móvil, tablet y desktop.

**Evidencia:** inspección estática de los componentes, `pnpm exec vitest run src/components/card-contract.test.ts` (3/3), contrato de listados 4/4, `pnpm build` (Astro exit 0, 1043 páginas), recorrido visual de listados EN/ES y revisión independiente CLEAN. La evidencia de esta tarea cubre encabezados y tarjetas de listados; permanecen pendientes las comprobaciones globales de hover, overflow y páginas de detalle.

## 4. Portada

- [x] La jerarquía visible es hero editorial, construcción real, apps destacadas, artículos recientes y CTA final.
- [x] El hero no contiene el mockup ficticio de teléfono, estadísticas simuladas ni textos de producto inventados.
- [x] La portada muestra contenido real de las colecciones actuales y conserva los anchors/enlaces públicos existentes.
- [x] La portada EN y ES usa la misma composición visual, con copy y rutas localizadas.
- [x] El CTA principal se distingue visualmente y conserva un nombre accesible.

**Evidencia de Task 5:** contrato de portada 3/3; build Astro exit 0 con 1043 páginas; recorrido visual de la portada EN/ES en desktop y de la portada ES en móvil a 360px, sin overflow horizontal. La inspección confirmó la jerarquía hero → construcción → apps → artículos → CTA, el contenido real y los anchors, la composición localizada y el CTA accesible. Esta evidencia se limita a la portada: siguen pendientes los criterios globales de responsive y las comprobaciones de listados y detalles que requieren más pantallas.

## 5. Navegación y listados

- [ ] El header desktop conserva navegación, idioma y tema sin competir visualmente con el contenido principal.
- [x] El menú móvil es un panel delimitado, anuncia su estado mediante `aria-expanded`/`aria-controls` y tiene foco visible.
- [x] El enlace activo se identifica por una señal adicional al color.
- [x] Apps, Blog y Bitácora mantienen filtros, paginación, tags, estados vacíos y enlaces correctos en EN/ES.
- [x] El teclado puede abrir, recorrer y cerrar la navegación sin quedar atrapado ni perder el foco de forma inesperada.

**Evidencia de Task 4:** panel móvil delimitado y localizado; estado activo con `aria-current` y borde; gestión de `aria-expanded`, `aria-controls`, `aria-hidden` y `data-state`; foco, Escape, click exterior y cleanup cubiertos. Header test 3/3 y build Astro exit 0 con 1043 páginas; code review CLEAN. El mock de `localStorage` solo estabiliza el entorno jsdom de Vitest y no modifica producción. Permanece pendiente el recorrido visual real EN/ES, por lo que no se valida todavía la competencia visual del header desktop ni los criterios de listados.

**Evidencia de Task 6:** Se conservaron `getCollection`, filtros de draft/fecha/locale, orden, paginación, tags, `slugify` y prefijos `/es`. Se localizaron filtros, etiquetas, contador de resultados, estados vacíos, paginación, `aria-label` y alt de portada. El contrato `src/components/listings-contract.test.ts` pasa 4/4; la revisión visual cubrió Apps EN, Blog EN/ES y Bitácora EN/ES en desktop, además de Bitácora ES a 360 px sin overflow (`scrollWidth=346`, `viewport=361`).

## 6. Detalle de app

- [x] El orden visual prioriza nombre, propuesta de valor, icono/hero, Google Play y prueba visual.
- [x] Rating, versión, fecha, tags y repositorio permanecen disponibles como metadatos secundarios.
- [x] Google Play es la acción primaria en las rutas EN y ES; los CTAs secundarios no la eclipsan.
- [x] Galería e imágenes se leen sin inclinación obligatoria, sin recorte inesperado y sin overflow horizontal.
- [x] `alt`, enlaces externos, foco y estados de tema son correctos.

**Evidencia de Task 7:** `src/components/app-detail-contract.test.ts` pasa 3/3. La revisión visual EN/ES en desktop y móvil confirma la secuencia nombre → propuesta de valor → hero → Google Play → prueba visual, con tags y metadatos agrupados como información secundaria. La revisión detectó y corrigió el orden visual alterado por reglas `order`, además del recorte inesperado del hero. La galería quedó estable, sin inclinación obligatoria ni overflow horizontal. Se comprobaron labels, `alt`, enlaces externos, foco, tema claro/oscuro y prefijos `/es`. `pnpm build` termina con Astro exit 0 y genera 1043 páginas; `git diff --check` pasa; revisión final CLEAN. El warning conocido `CONTACT_FORM_KEY` permanece como baseline.

## 7. Detalle de artículo y lectura

- [x] Breadcrumbs, progreso, tabla de contenidos, compartir y navegación de artículos continúan funcionando.
- [x] El contenido no está encerrado en una card pesada; la lectura usa una columna de 760px.
- [x] Las imágenes y medios pueden superar 500px cuando el viewport lo permite y nunca se desbordan.
- [x] Código, citas, tablas, enlaces, headings y contraste funcionan en tema claro y oscuro.
- [x] TOC, fechas, reading time, acciones y etiquetas están localizados en EN y ES.

**Evidencia de Task 8:** El contrato `blog-detail` pasa 3/3. `pnpm build` termina con exit 0 y genera 1043 páginas y 301 OG, conservando el warning `CONTACT_FORM_KEY`; `git diff --check` pasa. La revisión visual EN desktop a 1440px confirma reading column de 760px, grid 200/760, TOC con 45 enlaces, ausencia de overflow, `object-fit: contain` y ausencia de `main` anidado. La revisión visual ES móvil a 360px confirma `readingWidth=314px`, TOC móvil con 45 enlaces, aside oculto, ausencia de overflow, progreso activo y etiquetas localizadas. Code review CLEAN.

## 8. Internacionalización

- [ ] No quedan strings de UI hardcodeados para `Gallery`, `Live Demo`, `Code`, `Updated`, `No Image Available`, `Filter by tags`, `Contact`, `Table of Contents` o equivalentes ARIA.
- [x] Cada nueva clave de `src/i18n/ui.ts` existe en `en` y `es`, salvo nombres propios o datos editoriales.
- [ ] `useTranslations` recibe el idioma correcto en `/` y `/es/`, listados y detalles.
- [ ] Las rutas, enlaces de retorno y toggles de idioma no se mezclan entre raíz y `/es`.

**Evidencia de Task 3:** localization-contract + utils pasan 27/27 y el build Astro termina con exit 0 generando 1043 páginas. La implementación incorpora claves de UI equivalentes en EN/ES y localiza el `Header` y las páginas dinámicas de Apps y Blog. Quedan pendientes el barrido completo de strings, los listados y el recorrido funcional integral de rutas y toggles.

## 9. Responsive, accesibilidad y motion

- [ ] Todos los controles interactivos tienen nombre accesible, foco visible y orden de teclado lógico.
- [ ] El contenido esencial funciona sin hover, blur, scale, rotate ni animación.
- [ ] `prefers-reduced-motion: reduce` elimina las animaciones no esenciales y no oculta contenido.
- [ ] No hay cambios de ancho causados por hover tipográfico ni layout shift visual evidente en headings.
- [ ] Se revisan al menos 360px, 768px y 1280px en portada, listado, detalle de app y artículo.

**Evidencia:** DevTools/preview, recorrido con teclado y búsqueda de clases de motion en `src`.

## 10. Verificación automatizada final

- [x] `pnpm build` termina correctamente y conserva el warning conocido de `CONTACT_FORM_KEY` como warning, no como error.
- [ ] `pnpm test` se ejecuta y sus fallos se comparan con el baseline; no aparecen fallos nuevos atribuibles al rediseño.
- [x] `pnpm test -- src/i18n/utils.test.ts` termina correctamente.
- [ ] `git diff --check` termina correctamente.
- [ ] `rg --files docs/specai/20260723-arceapps-visual-redesign` lista designs, plan, tasks y verify.
- [ ] Los documentos living reflejan exactamente las tareas completadas, errores y decisiones finales.
- [ ] Los hallazgos 11–12 permanecen explícitamente como deuda separada.

**Estado de ejecución tras Task 4:** header test 3/3, build Astro exit 0 con 1043 páginas y code review CLEAN. El mock de `localStorage` solo estabiliza el entorno jsdom de Vitest y no modifica producción; el warning conocido `CONTACT_FORM_KEY` permanece como baseline. No se considera ejecutada todavía la suite completa ni cerrada la verificación visual EN/ES.

## Comandos de cierre

```bash
pnpm build
pnpm test
pnpm test -- src/i18n/utils.test.ts
git diff --check
rg -n "primary-dark|elevation-4|h[1-6]:hover" src
rg --files docs/specai/20260723-arceapps-visual-redesign
```

## Resultado de verificación

- [ ] Todos los criterios anteriores tienen evidencia y están marcados por el documenter de SpecAI.
- [ ] El estado final es `✅ DONE` únicamente cuando el build pasa, no hay regresiones nuevas y la inspección visual EN/ES está documentada.
- [ ] Si algún criterio falla, se crean corrective tasks en el archivo de tareas y se registra causa/solución en el execution log antes de pedir integración.
