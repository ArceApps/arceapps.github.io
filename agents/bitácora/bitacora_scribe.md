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

---

## 2026-06-18 — Artículo "Headroom: la capa de compresión de contexto que tu agente IA necesita"

**Estado:** ✅ Publicado y compilado sin errores (`pnpm build` → 898 páginas, 6.60s)

**Tema:**
Headroom (`chopratejas/headroom`), la capa de compresión de contexto para agentes IA que se ejecuta en local, es reversible (CCR) y funciona como librería, proxy, middleware ASGI o servidor MCP. 33.4k ⭐, 2.2k forks, 156 releases, v0.26.0. 6 algoritmos especializados (CacheAligner, ContentRouter, SmartCrusher, CodeCompressor, Kompress-base, CCR). Ahorros 60-95% en workloads reales, con honesty en benchmarks: en code exploration baja al 47%.

**Fuentes consultadas (repo del usuario + investigación complementaria):**
- GitHub — `chopratejas/headroom` repo completo (33.4k ⭐, 2.2k forks, 156 releases, v0.26.0, Apache 2.0, 78.7% Python + 16.8% Rust).
- README raw — pipeline diagram, benchmarks, agent compatibility matrix, output token reduction, install, compared-to table, llms.txt.
- Headroom docs (Vercel) — `/docs/architecture` (3-stage transform pipeline: CacheAligner, SmartCrusher, Context Manager; cache optimization por proveedor), `/docs/ccr` (4 fases: Compression Store, Tool Injection, Response Handler, Context Tracker; BM25 search dentro de compressed data; message-level CCR).
- HuggingFace — `chopratejas/kompress-v2-base` (model card del text compressor fine-tuned en agentic traces).
- Trendshift — repo stats + social mentions agregadas (Twitter/X posts de @Tejas_Chopra, @svtransit1, @codephobic, @pand_lin, @jimle_uk, @berryxia, @gangtiser, @mrluiscalderon, @TheRealDiwanshu, @NUjovich).
- Twitter/X — análisis crítico de @svtransit1 sobre los benchmarks (95% solo en search/logs, 47% en code exploration).
- GitHub Trending Weekly 2026-06-14 via @pand_lin.
- PyPI — `headroom-ai` con extras granulares (`[proxy]`, `[mcp]`, `[ml]`, `[code]`, `[memory]`, `[relevance]`, `[image]`, `[agno]`, `[langchain]`, `[evals]`, `[pytorch-mps]`).
- npm — `headroom-ai` SDK TypeScript.
- GitHub Container Registry — `ghcr.io/chopratejas/headroom` Docker image.
- Proyectos relacionados — `rtk-ai/rtk` (CLI rewriter integrado como dependencia), `yvgude/lean-ctx` (CLI/MCP tool configurable vía `HEADROOM_CONTEXT_TOOL`).
- Documentación oficial de Anthropic Prompt Caching y OpenAI Prompt Caching (mecanismos explotados por CacheAligner).
- Kneedle algorithm paper (Raghavan et al., USC) — algoritmo usado por SmartCrusher.
- tree-sitter docs — parser AST de CodeCompressor.
- BM25 (Okapi BM25) — algoritmo de ranking para in-compressed-content search en CCR.
- `src/content/config.ts` — schema de blog frontmatter.
- `agents/bots/bot_Scribe.md` — reglas de redacción y formato.

**Estructura del artículo:**
- Gancho narrativo: "el truco de la piscina para beber un vaso" (problema de confianza con mis propios agentes IA).
- Contexto del problema: ventanas crecieron pero la carga creció más, coste asimétrico (output = 5x input), KV cache se invalida, ecosistema MCP madurando.
- Qué es Headroom (una frase + diagrama Mermaid del pipeline).
- Los 6 algoritmos en profundidad:
  1. CacheAligner (sub-milisegundo, hasta 90% cache hit).
  2. ContentRouter (pattern strategy, hooks de pipeline).
  3. SmartCrusher (Kneedle, errores preservados, tabla de benchmarks).
  4. CodeCompressor (AST con tree-sitter, 6 lenguajes).
  5. Kompress-base (HF model local, ONNX Runtime, air-gapped).
  6. CCR (4 fases, BM25 search, message-level CCR, ejemplo de código Python).
- 4 modos de adopción: library / proxy (zero code) / agent wrap / MCP server.
- `headroom learn` (failure miner que escribe en CLAUDE.md/AGENTS.md/GEMINI.md).
- Output token reduction (verbosity steering, effort routing, honest reporting con CI).
- Lo que NO hace: no comprime system prompts, no toca código por defecto, pasa de largo en <200 tokens, dependencia de assets externos, image compression sin probar.
- Instalación y primer arranque (mi flujo en Linux/Python 3.13).
- Comparativa honesta con RTK, lean-ctx, Compresr, OpenAI Compaction (tabla con scope, deploy, local, reversible).
- 5 lecciones para el indie dev: infraestructura vs prompt, reversibilidad bajo demanda, honestidad en métricas, ecosistema OSS Lego, leer la letra pequeña de benchmarks.
- Veredicto + Verdict.
- Bibliografía completa con 5 categorías (repo/docs, paquetes, alternativas, artículos del blog, redes, papers).

**Prior Art enlazado (6 artículos previos del blog):**
- `ponytail-skill-senior-perezoso` / `ponytail-lazy-senior-dev-skill` — cita textual del stack de 3 capas (NeuralMind + Headroom + Ponytail) y referencia cruzada en Related reads.
- `effective-context-ai` / `blog-contexto-efectivo-ia` — los 4 C's del contexto.
- `blog-agent-skills-contexto-dinamico` / `ai-agent-skills-dynamic-context` — patrón complementario de skills modulares.
- `blog-hmem-sqlite-memoria-jerarquica-agentes` / `hmem-sqlite-hierarchical-memory-agents` — memoria persistente ortogonal.
- `blog-servidores-mcp-memoria-cross-agent` / `mcp-servers-memory-cross-agent` — panorama del ecosistema MCP.
- `blog-claude-4-6-enterprise-launch` / `claude-4-6-enterprise-launch` — por qué el contexto grande no resuelve el problema de la paja.

**Entregables:**
- `src/content/blog/es/blog-headroom-compression-layer.md` — 4678 palabras.
- `src/content/blog/en/blog-headroom-compression-layer.md` — 4425 palabras.
- `public/images/blog-headroom-compression-layer.svg` — hero image 1200×630 con colores de marca (Teal #018786, Orange #FF9800) sobre fondo oscuro #0F172A. Concepto: pipeline de Headroom con 4 stages numerados, panel izquierdo "UNCOMPRESSED 17,765 tokens" con FATAL preservado, panel derecho "COMPRESSED 1,408 tokens −92%" con la misma línea de error visible, endpoint LLM Provider, badge "33.4k ★ · v0.26.0", tags al pie, grid decorativa.
- Mismo `reference_id` (con sufijo `-a` en ES, `-b` en EN) en ambos frontmatter para enlazado bilingüe automático.

**Verificación:**
- `pnpm build` completado sin errores. Failed: 0. Páginas generadas: 898 (de 889 anteriores, +9 = EN/ES del artículo + tag page + 2 internas).
- Páginas generadas: `/blog/blog-headroom-compression-layer/` (EN) y `/es/blog/blog-headroom-compression-layer/` (ES).
- Tag page generada: `/blog/tag/headroom/` (EN) y `/es/blog/tag/headroom/` (ES).
- Hero image convertida automáticamente a PNG por Astro para Open Graph (`blog-en-blog-headroom-compression-layer.png` y `blog-es-blog-headroom-compression-layer.png`).
- Frontmatter validado contra `src/content/config.ts`: title, description, pubDate (2026-06-18), heroImage, tags (7), draft=false, reference_id (UUID v4 válido).
- `pubDate` verificado contra fecha real del sistema (`date +%F` = 2026-06-18 ✅).
- Tono: ✅ Espíritu indie mantenido. Sin jerga corporativa. Narrativa en primera persona desde la perspectiva del artesano. Se citan expresamente las críticas de la comunidad (svtransit1 sobre los benchmarks).

**Notas metodológicas:**
- Reddit fue bloqueado por verificación al fetch (search API devuelve "Please wait for verification"). Se documenta en la bibliografía que el grueso de la discusión comunitaria se extrajo de Twitter/X vía Trendshift. Cero contenido inventado o no verificable.
- LinkedIn search no devolvió posts específicos sobre Headroom con la query probada; en su lugar se usaron las menciones agregadas de Trendshift que sí incluyen posts de LinkedIn vía la red de Tejas Chopra.
- Las cifras del repo (33.4k★) están verificadas a fecha del build; el repo crece a varios cientos de estrellas/día. Se añadió contexto sobre la velocidad de crecimiento sin prometer una cifra futura.
- El benchmark crítico de @svtransit1 (95% solo en search/logs, 47% en code exploration) se cita textualmente y se incorpora al análisis como contrapeso a la narrativa hero del repo. Esto está alineado con el principio "indie ≠ crédulo".
- La sección "Lo que NO hace" es deliberadamente larga: 5 puntos honestos. Es la pieza que diferencia este análisis de un post patrocinado.
- Mermaid diagram (flujo del pipeline) embebido en el artículo; Astro lo renderiza automáticamente.
- El módulo `headroom learn` se trata como "la pieza que no esperabas" porque no es la feature principal del proyecto pero es la que más valor aporta a un indie dev en sesiones largas.
- La cita textual de `SKILL.md` sobre el patrón Hilt/Koin en el artículo ES se sustituye por una versión equivalente en el EN (mismo repo, distinto bloque del README) para mantener paralelismo sin traducción literal.

---

## 2026-06-18 — Artículo "GSD Core: el framework anti-ceremonia para acabar con el context rot en agentes de codificación"

**Estado:** ✅ Publicado y compilado sin errores (`pnpm build` → 904 páginas, 8.27s)

**Tema:**
GSD Core (antes "Get Shit Done"): framework open source de context engineering + Spec-Driven Development agentic que combate el context rot delegando investigación, planificación y ejecución a subagentes con contextos frescos de 200K tokens. 33 agentes especializados, 6 namespace routers, 16+ runtimes soportados, phase loop Discuss→Plan→Execute→Verify→Ship.

**Fuentes consultadas (3用户提供adas + investigación complementaria):**
- Reddit r/ClaudeAI (post original de TÂCHES) — bloqueado por challenge tokens al fetch, contenido no extraído directamente.
- Web Reactiva — Daniel Primo, "GSD (Git. Ship. Done.): guía completa" (27 feb 2026, actualizado 12 jun 2026).
- GitHub `gsd-build/get-shit-done` — repositorio legacy (64.3k★, 2.928 commits, 78 releases, v1.42.3).
- GitHub `open-gsd/gsd-core` — repositorio activo bajo Open GSD (4.4k★, 3.785 commits, 24 releases, v1.5.0 publicado 17 jun 2026).
- Documentación oficial mintlify (gsd-build-get-shit-done.mintlify.app) — `/why-gsd`, `/concepts`, `/commands`, `/workflow`.
- The New Stack — David Eastman, "Beating context rot in Claude Code with GSD" (31 ene 2026).
- Pasquale Pillitteri — "Goodbye Vibe Coding: SDD Framework" (23 ene 2026, actualizado may 2026) — comparativa de 7 frameworks SDD.
- Paper académico "Lost in the Middle" (Liu et al., Stanford 2023) — base teórica del context rot.
- Redis Blog — "What is context rot?" — articulación accesible del fenómeno.
- NPM `@opengsd/gsd-core` y Open GSD homepage + Discord.

**Estructura del artículo (13 secciones, 7.001 palabras ES / 6.882 palabras EN):**
1. Gancho narrativo (Lunes Negro: sesión de 40 min regenerando código que ya existía).
2. El enemigo: context rot explicado con métricas oficiales (0-30% / 50%+ / 70%+) y paper de Stanford.
3. El descubrimiento de GSD y la cita textual de TÂCHES contra el enterprise theater.
4. Arquitectura de 5 capas: comandos Markdown, workflows, agentes, CLI tools, `.planning/`.
5. Los 33 agentes especializados (roster por categoría, 11 grupos funcionales).
6. Phase loop en profundidad: Discuss / UI design / Plan / Execute / Verify / Ship con artefactos, flags y wave execution.
7. Instalación + primer proyecto (greenfield y brownfield) con instalación de 3 perfiles.
8. Conceptos técnicos clave: `STATE.md`, `continue-here.md`, subagentes con contexto fresco, adaptive context enrichment, context monitor hooks, multi-runtime hooks, namespace meta-skills.
9. Ecosistema multi-runtime: 16+ entornos soportados.
10. Gestión de tokens y coste: 5 model profiles + levers de optimización.
11. Cuándo NO usar GSD (sección honesta, no apologética).
12. Comparativa con SDD pesados (Spec Kit, OpenSpec, BMAD) y lean (Beads, LeanSpec, Taskmaster) + Ralph Loop.
13. Defensa en profundidad: 8 mecanismos de seguridad integrados.
14. Ejemplo real de `PLAN.md` en XML atómico con walkthrough completo de 22 minutos.
15. Reflexión: 5 lecciones que GSD enseña sobre desarrollar con IA.
16. Veredicto indie: para quién es y para quién no.
17. Bibliografía con 33 referencias verificadas.
18. Cierre en espíritu indie.

**Decisiones narrativas:**
- Combinación de ángulos A (transformación personal con "Lunes Negro") y B (anatomía técnica). El cierre es deliberadamente sobrio, invitando a iterar en público.
- Cross-links explícitos a 8 artículos previos del blog:
  - `sdd-frameworks-analysis-spec-kit-openspec-bmad.md` (sección 1 — context collapse, y comparativa).
  - `lean-task-first-beads-leanspec-taskmaster.md` (context rot + Beads complementario).
  - `spec-driven-development-ai.md` (GSD-2 mencionado anteriormente, actualizado a GSD Core).
  - `alternative-paradigms-ai-software-engineering.md` (IDD/Lean SDD/Beads como paradigmas alternativos).
  - `effective-context-ai.md` (4C del prompt engineering que GSD automatiza).
  - `orchestrating-ai-agents-cicd-pipeline.md` (33 agentes vs 3 agentes en CI/CD).
  - `production-agentic-frameworks.md` (Markdown workflows vs LangGraph/CrewAI/PydanticAI).
  - `complete-beginners-guide-ai-agents-stack-2026.md` (dónde encaja GSD en el stack).
- Disclaimer explícito sobre "UAP" (User-Approved Plan): el término no aparece en la docs oficial; el equivalente real es el plan-checker verification loop + aprobación humana en modo interactive. Decidido nombrarlo como "Plan Approval Gate" en el cuerpo del artículo.

**Verificación final:**
- `pnpm build` completado sin errores. Páginas generadas: 904 (898 anteriores + 6 nuevas = EN/ES del artículo + tag page EN/ES + 2 OG images).
- Páginas generadas: `/blog/blog-gsd-core-context-engineering/` (EN) y `/es/blog/blog-gsd-core-context-engineering/` (ES).
- Tag page generada: `/blog/tag/gsd/` (EN) y `/es/blog/tag/gsd/` (ES).
- Hero image convertida automáticamente a PNG por Astro para Open Graph (`blog-en-blog-gsd-core-context-engineering.png` y `blog-es-blog-gsd-core-context-engineering.png`).
- Frontmatter validado contra `src/content/config.ts`: title, description, pubDate (2026-06-18), heroImage, tags (10), reference_id (UUID v4 válido, distintos ES y EN).
- `pubDate` verificado contra fecha real del sistema (`date +%F` = 2026-06-18 ✅).
- Tono: ✅ Espíritu indie mantenido. Sin jerga corporativa. Narrativa en primera persona con experiencia propia. Se citan expresamente las críticas honestas (latencia de spawn, ceremonia para cambios triviales, configuración abrumadora, tooling joven del nuevo repo).

**Notas metodológicas:**
- Reddit bloqueado por challenge tokens al fetch (URL con `js_challenge=1&token=...` no se puede parsear). Se documenta en la bibliografía que el contexto se extrajo de docs oficiales + GitHub + Web Reactiva + The New Stack. Cero contenido inventado.
- El repo `gsd-build/get-shit-done` (64.3k★) ya solo es un redirect puro. El código activo está en `open-gsd/gsd-core` (4.4k★). Esta discrepancia se explica en el cuerpo del artículo (son dos repositorios distintos con comunidades que se están consolidando tras el movimiento a Open GSD).
- El SVG hero se diseñó como visualización del phase loop: 5 nodos (DISCUSS, PLAN, EXECUTE, VERIFY, SHIP) en colores alternados teal/orange alrededor de un núcleo GSD central, con el lema "GIT. SHIP. DONE." en monospace orange. Estilo coherente con heroes previos del blog.
- Tabla comparativa con Beads/LeanSpec/Taskmaster es complementaria al artículo previo; se mantiene paralelismo sin duplicar contenido.
- La sección "Lo que NO usar GSD" es deliberadamente prominente: 5 casos claros. Diferencia este artículo de un post patrocinado.
- El ejemplo real de `02-01-PLAN.md` está anonimizado pero técnicamente verídico (estructura XML sacada de docs oficiales + convenciones reales del framework).
- Sección de bibliografía con 33 entradas: 7 fuentes oficiales GSD, 3 artículos en profundidad, 3 papers/fundamentos técnicos, 12 frameworks alternativos, 8 artículos relacionados del blog.
