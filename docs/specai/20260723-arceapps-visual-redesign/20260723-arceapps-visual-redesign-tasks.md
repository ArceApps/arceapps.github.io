# Rediseño visual de ArceApps — Task List

> **For agentic workers:** Read this file once, then execute each task in order. Do not bundle tasks. No task is complete until su verificación y la actualización de los documentos living hayan terminado.

## Task 1: Establecer el contrato de tokens visuales

**Files:**

- Modify: `src/styles/global.css`
- Modify: `src/pages/404.astro`
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/pages/HomePage.astro`
- Create: `src/styles/design-contract.test.ts`

**Spec context:** Reemplazar la mezcla de Material/spatial y las clases `bg-primary-dark`/`elevation-4` por tokens semánticos declarados, con equivalentes de tema claro y oscuro. No eliminar todavía `.material-card`; su limpieza queda como deuda separada.

**Metadata:** Complexity 4/10 · Risk Medium · Checkpoint No

**Status:** ✅ DONE

**Steps:**

- [x] Inventariar tokens y clases visuales usados con `rg` y registrar el mapa en la sección de diseño correspondiente.
- [x] Declarar colores, superficies, contenido, foco, radios y tres niveles de elevación en `@theme` o utilities existentes.
- [x] Sustituir referencias a tokens no declarados y eliminar el hover global de headings sin modificar el contenido.
- [x] Ejecutar `rg -n "primary-dark|elevation-4|h[1-6]:hover" src` y comprobar que no queden usos no intencionados.
- [x] Ejecutar `pnpm build` y registrar el resultado en el execution log.

**Resultado:** test contractual 3/3, build Astro exit 0 con 1043 páginas, code review CLEAN; warning conocido `CONTACT_FORM_KEY`.

## Task 2: Crear las primitivas de superficie y migrar cards

**Files:**

- Create: `src/components/Card.astro`
- Create: `src/components/PageIntro.astro`
- Modify: `src/components/BlogCard.astro`
- Modify: `src/components/ProjectCard.astro`
- Modify: `src/components/AppCard.astro`

**Spec context:** Las tres cards deben compartir superficie, radio, borde, foco, spacing y CTA. `Card.astro` ofrece solo `article`, `app` y `feature`; no carga colecciones ni introduce una abstracción de layout generalista.

**Metadata:** Complexity 6/10 · Risk Medium · Checkpoint Yes

**Status:** ✅ DONE

**Steps:**

- [x] Definir props tipadas para `variant`, `href`, `ariaLabel` y clases adicionales sin romper las APIs de datos existentes.
- [x] Implementar la superficie accesible con estados hover/focus discretos y fallback compatible con tema oscuro.
- [x] Migrar `BlogCard`, `ProjectCard` y `AppCard` a las variantes correspondientes conservando sus enlaces y datos.
- [x] Implementar `PageIntro` con título, descripción y ancho responsive sin textos hardcodeados.
- [x] Ejecutar `pnpm build` y revisar que las páginas que consumen las cards sigan generándose.
- [x] Checkpoint revisado: no se requirió cambiar la jerarquía aprobada.

**Resultado:** contrato de `Card` 3/3, build Astro exit 0 con 1043 páginas y code review independiente CLEAN; permanece el warning conocido `CONTACT_FORM_KEY`.

## Task 3: Completar strings y rutas localizadas

**Files:**

- Modify: `src/i18n/ui.ts`
- Modify: `src/i18n/utils.ts` solo si aparece una necesidad localizada concreta
- Modify: `src/components/Header.astro`
- Modify: `src/pages/apps/[...slug].astro`
- Modify: `src/pages/es/apps/[...slug].astro`
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/pages/es/blog/[...slug].astro`

**Spec context:** Todo texto de UI, estado vacío, CTA y etiqueta ARIA debe pasar por `useTranslations`. El idioma debe provenir de la ruta o prop; no se permite usar una traducción inglesa fija en la ruta española.

**Metadata:** Complexity 4/10 · Risk Medium · Checkpoint No

**Steps:**

- [ ] Localizar strings hardcodeados con `rg` para `Gallery|Live Demo|Code|Updated|No Image Available|Filter by tags|Contact|Table of Contents|Home|Blog`.
- [ ] Añadir claves equivalentes en `en` y `es` de `src/i18n/ui.ts` con nombres agrupados por área.
- [ ] Sustituir textos visibles, placeholders, `aria-label`, `alt` de UI y estados vacíos por `t(...)`.
- [ ] Comprobar que `useTranslations` recibe el idioma correcto en las rutas dinámicas EN/ES.
- [ ] Ejecutar `pnpm test -- src/i18n/utils.test.ts` y `pnpm build`.

## Task 4: Rediseñar header y navegación móvil

**Files:**

- Modify: `src/components/Header.astro`
- Modify: `src/layouts/Layout.astro` si el skip link o el botón back-to-top necesita tokens nuevos
- Modify: `src/scripts/header.test.ts` solo para ajustar el contrato observable del nuevo estado, no para ocultar fallos

**Spec context:** El menú móvil debe verse como un panel propio, con estado activo claro, orden de acciones comprensible y foco visible. La navegación desktop conserva sus rutas y el selector de idioma/tema.

**Metadata:** Complexity 5/10 · Risk Medium · Checkpoint No

**Steps:**

- [ ] Dibujar el orden de navegación desktop/móvil y mapear cada control a su clave de traducción.
- [ ] Convertir el menú móvil en un panel delimitado con atributos de estado y clases de tema claro/oscuro.
- [ ] Revisar cierre, foco, `aria-expanded`, `aria-controls` y navegación por teclado.
- [ ] Añadir estado activo inequívoco sin depender solo del color.
- [ ] Ejecutar las pruebas específicas del header y `pnpm build`; registrar cualquier fallo baseline separado.

## Task 5: Simplificar hero y portada

**Files:**

- Modify: `src/components/Hero.astro`
- Modify: `src/components/pages/HomePage.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/es/index.astro`

**Spec context:** La portada debe seguir el orden hero → construcción real → apps → artículos → CTA. Se retiran el mockup de teléfono, métricas simuladas, glows redundantes y Bento decorativo; se conservan datos reales de colecciones y enlaces actuales.

**Metadata:** Complexity 6/10 · Risk High · Checkpoint Yes

**Steps:**

- [ ] Identificar qué app, devlog o artículo actual puede representar contenido real sin inventar datos.
- [ ] Reescribir `Hero` como composición editorial con CTA principal y CTA secundaria localizados.
- [ ] Reordenar `HomePage` para usar `feature`, `app` y `article`, manteniendo filtros y límites de colección.
- [ ] Revisar el comportamiento de ambos idiomas y los anchors públicos (`#apps` y enlaces existentes).
- [ ] Ejecutar `pnpm build` y revisar una versión desktop/móvil en `pnpm dev` o `pnpm preview`.
- [ ] Solicitar checkpoint humano antes de continuar si la nueva jerarquía cambia la pieza destacada aprobada.

## Task 6: Homogeneizar listados de Apps, Blog y Bitácora

**Files:**

- Modify: `src/pages/apps/index.astro`
- Modify: `src/pages/es/apps/index.astro`
- Modify: `src/pages/blog/[...page].astro`
- Modify: `src/pages/es/blog/[...page].astro`
- Modify: `src/pages/devlog/index.astro`
- Modify: `src/pages/es/devlog/index.astro`
- Modify: `src/pages/blog/tag/[tag].astro` y su ruta española si la migración de card lo requiere

**Spec context:** Compartir `PageIntro`, retícula, estados vacíos, filtros y separación. La carga de contenido, paginación y slugs no cambia; solo se centraliza la composición visual.

**Metadata:** Complexity 5/10 · Risk Medium · Checkpoint No

**Steps:**

- [ ] Mapear cada listado a `PageIntro` y a la variante de card correcta.
- [ ] Migrar retículas y espaciado sin cambiar el orden ni el número de entradas mostradas.
- [ ] Alinear estados de carga/vacío, tags, paginación y enlaces de retorno en EN/ES.
- [ ] Comprobar que ninguna ruta crea enlaces raíz desde contenido español.
- [ ] Ejecutar `pnpm build` y revisar las rutas de listado generadas.

## Task 7: Reordenar el detalle de app

**Files:**

- Modify: `src/pages/apps/[...slug].astro`
- Modify: `src/pages/es/apps/[...slug].astro`

**Spec context:** Prioridad visual: nombre → propuesta de valor → icono/hero → Google Play → prueba visual. Rating, versión, fecha, tags, repositorio y CTA secundarios deben quedar agrupados como información secundaria sin perder funcionalidad.

**Metadata:** Complexity 6/10 · Risk High · Checkpoint Yes

**Steps:**

- [ ] Auditar el orden actual de campos y separar contenido primario de metadatos secundarios.
- [ ] Reestructurar el hero de detalle para que Google Play sea la acción primaria en ambos idiomas.
- [ ] Migrar imagen y galería a una secuencia estable sin rotación obligatoria ni overflow horizontal.
- [ ] Revisar labels, `alt`, enlaces externos, foco y el comportamiento de pantalla pequeña.
- [ ] Ejecutar `pnpm build` y abrir al menos un detalle EN y uno ES en vista desktop/móvil.
- [ ] Solicitar checkpoint humano antes de continuar si se altera el orden de CTAs o la información de descarga.

## Task 8: Convertir el detalle de artículo en lectura editorial

**Files:**

- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/pages/es/blog/[...slug].astro`
- Modify: `src/styles/global.css`
- Modify: `src/components/PostNavigation.astro` o `src/components/SocialShare.astro` solo si la migración de strings lo exige

**Spec context:** Mantener breadcrumbs, progreso, TOC, compartir y navegación. El contenido debe respirar como artículo, con una columna de 720–760px y medios capaces de crecer más que 500px sin desbordar.

**Metadata:** Complexity 6/10 · Risk High · Checkpoint Yes

**Steps:**

- [ ] Separar encabezado, hero, TOC y contenido sin envolver todo el prose en una card pesada.
- [ ] Ajustar tipografía, ancho, headings, código, citas, tablas, imágenes e iframes para claro/oscuro.
- [ ] Localizar breadcrumbs, TOC, fechas, reading time, compartir y navegación EN/ES.
- [ ] Verificar que el progreso y los anchors sigan funcionando con la nueva estructura.
- [ ] Ejecutar `pnpm build` y revisar un artículo largo con TOC en desktop y móvil.
- [ ] Solicitar checkpoint humano antes de continuar si la columna de lectura o el hero contradicen la dirección editorial.

## Task 9: Auditoría transversal de responsive, accesibilidad y motion

**Files:**

- Modify: `src/styles/global.css`
- Modify: todos los componentes y páginas tocados en Tasks 1–8

**Spec context:** La calidad transversal se verifica después de migrar todas las superficies. No se debe ocultar un elemento esencial en móvil ni depender de hover, blur o movimiento para entender la interfaz.

**Metadata:** Complexity 6/10 · Risk Medium · Checkpoint No

**Steps:**

- [ ] Ejecutar búsquedas de clases de hover, scale, rotate, blur y animation y clasificar cada uso por necesidad.
- [ ] Mantener solo transiciones de interacción/entrada justificadas y completar `prefers-reduced-motion`.
- [ ] Recorrer teclado, foco, contraste, orden de headings, landmarks, `aria-expanded` y labels en rutas EN/ES.
- [ ] Probar widths móvil, tablet y desktop en portada, listado, detalle de app y artículo.
- [ ] Ejecutar `git diff --check`, `pnpm test` y `pnpm build`; separar fallos preexistentes de regresiones nuevas.

## Task 10: Verificación final y cierre documental

**Files:**

- Modify: `docs/specai/20260723-arceapps-visual-redesign/20260723-arceapps-visual-redesign-plan.md`
- Modify: `docs/specai/20260723-arceapps-visual-redesign/20260723-arceapps-visual-redesign-tasks.md`
- Modify: `docs/specai/20260723-arceapps-visual-redesign/20260723-arceapps-visual-redesign-verify.md`
- Modify: `docs/specai/20260723-arceapps-visual-redesign/20260723-arceapps-visual-redesign-designs.md` si cambió una decisión

**Spec context:** El verifier es la única autoridad para criterios de aceptación. Los documentos deben reflejar la realidad de cada tarea, el baseline conocido y cualquier corrective task antes de pedir integración.

**Metadata:** Complexity 3/10 · Risk Low · Checkpoint Yes

**Steps:**

- [ ] Marcar únicamente tareas y criterios realmente verificados, con comandos y resultados observables.
- [ ] Añadir al execution log los cambios, errores, causas y correcciones relevantes.
- [ ] Confirmar que 11–12 siguen registrados como deuda separada y no como éxito del rediseño.
- [ ] Ejecutar por última vez `pnpm build`, `pnpm test` y `git diff --check`.
- [ ] Presentar el resultado al usuario para decidir merge, PR o siguiente iteración.
