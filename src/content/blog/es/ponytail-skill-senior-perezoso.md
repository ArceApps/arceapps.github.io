---
title: "Ponytail: el skill viral que enseña a tus agentes a ser seniors perezosos"
description: "34k estrellas en seis días. Un skill que fuerza a Claude Code, Codex, Cursor y compañía a recorrer una escalera de seis peldaños antes de escribir una sola línea. 80-94% menos código, pero ¿realmente funciona? Análisis a fondo, benchmarks,"
pubDate: 2026-06-19
lastmod: 2026-06-19
author: ArceApps
keywords:
  - "Ponytail"
  - "Skill Viral"
  - "Senior"
  - "Perezoso"
  - "IA"
canonical: "https://arceapps.com/es/blog/ponytail-skill-senior-perezoso/"
heroImage: "/images/ponytail-skill-senior-perezoso.svg"
tags: ["AI Agents", "Skills", "YAGNI", "Ponytail", "Claude Code", "Codex", "Cursor", "Minimalismo", "Indie"]
category: ai-agents
reference_id: "f3a1b8d2-4e7c-4a9b-b1c3-7d8e9f0a1b2c"
---



> **Lecturas relacionadas en el blog:** [Inside Superpowers: el framework que fuerza a la IA a ingenierizar](/blog/blog-superpowers-deep-dive) · [Matt Pocock Skills: la navaja suiza de los skills pequeños](/blog/blog-mattpocock-skills) · [Power Up Your AI Agents with Skills](/blog/building-ai-agent-skills) · [Dynamic Context: el coste oculto de los skills siempre activos](/blog/ai-agent-skills-dynamic-context) · [AI Code Reviews: revisando código generado por agentes](/blog/ai-code-reviews)

## Conoces a ese compañero. El de la coleta larga, las gafas ovaladas, el que lleva en la empresa más tiempo que el control de versiones

Le enseñas cincuenta líneas. Él las mira. No dice nada. Las sustituye por una. Funciona. Nadie sabe cómo, pero el sistema lleva tres años sin pagarse a las tres de la mañana y él se va a casa a su hora. Cuando le preguntas qué framework ha usado, te contesta con un gesto de "lo que ya estaba". Y si insistes, te enseña su `~/.ponytail/config.json` con una línea: `defaultMode: full`.

Eso es **Ponytail**, el repositorio de [DietrichGebert en GitHub](https://github.com/DietrichGebert/ponytail), y la historia de su viralidad es una de las más curiosas del mes. Publicado el 12 de junio de 2026 —hace apenas seis días—, ya acumula más de 33.968 estrellas, 1.541 forks, 51 issues abiertos y 9 versiones publicadas. Lo compartió midudev en LinkedIn y se convirtió en tema del día entre la gente que programa con agentes. Apareció en r/ClaudeCode con casi dos mil upvotes. Entró en la portada de GitHub Trending. Y, sobre todo, levantó una pregunta incómoda: **¿de verdad queremos que nuestros agentes escriban menos código, o solo queremos que parezca que lo hacen?**

En este artículo voy a hacer lo que no se ve en LinkedIn: voy a leer el repositorio entero, ejecutar mentalmente sus benchmarks, contrastar las cifras oficiales con la crítica publicada y, sobre todo, voy a contar **en qué miente, en qué acierta y cuándo te interesa de verdad instalar esto** en tu flujo de trabajo.

> **Nota de honestidad:** toda la información técnica de este artículo está verificada con la API de GitHub y con los archivos raw del repositorio a fecha 18 de junio de 2026. Las cifras cambian rápido (varios cientos de estrellas al día); lo que no cambia es la mecánica del skill, los benchmarks publicados y las críticas que cito. Donde dude, lo diré.

## El contexto: por qué los agentes de IA sobre-ingenieran por defecto

Si llevas meses programando con Claude Code, Codex, Cursor, Cline o Windsurf, ya conoces la escena. Pides un validador de email y recibes una clase de 27 líneas con un envoltorio, un regex que casca y, si tienes mala suerte, una discusión sobre cómo manejar Unicode. Pides un contador y te montan un *dashboard* con animaciones. Pides una caché y te construyen una clase de 120 líneas con TTL, eviction policy y tests de concurrencia. Tú querías `lru_cache`. Te han dado una arquitectura.

No es un bug. Es el comportamiento por defecto de los modelos entrenados para complacer. Ya lo analizamos hace tiempo en [From Copilot to Autonomous Agents](/blog/coding-with-ai-agents): la diferencia entre sugerir y actuar cambió el rol del desarrollador, pero también cambió la cantidad de código que se genera por interacción. Cada prompt dispara un sesgo de "más completo es mejor" que el modelo difícilmente va a corregir solo.

> **Lectura recomendada:** [Effective Context for AI: Prompt Engineering](/blog/effective-context-ai) cubre las 4 C's del contexto (capacidad, contexto, constraints, chain-of-thought) y por qué poner "sé minimalista" en un prompt no funciona tan bien como crees.

Aquí es donde Ponytail entra a hacer el trabajo sucio: en lugar de pedirle al modelo que sea minimalista (que ignora), le inyecta una escalera de decisión persistente que el agente recorre **antes de escribir una sola línea**. No es prompt engineering. Es un *skill* —un archivo markdown con instrucciones siempre activas— que sobrevive a toda la conversación.

## Qué es Ponytail exactamente

Ponytail es un plugin y un conjunto de skills para coding agents. Su núcleo, `skills/ponytail/SKILL.md`, pesa alrededor de 5 KB y contiene una sola idea repetida con bisturí: **antes de generar código, recorre esta escalera de seis peldaños y detente en el primero que aguante**.

### La escalera de los seis peldaños

La regla en bruto, tal y como aparece en el `SKILL.md` oficial, es esta:

```text
1. ¿Necesita existir?        → No: skip (YAGNI)
2. ¿Lo hace stdlib?          → Usarlo
3. ¿Lo cubre la plataforma?  → <input type="date"> > picker lib, CSS > JS, DB constraint > app code
4. ¿Dependencia ya instalada? → Usarla. Nunca añadir una nueva si bastan unas líneas
5. ¿Cabe en una línea?       → Una línea
6. Solo entonces:            → El mínimo que funcione
```

El `SKILL.md` añade una coletilla que define el carácter: *"The ladder is a reflex, not a research project. Two rungs work → take the higher one and move on. The first lazy solution that works is the right one."*

¿Ves el patrón? No es una checklist que el agente tenga que ejecutar. Es un reflejo, un hábito inyectado en cada turno. Por eso la regla **5 ("una línea")** aparece antes que la **6 ("mínimo que funcione")**: si cabe en una línea, es la respuesta. Si no cabe, pasa al siguiente peldaño. Si nada de lo anterior funciona, entonces escribes lo mínimo.

El ejemplo canónico del propio README lo deja claro: pides un *date picker* y tu agente instala flatpickr, escribe un componente envoltorio, añade un stylesheet y empieza una discusión sobre zonas horarias. Con Ponytail:

```html
<!-- ponytail: browser has one -->
<input type="date">
```

Cuatro palabras y un comentario. Lo que se ahorra no son líneas: es revisión de PR, deuda futura y ese momento a las tres de la mañana del que hablábamos al principio.

### Los cuatro niveles de intensidad

La escalera no es dogmática. Ponytail viene con cuatro modos que el desarrollador controla:

| Nivel | Comportamiento | Cuándo usarlo |
|---|---|---|
| **`lite`** | Construye lo pedido, pero nombra la alternativa más *lazy* en una línea. Tú decides. | Cuando quieres un *guardrail* suave y mantener la voz del modelo. |
| **`full`** (default) | La escalera forzada. Stdlib y nativo primero. Diff más corto, explicación más corta. | El día a día. Equivale a tener un senior al lado. |
| **`ultra`** | YAGNI extremista. Borrar antes que añadir. Ship el one-liner y cuestiona el resto del requisito en la misma respuesta. | Cuando el codebase te ha ofendido personalmente. |
| **`off`** | Apagado. El agente vuelve a su modo nativo. | Cuando necesitas libertad total o quieres comparar. |

El ejemplo del propio `SKILL.md` para "Add a cache for these API responses" ilustra los matices sin tecnicismos:

- **`lite`:** *"Done, cache added. FYI: `functools.lru_cache` covers this in one line if you'd rather not own a cache class."*
- **`full`:** *"`@lru_cache(maxsize=1000)` on the fetch function. Skipped custom cache class, add when lru_cache measurably falls short."*
- **`ultra`:** *"No cache until a profiler says so. When it does: `@lru_cache`. A hand-rolled TTL cache class is a bug farm with a hit rate."*

Fíjate en el detalle: en `lite` el modelo sigue tu petición, pero te susurra la alternativa. En `ultra` directamente te desafía. En `full` hace lo correcto y te avisa de la deuda. **El modo por defecto es la voz de un senior que lleva años viéndolo todo**, que no te lleva la contraria pero tampoco te construye pirámides.

### El ecosistema de cinco skills

Ponytail no es solo el modo principal. El repositorio publica cinco skills que se complementan:

| Skill | Disparador | Función |
|---|---|---|
| `ponytail` | `/ponytail [lite\|full\|ultra\|off]` | Modo principal. Reglas persistentes cada turno. |
| `ponytail-review` | `/ponytail-review` | Code review enfocado solo en over-engineering. Una línea por hallazgo con tags (`delete:`, `stdlib:`, `native:`, `yagni:`, `shrink:`). |
| `ponytail-audit` | `/ponytail-audit` | Igual que review, pero audita el repo entero. Ranking por tamaño de corte. |
| `ponytail-debt` | `/ponytail-debt` | Cosecha todos los `ponytail:` comments y los pone en un **ledger** (un registro de deuda) con su techo de complejidad y su trigger de revisión. |
| `ponytail-help` | `/ponytail-help` | Tarjeta de referencia rápida. |

La idea de `ponytail-debt` es la más sutil. Cuando el agente decide "esto lo simplifico con un lock global, no con locks por cuenta", deja un comentario en el código:

```python
# ponytail: global lock, per-account locks if throughput matters
```

Esos comentarios son la semilla de la deuda. Con el tiempo, `/ponytail-debt` te da una lista de "esto se quedó corto, aquí está la razón, aquí está cuándo revisitarlo". Es la diferencia entre un *shortcut* con fecha de caducidad y una decisión arquitectónica silenciosa. **Ponytail convierte la deuda implícita en deuda explícita y cosechable.**

## Cómo se mide: los benchmarks y sus trampas

El repositorio incluye un benchmark reproducible con [promptfoo](https://promptfoo.dev) que mide cuatro métricas en cinco tareas cotidianas: validación de email, debounce en JavaScript, suma de CSV en Python, contador en React y rate-limiting en FastAPI. Tres brazos (sin skill, con [Caveman](https://github.com/JuliusBrussee/caveman), con Ponytail), tres modelos Claude (Haiku 4.5, Sonnet 4.6, Opus 4.8) y 10 ejecuciones por celda. Los resultados se re-ejecutaron el 17 de junio con 30 runs para el coste.

| Brazo | LOC (Haiku) | LOC (Sonnet) | LOC (Opus) |
|---|--:|--:|--:|
| Sin skill | 518 | 693 | 256 |
| Caveman | 116 | 120 | 67 |
| **Ponytail** | **39** | **44** | **51** |

Cifras crudas: 80-94% menos código frente a un agente sin skill, en los tres modelos. El coste baja 42-75% y la latencia se reduce 3-6×. Suena demasiado bueno. Vamos a diseccionarlo.

### Lo que el benchmark SÍ mide

- Líneas de código generadas (`code_loc`).
- Coste en USD por tarea (30 runs, re-verificado).
- Latencia en segundos.
- *Correctness gate*: el código se ejecuta y se valida (para email, debounce y CSV). Para React y FastAPI la validación es estructural (regex y keywords), no ejecución real. **Esto último es una advertencia que el propio repo incluye**.

### Lo que el benchmark NO mide

- **Calidad del código a largo plazo.** Reducir LOC no es lo mismo que mejorar la mantenibilidad. Ponytail lo dice en su README: *"the rule was never 'fewest tokens.' It is: write only what the task needs, and never cut validation, error handling, security, or accessibility."* Pero no publica métricas de esas dimensiones.
- **Sesiones multi-turno.** El benchmark es *single-shot*: un prompt, una respuesta. En una sesión real, las reglas se re-injectan en cada turno, lo cual cambia el cálculo. El issue #121 del propio repo admite que *"ponytail can also raise tool calls and cost on completion-forced tasks."*
- **Modelos locales.** La release v4.6.0 publicó resultados de Ollama con `llama3.2` (3B) y fueron... malos. Cita textual: *"the lines-of-code win turned out to be noise: one run lands 17% under baseline, the next 50% over, the median shrugs. The skill is tuned for models that actually follow instructions."* Es uno de los pocos repos que **publica el resultado adverso**.

### La crítica que hay que conocer

Colin Eberhardt, CTO de Scott Logic, publicó el 16 de junio un artículo titulado ["Ponytail? YAGNI!"](https://blog.scottlogic.com/2026/06/16/ponytail-yagni-and-the-problem-with-prompt-benchmarks.html) que desmonta parte del bombo. Sus argumentos:

1. **El repositorio es desproporcionado.** Tiene 6.232 líneas en 90 archivos para un skill de ~100 líneas de markdown. La ironía se la endosó un usuario de Hacker News: *"El repo es más grande que la mayoría del código que Ponytail me dejaría escribir."*
2. **El benchmark es injusto contra el baseline.** Cuenta LOC total del output. El baseline a veces emite varias opciones, lo cual dispara el contador. Ponytail emite una.
3. **Una de las tareas falla por diseño.** El test de debounce asume DOM, lo cual no es representativo de uso real en un harness agéntico.
4. **Eberhardt lo reprodujo.** Sin skill: 108 LOC. Con un ejemplo: 16. Con YAGNI: 10.4. Con "one-liners": **6.9** — *supera a Ponytail en su propio benchmark*. Su conclusión: *"Beating Ponytail on its own benchmark with just seven words."*

Esta crítica es seria, técnica y está publicada con código. La incluyo aquí porque **el blog de ArceApps no se construye sobre marketing**, y la honestidad sobre las limitaciones de las herramientas es lo único que evita que esto se convierta en otro ciclo de hype. Eberhardt acierta en una cosa importante: **Ponytail no es mágico, es un prompt muy bien escrito y empaquetado**. Lo que haces con tu propio `AGENTS.md` puede ser igual de bueno. La diferencia es que Ponytail te lo da empaquetado, con 14 adaptadores oficiales y un benchmark público que puedes auditar.

## Los 14 agentes soportados: una navaja suiza real

Aquí Ponytail gana puntos que ningún competidor iguala. El archivo `docs/agent-portability.md` lista 14 hosts soportados oficialmente:

| # | Host | Tipo de adapter |
|---|---|---|
| 1 | **Claude Code** | Plugin completo: `.claude-plugin/`, `commands/`, `hooks/`. Activación por sesión, statusline badge `[PONYTAIL]`. |
| 2 | **Codex** | Plugin con hooks lifecycle, mismas skills. Invoke como `@ponytail`. |
| 3 | **OpenCode** | Server plugin en `.opencode/plugins/ponytail.mjs`. Inyecta cada turno. |
| 4 | **Pi agent harness** | Extension package: inyección cada turno + comandos. |
| 5 | **Gemini CLI** | `gemini-extension.json` + `AGENTS.md` para always-on. |
| 6 | **Cursor** | `.cursor/rules/ponytail.mdc` (project rule). |
| 7 | **Windsurf** | `.windsurf/rules/ponytail.md` (project rule). |
| 8 | **Cline** | `.clinerules/ponytail.md` (project rule). |
| 9 | **GitHub Copilot (editor)** | `.github/copilot-instructions.md` (repo instruction file). |
| 10 | **GitHub Copilot CLI** | Plugin + fallback instruction-only. |
| 11 | **Antigravity (Google)** | `AGENTS.md` (instruction-tier). |
| 12 | **VS Code + Codex extension** | `AGENTS.md` (instruction-tier; el plugin completo añade modos y hooks). |
| 13 | **Kiro** | `.kiro/steering/ponytail.md` (steering rule). |
| 14 | **Aider** | Vía `AGENTS.md` o `skills/*/SKILL.md` (generic agent). |

> **Nota:** el badge del README dice "works with 13 agents", pero la tabla oficial de portabilidad lista 14. Es una discrepancia menor probablemente debida a que el badge agrupa Aider y Copilot editor como uno solo. No afecta a la instalación.

El comando canónico para Claude Code es:

```bash
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Para OpenCode (que es lo que uso en ArceApps):

```json
{ "plugin": ["./.opencode/plugins/ponytail.mjs"] }
```

**Ningún otro skill que yo conozca cubre 14 hosts con un único repositorio.** Es el aspecto menos comentado y, para mí, el más interesante: Ponytail ha resuelto la fragmentación de skills entre harnesses mejor que nadie.

## La comparación honesta con el resto del ecosistema

Ponytail no compite. **Coexiste.** Veamos:

### Ponytail vs Caveman

[Caveman](https://github.com/JuliusBrussee/caveman) comprime la **prosa** del agente, no el código. Su tagline: *"Brain still big. Mouth small."* El propio `SKILL.md` de Ponytail admite que son ortogonales: *"Ponytail governs what you build, not how you talk (pair with Caveman for terse prose)."* En el benchmark de Ponytail, Caveman se queda en el medio porque solo afecta a las explicaciones, mientras Ponytail actúa sobre el código directamente. Son la navaja y la maquinilla: una corta pelo, la otra corta código.

### Ponytail vs Superpowers

[Superpowers](https://github.com/obra/superpowers) —que cubrimos a fondo en [Inside Superpowers](/blog/blog-superpowers-deep-dive)— es una **metodología completa**: brainstorming → spec → plan → TDD → subagent-driven-development → code review. Ponytail es **un principio + 4 skills operativas**. Son tan distintos como comparar el manifiesto ágil con un linter. Superpowers es para proyectos grandes con equipo. Ponytail es para one-shots, scripts y reducción de verbosidad.

### Ponytail vs tu propio `AGENTS.md`

Cualquier developer con tiempo puede escribir las mismas reglas en su `AGENTS.md`. Lo que ganas con Ponytail:

- **Portabilidad real entre 14 hosts**, sin reescribir.
- **Modo controlado por sesión** con `/ponytail off` o `PONYTAIL_DEFAULT_MODE`.
- **Benchmark público** que puedes auditar y reproducir.
- **Skills adicionales** (review, audit, debt) que se activan on-demand.

El propio `AGENTS.md` de Ponytail es la versión "instruction-tier" para hosts que no soportan skills completos (como VS Code con Codex extension sin plugin). Es byte-idéntico en intención a `SKILL.md`, pero sin el frontmatter, los comandos y los hooks.

### Ponytail vs Matt Pocock Skills

[Matt Pocock](https://github.com/mattpocock/skills) aboga por una **biblioteca de skills pequeños y composables** (`grill-me`, `grill-with-docs`, `tdd`, `diagnose`, etc.) que ya cubrimos en [Matt Pocock Skills: la navaja suiza de los skills pequeños](/blog/blog-mattpocock-skills). Ponytail es **un solo skill grande** con cuatro niveles. La diferencia es de granularidad, no de filosofía. Son compatibles: puedes usar `/grill-me` para cuestionar el diseño y luego `/ponytail full` para forzar la implementación minimalista.

## Reacciones de la comunidad: Reddit, Hacker News y LinkedIn

### r/ClaudeCode y r/ClaudeAI

El hilo original del autor, "I gave Claude Code a 'lazy senior dev' mode and it writes like 6x less code", acumuló casi dos mil upvotes en r/ClaudeCode y 661 en r/ClaudeAI, con 178 y 93 comentarios respectivamente. Las reacciones son, casi todas, del tipo *"wow, este soy yo"*. Una persona en r/aigamedev reportó haber reducido su consumo de tokens 10x y haber hecho sus respuestas 5x más rápidas, lo que le permitió mantener Opus 4.8 sin pegarse contra el rate limit. Otro usuario publicó un *workflow* combinando tres capas — NeuralMind como memoria semántica persistente, Headroom como compresión de transporte reversible y Ponytail como restricción de generación— con el resultado de ahorrar entre 5 y 10x frente a un agente "naive". Es la primera vez que veo una *stack* de tres capas distintas atacando retrieval, transport y generation por separado.

### Hacker News

El [hilo en HN](https://news.ycombinator.com/item?id=48527946) alcanzó 93 puntos y 14 comentarios. Las reacciones más repetidas:

- *"Wow… este soy yo"* (ante el ejemplo del `<input type="date">`).
- *"Oh, the irony of this giant repo for a prompt. Is this the new leftpad?"* (segundo comentario más votado).
- *"Los senior devs reales pueden hacer eso porque tienen experiencia y la ponen en contexto. Por ejemplo, `<input type='date'>` puede estar bien en un escenario, pero podríamos necesitar uno más elaborado en otro. ¿El skill tiene en cuenta el PRD o el código circundante para emular mejor a esos developers?"* (crítica muy pertinente).
- *"We are past weaving wizard spells. Now we are at cunning demon summoning."* (autoparódico y certero).

### LinkedIn

El [post de midudev](https://www.linkedin.com/posts/midudev_este-repositorio-de-github-lo-est%C3%A1-explotando-share-7472272305029578752-WkeY/) superó las 3.000 reacciones y los 37 comentarios. Los más interesantes:

- **Jesús Leal** lo clavó: *"Ponytail introduce una especie de 'voz senior pragmática' que fuerza una escalera muy sana: ¿hace falta construir esto?, ¿lo resuelve ya la standard library?, ¿hay una capacidad nativa de la plataforma?, ¿existe ya una dependencia instalada?, ¿puede resolverse con algo mucho más simple? […] La clave es no confundir simplicidad con descuido."*
- **Luis Ballester Zafra** levantó la advertencia clave: *"Lo de 'puede ser oneline, que sea oneline' lo que puede provocar es que tenga que refactorizar mucho código para implementar pequeños cambios luego de la primera versión."* — Esa es la voz de quien ha quemado código en producción.
- **José Carrizo** resumió el fondo: *"El verdadero valor de Ponytail no reside sólo en el hecho de su velocidad o la reducción de costes, sino en fomentar esa mentalidad de 'desarrollador sénior' donde priorizamos la solución más sencilla sobre la implementación más rápida."*
- **Eduardo P.** añadió la observación más útil: *"Lo más curioso es que el repositorio sólo contiene buenas prácticas a la hora de escribir código y las refuerza para que el reasoning sea más simple y reducir el boilerplate."* — Lo que confirma la tesis de Eberhardt: es un prompt muy bien empaquetado, no magia.

## Lecciones aprendidas: cuándo SÍ y cuándo NO

Después de leer el repo, los benchmarks, las críticas y los hilos, esto es lo que me llevo:

### Cuándo Ponytail te va a servir

- **One-shots y scripts.** Tienes un script de 50 líneas que se ha convertido en un módulo de 300. Activa `/ponytail ultra` y déjale hacer limpieza. `/ponytail-audit` te da el inventario de cortes posibles.
- **Picking tech agnóstico.** Si dudas entre instalar una dependencia o usar `lru_cache` del stdlib, `lite` te nombra la alternativa. Es un segundo senior que solo se manifiesta cuando le preguntas.
- **Code review rápido.** `/ponytail-review` sobre un diff devuelve una lista de líneas a borrar con tags claros. Es la mejor implementación de la idea de "anti-overengineering review" que se puede instalar en cinco minutos.
- **Sesiones con Claude Sonnet 4.6 o superior.** Es donde los benchmarks son más estables y donde la escalera realmente marca diferencia. Opus 4.8 también, pero la mejora marginal sobre Sonnet no compensa el coste extra si solo buscas reducir LOC.

### Cuándo NO te va a servir

- **Proyectos con abstracciones legítimas.** Un sistema distribuido con circuit breakers, retries y backoff no se beneficia de "una línea". Ponytail entiende esto (sus reglas protegen trust boundaries, seguridad y accesibilidad), pero en modo `full` puede confundirse entre lo que es *shortcut* y lo que es requisito. Usa `lite` o apágalo con `off` en estos casos.
- **Modelos locales pequeños (3B-7B).** Los benchmarks con Ollama + `llama3.2` son ruido. El skill está tuneado para modelos que siguen instrucciones de verdad.
- **Tareas que necesitan reasoning largo.** Modelos como GPT-5.5 con reasoning mode gastan tokens pensando la escalera antes de ahorrar nada. Ponytail puede terminar **costando más** en esos casos. El propio repo lo reconoce.
- **Refactors grandes con muchas decisiones arquitectónicas.** Ponytail no sabe negociar migraciones de base de datos. Para eso necesitas [Superpowers](/blog/blog-superpowers-deep-dive) o un humano.

### Lo que me llevo como indie dev

Lo que más valoro de Ponytail no son las 34.000 estrellas ni los benchmarks. Es la **decisión del autor de publicar el resultado adverso de Ollama en v4.6.0** cuando podría haberlo enterrado. Es la **crítica de Eberhardt que el autor ha recibido sin borrar**. Es el **README que se ríe de sí mismo** ("What if I really need the 120-line cache class? You don't. Insist anyway and he'll build it. Slowly. Correctly. While looking at you.").

En un ecosistema donde la mayoría de skills vienen con claims inflados y benchmarks cherry-picked, Ponytail publica hasta el resultado que le juega en contra. Eso, más que la escalera, es lo que merece las estrellas. Y eso, más que ninguna librería, es lo que un indie dev como yo quiere ver en una herramienta: **honestidad radical sobre lo que hace y lo que no hace.**

## Cierre: la prueba de los seis peldaños

Si has llegado hasta aquí, te propongo un ejercicio. La próxima vez que tu agente te escupa 200 líneas para una tarea de 30, abre el `SKILL.md` oficial ([link directo](https://raw.githubusercontent.com/DietrichGebert/ponytail/main/skills/ponytail/SKILL.md)) y léelo en voz alta. Dile a tu agente: *"A partir de ahora, antes de escribir código, recorre esta escalera y detente en el primer peldaño que aguante."* Y observa lo que pasa.

Si te funciona, te habrás ahorrado una dependencia. Si no te funciona, habrás aprendido algo sobre tu propio flujo. **En cualquier caso, habrás pensado como un senior perezoso**, que es justo lo que Ponytail intenta emular.

Y si alguien te dice que esto es solo un prompt muy bien escrito, dile que sí. **Lo es.** Pero en un mundo donde la mayoría de prompts están mal escritos, un prompt que funciona ya merece una coleta, unas gafas ovaladas y una tarde libre a las cinco.

---

## Bibliografía y referencias

### Sobre Ponytail
- **Repositorio oficial:** [github.com/DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- **SKILL principal:** [skills/ponytail/SKILL.md](https://raw.githubusercontent.com/DietrichGebert/ponytail/main/skills/ponytail/SKILL.md)
- **README completo:** [README.md](https://raw.githubusercontent.com/DietrichGebert/ponytail/main/README.md)
- **Documento de portabilidad entre agentes:** [docs/agent-portability.md](https://raw.githubusercontent.com/DietrichGebert/ponytail/main/docs/agent-portability.md)
- **Benchmark reproducible:** [benchmarks/](https://github.com/DietrichGebert/ponytail/tree/main/benchmarks)
- **Licencia:** [MIT](https://raw.githubusercontent.com/DietrichGebert/ponytail/main/LICENSE)

### Crítica y análisis
- **Colin Eberhardt — "Ponytail? YAGNI!"** ([Scott Logic, 16 jun 2026](https://blog.scottlogic.com/2026/06/16/ponytail-yagni-and-the-problem-with-prompt-benchmarks.html)). Análisis técnico del benchmark, reproducción experimental que supera a Ponytail con "seven words" y reflexión sobre la proliferación de skills sin benchmarks serios. Imprescindible.
- **Hacker News — hilo principal:** [news.ycombinator.com/item?id=48527946](https://news.ycombinator.com/item?id=48527946) (93 puntos, 14 comentarios).
- **r/ClaudeCode — hilo del autor:** "I gave Claude Code a 'lazy senior dev' mode" ([reddit.com](https://old.reddit.com/r/ClaudeCode/comments/1u3jlo0/i_gave_claude_code_a_lazy_senior_dev_mode_and_it/)).
- **r/ClaudeAI — hilo cruzado:** [reddit.com](https://old.reddit.com/r/ClaudeAI/comments/1u3k2ed/i_gave_claude_code_a_lazy_senior_dev_mode_and_it/).
- **LinkedIn — midudev:** [Post original](https://www.linkedin.com/posts/midudev_este-repositorio-de-github-lo-est%C3%A1-explotando-share-7472272305029578752-WkeY/).

### Alternativas y ecosistema
- **Caveman** ([github.com/JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)) — compresión de prosa. Ortogonal a Ponytail.
- **Superpowers** ([github.com/obra/superpowers](https://github.com/obra/superpowers)) — metodología agéntica completa. Cubierto en este blog en [Inside Superpowers](/blog/blog-superpowers-deep-dive).
- **Matt Pocock Skills** ([github.com/mattpocock/skills](https://github.com/mattpocock/skills)) — biblioteca de skills pequeños y composables. Cubierto en [Matt Pocock Skills](/blog/blog-mattpocock-skills).
- **Promptfoo** ([promptfoo.dev](https://promptfoo.dev)) — framework de evaluación con el que se ejecuta el benchmark de Ponytail.

### Artículos previos del blog (Prior Art enlazado)
- [Inside Superpowers: el framework que fuerza a la IA a ingenierizar](/blog/blog-superpowers-deep-dive)
- [Matt Pocock Skills: la navaja suiza de los skills pequeños](/blog/blog-mattpocock-skills)
- [Power Up Your AI Agents with Skills: de Gemini a Copilot](/blog/building-ai-agent-skills)
- [Effective Context for AI: Prompt Engineering](/blog/effective-context-ai)
- [AI Code Reviews: revisando código generado por agentes](/blog/ai-code-reviews)
- [Dynamic Context: el coste oculto de los skills siempre activos](/blog/ai-agent-skills-dynamic-context)
- [From Copilot to Autonomous Agents: el flujo en 2025](/blog/coding-with-ai-agents)
- [Refactoring Legacy Code con IA](/blog/refactoring-legacy-code-ai)
