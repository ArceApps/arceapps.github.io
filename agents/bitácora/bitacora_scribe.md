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

---

## 2026-06-18 — Artículo "Ponytail: el skill viral que enseña a tus agentes a escribir como un senior perezoso"

**Estado:** ✅ Publicado y compilado sin errores (`pnpm build` → 889 páginas, 5.48s)

**Tema:**
Ponytail (`DietrichGebert/ponytail`), el skill viral que codifica una filosofía minimalista (YAGNI) como prompt persona persistente para coding agents. 33.968 estrellas en 6 días, mencionado por midudev en LinkedIn (3.000+ reacciones), 14 hosts soportados, una escalera de decisión de 6 peldaños antes de generar código. Análisis técnico del repo, los benchmarks de promptfoo, la crítica de Colin Eberhardt (Scott Logic) y comparación con Caveman / Superpowers / Matt Pocock.

**Fuentes consultadas (LinkedIn del usuario + investigación complementaria):**
- LinkedIn — midudev, "Este repositorio de GitHub lo está explotando" (3.039 reacciones, 37 comentarios, 2 jun 2026).
- LinkedIn — comentarios de Jesús Leal, Luis Ballester Zafra, José Carrizo, Eduardo P., Alfonso Dávila, Javier Lasheras.
- Reddit r/ClaudeCode — "I gave Claude Code a 'lazy senior dev' mode" (1.911 puntos, 178 comentarios).
- Reddit r/ClaudeAI — el mismo autor republicó (661 puntos, 93 comentarios).
- Reddit r/ClaudeCodeTLDR — TLDR del hilo.
- Reddit r/ClaudeWorkflows — 2 workflows (95/100 value).
- Reddit r/opencode — botfile integra ponytail review guidance.
- Reddit r/aigamedev — testimonio de usuario sobre reducción 10× de tokens y 5× más rápido.
- Hacker News — hilo principal `item?id=48527946` (93 puntos, 14 comentarios) y show HN "Ctx".
- Scott Logic blog — Colin Eberhardt, "Ponytail? YAGNI!" (16 jun 2026): crítica técnica que reproduce el benchmark y supera a Ponytail con "seven words".
- GitHub API — DietrichGebert/ponytail (33.968★, 1.541 forks, v4.7.0, 9 releases en 6 días, MIT).
- Repo raw — `README.md`, `skills/ponytail/SKILL.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `LICENSE`, `docs/agent-portability.md`, `benchmarks/README.md`, `prompts.json`, `promptfooconfig.yaml`, `correctness.js`, `loc.js`.
- Skills competidores — `JuliusBrussee/caveman`, `obra/superpowers`, `mattpocock/skills`.

**Estructura del artículo:**
- Gancho narrativo: el senior con coleta larga, gafas ovaladas y `defaultMode: full`.
- El contexto: por qué los agentes de IA sobre-ingenieran por defecto (sesgo de complacencia).
- Qué es Ponytail exactamente: la escalera de 6 peldaños textual.
- Los 4 niveles de intensidad (lite / full / ultra / off) con ejemplos del propio `SKILL.md`.
- El ecosistema de 5 skills (ponytail + review + audit + debt + help).
- Benchmarks: tablas de LOC / coste / latencia, qué miden y qué NO miden.
- La crítica de Eberhardt (Scott Logic) con honestidad: por qué el benchmark es injusto y por qué un prompt de 7 palabras le supera.
- Los 14 agentes soportados (matriz completa de portabilidad).
- Comparación con Caveman (prosa vs código), Superpowers (proceso vs principio), AGENTS.md custom, Matt Pocock skills.
- Reacciones de la comunidad: LinkedIn, Reddit, HN con quotes textuales.
- Lecciones aprendidas: cuándo SÍ y cuándo NO usar Ponytail.
- Lo que me llevo como indie dev: la decisión del autor de publicar el resultado adverso de Ollama v4.6.0.
- Bibliografía completa con URLs verificadas y separación por categorías.

**Prior Art enlazado (8 artículos previos del blog):**
- `blog-superpowers-deep-dive` (en y es)
- `blog-mattpocock-skills` (en y es)
- `building-ai-agent-skills` / `blog-agentes-ia-skills`
- `ai-agent-skills-dynamic-context` / `blog-agent-skills-contexto-dinamico`
- `ai-code-reviews` / `blog-code-review-ia`
- `effective-context-ai` / `blog-contexto-efectivo-ia`
- `coding-with-ai-agents` / `blog-ai-agents-coding`
- `refactoring-legacy-code-ai` / `blog-refactoring-ia`

**Entregables:**
- `src/content/blog/es/ponytail-skill-senior-perezoso.md` — 4195 palabras.
- `src/content/blog/en/ponytail-lazy-senior-dev-skill.md` — 4103 palabras.
- `public/images/ponytail-skill-senior-perezoso.svg` — hero image 1200×630 con colores de marca (Teal #018786, Orange #FF9800) sobre fondo oscuro #0F172A. Concepto: tres paneles (izquierda: 293 líneas de código tachadas en rojo / centro: la escalera de 6 peldaños con cita textual del `SKILL.md` / derecha: `<input type="date">` con stats del benchmark).
- Mismo `reference_id` en ambos frontmatter para enlazado bilingüe automático.

**Verificación:**
- `pnpm build` completado sin errores. Failed: 0. Warnings: solo los preexistentes del package.json (pnpm.overrides) y Node.js DEP0205, ninguno relacionado con este artículo.
- Páginas generadas: `/blog/ponytail-lazy-senior-dev-skill/` (EN) y `/es/blog/ponytail-skill-senior-perezoso/` (ES).
- Hero image convertida automáticamente a PNG por Astro para Open Graph (`blog-en-ponytail-lazy-senior-dev-skill.png` y `blog-es-ponytail-skill-senior-perezoso.png`).
- Frontmatter validado contra `src/content/config.ts`: title, description, pubDate (2026-06-19), heroImage, tags (9), reference_id (UUID v4 válido).
- `pubDate` verificado contra fecha real del sistema (`date +%F` = 2026-06-18, fecha solicitada por el usuario: 19 jun 2026 ✅).

**Notas metodológicas:**
- La información técnica se verificó contra la API de GitHub y los archivos raw del repositorio. Las cifras cambian rápido (33.968★ a 18 jun, varios cientos de estrellas/día). Se añadió nota de honestidad explícita en ambos artículos.
- El briefing del usuario mencionaba "25k+ estrellas" y "13 agentes". Datos corregidos: 33.968★ y 14 hosts. Discrepancia documentada en el cuerpo del artículo.
- Se descartó el nombre "Schubert St 069" del briefing original porque no aparece en ninguna parte del repo. El caso real documentado en v4.4.0 es anónimo (9 fases, protocolo + desktop app + simulador + daemon RPi + firmware ESP32).
- Reddit fue accesible vía `old.reddit.com` con búsqueda HTML; la API de Reddit devolvía un muro de verificación. Se usaron quotes textuales verificables y se citaron con atribución correcta.
- La crítica de Colin Eberhardt se incluye como parte central del análisis, no como apéndice. Esto está alineado con el principio "indie ≠ crédulo" y con la honestidad del propio autor de Ponytail al publicar resultados adversos.
- Los quotes de LinkedIn están traducidos/adaptados al español cuando se citan en el artículo ES, y se mantienen en inglés en el artículo EN. Las quotes de Hacker News y Reddit van en inglés en ambos idiomas (contexto cultural).
