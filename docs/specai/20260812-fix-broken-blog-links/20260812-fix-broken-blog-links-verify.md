# Fix enlaces rotos del blog — Verificación

> **Fuente única de verdad de los criterios de aceptación.** Los criterios viven SOLO aquí, nunca en el plan.

**Feature ID:** 20260812-fix-broken-blog-links
**Fecha:** 2026-08-12
**Estado:** Pendiente de ejecución

---

## Criterios de aceptación globales

| ID | Criterio | Cómo se verifica | Estado |
|----|----------|------------------|--------|
| V1 | `links-validation.test.ts` pasa 10/10 (0 fallos) | `npx vitest run src/utils/links-validation.test.ts` | ⬜ |
| V2 | No quedan ocurrencias de los slugs rotos en los 2 posts | `grep` de cada slug roto → 0 resultados en ambos archivos | ⬜ |
| V3 | Todos los slugs destino existen en su locale | `ls src/content/blog/{en,es}/<slug>.md` | ⬜ |
| V4 | Sin regresiones: resto de suites pasan (23/24 archivos o mejor) | `pnpm test` completo | ⬜ |
| V5 | `pnpm build` OK | `pnpm build` | ⬜ |
| V6 | Sin cambios en el validador ni en `blog-link-resolution.ts` ni en `astro.config.mjs` redirects | `git diff` de esos archivos → vacío | ⬜ |
| V7 | Texto visible (anchor) de los enlaces intacto | Revisión del diff: solo cambian URLs | ⬜ |
| V8 | El bug de sintaxis `]` extra de la línea 460 (EN) corregido | grep `cross-agent/]` → 0 resultados | ⬜ |
| V9 | Sin dependencias nuevas | `git diff package.json` → vacío | ⬜ |

## Plantilla de verificación final

> Rellenar tras la Task 5. Solo se considera la feature **completa** cuando el usuario acepta en Gate UA.

| Criterio | Resultado | Evidencia |
|----------|-----------|-----------|
| V1 | ⬜ | |
| V2 | ⬜ | |
| V3 | ⬜ | |
| V4 | ⬜ | |
| V5 | ⬜ | |
| V6 | ⬜ | |
| V7 | ⬜ | |
| V8 | ⬜ | |
| V9 | ⬜ | |

**Gate UA (INQUEBRANTABLE):** la feature no está completa hasta que el usuario pruebe y responda `accept` (o equivalente). Respuestas tipo "iterate"/"bug" → `specai-iteration`. NO mergear antes del `accept`.

---

## Notas

- **Supuesto confirmable en la aprobación:** el link `agent-skills-contexto-dinamico` se corrige a `ai-agent-skills-dynamic-context` (post EN relacionado, no traducción exacta). Si el usuario prefiere cross-locale (`/es/blog/agent-skills-contexto-dinamico/`) o eliminar el enlace, se ajusta antes de ejecutar.
- Los 9 fallos actuales son exactamente: 8 en `en/agent-skills-addyosmani-lifecycle-completo.md` + 1 en `es/buzz-mobile-coding-agent.md`.
