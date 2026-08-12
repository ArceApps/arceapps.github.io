# Fix enlaces rotos del blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use specai:specai-subagent-driven-development (recommended) or specai:specai-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver los 9 fallos de `links-validation.test.ts` corrigiendo los enlaces internos rotos en 2 posts (EN y ES) hacia sus equivalentes correctos/existentes, sin tocar el validador ni el contenido editorial.

**Architecture:** Cambios de markdown puro en `src/content/blog/en/agent-skills-addyosmani-lifecycle-completo.md` (8 links) y `src/content/blog/es/buzz-mobile-coding-agent.md` (1 link). Cada link se reescribe al slug que el validador resuelve (mismo locale). Verificación: `pnpm test` con `links-validation` verde + build.

**Tech Stack:** Markdown, Vitest (validador existente). Sin dependencias nuevas.

**Status:** 🟢 BACKLOG

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

<!-- Documenter appends entries here, format:
### [<ISO date> <ISO time>] Task <N>: <title>
**Done:** ...
**Why:** ...
**Outcome:** ✅ success | ❌ failed
**Problems & fixes:** ...
-->
