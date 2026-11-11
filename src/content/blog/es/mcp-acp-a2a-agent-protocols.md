---
title: "MCP, ACP y A2A: cómo conectar agentes de IA"
description: "Compara MCP, ACP y A2A con casos reales: cuándo conectar herramientas, integrar agentes en editores o comunicar servicios de IA sin añadir complejidad."
pubDate: "2026-11-11"
lastmod: "2026-11-11"
author: "ArceApps"
keywords: ["MCP","ACP","A2A","Agent Client Protocol","Agent2Agent","agentes IA"]
canonical: "https://arceapps.com/es/blog/mcp-acp-a2a-agent-protocols/"
heroImage: "/images/mcp-acp-a2a-agent-protocols.webp"
tags: ["IA","Agentes","Protocolos","MCP","ACP","A2A"]
category: "ai-agents"
reference_id: "2ca798ed-62dd-47ac-8112-57b0d26ac4ee"
---

> **Serie «Orquestación de agentes sin depender de un proveedor», entrega 3 de 5.** Venimos de [ChatGPT Desktop y su frontera MCP](/es/blog/chatgpt-desktop-agent-orchestration/) y de [Claude Desktop con herramientas locales](/es/blog/claude-desktop-external-coding-agents/). Antes de añadir más agentes, conviene responder a una cuestión fundamental: **¿qué significa realmente conectarlos?**

## Tres protocolos para tres problemas distintos

En el mundo de los agentes se utilizan las palabras «conexión», «delegación» y «orquestación» como si fueran equivalentes. No lo son. Una aplicación que necesita una herramienta de búsqueda no tiene los mismos requisitos que un editor que muestra cada cambio de un agente de programación. Y ninguno de esos escenarios es idéntico a dos servicios de agentes independientes que se descubren mutuamente y colaboran en una tarea de larga duración.

**MCP**, Model Context Protocol, es especialmente útil para dar a una aplicación o a un agente acceso estructurado a herramientas y recursos. **ACP**, Agent Client Protocol, nace para conectar agentes de programación con clientes como editores y entornos de desarrollo. **A2A**, Agent2Agent Protocol, se orienta a la comunicación y colaboración entre sistemas de agentes independientes. Sus objetivos se solapan parcialmente, pero su frontera conceptual es diferente.

Conviene decir desde el principio lo que estos protocolos no hacen: ninguno garantiza que un agente sea competente, que la ejecución sea segura o que dos modelos lleguen a un consenso correcto. Proporcionan estructuras de comunicación y capacidades de interoperabilidad. La autorización, el coste, la persistencia y las decisiones de producto siguen siendo responsabilidad de nuestra arquitectura.

## El ejemplo que usaremos durante todo el artículo

Supongamos que mantengo una aplicación web con un pequeño servicio Android complementario. Quiero pedir desde una interfaz: «Revisa los cambios en autenticación, encuentra un riesgo y prepara un parche con tests». Un cliente conversacional puede usar MCP para llamar a una herramienta \`create_task\`. Un editor compatible con ACP puede incorporar un agente externo y mostrar su interacción sobre archivos. Y un agente auditor desplegado como servicio independiente podría anunciar capacidades mediante A2A y recibir una tarea de revisión.

No necesito los tres protocolos para resolver el problema. Puedo ejecutar el flujo entero con una API HTTP y un adaptador sencillo. El interés de compararlos es descubrir **cuándo la interoperabilidad justifica la complejidad**, no decorar un diagrama con siglas.

La disciplina más útil es trazar quién manda en cada frontera. ¿El humano interactúa con un editor, con un chat o con un servicio? ¿Quién inicia la tarea? ¿Quién retiene el estado? ¿Quién puede hacer cambios? ¿Qué componente responde ante una cancelación? Después de contestar estas preguntas, la elección de protocolo suele ser bastante menos misteriosa.

## MCP: exponer capacidades a un cliente

El foco de MCP es que un host compatible pueda descubrir e invocar capacidades de un servidor. Una herramienta tiene nombre, descripción, esquema de entrada y resultados. También existen recursos y otras capacidades según la versión y el SDK. Esto resulta práctico para vincular un chat a un sistema de tickets, consultar un índice de documentos o crear un trabajo de programación con parámetros validados.

Un servidor MCP no necesita ser un agente autónomo. Puede envolver una API, una base de datos o una función. En nuestra serie, el puente MCP expone tres herramientas: crear trabajo, consultar estado y solicitar cancelación. El agente verdadero está debajo, en OpenCode o en otro ejecutor. Esta distinción permite que la misma operación sea utilizada por clientes diferentes sin obligar a que cada cliente conozca las APIs internas.

El transporte también importa: un servidor local conectado mediante stdio tiene requisitos de despliegue distintos de uno remoto sobre HTTP. Además, las revisiones del protocolo evolucionan; no conviene fijar detalles de handshake, sesiones o cabeceras de una versión antigua sin consultar la especificación que implementan cliente y servidor. La interoperabilidad se demuestra con pruebas de versiones compatibles, no con una captura del archivo de configuración.

## Un contrato MCP concreto y limitado

Un buen diseño empieza por la mínima capacidad útil. La herramienta de creación de trabajo no aceptará un comando de shell ni una ruta libre. Recibirá el identificador de un proyecto conocido, objetivo, tipo de intervención y clave de idempotencia. El servidor verificará la autorización y devolverá un identificador estable. La petición no bloquea hasta que el agente termina: el estado se consulta por separado.

~~~json
{
  "project_id": "demo-web",
  "goal": "Revisar el cambio en autenticación y proponer tests",
  "mode": "analysis",
  "idempotency_key": "audit-auth-2026-11"
}
~~~

Esta estructura es un **ejemplo de argumentos de herramienta**, no un mensaje completo del protocolo MCP. No incluye encabezados de transporte, autenticación ni el envoltorio de llamada. Esa simplificación es deliberada para concentrarnos en la decisión arquitectónica.

La clave es que una herramienta no debe heredar automáticamente toda la autoridad del agente que la invoca. Si la herramienta solo permite análisis, el servidor debe imponerlo aunque el texto de \`goal\` pida modificar archivos. Los permisos de una API se definen en código y configuración, no en la cortesía del modelo.

## ACP: la relación entre un editor y un agente

Agent Client Protocol se diseñó para que un editor compatible pueda hablar con agentes de programación sin construir una integración propietaria para cada uno. Zed, uno de sus impulsores, documenta el objetivo como «lleva tu propio agente». El editor conserva la experiencia visual de archivos, cambios y revisión, mientras el agente conserva su lógica de ejecución. Eso es distinto de que un chat invoque una herramienta puntual.

En un escenario ACP, el cliente es normalmente un entorno de edición o una aplicación que necesita una experiencia continua con el agente: sesiones, mensajes, actividad, herramientas y resultados integrados en su interfaz. No estamos describiendo simplemente un router de modelos. El editor necesita saber qué está pasando para mostrarlo al desarrollador y permitirle intervenir.

La ventaja conceptual es la portabilidad. En vez de depender de que cada editor implemente una API singular para OpenCode, Claude Code o cualquier otro ejecutor, los implementadores pueden adoptar una superficie común. La limitación es que las capacidades concretas y su madurez dependen de las implementaciones. No basta con que dos productos anuncien «ACP» para asumir paridad total de funciones, autenticación o permisos.

## ACP no es MCP escrito al revés

El parecido de siglas invita a tratarlos como rivales, pero suelen operar en planos diferentes. Un editor puede conectarse a un agente mediante ACP; ese agente puede consumir herramientas expuestas mediante MCP. El agente no tiene que reimplementar por sí mismo todas las conexiones a GitHub, bases de datos o documentación. La división de trabajo resulta natural si el protocolo del editor y el de las herramientas están bien delimitados.

Imagina una vista del editor que sigue en tiempo real la revisión de un parche. ACP tiene sentido en esa frontera. Imagina ahora que el agente necesita consultar los issues de un repositorio: MCP puede ser una buena interfaz de herramientas. Cambiar uno por otro porque ambos contienen la palabra «agent» o «context» conduce a adaptadores innecesarios y experiencias incompletas.

También existe una alternativa perfectamente válida: que el editor incluya una integración nativa con un agente y que el agente use una API HTTP normal. Los estándares ayudan cuando queremos interoperabilidad real, pero no deberían imponerse en proyectos pequeños donde un SDK oficial es más simple y mantenible.

## A2A: colaboración entre sistemas de agentes

A2A aborda una frontera más amplia: sistemas de agentes capaces de anunciar capacidades, intercambiar mensajes y gestionar tareas colaborativas. Su especificación define conceptos como descripciones de capacidades de agentes, mensajes, tareas, estados y artefactos. Es especialmente atractivo cuando las partes son independientes, están construidas con frameworks distintos o se despliegan en servicios separados.

A diferencia de una herramienta MCP que podemos exponer como «crear ticket», un servicio A2A puede representar un agente remoto que ejecuta un trabajo largo, solicita información adicional y entrega artefactos. No necesitamos conocer sus herramientas internas ni compartir su memoria. Esa independencia tiene valor cuando desarrollamos un ecosistema de agentes de terceros o queremos separar dominios de confianza.

Pero no es una excusa para repartir tareas domésticas entre diez microservicios. Si dos agentes viven en el mismo proceso y un SDK ya permite llamarlos, convertirlos en servicios A2A puede añadir latencia, autenticación, despliegues y puntos de fallo sin beneficio. La decisión debería basarse en independencia operativa, no en la novedad del protocolo.

## Un ejercicio visual de fronteras

~~~text
Usuario
  |
  +-- Chat o app ---- MCP ----> herramientas: repos, tareas, datos
  |
  +-- Editor -------- ACP ----> agente de programación
                                     |
                                     +-- MCP --> herramientas
  |
  +-- Servicio coordinador -- A2A --> otro sistema de agentes
                                     |
                                     +-- artefactos y estado de tareas
~~~

Este diagrama no pretende describir una topología obligatoria. Las herramientas pueden usar otros mecanismos, el editor puede lanzar procesos locales y el coordinador puede hablar directamente con una API. Sirve para separar tres preguntas: ¿qué recursos consulta o modifica el agente?, ¿cómo se integra con el cliente de edición?, ¿cómo colabora con otros sistemas de agentes?

A partir de aquí, para un proyecto pequeño empezaría con la frontera imprescindible y añadiría estándares solo cuando necesite conectar sistemas independientes. Una arquitectura con todas las siglas desde el primer día es difícil de depurar y de explicar a otro desarrollador.

## Comparativa por responsabilidad

| Pregunta de diseño | MCP | ACP | A2A |
| --- | --- | --- | --- |
| ¿Quién suele ser el cliente? | Una app o agente que invoca herramientas | Un editor o cliente de agente | Otro agente o servicio coordinador |
| ¿Qué se intercambia? | Capacidades y resultados estructurados | Interacción operativa con agente de código | Mensajes, tareas y artefactos entre agentes |
| ¿Dónde está el estado duradero? | Depende de la aplicación | Depende del agente y su cliente | El ciclo de tareas forma parte del modelo de interacción |
| ¿Cuándo encaja? | Acceso a sistemas y operaciones | UX de agente dentro del editor | Colaboración entre sistemas independientes |
| ¿Qué no resuelve solo? | Planificación, persistencia de trabajos | Calidad del agente ni políticas de proyecto | Seguridad operativa, coste y confianza |

Esta tabla es una síntesis de objetivos, no una matriz de compatibilidad certificada. Dos clientes pueden implementar subconjuntos distintos de un protocolo. La compatibilidad hay que confirmarla en documentación y pruebas de las versiones concretas, no inferirla de esta abstracción.

El error habitual es preguntar «¿cuál es el mejor?». La pregunta útil es «¿qué frontera tengo que estandarizar?». Si lo que quiero es consultar una base de datos desde Claude Desktop, A2A probablemente sobra. Si quiero una interfaz de editor agnóstica del ejecutor, ACP merece estudio. Si necesito un agente remoto que descubra a otro y negocie una tarea, A2A puede justificar el coste.

## ¿Y una API HTTP corriente?

Las APIs convencionales siguen siendo una alternativa válida. De hecho, OpenCode publica un servidor HTTP y un SDK, y el puente de los artículos anteriores puede trabajar directamente con esas interfaces. No hay que envolver una operación en A2A únicamente para poder llamarla por red. Si controlo ambos extremos, una API bien tipada con autenticación y estados puede ser la solución más económica.

Los protocolos estandarizados aportan valor cuando varios clientes o agentes necesitan una superficie común y se quiere reducir el código de integración por pareja. Su coste es implementar versiones, negociación de capacidades, errores, autenticación y pruebas. Si solo tengo un servicio y un consumidor, conviene medir ese coste antes de elegir.

En mi diseño preferido, conservaría la lógica de negocio en un servicio independiente del transporte. El adaptador MCP llama al mismo método \`createTask\` que una API HTTP o un futuro adaptador A2A. Esto evita que cambiar el protocolo cambie la semántica de seguridad y estado. Los adaptadores no deberían convertirse en lugares donde se duplican reglas de negocio.

## Versionado: el detalle que rompe demos perfectas

MCP, ACP y A2A evolucionan. Cada implementación concreta suele soportar un conjunto de versiones y capacidades. Integrar una especificación de ayer con un cliente actualizado mañana puede producir errores que no tienen nada que ver con el modelo de IA. Una demostración de compatibilidad debe registrar las versiones exactas de cliente, servidor, SDK y, cuando corresponda, especificación.

No copiaría una secuencia de inicialización de un protocolo antiguo sin revisar si sigue vigente. Por ejemplo, el diseño de sesiones y transporte de MCP ha tenido revisiones, y la documentación puede mostrar versiones modernas y anteriores. Los esquemas de A2A también se publican con números de versión; las rutas de documentación de diferentes versiones pueden coexistir. Conviene enlazar la especificación precisa que se utilizó en la integración.

La solución práctica es aburrida y efectiva: fijar versiones de dependencias, probar la conexión al arrancar, validar una llamada de muestra y documentar los cambios cuando se actualiza. No esperaría a que un usuario descubra que la herramienta desapareció de la interfaz.

## Estado y cancelación: no lo dejes al modelo

Tener un protocolo no garantiza trabajos recuperables. MCP puede llamar a una operación que devuelve inmediatamente un ID; la persistencia de ese ID pertenece al servicio. ACP puede ofrecer una sesión operativa con un agente en un editor; la supervivencia de esa sesión ante cierres o reinicios depende de su implementación. A2A modela tareas explícitamente, pero el servicio debe persistirlas correctamente.

Definiría una única máquina de estados en el núcleo del orquestador y la mapearía a cada protocolo. \`queued\`, \`running\`, \`awaiting_approval\`, \`completed\`, \`failed\`, \`cancelled\` bastan para empezar. La cancelación requiere una política: qué se interrumpe, qué tareas pueden estar ya terminadas y qué artefactos permanecen.

También distinguiría estado de ejecución y estado de revisión. Un agente puede terminar de escribir un parche, pero ese trabajo aún no está aprobado. Un \`completed\` técnico no equivale a \`merged\` ni a \`deployed\`. Esta separación evita que una interfaz anuncie éxito prematuro cuando todavía faltan CI o inspección humana.

## La seguridad no es una característica de un acrónimo

Al usar MCP, revisaríamos el alcance de cada herramienta y el origen del contenido que recibe. Con ACP, el editor y el agente comparten una interacción potencialmente rica con el proyecto; hay que cuidar permisos de archivos, comandos y aprobaciones. Con A2A, aparece además la identidad de agentes remotos, autenticación, autorizaciones cruzadas y control de artefactos recibidos.

Ninguno de esos protocolos sustituye el principio de mínimo privilegio. Un agente de revisión no necesita credenciales de producción. Un agente que analiza issues no debería poder abrir una shell como administrador. Un servicio que entrega un archivo no debe lograr que otro ejecutor lo interprete como una orden privilegiada. La frontera entre datos no confiables e instrucciones autorizadas es especialmente delicada en sistemas que leen repositorios e Internet.

Revisaría también los logs. Pueden contener secretos, fragmentos de código y prompts; no conviene copiarlo todo a un proveedor de observabilidad externo sin filtrar. La utilidad de un sistema de trazas no justifica publicar datos privados.

## Caso práctico: elegir protocolo para tres flujos

**Flujo A: consultar estadísticas de una app desde un chat.** Usaría MCP si el cliente lo soporta y ofrece permisos adecuados. La herramienta devuelve datos estructurados y puede separar lectura de acciones. No necesito A2A, porque no hay un agente remoto independiente que negocie tareas.

**Flujo B: trabajar en una refactorización mientras observo archivos en el editor.** Consideraría ACP si mi editor y mi agente disponen de implementaciones compatibles. Su valor está en la experiencia integrada. Las consultas a servicios externos pueden usar MCP o APIs sin que ACP tenga que reemplazarlas.

**Flujo C: encargar revisión de seguridad a un servicio autónomo separado.** Consideraría A2A si necesito interoperabilidad real, descubrimiento y gestión de trabajos remotos. Si ese servicio es un único proceso bajo mi control, antes probaría una API sencilla. La complejidad debe ganarse su sitio.

## Un diseño para probar sin depender de los tres estándares

El prototipo ideal no arrancaría con tres protocolos a la vez. Haría un núcleo de trabajo que acepta objetivos, autorización y proyecto. Añadiría el adaptador MCP para el cliente conversacional y usaría el SDK oficial del ejecutor de programación. Esa es la ruta más corta hasta un resultado útil.

Después conectaría un editor mediante ACP **si** necesitara esa experiencia y hubiera soporte verificado. Solo incorporaría A2A cuando quisiera interoperar con un servicio de agentes independiente y no me bastase un endpoint conocido. De esta manera cada nueva capa se justifica por un requisito que puedo escribir como prueba de aceptación.

También mantendría métricas comunes: porcentaje de tareas terminadas, tiempo hasta primer resultado, intervenciones humanas, tasa de errores y costes. Si añadir un protocolo no mejora ningún requisito operativo, probablemente no es necesario.

## Antipatrones que conviene evitar

El primero es «todos los modelos son agentes». Un modelo accesible por API no tiene automáticamente herramientas, memoria, persistencia ni permisos. El segundo es «todo con MCP»: MCP es útil, pero no está pensado para reemplazar toda forma de colaboración entre ejecutores o toda interfaz de edición. El tercero es «A2A por si acaso»: añadir un sistema distribuido sin una necesidad real genera más trabajo de operaciones.

El cuarto es «la conversación es la base de datos». Si cierro el cliente, la identidad de un trabajo en marcha no debería evaporarse. El quinto es «si lo dijo un agente, es confiable». Los mensajes recibidos son datos hasta que una política y una validación los convierten en acciones permitidas.

El sexto es ocultar los errores detrás de una respuesta agradable del modelo. Un fallo de transporte, un rechazo de autorización, una herramienta inexistente y un test que falla requieren acciones de reparación distintas. Diseñaría mensajes y trazas que permitan diferenciarlos sin leer una transcripción gigantesca.

## Lecciones para nuestra serie

MCP conecta aplicaciones con herramientas. ACP conecta experiencias de cliente —en especial editores— con agentes de programación. A2A conecta sistemas de agentes entre sí. Son una forma útil de pensar las fronteras, no una ley que obligue a usar los tres. El objetivo sigue siendo el mismo que planteamos al empezar: delegar tareas verificables sin perder control.

El siguiente artículo llevará esto al terreno de Git: un plan, una implementación en un agente, una revisión desde otro y una PR con CI. Veremos qué datos deben atravesar cada frontera y qué cosas deben permanecer bajo control humano. El artículo final examinará qué ocurre cuando añadimos proveedores, presupuestos y fallbacks.


## Una regla de migración para proyectos que empiezan pequeños

Supongamos que hemos empezado con una API HTTP entre el panel y OpenCode. Meses después queremos incorporar otro editor. No reescribiría la lógica para «hacerlo ACP» de golpe. Primero identificaría qué funciones específicas del editor necesitamos: seguimiento de actividad, aprobaciones, visualización de cambios y recuperación de sesiones. Después comprobaría si el agente y el editor tienen implementaciones compatibles con esas operaciones concretas. Solo entonces incorporaría el adaptador.

Algo parecido ocurre al añadir A2A. Si la única necesidad es lanzar un segundo comando en una máquina conocida, probablemente una API autenticada basta. Si el nuevo servicio es independiente, debe anunciar capacidades a clientes distintos y entregar tareas y artefactos de larga duración, A2A comienza a ofrecer un beneficio comprobable. La clave es conservar identificadores y permisos del núcleo; cambiar de protocolo no debería duplicar estados o saltarse autorizaciones existentes.

Incluso en un prototipo personal, documentaría una vía de retorno: mantener un endpoint de salud, acceso al registro de tareas y cancelación manual bajo permisos. Así una incompatibilidad entre versiones de protocolos no convierte el trabajo en curso en una caja negra. La interoperabilidad tiene valor cuando simplifica la evolución del sistema, no cuando nos obliga a adoptar una migración completa cada vez que cambia un SDK.

## Bibliografía y lecturas relacionadas

- [MCP: especificaciones y documentación](https://modelcontextprotocol.io/specification)
- [Zed: Agent Client Protocol](https://zed.dev/acp)
- [Zed: evolución de ACP](https://zed.dev/blog/acp-progress-report)
- [A2A: documentación oficial](https://a2a-protocol.org/)
- [A2A: especificación y conceptos de tareas](https://a2a-protocol.org/v1.0.1/specification/)
- [ArceApps: ChatGPT Desktop y OpenCode](/es/blog/chatgpt-desktop-agent-orchestration/)
- [ArceApps: Claude Desktop y MCP local](/es/blog/claude-desktop-external-coding-agents/)
- [ArceApps: servidores MCP para memoria compartida](/es/blog/mcp-servers-memory-cross-agent/)

**Cierre.** Mi protocolo favorito es el que evita escribir un adaptador que no necesito. Si un diagrama exige más siglas que requisitos, probablemente es hora de simplificarlo antes de implementarlo.
