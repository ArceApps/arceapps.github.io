# Fix enlaces rotos del blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use specai:specai-subagent-driven-development (recommended) or specai:specai-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver los 9 fallos de `links-validation.test.ts` corrigiendo los enlaces internos rotos en 2 posts (EN y ES) hacia sus equivalentes correctos/existentes, sin tocar el validador ni el contenido editorial.

**Architecture:** Cambios de markdown puro en `src/content/blog/en/agent-skills-addyosmani-lifecycle-completo.md` (8 links) y `src/content/blog/es/buzz-mobile-coding-agent.md` (1 link). Cada link se reescribe al slug que el validador resuelve (mismo locale). Verificación: `pnpm test` con `links-validation` verde + build.

**Tech Stack:** Markdown, Vitest (validador existente). Sin dependencias nuevas.

**Status:** 🟡 IN PROGRESS → ✅ DONE (verificado, pendiente Gate UA)

---

## Dependency & Package Validation

Sin paquetes nuevos. Riesgo de dependencia: **ninguno**.

## Constraints & Guardrails

- **NO tocar** `links-validation.test.ts`, `blog-link-resolution.ts`, ni los `redirects` de `astro.config.mjs`.
- Solo cambian las **URLs destino** de los enlaces; el texto visible (anchor) se mantiene intacto.
- Los cambios se hacen en rama `feature/arceapps.github.io_20260812-fix-broken-blog-links` (creada tras aprobación).
- Commits por tarea, solo de los archivos tocados. Nunca commitear `dist/`, `public/images/og/*` ni el `pnpm-lock.yaml` con drift ajeno.
- Los documentos specai se commitean en `main` antes de crear la rama (Gate P2).
- Idiomas: los nombres de archivos y commits en inglés; la documentación en español (AGENTS.md).

## Architectural Notes

1. **Mapeo de correcciones** (decidido en grounding, ver PRD §4):
   - EN: `agentes-ia-skills` → `building-ai-agent-skills`
   - EN: `agent-skills-contexto-dinamico` → `ai-agent-skills-dynamic-context` (supuesto, PRD §6)
   - EN: `sdd-frameworks-spec-kit-openspec-bmad` → `sdd-frameworks-analysis-spec-kit-openspec-bmad`
   - EN: `servidores-mcp-memoria-cross-agent/]` (con `]` extra) → `mcp-servers-memory-cross-agent`
   - EN: `specs-driven-development` → `spec-driven-development-ai`
   - ES: `persistent-memory-stack-implementation` → `stack-memoria-persistente-implementacion`
2. Cada slug roto puede aparecer **2 veces** en el post EN (línea 25 y sección de referencias). Se corrigen TODAS las ocurrencias.
3. El validador exige que `/blog/<slug>` resuelva en el mismo locale (EN→`en/<slug>.md`, ES→`es/<slug>.md`). Todos los destinos del mapeo cumplen.

## File map

| Archivo | Responsabilidad | Estado |
|---------|-----------------|--------|
| `src/content/blog/en/agent-skills-addyosmani-lifecycle-completo.md` | 8 enlaces a corregir | Por modificar |
| `src/content/blog/es/buzz-mobile-coding-agent.md` | 1 enlace a corregir | Por modificar |
| `docs/specai/20260812-fix-broken-blog-links/*.md` | Documentos specai del fix | Este conjunto (5 archivos) |

## Delta

### ADDED Requirements
- (no system-level changes)

### MODIFIED Requirements
- (no system-level changes)

### REMOVED Requirements
- (no system-level changes)

## Execution Log

_Living record, updated by the documenter subagent. Do not edit by hand._

### [2026-08-12 13:15] Task 1: Commit de los documentos specai (main)
**Done:** 5 documentos commiteados en `main` (commit `268899f`).
**Why:** Gate P2: los documentos viven sin rama.
**Outcome:** ✅ success

### [2026-08-12 13:16] Task 2: Rama feature
**Done:** Rama `feature/arceapps.github.io_20260812-fix-broken-blog-links` creada.
**Outcome:** ✅ success

### [2026-08-12 13:20] Task 3: Fix 8 enlaces del post EN
**Done:** Commit `135a5e9`. Corregidos: `agentes-ia-skills`→`building-ai-agent-skills` (x2), `agent-skills-contexto-dinamico`→`ai-agent-skills-dynamic-context` (x2, supuesto PRD §6), `sdd-frameworks-spec-kit-openspec-bmad`→`sdd-frameworks-analysis-spec-kit-openspec-bmad` (x2), `servidores-mcp-memoria-cross-agent/]`→`mcp-servers-memory-cross-agent` (x1, +fix `]` extra), `specs-driven-development`→`spec-driven-development-ai` (x1).
**Why:** PRD §4 (mapeo verificado por pubDate/título).
**Outcome:** ✅ success — validador EN limpio.

### [2026-08-12 13:22] Task 4: Fix 1 enlace del post ES
**Done:** Commit `7b17f8d`. `persistent-memory-stack-implementation`→`stack-memoria-persistente-implementacion` (línea 410).
**Outcome:** ✅ success — validador 2/2 PASS.

### [2026-08-12 13:25] Task 5: Verificación completa + living docs
**Done:** `pnpm test`: **24/24 archivos, 157/157 tests PASS** (antes: 1 archivo fallando, 9 tests rotos). `pnpm build` OK (1061 páginas). V1-V9 ✅.
**Outcome:** ✅ success — pendiente Gate UA.

### [2026-08-12 13:35] Gate UA: aceptación del usuario
**Done:** Usuario: "Adelante con el cierre usando el flujo de specai" (aceptación explícita).
**Outcome:** ✅ Gate UA superado. Decisión de integración: opción 1 (merge a `main` local + push a origin), la misma que en la feature anterior.
