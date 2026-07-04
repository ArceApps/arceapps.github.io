---
title: "Harness Engineering: el wrapper que gana"
description: "Harness Engineering explicado: por qué el wrapper (tools, memory, guardrails) hace productivo al agente. Definición, anatomía y aplicación indie real."
pubDate: 2026-07-02
lastmod: 2026-07-02
author: ArceApps
keywords:
  - "Harness Engineering"
  - "Agent Harness"
  - "Model + Harness"
  - "AI Agents"
  - "Indie Dev"
  - "Claude Code"
  - "AGENTS.md"
canonical: "https://arceapps.com/es/blog/harness-engineering-wrapper-gana/"
heroImage: "/images/harness-engineering-wrapper-gana.svg"
tags: ["Harness Engineering", "AI Agents", "Claude Code", "AGENTS.md", "Indie Dev", "Architecture", "Agentic AI", "2026"]
reference_id: "5fed4b93-ea15-411e-a6e6-2120934be487"
---

> **Lectura relacionada en el blog:** Si llegas de nuevas al tema, este artículo asume que ya sabes lo básico de agentes y contexto. Si quieres ponerte al día, lee antes [Contexto Efectivo para IA en Android](/blog/contexto-efectivo-ia), [GSD Core: framework anti-ceremonia para ingeniería de contexto](/blog/gsd-core-context-engineering) y [Headroom: la capa de compresión que tu stack de agentes necesita](/blog/headroom-compression-layer). Si ya has leído varios, baja a la sección "Las 3 eras" — la idea es que este artículo es la **capa meta** que une a los demás.


![Infografía GSD](/images/infographic-gsd.svg)

Hay un número que llevo repitiendo en voz alta desde que lo leí: **+13.7 puntos en Terminal Bench 2.0 cambiando SOLO el harness, con el mismo modelo exacto (`gpt-5.2-codex`)**. Lo publicó el equipo de LangChain a mediados de marzo: su agente `deepagents-cli` pasó de Top 30 a Top 5 del leaderboard (52.8% → 66.5%) sin tocar un solo parámetro del modelo, solo reescribiendo el prompt del sistema, ajustando las herramientas y añadiendo middleware alrededor de las llamadas. Cero fine-tuning. Cero cambio de proveedor. Cero magia. Pura ingeniería del wrapper.


![Infografía Harness](/images/infographic-harness.svg)

Y luego está el dato de Vercel que citéricamente completó la película: **quitaron el 80% de las herramientas de su agente, lo dejaron con un filesystem plano + `grep`, y los resultados fueron mejores en casi todas las métricas: 100% de éxito (antes 80%), 3.5× más rápido, –40% tokens**. Otra vez: el modelo no se movió un milímetro.

Si llevas seis meses leyendo sobre agentes, seguramente ya te has topado con la palabra **harness** en algún sitio. Quizá la viste por primera vez en el blog de Mitchell Hashimoto el 5 de febrero de 2026, quizá te llegó vía el LangChain team, quizá te la soltó un influencer en X. La pregunta interesante no es de dónde viene el término, sino por qué de repente todo el mundo está obsesionado con la misma idea: **el modelo commoditiza, el wrapper gana**.

Este artículo es lo que me habría gustado leer hace tres meses, antes de pasarme dos semanas buceando en HN, Reddit, X, los blogs de LangChain, la newsletter de Tomasz Tunguz, el Substack de Stuart Miller y la guía de Nicolas Neira. Es la respuesta indie — y un poco escéptica — a la pregunta: **¿qué es exactamente Harness Engineering, me afecta como desarrollador independiente, o es solo otra vuelta de tuerca del hype?**

## 🐎 La metáfora: el mustang y la silla

Tomasz Tunguz (GP en Theory Ventures, 150.000 lectores en su newsletter) lo resumió en su pieza *"Harnessing AI"* con la mejor metáfora que he leído en meses:

> *"AI is powerful but wild. Harnessing the power means domestication. There are seven parts to this domestication: context & memory, tools & action, orchestration & loop, state & persistence, sandbox & compute, observability & governance, and cost & workflow optimization."*

La imagen mental es potente: un LLM es un **mustang** — pura potencia bruta, instinto, inteligencia no dirigida. Sirve para nada en tu día a día hasta que le pones una silla, unas riendas, un camino vallado y un jinete que sabe lo que hace. El harness es el conjunto de todas esas cosas. Sin él, el modelo es un gasto de inferencia. Con él, es un工程师.

Vercel descubrió exactamente esto en producción: menos herramientas y más filesystem dieron un agente más capaz. ¿Por qué? Porque **las herramientas son restricciones y el filesystem es libertad**. Un agente con 16 tools especializadas tiene que recordar cuál usar en cada caso; uno con `bash` + `read_file` + `write_file` puede improvisar su propio enfoque. La silla no tiene que ser elaborada; tiene que ser **la correcta**.

## 📜 El origen: Mitchell Hashimoto, 5 de febrero de 2026

El término lo puso en circulación **Mitchell Hashimoto**, co-fundador de HashiCorp y creador de Terraform. Lo hizo en el Step 5 de un post personal titulado *["My AI Adoption Journey"](https://mitchellh.com/writing/my-ai-adoption-journey)*, escrito a mano y fechado el 5 de febrero de 2026.

Hashimoto cuenta sus 6 pasos para dejar de ser escéptico y empezar a ser productivo con IA. El Step 5 se titula literalmente *"Engineer the Harness"* y la frase clave es esta:

> *"At risk of stating the obvious: agents are much more efficient when they produce the right result the first time, or at worst produce a result that requires minimal touch-ups. The most sure-fire way to achieve this is to give the agent fast, high quality tools to automatically tell it when it is wrong. I don't know if there is a broad industry-accepted term for this yet, but I've grown to calling this 'harness engineering.' It is the idea that anytime you find an agent makes a mistake, you take the time to engineer a solution such that the agent never makes that mistake again."*

Fijaos en lo que **no** dice. No habla del modelo. No habla del proveedor. No habla de GPT-5 ni de Claude 4.6 ni de Gemini 3.1. Habla de **AGENTS.md** (documentación que el agente lee al iniciar) y de **herramientas programadas** (scripts de verificación, tests, health checks). La definición más sobria que existe:

> *"It comes in two forms: better implicit prompting (AGENTS.md) and actual, programmed tools."*

Eso es todo. Esa es la semilla. Todo lo demás — los 7 componentes de Tunguz, los 5 patrones de Nicolas Neira, el `Agent = Model + Harness` de LangChain — son expansiones de esa idea minimalista.

## 🧬 Definición operativa: Agent = Model + Harness

Vivek Trivedy (LangChain) le dio la forma canónica en su post *["The Anatomy of an Agent Harness"](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)* del 10 de marzo de 2026:

> *"Agent = Model + Harness. If you're not the model, you're the harness. A harness is every piece of code, configuration, and execution logic that isn't the model itself. A raw model is not an agent. But it becomes one when a harness gives it things like state, tool execution, feedback loops, and enforceable constraints."*

La fórmula es deliberadamente simple, y por eso es potente. Te obliga a clasificar cada componente de tu sistema en una de dos cajas: **¿es el modelo?** o **¿es el harness?** Si la respuesta es "no sé", es harness. Y eso incluye:

- **System prompts** (el `AGENTS.md` que el agente lee al arrancar)
- **Tools, skills y MCPs** (con sus descripciones, que son parte del prompt)
- **Bundled infrastructure** (filesystem, sandbox, browser)
- **Orchestration logic** (subagent spawning, handoffs, model routing)
- **Hooks y middleware** (compaction, continuation, lint checks)

Esa clasificación es la que hace que el post de LangChain se pueda usar como un catálogo. Trivedy sigue una regla de diseño brutal: derivar cada componente del harness **working backwards from a desired agent behavior**. Quiere que el agente verifique su propio trabajo → añade un `PreCompletionChecklistMiddleware`. Quiere que el agente no se quede en un doom loop editando el mismo archivo 10 veces → añade un `LoopDetectionMiddleware`. Quiere que el agente no se quede sin tiempo → inyecta un time budget en el prompt.

## 🕰️ Las 3 eras: Prompt → Context → Harness

Nicolas Neira (ingeniero senior y newsletter propio) le puso la dimensión histórica. Resume 2022-2026 como tres eras de la ingeniería de IA, cada una respondiendo a una pregunta distinta:

| Era | Pregunta que responde | Periodo | Ejemplo canónico |
|---|---|---|---|
| **Prompt Engineering** | ¿Qué le digo al modelo? | 2022-2024 | *"Act as an expert in X"* |
| **Context Engineering** | ¿Qué sabe el modelo? | 2025 | RAG, ventana de contexto, skills |
| **Harness Engineering** | ¿Dónde trabaja el modelo? | 2026 | AGENTS.md, hooks, sandboxes, observabilidad |

La cronología que reconstruyó a partir de fuentes primarias (cada cita verificada):

1. **Noviembre 2025** — Anthropic publica *"Effective Harnesses for Long-Running Agents"*. Primer uso formal del término en un blog de un frontier lab. Habla de *initializer agent*, *coding agent* y un `claude-progress.txt` para mantener estado entre sesiones.
2. **5 febrero 2026** — Mitchell Hashimoto, *"My AI Adoption Journey"*. Acuña el verbo **"harness engineering"** como disciplina.
3. **11 febrero 2026** — OpenAI publica *"Harness engineering: leveraging Codex in an agent-first world"*. Anécdota: 7 ingenieros, 1 millón de líneas de código en 5 meses, cero escritas a mano. El trabajo del ingeniero deja de ser escribir código; pasa a ser **diseñar el harness**. (El post llega a HN con 123 puntos en su día.)
4. **Abril 2026** — Martin Fowler publica su taxonomía formal: **Guides** (computational / inferential) + **Sensors** (computational / inferential). Cuando Fowler organiza algo, la industria lo adopta. Pasó con Refactoring, pasó con Microservices, pasa ahora con Harness Engineering.
5. **Abril 2026** — Andrej Karpathy en Sequoia AI Ascent declara el *"vibe coding"* muerto y lo reemplaza por *agentic engineering*, donde el 99% del tiempo no escribes código — orquestas agentes.

En menos de 6 meses, **harness** pasó de un adjetivo que solo usaban los equipos internos de OpenAI a un sustantivo con taxonomía académica. No es hype puro: es una convergencia de varias líneas (Anthropic, OpenAI, LangChain, Mitchell, Fowler, Karpathy) llegando al mismo sitio por caminos distintos.

## 🧩 Los 5 patrones (taxonomía práctica de Neira)

Nicolas Neira identificó 78 momentos de harness engineering en vídeos de engineering de su canal **antes** de que el término siquiera existiera. Los agrupó en 5 patrones. Esta es la parte que más me sirve como desarrollador indie, porque la puedo aplicar mañana mismo:

### 1. Restrictions (27 momentos)
**Limitar lo que el agente puede hacer ANTES de actuar.** Es la categoría más frecuente, y la más contraintuitiva para los que empezamos con agentes: tu primer instinto es darle más herramientas; el correcto es darle menos. Formas concretas:
- Tool restriction (quitar tools que el agente no debería poder invocar)
- IAM permissions (limitar qué archivos puede leer/escribir/borrar)
- Secrets en Secret Manager (no hardcoded en el prompt)
- Allow-lists de comandos bash permitidos

### 2. Verification (18 momentos)
**Observar DESPUÉS de que el agente actúa.** La categoría que más impacto tiene en autonomía. Formas:
- Hooks que rechazan operaciones peligrosas (borrar DNS records, hacer `rm -rf` en prod)
- `validate.sh` que rechaza malformed skills
- Tests programáticos que el agente corre sobre su propio output
- Un segundo LLM revisando el output del primero (Fowler lo llama *Sensor Inferential*; yo lo llamo "el reviewer que nunca se aburre")

### 3. Documentation (19 momentos)
**Archivos que definen cómo se comporta el sistema.** Aquí vive el **`AGENTS.md`** de cada proyecto, las skills, los contratos de tool, las constitution files de Spec-Kit. La regla que aprendí: **cada línea de un `AGENTS.md` debería venir de un error real del agente**. Si no nació de un error, es ruido. Si nació de un error, es oro.


![Infografía Spec-Kit](/images/infographic-spec-kit.svg)

### 4. Observability (5 momentos)
**Si no puedes ver lo que hace el agente, no tienes harness.** Los traces de LangSmith, los 7 paneles de tmux de OpenAI, los logs estructurados de OpenTelemetry, el replay de sesiones. Sin observabilidad, depurar un agente en producción es como depurar un microservicio sin logs.

### 5. Reactive iteration (5 momentos)
**Cuando algo falla, el harness se adapta — no el modelo.** La pieza que cierra el loop. Ejemplo real de Neira: cuando AI Studio dio 503 en medio de un run, el equipo no reescribió nada — migró el endpoint a Vertex AI cambiando 3 variables en la config. Esa capacidad de redirigir sin reentrenar es lo que separa a un harness de un prompt.

## 🧪 El benchmark que demuestra que funciona (LangChain + Terminal Bench 2.0)

Volvamos al dato del principio porque merece ser diseccionado. LangChain documentó en *"Improving Deep Agents with Harness Engineering"* la receta completa que llevó a su agente `deepagents-cli` del puesto 30 al 5 en Terminal Bench 2.0 (89 tareas en ML, debugging y biología) con el mismo modelo:

- **Modelo fijo:** `gpt-5.2-codex`
- **Baseline:** 52.8% con prompt estándar + tools estándar
- **Final:** 66.5% después de los cambios de harness
- **Delta:** +13.7 puntos

Los knobs que tocaron (y solo esos):

1. **System prompt** con guía explícita de 4 fases: *Planning & Discovery → Build → Verify → Fix*. Insistencia obsesiva en escribir tests antes de dar nada por bueno.
2. **Middleware** nuevo: `PreCompletionChecklistMiddleware` (intercepta al agente antes de salir y le recuerda que verifique contra la spec) y `LoopDetectionMiddleware` (cuenta ediciones por archivo y, si pasan de N, inyecta *"consider reconsidering your approach"*).
3. **`LocalContextMiddleware`** que al arrancar mapea `cwd`, parent dirs, encuentra binarios (Python, Node) y los inyecta al contexto. Resultado: el agente no pierde tiempo descubriendo su propio entorno.
4. **Reasoning sandwich**: `xhigh` al inicio (para entender el problema) → `high` o `medium` durante el trabajo → `xhigh` otra vez al final (para verificar). Optimiza el uso de compute.

Lo más interesante es lo que **no** hicieron. No cambiaron de modelo. No hicieron fine-tuning. No cambiaron de proveedor. No reescribieron el algoritmo. Cambiaron **lo que rodeaba al modelo**, y eso bastó para subir 25 puestos.

## 🗣️ La crítica honesta: ¿es solo Platform Engineering pintado de otro color?

No todo el mundo está convencido. Stuart Miller publicó el 8 de mayo de 2026 en su Substack *["Harness Engineering? Why the AI Industry's Newest Buzzword is an Old Idea"](https://haverin.substack.com/p/what-is-harness-engineering-ai-hype)* un artículo que se hizo viral en LinkedIn, y la tesis es directa:

> *"The 'thing' being described is not new. It is not even slightly new. When you look at what is being defined, it is the practice of building a sensible software environment around a moving part, and we have names for that. A lot of names, and most older than my favorite pair of shoes: Platform engineering. Middleware design. Site Reliability Engineering. Service-oriented architecture. Control plane design."*

Miller concede un matiz honesto: los LLMs son **estocásticos** (no dan la misma respuesta dos veces), y envolver algo estocástico en un entorno disciplinado sí es un problema de diseño ligeramente distinto al de envolver un microservicio determinista. Pero su conclusión es que **el principio** — poner disciplina alrededor de un componente poco fiable para que produzca resultados repetibles — es tan viejo como la producción en cadena.

Y tiene razón en parte. El **principio** es viejo. Lo que es nuevo es:

1. La **escala de variabilidad** del componente envuelto. Un microservicio con bugs es 99.9% fiable. Un LLM con buena temperatura es 70% fiable en tareas largas.
2. La **velocidad de iteración** del harness. En 2015 ajustar el harness de un sistema costaba un sprint. En 2026 ajustar el harness de un agente cuesta un commit y un `/clear`.
3. La **dirección de la disciplina**: en SRE/Platform Engineering el harness rodea un sistema que no puede reescribirse. En Harness Engineering el harness también **escribe y reescribe** al sistema (o parte de él), porque el agente es a la vez herramienta y operario.

La crítica constructiva que yo añadiría, como indie: **no te obsesiones con el nombre**. Si lo llamas *agent infrastructure*, *agent ops*, *scaffolding* o como te dé la gana, el trabajo sigue siendo el mismo. Lo que importa es que lo hagas. **Un agente sin harness es un pasatiempo caro. Un agente con harness es un工程师.**

## 🛠️ Lo que esto significa para tu flujo indie

Si llevas meses leyendo mis artículos, habrás notado que llevo un año construyendo, sin saberlo, un harness. La enumeración me sorprendió cuando la hice:

- **`AGENTS.md` en cada repo** con reglas que nacen de errores reales → [Agents.md como estándar](/blog/agents-md-estandar) es exactamente "Documentation" del patrón 3.
- **Skills curadas** (kanban, write-blog, write-devlog, grill-me) que se cargan como contexto procedural → encajan en "Context & Memory" de Tunguz.
- **Sistema de hooks de Hermes** que interceptan acciones destructivas → "Restrictions" + "Verification" de los patrones 1 y 2.
- **Cronjobs duraderos** que ejecutan workers con memoria persistente → "State & Persistence".
- **Sandbox de Telegram** para que el usuario apruebe operaciones sensibles → "Human-in-the-loop" como sensor inferencial.
- **Traces y logs de cada sesión** en `~/.hermes/logs` → "Observability" pura.
- **Compresión de contexto** con Headroom entre el agente y el proveedor → la pieza que faltaba.
- **Descomposición de tareas** con kanban en workers pequeños con contexto limpio → "Orchestration & Loop".
- **Memory stack** (Hipocampus, hmem, plugmem, archivos PARA) → "State & Persistence" con 4 estrategias diferentes.
- **Spec-driven workflows** (OpenSpec, Spec-Kitty, BMAD) → alimentar el `AGENTS.md` y las skills con contratos verificables.


![Infografía Spec-Kitty](/images/infographic-spec-kitty.svg)


![Infografía Grill-me](/images/infographic-grill-me.svg)


![Infografía BMAD](/images/infographic-bmad.svg)


![Infografía OpenSpec](/images/infographic-openspec.svg)

Mapeado punto por punto, **mi setup es un harness de manual** — solo que lo construí a base de leer errores reales de mis agentes durante un año, que es exactamente la metodología que Hashimoto describe en su Step 5. No es teórico. No es marketing. Es la consecuencia directa de tratar cada error como un agujero en el harness y parchearlo con una regla, una tool o un hook.

La lección es incómoda pero útil: **si llevas más de 6 meses usando agentes en serio, ya tienes un harness**. La pregunta no es "¿debería construir uno?", es **"¿estoy iterando sobre él disciplina por disciplina, o estoy parcheando agujeros con más prompts?"**. Si la respuesta es la segunda, este artículo es para ti.

## 📐 Anatomía mínima: 5 piezas para mañana

Si tuviera que resumir todo lo anterior en un checklist accionable para un indie que arranca el lunes, sería este:

1. **Crear un `AGENTS.md` en la raíz del proyecto**, con 5-10 reglas que **nazcan de errores reales de tu agente** esta semana. Nada genérico. Cada línea es sangre tuya.
2. **Reducir el número de tools a lo mínimo** (la lección de Vercel). Si tienes más de 10, pregúntate cuáles sobran. Una `bash` + filesystem plano gana a menudo.
3. **Añadir UN hook de verificación** — por ejemplo, un `validate.sh` que el agente corra antes de marcar una tarea como hecha. Empieza por uno. Ya añadirás más.
4. **Hacer visible lo invisible**: trazas de cada sesión, logs estructurados, o al menos un `tail -f` de la conversación. Sin observabilidad, depurar agentes en producción es brujería.
5. **Escribir UNA exit condition** explícita: "el reviewer no puede iterar más de 2 rondas", "el agente no puede editar más de 5 veces el mismo archivo", "si la verificación falla 3 veces, escala a humano". Las exit conditions son el equivalente agente de los `for` con `break` que tu yo del 2015 se negaba a escribir.

Cinco piezas. Una semana. Más impacto en autonomía del agente que cualquier fine-tuning o upgrade de modelo que puedas hacer este trimestre.

## 🎓 Lecciones aprendidas (lo que me llevo)

Después de dos semanas leyendo todo lo que se ha publicado sobre el tema y mapearlo contra mi propio setup, esto es lo que sé:

1. **El modelo commoditiza, el harness gana.** El benchmark de LangChain es la prueba empírica. En 12 meses, gpt-5.2-codex será gpt-6; el harness que escribiste seguirá funcionando porque es agnóstico al modelo.
2. **El harness no es el prompt.** El prompt es una pieza del harness. Confundir ambos es la razón por la que la mayoría de "prompt engineers" nunca llegan a construir un agente de producción. Si tu único trabajo es escribir prompts, estás haciendo el 5% del trabajo.
3. **El error es el material de construcción.** Hashimoto tiene razón: cada línea de un buen `AGENTS.md` viene de un error real. Si no acumulas errores y los conviertes en reglas, no estás haciendo harness engineering, estás haciendo wishful thinking.
4. **Menos herramientas, más poder.** Vercel, LangChain y Tunguz coinciden sin haberse puesto de acuerdo. La restricción genera capacidad. Es contraintuitivo hasta que lo pruebas.
5. **El nombre importa menos que la práctica.** Harness, scaffolding, agent infrastructure, agent ops... Llámalo X. La disciplina es la misma: ingeniería seria alrededor de un componente estocástico.
6. **Como indie, ya tienes un harness — solo que no lo has documentado.** Si llevas un año con agentes, abre tu `AGENTS.md` y cuenta cuántos patrones de los 5 reconoces. Probablemente 4 o 5. El trabajo ahora es documentarlo y compartirlo.

## 📚 Bibliografía y referencias

### Fuentes primarias (ordenadas por importancia)
- **Mitchell Hashimoto — *"My AI Adoption Journey"*** (5 febrero 2026). El origen del término. Step 5, *"Engineer the Harness."* [`mitchellh.com/writing/my-ai-adoption-journey`](https://mitchellh.com/writing/my-ai-adoption-journey)
- **Vivek Trivedy (LangChain) — *"The Anatomy of an Agent Harness"*** (10 marzo 2026). La definición canónica: `Agent = Model + Harness`. [`langchain.com/blog/the-anatomy-of-an-agent-harness`](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)
- **LangChain — *"Improving Deep Agents with Harness Engineering"*** (marzo 2026). El caso de estudio Terminal Bench 2.0: +13.7 puntos cambiando solo el harness. [`langchain.com/blog/improving-deep-agents-with-harness-engineering`](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering)
- **Anthropic — *"Effective Harnesses for Long-Running Agents"*** (noviembre 2025). El primer uso formal del término en un frontier lab. [`anthropic.com/engineering/effective-harnesses-for-long-running-agents`](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- **OpenAI — *"Harness engineering: leveraging Codex in an agent-first world"*** (11 febrero 2026). 7 ingenieros, 1M LoC en 5 meses, cero a mano. [`openai.com/blog/harness-engineering`](https://openai.com/blog/harness-engineering)

### Análisis y críticas
- **Tomasz Tunguz — *"Harnessing AI / Software After AI"*** (mayo 2026). La metáfora del mustang y los 7 componentes de la "domesticación". [`tomtunguz.com/harnessing-ai`](https://tomtunguz.com/harnessing-ai/)
- **Simon Willison — *"How coding agents work"*** (marzo 2026). La definición técnica más clara: *"A coding agent is a piece of software that acts as a harness for an LLM."* [`simonwillison.net/guides/agentic-engineering-patterns/how-coding-agents-work`](https://simonwillison.net/guides/agentic-engineering-patterns/how-coding-agents-work/)
- **Addy Osmani — *"Agent Harness Engineering"*** (abril 2026). El ángulo desde el product engineering. [`addyosmani.com/blog/agent-harness-engineering`](https://addyosmani.com/blog/agent-harness-engineering/)
- **Martin Fowler — *"Agent Harnesses: Guides and Sensors"*** (abril 2026). La taxonomía formal: computational vs inferential. [`martinfowler.com/articles/exploring-gen-ai/harnesses.html`](https://martinfowler.com/articles/exploring-gen-ai/harnesses.html)
- **Nicolas Neira — *"Harness Engineering: Why Claude, GPT and Gemini No Longer Matter"*** (2026). La cronología de las 3 eras y los 5 patrones. [`nicolasneira.com/en/harness-engineering`](https://nicolasneira.com/en/harness-engineering/)
- **Andrej Karpathy — *"Agentic Engineering"*** (Sequoia AI Ascent, abril 2026). La muerte del vibe coding.
- **Stuart Miller — *"Harness Engineering? Why the AI Industry's Newest Buzzword is an Old Idea"*** (Substack, 8 mayo 2026). La crítica más honesta: es platform engineering con ropa nueva. [`haverin.substack.com/p/what-is-harness-engineering-ai-hype`](https://haverin.substack.com/p/what-is-harness-engineering-ai-hype)

### Hilos de comunidad que vale la pena leer
- **Hacker News — *"Harness engineering: Leveraging Codex in an agent-first world"*** (123 puntos, feb 2026). [`news.ycombinator.com/item?id=48416264`](https://news.ycombinator.com/item?id=48416264)
- **Hacker News — *"Harness Engineering: 52 Days, One Person, 965K Lines of Code"*** (marzo 2026). Caso AgentsMesh: 600 commits, 365k LoC en producción. [`news.ycombinator.com/item?id=47372903`](https://news.ycombinator.com/item?id=47372903)
- **Hacker News — *"Building agents without harness engineering"*** (junio 2026). El hilo que cuestiona la adopción: *"I read this twice and didn't fully understand what it was telling me."* [`news.ycombinator.com/item?id=48493447`](https://news.ycombinator.com/item?id=48493447)
- **r/ArtificialInteligence — *"Harness Engineering: Turning AI Agents Into Reliable Engineers"*** (abril 2026). [`reddit.com/r/ArtificialInteligence/comments/1sc3m1t`](https://www.reddit.com/r/ArtificialInteligence/comments/1sc3m1t/harness_engineering_turning_ai_agents_into/)
- **r/theprimeagen — *"wtf is Harness Engineer & why is it important"*** (abril 2026). La mejor frase: *"Use deterministic logic and only use LLMs when they are required."* [`reddit.com/r/theprimeagen/comments/1sx738w`](https://www.reddit.com/r/theprimeagen/comments/1sx738w/wtf_is_harness_engineer_why_is_it_important/)
- **r/Trae_ai — *"The Definitive Guide to Harness Engineering"*** (abril 2026). [`reddit.com/r/Trae_ai/comments/1sti4jx`](https://www.reddit.com/r/Trae_ai/comments/1sti4jx/the_definitive_guide_to_harness_engineering_what/)

### Lecturas relacionadas en este blog
- [Contexto Efectivo para IA en Android: el arte de la comunicación clara](/blog/contexto-efectivo-ia) — la era 2 (Context Engineering) explicada para Android.
- [GSD Core: el framework anti-ceremonia para ingeniería de contexto](/blog/gsd-core-context-engineering) — un harness concreto para Claude Code.
- [Headroom: la capa de compresión de contexto que tu stack necesita](/blog/headroom-compression-layer) — pieza de "Verification" + "Context & Memory" en producción.
- [Agents.md como estándar abierto](/blog/agents-md-estandar) — la pieza "Documentation" del patrón 3.
- [Memoria Persistente para Agentes IA: Guía Práctica](/blog/memoria-persistente-agentes-ia) — la pieza "State & Persistence" en cuatro estrategias.
- [Stack Completo de Agentes IA 2026](/blog/stack-completo-agentes-ia-2026) — el catálogo de herramientas que caben en un harness.
- [Superpowers Deep Dive: el framework de skills más completo](/blog/superpowers-deep-dive) — skills como piezas del harness.
- [OpenSpec en Desarrollo Móvil: spec-driven sin teatro](/blog/openspec-desarrollo-movil) — alimentar el `AGENTS.md` con specs verificables.
- [Paradigmas Alternativos en Ingeniería de Software con IA](/blog/paradigmas-alternativos-ingenieria-software-ia) — el contexto filosófico más amplio.
- [Production-Ready Agentic Frameworks: 6 Estrategias](/blog/production-agentic-frameworks) — los frameworks que ya implementan parte del harness.
- [Spec-Driven Development con IA Agentic](/blog/specs-driven-development) — disciplina de specs como input al harness.


![Infografía Superpowers](/images/infographic-superpowers.svg)

---

El post de Mitchell Hashimoto cierra con una imagen que se me ha quedado grabada: *"I literally did the work twice. I'd do the work manually, and then I'd fight an agent to produce identical results."* Es la imagen opuesta al "vibe coding" de Karpathy. Es **harness engineering en su forma más honesta**: haces el trabajo a mano, ves dónde falla el agente, y construyes el guardrail que evita ese fallo para siempre. No es glamuroso. No es viral. Pero es lo que separa a un agente de demos de un agente que produce software real a las 3 de la mañana mientras tú duermes.

Si llegaste hasta aquí y tu `AGENTS.md` tiene menos de 10 líneas, ya tienes tarea para el lunes. Si tiene más de 100, probablemente estás sobre-documentando en lugar de iterar. El sweet spot, como siempre, está en iterar errores reales uno a uno hasta que el harness deja de notarse y empieza a sentirse como parte del modelo. Ese es el momento en que ganaste.
