# Fix enlaces rotos del blog — Diseños y decisiones

**Feature ID:** 20260812-fix-broken-blog-links
**Fecha:** 2026-08-12

---

## 1. Alternativas consideradas

### A — Corregir los enlaces en los posts (ELEGIDA ✅)
- **Cómo:** reescribir cada link roto al slug correcto/existente en el mismo locale (o al equivalente traducido confirmado).
- **Pros:** arregla la causa raíz; el contenido editorial no cambia; el validador sigue siendo útil.
- **Contras:** requiere conocer el slug correcto de cada caso (grounding hecho).
- **Veredicto:** ✅ la única que arregla el problema de verdad.

### B — Añadir redirects en `astro.config.mjs`
- **Cómo:** mapear cada slug roto a uno existente vía redirects.
- **Pros:** rápido; útil para URLs ya publicadas que no se deben romper.
- **Contras:** no arregla el markdown (los links seguirían "rotos" en fuente y el validador los considera resueltos vía redirect — pero deja basura editorial); los redirects de Astro están pensados para renombres de rutas, no para corregir links de autor.
- **Veredicto:** descartada como solución principal. **Nota:** los redirects existentes de `blog-*` a slugs limpios (p. ej. `/blog/blog-agentes-ia-skills` → `/es/blog/agentes-ia-skills`) sugieren que el patrón del repo SÍ es renombrar slugs y dejar redirects — pero aquí los links rotos son de autor, no renombres históricos.

### C — Modificar el validador para ignorar estos enlaces
- **Cómo:** añadir excepciones en `links-validation.test.ts` o en `resolveBlogSlug`.
- **Pros:** el test pasa sin tocar contenido.
- **Contras:** esconder el problema; el validador es la red de seguridad (su docstring lo dice explícitamente). Mala práctica.
- **Veredicto:** descartada.

### D — Crear traducciones EN de los posts ES faltantes
- **Cómo:** escribir los posts EN que faltan (agentes-ia-skills, etc.) para que los links resuelvan en EN.
- **Pros:** contenido más completo (bilingüe).
- **Contras:** esfuerzo enorme (traducir posts largos) para un problema de enlaces; fuera de alcance de "arreglar los 9 fallos".
- **Veredicto:** descartada para este fix (podría ser feature futura).

## 2. Decisiones técnicas

| ID | Decisión | Justificación |
|----|----------|---------------|
| D1 | Corregir los links en los posts (opción A) | Arregla la causa raíz; validador sigue activo |
| D2 | Mapear cada slug roto a su equivalente traducido confirmado (misma fecha/pubDate y título equivalente) | Evidencia objetiva en grounding |
| D3 | Para `agent-skills-contexto-dinamico` (sin traducción exacta): apuntar al EN relacionado `ai-agent-skills-dynamic-context` (default; alternativas documentadas en PRD §6) | Mantiene el enlace en el idioma del post; reversible |
| D4 | Arreglar el bug de sintaxis de línea 460 (`]` extra dentro del paréntesis del link) | El validador capturó `servidores-mcp-memoria-cross-agent/]` como slug |
| D5 | No tocar el validador ni los redirects | El validador es correcto; los redirects son para renombres históricos |
| D6 | No añadir redirects nuevos para estos casos | Los links de autor corregidos no necesitan redirección (nunca fueron URLs válidas publicadas) |
| D7 | El texto visible de los enlaces (anchor text) se mantiene intacto | Solo cambia la URL destino |

## 3. Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| El "equivalente traducido" no es realmente el mismo post | Baja (4 de 5 confirmados por fecha/título; 1 por supuesto) | Verificación por pubDate idéntica + títulos equivalentes; el supuesto se documenta y confirma en la aprobación |
| Algún link existe en otras partes del post con el mismo texto | Media | Revisión manual con grep de cada slug en todo `src/content/blog/` |
| Regresión en otras suites | Baja | `pnpm test` completo tras el fix |
