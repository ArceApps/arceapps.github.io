---
title: "DeepSeek Harness vs OpenCode, Codex y Claude Code: cara a cara"
description: "Comparativa honesta entre DeepSeek Harness (dsh), OpenCode, Codex CLI y Claude Code. Filosofía, plugin model, sandbox, ecosistema y para quién gana cada uno en 2026."
pubDate: 2026-08-19
lastmod: 2026-08-19
author: "ArceApps"
keywords:
  - "DeepSeek Harness"
  - "OpenCode"
  - "Codex CLI"
  - "Claude Code"
  - "Coding Agent Comparison"
canonical: "https://arceapps.com/es/blog/deepseek-harness-vs-opencode-codex-claude-code/"
heroImage: "/images/deepseek-harness-vs-opencode-codex-claude-code-es.svg"
tags: ["DeepSeek", "AI Agents", "OpenCode", "Codex", "Claude Code", "Indie Dev"]
reference_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
---

## Por qué esta comparativa importa ahora

El 13 de agosto de 2026, DeepSeek publicó `deepseek-harness` (`dsh`) bajo
MIT y en 48 horas acumuló 95.386 estrellas y 8.826 forks en GitHub. Una
curva de adopción así no se sostiene solo en hype: hay algo del diseño
que está tocando un nervio. Pero "dsh es mejor" o "dsh es peor" son
frases vacías hasta que se mide contra los agentes que la gente ya
está usando: **Claude Code** (Anthropic), **Codex CLI** (OpenAI) y
**OpenCode** (la opción open-source que ha servido como terreno común
para incontables posts de este blog, incluyendo [Subagentes y
Superpowers](/es/blog/opencode-subagents/) y [Awesome OpenCode
Ecosystem](/es/blog/awesome-opencode-ecosystem/)).

Este artículo cierra el triángulo abierto por [DeepSeek Harness: el
runtime donde todo es un plugin](/es/blog/deepseek-harness-everything-plugin/)
y por [Harness Engineering: el wrapper que gana](/es/blog/harness-engineering-wrapper-gana/).
El primero fue la inmersión técnica en `dsh`; este segundo mira desde
fuera, comparando cómo cada uno de los cuatro agentes encara las mismas
preguntas operativas: ¿cómo se monta un plugin? ¿cómo se audita una
sesión? ¿cuánto cuesta en tokens? ¿cuán maduro está el ecosistema?
La intención es darte una matriz de decisión honesta —incluyendo los
puntos donde mi opinión va a disgustar a fans de cualquiera de los
cuatro bandos.

> **Nota de prior art.** Ya hay posts previos sobre cada herramienta
> por separado en el blog: la comparativa de frontends visuales para
> OpenCode cubre CodeNomad y OpenChamber; Claude Code y Codex tienen
> cobertura individual. Este artículo **no** re-entra en esos puntos:
> se centra en el agente de terminal/runtime como producto, no en su
> skin.

## Las cuatro filosofías en una frase

Antes de meternos en matrices, una síntesis que se sostiene sola en el
resto del artículo:

- **DeepSeek Harness**: el runtime. Un framework open-source MIT donde
  *todo* —modelo, tools, sesión, sandbox, loop— es un plugin
  Cordis-registrable. Pensado para equipos que construyen infra de
  agentes, no para indies que quieren escribir código mañana.
- **Claude Code**: el producto. Source-available, experiencia de uso
  pulida, el ecosistema de extensión más completo del mercado
  (CLAUDE.md, Skills, Subagents, Hooks, MCP, Plugins, Agent Teams).
  Piensa en macOS: cerrado en la superficie, abierto en los puntos
  correctos.
- **Codex CLI**: el safety-first. Rust + sandbox a nivel de kernel,
  Apache 2.0, modelo declarativo de plugins (un folder en disco, sin
  entrar al proceso del harness). Piensa en OpenBSD: opinionated
  sobre lo que importa y discreto sobre el resto.
- **OpenCode**: el minimalista open. MIT, terminal o web, 197k
  estrellas, sinVendor lock-in ni surface cerrado. Piensa en Linux
  antes de systemd: hace su trabajo, deja que elijas cómo.

La diferencia entre los cuatro no es "cuál tiene más features", es
**qué tipo de pregunta priorizan**. `dsh` prioriza "puedo rewirear mi
runtime". Claude Code prioriza "¿cuánto friction hay entre mi idea y
un diff revisable?". Codex prioriza "¿qué tan estrecho es el blast
radius de un comando del agente?". OpenCode prioriza "¿puedo correr
cualquier modelo en cualquier sitio sin pedirle permiso a nadie?".

## Tabla maestra: cinco dimensiones

Las cinco dimensiones que más importan a la hora de elegir un agente de
terminal en producción: **filosofía de extensión**, **sandbox**,
**auditoría/trazabilidad**, **eficiencia de tokens** y **madurez del
ecosistema de plugins**. Los datos de estrellas y versión se actualizan
al 15 de agosto de 2026 (la release de `dsh` aún estaba caliente) y se
contrastan con lo que cada equipo anuncia en su documentación oficial.

| Dimensión | DeepSeek Harness | Claude Code | Codex CLI | OpenCode |
|---|---|---|---|---|
| **Licencia** | MIT (todo el código) | Source-available, license no estándar | Apache 2.0 | MIT |
| **Lenguaje del runtime** | TypeScript (~500k LoC) + C11 sandbox | TypeScript/Node | Rust | Go |
| **Filosofía de extensión** | Plugin Cordis imperativo (state, hooks, events) | Skills + Subagents + Hooks + MCP + Plugins + Agent Teams | Carpeta = plugin (declarativo, fuera del proceso) | Provider/modelo por config; sin plugin system |
| **Modelo por defecto** | DeepSeek, pero cualquier OpenAI-compatible | Claude (Sonnet/Opus/Haiku) | OpenAI (GPT-5/Codex) | Cualquiera vía provider (Anthropic, OpenAI, Google, Ollama) |
| **Sandbox** | bwrap+Landlock (Linux), Seatbelt (macOS), ACL (Win); plugins en proceso | Sí, maduro built-in, configurable | Sí, kernel-level, considerado el safety leader | Proceso hijo con permisos configurables |
| **Trazabilidad** | Append-only log, invariante *model-visible means logged* | Sesiones con transcripts; razonamiento parcialmente cifrado | Logs + replay; sandbox snapshots | Logs por sesión; fork/resume; sin invariante formal |
| **Token efficiency** | Alto overhead (~10x Pi, ~3x otros); bug doble-AGENTS.md | Buena; sistema prompt corto | Buena; code mode colapsa N tool calls en 1 | Buena; sin carga del framework |
| **Curva de adopción** | Empinada (profiles, bundles, patch layers) | Suave, docs comerciales extensas | Moderada, opinionated | Suave, modelo mental de Unix |
| **Stars (15-ago)** | ~93k | ~141k | ~106k | ~197k |
| **Estado** | Developer preview, breaking changes | Estable, comercial | Estable, comercial + cloud | Estable, open |
| **Mejor para** | Equipos construyendo infra de agentes | Indivuos y equipos que quieren productividad inmediata | Equipos donde el blast radius importa | Indivuos que priorizan neutralidad de modelo |

## El modelo de extensión: cuatro formas de decir "puedo extender esto"

Esta es la dimensión donde los cuatro divergen más profundamente, y
merece una sección aparte.

### DeepSeek Harness: plugins imperativos con estado

Ya cubierto en detalle en [el artículo del runtime](/es/blog/deepseek-harness-everything-plugin/),
pero el resumen operativo: un plugin es un archivo TypeScript que
exporta `apply(ctx)`. Al montarse registra servicios, eventos y tools
en un contexto compartido. El modelo vive en `ctx.llm`, el toolset en
`ctx.tools`, el sandbox en `ctx.sandbox`. Los plugins corren dentro
del proceso del harness (con todo el riesgo que eso implica) y pueden
tener estado mutable. Esto permite cosas como **subagents que se
delegan a `claude-code` o `codex`** vía el backend `ctx.subagents`,
algo sin precedente en el resto del mercado.

Trade-off: máxima flexibilidad, mínimo control sobre qué puede hacer
un plugin malicioso. La instalación de un plugin es, hoy por hoy, un
acto de confianza.

### Claude Code: la pila de extensión completa

Claude Code es el único de los cuatro que ofrece **siete** puntos de
extensión distintos en un mismo producto, y cada uno resuelve un
problema diferente:

- **CLAUDE.md**: contexto always-on cargado en cada turno. Es la
  memoria persistente de tu proyecto.
- **Skills**: conocimiento on-demand + workflows repetibles. Cargados
  por el modelo cuando detecta match.
- **Subagents**: aislamiento. Cada subagente tiene su propio contexto,
  permisos y system prompt.
- **Agent Teams**: novedad del 5 de febrero de 2026 junto a Opus 4.6.
  Múltiples subagentes colaborando, no solo reportando a un boss.
- **MCP servers**: conexión a herramientas externas vía Model Context
  Protocol.
- **Hooks**: automatización basada en eventos del ciclo de vida
  (PreToolUse, PostToolUse, Stop, SubagentStop).
- **Plugins**: paquetes que combinan varios de los anteriores en un
  bundle distribuible.

La consecuencia: Claude Code puede ser un editor de código, un
researcher, un agente de DevOps o un equipo multi-agente dependiendo
de qué combinación de extensiones actives. Es el framework más
"polimórfico" del mercado en términos de qué puede llegar a ser.

Trade-off: la superficie a aprender es grande. Documentación comercial
extensa ayuda, pero el time-to-first-value sigue siendo más alto que
Codex u OpenCode.

### Codex CLI: el folder es el plugin

Codex invierte la convención. En lugar de un plugin que entra al
proceso del harness, Codex define un plugin como **un folder en
disco** que contiene archivos estáticos: un Markdown de skill, una
configuración MCP, un script de shell. Esos archivos nunca entran al
proceso de Codex; el harness los lee cuando los necesita y los
re-carga en 2-3 segundos cuando cambian.

El desarrollador `grapeot`, que leyó ambos codebases línea por línea,
resume la diferencia con una analogía perfecta: **Codex te entrega un
apartamento terminado con una pared de clavijas donde colgar lo que
quieras; cuelga lo incorrecto, lo quitas, cuelga otra cosa. `dsh` te
entrega una casa donde puedes rewirear un muro de carga sin cortar
el agua ni la luz**. La pregunta es: ¿cuántas veces necesitas
realmente rewirear un muro de carga?

Trade-off: la simplicidad es real. El barrier to entry es casi cero,
el overhead de runtime es mínimo, y el blast radius de un plugin
defectuoso está acotado por el sandbox de kernel. El precio: si
quieres comportamiento dinámico, plugins con estado o composición de
eventos entre plugins, Codex no te lo da sin modificar su core en
Rust.

### OpenCode: extensión por configuración, no por código

OpenCode no tiene un sistema de plugins propiamente dicho. Su
extensibilidad es **configuración declarativa**: providers, modelos,
permisos y themes via archivos de config. La consecuencia: la
flexibilidad vive en el **modelo**, no en el harness. Puedes cambiar
de Anthropic a OpenAI a Google a Ollama sin tocar código, y el
agente se adapta. Esto lo convierte en el "model-agnostic por
defecto" del mercado, por encima incluso de `dsh` que siendo
model-agnostic necesita un plugin de adapter por modelo nuevo.

Trade-off: si quieres behaviours específicos (un tool nuevo, un hook
de pre-commit, una integración con Linear), necesitas contribuir al
proyecto o vivir con lo que hay. La libertad de modelo compensa
parcialmente, pero no es un sistema de extensión en el sentido
formal.

## Sandbox y blast radius: dónde pone cada uno la línea

El sandbox no es un detalle; es la pregunta "¿qué puede salir mal?"
hecha operacionalmente. Los cuatro resuelven esto de forma
sustancialmente distinta.

**Codex CLI** es, por consenso de la comunidad, el safety leader del
grupo. Sandbox a nivel de kernel de Linux (namespaces + seccomp), red
opcional, filesystem opcional, decisiones granulares por comando. El
default es "no puedes hacer nada que rompa mi host sin pedir"; el
opt-in es explícito. Es la postura más cercana a la filosofía
OpenBSD: seguro por construcción, no por configuración.

**DeepSeek Harness** usa `bwrap` + Landlock en Linux con un launcher
en C fail-closed, Seatbelt en macOS, ACL tokens restringidos en
Windows. El modelo de aprobación es una enumeración cerrada y las
anomalías se rechazan como "unavailable" en lugar de admitirse
silenciosamente. Es estricto — pero, como señaló 36Kr en su hands-on,
**los plugins corren dentro del proceso del harness**, así que un
plugin puede alcanzar shell y filesystem directamente. El blast
radius real de un plugin malicioso es todo el proceso.

**Claude Code** ofrece un sandbox maduro built-in, configurable por
el usuario, con defaults razonables. La integración con macOS es
notablemente buena (Sandbox-exec), en Linux depende del kernel
disponible. El riesgo: el ecosistema de Skills y MCP de terceros
introduce superficie de ataque, y la calidad de las sandbox de esos
Skills varía.

**OpenCode** corre el agente en un proceso hijo con permisos
configurables por el usuario. Es un modelo más cercano a Unix: el
usuario decide qué permisos dar, sin policies pre-cargadas
opinionated. Funciona bien para usuarios técnicos; puede ser un
shock para quien venga de Codex esperando permisos pre-pensados.

Para equipos en dominios regulados (finanzas, salud, defensa), Codex
es la opción más segura por construcción. Para equipos donde la
auditoría importa más que el blast radius (poder reconstruir qué vio
el modelo, no necesariamente contenerlo), `dsh` es el único de los
cuatro con esa garantía arquitectónica.

## Trazabilidad y auditoría: la única feature donde `dsh` no tiene rival

El sandbox te dice qué pudo pasar; la trazabilidad te dice qué pasó.
Aquí DeepSeek Harness tiene una ventaja que, al momento de escribir
este artículo, no tiene parangón en el mercado:

> **Invariante**: *"model-visible means logged"*. Todo lo que llega
> a una request de modelo debe poder reconstruirse desde el session
> log append-only. No es una opción de configuración; es una
> invariante enforced en runtime.

El log captura system prompts, razonamiento, tool calls y resultados,
scheduling de subagentes y cada context injection. La vista de
Trayectoria permite inspeccionar esos registros por fuente, y resume,
fork, search y replay operan sobre el mismo event stream. La
compactación de contexto está envuelta en tres eventos de log, así
que un crash mid-compaction es reconstruible.

Codex CLI tiene logs + replay con sandbox snapshots, pero no impone
la invariante de "todo lo que ve el modelo es reconstruible". Claude
Code tiene transcripts de sesión pero su razonamiento está
parcialmente cifrado por diseño comercial — algo que varios
comentaristas en Hacker News criticaron al hilo del lanzamiento de
`dsh`. OpenCode tiene logs por sesión y fork/resume, pero sin la
misma garantía arquitectónica.

Si trabajas en un dominio donde "qué vio el modelo" no puede ser un
misterio (financiero, salud, legal, defensa, investigación), `dsh` es
la única opción de las cuatro que te garantiza esa propiedad por
construcción.

## Token efficiency: dónde está el coste real

Aquí el ranking es claro, y duele a los fans de `dsh`:

- **OpenCode** y **Codex CLI** son los más eficientes. Sus prompts
  de sistema son cortos, sus sesiones tienen poco overhead, y no
  cargan frameworks pesados en cada turno.
- **Claude Code** está en el medio. Sus Skills y Subagents añaden
  tokens al system prompt, pero el framework ha sido optimizado
  agresivamente por Anthropic.
- **DeepSeek Harness** está al final, por un margen preocupante.
  Tests preliminares en el mismo modelo reportan ~4.5k tokens de
  input sin caché para Pi vs ~47.6k para `dsh` — un orden de
  magnitud. Y hay un bug confirmado: `dsh` lee `CLAUDE.md` y
  `AGENTS.md` del proyecto, y si el contenido es idéntico (algo
  común por compatibilidad cruzada), el system prompt se inyecta
  dos veces.

Si tu modelo se factura por token, esta diferencia importa. Un día
de trabajo con `dsh` puede consumir 3-10x lo que consumiría con
OpenCode o Codex en el mismo workload. El equipo de `dsh` es
consciente del problema y la arquitectura permite optimizaciones
futuras (caching agresivo, lazy-loading de plugins, summarization
temprana), pero al cierre de este artículo no hay fix oficial para
el bug de doble-AGENTS.md.

## Madurez del ecosistema: el factor que nadie quiere admitir

Las estrellas de GitHub son una vanity metric, pero la diferencia de
2x entre `dsh` (93k tras dos días) y Claude Code (141k acumulado en
meses) dice algo: el hype no se sostiene sin masa crítica de plugins
que funcionen. Y ahí, la foto al 15 de agosto es:

- **Claude Code** tiene el ecosistema más amplio y maduro. Skills
  comerciales, MCP servers para casi cualquier servicio
  (Linear, Notion, Slack, AWS, GCP, Figma, GitHub...), Hooks
  documentados, Agent Teams con examples, y una marketplace informal
  de plugins de terceros.
- **Codex CLI** tiene un ecosistema más pequeño pero más curado. La
  filosofía declarativa hace que cada plugin sea trivial de auditar.
- **OpenCode** tiene providers para todo (Anthropic, OpenAI, Google,
  Bedrock, Vertex, Ollama, OpenRouter...) y un set de herramientas
  sólido, pero sin marketplace formal.
- **DeepSeek Harness** tiene 316 plugins en `dsh-plugin` topic tras 48
  horas, con solo 41 marcados como validados en la lista oficial de
  compatibilidad. Cantidad sin calidad.

El equipo de `dsh` lo sabe. La propia documentación señala que 219
plugins están marcados como "necesitan atención o investigación
adicional", y el hands-on de 36Kr reportó que las 5 herramientas de
terceros que probó fallaron outright. La release es de día dos; el
ecosistema madurará, pero no hoy.

## Trade-offs resumidos en tres preguntas

Si tuviéramos que reducir la decisión a tres preguntas, serían:

**¿Qué modelo prioriza tu proyecto?**
- Claude (Anthropic) → Claude Code es la opción obvia; `dsh` y OpenCode
  funcionan vía endpoint compatible con coste de setup.
- OpenAI / GPT-5 → Codex CLI; `dsh` y OpenCode también.
- Mixto / local (Ollama, vLLM) → OpenCode o `dsh` con adapter.
- DeepSeek → `dsh` (nativo) o cualquier otro con endpoint compatible.

**¿Cuál es tu prioridad operativa?**
- Auditoría completa por invariante → `dsh`.
- Safety blast-radius mínimo → Codex CLI.
- Máxima flexibilidad de extensión → Claude Code.
- Neutralidad de modelo, simplicidad → OpenCode.

**¿Cuánto tiempo tienes para onboarding?**
- 30 minutos → OpenCode.
- 1-2 horas → Codex CLI o Claude Code.
- Medio día → Claude Code con todas las extensiones.
- 1-2 días → `dsh`, aprendiendo profiles/bundles/patches.

## Lo que no te dice ninguna tabla: el factor equipo

Las tablas no capturan el factor humano. En mi experiencia con los
cuatro, lo que más pesa no es la feature list sino el ajuste cultural:

- **Claude Code** gana donde hay un equipo que quiere invertir en
  Skills propias, entrenar al modelo en la convención del repo, y
  mantener un marketplace interno de Plugins. Es el camino "Apple":
  cómodo si vives dentro, caro si quieres salir.
- **Codex CLI** gana donde hay un equipo que opera bajo políticas
  estrictas de seguridad y necesita defaults sensatos sin
  configurar. Es el camino "OpenBSD": opinionated pero predecible.
- **OpenCode** gana donde hay un equipo pequeño o un indie que quiere
  cambiar de modelo sin pedirle permiso a nadie, y que se siente
  cómodo configurando providers a mano. Es el camino "Linux":
  flexible si sabes lo que haces, frustrante si no.
- **DeepSeek Harness** gana donde hay un equipo construyendo infra
  de agentes y está dispuesto a pagar el coste de tokens y la curva
  de adopción a cambio de auditabilidad arquitectónica y
  self-evolution. Es el camino "PostgreSQL": infra para gente que
  sabe lo que hace con infra.

## Veredicto: para quién gana cada uno

No hay un ganador universal. Hay cuatro ganadores para cuatro
contextos:

- **Si tu prioridad es escribir código productivo hoy**, sin
  preocuparte por auditoría extrema, **Claude Code** es la opción
  más pulida y completa.
- **Si tu prioridad es seguridad por construcción y un blast radius
  mínimo**, **Codex CLI** es el safety leader del grupo.
- **Si tu prioridad es neutralidad de modelo, simplicidad y zero
  vendor lock-in**, **OpenCode** es la opción más honesta.
- **Si tu prioridad es auditabilidad arquitectónica, self-evolution
  o construir infra de agentes que otros equipos van a consumir**,
  **DeepSeek Harness** es la única opción que ya tiene esas
  garantías incorporadas.

Mi recomendación práctica para un indie: empieza con **OpenCode** o
**Codex CLI**, aprende qué necesitas del agente, y solo salta a
**Claude Code** o **DeepSeek Harness** cuando tus limitaciones concretas (modelo,
seguridad, auditabilidad) justifiquen el coste de adopción. El
"agent-hopping" prematuro es el anti-patrón más caro de 2026.

## Veredicto: para quién gana cada uno

No hay un ganador universal. Hay cuatro ganadores para cuatro
contextos:

- **Si tu prioridad es escribir código productivo hoy**, sin
  preocuparte por auditoría extrema, **Claude Code** es la opción
  más pulida y completa.
- **Si tu prioridad es seguridad por construcción y un blast radius
  mínimo**, **Codex CLI** es el safety leader del grupo.
- **Si tu prioridad es neutralidad de modelo, simplicidad y zero
  vendor lock-in**, **OpenCode** es la opción más honesta.
- **Si tu prioridad es auditabilidad arquitectónica, self-evolution
  o construir infra de agentes que otros equipos van a consumir**,
  **DeepSeek Harness** es la única opción que ya tiene esas
  garantías incorporadas.

Mi recomendación práctica para un indie: empieza con **OpenCode** o
**Codex CLI**, aprende qué necesitas del agente, y solo salta a
**Claude Code** o **DeepSeek Harness** cuando tus limitaciones
concretas —modelo, seguridad, auditabilidad— justifiquen el coste
extra de adopción. El "agent-hopping" prematuro es el anti-patrón
más caro de 2026.

## Bibliografía

- [DeepSeek Harness: el runtime donde todo es un plugin — ArceApps](/es/blog/deepseek-harness-everything-plugin/) —
  análisis técnico en profundidad del runtime, Cordis y la
  arquitectura.
- [Harness Engineering: el wrapper que gana — ArceApps](/es/blog/harness-engineering-wrapper-gana/) —
  por qué el harness (tools, memoria, guardrails) hace productivo al
  modelo.
- [OpenCode Subagentes: Workflows y Superpowers — ArceApps](/es/blog/opencode-subagents/) —
  workflows sobre OpenCode, su modelo de subagentes y superpowers.
- [Awesome OpenCode Ecosystem — ArceApps](/es/blog/awesome-opencode-ecosystem/) —
  catálogo curado del ecosistema OpenCode.
- [DeepSeek Harness developer preview](https://deepseek.com/harness/en/) —
  página oficial con la promesa "Everything is a plugin".
- [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) —
  repositorio MIT, `0.1.0-rc.5` al cierre del artículo.
- [A Programming Paradigm for Spatiotemporal Composability](https://github.com/cordiverse/paper) —
  paper de Cordis, base teórica de `dsh`.
- [Claude Code — Extend documentation](https://code.claude.com/docs/en/features-overview) —
  documentación oficial de las 7 superficies de extensión.
- [Codex CLI — OpenAI](https://github.com/openai/codex) —
  repositorio oficial del CLI de OpenAI.
- [OpenCode — github](https://github.com/opencode-ai/opencode) —
  repositorio del agente open-source model-agnostic.
- [DeepSeek Harness In Depth — Justin3Go](https://justin3go.com/en/posts/2026/08/15-deepseek-harness-review) —
  análisis técnico línea por línea con comparativa contra los cuatro
  protagonistas.
- [5 Best DeepSeek Harness Alternatives — deepseek-code.com](https://deepseek-code.com/hub/best-coding-harness-for-deepseek) —
  workflow ranking Pi / Claude Code / OpenCode / Codex / Cline.
- [DeepSeek Harness: Why 95,000 GitHub Stars in 2 Days — Flowtivity](https://flowtivity.ai/blog/deepseek-harness-open-source-agent-explained/) —
  hands-on con métricas de adopción y benchmarks V4-Pro.
- [DeepSeek Harness developer preview — Hacker News](https://news.ycombinator.com/item?id=49285244) —
  thread de lanzamiento con 727 puntos y respuesta del equipo autor.
