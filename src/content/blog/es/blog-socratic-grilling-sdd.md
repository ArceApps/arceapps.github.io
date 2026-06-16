---
title: "Interrogatorio Socrático y Spec-Driven Development: ¿Pueden Convivir?"
description: "El skill /grill-me de Matt Pocock fuerza alineación adversaria antes de programar. Los frameworks SDD imponen contratos arquitectónicos. Tested si estas dos filosofías pueden trabajar juntas — y dónde entran en conflicto genuino."
pubDate: 2026-05-20
heroImage: "/images/blog-socratic-grilling-sdd.svg"
tags: ["SDD", "IA", "Método Socrático", "Spec-Driven Development", "mattpocock", "Prompt Engineering", "Skills"]
reference_id: "c8a2f3d5-7e1b-4c9d-8f0a-3e6b9d2c1a0d"
related_posts:
  - blog-mattpocock-skills
  - blog-socratic-method-prompts-kotlin-android
  - blog-sdd-frameworks-spec-kit-openspec-bmad
  - socratic-agents-part-2-sdd-sycophancy
---

## Dos Respuestas Distintas al Mismo Problema

Si has leído nuestros artículos sobre [mattpocock/skills](/blog/blog-mattpocock-skills) y el [Método Socrático para romper la sicofancia de los LLMs](/blog/blog-socratic-method-prompts-kotlin-android), probablemente notaste algo incómodo: ambas claiming resolver el problema de desalineación, pero lo resuelven de formas completamente opuestas.

El prompting socrático dice: cambia el objetivo de optimización interno del modelo para que busque activamente defectos antes de responder. El system prompt se reescribe para hacer que el modelo sea adversario del usuario — no por maldad, sino porque un modelo que está de acuerdo contigo es inútil si lo que quieres está mal.

Spec-Driven Development dice: construye un artefacto externo (un SPEC.md, un contrato) que el modelo debe respetar antes de generar código. El trabajo del modelo es seguir el spec, no desafiarlo.

Skills (mattpocock) dice algo diferente: el agente debería *entrevistar* al usuario antes de hacer nada, actualizando un glosario compartido según las decisiones se cristalizan. El trabajo del agente es entender tu intención tan thoroughly que la implementación sigue naturalmente.

Estas son tres filosofías distintas. Y probablemente tienes un gut feeling sobre cuál es la correcta. Quiero complicar ese gut feeling.

## La Diferencia Filosófica en Detalle

Seamos precisos sobre lo que cada enfoque asume:

**Prompting socrático** asume que el *usuario* tiene la intención correcta y el *modelo* es la fuente de riesgo. El modelo quiere agradar; necesitas hacerlo adversario. La solución es a nivel de prompt (modificaciones al system prompt, guardrails anti-sicofancia).

El mecanismo es matemático: RLHF optimiza los modelos para maximizar scores de satisfacción del usuario. En una interfaz de chat, la satisfacción correlaciona fuertemente con validación y confianza rápida. Esto no es un rasgo de personalidad — es una función de pérdida. No puedes simplemente "decirle que pare" sin cambiar el objetivo de optimización directamente en el system prompt. Por eso instrucciones vagas como "sé más crítico" no funcionan de forma confiable. Necesitas cambios estructurales: frases prohibidas, surfacing obligatorio de defectos, restricciones de formato de output que prevengan suavizado.

**SDD** asume que el *modelo* tiene un default razonable pero carece de contexto persistente sobre tu proyecto. La solución es a nivel de artefacto: un SPEC.md que sobrevive a la sesión, externalizado para que el modelo lo lea cada vez.

El insight aquí es sobre *persistencia de contexto*. Una conversación de chat es efímera — el modelo solo ve lo que estuvo en los últimos mensajes. Un SPEC.md es persistente — cada sesión comienza leyéndolo. Esto significa que SDD resuelve un problema diferente al prompting socrático: no "cómo hago que el modelo sea adversario" sino "cómo le doy al modelo acceso durable a mis decisiones arquitectónicas."

**Skills' /grill-me** asume que la *conversación misma* es donde ocurre la desalineación. Ninguna de las partes ha resuelto completamente el árbol de diseño. La solución es conversacional: sigue haciendo preguntas hasta que el árbol esté resuelto.

El insight clave del skill grill-me es la metáfora del "árbol de diseño": cada decisión tiene dependencias, y no puedes evaluar una decisión correctamente hasta que hayas evaluado las decisiones de las que depende. El skill lo enforce haciendo preguntas de una en una, siguiendo el árbol, resolviendo cada nodo antes de moverse a sus hijos.

La diferencia clave en modelos de autoridad: **prompting socrático** trata al modelo como tu adversario (con autoridad para desafiarte). **SDD** trata al spec como la autoridad (el trabajo del modelo es seguirlo, no desafiarlo). **Grilling** trata a la *conversación* como la autoridad — lo que significa que ambas partes son responsables ante ella, y ninguna puede escapar diciendo "el spec lo decía" o "tú me lo pediste."

## Dónde Realmente Conflicten

Aquí es donde se pone incómodo.

El prompting socrático, llevado a su conclusión lógica, significa que nunca deberías dejar que un modelo acepte un spec al pie de la letra. Cada spec debería ser desafiado. El trabajo del modelo es encontrar las flaws en tu pensamiento antes de que te comprometas a construir algo equivocado.

Pero los frameworks SDD explícitamente requieren lo opuesto: el spec *es* el contrato. Lo escribes, lo revisas, te comprometes a él. Luego el modelo genera código que debe conformarse a él. El modelo no tiene derecho a desafiar el spec — tiene derecho a desafiar la implementación contra el spec.

Estas son genuinamente incompatibles en sentido estricto. Si aplicas principios de prompting socrático a un workflow SDD, terminas sin escribir el spec hasta haberlo interrogado hasta la muerte. Y si aplicas principios SDD al prompting socrático, terminas construyendo un framework adversario que respeta cualquier spec que escribas, aunque el spec esté mal.

La tensión real: el prompting socrático optimiza por *pensamiento correcto*. SDD optimiza por *output correcto relativo a una intención declarada*. Estos son objetivos de optimización diferentes, y no siempre están alineados.

## Dónde Genuinamente Se Complementan

Dicho esto — y esta es la parte interesante — ambos enfoques llegan a la misma conclusión desde direcciones diferentes: ambos creen que la alineación antes de la generación es la inversión crítica.

Prompting socrático: antes de que el modelo responda, debe surfacear sus supuestos no declarados e identificar el single point of failure.

Grilling (que es la implementación de principios socráticos en Skills): antes de que el modelo escriba código, debe recorrer el árbol de diseño y resolver dependencias entre decisiones.

SDD: antes de que el modelo genere, debe leer el spec y verificar que la implementación conforms.

Lo que esto significa en la práctica: el prompting socrático es la *pre-spec phase*. Asegura que tu spec no esté construido sobre supuestos no declarados. SDD es la *post-spec phase*. Asegura que la implementación conforms a lo que decidiste.

El workflow se ve así:

```
El usuario tiene una intención vaga
    ↓
Grilling socrático (/grill-me) → intención refinada, árbol de diseño resuelto
    ↓
Spec escrita (o actualizada) basada en decisiones resueltas
    ↓
Enforcement SDD (Spec Kit / OpenSpec / o solo disciplina)
    ↓
Código generado contra el spec
    ↓
Evaluación socrática (el prompt adversario verifica: ¿esto realmente cumple el spec?)
```

Nota que el prompting socrático aparece *dos veces*: una como forcing function pre-spec, y otra como evaluación post-generación.

## El Diagrama del Workflow Fase-Aware

Para hacerlo concreto, aquí está cómo las fases mapean a herramientas específicas:

```
FORMACIÓN DE INTENCIÓN      →  /grill-me (Skills) o interrogatorio socrático manual
                                 ↓
ESPECIFICACIÓN              →  SPEC.md (SDD) — ahora escrita desde decisiones resueltas
                                 ↓
GENERACIÓN                  →  El modelo lee el spec, genera código, guardrails socráticos activos
                                 ↓
EVALUACIÓN POST-GEN         →  Check adversario: ¿esta implementación realmente cumple el spec?
                                 ↓
FALLO (inevitable)          →  /diagnose (Skills) — loop disciplinado de 6 fases
                                 ↓
LIMPIEZA ARQUITECTÓNICA     →  /improve-codebase-architecture (Skills) — anti-entropía periódica
```

Nota lo que no apareció: un pipeline monolítico. Cada fase usa una herramienta diferente, apropiada para el objetivo de esa fase. Los límites de fase son donde el modelo de autoridad cambia: de "tú vs el agente descubriendo qué construir" (grilling) a "el spec vs la implementación" (SDD) a "el modelo como evaluador adversario" (socrático post-gen) a "debugging disciplinado" (diagnose).

## El Workflow Combinado de Cuatro Fases

Aquí está la integración que he encontrado más útil en la práctica:

**Fase 1 — Grilling (Socrático pre-spec)**

Antes de escribir una sola línea de spec, ejecuta una sesión de grilling. El skill `/grill-me` (o manualmente, si no estás usando Skills) recorre el árbol de diseño. Para cada decisión, pregunta: ¿qué problema resuelve esto? ¿Qué haría que esta decisión fuera incorrecta? ¿Cuáles son las dependencias entre esta decisión y otras?

El output de esta fase no es código — es una lista de decisiones resueltas. Algunas se convierten en el SPEC.md. Otras se graban como ADRs. El punto: no estás escribiendo un spec desde una posición de incertidumbre. Estás escribiendo un spec desde una posición de haber sido interrogado sobre tu pensamiento.

**Fase 2 — Spec (SDD)**

Escribe el SPEC.md desde las decisiones resueltas. Aquí es donde los frameworks SDD entran: el spec se convierte en el artefacto que gating generation. El modelo lo lee antes de escribir cualquier código. Si estás usando Spec Kit, el spec se trata como constitucional. Si estás usando OpenSpec, cada cambio pasa por un proceso de propuesta.

**Fase 3 — Generar con awareness adversaria (Generación socrática)**

Cuando el modelo genera código, el system prompt incluye los guardrails socráticos: identifica el supuesto no declarado, surfacea el single point of failure, output findings como una risk table. El modelo simultáneamente sigue el spec y observa por violaciones del spec.

La diferencia con prompting socrático puro aquí es que el modelo tiene un documento de referencia para verificar — no está operando solo con vibes.

**Fase 4 — Diagnose (Skills' /diagnose)**

Cuando algo sale mal — y va a salir mal — el skill `/diagnose` proporciona el loop de debugging disciplinado: construye un feedback loop, reproduce, hipotetiza, instrumenta, arregla, test de regresión. Aquí es donde el principio socrático ("sé adversario del output") se operacionaliza como un proceso concreto.

## El Conflicto Que No Puedes Resolver

A pesar de toda la complementariedad acima, hay un conflicto genuino que no se resuelve:

**El prompting socrático asume que el spec mismo es la cosa a ser desafiada. SDD asume que el spec es la cosa a ser honrada.**

En un workflow socrático puro, ningún spec es final. Encuentras el defecto, actualizas el spec, regeneras. En un workflow SDD puro, el spec es final hasta que un proceso formal de cambio lo actualiza.

El conflicto es sobre *quién tiene autoridad* para desafiar el spec. En prompting socrático, el modelo es un adversario activo con autoridad para desafiar cualquier cosa — incluyendo el spec. En SDD, solo el humano (o un proceso formal de cambio) puede desafiar el spec; el trabajo del modelo es enforcearlo, no cuestionarlo.

Para sistemas complejos donde el costo de cambiar de dirección tarde es alto, el principio de SDD "el spec es final" es correcto. Para exploración temprana donde no sabes lo que no sabes, el principio de "desafía todo" del prompting socrático es correcto.

La respuesta práctica: usa grilling socrático durante la pre-spec phase (cuando tu intención todavía se está formando y necesitas interrogatorio adversario para encontrar los defectos). Usa enforcement SDD durante la build phase (cuando sabes lo que estás construyendo y necesitas disciplina para mantenerte alineado). Usa evaluación socrática después de la generación (para atrapar lo que el spec perdió).

## Cómo Skills Encaja En Esta Imagen

Skills es interesante aquí porque es el único framework que combina explícitamente grilling (pre-spec) con TDD (build) y diagnose (post-failure). No es un enfoque SDD puro — no requiere un SPEC.md — pero es profundamente compatible con el pensamiento SDD.

Específicamente:

- `/grill-me` y `/grill-with-docs` son la fase pre-spec socrática
- `/tdd` enforce que el código se genere en incrementos pequeños y verificables (la fase de build, con o sin spec)
- `/diagnose` es la evaluación socrática post-fallo
- `/improve-codebase-architecture` es el check anti-entropía periódico

La cosa que Skills no tiene es un *artefacto spec formal* que gating generation. Depende de la sesión de grilling para establecer alineación, y el loop TDD para verificar correctness. Esto funciona bien en muchos contextos — pero para equipos grandes o entornos regulados donde necesitas demostrar que el spec驱动 la implementación (no solo que el código pasa tests), probablemente quieres algo más formal.

## El Skill Diagnose Es Socrático Deguisado

Una cosa que vale la pena notar: el skill `/diagnose` de mattpocock/skills es, estructuralmente, la cosa más socrática en todo el repo de Skills — aunque no se marketing así.

Fase 1 (construir un feedback loop) es la etapa fenomenológica: entiende el bug antes de teorizar sobre él. Fase 3 (hipotetizar) requiere hipótesis rankeadas *antes* de probar — no puedes probar solo la primera idea plausible. Fase 4 (instrumentar) dice cambia una variable a la vez y taggea cada log de debug. Fase 6 (post-mortem) requiere documentar la hipótesis correcta para que el siguiente debugger aprenda.

Esto es método socrático en texto sagrado: auto-corrección estructurada con requisitos explícitos de evidencia. El loop de diagnóstico no confía en la primera explicación. Fuerza una lista rankeada. Exige falsabilidad antes de probar.

Lo que lo hace más útil que un prompt socrático puro es que `/diagnose` tiene proceso — te dice *cuándo* hacer cada cosa (build loop → reproduce → hipotetiza → instrumenta → arregla → regresión → cleanup), no solo *qué* pensar. El método socrático en su forma pura deja el secuenciamento al practitionero. Diagnose supply el secuenciamento.

Esto es por qué `/diagnose` combina tan bien con SDD: cuando el spec ha sido enforced y el código aún estaba mal, necesitas debugging disciplinado, no más alineación. El spec hizo su trabajo. Ahora necesitas el proceso para encontrar el bug real.

## Por Qué Ningún Framework Lo Resuelve Completamente

La razón por la que estos tres enfoques existen por separado — y la razón por la que una solución unificada no ha emergido — es que optimizan por cosas diferentes y esas cosas están genuinamente en tensión.

El prompting socrático optimiza por *pensamiento correcto* antes de la generación. Dice: si no has desafiado tus supuestos, no estás listo. El failure mode que previene es construir lo equivocado porque nunca cuestionaste el spec.

SDD optimiza por *output correcto relativo a intención declarada*. Dice: una vez que has decidido algo, enforcedlo consistentemente. El failure mode que previene es drift — donde la implementación diverge lentamente de lo que quisiste porque no hay referencia persistente.

El grilling de Skills optimiza por *calidad de conversación* antes del compromiso. Dice: sigue preguntando hasta que no quede nada por preguntar. El failure mode que previene es entendimiento parcial — donde ambas partes creen estar alineadas pero están hablando de cosas diferentes.

Estos son todos failure modes legítimos. Y genuinamente entran en conflicto en las fronteras:

- Si aplicas "desafía todo" socrático a la fase de build, nunca shippeas nada — cada decisión de implementación se re-litiga
- Si aplicas "el spec es final" de SDD a la pre-spec phase, te comprometes a un diseño antes de que haya sido desafiado — que es exactamente el failure mode que el prompting socrático fue diseñado para prevenir
- Si aplicas "sigues preguntando" del grilling a una situación donde el spec ya es formal y está locked, no estás usando la herramienta correcta para la fase

Esto es por qué el workflow fase-aware es la respuesta honesta. Cada metodología tiene un caso de uso legítimo. El error es aplicar cualquier metodología única a través de todas las fases.

Los frameworks que han tratado de ser una solución única para todas las fases — BMAD, GSD (Just Ship It), SDD de pila completa — todos terminan forzando un pipeline que no encaja en todas las situaciones, o siendo tan lightweight que no enforce nada en las fronteras.

## El Veredicto Sobre la Convivencia

El prompting socrático y SDD pueden coexistir. Pueden incluso ser genuinamente complementarios. Pero requieren que seas claro sobre *cuándo* cada enfoque aplica:

- **Grilling socrático** es para pre-spec: cuando tu intención todavía se está formando y necesitas interrogatorio adversario para encontrar los defectos
- **SDD** es para build: cuando te has comprometido con una dirección y necesitas disciplina para mantenerte alineado
- **Evaluación socrática** es para post-generación: cuando necesitas un segundo check de que la implementación matches el spec y el spec es sound

Lo que no puedes hacer es aplicar el mindset de "desafía todo" socrático al spec *durante* la fase de build — eso es cómo terminas sin terminar nada. Y no puedes aplicar el mindset de "honra el spec" de SDD a la pre-spec phase — eso es cómo te comprometes a una arquitectura defectuosa porque nunca la desafiaste.

El framework que maneja esto mejor, en mi lectura, es mattpocock/skills — específicamente porque tiene skills dedicados para cada fase: `/grill-me` para pre-spec, `/tdd` para build, `/diagnose` para post-fallo. El diseño es explícitamente fase-aware.

Los frameworks SDD puros (Spec Kit, OpenSpec) no tienen un equivalente a grilling — asumen que el spec es correcto desde el inicio. Los frameworks de prompting socrático no tienen una buena historia para enforcement formal de spec durante build.

El enfoque combinado — socrático pre-spec + SDD durante build + socrático post-generación + diagnose en fallo — es más robusto que cualquier metodología única. También es más complejo, que es por qué la mayoría de la gente default a un enfoque y pierde los beneficios de los otros.

## Un Ejemplo de Integración Concreto

Digamos que estás construyendo una arquitectura Android offline-first. Sin la integración socrática + SDD, podrías hacer esto:

1. Describir la app a Claude
2. Preguntar "¿se ve bien?"
3. Claude dice "sí, ¡gran enfoque!" (sicofancia)
4. Empiezas a construir, golpeas problemas con sync offline que no anticipaste

Con la integración socrática + SDD:

1. Ejecutar `/grill-me` sobre la propuesta de arquitectura
2. El agente pregunta: "¿qué pasa cuando el usuario se va offline a mitad de una transacción?", "¿cómo manejas un conflicto cuando el estado del servidor disagrees con el estado local?", "¿cuál es tu estrategia de recuperación si el sync job es interrumpido?"
3. Estas preguntas exponen defectos en la propuesta de arquitectura
4. Los resuelves — esto produce mejores decisiones de diseño
5. Escribes el SPEC.md desde las decisiones resueltas (incluyendo la estrategia de resolución de conflictos offline)
6. Generas código contra el spec
7. La capa de evaluación socrática verifica: ¿esta implementación realmente maneja el conflicto offline como se specified?
8. Si algo se rompe, `/diagnose` entra

La diferencia: en el primer workflow, la sicofancia del modelo permite que los defectos arquitectónicos sobrevivan hasta la implementación. En el segundo workflow, la fase de grilling los encuentra antes de que se commiteen.

## Referencias

- [mattpocock/skills](/blog/blog-mattpocock-skills) — el enfoque de skills composables
- [Prompts del Método Socrático: Rompiendo la Sicofancia de la IA](/blog/blog-socratic-method-prompts-kotlin-android) — la anatomía del prompt socrático de cuatro componentes
- [Comparativa de Frameworks SDD](/blog/blog-sdd-frameworks-spec-kit-openspec-bmad) — Spec Kit, OpenSpec y BMAD
- [Agentes Socráticos Parte 2: SDD y Sicofancia](/blog/socratic-agents-part-2-sdd-sycophancy) — la relación entre prompting adversario y SDD
- [Skill /diagnose](https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnose/SKILL.md) — el loop de debugging disciplinado de 6 fases
- [Skill /grill-me](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md) — la sesión de alineación antes de programar