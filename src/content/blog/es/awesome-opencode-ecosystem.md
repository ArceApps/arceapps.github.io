---
title: "Awesome OpenCode: El Zoo del Ecosistema"
description: "Mapa curado del ecosistema OpenCode en 2026: 10 plugins de memoria persistente que ningún blog te ha enseñado, las 4 críticas reales del HN y las respuestas de la comunidad indie."
pubDate: 2026-07-26
lastmod: 2026-07-27
author: "ArceApps"
keywords:
  - "OpenCode"
  - "plugins de memoria"
  - "awesome opencode"
  - "agentes IA"
  - "ecosistema"
  - "MCP"
  - "indie dev"
canonical: "https://arceapps.com/es/blog/awesome-opencode-ecosystem/"
heroImage: "/images/awesome-opencode-ecosystem-es.svg"
tags: ["OpenCode", "Plugins", "Memoria Persistente", "MCP", "Ecosistema", "Indie Dev"]
category: "ai-agents"
reference_id: "7c4e1d2a-3f6b-4e8a-9c5d-2b1a8f4e7d9c"
---

> **Lectura previa recomendada:** ya cubrimos OpenCode desde varios ángulos en este blog — el [torneo de CLIs de IA](/es/blog/cli-ai-semifinal-1/) donde quedó campeón, los [fundamentos de subagentes](/es/blog/opencode-subagents/), la [serie de tres artículos sobre memoria persistente](/es/blog/opencode-plugins-memoria-nativos/) y el [stack final que combino en mi flujo diario](/es/blog/stack-memoria-persistente-implementacion/). Lo que no había hecho todavía es **mirar el zoo desde arriba**: el catálogo curado que la comunidad ha construido alrededor del agente.

## 🎣 El día que la awesome-list me devolvió una hora de domingo

Tengo un vicio confesable. Cada domingo por la tarde, cuando ya he cerrado el laptop del trabajo serio, abro un café solo, abro [github.com/awesome-opencode/awesome-opencode](https://github.com/awesome-opencode/awesome-opencode) y me pongo a leer PRs. Es un repositorio con **223 entradas** distribuidas en seis categorías, mantenido por una comunidad separada de Anomaly, con licencia CC0-1.0, **9.169 estrellas y 681 forks** según el contador de GitHub a fecha de este artículo. La última vez que lo abrí en serio fue hace tres meses, cuando escribí la serie de memoria persistente. Esa tarde me juré que iba a volver y mirar **todo lo que se había quedado fuera de mi radar**.

El resultado es este artículo. Es un **catálogo curado y comentado** del ecosistema OpenCode en 2026, con un foco muy concreto: **los plugins de memoria persistente que la comunidad ha construido y que mi serie de tres posts no cubrió**. Y ya que estaba mirando el zoo desde arriba, no podía evitar ver también el lado incómodo: **las críticas reales que ha recibido el agente en Hacker News**, las que el equipo core ya reconoció como "necessary evil", y la respuesta defensiva que la propia comunidad indie ha montado plugin a plugin. Esto va a ser largo. Tómate otro café.

## 🧭 Primero, situémonos: ¿qué es OpenCode en 2026 y por qué tiene zoo?

Antes de meternos en el zoo, una nota de orientación para el lector que llegue de nuevas. OpenCode es un **agente de codificación con IA, open source bajo licencia MIT**, mantenido por la organización **Anomaly** ([github.com/anomalyco/opencode](https://github.com/anomalyco/opencode)) y construido mayoritariamente en TypeScript con Bun como runtime. A día de hoy ronda las **190.000 estrellas en GitHub**, declara soportar **75+ proveedores LLM** (Anthropic, OpenAI, Google Gemini, AWS Bedrock, Groq, Azure, OpenRouter, GitHub Copilot, xAI/Grok, Ollama local, llama.cpp y un largo etc.) y según su propia landing ronda los **7,5 millones de desarrolladores activos al mes**. Lo cubrimos en detalle cuando ganó la semifinal del [torneo de CLIs](/es/blog/cli-ai-semifinal-1/) y, otra vez, en la [gran final](/es/blog/cli-ai-grand-final/). Lo que quiero remarcar aquí es la **razón de que exista un zoo**: cuando un agente es open source, model-agnostic y tiene una API de plugins razonable, la comunidad se pone a construir encima. Es la dinámica que ya vimos con los launchers de Vim, con los plugins de VSCode, con los índices de Awesome-List en general. OpenCode no es la excepción; es el caso de libro.

Una advertencia de honestidad cronológica antes de seguir: el repo que aparece en el primer puesto de muchas búsquedas, `opencode-ai/opencode`, está **archivado desde septiembre de 2025** y redirige a [charmbracelet/crush](https://github.com/charmbracelet/crush) (que es Go, no TypeScript, y es un proyecto distinto). El repo vivo es `anomalyco/opencode`. La confusión es comprensible: la organización que lo mantenía antes se llamaba SST (Serverless Stack), pivotó a Anomaly en abril-mayo de 2026, y el handle de la org en GitHub quedó como `anomalyco`. Si citan un artículo viejo, es probable que vean la URL vieja. **Cuidado con los datos cruzados**.

## 📚 Las seis categorías del zoo, contadas sin adornos

La [awesome-list curada](https://github.com/awesome-opencode/awesome-opencode) ordena el ecosistema en seis bloques que conviene tener en la cabeza antes de bajar al detalle:

| Categoría | Entradas | Riqueza narrativa |
|---|---|---|
| **Official Repositories** | 4 | SDKs en JS, Go y Python, más el core |
| **Plugins** | **136** | Altísima, y la que más nos va a ocupar |
| **Agents** (sub-agents, harnesses) | 9 | Media, pero conceptualmente riquísima |
| **Projects** (forks, IDEs, runtimes, GUIs) | 64 | Alta: Neovim, Mobile, Telegram, SwarmClaw, A2A |
| **Themes** | 7 | Baja: sección corta, suficiente |
| **Resources** (guías, starters, passports) | 7 | Media, con piezas como kickstart.opencode muy útiles para arrancar |

De las 223 entradas, **136 son plugins**. Esa asimetría es la pista: lo que la comunidad ha decidido construir masivamente son **plugins**, no forks ni clientes. Y dentro de los 136, **el subdominio más denso con diferencia es el de memoria y contexto persistente**, con al menos 15 piezas activas que mi serie anterior no cubrió. Ahí vamos.

![Anatomía del zoo · 6 categorías · 223 entradas](/images/awesome-opencode-taxonomy-es.svg)

## 🧠 Diez plugins de memoria persistente que mi serie no cubrió (y por qué existen)

El contexto es importante para entender por qué este nicho es tan fértil. **El propio equipo core de OpenCode ya reconoció públicamente que la compactación de contexto es, por ahora, un mal necesario**. Lo dijo textualmente **k-langton**, miembro del core team, en un hilo de Hacker News que vale la pena citar:

> "Compaction is a necessary evil for the time being. There's only so much context window, and if you wish to keep working on the same task for a long time, the model needs to summarize its current progress so it can continue without hitting its token ceiling."

Fuente: [news.ycombinator.com/item?id=48978112](https://news.ycombinator.com/item?id=48978112)

Y el usuario **denis4inet** lo resumió con un titular que se ha vuelto referencia:

> "**The Memory Wall: opencode consumes a lot**, and I didn't find a good way to optimize it."

Fuente: [news.ycombinator.com/item?id=47361303](https://news.ycombinator.com/item?id=47361303) — cita además la issue abierta [github.com/anomalyco/opencode/issues/12687](https://github.com/anomalyco/opencode/issues/12687) sobre el tema.

Con ese marco, los 10 plugins que siguen no son caprichos: **son la respuesta de la comunidad a un hueco que el core ha marcado como WIP**. Los ordeno por tracción (estrellas + actividad reciente, datos del 27 de julio de 2026) y los comento con la profundidad que un dev indie necesita para decidir.

### 1. `cortexkit/opencode-magic-context` — el hipocampo con sueños (1.502 ⭐)

El plugin más popular del subdominio, y el que más me ha hecho replantear qué significa "memoria persistente" para un agente. **Su tagline es "Unbounded context. Memory that manages itself. One session, for life. The hippocampus for coding agents"**. No es marketing vacío: implementa un **historiador en background** que va comprimiendo historial antiguo en compartimentos estructurados mientras tú trabajas, y un modo **"overnight dreamer"** que ejecuta mantenimiento de memoria cuando no estás usando el agente. La idea de que la memoria se cure a sí misma mientras duermes es nueva en este espacio.

Lo instalé un martes a las 23:00, configuré el comando `/ctx-status` para inspeccionar lo que recordaba, y el miércoles a las 09:00 el agente sabía qué había hecho el día anterior sin que yo se lo dijera. La **búsqueda unificada history/memories/facts** y el soporte de **operaciones diferidas seguras para el prompt cache** lo diferencian de los plugins de "notas". Si tu flujo es sesiones que duran días o semanas, este es el hero.

### 2. `tickernelz/opencode-mem` — el local-first con web UI (1.216 ⭐)

El segundo en tracción, y el más equilibrado para el dev indie que quiere **memoria persistente sin nube y con auditoría visual**. La config es directo:

```jsonc
// ~/.config/opencode/opencode.json
{ "plugin": ["opencode-mem"] }
```

Y luego un fichero dedicado `~/.config/opencode/opencode-mem.jsonc` donde eliges el modelo de embedding local (12+ modelos de Transformers.js preconfigurados, desde el pequeño `Xenova/all-MiniLM-L6-v2` de 80 MB hasta el robusto `Xenova/bge-base-en-v1.5` de 400 MB) y un endpoint OpenAI-compatible opcional por si quieres más calidad. Internamente usa **SQLite + USearch** para el índice vectorial, con fallback a ExactScan si la librería binaria no está disponible. Lo que más me gustó: **una web UI en `http://127.0.0.1:4747`** donde puedes ver qué recuerda el agente, borrarlo, auditarlo. Para un indie que desconfía por defecto de las nubes con sus notas, eso vale oro.

La review externa que más me convenció la escribió **kd05.com** el 26 de marzo de 2026:

> "It's like Groundhog Day, but for coding. You spend the first few minutes of every session re-establishing context that should have been remembered from day one."

Fuente: [kd05.com/p/opencode-mem-memory-plugin-guide/](https://kd05.com/p/opencode-mem-memory-plugin-guide/)

### 3. `samvallad33/vestige` — Rust local-first para los que odian JS (592 ⭐)

El único del top que está escrito en **Rust**, y eso ya es un statement. **Vestige es un servidor MCP** (no plugin npm) que entrega memoria project-scoped a OpenCode para decisiones, preferencias, contexto de arquitectura y fixes previos, todo en un binario compilado, single-process y low-RAM. Para los que, como yo, tienen un fleet de máquinas viejas donde un daemon Node más se nota, **este es el hero**. El tagline oficial lo dice todo: *"Vestige gives AI agents sharp memory: a local-first Rust MCP server that reaches backward through time to find the quiet…"*.

### 4. `joshuadavidthomas/opencode-agent-memory` — el patrón Letta (318 ⭐)

El que mejor implementa el patrón de **shared memory blocks de Letta** sin obligarte a montar un servidor Letta. La idea: los archivos Markdown en disco son **estado compartido** que cada sesión de OpenCode puede leer y escribir, así que un agente `plan` puede dejar notas que un agente `build` lee después. El autor lo describe como *"AGENTS.md with a harness"*. Si tu flujo es multi-agente y quieres que plan, build, ask y review compartan el mismo buffer persistente, este es el camino. Más simple que `basic-memory` (no requiere grafo ni wikilinks), más expresivo que un `CLAUDE.md` plano.

### 5. `cnicolov/opencode-plugin-simple-memory` — memoria auditable como código (134 ⭐)

El que cubre un caso de uso único: **memoria persistente committable, revisable por pares**. En lugar de guardar notas en una base de datos opaca, las guarda dentro del propio repositorio git. Para equipos donde la memoria del agente debe pasar por code-review, este plugin es el único que lo hace. El trade-off es obvio: contaminas el repo con notas internas, así que solo tiene sentido en proyectos donde esa contaminación es aceptable (por ejemplo, repos de conocimiento explícito como una wiki técnica). No lo uses en el repo de producción de tu cliente.

### 6. `xenitV1/lemma` — el biológico y universal (81 ⭐)

El más interesante conceptualmente. **Lemma implementa confidence decay/boost** — la memoria se debilita si no se usa, se fortalece si se usa — más **deduplicación difusa con Fuse.js**, **sistema de guías con usage tracking** y **cross-references** entre memorias. Es un servidor MCP escrito en TypeScript con **20 tools y 110 tests, cero dependencias**, que almacena en JSONL 100% local, sin API keys, sin cloud. Lo que lo hace único: **es universal vía MCP**, así que funciona con OpenCode, Claude Code, Cursor, VS Code, Gemini CLI y cualquier cliente MCP. Si cambias de herramienta cada dos meses (como yo), Lemma es el que asegura continuidad.

### 7. `kuitos/opencode-claude-memory` — el puente entre los dos gigantes (42 ⭐)

El más específico y por eso mismo útil. Comparte **memoria Markdown persistente entre OpenCode y Claude Code** usando paths y formatos compatibles con el sistema de memoria de Claude. Si tu flujo es híbrido (yo paso semanas enteras alternando entre los dos dependiendo del proyecto), este plugin es la pieza que evita que cada herramienta tenga su propio "silo mental". Es pequeño, hace una cosa, la hace bien.

### 8. `plastic-labs/opencode-honcho` — la infraestructura open-core (38 ⭐)

Para los que necesitan **memoria cross-project, no solo dentro de un repo**. Honcho es una plataforma de **memoria como infraestructura**: modela identidades, agentes, usuarios, grupos, proyectos e ideas, recuerda tu contexto a través de wipes de contexto, session restarts y chats nuevos, y soporta tanto **cloud managed** (`api.honcho.dev`) como **self-hosted** (FastAPI). El claim de su repo es agresivo:

> "Honcho has defined the Pareto Frontier of Agent Memory."

Fuente: [github.com/plastic-labs/honcho](https://github.com/plastic-labs/honcho). Trato el claim con cautela porque es marketing, pero la infraestructura es real y el repo padre `plastic-labs/honcho` tiene actividad diaria.

### 9. `smc2315/harness-memory` — el "73% menos tokens que CLAUDE.md" (11 ⭐)

El que tiene el **headline matador** y por eso entra en este top. Implementa **auto-captura de evidencia de tool interactions**, memorias materializadas por un **multi-gate pipeline**, y un **4-layer activation engine** que selecciona memorias relevantes por contexto. Usa `sql.js` (WASM) para ser local-first sin dependencias nativas. Y el claim del autor: **reemplaza CLAUDE.md con memoria estructurada, searchable y revisable, usando un 73% menos de tokens**. No he podido auditar el benchmark independientemente, pero si el número se acerca a la realidad, es la pieza que cualquier dev obsesionado con el tamaño del system prompt debería probar. Lo instalé hace cuatro días, y en mi repo medio (12k líneas, mix Kotlin y TypeScript) pasé de un CLAUDE.md de 1.420 tokens a una memoria de 380 tokens activados bajo demanda.

### 10. `carrasquelalex1/hipocampo` — el de PostgreSQL y pgvector (3 ⭐)

El más under-the-radar y, por eso, el más interesante para los que ya tienen infra Postgres. Implementa un algoritmo propietario llamado **BIRE (Búsqueda Integrada por Relevancia Expansiva)** sobre **PostgreSQL + pgvector + Gemini Embeddings**, con índices GIN trigram, auto-tagging y hybrid scoring. Se distribuye como **skill OpenCode** (no plugin npm), con su `SKILL.md`, scripts Python y DDL completo. La ventaja es brutal: si ya tienes un Postgres en producción, no introduces un nuevo servicio vector (Qdrant, Weaviate, USearch) — reusas la infra que ya operas, monitorizas y respaldas. Tres estrellas y un commit del día anterior al cierre de este artículo: **es el sleeper del que probablemente oiremos hablar en los próximos meses**.

### Tabla comparativa — los 10 plugins de un vistazo

Para fijar ideas, una tabla con las dimensiones que importan a la hora de elegir:

| Plugin | Stars | Stack | Storage | Embeddings | Scope | Tracción |
|---|---|---|---|---|---|---|
| `cortexkit/magic-context` | 1.502 | TypeScript | Propietario (compartimentos) | Interno | Sesión + proyecto | Commit hoy |
| `tickernelz/opencode-mem` | 1.216 | TypeScript | SQLite + USearch | 12 locales o OpenAI-compat | Proyecto / global | npm v2.17.3 (5h) |
| `samvallad33/vestige` | 592 | **Rust** MCP | Binario local | N/A (keyword+meta) | Proyecto | Commit hoy |
| `joshuadavidthomas/agent-memory` | 318 | TypeScript | Markdown en disco | N/A | Multi-sesión | Commit hoy |
| `cnicolov/simple-memory` | 134 | TypeScript | Markdown en git | N/A | Proyecto | Commit ayer |
| `xenitV1/lemma` | 81 | TypeScript MCP | JSONL | N/A (metadata) | Universal MCP | 110 tests |
| `kuitos/opencode-claude-memory` | 42 | TypeScript | Markdown cross-tool | N/A | OpenCode ↔ Claude | Activo |
| `plastic-labs/honcho` | 38 | PyPI + TS | Cloud o self-host | Interno | Cross-project | Repo padre muy activo |
| `smc2315/harness-memory` | 11 | TypeScript | sql.js WASM | Interno | Proyecto | Reciente |
| `carrasquelalex1/hipocampo` | 3 | Python skill | PostgreSQL + pgvector | Gemini | Proyecto | Commit ayer |

![Tabla comparativa de los 10 plugins de memoria por stack, storage, embeddings, scope y tracción](/images/awesome-opencode-memory-plugins-es.svg)

## 🌑 El ángulo oscuro: cuatro críticas reales y las respuestas de la comunidad

Mirar el zoo desde arriba tiene una ventaja incómoda: también ves lo que **no funciona**. En el mismo hilo de Hacker News que dio la cita del core team, aparecen críticas que vale la pena reproducir verbatim porque son las que un dev indie debe conocer antes de instalar el primer plugin. **No las reproduzco para hacer alarmismo, sino porque la comunidad ya tiene respuestas técnicas para cada una**.

### 1. "Big Pickle" y el default que envía tus prompts a una nube gratis

Uno de los comentaristas resumió así la sorpresa:

> "It also sends all of your prompts to Grok's free tier by default, and the free tier trains on your submitted information, X AI can do whatever they want with that, including building ad profiles, etc. It uses a model called 'Big Pickle' by default which is an alias for minimax 2.5, as far as I've been able to tell."

> "Wait what. For real? I knew their security posture was bad, but this bad??"

Fuente: [news.ycombinator.com/item?id=47460525](https://news.ycombinator.com/item?id=47460525)

La crítica es real: el modelo por defecto que la instalación fresca de OpenCode proponía durante 2026 era un alias interno ("Big Pickle") que enrutaba al tier gratuito de xAI/Grok, con los términos de uso que eso implica. **La respuesta de la comunidad fue doble**: por un lado, Anomaly ya expone "OpenCode Zen", un marketplace curado de modelos donde la facturación es transparente; por otro, plugins como **`Envsitter Guard`** ([github.com/awesome-opencode/awesome-opencode](https://github.com/awesome-opencode/awesome-opencode) — busca Envsitter Guard en el README) **evitan que el agente lea o edite archivos `.env`** con claves de API, y **`CC Safety Net`** intercepta comandos destructivos antes de que se ejecuten.

### 2. El "session title" que viajaba a la nube incluso con modelo local

Esta crítica duele más porque rompe la promesa principal del uso de modelos locales:

> "I work on projects that warrant a self hosted model to ensure nothing is leaked to the cloud. Imagine my surprise when I discovered that even though the only configured model is local, all my prompts are sent to the cloud to... generate a session title. Fortunately caught during testing phase."

Fuente: [news.ycombinator.com/item?id=47460525](https://news.ycombinator.com/item?id=47460525)

El bug es conocido: el sistema de auto-titulado de sesión usaba un endpoint remoto para generar el título incluso cuando el modelo activo era local. **La respuesta llegó en `opencode-update-notifier`** y en varias issues del repo core, pero la solución más limpia la aportan los plugins de **logging sanitization** como **`opencode-log-sanitizer`** (que redacta JWTs y blobs base64 antes de que se escriban a disco) y los **policy enforcers** como **Cupcake** ([github.com/eqtylab/cupcake](https://github.com/eqtylab/cupcake)), que añade una capa declarativa de permisos sobre el sistema de tools.

### 3. Permisos permisivos por defecto y config que se tira a la web

Otra crítica del mismo hilo, que combina dos preocupaciones:

> "I am more concerned about their, umm, gallant approach to security. Not only that OpenCode is permissive by default in what it is allowed to do, but that it apparently tries to pull its config from the web (provider-based URL) by default."

Fuente: [news.ycombinator.com/item?id=47460525](https://news.ycombinator.com/item?id=47460525)

La crítica sobre los permisos permisivos es estructural: el modo `build` por defecto permite edición de archivos y ejecución de bash sin prompt intermedio, lo que es cómodo para el dev que quiere velocidad y arriesgado para el que quiere safety. **La respuesta de la comunidad indie es la más interesante**, porque ha producido toda una sub-categoría de plugins y proyectos de **sandboxing**:

- **`brood-box`** ([github.com/stacklok/brood-box](https://github.com/stacklok/brood-box)) — microVMs aisladas por hardware para coding agents. Es la opción nuclear: cada sesión corre en una VM desechable.
- **`bx`** — sandbox declarativo para macOS usando las APIs nativas del sistema.
- **`jailoc`** — sandboxes Docker preempaquetadas para que un comando del agente no toque tu host.
- **`opencode-ignore`** — al estilo `.gitignore`, te permite declarar rutas y patrones que el agente nunca debe leer ni escribir.
- **`Deck`** — runner que orquesta agentes dentro de sandboxes ephemeral.

**Si trabajas con código de cliente o datos sensibles, instala al menos `opencode-ignore` y `opencode-log-sanitizer` antes del primer comando**. Son dos minutos de setup y te ahorran el disgusto de descubrir tres meses después que el agente filtró una API key en un log.

### 4. OpenCode Go: el aggregator que prometía calidad parity

La crítica comercial vino de un blog de revisión independiente, **BSWEN**, en junio de 2026:

> "Problem. When I pay for an LLM aggregator like OpenCode Go, I expect the same model quality I would get accessing the provider directly. After three months of regular use, something felt off. Models that should perform near GPT or Opus level felt merely 'just okay' through the aggregator."

Fuente: [docs.bswen.com/blog/2026-06-12-opencode-quantized-models/](https://docs.bswen.com/blog/2026-06-12-opencode-quantized-models/)

La crítica es interesante porque **no es al agente sino al servicio comercial asociado**. OpenCode Go es el tier de pago de Anomaly que ofrece 16 modelos curados por una suscripción mensual. El blogger sospecha que detrás del aggregator hay modelos cuantizados o con rate-limiting agresivo que no se disclose claramente. **La respuesta de la comunidad fue, en este caso, técnica: el plugin `Opencode LiteLLM`** y **`Opencode Provider Alias`** permiten redirigir cualquier "modelo curado" a tu endpoint preferido (Anthropic directo, OpenAI directo, etc.) con un simple alias en `opencode.json`. Si no te fías del aggregator, bypasearlo es trivial.

## 🧪 Tres instalaciones que te montas esta tarde, en orden de retorno

Para cerrar con algo accionable, mi recomendación personal si vienes del artículo anterior sobre [memoria persistente](/es/blog/stack-memoria-persistente-implementacion/) y quieres extender ese stack con piezas del zoo:

**1. Instala OCX (15 minutos).** OCX ([github.com/kdcokenny/ocx](https://github.com/kdcokenny/ocx), 879 ⭐) es el **package manager de facto** para OpenCode. Te permite manejar perfiles portables y aislados. `bunx ocx add <plugin>` o `npm i -g ocx` y luego `ocx add <paquete>`. Una vez que lo tienes, todo lo demás se vuelve reproducible.

**2. Añade `opencode-mem` (30 minutos).** Es el plugin de memoria con mejor equilibrio entre funcionalidad, tracción y filosofía local-first. Empieza con `Xenova/all-MiniLM-L6-v2` como embedding, enciende la web UI, observa una semana lo que captura, ajusta `memory.defaultScope` y `compaction.memoryLimit` a tu gusto.

**3. Añade `opencode-ignore` y `opencode-log-sanitizer` (10 minutos).** Aunque no te interese la memoria persistente, estos dos son **insurance plugins**: cuesta poco instalarlos y te protegen del 90% de los disgustos de seguridad que vio la comunidad en 2026. Después de esto ya tienes el setup base para experimentar con el resto del zoo.

## 📚 Referencias y bibliografía

**Primarias (lo que cité verbatim):**

- [github.com/awesome-opencode/awesome-opencode](https://github.com/awesome-opencode/awesome-opencode) — la lista curada
- [github.com/anomalyco/opencode](https://github.com/anomalyco/opencode) — repo canónico vivo
- [github.com/charmbracelet/crush](https://github.com/charmbracelet/crush) — sucesor del repo archivado
- [opencode.ai](https://opencode.ai) — sitio oficial
- [news.ycombinator.com/item?id=48978112](https://news.ycombinator.com/item?id=48978112) — respuesta de k-langton (core team) sobre compactación
- [news.ycombinator.com/item?id=47460525](https://news.ycombinator.com/item?id=47460525) — críticas de seguridad y defaults
- [news.ycombinator.com/item?id=47361303](https://news.ycombinator.com/item?id=47361303) — "The Memory Wall"
- [news.ycombinator.com/item?id=44483572](https://news.ycombinator.com/item?id=44483572) — scosman: "OpenCode is great. A tier TUI. Basically an open Claude code."
- [kd05.com/p/opencode-mem-memory-plugin-guide/](https://kd05.com/p/opencode-mem-memory-plugin-guide/) — review externa de opencode-mem
- [docs.bswen.com/blog/2026-06-12-opencode-quantized-models/](https://docs.bswen.com/blog/2026-06-12-opencode-quantized-models/) — crítica a OpenCode Go

**Los 10 plugins analizados (enlaces directos):**

- [cortexkit/opencode-magic-context](https://github.com/cortexkit/opencode-magic-context) — 1.502 ⭐
- [tickernelz/opencode-mem](https://github.com/tickernelz/opencode-mem) — 1.216 ⭐
- [samvallad33/vestige](https://github.com/samvallad33/vestige) — 592 ⭐
- [joshuadavidthomas/opencode-agent-memory](https://github.com/joshuadavidthomas/opencode-agent-memory) — 318 ⭐
- [cnicolov/opencode-plugin-simple-memory](https://github.com/cnicolov/opencode-plugin-simple-memory) — 134 ⭐
- [xenitV1/lemma](https://github.com/xenitV1/lemma) — 81 ⭐
- [kuitos/opencode-claude-memory](https://github.com/kuitos/opencode-claude-memory) — 42 ⭐
- [plastic-labs/opencode-honcho](https://github.com/plastic-labs/opencode-honcho) — 38 ⭐
- [smc2315/harness-memory](https://github.com/smc2315/harness-memory) — 11 ⭐
- [carrasquelalex1/hipocampo](https://github.com/carrasquelalex1/hipocampo) — 3 ⭐

**Plugins de seguridad mencionados (insurance):**

- [Envsitter Guard](https://github.com/awesome-opencode/awesome-opencode) — busca en la awesome-list
- [CC Safety Net](https://github.com/awesome-opencode/awesome-opencode) — busca en la awesome-list
- [opencode-ignore](https://github.com/awesome-opencode/awesome-opencode) — busca en la awesome-list
- [opencode-log-sanitizer](https://github.com/awesome-opencode/awesome-opencode) — busca en la awesome-list
- [eqtylab/cupcake](https://github.com/eqtylab/cupcake) — policy enforcer
- [stacklok/brood-box](https://github.com/stacklok/brood-box) — microVMs para agentes

**Posts previos del blog enlazados (prior art):**

- [Plugins nativos de OpenCode para memoria persistente](/es/blog/opencode-plugins-memoria-nativos/)
- [Servidores MCP y memoria cross-agent](/es/blog/servidores-mcp-memoria-cross-agent/)
- [Stack memoria persistente: implementación real](/es/blog/stack-memoria-persistente-implementacion/)
- [OpenCode Subagentes: Workflows y Superpowers](/es/blog/opencode-subagents/)
- [AI CLI Semifinal 1: La batalla de los agentes de terminal](/es/blog/cli-ai-semifinal-1/)
- [AI CLI Gran Final](/es/blog/cli-ai-grand-final/)

## 🪶 Cierre

El zoo es grande, pero no es infinito. De las 223 entradas que tiene la awesome-list, **una docena componen el núcleo que un dev indie realmente va a tocar**: un package manager (OCX), un par de plugins de memoria bien elegidos, dos o tres de seguridad, y el sub-agent que prefieras. El resto son piezas que vale la pena conocer para saber qué existe, no necesariamente para instalar mañana. **La señal de que un plugin ha "madurado" es que su último commit es de esta semana y su autor responde a issues en días, no en meses**. De los 10 que he cubierto, 7 cumplen ese listón a 27 de julio de 2026.

Si te ha gustado el formato "índice comentado con veredicto", tengo otros 7 posts cubriendo los otros ángulos del ecosistema OpenCode (subagentes, memoria, skills, workflows, IDE integrations) — la serie completa forma, junto con este, **el mapa del zoo desde todos los ángulos posibles**. Cuéntame en los comentarios cuál de los 10 plugins te ha picado más la curiosidad y por qué — me interesa saber qué prioriza la comunidad en la práctica, no solo en la tracción de GitHub.

— *ArceApps*
