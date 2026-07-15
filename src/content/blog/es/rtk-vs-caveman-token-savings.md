---
title: "RTK vs Caveman: el ahorro real de tokens en agentes"
description: "RTK y Caveman prometen 60-90% menos tokens en agentes. Mido los dos con datos: JetBrains 8,5%, replay 614M tokens y qué cambia entre comprimir output y prosa."
pubDate: 2026-07-14
lastmod: 2026-07-15
author: ArceApps
keywords:
  - "RTK"
  - "Caveman"
  - "AI Agents"
  - "Token Savings"
  - "CLI Proxy"
  - "Prompt Caching"
  - "Cost Optimization"
canonical: "https://arceapps.com/es/blog/rtk-vs-caveman-token-savings/"
heroImage: "/images/rtk-vs-caveman-token-savings/es/cover.png"
tags: ["RTK", "Caveman", "AI Agents", "Tokens", "Cost Optimization", "Claude Code", "CLI", "Indie Dev"]
reference_id: "e1d8b2c1-fbf8-4e37-b63c-9cd6f8a11f30"
---

> **Lecturas relacionadas en el blog:** Hace dos semanas te conté el [playbook completo de ahorro de tokens](/es/blog/ai-token-savings-strategies/) (prompt caching, model routing, LLMLingua) y hace meses analicé por separado [Caveman](/es/blog/caveman-skill-token-compression) y [Headroom](/es/blog/headroom-compression-layer). Este artículo es el siguiente paso: ya no es la versión optimista. Es lo que pasa cuando pones las dos herramientas virales del verano de 2026 a competir con datos en la mano.

![Cover del artículo RTK vs Caveman — dos filosofías, dos cifras, dos futuros para tu factura de tokens](/images/rtk-vs-caveman-token-savings/es/cover.png)

## La factura que ya estaba bien, y la que me volvió a picar

Tengo un problema recurrente con mis agentes: les pido algo y me devuelven más de lo que pedí. Un validador de email se convierte en una clase de 27 líneas envueltas en seis párrafos de cortesía. Un test de regresión se convierte en una narrativa que justifica cada línea del framework que ya tengo asumido. Y todo eso lo paga mi tarjeta, en mi casa, sin que nadie me pida permiso.

Hace poco me senté a hacer cuentas. Esas cuentas dieron lugar al artículo del playbook de ahorro: prompt caching al 88%, model routing al 60-95%, LLMLingua al 73%, pipeline combinado al 95-99%. Lo publiqué optimista. Tan optimista que, releído un mes después, parece el típico "10 trucos para ahorrar en tu factura" de los que circulan por LinkedIn. Y aquí vengo a enmendarlo un poco.

No a desmontarlo, ojo. Las cifras del playbook siguen siendo ciertas en su contexto: cada técnica por separado cumple lo que promete. El problema es que, en esos días de julio, me topé con dos proyectos que se han viralizado con claims más ambiciosos. Uno se llama **RTK (Rust Token Killer)**. El otro, ya lo conoces si lees este blog, se llama **Caveman**. Cada uno promete recortes del 60-90%. Cada uno tiene decenas de miles de estrellas. Y cada uno decide gastarse la credibilidad publicitaria en una métrica que, mirada con cuidado, mide algo distinto de lo que tú crees cuando la lees.

Este artículo es una **contrastación honesta con datos**. No es una reseña. No es una toma de partido. Es la respuesta a una pregunta concreta: *"¿Cuánto voy a ahorrar yo, mañana, si instalo RTK y/o Caveman en mi setup?"*. Y la respuesta corta es: depende. La respuesta larga es lo que sigue.

> **Nota de honestidad:** todas las cifras que aparecen en este artículo están verificadas en sus fuentes primarias a fecha de julio de 2026. RTK (89,8k → 71,2k estrellas cuando escribo esto) y Caveman (89,8k estrellas) son proyectos vivos: las cifras cambian cada semana. Lo que no cambia es la mecánica, los benchmarks publicados y las críticas que cito. Donde dude, lo digo.

## Por qué importa el ahorro de tokens en 2026

El coste por token ha bajado desde 2024. GPT-4o a 5 dólares por millón de output tokens era un estándar; ahora los frontier cuestan entre 15 y 75 dólares por millón, pero los mini y nano cuestan 0,15 a 1,50. Eso es una mejora de 10x en algunos casos. ¿Problema? El **número de tokens consumidos por sesión se ha multiplicado más rápido de lo que han bajado los precios**. Los agentes modernos (Claude Code, Codex CLI, Cursor Agent, Aider, opencode, Cline, Windsurf, Hermes) ya no son chats. Son loops multi-paso. Cada turno reenvía al modelo el contexto acumulado, y eso se factura en cada llamada.

Algunas cifras que merece la pena tener en la cabeza antes de seguir:

- **El coste por turno crece de forma triangular, no lineal.** En un agente con N turnos, el coste total se aproxima a N·(N+1)/2, porque cada turno re-paga todos los tokens anteriores. Waxell.ai documenta que los equipos que modelan el coste como "turnos × coste medio" subestiman el coste real entre 3x y 5x.
- **El system prompt se reenvía siempre.** Un system prompt de 4.000 tokens en un agente de 20 turnos consume 80.000 tokens sólo en overhead estructural. Eso es, según Waxell, alrededor del 16% de la factura en un workflow de 500k tokens, sin contar razonamiento.
- **El output agentic no es prosa: es código, diffs, tool calls y logs.** JetBrains lo midió en su benchmark A/B con SkillsBench sobre Claude Code: sólo la "narración entre tool calls" es comprimible. El grueso del output se preserva por necesidad técnica.
- **El "lost in the middle" castiga el contexto largo.** El paper de Liu et al. y el informe técnico de Chroma (julio 2025, 18 modelos) muestran que la atención decae de forma no lineal: a partir de 10k-50k tokens algunos modelos degradan su rendimiento de forma "catastrófica", no gradual. Mem0 midió en LoCoMo 2026 que mover a una arquitectura de memoria jerárquica pasó del 72,9% al 91,6% de accuracy, con un 4x menos de tokens.

En resumen: meter menos ruido en la ventana de contexto no es estética, es margen para razonar mejor, gastar menos y no degradar la calidad. Por eso en 2026 han aparecido tantas herramientas prometiendo recortes del 60-90%. La pregunta es cuáles entregan lo que prometen y cuáles viven del marketing.

## Las dos filosofías: comprimir el output vs. acortar la prosa

Antes de entrar a RTK y Caveman conviene entender el frame. En un loop agentic, los tokens que pagan la factura se reparten, en términos generales, así:

| Origen del token | Peso aproximado en una sesión agentic | ¿Es candidato a compresión? |
|---|---|---|
| Output de herramientas (`cargo test`, `git status`, `ls`, `grep`, logs, JSON de APIs) | 40-60% del total de tokens consumidos | **Sí, mucho margen.** |
| Código, diffs y tool calls que el modelo escribe | 20-30% | **Poco o nada:** alterar esto es alterar el trabajo. |
| System prompt + memoria + contexto persistido | 10-15% | **Margen medio.** |
| Narración / prosa del modelo entre tool calls | 5-15% | **Sí, pero el techo es bajo.** |

Esta tabla es la pieza clave del artículo. Léela otra vez. **Los tokens que dominan la factura de un agente son los que vienen de las herramientas, no la prosa que el modelo escribe alrededor**. Y aquí es donde divergen RTK y Caveman:

- **RTK** ataca la fila 1: el output de las herramientas. Filtra, agrupa, trunca y deduplica el ruido de `git status`, `cargo test`, `pytest`, `ls`, `grep`… antes de que llegue al modelo.
- **Caveman** ataca la fila 4: la prosa. Le pide al modelo que escriba como un cavernícola ("Auth middleware bug. Session tokens expire early. Fix: check expiry logic." en lugar de un párrafo). Es una system prompt hack.

La diferencia conceptual es enorme. Una comprime el grueso de los tokens. La otra comprime una fracción pequeña y, encima, no la que más cuesta.

![Infografía comparativa RTK vs Caveman — dónde apunta cada uno en el flujo agentic, qué técnicas usa y qué métricas publicita vs. qué mide realmente](/images/rtk-vs-caveman-token-savings/es/infographic-comparison.png)

## RTK (Rust Token Killer): la herramienta que va en el camino correcto

### Qué es y cómo funciona

**RTK** es un proxy CLI escrito en Rust (binario único, sin dependencias, <10ms de overhead por comando) que se interpone entre tu shell y tu agente de IA. Cuando tu agente ejecuta `git status`, RTK lo reescribe internamente a `rtk git status`, ejecuta el comando, recibe la salida cruda, la comprime, y devuelve al modelo una versión drásticamente más corta pero con la misma señal.

Su creador documenta haber medido **un 89% de reducción media de ruido** sobre más de 2.900 comandos reales acumulados en su propio uso (10,3M de tokens ahorrados sobre 11,6M de input, según el README). El sitio oficial ([rtk-ai.app](https://www.rtk-ai.app/)) habla de "3x longer sessions" y savings agregados que rondan el 60-90% por comando. Los benchmarks agregados que muestra el proyecto, sobre proyectos medianos TypeScript/Rust, son estos:

- `cargo test`: -91,8%
- `pytest` / `jest` / `vitest`: -90%
- `go test`: -90%
- `git status`: -80,8%
- `git diff`: -75%
- `git log`: -80%
- `git add` / `commit` / `push`: -92%
- `find`: -78,3%
- `grep` / `rg`: -49,5%
- `ls` / `tree`: -80%
- `cat` / `read`: -70%
- `docker ps`: -80%
- `ruff check`: -80%

En una sesión típica de 30 minutos sobre un proyecto TypeScript/Rust medio, el README estima 118.000 tokens de output de herramientas que bajan a 23.900. Reducción agregada del ~80%. Lo importante: estas cifras **son RTK contra el output crudo**, no contra tu factura total. Distinguir eso es lo que luego nos duele con Caveman.

### Las cuatro estrategias que aplica

Lo que hace RTK no es magia, son cuatro técnicas bien conocidas de procesamiento de logs, aplicadas con un parser específico por comando:

1. **Smart filtering.** Elimina comentarios, líneas en blanco, código boilerplate, líneas de progreso, códigos ANSI de color, prefijos repetidos. Lo que no afecta al juicio del modelo se va.
2. **Grouping.** Agrupa elementos similares. Ficheros por directorio, errores por tipo, warnings de linter por regla. Reduce el ruido visual que el modelo tiene que parsear.
3. **Truncation con contexto.** Conserva las primeras y últimas líneas (donde está el grueso de la señal) y corta el medio cuando hay redundancia. Un test que falla 200 veces seguidas merece un "200 fallos idénticos en test_login.py línea 42" en lugar de 200 líneas.
4. **Deduplication.** Colapsa líneas repetidas con un contador. 47 líneas idénticas → `... 47 identical lines ...`.

El resultado, en palabras del propio README: *"The agent receives compact output without needing to call `rtk` explicitly."* Es decir, el hook lo hace transparente.

### Integración: una instalación, catorce agentes

RTK soporta catorce agentes: Claude Code, Cursor, Aider, Gemini CLI, OpenAI Codex, Cline, Roo Code, Kilo Code, Windsurf, GitHub Copilot, Pi, Hermes, Antigravity y Kilocode. La instalación es una línea:

```bash
brew install rtk
# o
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh
# o
cargo install --git https://github.com/rtk-ai/rtk
```

Y el hook se activa con uno de estos:

```bash
rtk init -g                 # Claude Code / Copilot (default)
rtk init -g --gemini        # Gemini CLI
rtk init -g --codex         # Codex (OpenAI)
rtk init -g --agent cursor  # Cursor
rtk init --agent cline
rtk init --agent kilocode
rtk init -g --agent hermes  # Hermes
```

El hook reescribe comandos Bash antes de su ejecución, así que la adopción es del 100% sin que cambies un solo workflow.

### Telemetría: `rtk gain` y `rtk discover`

Otra pieza importante y que pocos mencionan: RTK no te pide que te fíes. Incluye un comando de analítica propia:

```bash
rtk gain              # resumen de tokens ahorrados
rtk gain --graph      # gráfica ASCII de los últimos 30 días
rtk gain --history    # historial reciente
rtk gain --daily      # desglose día a día
rtk gain --all --format json   # export para dashboards
rtk discover          # oportunidades de ahorro no aprovechadas
rtk session           # adopción de RTK en sesiones recientes
```

Esto es relevante por dos razones. Primero, **puedes verificar el ahorro sin creer al README**. Segundo, es de las pocas herramientas de este espacio que da un mecanismo de auditoría built-in. Cuando alguien te promete "60-90% de ahorro", poder correr un comando y ver el número exacto en tu propio workload es la diferencia entre un proyecto maduro y un benchmark de marketing.

### Por qué va en el camino correcto

RTK acierta en lo importante:

- **Ataca donde están los tokens.** La salida de las herramientas es, según la tabla de arriba, el componente dominante de la factura agentic. RTK opera exactamente ahí.
- **Es determinista.** Comprimir logs no es una decisión del modelo: es regex + heurísticas + fallback al output crudo si la heurística falla. No introduces variabilidad en el comportamiento del agente.
- **Es transparente.** El hook reescribe antes de ejecutar. El agente no tiene que aprender a llamar a RTK: la propia CLI lo hace por él.
- **Es auditable.** `rtk gain` te dice exactamente cuánto ahorraste y en qué comandos. Puedes optimizar tu workflow mirando los datos.
- **Es compatible con todo.** Soporta 14 agentes, 100+ comandos, macOS, Linux, Windows, WSL. El coste de adopción es ~5 minutos.
- **No toca el razonamiento.** No cambia el system prompt, no pide al modelo que escriba diferente, no introduce un modo raro. El "cerebro" del agente sigue siendo el mismo. El ahorro viene de no pagar 1.000 tokens de relleno por 100 que valen la pena.
- **Bajo overhead.** <10ms por comando según los benchmarks publicados. En la práctica, imperceptible.
- **OSS y portable.** Apache 2.0, binario en Rust, sin telemetría obligatoria, sin cuentas. 71,2k estrellas en GitHub a fecha de este artículo, creciendo.

Y lo más importante: **cuando hay que cambiar el comportamiento, hay palancas reales para ello**. Si una nueva versión de `cargo test` cambia su formato, se actualiza el parser; el sistema degrada a fallback de output crudo si el parser falla. Es ingeniería de software convencional, no truco de magia.

### Las críticas honestas que también hay que leer

RTK no es perfecto. Tiene limitaciones reales que conviene mencionar para no vender humo:

- **Cache invalidation.** Bent Collins (AI Code Watch) midió en su benchmark suite que, al añadir RTK, a veces el consumo total **subió** en lugar de bajar, precisamente porque la reescritura del output puede invalidar el caché de prompts. En arquitecturas con prompt caching agresivo (como cubrimos en el [playbook de ahorro](/es/blog/ai-token-savings-strategies/), el prompt caching aporta hasta un 88% en llamadas repetitivas), hay que medir. JetBrains también señala que un único trial con tarea que cruza el umbral de long-context pricing puede borrar meses de ahorro (en su benchmark, un task concreto costó $8,29 vs $0,33 por cruzar el tier de 200k).
- **Fragilidad ante cambios de formato.** Los parsers están atados a la salida textual de las herramientas. Si `git`, `cargo`, `npm` o `grep` cambian su formato en una release, el filtro puede romperse. La mitigación (fallback a output crudo) está bien diseñada, pero hay que tenerla presente.
- **Lo que el README dice vs. lo que tu repo te da.** Los números del README son estimaciones sobre proyectos medios TypeScript/Rust. Proyectos muy grandes (VS Code, ~10k ficheros) o muy pequeños (un script) no son el mismo workload. Pachaar reportó 73% menos de tokens y 72% menos de tool calls en VS Code; en un proyecto pequeño puedes ver ahorros menores o incluso neutros.
- **No comprime todo.** Hay comandos no soportados donde el output pasa crudo. La cobertura (100+ comandos) es amplia, pero no universal.
- **Hook vs. plugin.** El hook reescribe comandos Bash, pero las herramientas nativas de Claude Code (Read, Grep, Glob) **no pasan por el hook de Bash**. Si tu agente usa sus herramientas nativas para esas operaciones, RTK no las intercepta. Es un matiz importante que el propio README aclara y que muchos usuarios pasan por alto.

Aun con todo, RTK es la mejor herramienta open source de su categoría en 2026. El que tenga margen de mejora no le quita el sitio; le quita la arrogancia al benchmark.

## Caveman: la skill de moda que no soluciona el problema real

### Qué es y por qué se hizo viral

Ya cubrí Caveman en profundidad hace semanas ([artículo completo aquí](/es/blog/caveman-skill-token-compression/)). Hoy lo voy a apretar en una sola sección, pero necesito que lo entiendas como antes de seguir: **Caveman ya estaba en este blog, lo analicé por separado, y la conclusión fue tibia pero decente**. Lo que ha cambiado en julio de 2026 es que tenemos datos de terceros que matizan lo que entonces sólo intuíamos.

**Caveman** ([github.com/JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)) es una skill/plugin para Claude Code, Codex, Gemini, Cursor, Windsurf, Cline, GitHub Copilot y "30+ más" que le dice al agente que hable "como un cavernícola". Literalmente: en lugar de "I've analyzed the code and identified a potential issue with the authentication middleware that could cause session tokens to expire prematurely", el agente escribe "auth middleware bug. session tokens expire early. fix: check expiry logic".

El eslogan del repo es memorable y está muy bien ejecutado en marketing:

> *Why use many token when few do trick.* (por qué usar muchos tokens cuando pocos hacen el truco).

El repo afirma una **reducción media del 65% en output tokens** (rango 22-87%) sobre 10 prompts medidos contra la API real de Claude. El mecanismo es instructivo: una system prompt hack que elimina artículos (a, an, the), rellenos (just, really, actually, simply), coletillas (sure, certainly, happy to), hedges (might be worth considering) y obliga a sinónimos cortos. Cuatro niveles de intensidad: lite, full (default), ultra y 文言 (chino clásico). Tiene también sub-skills como `caveman-commit`, `caveman-review` y `caveman-compress` (que reescribe `CLAUDE.md` en caveman-speak para reducir input tokens).

Cuando salió, se hizo viral: **89.826 estrellas** en GitHub cuando escribo esto, memes, hilos en Reddit, videos en YouTube, artículos en blogs de developers. El framing era irresistible: una solución tan simple que cabe en un system prompt, divertida, con un número grande (65%) y un nombre pegadizo.

### El benchmark que nadie quería leer: JetBrains, 86 tareas pareadas

En julio de 2026, JetBrains publicó un benchmark A/B con 86 tareas reales de SkillsBench corriendo en Claude Code. El método fue riguroso:

- **Pareado:** cada tarea se ejecutó dos veces, una con Caveman forzado en cada reply y otra sin él.
- **Auto-grading:** cada tarea evaluada por sus propios tests en escala 0-1.
- **Activación forzada:** Caveman es activado por el usuario, pero JetBrains lo forzó siempre activo. Esto es importante: el número que midieron es el **techo absoluto**, no el caso típico. En uso real, donde el agente decide cuándo activar el modo, el ahorro es igual o peor.
- **Sample size honesto.** Empezaron con 10 tareas y vieron un ahorro del 29,5%. Cuando subieron a 86, el ahorro cayó a 8,5%. La moraleja que ellos mismos escriben: *"Never trust a k=1 eval"*.

Los resultados:

| Métrica | Resultado |
|---|---|
| **Ahorro de output tokens (con Caveman forzado)** | **~8,5%** |
| **Ahorro de coste (estimación)** | **~10%** (anulado por varianza trial a trial) |
| **Degradación de calidad** | Indetectable: 8 tareas mejor, 10 peor, 64 empatadas; diferencia media de score 0,015 sobre escala 0-1, p=0,82 |
| **Coste total agregado** | El brazo Caveman salió **11,6% más caro en términos absolutos** ($40,60 vs $36,39), porque un único trial de dependency-audit cruzó el tier de long-context y facturó $8,29 vs $0,33. |

El propio equipo de JetBrains lo resume con claridad:

> *The advertised 65% belongs to chat-style Q&A, not to coding agents. The bulk of token consumption in agentic coding workflows comes from reading project files, reasoning through tasks, invoking tools and generating code, limiting the overall savings from trimming conversational language alone.*

En cristiano: el 65% aplica a Q&A conversacional tipo chat, donde la prosa es casi todo el output. En un agente, la prosa es la minoría. La mayoría son tool calls, código, diffs y logs, que Caveman deliberadamente no toca.

### El replay de 614 millones de tokens: la cifra demoledora

Si el benchmark de JetBrains ya era incómodo, el replay independiente de codepointer (Substack, junio 2026) es demoledor. Replay sobre **614 millones de tokens de sus propias sesiones reales de Claude Code, equivalentes a $926 de gasto**, con las tres herramientas más populares (RTK, Headroom y Caveman) instaladas a la vez:

| Herramienta | Ahorro publicitado | Ahorro real (replay) |
|---|---|---|
| Headroom | 60-95% | 2,8% del gasto |
| **RTK** | 60-90% por comando reconocido | **0,5% del gasto** |
| **Caveman** | "halves prose" | **0,4% del gasto** |
| **Las tres combinadas** | — | **3,7%** del gasto |

La observación clave del autor: *"The advertised numbers are not exaggerated. Each measures a different thing on a different workload, and three layers separate a fewer-tokens claim from a lower bill."* Es decir, los porcentajes de marketing no son falsos en sentido estricto, pero **miden cosas distintas a lo que el desarrollador promedio entiende por "ahorro"**. Cuando un repo dice "65% de ahorro en output tokens", no te está diciendo "tu factura baja un 65%". Te está diciendo "el subconjunto de tokens que es prosa comprimible baja un 65%". Que resulta ser un subconjunto pequeño del total que pagas.

Y aquí viene el matiz que casi nadie cuenta: en un agente, el modelo **relee el contexto completo en cada turno**. Si reduces el output del turno N, los turnos N+1…N+k heredan el contexto reducido, sí, pero también pagas el input otra vez. El ahorro marginal en output se diluye en el input acumulado. Por eso 8,5% de output baja a 10% de coste, y por eso tres herramientas combinadas en una sesión real sólo ahorran 3,7% del gasto total.

### El patrón viral: "hack de system prompt" + número grande

Lo de Caveman no es único. Es un patrón que se repite: alguien publica un repo con un prompt bien redactado, un número grande (65%, 75%, "halves tokens"), un eslogan pegadizo, y un README lleno de comparativas antes/después muy visuales. Se viraliza porque:

- La promesa es simple de explicar en un tweet.
- El "antes/después" es fotogénico: 69 tokens vs 19 tokens.
- El install es trivial: una línea, copia-pega en system prompt.
- El número grande es irresistible para compartir.

El problema es que **mide el segmento favorable de la métrica**. Caveman mide output tokens, no coste total. RTK mide tokens de output de herramientas, no coste total. Headroom mide otra cosa. Y los tres mezclan unidades. Cuando se mide lo mismo en la misma sesión (lo que hizo codepointer), el ahorro combinado es del 3,7%. Y aun así, hay que tener en cuenta el matiz de cache invalidation: las herramientas de compresión pueden invalidar el prompt cache, que es un multiplicador silencioso de coste.

Esto no convierte a Caveman en una estafa. Su README es explícito sobre qué mide y qué no. **El problema es la distancia entre lo que un developer lee ("65% menos tokens") y lo que eso significa en su sesión agentic real (8,5% menos output, ~10% menos coste, con varianza que puede anularlo)**.

### Lo que Caveman sí hace bien (para ser justos)

Por honestidad, Caveman no es inútil. Tiene usos legítimos:

- **Reduce la prosa en respuestas puramente conversacionales.** Si tu uso principal es Claude en chat (no en agentic), el 65% se acerca a la realidad.
- **Hace al modelo más rápido para el usuario humano.** Las respuestas son más cortas, más directas, menos relleno. Eso se agradece al leer.
- **No degrada la calidad** (p=0,82 en el benchmark de JetBrains). Es seguro activarlo.
- **Es divertido.** El eslogan es pegadizo, el estilo es memorable, y usarlo produce respuestas que dan gusto leer. No es un bug, es un feature social.
- **`caveman-compress` reescribe `CLAUDE.md` con un 46% menos de tokens de input.** Esto sí tiene valor: comprimir la memoria persistente del agente se traduce en input más barato en cada turno. Es la única pieza de Caveman que ataca la fila 3 de nuestra tabla (system prompt + memoria), y probablemente la más útil.

El problema no es Caveman. El problema es presentarlo como "la solución al coste de tokens en agentes". No lo es.

## La comparativa con datos: qué dice la evidencia independiente

Vamos a ponerlo todo en una tabla y mirarlo de frente. La diferencia entre el marketing y la realidad se ve en cinco líneas.

### RTK vs. Caveman: misma tarea, distinto enfoque

| Dimensión | RTK | Caveman |
|---|---|---|
| **Qué comprime** | Output de herramientas CLI | Prosa del modelo |
| **Cómo lo comprime** | Parsers deterministas (regex + heurísticas + fallback) | System prompt hack + cambio de estilo |
| **Ahorro publicitado (mejor caso)** | 80-90% por comando, 89% agregado | 65% en output, 75-80% en ultra |
| **Ahorro medido en agentic real** | 35% por sesión (Pachaar) hasta 73% en repos grandes | **8,5% output, ~10% coste** (JetBrains, 86 tareas) |
| **En replay realista ($926, 614M tokens)** | 0,5% del gasto | 0,4% del gasto |
| **Ahorro en chat conversacional** | N/A (no aplica) | ~65% (su benchmark) |
| **Degradación de calidad** | Nula (no cambia comportamiento del modelo) | Indetectable (p=0,82, JetBrains) |
| **Cache invalidation** | Riesgo bajo, ya que sólo cambia output de comandos | Riesgo bajo, sólo cambia estilo |
| **Cobertura** | 100+ comandos, 14 agentes | 30+ agentes (cualquiera con system prompt) |
| **Auditable** | Sí (`rtk gain`) | No |
| **Coste de adopción** | 1 línea + 1 hook (~5 min) | Pegar system prompt o instalar skill |
| **Riesgo de fragilidad** | Medio: parsers atados a formato de herramientas | Bajo: es un prompt, no un parser |
| **Modelo de negocio** | OSS Apache 2.0 | OSS MIT |
| **Estrellas GitHub (jul 2026)** | 71,2k | 89,8k |

![Tabla benchmarks JetBrains + codepointer — las cifras reales a la derecha de los claims publicitados a la izquierda. 8,5% no es 65%](/images/rtk-vs-caveman-token-savings/es/benchmark-chart.png)

### Lo que un developer debería esperar, con honestidad

Si mañana instalas RTK en un proyecto medio (TypeScript o Rust, ~20-50k LOC, tests corriendo, git activo), en un día de trabajo normal vas a ver:

- Entre **35% y 80% menos tokens de output de herramientas** en tu sesión, dependiendo de cuánto uses tests y git. El comando `rtk gain --daily` te lo confirma.
- **Sesiones entre 1,5x y 3x más largas antes de tocar el límite de contexto o el rate cap** (el README cita "3x longer sessions").
- **Coste de API entre 30% y 70% más bajo** en esa sesión, asumiendo que no cruzas el tier de long-context (donde cache invalidation puede comerse el ahorro, como demostró JetBrains con un caso de $8,29 vs $0,33).

Si activas Caveman en la misma sesión, vas a ver:

- **~8,5% menos output tokens en agentic** (techo, con activación forzada; en uso normal, menos).
- **~10% menos coste esperado** (techo), con varianza que puede convertirlo en neutro o ligeramente negativo en trials individuales.
- **0,4-2,8% de ahorro real del gasto en sesiones reales**, según el replay de codepointer.

Si combinas las tres herramientas (RTK + Headroom + Caveman) en un setup agresivo:

- **3,7% de ahorro combinado del gasto**, según el mismo replay. No es broma: tres proyectos con 60-90% de ahorro publicitado, combinados, ahorran 3,7% en sesión real. Hay que leer esto dos veces para creérselo.

### Por qué la diferencia entre marketing y realidad

Por tres razones técnicas que merece la pena entender:

1. **El input domina en sesiones largas.** Un agente reenvía el contexto completo en cada turno. Si reduces el output del turno N, reduces marginalmente el input de los turnos N+1…N+k, pero el input acumulado sigue siendo el grueso de la factura. Esto es lo que Waxell llama "context cost growth ~ n(n+1)/2": el coste crece triangularmente con los turnos.
2. **El output agentic no es mayoritariamente prosa.** JetBrains lo midió directamente: código, tool calls y logs son la mayoría. Sólo la narración entre tool calls es comprimible, y no hay mucha.
3. **El caché de prompt es un multiplicador silencioso.** Si tu agente usa prompt caching (Anthropic, OpenAI, Google lo ofrecen), la mayoría del input se factura a precio de caché (10% del precio de input en Anthropic, 5-horas TTL). Cualquier herramienta que invalide el caché puede borrar el ahorro de un mes en un día. Por eso, antes de instalar una herramienta "gratis" que reescribe contexto, hay que mirar la cache hit rate.

## Mi recomendación (con datos, no con fe)

Si tuviera que elegir qué instalar mañana, el orden sería:

1. **Instala RTK.** Es lo único en este espacio que ataca el grueso de los tokens, es verificable (`rtk gain`), es open source maduro, soporta tu agente y se instala en 5 minutos. La peor cara de la moneda es "ahorro modesto" en proyectos pequeños, y eso ya es mejor que el status quo.
2. **Mide con `rtk gain --graph` durante una semana.** No te creas ni este artículo ni el README. Mira tus propios números.
3. **Cuidado con el prompt cache.** Si tu agente usa caching y notas que las sesiones con RTK activado son más caras, el culpable es la cache invalidation. Desactívalo en proyectos donde el ahorro no compense, o mide con y sin caching antes de generalizar.
4. **Caveman: úsalo si te divierte, no para ahorrar.** Si quieres respuestas más cortas y directas en Claude en chat, `npx skills add JuliusBrussee/caveman` y a correr. Si lo que quieres es bajar la factura de tu agente, no es la herramienta. **El 8,5% de JetBrains no compensa la energía mental de mantener un prompt estilo cavernícola en producción.**
5. **`caveman-compress` sí vale la pena.** Es la única pieza de Caveman que comprime input tokens (la fila 3 de la tabla: system prompt + memoria). Si tienes un `CLAUDE.md` largo, reescribirlo en caveman-speak es una de las pocas optimizaciones de input que no requiere cambiar de modelo.
6. **No combines herramientas "por si acaso".** Cada capa de compresión añade un punto donde se puede invalidar el caché o introducir un bug. RTK ya cubre la fila 1. Añadir Headroom o Caveman encima da 1-3% adicional en el mejor caso y riesgo de cache invalidation en el peor. Mide antes de apilar.
7. **Invierte en lo que de verdad mueve la aguja.** Si tu agente es caro, el ahorro real viene de: arquitectura de memoria (Mem0 documenta 4x menos de tokens y +18,7pp de accuracy con memoria jerárquica), RAG con chunking bien hecho, summarization al 70% de la ventana, y selección de modelo por tarea. Las herramientas de compresión son la guinda, no el pastel.

## Lo que nos enseña esta pequeña guerra de herramientas

RTK y Caveman son dos respuestas a la misma pregunta: ¿cómo pago menos por tokens? Representan dos filosofías:

- **RTK** dice: "El problema está en el output de las herramientas. Vamos a hacer ingeniería de software seria sobre él: parsers, heurísticas, fallback, telemetría. Si funciona, es verificable."
- **Caveman** dice: "El problema está en la prosa del modelo. Vamos a cambiar cómo habla. Es gratis, es divertido, y el número es grande."

RTK va en el camino correcto porque **ataca la causa, no el síntoma**. La causa del coste en agentes es el ruido de las herramientas en la ventana de contexto. El síntoma es la prosa verbosa del modelo. Tratar el síntoma es hacer sentir que haces algo. Tratar la causa es hacerlo de verdad.

Caveman es una moda porque **encaja con el ciclo de hype de GitHub**: idea simple, prompt pegadizo, número grande, viral en Twitter, memes, instalación trivial. Es, en el mejor de los casos, una curiosidad simpática. En el peor, una distracción que te hace creer que estás optimizando cuando el 91,5% del output agentic pasa por tu ventana de contexto sin tocarlo.

Y el benchmark de JetBrains, con 86 tareas pareadas y p=0,82, lo dice sin piedad: **el 65% de Caveman es real sólo donde no importa (chat conversacional), y un 8,5% donde sí importa (agentic)**. La inversa exacta de lo que un developer promedio asumiría al ver el README.

En 2026, la disciplina de medir (con `rtk gain`, con tu propio benchmark, con logs de Anthropic o OpenAI) vale más que cualquier skill viral. Y eso, paradójicamente, es lo que hace a RTK grande: que no te pide que te fíes.

---

## Apéndice: fuentes y datos

Todos los datos de este artículo están verificados en las siguientes fuentes (consultadas el 15 de julio de 2026):

- **RTK — repo y benchmarks**: [github.com/rtk-ai/rtk](https://github.com/rtk-ai/rtk), [rtk-ai.app](https://www.rtk-ai.app/)
- **Caveman — repo**: [github.com/JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- **JetBrains — benchmark Caveman (8,5% real)**: ["Does Speaking to Agents Like Cavemen Really Save 65% of Tokens?" — blog.jetbrains.com/ai, 6 de julio de 2026](https://blog.jetbrains.com/ai/2026/07/speak-to-ai-agents-like-cavemen-tosave-tokens/)
- **InfoWorld — cobertura del benchmark JetBrains**: ["'Talk like a caveman' prompts save tokens, but far less than promised"](https://www.infoworld.com/article/4193775/talk-like-a-caveman-prompts-save-tokens-but-far-less-than-promised.html)
- **Codepointer — replay 614M tokens**: ["Cutting LLM Token Costs with rtk, headroom, and caveman"](https://codepointer.substack.com/p/cutting-llm-token-costs-with-rtk)
- **Bent Collins / AI Code Watch — crítica a RTK y Headroom**: post en LinkedIn sobre cache invalidation
- **Waxell — coste real de la ventana de contexto**: ["AI Agent Context Window Cost: Why Bills Multiply"](https://waxell.ai/blog/ai-agent-context-window-cost)
- **Mem0 — LoCoMo benchmark 2026 (memoria vs. contexto)**: [mem0.ai/blog/context-window-is-ram-not-storage](https://mem0.ai/blog/context-window-is-ram-not-storage-why-most-agent-failures-happen-how-to-fix-them-in-2026)
- **Chroma — context rot 18 modelos (julio 2025)**: citado en ["The Context Window Trap"](https://www.rockcybermusings.com/p/the-context-window-trap-why-1m-tokens)
- **Reddit — experiencia usuario con RTK (10M tokens ahorrados)**: [reddit.com/r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1r2tt7q/i_saved_10m_tokens_89_on_my_claude_code_sessions/)
- **Pachaar — RTK en repos grandes (73% ahorro en VS Code)**: post en LinkedIn de Akshay Pachaar
- **YouTube — benchmark combinado RTK + caveman (38%)**: ["Cut your LLM token bill in half with these 2 simple tricks"](https://www.youtube.com/watch?v=R1na--yxl1s)

> **Nota sobre cifras:** Los benchmarks de RTK en su README son estimaciones sobre proyectos medios TypeScript/Rust; los números exactos en tu sesión pueden variar. La métrica definitiva en cualquier caso es `rtk gain` corriendo en tu propio workload. El benchmark de JetBrains (8,5% Caveman) usa 86 tareas pareadas en SkillsBench sobre Claude Code con la skill forzada; en uso real, el ahorro es igual o inferior. El replay de codepointer cubre 614M tokens y $926 de gasto en sesiones reales. Las estrellas de GitHub se consultaron el 15 de julio de 2026: RTK 71.209, Caveman 89.826.
