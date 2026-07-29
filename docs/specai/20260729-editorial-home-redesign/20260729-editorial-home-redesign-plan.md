# 20260729-editorial-home-redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use specai:specai-subagent-driven-development.
> This plan has three parts: the plan file (`<spec-name>-plan.md`), the tasks list (`<spec-name>-tasks.md`), and the verification report (`<spec-name>-verify.md`).
> Acceptance criteria live ONLY in `<spec-name>-verify.md` — never duplicate them here.
> The documenter subagent updates all files during execution.

**Goal:** Reescribir la pantalla principal (`HomePage.astro`) de la web con un hero editorial tipográfico y cuatro secciones numeradas estilo revista (01 Devlog, 02 Blog, 03 Trabajo destacado, 04 CTA), conservando únicamente los colores de marca Teal `#018786` y Orange `#FF9800`.

**Architecture:** Eliminación total del sistema Bento actual. Reemplazo por un sistema de componentes pequeños y específicos (`src/components/home/*`) con responsabilidades únicas. El `HomePage.astro` se convierte en un orquestador delgado que solo obtiene datos y compone secciones. El contrato del test pasa a ser estructural: presencia/ausencia de patrones en el markup, claves i18n en ambos idiomas.

**Tech Stack:** Astro 5.16.3, Tailwind CSS v4 + DaisyUI 5.5.5, Material Icons, TypeScript estricto, vitest, pnpm.

**Status:** 🟡 IN PROGRESS

---

## Dependency & Package Validation

No se añaden nuevas dependencias. Todo el trabajo se realiza con:

- Astro 5.16.3 (componentes `.astro`, layouts)
- Tailwind v4 + DaisyUI (utility-first styling)
- `@fontsource/material-icons` (iconografía)
- vitest (tests de contrato sobre markup)
- TypeScript (tipado de Props en cada componente)

Verificado en `package.json`. Estado: **Aprobado sin checkpoints** (Gate P2.5: 0 paquetes nuevos).

## Constraints & Guardrails

- **Colores de marca:** solo Teal `#018786` y Orange `#FF9800`. Cualquier otro color queda prohibido.
- **A11y:** `prefers-reduced-motion` respetado; ARIA en iconos decorativos y enlaces `sr-only`; contraste WCAG AA mínimo.
- **Sin gradientes** en fondos de secciones (alineado con el espíritu sobrio y con el test viejo que lo prohibía).
- **TDD:** el contrato del test se reescribe primero y debe fallar; cada cambio de componente lo acerca al verde.
- **DRY:** `BlogCard.astro` se reutiliza tal cual; `HomeSectionHeader.astro` se usa en las cuatro secciones numeradas.
- **i18n:** cualquier string visible para el usuario pasa por `t('...')` y existe en `ui.en` y `ui.es`.
- **Frecuencia de commits:** una tarea atómica = un commit.
- **No tocar:** `Layout.astro`, `BlogCard.astro`, `DevlogIndexPage.astro`, devlogs existentes (incluido el `2026-W25` sobre Bento), páginas de apps/projects/blog/devlog.

## Architectural Notes

1. **Composición horizontal:** cada componente nuevo vive en `src/components/home/` y se enfoca en una sola sección de la home. El `HomePage.astro` solo ensambla.
2. **Cabecera compartida:** `HomeSectionHeader.astro` recibe `number`, `title`, `href?`, `linkText?`. Sin props de idioma: usa `useTranslations(lang)` internamente leyendo sólo el `title` opcional vía prop, no strings.
3. **Datos:** `HomePage.astro` mantiene toda la lógica de `getCollection` con los mismos filtros que usa hoy (`id.startsWith(prefix)`, `!data.draft`, `data.pubDate <= new Date()`, orden por fecha desc, `.slice(0,3)`).
4. **Links:** `linkPrefix = lang === 'es' ? '/es' : ''`. Se aplica en cada enlace interno.
5. **Reutilización i18n:** muchas claves existentes (`home.building_public`, `home.read_entry`, `home.tech_articles`, `home.tech_articles_desc`, `home.view_all_articles`, `home.explore_code`, `home.explore_code_desc`, `home.view_github`, `home.google_play`, `home.view_all_projects`) siguen siendo válidas y se reutilizan sin renombrar.
6. **Nuevas claves i18n:** añadir sólo las que no existen (`home.manifesto`, `home.scroll_hint`, `home.work.title`, `home.work.cta`, `home.devlog.all`) en ambos idiomas. Justificación: las nuevas secciones necesitan copy que no existía.
7. **Eliminación de claves i18n:** en la tarea 10 (cleanup) tras grep que confirme cero usos fuera de los componentes eliminados. Claves candidatas a borrar: `home.bento.*` (12), `home.hero.*` (5), `home.latest_devlog`, `home.building`, `home.building_desc`, `home.view_all_apps`.
8. **Animaciones:** tres clases nuevas en `global.css` (`.home-hero-title`, `.home-hero-manifesto`, `.home-hero-scroll`) reusan el `@keyframes fade-in-up` ya definido (línea 412) y el bloque `@media (prefers-reduced-motion: no-preference)` ya presente.
9. **Contrato del test:** se reescribe primero (TDD); cubre estructura, orden de secciones, i18n bilingüe, eliminación del código viejo. Ningún test se deja como TBD.
10. **Bitácora:** nueva entrada en `src/content/devlog/{en,es}/` siguiendo el patrón de las existentes (frontmatter estricto según `src/content/config.ts`, título `YYYY-W30-editorial-home-redesign` o similar, tags `home`, `editorial`, `redesign`, `typography`, `i18n`). Imagen de portada generada según AGENTS.md §7 (SVG geométrica Teal/Naranja en `public/images/`).

## Delta

```
### ADDED Requirements
- (no system-level changes)

### MODIFIED Requirements
- (no system-level changes)

### REMOVED Requirements
- (no system-level changes)
```

Este plan es feature-level (cambia solo la presentación de la home). No modifica ningún spec de sistema existente.

## Execution Log

_Living record, updated by the documenter subagent. Do not edit by hand._

<!-- Documenter appends entries here, format:
### [<ISO date> <ISO time>] Task <N>: <title>
**Done:** ...
**Why:** ...
**Outcome:** ✅ success | ❌ failed
**Problems & fixes:** ...
-->
