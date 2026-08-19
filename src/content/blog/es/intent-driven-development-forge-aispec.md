---
title: "IDD: Desarrollo por Intención con FORGE y AISpec"
description: "El IDD desplaza la pregunta de '¿cómo construir?' a '¿qué resultado queremos?'. FORGE y AISpec convierten tu intención en software verificable. Análisis con ejemplos."
pubDate: 2026-08-10
lastmod: 2026-08-10
author: "ArceApps"
keywords:
  - "Intent-Driven Development"
  - "IDD"
  - "FORGE Framework"
  - "AISpec"
  - "Spec-Driven Development"
  - "Agentes de IA"
canonical: "https://arceapps.com/es/blog/intent-driven-development-forge-aispec/"
heroImage: "/images/intent-driven-development-forge-aispec-es.svg"
tags: ["Intent-Driven Development", "IDD", "FORGE", "AISpec", "AI Agents", "Indie Dev"]
reference_id: "c4f7e3d2-1a8b-4c6e-9f0d-5b2a7e8c1d34"
---

## 🎯 El día que dejé de escribir el código equivocado rápido

Llevaba semanas con la misma sensación. Mi agente de IA generaba código a velocidad de vértigo: funciones completas, tests, refactors. Yo revisaba, aprobaba, avanzaba. Y sin embargo, cada dos o tres iteraciones, me daba cuenta de que habíamos construido *la cosa equivocada*. No fallaba la implementación — el código era correcto, compilaba, los tests pasaban. Fallaba algo más básico: lo que habíamos construido no era lo que yo quería.

Scott Feltham, creador de FORGE, lo resumió en una frase que me golpeó como un jarro de agua fría:

> "I just kept writing the wrong code fast. So I built FORGE." — [Scott Feltham](https://www.linkedin.com/posts/scottdfeltham_github-scottfelthamforge-framework-ai-driven-activity-7421880255805718528-uf33)

Esa es la crisis que da origen a una metodología que lleva un tiempo ganando tracción: el **Intent-Driven Development (IDD)** — el Desarrollo Impulsado por Intención. La idea es simple de enunciar y difícil de practicar: **deja de obsesionarte con el *cómo* y aprende a expresar el *qué* con la precisión suficiente para que la IA lo implemente correctamente a la primera**.

Este artículo es un análisis práctico del IDD: qué es de verdad, cómo lo materializan dos marcos concretos (FORGE y AISpec), qué prometen, qué han demostrado, y — sobre todo — dónde están las trampas que nadie menciona en los posts de hype. Porque de eso hay mucho, y de análisis honesto, poco.

> **Nota de prior art**: en este blog ya he cubierto el [Desarrollo Impulsado por Especificaciones](/es/blog/specs-driven-development/), un análisis profundo de [frameworks SDD como Spec Kit, OpenSpec y BMAD](/es/blog/sdd-frameworks-spec-kit-openspec-bmad/), la comparativa entre [Superpowers y OpenSpec](/es/blog/superpowers-vs-openspec/), el enfoque [task-first con Beads y Taskmaster](/es/blog/lean-task-first-beads-leanspec-taskmaster/) y el extremo autónomo de la [dark factory](/es/blog/dark-factory-agentic-infrastructure/). El IDD es el paso anterior a todos ellos: no especifica *qué archivos cambiar*, sino *qué resultado quieres*. Este artículo es la pieza que faltaba: el análisis de la capa de intención, con los dos marcos que la convierten en algo operable.

---

## 🤔 El problema: el prompt no es una especificación

Para entender por qué nace el IDD, hay que mirar con honestidad cómo trabajamos con los agentes de código hoy. El patrón dominante sigue siendo este: le pido algo a la IA en lenguaje natural, la IA escribe código, yo reviso el resultado y le digo qué corregir. Repetimos hasta que "más o menos" se parece a lo que quería.

Este flujo tiene un nombre desde 2025: **vibe coding**. Y no es un insulto — es una fase legítima por la que todos pasamos. El problema es cuando se convierte en el *único* modo de trabajo. Addy Osmani, ingeniero en Google y autor de referencia en rendimiento web, lo expresó con una claridad incómoda:

> "Vibe coding is not the same as AI-Assisted engineering... On Reddit and Hacker News, threads... The overall mood: high skepticism of using un-reviewed AI code in serious projects, mixed with some optimism for limited use cases." — [Addy Osmani](https://medium.com/@addyosmani/vibe-coding-is-not-the-same-as-ai-assisted-engineering-3f81088d5b98)

La crítica de fondo es demoledora y cierta: *que una IA escupa código rápido no significa que el código sea bueno*. Pero hay una versión más sutil del mismo problema que casi nadie diagnostica. No es que la IA genere código malo — es que **genera código correcto para un problema que no es el tuyo**.

Piénsalo así: cuando le dices a un LLM "escribe código de autenticación", en su espacio de tokens hay miles de implementaciones posibles de "autenticación". Sin restricciones, la IA muestrea la más probable, que probablemente sea la más genérica: un login con email y contraseña, sesiones en memoria, cero consideración de rate limiting, expiración de tokens o hashing. Si tú querías OAuth con refresh tokens y bloqueo tras cinco intentos fallidos, la IA te ha dado la *respuesta correcta a otra pregunta*.

El problema, en una frase: **el espacio de soluciones de un prompt vago es enorme, y el muestreo de un LLM tiende al centro de ese espacio — la solución más genérica posible**.

De aquí salen dos corrientes de respuesta. La primera es la que ya he cubierto en este blog: el **SDD (Spec-Driven Development)** — escribir una especificación estructurada antes de que la IA toque código. La segunda, más reciente y menos cubierta, es el **IDD (Intent-Driven Development)**: en lugar de especificar el *cómo* (archivos, funciones, interfaces), especificar el *qué* (resultado, límites, criterios de éxito) y dejar que la IA — con la estructura adecuada — decida el cómo dentro de esas fronteras.

---

## 🧭 Qué es exactamente el Intent-Driven Development

La definición canónica la da el propio marco FORGE:

> "Intent-Driven Development (IDD) is a methodology where you focus on expressing what you want and why, while AI handles the how. Instead of writing code line by line, you define clear intent through structured phases, and AI implements it correctly." — [FORGE Framework](https://scottfeltham.github.io/forge-framework/)

Y el insight clave, que resume toda la filosofía en dos frases:

> "The key insight: AI can write code. Humans should define intent." — [FORGE Framework](https://scottfeltham.github.io/forge-framework/)

Hay una reasignación de responsabilidades aquí que conviene saborear. En el modelo clásico (y en el vibe coding), el humano se queda con la peor parte: los detalles de implementación — sintaxis, APIs, edge cases, configuración — que son precisamente donde los LLM brillan. En el modelo IDD, el humano sube un nivel: se queda con la parte que los LLM todavía hacen mal — decidir qué es lo que *realmente* se quiere, distinguir lo esencial de lo accesorio, y definir qué cuenta como "hecho".

Esto no es un capricho teórico. Es una hipótesis sobre dónde está el cuello de botella real de la productividad con IA:

> "The bottleneck in AI-assisted development isn't code generation. It's expressing intent clearly enough for AI to implement correctly." — [FORGE Framework](https://scottfeltham.github.io/forge-framework/)

Si esa hipótesis es correcta — y cada vez tengo más evidencias de que lo es — entonces todo el tiempo que invertimos en pulir prompts, revisar diffs y corregir iteraciones es *tiempo perdido en la capa equivocada*. El tiempo bien invertido sería el de aprender a expresar intención con precisión quirúrgica.

### IDD vs SDD vs Dark Factory: el espectro

Para no confundir términos que proliferan a toda velocidad, conviene colocarlos en un espectro de *quién decide el cómo*:

![Espectro de paradigmas: del vibe coding a la dark factory](/images/idd-paradigm-spectrum-es.svg)

| Paradigma | Quién decide el QUÉ | Quién decide el CÓMO | Nivel de autonomía |
|---|---|---|---|
| Vibe coding | Humano (vagamente) | IA (libre) | Bajo — revisión total |
| SDD | Humano (especificación detallada) | IA (dentro de la spec) | Medio — validación por tests |
| **IDD** | **Humano (intención + límites + éxito)** | **IA (implementación estructurada)** | **Medio-alto — fases validadas** |
| Dark factory | Humano (objetivos) | IA (todo, sin revisión) | Extremo — autonomía total |

La diferencia sutil entre SDD e IDD es el *grano* de la especificación. En SDD escribes una spec que describe el sistema: archivos, contratos, interfaces, cambios. En IDD escribes una declaración de intención: qué resultado quieres, dentro de qué límites, y qué cuenta como éxito. El SDD dice "crea el archivo `auth.ts` con estas funciones y estos tests". El IDD dice "los usuarios deben poder iniciar sesión de forma segura; máximo 5 intentos por hora; respuesta en menos de 200ms".

Uno describe el *camino*. El otro describe el *destino*, y deja que el sistema encuentre el camino — siempre que el destino esté definido con la precisión suficiente para que cualquier camino válido sea reconocible.

---

## 🔨 FORGE: el ciclo de 5 fases que no te deja saltarte pasos

FORGE (acrónimo de sus cinco fases) es un framework creado por Scott Feltham, presentado originalmente como CLI y evolucionado a skill de Claude Code y servidor MCP. Su tesis es que la intención no se declara de una vez: **se refina en fases, y cada fase tiene una compuerta de validación que impide avanzar con la intención aún difusa**.

Las cinco fases son:

| Fase | Propósito | Salida |
|---|---|---|
| **F**ocus | Definir qué y por qué | Enunciado del problema, criterios de éxito |
| **O**rchestrate | Planificar la arquitectura | Diagramas C4, desglose de tareas |
| **R**efine | Especificar "hecho" antes del código | Criterios de aceptación, interfaces |
| **G**enerate | La IA escribe código vía TDD | Implementación probada y funcional |
| **E**valuate | Verificar que la intención se cumplió | Aceptado o iteración |

La regla de oro del framework: *no puedes saltarte una fase sin completar sus requisitos*. Esto suena a burocracia, pero es exactamente lo contrario: es una **salvaguarda contra el peor hábito del desarrollador con IA** — empezar a generar código cuando la intención todavía es un borrón.

![Ciclo FORGE: las 5 fases del IDD](/images/idd-forge-cycle-es.svg)

### Cómo se ve en la práctica

El ejemplo que da el propio framework es una autenticación de pagos. Con la skill de Claude Code, el flujo es así:

```
Tú: /forge new "payment processing"

Claude: Fase Focus. Déjame hacerte unas preguntas:
  - ¿Qué proveedores de pago necesitas?
  - ¿Cuáles son tus criterios de éxito?
  - ¿Hay requisitos de seguridad?

Tú: Solo Stripe. Éxito = cobrar tarjetas y manejar fallos con elegancia.

Claude: Entendido. Pasando a la fase Orchestrate...
  [Crea el diagrama de arquitectura]
  [Desglosa en tareas de tamaño sesión]

Claude: Listo para Refine. Escribiendo criterios de aceptación...
  Dado una tarjeta válida, cuando se cobra, entonces devuelve éxito
  Dado una tarjeta inválida, cuando se cobra, entonces devuelve error con código

Claude: Criterios aprobados. Empezando Generate...
  [Escribe primero el test que falla — RED]
  [Implementa el código mínimo — GREEN]
  [Refactoriza — REFACTOR]

Claude: Todos los tests pasan. Listo para Evaluate.
  ¿Esto coincide con tu intención?
```

Fíjate en lo que está pasando aquí, porque es la clave de todo el artículo. **Antes de que se escriba una sola línea de código de producción, ya hay**: un enunciado del problema, una arquitectura, un desglose de tareas, y criterios de aceptación en formato Given/When/Then. El código es el *último* paso, y llega después de que la intención haya sido validada tres veces a niveles distintos.

Esto invierte por completo el flujo del vibe coding. En el vibe coding, el código es el primer artefacto y todo lo demás (tests, documentación, criterios) se reconstruye a posteriori si hay suerte. En FORGE, el código es el artefacto final de un proceso de refinamiento de intención.

### Cómo se instala

FORGE tiene tres formas de uso, de más a menos integrada:

1. **Skill de Claude Code** (recomendada por el autor): clonas el repo de la skill y usas comandos `/forge new`, `/forge status`, `/forge phase next` directamente en Claude Code. No requiere servidor.
2. **Servidor MCP**: para integraciones en IDE (VS Code, Cursor) y flujos multi-herramienta. Se añade el server `@neoforge/forge-mcp` a la configuración MCP.
3. **CLI (legacy)**: `npm install -g @neoforge/forge-framework`, para flujos que no usan Claude.

La instalación de la skill, además, configura automáticamente subagentes especializados: arquitecto, desarrollador, tester, DevOps y revisor — cada uno con su dominio.

---

## 📐 AISpec: la intención como formato declarativo

Si FORGE es el proceso, **AISpec es el lenguaje**. Creado por Chris Bora (primera propuesta en diciembre de 2024), AISpec es un formato declarativo para definir features de software de forma que sea legible para humanos y parseable por IA. Su definición oficial:

> "AISpec is a specification language for AI-first development that shifts focus from implementation to intent through structured solution space reduction." — [cbora/aispec](https://github.com/cbora/aispec)

La idea central es un marco llamado **WBS — What-Boundaries-Success** (Qué-Límites-Éxito). Tres secciones, tres preguntas, cero ambigüedad:

| Sección | Pregunta | Qué contiene |
|---|---|---|
| **What** | ¿Qué queremos? | Acciones claras, cada una ejecutable |
| **Boundaries** | ¿Dentro de qué límites? | Límites de rendimiento, restricciones de recursos, reglas de negocio |
| **Success** | ¿Cómo sabemos que está bien? | Resultados medibles, métricas claras, comportamiento esperado |

El formato básico es casi ridículamente simple:

```
Feature: UserAuth {
  What:
    - "Handle user login"
    - "Issue JWT token"
    - "Track attempts"

  Boundaries:
    - "Max 5 attempts/hour"
    - "Token expires 24h"
    - "Passwords hashed"

  Success:
    - "Valid users login"
    - "Invalid blocked"
    - "Response < 200ms"
}
```

Este ejemplo es literal del README del proyecto, y si te parece trivial, es que estás captando el punto. La potencia no está en la sintaxis — está en el **efecto que tiene sobre el espacio de soluciones del LLM**:

> "Traditional prompt: 'Write authentication code' — Solution space: 1000s of possible implementations. AISpec format: ... — Solution space: Reduced to few viable implementations." — [cbora/aispec](https://github.com/cbora/aispec)

![WBS: reducción del espacio de soluciones con AISpec](/images/idd-aispec-wbs-es.svg)

### Por qué funciona: la intuición probabilística

El README de AISpec incluye una explicación de por qué WBS funciona con LLMs que me parece la contribución más interesante del proyecto, más allá del formato en sí:

> "LLMs fundamentally work by sampling the next token based on probability distributions over their vocabulary. What-Boundaries-Success framework as a prompting framework works because: What: Defines the initial high-probability region in the LLM's token space. Boundaries: Act as 'soft constraints' that shift probability mass AWAY from tokens that would lead to invalid solutions. Success: Creates 'peaks' in the probability landscape that guide sampling toward desired end states." — [cbora/aispec](https://github.com/cbora/aispec)

Traduciendo: el *What* coloca a la IA en la región correcta del espacio de tokens (el tema). Los *Boundaries* crean "valles" de probabilidad que alejan el muestreo de soluciones inválidas (no puedes hacer X, no superes Y). Y el *Success* crea "picos" hacia los que el muestreo se siente atraído (esto es exactamente lo que significa terminar). Cada restricción elimina un conjunto de soluciones inválidas — y como se componen, la reducción es multiplicativa.

Por eso el meta-prompt del proyecto insiste en restricciones que "compounds with each other" y en que "solution space reduction must be multiplicative": una restricción sola reduce poco; diez restricciones bien elegidas pueden reducir el espacio de miles de implementaciones a un puñado.

### El formato extendido

Para features complejas, AISpec permite secciones adicionales: `Technical` (framework, base de datos, patrones), `Dependencies` (paquetes requeridos y opcionales) y `Security` (auth, encriptación, rate limits). El formato sigue siendo declarativo — describe *qué* usar, no *cómo* conectarlo.

Hay también un **meta-prompt** que se puede pegar en el system prompt de cualquier asistente para que el propio asistente convierta requisitos en lenguaje natural a formato AISpec antes de implementar. Es un patrón interesante de "spec-ing recursivo": usas AISpec para definir cómo debe funcionar AISpec.

---

## 🔬 La teoría detrás: Bora's Law y la escala de la intención

No puedo hablar de AISpec sin mencionar la parte más controvertida del proyecto: la teoría que lo acompaña. Chris Bora propone una fórmula, **I = Bi(C²)**, que afirma que la inteligencia efectiva (I) escala con la inteligencia base (Bi) multiplicada por el *cuadrado de la claridad de las restricciones* (C²) — no con el cómputo.

> "This formula says that when you have enough base intelligence (Bi), intelligence (I) scales exponentially with clarity of constraints (C²), not compute." — [cbora/aispec](https://github.com/cbora/aispec)

La afirmación es audaz: si el cuello de botella no es el modelo sino la claridad de las restricciones, entonces dos ingenieros de intención con un LLM genérico podrían lograr lo que un equipo de sesenta desarrolladores con cinco millones de dólares. El README lo dice literalmente:

> "Traditional: 60 developers, $5M, 1 year. Intent Engineering: 2 intent engineers, minimal capital, fraction of time." — [cbora/aispec](https://github.com/cbora/aispec)

Aquí es donde el análisis honesto tiene que frenar en seco. **Esa afirmación es marketing, no un resultado demostrado.** No hay un estudio controlado que la respalde; hay una analogía llamativa (una persona conduce un coche frente a una persona conduce un millón de coches vía restricciones) y una fórmula que no está definida formalmente — ¿qué unidades tiene C? ¿Cómo se mide "inteligencia efectiva"? ¿De dónde sale el cuadrado?

Dicho esto, descartar toda la teoría sería un error igual de grande. La *dirección* de la hipótesis tiene respaldo empírico en un sentido débil: cada restricción bien formulada que añades a un prompt reduce de forma medible la variabilidad de las respuestas de un LLM. Eso lo puede comprobar cualquiera en cinco minutos con un experimento de muestreo. Lo que no tiene respaldo es la *magnitud* de la afirmación — que esa reducción sea exponencial en el cuadrado de la claridad, y que pueda sustituir equipos y presupuestos enteros.

Mi lectura: **Bora's Law es una hipótesis de trabajo disfrazada de ley física**. Útil como heurística (restricciones claras → mejores resultados), peligrosa como dogma (si los resultados no llegan, es que no has sido "suficientemente claro"). El IDD se beneficia de la heurística; no necesita el dogma.

---

## ⚖️ La comparación que importa: IDD frente a lo que ya usas

Para decidir si el IDD merece un hueco en tu flujo, la comparación no es contra el hype — es contra lo que realmente haces hoy. Aquí va mi evaluación práctica:

### IDD frente a prompt directo (vibe coding)

- **Gana IDD en**: consistencia entre lo pedido y lo entregado, coste de iteración (menos vueltas), trazabilidad (las fases quedan documentadas).
- **Gana el prompt directo en**: velocidad de arranque para tareas triviales, cero overhead de proceso.
- **Veredicto**: para tareas de una función, el prompt directo es correcto. Para cualquier feature con más de una decisión de diseño, el IDD se paga solo con la primera iteración que evita.

### IDD frente a SDD (spec-driven)

- **Gana IDD en**: velocidad de escritura (declaras intención, no detalles de implementación), adaptabilidad (el cómo lo decide la IA dentro de los límites).
- **Gana SDD en**: control fino, previsibilidad para sistemas con arquitectura ya decidida, compatibilidad con equipos que necesitan revisar el plan antes de ejecutar.
- **Veredicto**: no son enemigos, son niveles. El flujo real que veo funcionar es SDD *para el contrato* (qué archivos, qué interfaces) + IDD *para la intención* (qué resultado, qué límites, qué éxito). FORGE de hecho combina ambos: la fase Orchestrate produce el desglose y la fase Refine los criterios de aceptación.

### IDD frente a dark factory

- **Gana IDD en**: supervisión humana en cada compuerta de fase, menor riesgo de deriva.
- **Gana dark factory en**: autonomía total, throughput máximo.
- **Veredicto**: la dark factory es el extremo del espectro donde el IDD se automatiza hasta el punto de eliminar la validación humana. Si la dark factory te da vértigo — y debería — el IDD es el término medio defendible: autonomía en el cómo, control en el qué.

---

## 🧪 Un experimento honesto: IDD en un proyecto real

La teoría está muy bien, pero lo que me convenció fue probarlo. Te cuento el experimento que hice con una feature pequeña de un proyecto personal: un sistema de notificaciones con prioridades.

**Enfoque vibe coding (mi línea base):** prompt directo "añade un sistema de notificaciones con prioridades al proyecto". Resultado: la IA implementó notificaciones con prioridades *numéricas* y las mostró en una lista plana. Funcionaba, pero no era lo que quería — yo quería prioridades *por tipo* (error > advertencia > info) con reglas de supresión (no más de 3 notificaciones del mismo tipo por hora). Dos iteraciones de corrección después, el código era un parche sobre un parche. Tiempo total: ~45 minutos. Resultado: funciona, pero lo odio.

**Enfoque IDD (la misma feature, AISpec + fases FORGE):**

```
Feature: NotificationSystem {
  What:
    - "Show user notifications with priority levels"
    - "Group by type: error > warning > info"
    - "Suppress repeats: max 3/hour per type"

  Boundaries:
    - "No external notification service"
    - "Store in local database"
    - "UI stays in existing component tree"

  Success:
    - "Error notifications always visible"
    - "Warning hidden after 3 per hour"
    - "Info collapsible by default"
    - "All rules unit-tested"
}
```

Con esa declaración, el agente implementó exactamente eso: prioridad por tipo, supresión por hora, reglas en tests. Una iteración, veinte minutos. La diferencia no fue el modelo — fue que esta vez la IA sabía *qué significaba terminar* antes de empezar.

El experimento no es un estudio científico, pero sí es ilustrativo: **el mismo modelo, el mismo código base, la misma feature — y el resultado pasó de "funciona pero lo odio" a "funciona y es lo que pedí"**. El único cambio fue la expresión de la intención.

---

## ⚠️ Las trampas que nadie menciona

Ninguna metodología viene sin costes. Estos son los que he encontrado en la práctica, y no los verás en los posts de lanzamiento:

**1. Escribir intención también es difícil.** La premisa del IDD es que expresar el *qué* es más fácil que el *cómo*. Es verdad — pero solo hasta cierto punto. Expresar criterios de éxito *medibles* para algo que todavía no existe requiere un nivel de claridad mental que la mayoría de los proyectos no tienen al inicio. El IDD no te da esa claridad: la exige. Si no sabes qué quieres, ninguna metodología lo arregla — aunque FORGE te hará descubrirlo en la fase Focus antes de desperdiciar tokens en código.

**2. El riesgo de la especificación falsa.** Los criterios de éxito en AISpec ("Response < 200ms", "Valid users login") parecen objetivos, pero son afirmaciones que nadie ha verificado. Un LLM que los recibe como "spec" puede producir código que *parece* cumplirlos sin tests que los demuestren. La diferencia entre "lo dice la spec" y "los tests lo demuestran" es la diferencia entre IDD bien y mal ejecutado. **Sin tests, el IDD es solo un prompt con formato bonito.**

**3. El sesgo de confirmación de las fases.** En FORGE, el agente te pregunta "¿esto coincide con tu intención?" en Evaluate. La tentación es decir que sí para acabar. La compuerta de validación solo funciona si el humano es honesto — y los humanos cansados no lo son. Si usas IDD, presupuesta tiempo para el "no" en Evaluate.

**4. La ley de Bora no es una ley.** Ya lo he dicho, pero conviene repetirlo: la fórmula I = Bi(C²) es una hipótesis atractiva sin validación formal. No diseñes tu proceso asumiendo que es física.

**5. Overhead para tareas pequeñas.** Para "cambia el color del botón", el ciclo completo de IDD es burocracia ridícula. La disciplina de un buen practicante de IDD es saber *cuándo no* aplicarlo. La señal: si puedes escribir la intención completa en una frase sin ambigüedad, no necesitas fases — necesitas un prompt.

---

## 🛠️ Cómo empezar sin revolucionar tu flujo

Si el IDD te interesa, no necesitas adoptar un framework completo desde el día uno. Mi recomendación es un camino incremental de tres pasos:

**Paso 1 — Adopta el formato WBS, sin herramientas nuevas.** La próxima feature que le pidas a tu agente, escríbela como AISpec: una sección What (acciones concretas), una Boundaries (restricciones), una Success (criterios medibles). Copia el ejemplo de UserAuth, adapta los nombres, y pega el bloque en tu prompt. Esto solo ya cambia la calidad del output — es el experimento del artículo, que no requirió ninguna instalación.

**Paso 2 — Añade las compuertas de FORGE de forma manual.** Antes de que tu agente escriba código, exige (tú, manualmente) tres artefactos: un enunciado del problema en una frase, una arquitectura en tres líneas, y tres criterios de aceptación. Si no puedes escribirlos, no estás listo para el código. Esto es FORGE sin instalarlo.

**Paso 3 — Si el flujo te convence, instala la skill.** `git clone https://github.com/scottfeltham/forge-skill.git ~/.claude/skills/forge`, y prueba `/forge new` en tu próximo feature real. Si usas MCP, `@neoforge/forge-mcp` es el camino. Empieza por un proyecto pequeño donde las compuertas no te frustren.

Un consejo final: **mide el antes y el después**. Cuenta las iteraciones que necesitas para una feature típica hoy (prompt directo), y las que necesitas con WBS/FORGE. Si el número no baja, la metodología no es para tu caso — y saberlo es tan valioso como que funcione.

---

## 📚 Bibliografía y referencias

- [FORGE Framework — Intent-Driven Development](https://scottfeltham.github.io/forge-framework/) — documentación oficial del framework.
- [Getting Started | FORGE Framework](https://scottfeltham.github.io/forge-framework/getting-started) — instalación de la skill y el MCP.
- [GitHub — scottfeltham/forge-framework](https://github.com/scottfeltham/forge-framework) — repositorio del framework original.
- [GitHub — scottfeltham/forge-skill](https://github.com/scottfeltham/forge-skill) — skill de Claude Code.
- [GitHub — cbora/aispec](https://github.com/cbora/aispec) — AISpec, WBS y Bora's Law (fuente primaria).
- [Intent-Driven Development for AI Coding — intent-driven.dev](https://intent-driven.dev/knowledge/intent-driven-development/) — recurso de referencia sobre IDD, Context Engineering y Harness Engineering.
- [Vibe coding is not the same as AI-Assisted engineering — Addy Osmani](https://medium.com/@addyosmani/vibe-coding-is-not-the-same-as-ai-assisted-engineering-3f81088d5b98) — la crítica honesta al vibe coding.
- [Being a Responsible Developer in the Age of AI Hype — InfoQ](https://www.infoq.com/articles/responsible-developer-ai-hype/) — sobre escepticismo y verificación independiente.
- Artículos relacionados en este blog: [SDD](/es/blog/specs-driven-development/), [Frameworks SDD](/es/blog/sdd-frameworks-spec-kit-openspec-bmad/), [Superpowers vs OpenSpec](/es/blog/superpowers-vs-openspec/), [Task-first](/es/blog/lean-task-first-beads-leanspec-taskmaster/), [Dark Factory](/es/blog/dark-factory-agentic-infrastructure/).

---

## 🏁 Cierre

El Intent-Driven Development no es la respuesta a todo — es la respuesta a una pregunta concreta: *¿por qué sigo corrigiendo a mi IA cuando la IA no se equivoca de código, sino de objetivo?*

El cambio de mentalidad es pequeño en apariencia y enorme en la práctica: **deja de escribir el código (o los prompts que lo generan) y empieza a escribir el destino**. FORGE te da el proceso para refinar esa intención en cinco fases validadas; AISpec te da el formato para declararla sin ambigüedad. Ninguno de los dos sustituye tu criterio — al contrario, lo convierten en el artefacto principal del desarrollo.

La frase de Feltham — "I just kept writing the wrong code fast" — resume mejor que cualquier análisis la experiencia de cualquiera que haya trabajado con agentes de código sin estructura. El IDD es, en el fondo, la disciplina de dejar de escribir el código equivocado rápido. Y en 2026, con agentes que generan código a velocidad industrial, esa disciplina vale más que nunca.

Si lo pruebas, cuéntame cómo te va. Y si tu experiencia contradice algo de este artículo, también — el análisis honesto necesita ambos lados. 🚀
