# Fix enlaces rotos del blog — PRD

**Feature ID:** 20260812-fix-broken-blog-links
**Fecha:** 2026-08-12
**Estado:** 🟢 BACKLOG (pendiente de aprobación del PRD y plan)
**Prioridad:** Alta (9 tests fallando en `links-validation.test.ts`)

---

## 1. Problema

La suite de tests tiene **9 fallos** en `src/utils/links-validation.test.ts` (enlaces internos del blog que apuntan a posts inexistentes en su locale). Todos los fallos están en **2 archivos**:

- `src/content/blog/en/agent-skills-addyosmani-lifecycle-completo.md` — 8 links rotos (con duplicados por aparecer en 2 secciones)
- `src/content/blog/es/buzz-mobile-coding-agent.md` — 1 link roto

**Causa raíz:** los autores escribieron links a posts del otro locale (slugs ES dentro de un post EN y viceversa) o con slugs desactualizados, y en un caso con un `]` extra (sintaxis markdown rota).

## 2. Objetivos

1. Que `links-validation.test.ts` pase con 0 fallos.
2. Que cada enlace interno apunte al post **correcto y existente** en su locale (o al equivalente traducido cuando exista).
3. Sin cambios de contenido editorial: solo se corrigen los enlaces (texto visible intacto).

## 3. No objetivos

- ❌ Crear traducciones EN de posts que solo existen en ES.
- ❌ Reescribir o editar el contenido de los posts (solo los enlaces).
- ❌ Cambiar el validador (`links-validation.test.ts`) para que ignore enlaces — el validador es correcto.
- ❌ Tocar `blog-link-resolution.ts` ni los redirects (salvo que se decida lo contrario).

## 4. Mapa de correcciones (decidido en grounding)

### `en/agent-skills-addyosmani-lifecycle-completo.md` (8 fallos)

| Link actual (roto) | Corrección | Evidencia |
|---|---|---|
| `/blog/agentes-ia-skills/` (x2: línea 25 y refs) | `/blog/building-ai-agent-skills/` | Traducción EN confirmada (2025-05-24, títulos equivalentes) |
| `/blog/agent-skills-contexto-dinamico/` (x2: línea 25 y refs) | `/blog/ai-agent-skills-dynamic-context/` | **Supuesto de producto**: post EN relacionado (mismo tema, fecha distinta — no es traducción exacta). DECISIÓN PENDIENTE DE CONFIRMAR (default: esta) |
| `/blog/sdd-frameworks-spec-kit-openspec-bmad/` (x2: línea 25 y refs) | `/blog/sdd-frameworks-analysis-spec-kit-openspec-bmad/` | Traducción EN confirmada (2026-03-28) |
| `/blog/servidores-mcp-memoria-cross-agent/]` (línea 460, con `]` extra) | `/blog/mcp-servers-memory-cross-agent/` | Traducción EN confirmada (2026-06-12) + arreglar sintaxis `]` |
| `/blog/specs-driven-development/` (refs, línea 538) | `/blog/spec-driven-development-ai/` | Traducción EN confirmada (2026-03-24) |

Nota: el link `/blog/persistent-memory-stack-implementation/` de línea 460 **NO está roto** (el EN existe) — el validador no lo reporta.

### `es/buzz-mobile-coding-agent.md` (1 fallo)

| Link actual (roto) | Corrección | Evidencia |
|---|---|---|
| `/blog/persistent-memory-stack-implementation` (línea 410) | `/blog/stack-memoria-persistente-implementacion` | El post ES correcto es `es/stack-memoria-persistente-implementacion.md` (el slug EN apunta a un archivo inexistente en ES) |

## 5. Criterios de éxito

Viven **solo** en `20260812-fix-broken-blog-links-verify.md`. Resumen: `pnpm test` con `links-validation` 10/10 PASS (los 9 fallos resueltos), resto de suites sin regresiones, build OK.

## 6. Decisión pendiente (supuesto por defecto)

El link `agent-skills-contexto-dinamico` (sin traducción EN exacta) se corregirá apuntando al post EN relacionado `ai-agent-skills-dynamic-context`. Alternativas: apuntar al post ES con prefijo `/es/blog/` (cross-locale), o eliminar el enlace. **Se aplicará el default salvo que el usuario indique lo contrario en la aprobación del plan.**
