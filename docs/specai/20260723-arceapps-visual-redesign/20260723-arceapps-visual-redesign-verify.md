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

- [ ] Existe `src/components/Card.astro` con variantes `article`, `app` y `feature`, props tipadas y estados de foco accesibles.
- [ ] `BlogCard.astro`, `ProjectCard.astro` y `AppCard.astro` consumen la gramática común sin perder sus enlaces, imágenes, metadatos o datos de colección.
- [ ] Existe `src/components/PageIntro.astro` y los listados de Apps, Blog y Bitácora comparten su estructura de encabezado.
- [ ] Las cards no dependen de hover para revelar título, CTA o información necesaria.
- [ ] No se observa overflow horizontal en retículas, tags, galerías o botones en widths móvil, tablet y desktop.

**Evidencia:** inspección de archivos, `pnpm build` y recorrido de portada/listados en ambos idiomas.

## 4. Portada

- [ ] La jerarquía visible es hero editorial, construcción real, apps destacadas, artículos recientes y CTA final.
- [ ] El hero no contiene el mockup ficticio de teléfono, estadísticas simuladas ni textos de producto inventados.
- [ ] La portada muestra contenido real de las colecciones actuales y conserva los anchors/enlaces públicos existentes.
- [ ] La portada EN y ES usa la misma composición visual, con copy y rutas localizadas.
- [ ] El CTA principal se distingue visualmente y conserva un nombre accesible.

**Evidencia:** inspección de `Hero.astro`/`HomePage.astro`, visita de `/` y `/es/`, y build estático.

## 5. Navegación y listados

- [ ] El header desktop conserva navegación, idioma y tema sin competir visualmente con el contenido principal.
- [ ] El menú móvil es un panel delimitado, anuncia su estado mediante `aria-expanded`/`aria-controls` y tiene foco visible.
- [ ] El enlace activo se identifica por una señal adicional al color.
- [ ] Apps, Blog y Bitácora mantienen filtros, paginación, tags, estados vacíos y enlaces correctos en EN/ES.
- [ ] El teclado puede abrir, recorrer y cerrar la navegación sin quedar atrapado ni perder el foco de forma inesperada.

**Evidencia:** recorrido con teclado, inspección de atributos ARIA, `pnpm test -- src/scripts/header.test.ts` y build.

## 6. Detalle de app

- [ ] El orden visual prioriza nombre, propuesta de valor, icono/hero, Google Play y prueba visual.
- [ ] Rating, versión, fecha, tags y repositorio permanecen disponibles como metadatos secundarios.
- [ ] Google Play es la acción primaria en las rutas EN y ES; los CTAs secundarios no la eclipsan.
- [ ] Galería e imágenes se leen sin inclinación obligatoria, sin recorte inesperado y sin overflow horizontal.
- [ ] `alt`, enlaces externos, foco y estados de tema son correctos.

**Evidencia:** visita de un detalle EN y uno ES en desktop y móvil, inspección de HTML y build.

## 7. Detalle de artículo y lectura

- [ ] Breadcrumbs, progreso, tabla de contenidos, compartir y navegación de artículos continúan funcionando.
- [ ] El contenido no está encerrado en una card pesada; la lectura usa una columna aproximada de 720–760px.
- [ ] Las imágenes y medios pueden superar 500px cuando el viewport lo permite y nunca se desbordan.
- [ ] Código, citas, tablas, enlaces, headings y contraste funcionan en tema claro y oscuro.
- [ ] TOC, fechas, reading time, acciones y etiquetas están localizados en EN y ES.

**Evidencia:** artículo largo con TOC en ambos idiomas, recorrido de anchors y build.

## 8. Internacionalización

- [ ] No quedan strings de UI hardcodeados para `Gallery`, `Live Demo`, `Code`, `Updated`, `No Image Available`, `Filter by tags`, `Contact`, `Table of Contents` o equivalentes ARIA.
- [ ] Cada nueva clave de `src/i18n/ui.ts` existe en `en` y `es`, salvo nombres propios o datos editoriales.
- [ ] `useTranslations` recibe el idioma correcto en `/` y `/es/`, listados y detalles.
- [ ] Las rutas, enlaces de retorno y toggles de idioma no se mezclan entre raíz y `/es`.

**Evidencia:** `rg` de strings, inspección de `ui.ts`, recorrido EN/ES y pruebas de utilidades.

## 9. Responsive, accesibilidad y motion

- [ ] Todos los controles interactivos tienen nombre accesible, foco visible y orden de teclado lógico.
- [ ] El contenido esencial funciona sin hover, blur, scale, rotate ni animación.
- [ ] `prefers-reduced-motion: reduce` elimina las animaciones no esenciales y no oculta contenido.
- [ ] No hay cambios de ancho causados por hover tipográfico ni layout shift visual evidente en headings.
- [ ] Se revisan al menos 360px, 768px y 1280px en portada, listado, detalle de app y artículo.

**Evidencia:** DevTools/preview, recorrido con teclado y búsqueda de clases de motion en `src`.

## 10. Verificación automatizada final

- [ ] `pnpm build` termina correctamente y conserva el warning conocido de `CONTACT_FORM_KEY` como warning, no como error.
- [ ] `pnpm test` se ejecuta y sus fallos se comparan con el baseline; no aparecen fallos nuevos atribuibles al rediseño.
- [ ] `pnpm test -- src/i18n/utils.test.ts` termina correctamente.
- [ ] `git diff --check` termina correctamente.
- [ ] `rg --files docs/specai/20260723-arceapps-visual-redesign` lista designs, plan, tasks y verify.
- [ ] Los documentos living reflejan exactamente las tareas completadas, errores y decisiones finales.
- [ ] Los hallazgos 11–12 permanecen explícitamente como deuda separada.

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
