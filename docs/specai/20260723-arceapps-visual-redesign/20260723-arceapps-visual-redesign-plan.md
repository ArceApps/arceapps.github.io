# Rediseño visual de ArceApps — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `specai:specai-subagent-driven-development` (recommended) or `specai:specai-executing-plans` to execute this plan. Keep the designs, plan, tasks and verify documents synchronized after every task and commit.
> Acceptance criteria live ONLY in `20260723-arceapps-visual-redesign-verify.md`.

**Goal:** Evolucionar la web de ArceApps hacia una experiencia de “indie software studio” más moderna, atractiva y coherente, conservando el contenido, las URLs, Astro estático y el soporte EN/ES.

**Architecture:** Consolidar tokens semánticos en `global.css`, introducir una primitiva pequeña de superficie (`Card.astro`) y un encabezado común de listados (`PageIntro.astro`), y migrar portada, tarjetas, navegación y páginas de detalle hacia esa gramática. Las rutas seguirán cargando datos, pero compartirán composición visual y traducciones.

**Tech Stack:** Astro 5.16.3 estático, TypeScript estricto, Tailwind CSS 4.1.17, DaisyUI 5.5.5, Material Icons, Inter/Merriweather, Fuse.js, pnpm, Vitest.

**Status:** 🔵 IN PROGRESS — ejecución aprobada e iniciada; Tasks 1, 2, 3 y 4 completadas y resto del rediseño pendiente.

## Dependency & Package Validation

- No se añadirán paquetes, fuentes, icon libraries ni herramientas de CSS.
- Se reutilizarán las versiones existentes de Astro, Tailwind, DaisyUI, Material Icons, fuentes y Vitest.
- La validación previa de `package.json` confirma que los comandos disponibles son `pnpm build`, `pnpm test`, `pnpm dev` y `pnpm preview`.
- El plan no depende de una API externa ni de credenciales.

## Constraints & Guardrails

- Todas las interacciones, textos de documentación y registros deben estar en español; nombres de código y rutas, en inglés.
- Mantener las rutas raíz inglesas y las rutas españolas bajo `/es`.
- No cambiar slugs, contenido editorial, esquemas de colecciones ni frontmatter.
- Usar exclusivamente los colores de marca existentes: teal `#018786` y orange `#FF9800`, con derivados accesibles declarados en tokens.
- No usar clases visuales inexistentes como `bg-primary-dark` o `elevation-4`.
- No introducir más blur, gradients, rotaciones o escalados decorativos que los que el sistema visual pueda justificar.
- Todo estado interactivo debe funcionar con teclado, foco visible y `prefers-reduced-motion`.
- Mantener fuera de esta feature la corrección de `CONTACT_FORM_KEY`, los 274 enlaces fallidos y los fallos baseline de tests salvo que una migración los empeore.
- No crear imágenes nuevas; reutilizar los assets existentes.
- Después de cada tarea se actualizarán tasks, plan y verify con el estado real antes de continuar.

## Architectural Notes

1. `Card.astro` será una primitiva pequeña con variantes `article`, `app` y `feature`; no contendrá carga de colecciones ni lógica de negocio.
2. `PageIntro.astro` recibirá textos ya localizados y resolverá solo la presentación del encabezado de un listado.
3. Las rutas EN/ES conservarán su responsabilidad de resolver datos y paths; los componentes compartidos recibirán `lang` cuando necesiten traducir o construir enlaces.
4. El hero dejará de simular un teléfono y una métrica de producto. La pieza destacada será contenido real obtenido de las colecciones actuales o una composición editorial sin datos ficticios.
5. El detalle de artículo tendrá una columna de lectura de aproximadamente 720–760px; los medios no heredarán un límite global de 500px.
6. El detalle de app mantendrá Google Play como CTA primaria y relegará rating, versión, fecha, tags y repositorio a metadatos secundarios.
7. La deuda de `.material-card` sin uso y el baseline técnico de `CONTACT_FORM_KEY`/tests/enlaces se registrará, pero no se declarará resuelta por esta feature.

## Delta de requisitos

### ADDED

- Un contrato semántico de tokens para superficie, contenido, borde, foco, radio y elevación.
- Una primitiva compartida de cards con variantes `article`, `app` y `feature`.
- Un componente común para intros de listados.
- Strings de UI faltantes para inglés y español.
- Verificación explícita de responsive, teclado, tema oscuro y movimiento reducido en las páginas rediseñadas.

### MODIFIED

- La portada pasa de una composición Bento/mockup a una jerarquía editorial con contenido real.
- Cards, hero, header, listados y detalles comparten superficies, spacing, foco y transiciones.
- La navegación móvil pasa a un panel visual delimitado con estado activo claro.
- Los detalles de app y artículo priorizan, respectivamente, conversión y lectura.
- La composición EN/ES delega en los mismos componentes visuales.

### REMOVED

- Mockup CSS de teléfono, estadísticas ficticias y decoración Bento que no aporten contenido real.
- Hover global que cambia el peso de todos los encabezados.
- Escalados, giros y pulsos decorativos no esenciales en cards y detalles.

## Orden de ejecución y checkpoints

1. Contrato de tokens y primitivas visuales.
2. Strings UI y estados localizados.
3. Header y navegación móvil.
4. Portada y hero.
5. Listados de Apps, Blog y Bitácora.
6. Detalle de app.
7. Detalle de artículo y prose.
8. Responsive, accesibilidad, motion y auditoría de regresión.
9. Verificación final y actualización del estado de los documentos.

Los checkpoints humanos se sitúan después de los pasos 1, 4, 6 y 9. Si una tarea supera complejidad 6 o requiere cambiar la dirección visual aprobada, se detiene la ejecución y se solicita confirmación antes de editar.

## Execution Log

### [2026-07-23] Preparación documental

**Done:** Auditoría visual y arquitectónica completada; se documentó el alcance de los hallazgos 1–10 y se separó la deuda 11–12. Se prepararon los diseños, el plan, las tareas y la verificación sin implementar código.

**Baseline:** `pnpm build` pasa y genera 1.043 páginas estáticas/301 imágenes OG con el warning conocido de `CONTACT_FORM_KEY`. `pnpm test` queda como baseline fallido: 2 ficheros, 276 fallos y 111 tests correctos de 387.

**Outcome:** 🟡 Pendiente de aprobación del usuario.

**Problems & fixes:** El agente documental delegado no respondió dentro del tiempo disponible; el orquestador redactó la documentación localmente manteniendo el contrato de documentos de SpecAI.

### [2026-07-23 22:40] Verificación del baseline después de crear documentación

**Done:** `pnpm build` volvió a pasar con 1.043 páginas y 301 imágenes OG. `pnpm test` mantiene exactamente el baseline conocido: 2 ficheros fallidos, 276 tests fallidos y 111 correctos de 387. `git diff --check` pasa.

**Outcome:** ✅ Proyecto sin regresión atribuible a la documentación.

**Problems & fixes:** El build requiere ejecución fuera del sandbox porque `tsx` no puede abrir su pipe IPC con `EPERM`; la ejecución autorizada completó correctamente. El warning de `CONTACT_FORM_KEY` y los fallos de header/enlaces siguen fuera del alcance.

### [2026-07-23 23:01] Task 1: Establecer el contrato de tokens visuales

**Archivos principales:** `src/styles/global.css`, `src/pages/404.astro`, `src/layouts/Layout.astro`, `src/components/pages/HomePage.astro`, `src/styles/design-contract.test.ts`

**TDD:** RED → GREEN, 3/3 tests contractuales.

**Build:** Astro exit 0, 1043 páginas generadas.

**Code review:** CLEAN.

**Problemas/Fixes:** Se corrigieron los hallazgos del code review. Permanece el warning conocido `CONTACT_FORM_KEY`.

**Outcome:** success

### [2026-07-23] Task 2: Crear las primitivas de superficie y migrar cards

**Archivos implementados:** `src/components/Card.astro` y `src/components/PageIntro.astro`.

**Archivos migrados:** `src/components/BlogCard.astro`, `src/components/ProjectCard.astro` y `src/components/AppCard.astro`, conservando sus enlaces y datos.

**Pruebas:** `pnpm exec vitest run src/components/card-contract.test.ts` pasa 3/3; `pnpm build` termina con Astro exit 0 y genera 1043 páginas.

**Code review:** revisión independiente CLEAN.

**Dependencias y baseline:** No se introdujeron dependencias. El warning conocido `CONTACT_FORM_KEY` permanece sin cambios como baseline.

**Outcome:** success

### [2026-07-23] Task 3: Completar strings y rutas localizadas

**Localización:** Se añadieron claves de UI equivalentes en EN/ES y se localizaron el `Header` y las páginas dinámicas de Apps y Blog en ambos idiomas.

**Pruebas:** localization-contract + utils pasan 27/27; `pnpm build` termina con Astro exit 0 y genera 1043 páginas.

**Code review:** CLEAN.

**Dependencias y baseline:** No se introdujeron dependencias nuevas. Permanece el warning conocido `CONTACT_FORM_KEY`.

**Outcome:** success

### [2026-07-23] Task 4: Rediseñar header y navegación móvil

**Header y navegación:** Se implementó un panel móvil delimitado y localizado, estado activo con `aria-current` y borde, y gestión coherente de `aria-hidden`/`data-state`. La interacción cubre foco, Escape, click exterior y cleanup.

**Pruebas:** header test 3/3; `pnpm build` termina con Astro exit 0 y genera 1043 páginas.

**Code review:** CLEAN.

**Entorno de pruebas y baseline:** El mock de `localStorage` solo estabiliza el entorno jsdom de Vitest y no modifica producción. Permanece el warning conocido `CONTACT_FORM_KEY`.

**Outcome:** success
