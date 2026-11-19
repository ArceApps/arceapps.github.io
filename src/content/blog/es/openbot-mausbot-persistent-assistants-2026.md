---
title: "OpenBot vs MausBot: la nueva era de los asistentes"
description: "Compara OpenBot y MausBot con flujos de desarrollo, automatizaciones, agentes persistentes y seguridad para elegir una plataforma de asistentes de IA útil."
pubDate: 2026-11-19
lastmod: 2026-11-19
author: "ArceApps"
keywords: ["OpenBot", "MausBot", "asistentes IA", "agentes persistentes", "automatización", "orquestación de agentes", "flujos de trabajo"]
canonical: "https://arceapps.com/es/blog/openbot-mausbot-persistent-assistants-2026/"
heroImage: "/images/openbot-mausbot-persistent-assistants-2026-es.svg"
tags: ["OpenBot", "MausBot", "Agentes IA", "Automatización", "Productividad", "Open Source"]
category: "ai-agents"
reference_id: "b30976ca-47a8-4b2f-9d5c-a170e42b8f96"
---

Hace un par de años le pedíamos a un chatbot que escribiese una función. Después aprendimos a darle acceso al repositorio, al terminal y al navegador. Ahora aparece otra pregunta: **¿y si el asistente siguiera siendo el mismo mañana, recordara el proyecto, pudiera recibir trabajo de otro agente y supiera cuándo detenerse para pedir permiso?** Esa transición importa bastante más que el siguiente salto en un benchmark.

[OpenBot](https://openbot.run/) y [MausBot](https://mausbot.com/) intentan convertir las herramientas de IA que ya utilizamos en asistentes persistentes. No son dos modelos nuevos y tampoco son exactamente dos lanzadores de prompts. Son aplicaciones que organizan identidades, conversaciones, archivos, motores, tareas y permisos alrededor de agentes que hacen cosas. La promesa resulta especialmente interesante para quien desarrolla proyectos propios y no quiere abrir cinco terminales para seguir el rastro de cada tarea.

En ArceApps ya comparamos [OpenBot, Hermes y Paperclip desde la perspectiva de qué despierta al agente](/es/blog/openbot-vs-hermes-vs-paperclip-ai-agents-2026/) y exploramos [cómo orquestar agentes externos alrededor de ChatGPT y OpenCode](/es/blog/chatgpt-desktop-agent-orchestration/). Aquí cambia la pregunta: **¿cómo se vive y se controla el trabajo diario desde una aplicación que reúne varios asistentes?** También hay una [guía específica de OpenBot](/es/blog/openbot-workflows-agent-teams-guide-2026/) para pasar de esta comparativa a una configuración concreta.

Esta investigación está contrastada con documentación pública de ambos proyectos a **19 de noviembre de 2026**. Los ejemplos son **diseños de flujo reproducibles**, no resultados medidos en una instalación propia. Conviene decirlo porque una interfaz atractiva nunca es prueba de que una automatización haya resuelto una incidencia real.

## Una aclaración que evita comparar productos equivocados

Cuando digo OpenBot hablo de **openbot.run**, proyecto del repositorio [nightly-labs/openbot](https://github.com/nightly-labs/openbot). Existe otro proyecto llamado OpenBot de CopilotKit, asociado a **open.bot**. Comparten nombre, no producto. MausBot es el proyecto [OpenMausBot](https://github.com/milind-soni/OpenMausBot), anteriormente denominado OpenGrokBot. La documentación y las licencias que comentamos pertenecen a esos repositorios concretos.

La distinción también afecta a «código abierto». OpenBot publica su código, pero sus versiones actuales usan **PolyForm Noncommercial 1.0.0**: se pueden estudiar y modificar, pero el uso comercial requiere licencia específica. MausBot publica su edición principal bajo **Apache 2.0**, mientras que la carpeta enterprise/ tiene condiciones distintas. Así que «puedo ver el código» y «puedo utilizarlo comercialmente sin pedir permiso» no son equivalentes. Es un detalle de arquitectura de producto, no una nota legal para el final.

## El verdadero cambio: el asistente ya tiene un lugar donde trabajar

Un chatbot está organizado alrededor de la conversación actual. Un asistente persistente se organiza alrededor de una **identidad operativa**: instrucciones propias, un directorio de trabajo, tareas, historial, archivos, herramientas y un mecanismo para retomar el contexto. La conversación sigue siendo necesaria, pero deja de ser el único recipiente de la información.

Imagina un desarrollador indie que mantiene una web, dos aplicaciones Android y varios experimentos. Su problema no suele ser «no sé generar código». Es que todos los días debe recuperar decisiones, localizar una nota, comprobar qué falló en CI, leer cambios de dependencias y decidir qué merece atención. Un agente de programación puede intervenir en cada punto; un espacio de trabajo persistente puede conservar el hilo conductor.

Persistencia no significa memoria perfecta. Un historial guardado no garantiza que el modelo vuelva a leerlo entero; un directorio guardado no garantiza que el agente identifique el archivo correcto. Por eso conviene mantener **un brief, un registro de decisiones y un resultado verificable** por tarea, aunque la aplicación ofrezca memorias automáticas. Los archivos auditables siguen siendo más fiables que el optimismo sobre el contexto de un modelo.

La segunda novedad es la **delegación observable**. En lugar de decir «hazlo todo», podemos pedir a un agente que investigue, a otro que proponga un cambio y a un tercero que lo revise. Eso no elimina nuestro criterio: lo desplaza a decisiones más importantes, como el alcance, los permisos, las pruebas y la publicación.

## OpenBot: agentes que trabajan en una misma mesa

OpenBot parte de una idea visual sencilla: cada agente tiene su nombre, configuración, espacio de trabajo y conversación. Puede ejecutar Codex, Claude Code, Gemini, Grok, OpenCode y otros proveedores o agentes compatibles con ACP, además de utilizar modelos locales mediante servicios compatibles. La documentación explica que los datos de trabajo y el archivo SQLite viven en el equipo que ejecuta OpenBot; las peticiones al proveedor elegido sí pueden salir de ese equipo. **Local-first no significa ejecución sin Internet ni inferencia privada por defecto**.

Lo que diferencia la experiencia no es únicamente cambiar de modelo. Los **canales** reúnen varios agentes en una conversación compartida. Uno es responsable de la tarea en cada momento y puede traspasar el trabajo a otro explícitamente. Esta propiedad única simplifica una situación peligrosa: varios agentes intentando modificar el mismo fichero o considerando que otro comprobará los tests. La cola de cada agente permite acumular mensajes y controlar el trabajo pendiente.

También incorpora **rutinas** para repetir una instrucción en un horario, y un editor de **workflows** que encadena pasos de agentes y aprobaciones. No son sinónimos. Una rutina puede revisar incidencias cada mañana. Un workflow puede preparar un informe, pedir revisión y publicarlo solo después de aprobarlo. Cuando un producto une ambas piezas, deja de parecer un simple chat con varias pestañas.

El acceso desde **iOS, Android y navegador** resulta importante para consultar resultados y responder preguntas lejos del ordenador. Eso no convierte el móvil en el motor de ejecución: el agente trabaja donde corre la instancia de OpenBot, sea tu máquina o un servidor. Si el host está apagado o desconectado, no hay magia en la aplicación móvil que mantenga los procesos trabajando.

El punto delicado es la seguridad. La guía inicial de OpenBot explica que puede utilizar modos de acceso muy permisivos después del consentimiento de arranque. La opción «solo workspace» para proveedores compatibles restringe **escrituras**, pero no constituye por sí misma un aislamiento de lectura ni de red. La frontera fiable depende también del sistema operativo, del usuario que ejecuta el programa y del entorno de aislamiento elegido.

## MausBot: un equipo de bots con herramientas y ordenadores

MausBot también ejecuta herramientas de agente existentes, normaliza sus eventos mediante un harness local y presenta cada bot como un contacto con sus tareas e historial. Claude, Codex, Grok, Cursor y otros motores están documentados; las credenciales y el consumo se gestionan según el motor o proveedor conectado. No hace falta contratar un modelo específico de MausBot para empezar, pero los planes del proveedor, las API y los servicios externos pueden tener costes.

Su propuesta destaca por la **amplitud del ordenador al que puede acceder un bot**. La documentación incluye el ordenador local, máquinas virtuales aisladas mediante Docker o Podman, escritorios de Boat y un VPS propio. Un bot que analiza archivos y un bot que navega por una web potencialmente hostil no deberían necesitar los mismos permisos. Disponer de varios entornos facilita diseñar esa separación, aunque **elegir una VM no la vuelve segura automáticamente**: también hay que controlar volúmenes, credenciales, red y la política de acceso.

MausBot enfatiza asimismo **aplicaciones conectadas**: Gmail, Slack, GitHub, Notion, Linear y muchas otras mediante Composio. Una conexión OAuth se convierte en una capacidad del bot, y eso abre flujos más amplios que editar código: revisar una bandeja de entrada, preparar respuestas, clasificar tareas o investigar referencias. La documentación diferencia claramente lo que ocurre en local de lo que se entrega a Composio, Boat u otros proveedores.

Los bots pueden actuar en **salas**, delegar explícitamente, tener memorias editables y trabajar en tareas paralelas. Las **automatizaciones** admiten horarios y webhooks, guardan el historial y hacen llegar resultados a la conversación del bot. Una opción interesante es que una rutina pueda recordar un breve informe de la ejecución anterior, en lugar de recomenzar totalmente desde cero. Es útil para monitorizar cambios, pero no sustituye un registro de estado fiable si necesitas deduplicación perfecta.

Su aplicación complementaria de **iPhone** está documentada con emparejamiento, búsqueda, seguimiento y aprobaciones. Hay además herramientas para controlar un Android por USB, lo cual **no equivale a una app móvil Android de control remoto**. Esa distinción evita una expectativa errónea. MausBot también puede servirse desde un VPS o a través de Tailscale, con las precauciones normales de exposición de servicios.

## La comparativa que importa para decidir

| Pregunta operativa | OpenBot | MausBot |
|---|---|---|
| ¿Cómo se organiza el trabajo? | Agentes, conversaciones, canales, colas y workflows | Bots, hilos, salas, delegación y automatizaciones |
| ¿Qué motores admite? | Codex, Claude, Gemini, Grok, OpenCode, ACP y más | Claude, Codex, Grok, Cursor, ACP y otros motores |
| ¿Dónde queda el estado? | En el ordenador o servidor que ejecuta OpenBot | En el harness local o servidor configurado |
| ¿Puede actuar con horario o por evento? | Rutinas, webhooks y workflows con disparadores | Rutinas, webhooks y disparadores de aplicaciones conectadas |
| ¿Existe revisión humana? | Aprobaciones en workflows y controles del agente | Tarjetas de aprobación según el motor y el nivel de permiso |
| ¿Puede trabajar con un navegador/ordenador? | Navegador y capacidades del entorno de ejecución | Equipo anfitrión, VM local, Boat o VPS según configuración |
| ¿Qué pasa en movilidad? | Clientes iOS, Android y web para instancias activas | Companion iOS documentado; Android USB es otra función |
| ¿Cómo se extiende? | Marketplace, skills, plugins y agentes ACP | Skills, apps conectadas, motores personalizables |
| ¿Qué licencia tiene el núcleo actual? | PolyForm Noncommercial | Apache 2.0 fuera de enterprise/ |

La tabla describe **funciones documentadas**, no una puntuación de rendimiento. Ambos productos evolucionan deprisa; para una elección irreversible hay que revisar el changelog y el sistema de permisos de la versión exacta.

## Flujo 1: del fallo de CI a una corrección revisada

El primer caso es el que más fácilmente aporta valor a un proyecto indie. Llega un fallo de build. No queremos un resumen genérico del log: queremos una hipótesis, un cambio focalizado, pruebas y un pull request cuya verificación pueda seguirse.

En **OpenBot** comenzaría con dos agentes: uno implementador que trabaja en una rama aislada y otro revisor que recibe el diff. Un canal permite que la conversación sobre el fallo tenga responsable; un workflow puede conectar **investigación → corrección → revisión → aprobación humana**. No delegaría el merge automáticamente al mismo agente que escribió el parche. Si el workflow se dispara desde GitHub, necesita permisos mínimos y una estrategia para no duplicar tareas al repetirse el evento.

En **MausBot** diseñaría un bot de análisis con acceso de lectura al repositorio y otro de implementación con carpeta de trabajo y permisos restringidos. La integración con GitHub puede servir para descubrir PR, incidencias o resultados de CI; una rutina o un webhook activa el proceso. Para ejecutar herramientas arriesgadas, preferiría una VM o un VPS de pruebas antes que mi ordenador personal. Las peticiones de aprobación deben llevar al humano la acción concreta, no solo un «todo parece bien».

El criterio de éxito sería idéntico: **commit o PR identificable, diff inspeccionado, pruebas relevantes verdes y cero cambios fuera del alcance**. La aplicación no certifica por sí sola ninguno de esos requisitos. Necesitamos verificar en GitHub y no confundir «el agente dice que terminó» con «la entrega está terminada».

## Flujo 2: del descubrimiento a un artículo publicado

Hay muchos artículos de IA que simplemente reorganizan el contenido de la página promocional de una herramienta. Un flujo editorial serio debe separar investigación, redacción y verificación de hechos.

En OpenBot crearía un agente **Investigador**, otro **Redactor** y otro **Verificador**. El primero prepara un archivo con fuentes primarias, fechas, afirmaciones confirmadas y dudas. El segundo redacta en el formato del blog sin inventar pruebas personales. El tercero busca afirmaciones sin respaldo, comprueba enlaces y revisa metadatos. Un workflow introduce una aprobación antes de permitir publicar; el canal mantiene las decisiones y los cambios de enfoque.

En MausBot haría lo equivalente usando bots con roles y salas; las aplicaciones conectadas servirían, si están autorizadas, para consultar documentación y depositar borradores. No concedería permiso de publicación a un bot investigador. Una rutina semanal puede buscar novedades y limitarse a producir una **propuesta de temas** en vez de crear contenido en automático.

Este flujo se parece mucho al trabajo con un blog bilingüe: **el mismo dato técnico puede describirse con enfoques editoriales distintos en español e inglés**, pero la paridad de enlaces, imágenes, fechas y afirmaciones es verificable. La automatización debe reducir tareas mecánicas, no transformar cuatro opiniones en «cuatro fuentes».

## Flujo 3: vigilar un proyecto sin gastar tokens en vacío

Un agente que despierta cada cinco minutos, pregunta si ha cambiado algo y responde «nada» puede parecer proactivo. En realidad consume contexto, cuota y atención. Es preferible que el disparador sea una señal útil cuando exista: un push, una issue, una comprobación fallida o un webhook.

OpenBot dispone de rutinas y workflows; MausBot documenta rutinas, webhooks y eventos de aplicaciones conectadas. En ambos introduciría un filtro previo: **¿hay cambios nuevos desde la última ejecución?** Si no, terminaría sin generar trabajo. Si sí, el agente recibe el enlace, el identificador del evento y la pregunta precisa.

Para un blog puede significar comprobar una vez al día si hay artículos programados; para una app Android, resumir nuevas incidencias; para una web estática, destacar un despliegue fallido. No hace falta que un modelo lea el mismo changelog cien veces. Un proceso convencional es suficiente para detectar cambios; el agente interpreta solamente los que importan.

También diseñaría la condición de parada. No basta con «revísalo hasta arreglarlo»: hay que decidir número de intentos, coste máximo, qué hacer cuando faltan credenciales y cuándo escalar al humano. Ningún asistente se vuelve fiable por negarse a pronunciar «no sé».

## Flujo 4: correo, agenda y decisiones con consecuencias

Aquí aparece la nueva era del asistente personal, pero también su mayor riesgo. Clasificar mensajes y proponer una respuesta es muy distinto de enviarla. Leer un calendario es distinto de mover una cita. Preparar un borrador es reversible; borrar un correo o compartir un documento puede no serlo.

MausBot pone el foco en las aplicaciones conectadas y muestra como casos de uso los seguimientos de correo y las automatizaciones por evento. OpenBot ofrece marketplace de apps y acceso al navegador, además de canales y workflows con aprobación. **No asumiría que todas las conexiones tienen exactamente los mismos alcances OAuth**, ni que un permiso concedido a la plataforma signifique un permiso apropiado para cada agente.

Mi diseño sería conservador: un bot identifica tres mensajes que necesitan respuesta, resume por qué son importantes y deja los borradores. Un paso humano autoriza el envío. Si se trata de un evento de calendario, el bot propone el cambio y muestra a quién afectaría. Si no puede identificar al destinatario inequívocamente, no actúa.

Es menos espectacular que una demo de «empresa funcionando sola». También es mucho más útil durante meses. La automatización que no genera sustos suele durar más que la que presume de autonomía absoluta.

## Flujo 5: tareas sobre un ordenador aislado

La capacidad de controlar un navegador es potente: puedes investigar documentación, completar formularios de prueba o recorrer una interfaz real. Pero el navegador también es una fuente habitual de instrucciones maliciosas escritas dentro de páginas o documentos.

MausBot ofrece opciones explícitas de **ordenadores separados**, incluida una VM local y servicios remotos. OpenBot ofrece control de navegador y despliegue local o en servidor, pero no debemos deducir que ambos productos tienen el mismo mecanismo de aislamiento. La pregunta relevante es quién ejecuta los comandos, dónde están montados los archivos y qué secretos puede leer cada proceso.

Para comprobar el responsive de una web o reproducir un bug de UI utilizaría un entorno sin credenciales de producción. El agente debe devolver un informe con pasos, capturas reales si las obtuvo y puntos que necesitan inspección. Nunca pondría en manos de un navegador automatizado una clave de despliegue porque «solo va a hacer una prueba visual».

La regla es simple: **el aislamiento se diseña por capacidad y por riesgo, no por nombre del bot**. Un investigador puede necesitar Internet sin acceso de escritura al repositorio. Un corrector puede necesitar escritura en una rama sin permiso de deploy. Un publicador puede necesitar acceso de despliegue sin permiso para reescribir la historia de Git.

## El coste: gratis no significa sin consumo

Ambos permiten aprovechar CLIs y cuentas existentes, pero eso no convierte todas las ejecuciones en gratuitas. Hay cuotas de suscripción, posibles límites por modelo, créditos de API, servicios de escritorio cloud, conexiones externas y coste de mantener un servidor encendido. La licencia de uso comercial de OpenBot es otra variable distinta del precio de inferencia.

Separaría las tareas por nivel. **Nivel 0**, comprobaciones deterministas: GitHub Actions, un diff, un test, un calendario o un script. **Nivel 1**, clasificación o resumen acotado: un modelo económico. **Nivel 2**, diagnóstico y modificación compleja: un agente de programación potente. **Nivel 3**, acción con consecuencias: revisión humana, sea cual sea el modelo.

No hay nada heroico en gastar un modelo premium para comparar dos hashes. Tampoco en intentar que una rutina de tres frases sustituya una suite de pruebas. Un buen asistente aprovecha herramientas tradicionales y emplea la IA solamente donde realmente aporta razonamiento.

## Seguridad: el permiso es parte del diseño

Las dos plataformas han documentado modos de acceso elevados. La guía inicial de OpenBot advierte de acceso amplio tras el consentimiento, y las instrucciones de seguridad de MausBot señalan que los bots pueden empezar en **Full access**, con niveles más conservadores disponibles. Una aprobación no es un cortafuegos: si el motor, el sistema operativo o una integración permiten otra ruta hacia el dato, esa ruta sigue existiendo.

Yo comenzaría con cinco reglas: usar un usuario del sistema sin permisos administrativos para tareas corrientes; separar credenciales de lectura y escritura; exigir aprobación para envíos, compras, borrados y publicaciones; mantener copias y ramas recuperables; y registrar qué agente hizo cada cambio y con qué información. Son reglas independientes de la marca.

También comprobaría el tratamiento de los datos. Local-first garantiza una ubicación primaria del estado, no que nunca se envíe contenido a un modelo remoto, un buscador, Composio o un proveedor de ordenador cloud. Antes de conectar Gmail o repositorios privados hay que revisar **qué servicio recibe cada token y cada fragmento de contexto**. Si utilizas un modelo local, aún debes comprobar si los plugins y el navegador salen a Internet.

Por último, las respuestas de agentes que leen páginas web se deben tratar como **datos no confiables**. Un README externo puede recomendar comandos destructivos. Una issue puede contener instrucciones dirigidas al modelo. El agente debe interpretarlas como material de trabajo, no como órdenes que superan las tuyas.

## ¿Cuál elegiría para un proyecto indie?

**OpenBot** me parece el candidato más cohesionado si el centro del trabajo son varios agentes de programación, canales que representan tareas reales, colas y workflows con revisión. La disponibilidad de clientes iOS y Android y el editor de flujos refuerzan esa idea de «mis asistentes, un mismo lugar». Su licencia actual, sin embargo, merece leerse antes de usarlo en un negocio.

**MausBot** me interesa especialmente si la prioridad son asistentes con integraciones amplias y **ordenadores distintos por capacidad**, desde el host hasta una VM o un escritorio remoto. Apache 2.0 ofrece una libertad de reutilización clara para el núcleo publicado; las piezas enterprise y los servicios externos mantienen sus propias condiciones. Sus mecanismos de automatización y aprobación merecen evaluarse con un caso real, no solo con una demo.

No diría que MausBot «no tiene workflows» ni que OpenBot «no puede conectarse a servicios»: sería una comparación injusta de mensajes de marketing. Lo que difiere es el énfasis de su documentación y el recorrido más natural de cada interfaz. Para decidir hay que probar una misma tarea pequeña en ambas, con el mismo motor y los mismos permisos, y comparar **qué se puede verificar al final**, no cuántos botones aparecen en la pantalla.

Mi elección inicial, a partir de la documentación y **sin presentarla como una prueba de rendimiento**, sería OpenBot para coordinar trabajo de desarrollo cotidiano. Es el que continuaría explorando primero. Si mi necesidad principal fuera separar ordenadores de ejecución e integrar muchas aplicaciones, volvería a evaluar MausBot con la misma seriedad.

## Un experimento de una tarde, no una migración a ciegas

Antes de mover todo tu trabajo a cualquiera de estas plataformas, empezaría con un único experimento: un repositorio de prueba, una incidencia reproducible, un agente implementador y otro revisor. Daría acceso mínimo, documentaría el resultado esperado, fijaría un límite de iteraciones y exigiría un diff visible. Después repetiría el mismo circuito, pero disparado por una rutina programada.

Preguntaría al final: ¿pude identificar el cambio? ¿Se conservó el contexto útil? ¿Se detuvo al faltar información? ¿Pude negar una acción sin romperlo todo? ¿Dónde quedó el archivo final? ¿Qué ocurrió al reiniciar la máquina? Esas respuestas dicen más que una puntuación subjetiva de «inteligencia».

Si el experimento funciona, añadiría una segunda tarea: la investigación semanal de un tema, sin permisos de publicar. Solo después introduciría correo, calendario, despliegues y navegación con cuentas reales. La autonomía se gana por evidencias, no mediante un interruptor de Full access.

Y algo más: **el proyecto sigue siendo tuyo**. El historial de decisiones importantes debe vivir también en tus archivos y en Git, no únicamente dentro de una base de datos de un producto recién nacido. La portabilidad del trabajo vale tanto como la potencia del agente.

## Referencias y lectura relacionada

- [OpenBot — web oficial](https://openbot.run/) y [repositorio nightly-labs/openbot](https://github.com/nightly-labs/openbot).
- [OpenBot: guía de inicio y modelo de permisos](https://openbot.run/guides/openbot-101), [workflows](https://openbot.run/guides/ai-agent-workflow), [automatización local](https://github.com/nightly-labs/openbot/blob/main/docs/automation.md) y [registro de cambios](https://openbot.run/changelog).
- [MausBot — web oficial](https://mausbot.com/) y [OpenMausBot en GitHub](https://github.com/milind-soni/OpenMausBot).
- [MausBot: funciones](https://docs.openmausbot.com/docs/features), [motores de agente](https://docs.openmausbot.com/docs/providers), [automatización](https://docs.openmausbot.com/docs/features/automation), [seguridad](https://docs.openmausbot.com/docs/security) y [self-hosting](https://docs.openmausbot.com/docs/self-hosting).
- En ArceApps: [OpenBot vs Hermes vs Paperclip](/es/blog/openbot-vs-hermes-vs-paperclip-ai-agents-2026/), [ChatGPT Desktop y OpenCode](/es/blog/chatgpt-desktop-agent-orchestration/) y [OpenBot en profundidad: agentes, rutinas y workflows](/es/blog/openbot-workflows-agent-teams-guide-2026/).

## Lo que viene después del chat

La nueva era de los asistentes no empieza cuando una IA habla con otra. Empieza cuando podemos **darle una tarea verificable, saber dónde trabaja, decidir qué puede tocar, conservar el resultado y volver mañana sin reconstruir todo el contexto**. OpenBot y MausBot apuntan en esa dirección por caminos distintos, y ambos merecen atención.

La siguiente lectura es la [guía práctica de OpenBot](/es/blog/openbot-workflows-agent-teams-guide-2026/): cómo diseñar roles, organizar un canal, convertir una tarea repetible en workflow y evitar que la comodidad de una interfaz esconda un problema de permisos. Si estás probando alguno de los dos en proyectos propios, me interesa más saber **qué tarea lograste cerrar y comprobar** que cuántos agentes pusiste a funcionar a la vez.