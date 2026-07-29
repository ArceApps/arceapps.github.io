# Rediseño visual de ArceApps — Verification Plan

Este archivo es la única fuente de verdad de los criterios de aceptación de la feature. Ningún criterio se considera verificado sin evidencia de comando, inspección visual o recorrido funcional.

## 1. Baseline conocido antes de implementar

- `pnpm build`: PASS; genera 1.043 páginas estáticas y 301 imágenes OG, con warning conocido porque `CONTACT_FORM_KEY` no está definido.
- `pnpm test`: FAIL baseline/out-of-scope; 1 fichero falla, `src/utils/links-validation.test.ts`, con 274 fallos y 139 tests correctos de 413. El baseline histórico anterior a Tasks 4–9 era de 2 ficheros, 276 fallos y 111 correctos de 387; la suite global no se marca verde.
- La revisión local interactiva quedó limitada por el aislamiento del navegador integrado; la verificación final debe incluir una inspección visual local o de preview con capturas/recorrido documentado.

La implementación no puede aumentar el número de fallos, introducir nuevas rutas rotas ni convertir el warning de `CONTACT_FORM_KEY` en un error de build. Los fallos baseline no se presentan como resueltos por esta feature.

## 2. Contrato visual y tokens

- [x] `src/styles/global.css` declara tokens semánticos para colores de marca, superficies, contenido, bordes, foco, radios y elevación en claro y oscuro.
- [x] `rg -n "primary-dark|elevation-4" src` no encuentra usos activos de tokens inexistentes.
- [x] No existe hover global de `h1`–`h6` que cambie el peso tipográfico o el ancho del texto.
- [x] La UI usa teal `#018786` como estructura y orange `#FF9800` como acento, sin introducir una paleta paralela.
- [x] Las superficies se limitan a una jerarquía coherente de página, raised/subtle y feature; no hay una card distinta por cada sección.

**Evidencia:** `rg`, inspección de `global.css`, contrato de `Card`, `pnpm build` y recorrido visual en tema claro/oscuro. La revisión de compliance confirmó una jerarquía limitada a las superficies declaradas.

## 3. Cards y composición

- [x] Existe `src/components/Card.astro` con variantes `article`, `app` y `feature`, props tipadas y estados de foco accesibles.
- [x] `BlogCard.astro`, `ProjectCard.astro` y `AppCard.astro` consumen la gramática común sin perder sus enlaces, imágenes, metadatos o datos de colección.
- [x] Existe `src/components/PageIntro.astro` y los listados de Apps, Blog y Bitácora comparten su estructura de encabezado.
- [x] Las cards no dependen de hover para revelar título, CTA o información necesaria.
- [x] No se observa overflow horizontal en retículas, tags, galerías o botones en widths móvil, tablet y desktop.

**Evidencia:** inspección estática de los componentes, `pnpm exec vitest run src/components/card-contract.test.ts` (3/3), contrato de listados 4/4, `pnpm build` (Astro exit 0, 1043 páginas), recorrido visual de listados EN/ES y revisión independiente CLEAN. Task 9 completó la comprobación global de hover, overflow y páginas de detalle en 360, 768 y 1280 px.

## 4. Portada

- [x] La jerarquía visible es hero editorial, construcción real, apps destacadas, artículos recientes y CTA final.
- [x] El hero no contiene el mockup ficticio de teléfono, estadísticas simuladas ni textos de producto inventados.
- [x] La portada muestra contenido real de las colecciones actuales y conserva los anchors/enlaces públicos existentes.
- [x] La portada EN y ES usa la misma composición visual, con copy y rutas localizadas.
- [x] El CTA principal se distingue visualmente y conserva un nombre accesible.

**Evidencia de Task 5:** contrato de portada 3/3; build Astro exit 0 con 1043 páginas; recorrido visual de la portada EN/ES en desktop y de la portada ES en móvil a 360px, sin overflow horizontal. La inspección confirmó la jerarquía hero → construcción → apps → artículos → CTA, el contenido real y los anchors, la composición localizada y el CTA accesible. Task 9 completó posteriormente los criterios globales de responsive y las comprobaciones de listados y detalles.

## 5. Navegación y listados

- [x] El header desktop conserva navegación, idioma y tema sin competir visualmente con el contenido principal.
- [x] El menú móvil es un panel delimitado, anuncia su estado mediante `aria-expanded`/`aria-controls` y tiene foco visible.
- [x] El enlace activo se identifica por una señal adicional al color.
- [x] Apps, Blog y Bitácora mantienen filtros, paginación, tags, estados vacíos y enlaces correctos en EN/ES.
- [x] El teclado puede abrir, recorrer y cerrar la navegación sin quedar atrapado ni perder el foco de forma inesperada.

**Evidencia de Task 4:** panel móvil delimitado y localizado; estado activo con `aria-current` y borde; gestión de `aria-expanded`, `aria-controls`, `aria-hidden` y `data-state`; foco, Escape, click exterior y cleanup cubiertos. Header test 3/3 y build Astro exit 0 con 1043 páginas; code review CLEAN. Task 9 completó el recorrido visual EN/ES de header, listados y detalles a 360, 768 y 1280 px, confirmando que el header desktop conserva navegación, idioma y tema sin competir con el contenido.

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

- [x] No quedan strings de UI hardcodeados para `Gallery`, `Live Demo`, `Code`, `Updated`, `No Image Available`, `Filter by tags`, `Contact`, `Table of Contents` o equivalentes ARIA.
- [x] Cada nueva clave de `src/i18n/ui.ts` existe en `en` y `es`, salvo nombres propios o datos editoriales.
- [x] `useTranslations` recibe el idioma correcto en `/` y `/es/`, listados y detalles.
- [x] Las rutas, enlaces de retorno y toggles de idioma no se mezclan entre raíz y `/es`.

**Evidencia de Task 3:** localization-contract + utils pasan 27/27 y el build Astro termina con exit 0 generando 1043 páginas. La implementación incorpora claves de UI equivalentes en EN/ES y localiza el `Header`, listados y páginas dinámicas de Apps y Blog. La revisión final confirmó el barrido de strings, el uso correcto de `useTranslations`, la separación de rutas raíz y `/es`, y los toggles de idioma.

## 9. Responsive, accesibilidad y motion

- [x] Todos los controles interactivos tienen nombre accesible, foco visible y orden de teclado lógico.
- [x] El contenido esencial funciona sin hover, blur, scale, rotate ni animación.
- [x] `prefers-reduced-motion: reduce` elimina las animaciones no esenciales y no oculta contenido.
- [x] No hay cambios de ancho causados por hover tipográfico ni layout shift visual evidente en headings.
- [x] Se revisan al menos 360px, 768px y 1280px en portada, listado, detalle de app y artículo.

**Evidencia de Task 9:** El contrato `src/components/cross-cutting-contract.test.ts` pasa 3/3. Se auditó la búsqueda y clasificación de motion, incluida la eliminación de transforms, y se verificó el fallback global de `prefers-reduced-motion: reduce`. La revisión visual y estructural EN/ES a 360, 768 y 1280 px cubrió portada, listados, detalle de app y artículo sin overflow. Se confirmó un único `main`, headings con un `h1`, controles localizados y nombrados, foco visible y relaciones coherentes entre `aria-expanded` y `aria-controls`. Code review CLEAN.

## 10. Verificación automatizada final

- [x] `pnpm build` termina correctamente y conserva el warning conocido de `CONTACT_FORM_KEY` como warning, no como error.
- [x] `pnpm test` se ejecuta y sus fallos se comparan con el baseline; no aparecen fallos nuevos atribuibles al rediseño.
- [x] `pnpm exec vitest run src/i18n/utils.test.ts` termina correctamente.
- [x] `git diff --check` termina correctamente.
- [x] `rg --files docs/specai/20260723-arceapps-visual-redesign` lista designs, plan, tasks y verify.
- [x] Los documentos living reflejan exactamente las tareas completadas, errores y decisiones finales.
- [x] Los hallazgos 11–12 permanecen explícitamente como deuda separada.

**Registro final de ejecución (2026-07-25):** `pnpm build` exit 0, 1043 páginas y 301 imágenes OG, con el warning conocido porque `CONTACT_FORM_KEY` está ausente. `pnpm test` exit 1 únicamente en `src/utils/links-validation.test.ts`, con 274 fallos y 139 pasados de 413; se mantiene como baseline/out-of-scope y no se marca la suite global como verde. `pnpm exec vitest run src/i18n/utils.test.ts` exit 0, 24/24. `git diff --check` exit 0. `rg --files docs/specai/20260723-arceapps-visual-redesign` confirma `designs`, `plan`, `tasks` y `verify`. `spec-compliance-reviewer PASS`; `verifier PASS`, autorizando el cierre.

## Comandos de cierre

```bash
pnpm build
pnpm test
pnpm exec vitest run src/i18n/utils.test.ts
git diff --check
rg -n "primary-dark|elevation-4|h[1-6]:hover" src
rg --files docs/specai/20260723-arceapps-visual-redesign
```

## Resultado de verificación

- [x] Todos los criterios anteriores tienen evidencia y están marcados por el documenter de SpecAI.
- [x] El estado final es `✅ DONE` porque el build pasa, no hay regresiones nuevas atribuibles al rediseño y la inspección visual EN/ES está documentada.
- [x] Los fallos baseline/out-of-scope y la advertencia de `CONTACT_FORM_KEY` quedan registrados como deuda; no requieren corrective task dentro de esta feature.

## 11. Integridad de enlaces internos

- [x] Los enlaces con trailing slash no producen falsos positivos cuando existe un archivo local tras normalizar la ruta.
- [x] Los aliases `blog-*` definidos como redirects resuelven al slug canonical correspondiente.
- [x] Cada enlace EN resuelve en el locale EN, salvo que esté marcado explícitamente como enlace cross-locale permitido.
- [x] Cada enlace ES resuelve en el locale ES, salvo que esté marcado explícitamente como enlace cross-locale permitido.
- [x] No quedan destinos realmente ausentes; los enlaces a git-worktrees sin equivalente local fueron eliminados o sustituidos por destinos válidos.
- [x] `pnpm test` termina con exit 0 y la suite completa queda verde.
- [x] `pnpm build` termina correctamente.
- [x] `git diff --check` termina correctamente.
- [x] El contrato del validador conserva la detección de destinos ausentes y no convierte aliases o redirects válidos en falsos positivos.

**Evidencia del verifier final:** `PASS`, autorizando el cierre de Task 11. Commit `93d86a6`; `pnpm test` pasa con 21 archivos y 144 tests; `pnpm build` termina con exit 0 y genera 1043 páginas y 301 imágenes OG; `git diff --check` pasa; los tests dirigidos pasan con 2 archivos y 6 tests; code review CLEAN. El criterio 9 fue verificado explícitamente con un alias válido (`blog-superpowers-deep-dive` → `superpowers-deep-dive`), trailing slash y slug inexistente conservando el estado `missing`.

**Estado:** `PASS — verifier final autoriza cierre`.

**Alcance:** La integridad de enlaces queda resuelta. La deuda técnica residual de la feature se limita a `CONTACT_FORM_KEY` y los warnings conocidos, sin cambiar el alcance visual del rediseño.
