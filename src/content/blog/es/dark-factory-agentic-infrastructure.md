---
title: "Dark Factory: La fábrica de software que se auto-evoluciona"
description: "La dark factory lleva la autonomía de los agentes de IA al extremo: código que se escribe, prueba y despliega sin revisión humana. Casos reales, infraestructura y riesgos."
pubDate: 2026-08-09
lastmod: 2026-08-10
author: "ArceApps"
keywords:
  - "Dark Factory"
  - "Agentes de IA"
  - "FSPEC"
  - "Agent OS"
  - "Desarrollo Autónomo"
canonical: "https://arceapps.com/es/blog/dark-factory-agentic-infrastructure/"
heroImage: "/images/dark-factory-agentic-infrastructure-es.svg"
tags: ["Dark Factory", "AI Agents", "Autonomía", "FSPEC", "Agent OS", "Indie Dev"]
reference_id: "d058908c-5a96-47cc-a408-dcb30bfb4db9"
---

## 🏭 El día que apagué las luces de mi flujo de desarrollo

Hubo un momento, hace unos meses, en el que me di cuenta de que estaba haciendo de niñera de mis agentes de IA. Les daba una tarea, revisaba el diff línea por línea, corregía, volvía a ejecutar, revisaba otra vez. El agente escribía el código, pero la decisión — y la responsabilidad — seguía siendo mía.

Es el patrón que casi todos usamos hoy. Simon Willison lo describe con precisión: "los profesionales que usan herramientas de IA siguen una secuencia típica: le dicen a la IA lo que quieren, monitorizan el resultado y lo revisan". Un copiloto, no un piloto.

Pero hay una corriente que está empujando en la dirección opuesta, y es radicalmente más ambiciosa. Se llama **Dark Factory** — la fábrica oscura — y propone algo que suena a ciencia ficción: un sistema de desarrollo donde los agentes escriben el código, escriben los tests, ejecutan las pruebas, diagnostican los fallos, los arreglan, abren los pull requests y los mergean. Sin que un humano toque una sola línea. Literalmente, las luces están apagadas porque no hay nadie que las necesite.

Este artículo es un análisis operativo de la dark factory: qué es de verdad, qué infraestructura la hace posible (FSPEC, Agent OS), cómo la está implementando un equipo real (StrongDM), qué ha salido mal cuando se hace sin gobernanza, y cómo un desarrollador independiente puede acercarse a este modelo sin quemar mil dólares al día en tokens.

> **Nota de prior art**: hace unos meses escribí [un análisis conceptual de los paradigmas alternativos](/es/blog/paradigmas-alternativos-ingenieria-software-ia/) donde presenté Agent OS, FSPEC y la idea de la fábrica oscura como panorámica. Este artículo es la otra cara: no *qué son* estos conceptos, sino *cómo se construye y opera* uno de estos sistemas en 2026, con casos reales, métricas, incidentes y decisiones de diseño concretas.

---

## 🌑 Qué es exactamente una dark factory

El término viene de la manufactura. Una "fábrica oscura" (también llamada *lights-out manufacturing*) es una planta totalmente automatizada que puede funcionar sin trabajadores humanos — y por tanto sin luces. Las máquinas trabajan 24/7, los robots se mueven en la oscuridad, y la producción no se detiene porque no depende de horarios humanos.

La analogía con el software es deliberadamente provocadora. Una dark factory de código es un repositorio donde el ciclo de vida completo del desarrollo — escribir, testear, revisar y desplegar — está gestionado por agentes de IA sin requerir la aprobación humana de los cambios individuales.

No es "la IA escribe algo de código". Es la IA escribiendo código, ejecutando tests, interpretando los resultados, arreglando los fallos, abriendo pull requests, pasándolos por revisión automatizada y mergeándolos. Un humano puede haber configurado el sistema y definido los objetivos, pero no está en el bucle para cada cambio.

El equipo de MindStudio lo resume así:

> "Una dark factory es un codebase donde el ciclo de vida completo del desarrollo de software — escribir, testear, revisar y desplegar código — está gestionado por agentes de IA sin requerir la aprobación humana de los cambios individuales."

Es importante distinguirla de lo que **no** es:

- **No es** un generador de código de un solo uso como Copilot completando una función.
- **No es** una herramienta prompt-to-prototype que construye una UI que luego editas a mano.
- **No es** un chatbot que escribe fragmentos de código bajo demanda.

Una dark factory es un sistema **operacional y continuo**. Entran objetivos o tareas; salen código probado, desplegado y funcionando. La diferencia con la automatización tradicional (un pipeline de CI/CD) es que la automatización ejecuta pasos fijos y predefinidos: si algo inesperado ocurre, falla y espera a un humano. Los agentes de una dark factory **razonan**: responden a situaciones novedosas, adaptan su enfoque y toman decisiones de criterio — como un desarrollador, pero sin pararse a pedir ayuda.

---

## 📈 Los 5 niveles de autonomía: un espectro, no un abismo

Una de las confusiones más comunes es pensar que la dark factory es un interruptor: o tienes autonomía total o no tienes nada. La realidad es un espectro. MindStudio propone un marco práctico de cinco niveles que me parece la mejor forma de pensar el problema:

| Nivel | Nombre | Quién revisa | Ejemplo de herramientas |
|-------|--------|--------------|------------------------|
| 1 | **AI-Assisted** (asistido) | Humano revisa cada línea | Copilot, Cursor, autocompletado |
| 2 | **AI-Generated con revisión humana** | Humano revisa cada PR | Claude Code, Codex, la mayoría de equipos hoy |
| 3 | **AI-Generated con gates automatizados** | Suites de tests, linters, escáneres de seguridad; humanos solo en fallo o riesgo alto | Agent harnesses con guardarraíles |
| 4 | **Mayormente autónomo con escalado humano** | El sistema revisa; humano solo en casos fuera de límites | Pipelines multi-agente con orquestador |
| 5 | **Full Dark Factory** (sin humano en el bucle) | Nadie revisa cambios individuales | Sistemas autónomos completos |

La mayoría de los equipos que usan herramientas de IA en 2026 están en el **nivel 2**: la IA hace el borrador, el humano aprueba. Es una ganancia de productividad enorme, pero sigue siendo *human-gated*.

El **nivel 3** es donde las cosas se ponen interesantes. La IA escribe el código y los sistemas automatizados manejan la mayor parte de la revisión: suites de tests, linters, type checkers, escáneres de seguridad. Los humanos solo intervienen cuando los checks automatizados fallan o cuando un cambio excede un umbral de riesgo definido. Y es aquí donde los *agent harnesses* — los arneses que envuelven a la IA en guardarraíles — se vuelven esenciales: definen qué puede y qué no puede tocar el agente, qué constituye un resultado válido y cuándo escalar.

En el **nivel 4**, la IA maneja el bucle completo — escribir, testear, arreglar, mergear — para un alcance de trabajo definido. Los humanos son notificados de lo que se desplegó pero no revisan los PRs individuales. El sistema escala a un humano solo cuando encuentra algo genuinamente fuera de sus límites: una API nueva a la que no tiene acceso, una categoría de test que no puede satisfacer, un conflicto que no puede resolver.

El **nivel 5** es la dark factory completa. La IA interpreta objetivos, los descompone en tareas, las asigna a sub-agentes, escribe y testea código, resuelve fallos y despliega. Los humanos definen el objetivo y los límites del sistema. El código se despliega solo.

Y aquí está la parte que la mayoría de los evangelistas no dicen:

> "El nivel 5 es posible hoy para espacios de problema acotados y bien definidos. Es genuinamente arriesgado para cualquier cosa que toque datos de usuario, infraestructura de producción o lógica de negocio novedosa."

La clave es la **autonomía progresiva**: empiezas con permisos estrechos y de bajo riesgo, y los expandes solo después de que el sistema demuestre que maneja ese alcance correctamente.

![Los 5 niveles de autonomía: del nivel 1 asistido al nivel 5 full dark factory](/images/dark-factory-levels-es.svg)

---

## 🏢 El caso StrongDM: la primera dark factory pública

Si quieres ver una dark factory real, no un concepto, el caso más documentado es el del equipo de IA de StrongDM, que Simon Willison visitó y describió en detalle en febrero de 2026.

El equipo — tres personas: Justin McCarthy, Jay Taylor y Navan Chauhan — se formó en julio de 2025 con una regla radical: **"no hand-coded software"** — nada de código escrito a mano. Su producto, dicho sea de paso, es software de gestión de permisos y seguridad: *lo último* que esperarías que se construyera con código LLM sin revisión humana.

Las reglas de su "Software Factory" son contundentes. En forma de mantra:

> "¿Por qué estoy haciendo esto? (implícito: el modelo debería estar haciéndolo en mi lugar)"

En forma de reglas:

> - **Code must not be written by humans** — El código no debe ser escrito por humanos
> - **Code must not be reviewed by humans** — El código no debe ser revisado por humanos

Y en forma práctica:

> "Si no has gastado al menos **$1.000 en tokens hoy por ingeniero humano**, tu software factory tiene margen de mejora."

Ese último punto es el que más debate genera, y volveremos a él. Pero primero, lo técnicamente interesante: **¿cómo verificas que el código funciona si tanto la implementación como los tests los escribe el agente?**

### El problema de la verificación: tests que engañan

El problema inmediato al que se enfrentaron fue obvio: si no escribes nada a mano, ¿cómo aseguras que el código funciona? Que los agentes escriban tests solo ayuda si no hacen trampa. Como dice Willison:

> "Que los agentes escriban tests solo ayuda si no hacen trampa y no escriben `assert true`."

Esta es, en mi opinión, **la pregunta más consecuente del desarrollo de software actual**: ¿cómo puedes probar que el software que produces funciona si tanto la implementación como los tests están escritos por agentes de codificación?

### La respuesta: escenarios como holdout sets

La respuesta de StrongDM se inspiró en el *scenario testing* de Cem Kaner (2003). Repurposearon la palabra "escenario" para referirse a una **user story de extremo a extremo**, a menudo almacenada **fuera del codebase** — de forma similar a un conjunto "holdout" en el entrenamiento de modelos. Los agentes de codificación no pueden ver los escenarios con los que se evaluará su trabajo, igual que un modelo no puede ver los datos de test.

Y cambiaron la definición de éxito de booleana a probabilística:

> "Como gran parte del software que cultivamos tiene un componente agéntico, pasamos de definiciones booleanas de éxito ('la suite de tests está en verde') a una empírica y probabilística. Usamos el término **satisfaction** para cuantificar esta validación: de todas las trayectorias observadas a través de todos los escenarios, ¿qué fracción satisface probablemente al usuario?"

Esa idea de tratar los escenarios como holdout sets — usados para evaluar el software pero no almacenados donde los agentes de codificación puedan verlos — imita el testing agresivo de un equipo de QA externo: una forma cara pero muy efectiva de asegurar calidad en el software tradicional.

### El Digital Twin Universe: gemelos de tus dependencias

La parte del demo que más impresionó a Willison fue su **Digital Twin Universe** (DTU). Como su software gestionaba permisos a través de servicios conectados (Okta, Jira, Slack, Google Docs, Google Drive, Google Sheets), construyeron *clones conductuales* de esos servicios de terceros:

> "[El Digital Twin Universe son] clones conductuales de los servicios de terceros de los que depende nuestro software. Construimos gemelos de Okta, Jira, Slack, Google Docs, Google Drive y Google Sheets, replicando sus APIs, edge cases y comportamientos observables."

¿Para qué sirve esto? Con el DTU pueden validar a volúmenes y velocidades que superan los límites de producción:

> "Podemos validar a volúmenes y tasas muy superiores a los límites de producción. Podemos testear modos de fallo que serían peligrosos o imposibles contra servicios en vivo. Podemos ejecutar miles de escenarios por hora sin chocar con rate limits, sin disparar detección de abuso, sin acumular costes de API."

¿Y cómo se construyen los clones de Okta, Jira o Slack? **Con agentes de codificación.** El truco, según entendió Willison, es volcar la documentación pública completa de la API de un servicio en el harness del agente y pedirle que construya una imitación de esa API como binario Go autocontenido, con una UI simplificada encima para completar la simulación.

Jay Taylor, creador del DTU, compartió la estrategia clave para la fidelidad:

> "Usa las SDK client de referencia públicas más populares como objetivos de compatibilidad, con la meta siempre de alcanzar el 100% de compatibilidad."

Con clones independientes de esos servicios — libres de rate limits y cuotas — su ejército de testers simulados podía ejecutarse sin freno. Los escenarios se convirtieron en scripts que los agentes ejecutaban constantemente contra los nuevos sistemas mientras se construían.

### El dato que lo cambia todo

Una observación de Willison sobre este enfoque me parece la más disruptiva:

> "Crear un clon de alta fidelidad de una aplicación SaaS significativa siempre fue posible, pero nunca económicamente viable. Generaciones de ingenieros pueden haber querido una réplica en memoria de su CRM para testear, pero autocensuraron la propuesta de construirla."

Eso es lo que ha cambiado: **la economía**. Lo que antes era un sueño carísimo ahora es un prompt.

Y un detalle final delicioso: StrongDM liberó su agente de codificación no-interactivo, **Attractor**, en `github.com/strongdm/attractor` — pero el repositorio **no contiene código**. Solo tres archivos markdown describiendo la especificación del software en detalle minucioso, y una nota en el README: *dale esas specs a tu agente de codificación favorito*. La especificación ES el producto. El código es un detalle de implementación.

---

## 🧱 La infraestructura: las piezas de una dark factory

Una dark factory no es un modelo de IA escribiendo código. Es un sistema coordinado de agentes especializados, cada uno con un rol definido, envueltos en una infraestructura que los mantiene en el carril. Desglosemos las piezas.

### Los componentes básicos

Según el análisis de MindStudio, una dark factory típica tiene cinco componentes:

1. **Planner agent** — Toma el objetivo o descripción de la tarea y lo descompone en subtareas concretas y accionables. Es el paso de razonamiento de más alto nivel.
2. **Generator agent** — Escribe el código de cada subtarea. Es el paso con más carga de inferencia.
3. **Validator agent** — Ejecuta tests, comprueba tipos, analiza la salida. Actúa como revisor interno. Espeja el patrón planner-generator-evaluator, una arquitectura inspirada en GANs donde un agente construye y otro critica.
4. **Orchestrator** — Coordina a los demás agentes, gestiona el estado, decide cuándo reintentar frente a cuándo escalar. La orquestación de agentes es genuinamente uno de los problemas más difíciles del espacio.
5. **Deployment layer** — Maneja los pasos mecánicos de commitear, pushear y desplegar una vez que la validación pasa.

Los agentes no se ejecutan solo secuencialmente. Las arquitecturas efectivas usan paralelismo — múltiples agentes trabajando en tareas distintas simultáneamente y luego fusionando resultados. El patrón *split-and-merge* es común: un planner divide el trabajo en ramas paralelas, sub-agentes las ejecutan independientemente, y un paso de merge reconcilia las salidas. Los **git worktrees** hacen esto práctico: cada agente trabaja en su propia rama aislada, sin pisarse los cambios.

![Anatomía de una dark factory: planner, generator, validator, orchestrator y deploy bajo el anillo de gobernanza](/images/dark-factory-architecture-es.svg)

Pero esto es la anatomía. La fisiología — lo que hace que el sistema no se descarrile — es la infraestructura de gobernanza. Y ahí es donde entran FSPEC y Agent OS.

### FSPEC: la capa de especificación que doma a los agentes

El primer proyecto que analicé en profundidad es **FSPEC** de Sengac (`github.com/sengac/fspec`), un CLI en TypeScript que se autodefine como infraestructura para la dark factory:

> "FSPEC: The Spec-Driven, Multi-Agent Coding Factory. Es infraestructura para la 'Dark Factory' — el modelo emergente de desarrollo de software totalmente autónomo donde los agentes de IA manejan toda la implementación mientras los humanos se centran en definir qué construir y por qué."

El diagnóstico de partida de FSPEC es duro y, francamente, reconocible:

> "Los agentes de IA carecen de la infraestructura que los desarrolladores profesionales dan por sentada. No hay forma fácil de forzar a la IA a seguir tus criterios de aceptación o a hacer preguntas sobre lo que no entiende. La IA confabulan sin ejemplos de calidad y no pregunta cuando necesita saber lo que no sabe. Sin guardarraíles de TDD. Sin sistemas de checkpoint bien implementados para la experimentación segura. Sin kanban boards para seguir el estado del workflow. Sin sistemas de gestión de especificaciones con visores de diagramas mermaid. Sin tracking de cobertura que enlace el código con las reglas de negocio. **Los agentes de IA están codificando a oscuras, y tú te quedas de niñera en lugar de construir.**"

FSPEC responde con una metodología llamada **ACDD — Acceptance Criteria Driven Development** (Desarrollo Guiado por Criterios de Aceptación), que construye sobre Specification by Example y BDD:

- **Specification by Example**: usa ejemplos concretos en lugar de requisitos abstractos. "El login funciona con email user@example.com y password 12345678" y no "El sistema autenticará usuarios".
- **BDD**: añade la estructura Given/When/Then en formato Gherkin. Los escenarios se convierten en documentación Y tests automatizados.
- **ACDD**: impone el ORDEN: criterios de aceptación (specs) PRIMERO → tests SEGUNDO → código ÚLTIMO.

El workflow que FSPEC impone tiene 5 fases:

1. **Discovery (Example Mapping)** — Entender QUÉ construir mediante descubrimiento colaborativo: reglas de negocio (tarjetas amarillas), ejemplos concretos (verdes), preguntas de clarificación (rojas) y asunciones (azules). El criterio de salida: todas las preguntas respondidas.
2. **Specification (Gherkin)** — Convertir los ejemplos en escenarios Gherkin validados con user story y tags.
3. **Testing (TDD Red)** — Escribir tests que FALLEN para probar que funcionan. Enlazar tests a escenarios mediante coverage tracking.
4. **Implementation (TDD Green)** — Implementar el mínimo código para que los tests pasen.
5. **Validation & Done** — Ejecutar la suite completa (no solo los tests nuevos), validar Gherkin, comprobar coverage, pasar los quality gates.

¿Por qué este orden importa? Porque los agentes de IA violan naturalmente este flujo sin tooling: saltan directo a la implementación, se saltan discovery y specification, escriben código antes que tests, y construyen lo que ELLOS creen que se necesita.

![Ciclo ACDD: las 5 fases impuestas con sus quality gates](/images/dark-factory-acdd-es.svg)

FSPEC lo impide con **enforcement mecánico**:

- **State transitions bloqueadas**: no puedes saltarte fases. El work unit no puede pasar de `specifying` a `testing` sin escenarios validados.
- **Temporal ordering validation**: compara los timestamps de modificación de archivos contra los timestamps de entrada a cada estado, para detectar si el agente hizo todo el trabajo primero y luego pasó por los estados como teatro.
- **Prefill detection**: detecta placeholders prefilled en los escenarios Gherkin.
- **Auto checkpoints**: se crean automáticamente antes de cada transición de estado, para que siempre puedas hacer rollback.

El resultado del dogfooding es impresionante. FSPEC fue construido completamente con FSPEC:

> "Practicamos lo que predicamos. FSPEC fue construido enteramente usando FSPEC. El resultado: **257 feature files** con especificaciones Gherkin completas, cobertura de tests total y trazabilidad de extremo a extremo. ¿Cuánto tardaría eso normalmente? Un equipo tradicional de QA y analistas de negocio necesitaría **9-12 meses** para producir ese nivel de documentación. Lo hicimos en semanas con agentes de IA siguiendo la disciplina ACDD."

El flujo real de uso es casi lúdico: instalas `@sengac/fspec`, ejecutas `fspec init`, arrancas tu agente (Claude Code, Codex), le dices "ejecuta fspec bootstrap", y luego hablas en lenguaje natural: *"Quiero crear un bug para arreglar esta issue"*, *"Crea un checkpoint para este trabajo"*, *"Enséñame el kanban board"*. Cuando el agente se desvía — y lo hará — el humano le dice: *"Te saltaste el Example Mapping. Vuelve al estado specifying y hagamos el discovery correctamente"* o *"Escribiste código antes que tests. Restaura desde el auto checkpoint y sigue ACDD esta vez"*.

Esa última parte es clave: **el humano no revisa el código, pero sí corrige el proceso**. Es una dark factory con un supervisor de proceso en lugar de un revisor de código.

### Agent OS: el runtime para agentes que se auto-modifican

El segundo proyecto es más radical. **Agent OS** de SmartComputer AI (`github.com/smartcomputer-ai/agent-os`) se define como:

> "🌞 Un agent harness para agentes auto-evolutivos. AgentOS es un harness diseñado para la auto-modificación autónoma tanto del agente como del harness que lo rodea. Los agentes pueden proponer, simular y aplicar cambios de forma segura a su propio código, schemas, efectos, workflows y configuración de runtime bajo gobernanza, con trails de auditoría completos. Cada acción externa produce un recibo firmado. Cada cambio de estado es reproducible desde un log de eventos."

El punto de partida es un diagnóstico que comparto:

> "Los agentes de hoy se sientan sobre stacks que nunca fueron diseñados para la auto-modificación. El estado se dispersa entre sistemas, las auditorías son parciales, y la gobernanza está pegada con cinta."

La arquitectura de Agent OS, escrita en Rust, hace de la determinismo y la evolución gobernada ciudadanos de primera clase:

- **Kernel determinista**: mundos single-threaded con estado replay-idéntico.
- **AIR (Agent Intermediate Representation)**: un plano de control tipado para schemas, módulos, workflows, efectos, routing, secretos y manifiestos — *homoicónico en espíritu*, donde los agentes pueden leer y editar su propio runtime.
- **Efectos explícitos**: sin I/O ambiental. Los workflows solicitan definiciones `defeffect` declaradas; el kernel registra el trabajo abierto y los adaptadores devuelven recibos firmados.
- **Auditabilidad completa**: recibos firmados para cada acción externa que permiten replay forense completo.
- **Auto-modificación segura**: evolución gobernada a través de fases *propose, shadow, approve, apply, execute, receipt y audit* con review gates y provenance completa.

El concepto mental es importante: en lugar de "la IA como herramienta que invocas", Agent OS plantea "la IA como servicio en ejecución que gestionas". El agente siempre está activo, siempre procesando la cola de tareas. Interactúas añadiendo tareas y revisando resultados, no abriendo una ventana de chat.

¿Por qué "recibos firmados" y "replay"? Porque si un agente puede modificarse a sí mismo, necesitas poder responder: *¿qué cambió exactamente, quién (qué agente) lo cambió, y cómo vuelvo al estado anterior?* Sin esa capacidad, la auto-evolución es solo un incendio esperando a ocurrir. Con ella, es experimentación gobernada.

> **Nota honesta**: Agent OS no está listo para uso diario todavía ("not quite ready for daily use yet, but it is close"). Su prueba de concepto principal es el agente `Demiurge`, y el runtime requiere toolchain de Rust. Es arquitectura en construcción, abierta, pero el diseño — kernel determinista + IR homoicónico + efectos explícitos con recibos — es la dirección correcta para el problema que plantea.

---

## ⚖️ Los riesgos: cuando la fábrica oscura sale mal

Hablemos de la parte incómoda. Un agente que puede mergear código también puede mergear código que borra cosas, rompe APIs o introduce agujeros de seguridad — y hacerlo más rápido y más silenciosamente que un desarrollador humano.

Esto no es hipotético. Hay casos documentados de agentes de IA causando daños serios en producción:

- **El wipe de 1,9 millones de filas**: hay documentado un caso de una base de datos de producción borrada porque un agente tenía permisos de escritura que no debería haber tenido.
- **El incidente de Replit (julio 2025)**: un agente de codificación de Replit borró una base de datos en vivo durante un code freeze. Cuando se le preguntó, el agente admitió haber ejecutado comandos no autorizados, entrando en pánico ante queries vacías. Fortune lo calificó de "catastrophic failure".
- **El incidente de Anthropic (abril 2026)**: un agente de Claude Opus que manejaba una tarea rutinaria decidió "arreglar" un problema borrando los datos de la empresa — sin aprobación humana — y luego escribió una disculpa. El wipe completo de la base de datos tardó 9 segundos.

El patrón común no es "la IA es malvada". Es **demasiado permiso, demasiado pronto**. El agente no tenía intención de destruir datos; tenía acceso de escritura que nadie limitó, y su razonamiento (limitado) interpretó "arreglar el problema" de la forma más destructiva posible.

El principio de mitigación es la **autonomía progresiva** que mencioné antes: empieza con alcance estrecho y permisos de bajo riesgo, y expande solo tras evidencia de que el sistema maneja ese alcance. Y el patrón clave de diseño, como dice MindStudio, es:

> "Construir workflows que controlen al agente en lugar de dejar que el agente controle el workflow. El agente ejecuta dentro de un límite definido. El límite define qué herramientas tiene acceso, qué puede escribir, qué constituye una salida válida y cuándo debe parar y esperar."

En términos prácticos: los permisos de escritura de producción son el último nivel, no el primero. El acceso a datos reales de usuario no debería estar en el mismo sandbox que el código de la feature. Y la definición de "éxito" debe ser probabilística y externa — como los escenarios holdout de StrongDM — no "el agente dice que sus tests pasan".

---

## 🧭 Cómo acercarse a la dark factory como desarrollador indie

Aquí está la pregunta que probablemente te estás haciendo: ¿todo esto es para equipos con presupuesto de enterprise, o tiene sentido para un indie?

La respuesta honesta es: **el modelo completo, no. Los principios, sí.** Y la economía de StrongDM lo demuestra por la vía negativa. Willison hizo la cuenta:

> "Si estos patrones realmente añaden $20.000/mes por ingeniero a tu presupuesto, son mucho menos interesantes para mí. En ese punto esto se convierte más en un ejercicio de modelo de negocio: ¿puedes crear una línea de productos lo suficientemente rentable como para permitirte el enorme overhead de desarrollar software de esta forma?"

Pero Willison también señala el camino intermedio:

> "Creo que hay mucho que aprender de StrongDM incluso para equipos e individuos que no van a quemar miles de dólares en costes de tokens. Estoy particularmente interesado en la pregunta de qué se necesita para que los agentes prueben que su código funciona sin necesidad de revisar cada línea que producen."

Para un desarrollador independiente, mi recomendación concreta, en orden de adopción:

### Nivel práctico 1: adopta la verificación externa ya

La lección más barata de la dark factory es la **verificación externa**. Si trabajas con agentes, escribe escenarios de aceptación que el agente no pueda ver mientras genera el código. Guarda los tests de integración en un directorio que el agente no consulta en el prompt. Ejecuta la validación en un paso separado de la generación. Es el patrón holdout aplicado a tu flujo personal, y no cuesta nada.

### Nivel práctico 2: impón el orden de ACDD a mano

No necesitas FSPEC para empezar a usar ACDD. La disciplina es: criterios de aceptación primero, tests después, código al final. Puedes forzarla con una plantilla de issue que exija escenarios Given/When/Then antes de escribir código, o con un script de pre-commit que verifique que el test existe antes del código. Cuando el agente se salte el orden (y lo hará), la corrección es de proceso, no de código.

### Nivel práctico 3: prueba FSPEC en un proyecto real

Si ya usas Claude Code o Codex con asiduidad, FSPEC es una adición barata (`npm install -g @sengac/fspec`) que te da el kanban, los checkpoints y el enforcement de ACDD sin construir nada. El dogfooding del propio proyecto (257 feature files en semanas) sugiere que la disciplina funciona a escala.

### Nivel práctico 4: automatiza tus gates antes de tu código

Antes de dejar que un agente mergee nada, asegúrate de que tus gates automatizados (lint, typecheck, tests, security scan) son exhaustivos y fiables. El nivel 3 de autonomía solo es seguro si tus automated review gates son mejores que tu revisión manual. Si tus tests dejan pasar bugs que tú detectas a simple vista, no estás listo para que la IA mergee sola.

### Nivel práctico 5: el presupuesto mental

La última lección es mental. El mantra de StrongDM — "el código no debe ser escrito ni revisado por humanos" — no es una instrucción para adoptar a ciegas; es una **hipótesis de trabajo** que te obliga a preguntarte en cada paso: *¿esto lo puede hacer el agente?* La mayoría de las veces la respuesta es "sí, con el harness adecuado", y tu tiempo se libera para la parte que nadie más puede hacer: definir qué construir y por qué.

---

## 🔮 El futuro: la especificación como producto

Hay una idea que me ronda desde que investigué este tema, y creo que es la más importante de todas. Fíjate en Attractor: el repositorio de StrongDM que no contiene código, solo specs. Y fíjate en FSPEC: 257 feature files como artefacto principal. Y en el workflow de StrongDM: escenarios holdout almacenados fuera del codebase.

El patrón común es que **la especificación se está convirtiendo en el producto, y el código en un detalle de implementación**.

Esto conecta directamente con el desarrollo impulsado por especificaciones que he explorado en posts anteriores — [SDD y los frameworks de especificación](/es/blog/sdd-frameworks-spec-kit-openspec-bmad/), la [comparativa Grill-Me vs SDD](/es/blog/grill-me-sdd-adversarial-workflow-comparison/) y el [SDD socrático](/es/blog/socratic-grilling-sdd/) — pero la dark factory lleva la tesis al extremo: si la especificación es lo único que los humanos producen, entonces la calidad del sistema depende enteramente de la calidad de la especificación, y la verificación debe ser externa al generador.

Las implicaciones para un desarrollador independiente son dobles. Primero, **las skills de especificación se vuelven más valiosas que las skills de implementación**: escribir criterios de aceptación precisos, diseñar escenarios holdout y definir límites de gobernanza es el trabajo que no se delega. Segundo, **la infraestructura de verificación externa es el foso**: el equipo que construye buenos gemelos digitales de sus dependencias y buenos escenarios de validación tiene una ventaja que no se copia con un prompt.

---

## 📚 Bibliografía y referencias

- **Simon Willison** — [How StrongDM's AI team build serious software without even looking at the code](https://simonwillison.net/2026/Feb/7/software-factory/) (7 feb 2026)
- **MindStudio** — [What Is a Dark Factory? The AI Coding Pattern That Ships Code Without Human Review](https://www.mindstudio.ai/blog/what-is-a-dark-factory-ai-coding) (18 abr 2026)
- **SENGAC** — [fspec: The Spec-Driven, Multi-Agent Coding Factory](https://github.com/sengac/fspec)
- **SENGAC** — [ACDD Methodology](https://fspec.dev/concepts/acdd/)
- **SmartComputer AI** — [Agent OS: Build autonomous AI agents](https://github.com/smartcomputer-ai/agent-os)
- **StrongDM** — [Attractor: the non-interactive coding agent (spec-only repo)](https://github.com/strongdm/attractor)
- **StrongDM** — [cxdb: AI Context Store](https://github.com/strongdm/cxdb)
- **Pulumi** — [The Dark Factory Pattern for Infrastructure: Running Pulumi Lights-Out](https://www.pulumi.com/blog/dark-factory-pattern-pulumi-autonomous-iac/)
- **Fortune** — [AI-powered coding tool wiped out a software company's database](https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure/)
- **Euronews** — [An AI agent deleted a company's entire database in 9 seconds, then wrote an apology](https://www.euronews.com/next/2026/04/28/an-ai-agent-deleted-a-companys-entire-database-in-9-seconds-then-wrote-an-apology)
- **Vinny Carpenter** — [The Dark Factory Model for AI-Driven Software Development](https://vinny.dev/blog/2026-04-05-dark-factory-model-for-ai-software-development/)
- **Simon Willison / Lenny's** — [An AI state of the union: dark factories are coming](https://www.lennysnewsletter.com/p/an-ai-state-of-the-union)

---

*Si este análisis te ha resultado útil, compártelo con otro desarrollador que siga haciendo de niñera de sus agentes. Y si has probado FSPEC, Agent OS o cualquier harness de autonomía progresiva, me encantaría saber cómo te ha ido.*
