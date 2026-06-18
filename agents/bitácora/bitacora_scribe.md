# Bitácora de Scribe 📝

Registro de actividades del redactor técnico del blog de ArceApps. Producción de artículos bilingües (ES/EN), generación de imágenes de portada y documentación de proyectos.

---

## 2026-06-18 — Artículo "GitHub Agentic Workflows: la automatización con criterio"

**Estado:** ✅ Publicado y compilado sin errores (`pnpm build` → 878 páginas, 6.53s)

**Tema:**
GitHub Agentic Workflows (gh-aw): la capa agentic de GitHub Actions que automatiza triage, fallos de CI y mantenimiento de docs con un coding agent que opera en modo *read-only* y propone acciones a través de Safe Outputs validados.

**Fuentes consultadas (3用户提供adas + investigación complementaria):**
- LinkedIn — GitHub LATAM, "Automatiza lo que se puede predecir" (post del lector).
- Reddit r/devops — bloqueado por verificación al fetch; contenido no extraído.
- Reddit r/devopsjobs — bloqueado por verificación al fetch; contenido no extraído.
- GitHub Blog oficial — "Automate repository tasks with GitHub Agentic Workflows" (Don Syme & Peli de Halleux, feb 2026).
- Repo `github/gh-aw` (4.6k★, v0.79.8) — código fuente, plantillas y workflow `auto-triage-issues.md` en producción.
- Documentación oficial — How They Work + Security Architecture.
- GitHub Next — Agentic Workflows project page + Continuous AI project page.
- Impact Report oficial (14 may 2026) — métricas reales en 15 repos open source.
- Workflow de producción `auto-triage-issues.md` (raw.githubusercontent.com).

**Estructura del artículo:**
- Gancho narrativo (sábado 23:00, CI rojo, flaky test).
- El hueco que CI/CD no cierra.
- Qué es gh-aw: tres conceptos diferenciadores (Markdown workflows, Safe Outputs, Threat Detection).
- Tres capas de guardrails explícitas (sustrato, configuración declarativa, plan).
- AWF, MCP Gateway, content sanitization, integrity filtering.
- Caso real: `auto-triage-issues.md` en producción.
- Métricas del Impact Report (9× median velocity, 651 issues cerrados, FSharp.Formatting ×90).
- Comparativa vs alternativas (Actions clásico, Copilot Coding Agent, Dependabot, etc.).
- Honestidades: no es GA, bug de billing 0.68.4-0.71.3, automation fatigue, coste por run.
- Setup para indie (6 comandos CLI).
- Continuous AI como "tercera pata".
- Cierre: copiloto vs piloto automático.

**Prior Art enlazado (5 artículos previos del blog):**
- `blog-orquestar-agentes-pipeline-cicd` / `orchestrating-ai-agents-cicd-pipeline`
- `blog-automated-documentation` / `automated-documentation-cicd`
- `blog-github-actions` / `github-actions-android-guide`
- `blog-ia-tdd-android` / `tdd-ai-android-development`
- `blog-agentes-ia-autonomos-android` / `autonomous-ai-agents-android`

**Entregables:**
- `src/content/blog/es/github-agentic-workflows-cicd.md` — 3090 palabras.
- `src/content/blog/en/github-agentic-workflows-cicd.md` — 2992 palabras.
- `public/images/github-agentic-workflows-cicd.svg` — hero image geométrica 1200×630 con colores de marca (Teal #018786, Orange #FF9800) sobre fondo oscuro #0F172A. Concepto: agente central rodeado de anillos concéntricos (guardrails), nodos de output en los cuatro puntos cardinales, paneles laterales etiquetados (Safe Outputs, Threat Detection, AWF / Triage, Docs Sync, CI Doctor).

**Verificación:**
- `pnpm build` completado sin errores ni warnings.
- Páginas generadas: `/blog/github-agentic-workflows-cicd/` (EN) y `/es/blog/github-agentic-workflows-cicd/` (ES).
- Hero image convertida a PNG por Astro (`blog-en-...png` y `blog-es-...png`).
- Frontmatter validado contra `src/content/config.ts`: title, description, pubDate (2026-06-18), heroImage, tags (7), draft=false, reference_id (UUID v4).
- `pubDate` verificado contra fecha real del sistema (`date +%F` = 2026-06-18).
- Tono: ✅ Espíritu indie mantenido. Sin jerga corporativa. Narrativa en primera persona desde la perspectiva del artesano.

**Notas metodológicas:**
- Los dos hilos de Reddit del brief original no pudieron consultarse (bloqueados por verificación de Reddit). Se documenta explícitamente en ambos artículos y no se cita contenido no verificado.
- La adaptación EN no es traducción literal: mantiene estructura pero ajusta ejemplos y referencias cuando aporta claridad cultural (ej. "the Saturday at 11 PM" vs "el sábado a las 23:00").
- Se mantiene paridad de calidad y extensión entre ambos idiomas (diferencia <100 palabras atribuible a la bibliografía).
- Se incluye disclaimer sobre la versión retirada 0.68.4-0.71.3 por bug de billing, alineado con el principio "indie ≠ crédulo".
- El ángulo narrativo se centra en "el agente no quita trabajo, lo desplaza al punto donde el humano decide" — tesis alineada con la Teoría de Restricciones y el report oficial.
