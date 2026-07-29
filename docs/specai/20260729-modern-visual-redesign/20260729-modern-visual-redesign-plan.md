# Rediseño visual moderno integral de ArceApps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use specai:specai-subagent-driven-development (recommended) or specai:specai-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un sitio editorial moderno, bilingüe y accesible con Projects internos y SkillsAI atribuible.

**Architecture:** Astro Content Collections será la fuente de Apps y Projects. Los componentes reutilizables aplicarán el sistema definido en `DESIGN.md`; las rutas EN/ES conservarán el mismo contrato. SkillsAI se prepara en su repositorio y se conecta al sitio solo tras la verificación pública.

**Tech Stack:** Astro 5, TypeScript estricto, Tailwind 4, DaisyUI, Vitest y Playwright existentes.

**Status:** 🟢 BACKLOG

---

## Dependency & Package Validation

No se instalarán paquetes. `package.json` ya incluye Astro, TypeScript, Vitest y Playwright; no existe riesgo de dependencia nueva.

## File map

- Contenido: `src/content/config.ts`, crear `src/content/projects/{en,es}/*.md`, retirar `src/data/projects.json` al terminar.
- Projects: `src/pages/{,es/}projects.astro`, crear `src/pages/{,es/}projects/[...slug].astro`, `src/components/ProjectCard.astro`.
- Sistema visual: `src/styles/global.css`, `Card.astro`, `Header.astro`, `Footer.astro`, `Hero.astro`, `PageIntro.astro` y listados públicos.
- Home y blog: `src/components/pages/HomePage.astro`, `src/pages/{,es/}blog/[...slug].astro`.
- i18n y pruebas: `src/i18n/ui.ts`, contratos Vitest existentes y pruebas nuevas de Projects.
- Repositorio independiente: `/home/arceappspc/Projects/ArceApps/skillsAI`.

## Waves y coordinación

| Wave | Trabajo | Depends On | Parallelizable | Requires Solo | Workspace | Shared Resources |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Baseline, contratos y tokens | — | No | Sí | arceapps.github.io | config, global.css |
| 1 | Colección Projects y contenido | 0 | Sí, con SkillsAI audit | No | arceapps.github.io | config, i18n |
| 1 | Auditoría SkillsAI/licencias | 0 | Sí, con Projects | No | skillsAI | README, notices |
| 2 | Rutas Projects, Home y componentes | 1 | Parcial | Sí | arceapps.github.io | ProjectCard, i18n |
| 2 | Copias/adaptaciones SkillsAI | auditoría | No | Sí | skillsAI | registry de procedencia |
| 3 | TOC, header, footer y rutas restantes | 2 | Sí por archivos disjuntos | No | arceapps.github.io | global.css |
| 4 | Hacer SkillsAI público y confirmar | 2 SkillsAI | No | Sí, checkpoint humano | GitHub/skillsAI | visibilidad externa |
| 5 | Enlace final, pruebas visuales y build | 3, 4 | No | Sí | arceapps.github.io | rutas, enlaces |

## Execution rules

- Publicar SkillsAI es un checkpoint humano de alto riesgo: revisar licencia, scripts y destino antes de cambiar visibilidad.
- El sitio no enlaza SkillsAI hasta que GitHub confirme `visibility: public`.
- Las copias de terceros no se presentan como originales; el registro individual conserva enlace, autor, licencia, modificaciones y razón.
- Todo contenido y UI se implementa EN/ES; no se introducen cadenas UI hardcodeadas.
- Cada wave termina con sus contratos afectados y `pnpm test`; la integración termina con `pnpm build` y comprobación de 1280 px.
