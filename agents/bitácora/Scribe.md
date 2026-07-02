# Bitácora de Scribe

## [Fecha de Inicio]
- **Evento:** Nacimiento del Agente.
- **Detalle:** Configuración inicial de Scribe establecida. Objetivo: Elevar el estándar de calidad de todo el contenido escrito en ArceApps.

---

## 2026-03-08 - Investigación: 5 Temas de IA Actuales para el Blog
**Estado:** Completado
**Análisis:**
Se realizó una búsqueda en internet sobre los cinco temas más actuales e importantes de la inteligencia artificial en 2025-2026, con el objetivo de identificar cuáles encajan mejor con el contenido de ArceApps (blog técnico de desarrollo Android).

**Los 5 temas encontrados:**

1. **IA Agéntica y Autonomía de Agentes** — Agentes capaces de tomar decisiones y ejecutar tareas complejas de forma autónoma. Frameworks como LangGraph, AutoGen y CrewAI. Retos de confianza y control.

2. **IA Generativa Avanzada y Multimodal** — GPT-5, Gemini Ultra, Claude 4 procesando texto, imagen, audio y vídeo simultáneamente. Generación de código con contexto completo del proyecto.

3. **Regulación, Ética y Alucinaciones** — EU AI Act en vigor, regulaciones en EE.UU. y Asia. El fenómeno de las "alucinaciones" (IA genera información falsa pero convincente) sigue sin resolverse completamente.

4. **Impacto Sectorial: Trabajo, Salud y Finanzas** — Equipos híbridos hombre-máquina, IA en diagnóstico médico (AlphaFold 3), trading algorítmico. Nuevos roles: "AI prompt engineer", "AI supervisor".

5. **Coste Energético, Eficiencia y Sostenibilidad** — Small Language Models (Phi-3, Gemini Nano, Llama 3.2), inferencia on-device, cuantización y destilación de modelos, LiteRT para Android.

**Los 2 temas con mejor encaje para ArceApps:**

- 🥇 **IA Agéntica** — El blog ya cubre agentes de IA para Android. Hay oportunidad de profundizar en sistemas multi-agente, orquestación de agentes en CI/CD, y el nuevo rol del developer Android.
- 🥈 **On-Device AI / SLMs** — Gemini Nano corre en Pixel phones, LiteRT ya está integrado en Android NDK. Ángulo muy específico para Android que diferencia a ArceApps de otros blogs de IA generalistas.

**Propuesta de artículos:**
- "Agentes IA autónomos en Android: más allá del chatbot" (ES + EN)
- "Gemini Nano en Android: IA on-device sin internet" (ES + EN)
- "Orquestando múltiples agentes de IA en tu pipeline de desarrollo" (ES + EN)
- "SLMs vs LLMs para Android: cuándo usar inferencia local" (ES + EN)

**Nota:** Se intentó crear una issue de GitHub para discutir el tema, pero el acceso a la API de GitHub está restringido en el entorno sandbox. El contenido completo de la investigación está disponible en la PR asociada para su revisión y discusión.

**Aprendizaje:** Los temas de IA más relevantes para un blog de Android developer en 2026 son aquellos que tienen un ángulo específico de implementación práctica en el ecosistema Android, no los temas de IA generalista.

---

## 2026-04-23 - Artículo: Stack Completo para Construir Agentes IA en 2026
**Estado:** Completado

**Fuente:** Hilo en r/AI_Agents (https://www.reddit.com/r/AI_Agents/comments/1rdf5v7/my_guide_on_what_tools_to_use_to_build_ai_agents/) publicado por la comunidad. El usuario propuso un stack: OpenClaw + Vercel AI SDK/Next.js + OpenAI/Claude + MCPs + Cursor/Claude Code.

**Artículos creados:**
- ES: `src/content/blog/es/blog-stack-completo-agentes-ia-2026.md` (2601 palabras)
- EN: `src/content/blog/en/complete-beginners-guide-ai-agents-stack-2026.md` (2432 palabras)

**Imagen generada:** `/public/images/blog-agent-stack-2026.svg` (minimalista, colores de marca #018786 y #FF9800)

**Prior Art enlazado:**
- ES: [Herramientas IA 2026](/blog/herramientas-ia-2026), [NanoStack](/blog/nanostack-agentes-ia), [Memoria Agéntica](/blog/memoria-seguridad-privacidad-agentica)
- EN: [AI Tools Worth Learning 2026](/blog/ai-tools-worth-learning-2026), [NanoStack](/blog/nanostack-agents), [Agent Memory](/blog/memory-security-privacy-agentic)

**Estructura:** Gancho contextual → Stack completo (OpenClaw, Vercel, Modelos, MCPs, IDEs) → Costos → Seguridad → Hook de acción → Referencias

**Verificación frontmatter:** OK en ambos idiomas
**Calidad:** Cumple mínimo 2000 palabras, tono indie, sin jerga corporativa

---

## 2026-07-02 — Artículo "Harness Engineering: el wrapper que gana"

**Estado:** ✅ Publicado y compilado sin errores (`pnpm build` → 950 páginas, 26.72s)

**Tema:**
Harness Engineering como la nueva capa meta de la ingeniería de agentes: por qué el wrapper (tools, memory, guardrails) que rodea al modelo es lo que determina la productividad de un agente en producción. Origen del término (Mitchell Hashimoto, 5 feb 2026), anatomía canónica (`Agent = Model + Harness` de LangChain), las 3 eras (Prompt → Context → Harness), los 5 patrones prácticos (Neira), y la crítica honesta de Stuart Miller.

**Fuentes consultadas (15+ fuentes primarias, secundarias y de comunidad):**
- Mitchell Hashimoto — *"My AI Adoption Journey"* (5 feb 2026, post original donde acuña el término).
- LangChain — *"The Anatomy of an Agent Harness"* (Vivek Trivedy, 10 mar 2026) — definición canónica.
- LangChain — *"Improving Deep Agents with Harness Engineering"* (mar 2026) — caso Terminal Bench 2.0: +13.7 puntos.
- Tomasz Tunguz — *"Harnessing AI / Software After AI"* (Theory Ventures, may 2026) — 7 componentes.
- Nicolas Neira — *"Harness Engineering: Why Claude, GPT and Gemini No Longer Matter"* (2026) — cronología 3 eras + 5 patrones.
- Simon Willison — *"How coding agents work"* (Agentic Engineering Patterns guide, mar 2026).
- Addy Osmani — *"Agent Harness Engineering"* (abr 2026).
- Martin Fowler — *"Agent Harnesses: Guides and Sensors"* (abr 2026, taxonomía formal).
- Stuart Miller (haverin Substack) — *"Harness Engineering? Why the AI Industry's Newest Buzzword is an Old Idea"* (8 may 2026, crítica).
- Anthropic — *"Effective Harnesses for Long-Running Agents"* (nov 2025, primer uso formal).
- OpenAI — *"Harness engineering: leveraging Codex in an agent-first world"* (11 feb 2026).
- HN: hilo de 123 puntos (feb 2026), hilo "Building agents without harness engineering" (jun 2026), hilo AgentsMesh (mar 2026).
- Reddit: r/ArtificialInteligence, r/theprimeagen, r/Trae_ai, r/LocalLLaMA.

**Artículos creados:**
- ES: `src/content/blog/es/harness-engineering-wrapper-gana.md` (4086 palabras)
- EN: `src/content/blog/en/harness-engineering-wrapper-gana.md` (3929 palabras)

**Imagen generada:** `/public/images/harness-engineering-wrapper-gana.svg` (1200x630, geométrico con modelo central + harness ring + 5 patrones como side labels, colores de marca #018786 teal y #FF9800 orange)

**Estructura del artículo:**
1. Gancho cuantitativo: +13.7 puntos en Terminal Bench 2.0 cambiando solo el harness (LangChain) + Vercel -80% tools = 100% success, 3.5× más rápido, -40% tokens.
2. Metáfora del mustang (Tunguz).
3. Origen: Mitchell Hashimoto y la cita literal de Step 5.
4. Definición operativa: `Agent = Model + Harness` (Trivedy/LangChain).
5. Las 3 eras: Prompt Engineering → Context Engineering → Harness Engineering (Neira).
6. Los 5 patrones prácticos: Restrictions, Verification, Documentation, Observability, Reactive iteration.
7. Caso de estudio Terminal Bench 2.0 diseccionado (LangChain recipe).
8. Crítica honesta: Stuart Miller (es platform engineering renombrado) + respuesta propia.
9. Mapeo del setup propio como harness (AGENTS.md, skills, hooks, cronjobs, telegram, headroom, gsd, memory stack).
10. Anatomía mínima accionable: 5 piezas para el lunes.
11. Lecciones aprendidas.
12. Bibliografía completa (15+ fuentes clasificadas en primarias/análisis/comunidad).

**Prior Art enlazado (11 artículos previos del blog):**
- `contexto-efectivo-ia` / `effective-context-ai` — la era 2 explicada para Android.
- `gsd-core-context-engineering` — un harness concreto para Claude Code.
- `headroom-compression-layer` — pieza de Verification + Context & Memory.
- `agents-md-estandar` / `agents-md-standard` — la pieza Documentation.
- `memoria-persistente-agentes-ia` / `ai-agent-memory-persistence-guide` — State & Persistence.
- `stack-completo-agentes-ia-2026` / `complete-beginners-guide-ai-agents-stack-2026` — catálogo de tools.
- `superpowers-deep-dive` — skills como piezas del harness.
- `openspec-desarrollo-movil` / `openspec-mobile-development` — specs como input al harness.
- `paradigmas-alternativos-ingenieria-software-ia` / `alternative-paradigms-ai-software-engineering` — contexto filosófico.
- `production-agentic-frameworks` — frameworks que ya implementan parte del harness.
- `specs-driven-development` / `spec-driven-development-ai` — disciplina de specs.

**Diferenciación vs prior art:** Este artículo es la **capa meta** que une a los demás. Mientras contexto-efectivo-ia explicaba "qué darle al modelo", gsd-core explicaba "un framework de workflow", headroom explicaba "una capa de transporte", memory-persistence explicaba "cómo persistir estado", y agents-md-estandar explicaba "un estándar de documentación", **Harness Engineering** los pone a todos bajo un paraguas conceptual: cada uno de esos artículos anteriores es un componente del harness, y este artículo los integra en una sola taxonomía accionable. Es la pieza que faltaba para responder "¿por qué tengo que escribir un `AGENTS.md` Y configurar hooks Y tener memoria persistente Y comprimir contexto? Respuesta: porque cada uno es una disciplina del harness, y sin harness tu agente es un hobby caro."

**Verificación frontmatter:** OK en ambos idiomas
- Title ES: 40 chars, EN: 37 chars (≤ 60 ✓)
- Description ES: 150 chars, EN: 148 chars (en rango 120-160 ✓)
- Keywords: 7 elementos (en rango 3-8 ✓)
- Slug: `harness-engineering-wrapper-gana` (kebab, sin stopwords, sin `blog-` prefix, sin sufijo idioma ✓)
- pubDate y lastmod: 2026-07-02 (verificado con `date +%F` ✓)
- canonical: URL absoluta ✓
- author: "ArceApps" ✓
- reference_id: `5fed4b93-ea15-411e-a6e6-2120934be487` (UUID v4 ✓)
- heroImage: `/images/harness-engineering-wrapper-gana.svg` (existe en `public/images/` ✓)

**Verificación build:** `pnpm run build` exitoso en 26.72s, 950 páginas, 0 errores Zod, 0 warnings de schema. Salida verificada: `dist/es/blog/harness-engineering-wrapper-gana/index.html` y `dist/blog/harness-engineering-wrapper-gana/index.html` generados correctamente.

**Calidad:** Cumple mínimo 2000 palabras (ES: 4086, EN: 3929), tono indie, sin jerga corporativa, citations verificadas con extracción de contenido (curl + python) de 5 fuentes primarias y análisis.

**Investigación multi-fuente:** 8 web_search + 5 extracciones con curl (Mitchell Hashimoto, LangChain Anatomy, LangChain Improving, Haverin critique, Tunguz, Neira, Willison) + auditoría del prior art del blog (13 archivos con "harness", 31 con "wrapper", 4 con "context-engineering").

---

## 2026-07-02 - Ficha de Aplicación: RadioHub
**Estado:** Completado
**Análisis:**
Se realizó la integración de la nueva aplicación "RadioHub" al portafolio estático de ArceApps, asegurando el soporte de internacionalización (ES + EN) y la paridad en la configuración de metadatos.

**Assets integrados:**
- Logo y 7 capturas de pantalla de la app en español en `/public/images/apps/radiohub/es/`.
- Logo y 7 capturas de pantalla de la app en inglés en `/public/images/apps/radiohub/en/`.
- Imagen de portada hero en formato SVG minimalista (`/public/images/radiohub-hero.svg`) utilizando los colores de la marca (Teal `#018786` y Orange `#FF9800`) con un diseño geométrico de sintonización de frecuencias de radio.

**Fichas creadas:**
- ES: `src/content/apps/es/radiohub.md`
- EN: `src/content/apps/en/radiohub.md`

**Retos de Ingeniería detallados (Detrás de la App):**
Se documentó la trastienda técnica de RadioHub siguiendo el "Espíritu Indie" de la web: la gestión del balanceo y failover automático entre los 4 servidores espejo de `radio-browser.info` usando Ktor, la sincronización en segundo plano mediante MediaSession, y la aplicación reactiva del ecualizador sobre ExoPlayer.

**Verificación:**
Se ejecutó la validación final del esquema de contenidos con `pnpm build` de forma local, completando la generación estática sin errores.
