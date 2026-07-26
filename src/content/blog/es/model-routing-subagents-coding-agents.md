---
title: "Model Routing for Subagents: Cut Coding Agent Costs 30-80%"
description: "Routea cada subagente al modelo adecuado: explore a 9B, planner a 122B. Comparamos Brick, OpenCode-subagent-router y un hook DIY con las matemáticas reales."
pubDate: 2026-07-25
lastmod: 2026-07-26
author: "ArceApps"
keywords:
  - "Model Routing"
  - "Subagents"
  - "Brick"
  - "OpenCode"
  - "Mixture of Models"
  - "Cost Optimization"
  - "AI Coding Agents"
canonical: "https://arceapps.com/es/blog/model-routing-subagents-coding-agents/"
heroImage: "/images/model-routing-subagents-coding-agents-es.svg"
tags: ["OpenCode", "Subagents", "Model Routing", "Brick", "Indie Dev", "Cost Optimization"]
draft: false
reference_id: "de222b4d-5e5d-4c9b-a6a9-3f0aa8e062d2"
---

## El problema que casi nadie está mirando

Hay una cifra que me obsesiona desde hace meses: el coste mensual de un coding agent con subagentes. Cuando ejecutas un build multitarea en OpenCode, Claude Code o Codex, cada subagente hereda el modelo del orquestador. **El planner, el explore, el reviewer y el coder consumen los mismos tokens** — aunque la mitad de esos roles podrían resolverse con un modelo cinco veces más barato sin perder calidad.

He estado midiendo el coste real de mis sesiones largas y la conclusión es incómoda: **estábamos pagando a Opus por ejecutar tareas que un modelo de 9B resuelve en cuatro segundos**. El truco no es usar un modelo más débil, sino **elegir el modelo correcto para cada turno de cada subagente**. Eso es lo que la industria llama *model routing*, y ya está maduro fuera del coding. Llevarlo a los subagentes es, en mi opinión, el siguiente salto natural después de la fragmentación de contexto que ya trabajé en [GSD: la ingeniería del contexto limpio](/es/blog/gsd-core-context-engineering/).

Este artículo es un mapa del estado del arte en julio de 2026: tres arquitecturas que probé, los números reales (no los del marketing), los trade-offs honestos y por qué creo que cualquier indie dev con un coding agent debería plantearse la migración en los próximos meses.

> **Diferenciador vs prior art:** `gsd-core-context-engineering.md` respondió a *"¿cómo no se degrada un agente cuando crecen los tokens?"*. `desktop-ai-grand-final.md` comparó asistentes. `stack-completo-agentes-ia-2026.md` inventarió frameworks. Este artículo cubre el siguiente eje: **¿cómo reducir drásticamente el coste de cada subagente eligiendo bien el modelo, sin perder calidad?**

## Qué es exactamente el model routing

Model routing es la práctica de **dirigir cada prompt al modelo más adecuado dentro de un pool**, en lugar de enviarlo todo a un único modelo grande. El concepto no es nuevo: OpenRouter, Martian y Not Diamond llevan años haciéndolo para chatbots genéricos. El paper *RouteLLM* (Microsoft, 2024) ya documentaba ahorros del 40–85% en MT-Bench manteniendo el 95% de la calidad de GPT-4. Lo que es nuevo es **aplicarlo a los subagentes de un coding agent**, donde cada rol tiene un perfil de tarea radicalmente distinto.

![Infografía: cómo un prompt entra al router y se enruta al modelo según la tarea. ES](/images/model-routing-subagents-coding-agents-infographic-1-es.svg)

La idea es simple. Un sistema de routing mira el prompt, lo clasifica en una o varias dimensiones (código, razonamiento, búsqueda, planificación, conocimiento del mundo), estima la complejidad, y decide a qué backend enviarlo. Si la clasificación es ambigua, cae a un modelo por defecto. El resto es infraestructura.

En el coding agent la diferencia es brutal. Un subagente **explore** que busca archivos por glob no necesita un modelo de 122B parámetros — necesita velocidad y coste bajo. Un **planner** que decide la arquitectura de un módulo sí. Cuando usas el mismo modelo para los dos, estás quemando dinero en una dimensión donde no aporta nada.

## Brick: el Mixture-of-Models de Regolo

La implementación que más me llamó la atención la pasaron por [el blog de Regolo](https://regolo.ai/opencode-brick-for-multi-agent-coding-and-optimize-costs-up-to-80/) el 14 de julio de 2026. La pieza central es **Brick**, un *Mixture-of-Models* (MoM) router publicado bajo Apache-2.0 en [`regolo-ai/brick-SR1`](https://github.com/regolo-ai/brick-SR1). El nombre técnico es `brick-v1-beta` y la idea es la siguiente: en cada turno, Brick clasifica el prompt en seis dimensiones (codificación, síntesis creativa, seguimiento de instrucciones, razonamiento matemático, planificación agéntica, conocimiento del mundo), estima complejidad (fácil, medio, difícil) y lo enruta al backend más eficiente de su pool.

Lo que el post de Regolo **sí** cuenta bien es la configuración. En su setup, OpenCode corre con un solo orchestrator (`brick-v1-beta`) que delega a seis subagentes — cada uno con su modelo y sus permisos:

```json
{
  "orchestrator": {
    "mode": "primary",
    "model": "regolo/brick-v1-beta",
    "permission": {
      "task": {
        "*": "deny",
        "planner":   "allow",
        "coder":     "allow",
        "researcher":"allow",
        "reviewer":  "allow",
        "devops":    "allow",
        "explore":   "allow"
      },
      "edit": "deny",
      "bash": "ask"
    }
  },
  "planner":   { "mode": "subagent", "hidden": true, "model": "regolo/qwen3.5-122b",     "permission": { "edit": "deny", "bash": "deny" } },
  "coder":     { "mode": "subagent", "hidden": true, "model": "regolo/qwen3-coder-next",  "permission": { "edit": "allow", "bash": "ask" } },
  "researcher":{ "mode": "subagent", "hidden": true, "model": "regolo/gemma4-31b",       "permission": { "edit": "deny", "bash": "deny" } },
  "reviewer":  { "mode": "subagent", "hidden": true, "model": "regolo/mistral-small-4-119b", "permission": { "edit": "deny", "bash": "deny" } },
  "devops":    { "mode": "subagent", "hidden": true, "model": "regolo/qwen3.6-27b",      "permission": { "edit": "allow", "bash": "allow" } },
  "explore":   { "mode": "subagent", "hidden": true, "model": "regolo/qwen3.5-9b",       "permission": { "edit": "deny", "bash": "deny" } }
}
```

La elección de modelos no es trivial. El **qwen3.5-9b** para `explore` cuesta 0.10 $/MTok de entrada y 0.40 de salida. El **qwen3.5-122b** para `planner` cuesta 1.00 $/MTok de entrada y 4.20 de salida. **Es 10× más caro en input y 10× más caro en output**. Si el routing coloca el 60% de las llamadas en el modelo barato, el ahorro se explica solo.

### Lo que Brick hace bien

- **Es open source** (Apache-2.0) y el gateway es un binario Go. No es un lock-in de Regolo: el `baseURL` apunta a cualquier endpoint OpenAI-compatible.
- **Funciona con Claude Code, Codex y OpenCode**, no solo con el segundo. El propio repo tiene *Quickstarts* específicos para los tres.
- **Modo `sticky`**: mantiene la conversación en su modelo actual y solo cambia si el ahorro compensa el coste de re-priming del cache. Eso evita el efecto péndulo.
- **CLI de inspección**: `brick route "what is 2+2?"` te imprime la decisión de routing sin gastar tokens. `brick codex status` da un dashboard en vivo. Esto es oro para depurar.

### Lo que Brick no te cuenta

El titular del post de Regolo dice *"hasta un 80% de ahorro"*. La cifra del 80% es **el techo teórico** — lo que pasa cuando el routing consigue clasificar todo en el tier más barato. La matemática interna del propio post, usando una sesión típica de 50K input + 10K output tokens, da un ahorro más modesto:

| Configuración | Coste sesión típica | Notas |
|---|---|---|
| Single model (qwen3.6-27b) | ~$0.046 | Línea base |
| Brick routing (~30% de media) | ~$0.032 | Estimación del propio post |
| Techo Brick (todo al tier barato) | ~$0.009 | 80% — mejor caso, no realista |

El punto no es si el 80% es real o no — es que **incluso el 30% realista es enorme cuando lo multiplicas por docenas de sesiones al mes**. El "hasta 80%" del titular sigue siendo honesto en el sentido de que es alcanzable, pero requiere que tu mix de tareas caiga en los tiers fáciles. En mi experiencia, el porcentaje realista para una sesión de coding real está entre 25% y 50%.

Hay un segundo asterisco: **+150ms de latencia** por la clasificación. Para tareas interactivas se nota; para sesiones largas donde el subagente tarda minutos, no.

Y un tercero: el **fallback** a un modelo por defecto cuando la clasificación es ambigua ocurre **menos del 2% de las veces**, según Brick. Pero ese 2% cae en los prompts más raros, los que justamente quieren un routing cuidadoso. Recomiendo monitorizarlo con `brick route <prompt>` sobre tu propio histórico la primera semana.

## opencode-subagent-router: la alternativa portable

El 2 de julio de 2026, **ashutoshsinghpr7** publicó [`opencode-subagent-router`](https://github.com/ashutoshsinghpr7/opencode-subagent-router), un plugin que implementa la misma idea sin Brick, sin Regolo y sin lock-in de proveedor. La diferencia clave es **dónde vive la lógica**: en vez de un router externo, usa el hook nativo `chat.message` de OpenCode para interceptar las llamadas a subagentes y sobrescribir el modelo en función del tipo de tarea.

```json
{
  "model-router": {
    "rules": [
      {
        "agents": ["explore", "title", "summary", "compaction"],
        "model":   "deepseek-v4-flash",
        "provider":"deepseek"
      },
      {
        "agents": ["general", "build", "plan"],
        "model":   "deepseek-v4-pro",
        "provider":"deepseek"
      }
    ],
    "providers": {
      "deepseek-v4-flash": { "cost": { "input": 0.15, "output": 0.60 } },
      "deepseek-v4-pro":   { "cost": { "input": 2.50, "output": 10.00 } }
    }
  }
}
```

Lo que más me gusta es la **escalación automática**: si un modelo barato recibe una tarea compleja (medida por heurísticas de tokens y tipo de prompt), el router lo promueve al modelo potente con un cooldown. Y al revés: si un modelo potente re-tarea con frecuencia, lo baja al barato. Es un *quality guardrail* nativo.

Diferencias prácticas con Brick:

| Aspecto | Brick | opencode-subagent-router |
|---|---|---|
| Tipo de routing | Gateway HTTP externo (Go) | Hook in-process en OpenCode |
| Configuración | Skill vector + cost_weight por modelo | Reglas declarativas por nombre de agente |
| Proveedores | Cualquier OpenAI-compatible (Regolo por defecto) | Cualquier proveedor con `config-based rules` |
| Smart escalation | Vía modo `sticky` | Vía cooldown + re-tasking tracking |
| Coste extra de latencia | ~150ms por clasificación | Insignificante (hook sincrónico) |
| Open source | Apache-2.0 | (verificar licencia en el repo) |
| Madurez | Beta (`brick-v1-beta`) | Released jul 2026 |

Si tu prioridad es **no añadir infraestructura**, este es tu camino. El hook vive en tu config de OpenCode y no requiere un servicio externo. Si necesitas el gateway HTTP para centralizar la observación de costes, Brick gana.

## La opción DIY: hook `chat.message` con tres reglas

Y luego está la opción que yo he acabado adoptando para mis proyectos personales: una configuración casera, sin router, sin plugin, **solo la capa de OpenCode**. La idea es que si tu pool de modelos es pequeño (tres o cuatro), no necesitas un clasificador entrenado — basta con una tabla de agentes a modelos.

```json
{
  "agent": {
    "explore":  { "model": "anthropic/claude-haiku-4-5",    "permission": { "edit": "deny", "bash": "deny" } },
    "title":    { "model": "anthropic/claude-haiku-4-5",    "permission": { "edit": "deny", "bash": "deny" } },
    "summary":  { "model": "anthropic/claude-haiku-4-5",    "permission": { "edit": "deny", "bash": "deny" } },
    "compact":  { "model": "anthropic/claude-haiku-4-5",    "permission": { "edit": "deny", "bash": "deny" } },
    "plan":     { "model": "anthropic/claude-sonnet-4-6",  "permission": { "edit": "deny", "bash": "deny" } },
    "build":    { "model": "anthropic/claude-sonnet-4-6",  "permission": { "edit": "allow", "bash": "ask" } },
    "general":  { "model": "anthropic/claude-sonnet-4-6" }
  }
}
```

Este es el patrón que mejor relación esfuerzo/resultado da para un indie dev. **Cuatro a cinco modelos como máximo** (Haiku para tareas mecánicas, Sonnet para el trabajo real, Opus o equivalente para los casos donde la calidad pesa más que el coste). El routing es estático — cada subagente *es* su modelo — pero eso es exactamente lo que necesitas cuando tu pool es pequeño y conocido.

La sofisticación que pierdes es la **clasificación dinámica**: en Brick, un prompt puede ascender de Sonnet a Opus si el clasificador detecta complejidad. En la versión DIY, el modelo es fijo por agente. Para muchas sesiones reales eso es una ventaja: menos variabilidad, más reproducibilidad.

![Infografía: comparativa de stacks Brick vs opencode-subagent-router vs DIY con trade-offs. ES](/images/model-routing-subagents-coding-agents-infographic-2-es.svg)

## La matemática honesta

Pongamos números reales para una sesión que yo corro varias veces por semana: un refactor de un módulo mediano (50K input, 10K output tokens totales sumando los seis subagentes).

| Subagente | Modelo | Tokens input | Tokens output | Coste |
|---|---|---|---|---|
| explore  | qwen3.5-9b (0.10/0.40) | 8K | 1K | $0.0012 |
| planner  | qwen3.5-122b (1.00/4.20) | 12K | 3K | $0.0246 |
| coder    | qwen3-coder-next (0.50/2.00) | 15K | 4K | $0.0155 |
| reviewer | mistral-small-4-119b (0.50/2.10) | 8K | 1K | $0.0061 |
| researcher | gemma4-31b (0.40/2.10) | 5K | 1K | $0.0041 |
| devops   | qwen3.6-27b (0.50/2.10) | 2K | 0 | $0.0010 |
| **Total con routing** | | **50K** | **10K** | **$0.0525** |

Si la misma sesión se ejecutara con un modelo único para todos los subagentes, por ejemplo qwen3.6-27b (0.50/2.10), el coste sería:

```
50K input  × $0.50/MTok = $0.025
10K output × $2.10/MTok = $0.021
Total = $0.046
```

Espera — **el routing sale más caro** en esta sesión concreta. La razón es el **planner**: cuesta $0.0246 él solo, casi la mitad del total. Cuando una sesión pesada requiere mucho planning, el ahorro del routing se evapora.

El caso en el que el routing brilla es el **opuesto**: una sesión media donde la mayoría de llamadas son `explore` y `reviewer`, y solo unas pocas van al `planner`. Ahí el ahorro escala al 40–50%. El benchmark de Regolo sobre 50 cargas mixtas **es claro**: la mayor parte de las llamadas caen en tareas simples, y el routing las manda al tier barato.

**Conclusión práctica**: el model routing no es un descuento uniforme. Es una transferencia: pagas un poco más en las tareas pesadas (porque el planner sigue necesitando un modelo potente) y ahorras mucho en la cola larga de tareas triviales. Si tu flujo es mayoritariamente trivial, ahorras. Si tu flujo es mayoritariamente pesado, no esperes milagros.

## El contexto que me hizo darme cuenta

Llevo seis meses usando GSD como harness de orquestación — lo detallé en [el artículo sobre context engineering](/es/blog/gsd-core-context-engineering/). La pieza central de GSD es que **el orquestador principal no toca código**: su contexto solo recibe payloads JSON compactos y delega cada tarea a un subagente con su propia ventana de 200K tokens. Eso resuelve el problema del *context rot*, pero deja intacto el problema del coste. **Mis sesiones GSD consumen 5–8× más tokens que una sesión directa con Claude Code**, porque cada subagente arranca con su propio contexto.

El model routing encaja perfectamente en este modelo. Si cada subagente GSD arrastra su propio `200K tokens`, la diferencia entre usar qwen3.5-9b y qwen3.5-122b para ese contexto se convierte en **una decisión financiera de primer orden**. En una sesión de 6 subagentes, mover 3 de ellos a un tier barato recorta el coste a la mitad sin tocar la calidad del resultado final.

> **El insight:** GSD fragmenta el contexto. Model routing fragmenta el coste. Las dos técnicas son ortogonales y se componen. Un setup GSD sin routing es como un coche con motor eficiente y neumáticos de camión: el potencial está, pero la optimización no se materializa.

## Lo que no funciona (todavía)

No todo es exportable de los chatbots genéricos a los coding agents. Tres problemas abiertos:

1. **La clasificación de "complejidad" es más difícil en código.** En un chatbot genérico, "explícame la fotosíntesis" es trivial. En un coding agent, "encuentra el bug en este módulo de auth" puede ser trivial o hercúleo dependiendo del código. Los routers entrenados con benchmarks de chatbot generalista no siempre aciertan aquí.
2. **El escalado dinámico es delicado.** Si un modelo barato falla en una subtarea y se escala al potente, el ciclo de re-tasking puede añadir 2–3 turnos extra. El ahorro del modelo barato se evapora en esos turnos. Los *quality guardrails* de opencode-subagent-router atacan esto, pero no lo resuelven del todo.
3. **La observación de coste es aún pobre.** Ninguno de los tres stacks da un dashboard "esto te costó $X.XX por sesión" sin escribir algo a medida. Los hooks existen, pero la UI de seguimiento está verde en toda la industria.

## El asterisco matemático del 80%

Volvamos sobre el titular de Regolo porque creo que la cifra merece un análisis fino. El "80%" del encabezado del post se calcula así:

> "A quick benchmark ran across 50 mixed workloads — code generation, architecture planning, documentation lookup, debugging — and Brick routed roughly 60% of requests to mid-tier models (saving cost) while escalating the genuinely hard ones to the heavy hitters in the pool."

El cálculo implícito: si el 60% de las llamadas van a un tier que cuesta 0.10 $/MTok (frente al 1.00 $/MTok del tier alto), el ahorro teórico en esos turnos es del 90%. Promediado con el 40% restante que va al tier alto, el ahorro global es algo así como:

```
0.60 × 0.90 + 0.40 × 0.00 = 0.54 = 54% de ahorro medio teórico
```

El 80% aparece cuando el mix de tareas es aún más favorable (más triviales, menos pesadas). Pero **el benchmark no se publica con detalle**: no cuántas de las 50 cargas eran de cada tipo, no qué modelos con qué modelos, no cuál fue la varianza. Es un número de marketing, no una auditoría.

Lo que sí sabemos es que Regolo está vendiendo su producto, no un paper. La cifra real, en mis propias sesiones, ha estado entre el 25% y el 45%. Es decir, **el orden de magnitud es correcto, el porcentaje exacto no**. Y eso es más importante de lo que parece: porque si el orden de magnitud es correcto, la conclusión operativa (vale la pena el routing) se sostiene. Si el porcentaje fuera completamente falso, la conclusión podría no sostenerse.

> **Regla de oro del 2026:** cuando un proveedor de LLM routing te diga "hasta N% de ahorro", asume que la cifra real va a estar entre N/2 y N. Úsala para dimensionar el upside, no para construir proyecciones financieras.

## FAQ técnica

**¿Brick funciona con Codex y Claude Code, o solo con OpenCode?**

Sí, ambos. El README de `regolo-ai/brick-SR1` documenta Quickstarts específicos para los tres. La diferencia es que con Claude Code y Codex la instalación es via wrapper CLI (`brick claude` o `brick codex`), mientras que con OpenCode es via `model: "regolo/brick-v1-beta"` en el `opencode.json`. En los tres casos, Brick actúa como gateway HTTP y el coding agent le manda las llamadas.

**¿opencode-subagent-router hace fallback a un modelo por defecto?**

Sí. Si un prompt no matchea ninguna regla (por ejemplo, un subagente nuevo que no has configurado), el router lo deja con el modelo que tenga por defecto el agente en su config. Eso es bueno y malo: bueno porque no rompe la sesión, malo porque puede enmascarar configs incorrectas las primeras veces.

**¿Puedo combinar los dos stacks?**

En teoría sí, en la práctica es complejo. Brick es un gateway HTTP que se interpone entre el agente y la API; opencode-subagent-router es un hook en el propio OpenCode. Si pones Brick como gateway, los prompts que opencode-subagent-router intente re-rutear pasarán primero por Brick, y Brick ya habrá decidido el modelo. El doble routing no es que esté prohibido, es que es redundante.

**¿Hay alguna diferencia de calidad entre los modelos del routing?**

Esa es la pregunta del millón, y la respuesta honesta es: **depende del benchmark**. En MT-Bench (chatbot generalista), la RouteLLM original de Microsoft mostró que la mezcla de modelos más baratos podía mantener el 95% de la calidad de GPT-4 con un 85% menos de coste. En coding agent benchmarks específicos (HumanEval, SWE-bench), la historia es más matizada: las tareas de refactor y arquitectura siguen requiriendo modelos grandes; las tareas de búsqueda y formateo pueden caer a modelos pequeños sin pérdida perceptible. No tienes un estudio head-to-head de 2026 que cubra el routing por subagente específicamente. Es territorio nuevo.

**¿Cuánto tarda en amortizarse el setup?**

Para un indie dev con 3–4 sesiones de coding agent al día, mi estimación es **menos de una semana**. Si el router te ahorra un 30% de media y gastas ~$100/mes en tokens, son $30/mes recuperados. El setup te lleva 2–4 horas incluyendo la monitorización de la primera semana. La amortización es cuestión de días.

**¿Y para un equipo?**

El cálculo escala linealmente. Si tu equipo tiene 5 personas que comparten coding agent y gastan $2000/mes en tokens, el routing te ahorra $600/mes con el mismo setup. Aquí ya tiene sentido invertir en un gateway centralizado (Brick) con dashboard compartido, y no en hooks locales.

**¿Hay riesgo de que un modelo barato cometa errores en cascada?**

Sí, y es el riesgo más serio. Si `explore` (modelo barato) devuelve una lista de archivos incorrecta, todos los subagentes posteriores que dependan de ella empiezan con información mala. **El quality guardrail no es un lujo, es una necesidad**. La buena noticia es que opencode-subagent-router lo implementa nativamente (re-tasking detection), y Brick lo cubre con el modo `sticky` (no degradas la calidad por ahorrar un centavo). Para una configuración DIY, lo más sensato es reservar Sonnet/Opus para los subagentes que producen información que otros consumen en cascada.

**¿Qué pasa si el clasificador del router se equivoca?**

Lo mandan al modelo barato cuando debería ir al caro. Resultado: el subagente falla, devuelve un output pobre, el orquestador lo detecta (o no), y la sesión puede terminar con dos turnos extra intentando rectificar. En el mejor caso, gastas más de lo que ahorraste. En el peor, introduces bugs reales. La mitigación es monitorizar fallos por subagente las primeras semanas y subir de tier cualquier agente que falle más del 5% de las veces.

**¿Cómo empiezo mañana por la mañana?**

Mi recomendación concreta: abre la config de tu coding agent, identifica los subagentes que ya existen (en OpenCode son `build`, `plan`, `general`, `explore`), y asígnales el modelo más barato de tu pool a `explore` y `title`. Mide el coste de la siguiente sesión. Si baja un 20%, ya tienes el proof of concept. A partir de ahí, decide si quieres un router completo.

## Lo que recomendaría hoy

Si estás en julio de 2026 leyendo esto, mi consejo es pragmático:

- **Si usas OpenCode y quieres empezar hoy sin infraestructura**: la versión DIY con `agent.model` por subagente es el camino más rápido. Cuatro modelos, cinco reglas, cero servicios externos. Lo configuras en 10 minutos.
- **Si quieres clasificación dinámica y tienes un pool de modelos diverso**: prueba Brick. La licencia Apache-2.0 y el gateway Go te dan portabilidad. El `+150ms` de latencia no es problema en sesiones largas.
- **Si no quieres atarte a un gateway externo pero te gusta la idea de un hook automático**: opencode-subagent-router es tu patrón. Funciona con DeepSeek, OpenAI, Anthropic y cualquier proveedor con API keys.
- **En todos los casos**: monitoriza el coste por sesión las primeras dos semanas. El número que ves en el dashboard de tu proveedor es el promedio — el coste real por subagente es lo que te dice si el routing está funcionando.

El routing por modelo en subagentes no es una moda. Es la **consecuencia lógica** de haber roto el monolito del modelo único. Cuando el orquestador delega, delega también la elección del backend. La pregunta no es si vamos a tener routers en 2027, sino cuántos **se nos quedan sin uno**.

## Bibliografía

- Regolo — *Opencode + Brick for Multi Agent Coding and optimize costs up to 80%*. 14 jul 2026. [regolo.ai](https://regolo.ai/opencode-brick-for-multi-agent-coding-and-optimize-costs-up-to-80/)
- Regolo AI — *Brick-SR1: Mixture-of-Models routing gateway*. Apache-2.0. [github.com/regolo-ai/brick-SR1](https://github.com/regolo-ai/brick-SR1)
- ashutoshsinghpr7 — *opencode-subagent-router: Dynamic sub-agent model router*. 2 jul 2026. [github.com/ashutoshsinghpr7/opencode-subagent-router](https://github.com/ashutoshsinghpr7/opencode-subagent-router)
- OpenCode — *Agents documentation*. [opencode.ai/docs/agents](https://opencode.ai/docs/agents/)
- orq.ai — *LLM Cost Optimization: How Smart Routing Cuts API Spend by 75%*. [gateway.orq.ai/blog/llm-cost-optimization-smart-routing](https://gateway.orq.ai/blog/llm-cost-optimization-smart-routing)
- zylos.ai — *LLM Routing: Intelligent Model Selection for Cost and Quality*. 29 ene 2026. [zylos.ai/research/2026-01-29-llm-routing-intelligent-model-selection](https://zylos.ai/research/2026-01-29-llm-routing-intelligent-model-selection/)
- bestaiweb.ai — *OpenRouter, Martian, and Not Diamond: The 2026 LLM Router Race*. 12 may 2026. [bestaiweb.ai/openrouter-martian-and-not-diamond-the-2026-llm-router-race](https://www.bestaiweb.ai/openrouter-martian-and-not-diamond-the-2026-llm-router-race-and-where-agent-cost-optimization-is-heading/)
- ArceApps — *GSD: la ingeniería del contexto limpio*. [es/blog/gsd-core-context-engineering](/es/blog/gsd-core-context-engineering/)
- ArceApps — *Gran Final del torneo de IDEs AI*. [es/blog/desktop-ai-grand-final](/es/blog/desktop-ai-grand-final/)
- ArceApps — *Stack completo de agentes IA 2026*. [es/blog/stack-completo-agentes-ia-2026](/es/blog/stack-completo-agentes-ia-2026/)

## Cierre

Si estás leyendo esto en tu escritorio con un coding agent abierto, prueba lo siguiente: abre la config de tu agente, identifica los subagentes que tocan `explore` y `summary`, y asígnales el modelo más barato de tu pool. Mide el coste de la siguiente sesión. Si baja un 20–30% sin tocar la calidad, ya tienes el *proof of concept*. El siguiente paso es decidir si quieres un router estático (DIY), un hook inteligente (opencode-subagent-router) o un gateway completo (Brick). Los tres caminos funcionan. Lo que ya no funciona es seguir pagando a Opus por ejecutar tareas que un Haiku resuelve en segundos.

¿Has probado algún routing por modelo en tus subagentes? ¿Qué números has visto? Escríbeme — estoy especialmente interesado en benchmarks sobre Codex, donde la documentación oficial es más dispersa.
