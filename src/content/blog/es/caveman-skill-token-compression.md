---
title: "Caveman: el skill viral que silencia a tus agentes AI"
description: "Caveman es el skill viral de JuliusBrussee que enseña a los agentes AI a hablar como cavernícolas. Analizo qué ahorra de verdad y cuándo NO usarlo."
pubDate: 2026-06-20
lastmod: 2026-06-20
author: ArceApps
keywords:
  - "Caveman"
  - "AI Agents"
  - "Tokens"
  - "Skill"
  - "Compresión"
  - "Claude Code"
canonical: "https://arceapps.com/es/blog/caveman-skill-token-compression/"
heroImage: "/images/caveman-skill-token-compression.svg"
tags: ["AI Agents", "Skills", "Tokens", "Caveman", "Claude Code", "Compresión", "Indie"]
category: ai-agents
reference_id: "f9e0f666-5787-498c-8c04-c1f9531b88d5"
---


> **Lecturas relacionadas en el blog:** [Ponytail: el skill viral que enseña a tus agentes a ser seniors perezosos](/blog/ponytail-skill-senior-perezoso) · [Matt Pocock Skills: la navaja suiza de los skills pequeños](/blog/mattpocock-skills) · [AI Agents Coding: de Copilot a agentes autónomos](/blog/ai-agents-coding) · [Effective Context for AI: Prompt Engineering](/blog/effective-context-ai)

## "Brain still big. Mouth small."

A finales de 2025 alguien publicó en r/LocalLLaMA un hilo titulado *"Make your AI talk like a caveman and decrease token usage"*. Consiguió 651 upvotes y 142 comentarios en una semana. La idea era tan absurda que parecía un meme: quítale al LLM los artículos, los conectores, las muletillas y las cortesías. Enséñale a hablar como un cavernícola. Verás cómo cada respuesta transporta la misma sustancia técnica con muchos menos tokens.

El instinto tenía razón. Los LLMs son absurdamente buenos rellenando gramática predecible. Si le das el contexto y la intención, reconstruyen "el", "un", "por lo tanto" y "estaría encantado de ayudarte" sin pestañear. Eliminar esa carga no pierde información — pierde ruido. Y el ruido, en un agente que gasta cinco dólares la hora, es dinero ardiendo.

Once meses después, ese meme se llama **[caveman](https://github.com/JuliusBrussee/caveman)**. Es un único archivo `SKILL.md` que se instala en Claude Code, Codex, OpenCode, Cursor, Windsurf, Cline, GitHub Copilot y otros treinta y tantos agentes. Tiene **75.100 estrellas**, **4.200 forks**, licencia MIT, y un ecosistema de cinco repos hermanos que cubren desde compresión de prosa hasta un agente de terminal completo y un modelo fine-tune. El tagline sigue siendo el mismo: *"Brain still big. Mouth small."* Y su claim principal: **~75% menos output tokens**.

Suena demasiado bien. Vamos a abrirlo.

## El contexto: por qué los agentes queman tokens hablando

Si llevas meses programando con Claude Code, Codex o Cursor ya conoces la escena. Le pides al agente un validador de email y recibes una clase de 27 líneas envuelta en tres párrafos de cortesía. Pides un contador y te montan un *dashboard*. Pides una caché y te construyen una arquitectura con TTL, eviction policy y tests de concurrencia. Tú querías `lru_cache`. Te han dado un *whitepaper*.

No es un bug. Es el comportamiento por defecto de los modelos entrenados para complacer. Ya lo analizamos en [AI Agents Coding: de Copilot a agentes autónomos](/blog/ai-agents-coding): la diferencia entre sugerir y actuar cambió el rol del desarrollador, pero también disparó la cantidad de tokens que se queman por interacción. Cada prompt dispara un sesgo de "más completo es mejor" que el modelo difícilmente va a corregir solo.

Y luego está el problema del **context drift**. Tú pegaste "sé conciso" al inicio de la sesión. El agente lo respetó los primeros tres turnos. En el octavo, ya está rellenando otra vez con "I'd be happy to help" porque la instrucción original quedó enterrada bajo cuarenta mil tokens de contexto. Los one-shots no sobreviven a sesiones largas. Y eso, en plan Pro/Max/20x donde cada sesión cuesta dólares, duele.

> **Nota de honestidad:** toda la información técnica de este artículo está verificada con la API de GitHub y los archivos raw del repositorio a fecha 21 de junio de 2026. Las cifras cambian rápido (varios cientos de estrellas al día); lo que no cambia es la mecánica del skill, los benchmarks publicados y las críticas que cito. Donde dude, lo diré.

## Qué es caveman exactamente

Caveman es un *skill*, no una librería ni un framework. Es un archivo `SKILL.md` que define reglas de estilo para la prosa del agente. Las reglas, en su forma más simple, son estas:

```markdown
Respond terse like smart caveman. All technical substance stay.
Only fluff die.

Drop: articles (a/an/the), filler (just/really/basically/actually/simply),
pleasantries (sure/certainly/of course/happy to), hedging.
Fragments OK. Code blocks unchanged. Errors quoted exact.

Pattern: `[thing] [action] [reason]. [next step].`
```

Eso es el núcleo. El skill tiene seis niveles de intensidad que se activan con el comando `/caveman [nivel]`:

| Nivel | Comportamiento | Ejemplo |
|---|---|---|
| `lite` | Sin muletillas, frases completas | "Your component re-renders because you create a new object reference each render. Wrap it in `useMemo`." |
| `full` (default) | Fragmentos OK, sin artículos | "New object ref each render. Inline object prop = new ref = re-render. Wrap in `useMemo`." |
| `ultra` | Abreviaciones con flechas | "Inline obj prop → new ref → re-render. `useMemo`." |
| `wenyan-lite` | Chino clásico, frases completas | "組件頻重繪，以每繪新生對象參照故。以 useMemo 包之。" |
| `wenyan-full` | Chino clásico, fragmentos | "每繪新生對象參照，故重繪；以 useMemo 包之則免。" |
| `wenyan-ultra` | Chino clásico, ultra-corto | "新參照→重繪。useMemo Wrap。" |

Lo que NO cambia: código, paths, errores exactos, identificadores, comandos CLI, mensajes de commit, nombres de API. Caveman aprieta la prosa, no el contenido técnico. Es exactamente lo que promete su tagline: el cerebro se queda grande, solo encoge la boca.

El ejemplo clásico, extraído literalmente del `SKILL.md`, es este:

> **Antes (default):** "Sure! I'd be happy to help you with that. The issue you're experiencing is most likely caused by your authentication middleware not properly validating the token expiry. Let me take a look and suggest a fix."
>
> **Después (caveman):** "Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:"

Misma información. Once líneas menos. Y el modelo sigue entendiendo todo perfectamente porque el contexto técnico (auth middleware, token expiry, `<` vs `<=`) está intacto.

## La innovación técnica real: hooks, no prompts

Lo que la mayoría de artículos no cuentan es lo que hace a caveman **verdaderamente** interesante. El `SKILL.md` por sí mismo es solo un prompt. Cualquiera puede escribir "responde como cavernícola" en su `CLAUDE.md`. La diferencia es que caveman instala un **hook persistente** que se re-inyecta cada turno.

En Claude Code, el plugin vive en `.claude-plugin/` y registra dos hooks:

1. `SessionStart`: lee el `SKILL.md` y lo inyecta como system prompt oculto en el primer turno.
2. `UserPromptSubmit`: re-inyecta una versión corta del sistema cada vez que envías un mensaje.

El segundo es la clave. Cuando la conversación crece y la compactación empieza a borrar las instrucciones originales, caveman las re-asegura en cada turno. El context drift que sufre un one-shot pegado al inicio se acabó. El agente **nunca olvida** que tiene que hablar corto porque el recordatorio le llega con cada prompt.

El código del hook, simplificado, es esto:

```javascript
// src/hooks/caveman-mode-tracker.js (resumido)
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: "CAVEMAN MODE ACTIVE (" + activeMode + "). " +
      "Drop articles/filler/pleasantries/hedging. Fragments OK. " +
      "Code/commits/security: write normal."
  }
}));
```

Esa es la innovación. No es un prompt mejor. Es un **mecanismo de persistencia**. Y eso es lo que un usuario de r/ClaudeCode ([zvoque_](https://old.reddit.com/r/ClaudeCode/comments/1u7grb0/)) identificó claramente: *"The trick isn't a better prompt. It's a hook. caveman re-injects its instruction on every turn, so there's nothing to drift away from, it gets reasserted each message. That's the part a plain prompt can't do."*

## El ecosistema: cinco rocas, una filosofía

Caveman no vive solo. JuliusBrussee ha empaquetado la misma filosofía en cinco repos que forman un stack coherente:

| Repo | Función | Estrellas |
|---|---|---|
| [caveman](https://github.com/JuliusBrussee/caveman) | Skill de compresión de prosa (este artículo) | 75.1k |
| [caveman-code](https://github.com/JuliusBrussee/caveman-code) | Agente de terminal completo con 4 capas de compresión simultáneas | 557 |
| [cavemem](https://github.com/JuliusBrussee/cavemem) | Memoria persistente cross-agent con gramática caveman | 552 |
| [cavekit](https://github.com/JuliusBrussee/cavekit) | Loop de build spec-driven minimalista | 1k |
| [finetune-caveman](https://github.com/JuliusBrussee/finetune-caveman) | Fine-tune de Gemma 4 31B con QLoRA, entrenado por ~$5 | 57 |

Y antes de Julius, **[wilpel/caveman-compression](https://github.com/wilpel/caveman-compression)** ya había sentado las bases: una librería Python con tres backends (spaCy, RoBERTa, OpenAI) que comprimía textos para RAG. La diferencia es que wilpel lo dejó como herramienta offline; Julius lo metió dentro del agente.

En el nicho más amplio, caveman se entiende mejor junto a [rtk](https://github.com/rtk-ai/rtk) (64.2k estrellas, wrapper CLI que intercepta comandos y compacta stdout) y [headroom](https://github.com/chopratejas/headroom) (41.8k estrellas, proxy API que comprime el contexto antes de llegar al LLM). Los tres forman lo que la comunidad llama "la trinidad de la compresión de tokens": caveman para output, rtk para tool output, headroom para input.

## La postura crítica: ¿funciona de verdad?

Un claim del 75% es demasiado bonito. Y cuando algo es demasiado bonito, hay que mirar los números. Dos análisis independientes han sometido a caveman a benchmark ciego. Los dos llegan a conclusiones incómodas.

### El benchmark de Ties Petersen

[SkillBenchmark](https://github.com/TiesPetersen/SkillBenchmark) es una herramienta que mide si un skill de Claude Code **realmente** mejora la calidad del output. Ties_P la ejecutó sobre caveman con 3 jueces y 5 runs por tarea. Los resultados:

- **Commit messages**: caveman 93.5±1.5 vs sin skill 89.9±2.3 → delta +3.6±2.8 (solapado, no significativo).
- **Explicar bug en Python**: 99.5±0.5 vs 100.0±0.0 → delta -0.5±0.5 (sin diferencia).
- **Error message para usuario final**: 89.7±3.2 vs 87.7±2.5 → delta +2.0±4.0 (sin diferencia).

Conclusión literal del autor: *"All confidence intervals overlap, no statistically confirmed quality improvement on any task. The skill also doubled or quadrupled token cost on every run due to the system prompt injection."*

O sea: caveman no mejora la calidad (medible), y encima **duplica o cuadruplica** el coste de tokens por la inyección del `SKILL.md` como system prompt. Antes de que saltes a la conclusión de "entonces no sirve para nada", lee el siguiente análisis.

### El análisis de noninertialframe96

[yvgude en r/LocalLLaMA](https://old.reddit.com/r/LocalLLaMA/comments/1u9anzk/cutting_llm_token_costs_with_rtk_headroom_and/) midió el ahorro real sobre **614 millones de tokens** y **926 dólares** de gasto real en tres meses. El resultado de caveman fue:

- **0.4% de ahorro en factura ($3.58)**.

¿Por qué tan poco? Porque caveman solo comprime la prosa, no los thinking tokens, no el código, no el `cache_create`. Y la estructura típica de una factura moderna es: 42% en cache creation, 29% en output, 18% en input, 11% en cache reads. Caveman toca una fracción de ese 29%. El resto, intocado.

El análisis completo, con gráficas, está en [Cutting LLM Token Costs with rtk, headroom, and caveman](https://codepointer.substack.com/p/cutting-llm-token-costs-with-rtk).

### La cara B: el paper de Hakim

Y sin embargo, hay un paper reciente —[Hakim, "Brevity Constraints Reverse Performance Hierarchies in Language Models", arXiv:2604.00025](https://arxiv.org/abs/2604.00025), marzo 2026— que demuestra lo contrario. 31 modelos evaluados, 1.485 problemas, restricción de brevedad: **+26 puntos porcentuales de accuracy**. Los modelos grandes superan a los pequeños en math y scientific reasoning cuando se les fuerza brevedad. No es solo una optimización de coste: es también una optimización de calidad.

¿Qué está pasando? Probablemente las dos cosas son verdad a la vez:

1. Caveman **ahorra tokens en output**, y eso es real y reproducible.
2. Caveman **no ahorra lo que dice ahorrar** en factura total, porque la factura no está dominada por output.
3. Caveman **sí mejora la calidad** en tareas donde la concisión fuerza al modelo a estructurar mejor la respuesta, especialmente en modelos grandes.

El claim del 75% es engañoso si lo lees como "75% de tu factura". Es honesto si lo lees como "75% del output prosa". El propio README lo aclara, en su estilo: *"Caveman no make brain smaller. Caveman make mouth smaller."*

## Cuándo sí, cuándo NO

Después de leer el código, las críticas y los benchmarks, esto es lo que me llevo claro:

| Situación | ¿Usar caveman? | Razón |
|---|---|---|
| Debugging iterativo en sesiones largas | **Sí** | La prosa densa aquí estorba más que ayuda. |
| Code review rápido (PRs de 500 líneas) | **Sí** | Quieres el resumen, no la exposición. |
| Pair programming en sesiones de pago contado | **Sí** | Cada token cuenta, y la conversación es entre tú y el agente. |
| Sesiones con límite de contexto semanal (plan 20x) | **Sí** | Anti-rate-limit más que anti-coste. |
| Contenido user-facing (mensajes de error, marketing) | **NO** | El propio skill se desactiva en estos casos, y está bien que lo haga. |
| Documentación legal o médica | **NO** | La precisión importa más que la brevedad. |
| Modelos locales pequeños (3B-7B) | **NO** | El skill asume que el modelo sigue instrucciones; Ollama + llama3.2 falla. |
| Reasoning mode pesado (thinking tokens) | **NO** | No toca thinking tokens; el ahorro es marginal. |
| Combinado con 5+ skills pesados | **NO** | Cada skill inyecta system prompt; el caché se evapora. |
| Auditoría humana de sesiones largas | **NO** | La prosa demasiado densa es difícil de revisar después. |

## Cómo encaja con lo que ya cubre este blog

Si llevas un tiempo por aquí, esto te va a sonar. Hace dos días publicamos [Ponytail: el skill viral que enseña a tus agentes a ser seniors perezosos](/blog/ponytail-skill-senior-perezoso). Ponytail ataca la cantidad de **código**. Caveman ataca la cantidad de **prosa**. En el benchmark de Ponytail, caveman quedó en el medio porque solo afecta a las explicaciones. Son ortogonales — el propio `SKILL.md` de Ponytail lo dice: *"Ponytail governs what you build, not how you talk (pair with Caveman for terse prose)."*

Y hace un mes, [Matt Pocock Skills: la navaja suiza de los skills pequeños](/blog/mattpocock-skills) presentó caveman como ejemplo de skill que es un único archivo `.md` con efecto desproporcionado. Caveman es la prueba viviente de la tesis de Pocock: un skill pequeño, composable, portable, que cabe en cualquier toolbox.

Juntos, los tres forman una pila interesante:

- **grill-me** (Pocock): te ayuda a hacer las **preguntas** correctas.
- **ponytail** (Gebert): te ayuda a que el agente construya **mínimo**.
- **caveman** (Brussee): te ayuda a que el agente **responda corto**.

Los tres skills juntos pueden reducir el output del agente entre un 80% y un 94%, según la tarea. Pero ojo: apilar system prompts tiene un coste. El `SKILL.md` de caveman inyecta ~950 tokens. El de Ponytail, otros ~5KB. Si sumas grill-me y un par más, puedes superar los 10KB de system prompt que consumen caché que podrías usar para código.

La regla delシニア perezoso es: activa uno, mide, y solo entonces activa el siguiente.

## Cierre

Caveman es el meme que se convirtió en infraestructura. Empezó como un post de Reddit medio en broma y ahora tiene un ecosistema de cinco repos, 75k estrellas, un fine-tune y un paper académico que lo respalda. Y, sin embargo, su mensaje central es el mismo que el de Ponytail: **menos es más**.

Lo que más me gusta de caveman, y por eso lo estoy probando, es la honestidad. Su autor regala el repositorio más grande del ecosistema para convencerte de que uses menos palabras. Si tu agente necesitara decir más, debería decirlo. Pero casi nunca lo necesita.

Mi recomendación: pruébalo en `/caveman lite` una tarde, sin commitments. Si notas que el agente responde igual de claro pero más rápido, te quedas con `lite`. Si quieres más, subes a `full`. Si llegas a `ultra`, vuelve a `full` — `ultra` mola en Twitter pero cansa en una sesión de cuatro horas.

Y cuando lo combines con Ponytail, mide primero. El stack completo es poderoso pero no gratis.

*"Brain still big. Mouth small."* Yo me lo tatúo.

---

## Bibliografía y Referencias

### Repositorios principales

- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) — Skill principal, 75.1k estrellas, MIT.
- [JuliusBrussee/caveman-code](https://github.com/JuliusBrussee/caveman-code) — Agente de terminal completo con 4 capas de compresión.
- [JuliusBrussee/cavemem](https://github.com/JuliusBrussee/cavemem) — Memoria persistente cross-agent.
- [JuliusBrussee/cavekit](https://github.com/JuliusBrussee/cavekit) — Loop de build spec-driven.
- [JuliusBrussee/finetune-caveman](https://github.com/JuliusBrussee/finetune-caveman) — Cavegemma, Gemma 4 31B fine-tune.
- [wilpel/caveman-compression](https://github.com/wilpel/caveman-compression) — Versión librería original (noviembre 2025).

### Complementos del ecosistema de compresión

- [rtk-ai/rtk](https://github.com/rtk-ai/rtk) — Wrapper CLI para tool output, 64.2k estrellas.
- [chopratejas/headroom](https://github.com/chopratejas/headroom) — Proxy API de compresión de input, 41.8k estrellas.

### Análisis independientes

- [SkillBenchmark by TiesPetersen](https://github.com/TiesPetersen/SkillBenchmark) — Benchmark ciego de Caveman. Cero mejora de calidad confirmada estadísticamente.
- [r/ClaudeCode: "I built a tool that measures whether a Claude Code skill actually improves output quality, and tested it on Caveman"](https://old.reddit.com/r/ClaudeCode/comments/1tohl1n/) por u/Ties_P.
- [r/LocalLLaMA: "Cutting LLM Token Costs with rtk, headroom, and caveman"](https://old.reddit.com/r/LocalLLaMA/comments/1u9anzk/) por u/noninertialframe96.
- [Cutting LLM Token Costs with rtk, headroom, and caveman — CodePointer Substack](https://codepointer.substack.com/p/cutting-llm-token-costs-with-rtk) por Yongkyun Lee, 18 junio 2026. 614M tokens analizados.

### Paper académico

- Hakim, MD Azizul. ["Brevity Constraints Reverse Performance Hierarchies in Language Models"](https://arxiv.org/abs/2604.00025). arXiv:2604.00025, 11 marzo 2026. +26 puntos de accuracy con restricciones de brevedad.

### Hilos de Reddit relevantes

- [r/LocalLLaMA: "Make your AI talk like a caveman and decrease token usage"](https://old.reddit.com/r/LocalLLaMA/comments/1p0lnlo/) por u/RegionCareful7282 — origen del meme, 651 upvotes.
- [r/ClaudeCode: "Claude was using 400 tokens to say what 80 tokens could"](https://old.reddit.com/r/ClaudeCode/comments/1sczass/) por u/VeryVexxy, 116 upvotes.
- [r/LocalLLaMA: "GPT 5.5 'secret sauce' is just having the thinking be some stupid caveman mode?"](https://old.reddit.com/r/LocalLLaMA/comments/1tljrtk/) por u/JustFinishedBSG, 263 upvotes.
- [r/ClaudeCode: "here's how the caveman plugin taught me to stop retyping 'you are an expert X' every session"](https://old.reddit.com/r/ClaudeCode/comments/1u7grb0/) por u/zvoque_.

### Lecturas del blog

- [Ponytail: el skill viral que enseña a tus agentes a ser seniors perezosos](/blog/ponytail-skill-senior-perezoso) — caveman mencionado como ortogonal (línea 192).
- [Matt Pocock Skills: la navaja suiza de los skills pequeños](/blog/mattpocock-skills) — sección "El Skill Caveman" (líneas 166-183).
- [AI Agents Coding: de Copilot a agentes autónomos](/blog/ai-agents-coding) — por qué los agentes sobre-ingenieran por defecto.
- [Effective Context for AI: Prompt Engineering](/blog/effective-context-ai) — las 4 C's del contexto.
