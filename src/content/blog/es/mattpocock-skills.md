---
title: "Mattpocock/skills: La Alternativa Composable para Agentes de IA"
description: "Por qué los skills de Matt Pocock son pequeños, composables y opinados — y cómo se comparan con Spec Kit, OpenSpec y BMAD para desarrollo Android asistido por IA."
pubDate: 2026-05-20
lastmod: 2026-05-20
author: ArceApps
keywords:
  - "Mattpocock"
  - "Skills"
  - "Composable"
  - "Agentes IA"
  - "Alternativa"
canonical: "https://arceapps.com/es/blog/mattpocock-skills/"
heroImage: "/images/blog-mattpocock-skills.svg"
tags: ["SDD", "IA", "Skills", "Claude Code", "mattpocock", "Arquitectura"]
reference_id: "b4e7c9a1-5f2d-4e8c-9b3a-7d6e1f2c8a0b"
related_posts:
  - blog-sdd-frameworks-spec-kit-openspec-bmad
  - socratic-agents-part-2-sdd-sycophancy
  - specs-driven-development
---



## El Problema Con Las Metodologías Monolíticas de IA

Matt Pocock tiene una observación que pega duro: métodos como GSD (Just Ship It), BMAD y Spec Kit "try to help by owning the process. But while doing so, they take away your control and make bugs in the process hard to resolve."

Esa frase dice mucho. Lo que está diciendo es: cuando le pasas tu proyecto a un framework que controla el pipeline, también le pasas la responsabilidad del debugging. Y debuggear algo que no entiendes es un tipo especial de sufrimiento.

Esta es la tesis central de [`mattpocock/skills`](https://github.com/mattpocock/skills) — una colección de skills para agentes de codificación (Claude Code, Codex y otros) que son pequeños, composables y expresamente *no* son una metodología de pila completa. Cada skill hace una cosa. Coges los que necesitas. Dejas el resto.

Si has estado leyendo la [comparativa de frameworks SDD](/blog/blog-sdd-frameworks-spec-kit-openspec-bmad) de este blog, sabes que dedicamos muchas palabras a qué hace Spec Kit, qué hace OpenSpec y qué hace BMAD. Skills es una respuesta diferente a la misma pregunta: "¿cómo hago que los agentes de IA sean realmente útiles en lugar de solo complacientes?"

Vamos a ver qué lo hace genuinamente diferente.

## Qué Es Skills En Realidad

Skills es un repositorio de GitHub con unos 15 slash commands y comportamientos que puedes instalar en agentes de codificación. La instalación es un comando:

```bash
npx skills@latest add mattpocock/skills
```

Después de instalar, tu agente gana acceso a comandos como `/grill-me`, `/tdd`, `/diagnose`, `/zoom-out` y `/improve-codebase-architecture`. Los compones según los necesitas. No hay pipeline forzado, no hay secuencia obligatoria, no hay "debes empezar con X antes de Y".

El README expone cuatro failure modes que los skills están diseñados para resolver:

1. **"El Agente No Hizo Lo Que Yo Quería"** — resuelto por `/grill-me` y `/grill-with-docs`
2. **"El Agente Pone Demasiadas Palabras"** — resuelto construyendo un lenguaje compartido del dominio (CONTEXT.md)
3. **"El Código No Funciona"** — resuelto por `/tdd` y `/diagnose`
4. **"Construimos Una Bola de Lodo"** — resuelto por `/improve-codebase-architecture` y `/zoom-out`

Cada skill es un archivo markdown. Puedes leerlos todos. Puedes modificarlos. Puedes borrar los que no te gusten. Ese es el punto — son tus herramientas, no tu metodología.

## Los Cuatro Failure Modes, Examinados

### Failure Mode #1: El Agente No Hizo Lo Que Yo Quería

Este es el problema de desalineación. Lo has visto: describes lo que quieres construir, el agente asiente con entusiasmo, y dos horas después obtienes algo que no tiene nada que ver con tu petición. El agente no estaba mintiendo — genuinamente pensó que entendía. Pero las brechas en tu descripción se convirtieron en brechas en la implementación.

La solución de Pocock es una "sesión de interrogatorio" — hacer que el agente te entreviste implacablemente sobre cada rama del árbol de diseño antes de escribir una sola línea de código. El skill `/grill-me` tiene diez líneas de markdown:

```
Interview me relentlessly about every aspect of this plan
until we reach a shared understanding. Walk down each branch
of the design tree, resolving dependencies between decisions
one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.
```

Eso es todo. Sin plantillas. Sin formularios. Solo: haz preguntas, obtén respuestas, sigue hasta que el árbol esté resuelto.

`/grill-with-docs` extiende esto actualizando también `CONTEXT.md` y ADRs según las decisiones se cristalizan. Durante la sesión:

- Desafía tu vocabulario contra el glosario existente del dominio
- Afila términos vagos ("estás diciendo 'account' — ¿te refieres a Customer o a User?")
- Cruza lo que dices que ocurre con lo que el código realmente hace
- Actualiza la documentación en línea, no en lote al final

La disciplina clave aquí es el lenguaje compartido. Si tu codebase tiene un `CONTEXT.md` que define "materialization cascade" como algo específico, el agente deja de usar "cuando una lección dentro de una sección se hace real" cada vez que necesita referirse a ello. Esta concisión se compound — frases más cortas, menos tokens, menos oportunidades para desalineación.

### Failure Mode #2: El Agente Pone Demasiadas Palabras

Este es sutil. No es que los agentes escupan demasiadas palabras — es que usan las palabras equivocadas. Cuando un codebase tiene terminología establecida, los agentes tienden a re-describir las cosas con sus propias palabras, que son más largas y menos precisas.

La solución es un `CONTEXT.md` en la raíz del proyecto — un glosario de términos del dominio con sus definiciones canónicas. Cuando esto existe, el agente tiene una referencia que consultar en lugar de inventar su propia formulación.

Del README, un ejemplo del antes y después:

- **ANTES**: "There's a problem when a lesson inside a section of a course is made 'real' (i.e. given a spot in the file system)"
- **DESPUÉS**: "There's a problem with the materialization cascade"

Una frase en lugar de un párrafo con paréntesis. El agente puede decir "la materialization cascade falló" y el lector sabe exactamente qué pasó. Esto es el "lenguaje ubicuo" de DDD aplicado al desarrollo asistido por IA.

El skill `/grill-with-docs` construye y mantiene este glosario como efecto secundario de la sesión de interrogatorio. Los términos se definen según se resuelven, no en un taller pre-reunión. La documentación emerge del trabajo, no al revés.

### Failure Mode #3: El Código No Funciona

El tercer failure mode es cuando la alineación está bien pero el agente produce código que no funciona. La causa raíz: no hay feedback loops. El agente escribe código sin saber cómo se ejecuta realmente.

La respuesta de Pocock aquí es `/tdd` y `/diagnose`.

El skill `/tdd` implementa un loop de red-green-refactor pero con un anti-patrón específico que llama "horizontal slicing":

```
MAL (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

BIEN (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
```

Escribir todos los tests primero, después toda la implementación, lleva a tests para comportamiento imaginado en lugar de comportamiento real. Acabas testeando la forma de las estructuras de datos, no las capacidades面向用户. Los tests se vuelven insensibles — pasan cuando el comportamiento se rompe y fallan cuando el comportamiento está bien.

El enfoque correcto es tracer bullets: un test, una implementación, repetir. Cada test responde a lo que aprendiste del ciclo anterior. Porque acabas de escribir el código, sabes exactamente qué comportamiento importa.

El skill `/diagnose` es un loop disciplinado de seis fases para bugs difíciles:

1. Construir un feedback loop (un test que falla, un script curl, una invocación CLI — cualquier cosa con una señal de pass/fail)
2. Reproducir el bug
3. Hipotetizar (generar 3-5 hipótesis rankeadas antes de probar ninguna)
4. Instrumentar (cambiar una variable a la vez)
5. Arreglar + escribir test de regresión antes de arreglar
6. Limpieza + post-mortem

La primera fase es la habilidad real. Pocock nota: "If you have a fast, deterministic, agent-runnable pass/fail signal for the bug, you will find the cause. If you don't have one, no amount of staring at code will save you." Esto es pensamiento de ingeniería aplicado al debugging — invertir esfuerzo desproporcionado en el feedback loop, después dejar que el loop haga el trabajo.

### Failure Mode #4: Construimos Una Bola de Lodo

El cuarto failure mode es la entropía del software. Porque los agentes pueden acelerar drásticamente la codificación, también aceleran la tasa a la que los codebases se vuelven complejos y difíciles de cambiar. Sin disciplina arquitectónica, puedes pasar de codebase limpio a bowl of spaghetti en un fin de semana.

La solución aquí es `/improve-codebase-architecture` — un skill que surface "deepening opportunities": refactors que convierten módulos superficiales en profundos. El skill explora el codebase buscando:

- Módulos donde la interfaz es casi tan compleja como la implementación (superficiales)
- Lugares donde entender un concepto requiere bouncing entre muchos módulos pequeños
- Módulos estrechamente acoplados que leak across their seams
- Áreas sin test o difíciles de testear a través de su interfaz actual

Para cada candidato, produce un informe HTML con diagramas antes/después. Usa el vocabulario del `CONTEXT.md` del proyecto para conceptos del dominio y su propio `LANGUAGE.md` para términos arquitectónicos (module, interface, depth, seam, adapter, leverage, locality).

El concepto arquitectónico clave es **depth**: un módulo profundo tiene una interfaz pequeña y una implementación compleja. Obtienes mucho comportamiento a través de una puerta simple. Un módulo superficial tiene una interfaz casi tan compleja como lo que hace — es mayormente un passthrough, y borrarlo concentraría complejidad en lugar de removerla.

Esto es "A Philosophy of Software Design" de John Ousterhout aplicado al desarrollo asistido por IA. Y importa más con agentes de IA, porque los agentes crean módulos más rápido de lo que los humanos pueden pensar en sus interfaces.

## El Skill de Triage y la Metáfora de la Máquina de Estados

Un skill que no hemos mencionado aún: `/triage`. Implementa una máquina de estados para el triage de issues. Cada issue en tu tracker pasa por una secuencia de roles de triage (`needs-triage`, `ready-for-afk`, etc.), y el skill gestiona las transiciones entre ellos.

La parte interesante no es la máquina de estados en sí — es la filosofía. La asunción de Pocock es que cuando trabajas con un agente de IA en un proyecto real, probablemente lo haces de forma asíncrona. Le asignas trabajo al agente, corre, vuelves más tarde. El sistema de triage es una forma de comunicar estado sobre lo que está pasando sin estar frente al agente.

Este es un insight de meta-nivel: construir workflows asistidos por IA no es solo hacer agentes más inteligentes. Es construir la infraestructura alrededor de ellos — issue trackers, convenciones de documentación, glosarios de lenguaje — que hacen a los agentes efectivos con el tiempo.

El skill `/setup-matt-pocock-skills` scaffold esta infraestructura por ti. Cuando lo ejecutas en un repo nuevo, pregunta:

- Qué issue tracker quieres (GitHub, Linear, o archivos locales)
- Qué labels aplicas a los tickets cuando los triages
- Dónde quieres guardar la documentación

Y después configura todos los otros skills para que usen esa infraestructura. Esta es la diferencia entre "una colección de tips" y "un sistema real" — los skills están diseñados para consumir y producir artefactos que viven en tu repo.

## El Skill Caveman: Compresión de Comunicación

El skill `/caveman` es un modo de comunicación que corta el uso de tokens en un 75% eliminando filler, artículos y cortesías mientras mantiene la precisión técnica completa.

```markdown
# Ejemplo

No: "Sure! I'd be happy to help you with that. The issue you're
      experiencing is likely caused by..."

Sí: "Bug in auth middleware. Token expiry check use `<` not `<=`. Fix:"
```

El patrón es: `[cosa] [acción] [razón]. [siguiente paso].`

Esto puede parecer gimmick, pero hay un insight real aquí. Cuando trabajas con una sesión de agente que tiene límites de contexto, cada palabra innecesaria es un impuesto sobre la conversación. Si puedes comunicar la misma sustancia técnica en un cuarto de los tokens, puedes tener conversaciones más profundas antes de llegar a los límites.

El modo caveman es especialmente útil cuando estás debuggeando — quieres señal precisa, no prosa. El skill se activa bajo demanda ("talk like caveman") y se queda activo hasta que lo apagas.

## El Skill Handoff: Continuidad Entre Sesiones

El skill `/handoff` compacta la conversación actual en un documento para que un agente fresco pueda continuar el trabajo en una sesión nueva. Guarda en el directorio temporal del OS (no el workspace), incluye skills sugeridos para la siguiente sesión, y redacta información sensible automáticamente.

Esto resuelve un problema real para workflows asíncronos: trabajas con un agente, haces progreso, terminas la sesión, y vuelves al día siguiente para encontrar que el agente ha olvidado dónde lo dejaste. El documento de handoff captura el estado actual, las decisiones tomadas, el trabajo restante y el contexto relevante del proyecto.

La disciplina clave: no duplica lo que ya está en otros artefactos (PRDs, planes, ADRs, issues, commits, diffs). Los referencia. Esto significa que el handoff se mantiene pequeño y focused — es un bridge, no un replacement del sistema de documentación.

## El Skill Prototype: Validación Barata de Diseño

El skill `/prototype` es para construir prototipos desechables cuando necesitas validar un diseño antes de comprometerte con él. Distingue entre dos casos:

1. Una app de terminal ejecutable para preguntas de estado/lógica de dominio — cuando no estás seguro del modelo de datos o la lógica de dominio
2. Varias variaciones de UI radicalmente diferentes conmutables desde una ruta — cuando no estás seguro de qué dirección de UX tomar

El insight: los prototipos deben ser baratos y desechables. Si te encuentras queriendo guardar el prototipo, eso significa que deberías haberlo construido correctamente desde el principio. El skill dice explícitamente: constrúyelo, valida el diseño, bórralo.

Esta es una relación saludable con el prototipado que muchos equipos struggled with. El prototipo es una pregunta, no un asset. Una vez que tienes la respuesta, el trabajo del prototipo está hecho.

## Skills Que Vale La Pena Conocer Específicamente

No todos los skills en el repo son iguales. Algunos son de uso ocasional (como `/scaffold-exercises` o `/setup-pre-commit`). Otros son daily drivers que cambian cómo trabajas. Aquí hay un mapa rápido del landscape:

**Daily drivers** (usar constantemente):
- `/grill-me` — alineación antes de cualquier trabajo significativo
- `/grill-with-docs` — igual que arriba, pero mantiene documentación
- `/tdd` — loop red-green-refactor para cualquier código nuevo
- `/diagnose` — cuando algo está roto y necesitas disciplina

**Semanales u ocasionales** (usar cuando se necesita):
- `/improve-codebase-architecture` — ejecútalo cada pocos días para atrapar entropía temprano
- `/zoom-out` — cuando estás perdido en código desconocido y necesitas contexto
- `/to-prd` — cuando has discutido algo suficiente para convertirlo en ticket
- `/to-issues` — cuando tienes un plan y necesitas dividirlo en slices verticales

**Setup e infraestructura** (ejecutar una vez por repo):
- `/setup-matt-pocock-skills` — configura el issue tracker y el layout de documentación
- `/migrate-to-shoehorn` — migración única para aserciones de tipo en tests de TypeScript
- `/git-guardrails-claude-code` — configura hooks de seguridad en git para operaciones peligrosas

**Gimmicky pero útiles** (casos nicho):
- `/caveman` — comprimir comunicación para sesiones con límites de contexto
- `/handoff` — continuidad entre sesiones para workflows asíncronos
- `/prototype` — validar diseños antes de comprometerse con ellos
- `/scaffold-exercises` — crear entornos de práctica estructurados

El skill que más praise recibe en la comunidad es `/grill-with-docs`. La razón: resuelve el problema más caro en desarrollo asistido por IA, que es la desalineación entre lo que quisiste y lo que el agente construyó. Todo lo demás — TDD, diagnose, architecture review — es refinamiento. Grilling es prevención.

## Lo Que Esto No Hace (La Parte Honesta)

Skills no es un framework de pila completa. Te da herramientas pero no un pipeline. Si quieres un agente que controle todo el proceso — definir specs, generar código, correr tests, desplegar — necesitas otra cosa. Skills es para cuando quieres quedarte en el asiento del conductor y usar IA como herramienta de poder, no como piloto automático.

Tampoco resuelve el problema de "qué debería construir?". Las sesiones de interrogatorio te ayudan a clarificar lo que quieres decir, pero asumen que ya tienes una visión de lo que estás intentando crear. Si estás buscando un agente que genere ideas de producto desde cero, esto no es eso.

También hay un costo de onboarding genuino. Leer y entender 15 skills, decidir cuáles aplican a tu workflow, y después train yourself para invocarlos en los momentos correctos lleva tiempo real. El installer de skills.sh hace la configuración fácil, pero la adopción no lo es.

## Cómo Se Compara a los Frameworks Que Revisamos

En nuestra [comparativa de frameworks SDD](/blog/blog-sdd-frameworks-spec-kit-openspec-bmad), encontramos tres filosofías distintas:

- **Spec Kit**: Enfoque constitucional — tu proyecto tiene un `SPEC.md` que se trata como la fuente de verdad. Los agentes lo leen antes de generar código.
- **OpenSpec**: Enfoque de propuesta de cambio — cada modificación pasa por un proceso de revisión que produce un documento titled antes de escribir cualquier código.
- **BMAD**: Enfoque organizacional — un equipo multi-agente donde diferentes agentes ownership diferentes fases del lifecycle.

Skills es una cuarta filosofía: **toolbox sobre pipeline**. Tú controlas el proceso; las herramientas te apoyan. No hay secuencia forzada, no hay artefacto obligatorio, no hay "debes empezar aquí antes de hacer eso". Invocas `/grill-me` cuando necesitas alineación. Invocas `/tdd` cuando necesitas construir algo test-first. Invocas `/improve-codebase-architecture` cuando las cosas se están volviendo feas.

El trade-off es real: con frameworks, obtienes consistencia a costa de flexibilidad. Con Skills, obtienes flexibilidad a costa de consistencia. Equipos que saben lo que hacen y quieren mantener el control probablemente preferirán Skills. Equipos que quieren guardrails y no les importa las constraints podrían preferir Spec Kit o BMAD.

## El Punto del Lenguaje Compartido Está Subestimado

Una cosa que no hemos enfatizado lo suficiente en nuestros artículos anteriores sobre SDD: el valor de construir un lenguaje compartido con tu agente de IA va mucho más allá de reducir la verbosidad.

Cuando tu agente entiende los términos del dominio en tu proyecto, comete menos errores sobre a qué te refieres. Las variables, funciones y archivos se nombran consistentemente. El codebase se vuelve más fácil de navegar — para el agente y para ti. Y el agente gasta menos tokens en pensar porque tiene acceso a un lenguaje más conciso.

Pocock llama a esto "the single coolest technique in this repo." Creo que tiene razón. El glosario es el regalo que sigue dando: cada sesión, el agente se vuelve más inteligente sobre tu dominio sin que tengas que re-explicar los basics.

Si estás trabajando en un proyecto con lógica de dominio compleja — y la mayoría de apps Android con requisitos de negocio reales lo hacen — el tiempo invertido en construir un `CONTEXT.md` paga inmediatamente. El skill `/grill-with-docs` lo construye como efecto secundario de la sesión de alineación, lo que significa que ni siquiera tienes que planificar la documentación. Emerge del trabajo.

## El Veredicto

Skills es el anti-framework para desarrolladores que no quieren un framework. Si eres el tipo de desarrollador que lee El Programador Pragmático y piensa "sí, eso es exactamente correcto" — da pequeños pasos deliberados, cuidado con el diseño todos los días, usa la herramienta correcta para el trabajo — entonces Skills se sentirá familiar. Son principios de ingeniería encoded como skills de agente, no una metodología construida alrededor de una herramienta específica.

Los cuatro failure modes que aborda son reales. Las soluciones son concretas y auditables. Y porque cada skill es solo un archivo markdown, puedes inspect exactamente lo que está haciendo, modificarlo para tu contexto, o throw it away si no encaja.

El riesgo principal es que requiere que pienses. Las sesiones de interrogatorio, el lenguaje compartido, las revisiones arquitectónicas — nada de esto sucede automáticamente. El agente hace el trabajo, pero tú tienes que drive el proceso. Si estás buscando algo que funcione sin tu involucración, mira BMAD. Si quieres mantener el control y estás dispuesto a pensar, dale una oportunidad a Skills.

El repo tiene alrededor de 60,000 suscriptores al newsletter y mantenimiento activo. Los skills funcionan con cualquier modelo — Claude Code, Codex, u otros. Están basados en décadas de experiencia en ingeniería de alguien que claramente ha shipping código real y debuggeado bugs reales.

Eso vale algo. Las mejores prácticas en `/diagnose` y `/tdd` no son teóricas — son el tipo de disciplina que viene de ver a ingenieros talentosos trabajar y encoded lo que los hace efectivos.

## Referencias

- [mattpocock/skills GitHub Repository](https://github.com/mattpocock/skills)
- [skills.sh Installer](https://skills.sh/b/mattpocock/skills)
- [Matt Pocock's Newsletter (~60,000 suscriptores)](https://www.aihero.dev/s/skills-newsletter)
- [The Pragmatic Programmer, Thomas & Hunt](/blog/blog-sdd-frameworks-spec-kit-openspec-bmad)
- [Domain-Driven Design, Eric Evans](/blog/blog-sdd-frameworks-spec-kit-openspec-bmad)
- [A Philosophy of Software Design, John Ousterhout](/blog/blog-sdd-frameworks-spec-kit-openspec-bmad)
- Artículos anteriores sobre SDD en este blog: [Comparativa de Frameworks SDD](/blog/blog-sdd-frameworks-spec-kit-openspec-bmad), [Agentes Socráticos y Sicofancia](/blog/socratic-agents-part-2-sdd-sycophancy), [Specs-Driven Development](/blog/specs-driven-development)