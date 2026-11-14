---
title: "OpenBot vs Hermes vs Paperclip: ¿quién despierta al agente?"
description: "OpenBot, Hermes Agent y Paperclip comparados por la pregunta que lo decide todo a las 3 de la mañana: qué despierta al agente, qué recuerda y qué lo frena."
pubDate: 2026-11-14
lastmod: 2026-11-14
author: "ArceApps"
keywords:
  - "OpenBot"
  - "Hermes Agent"
  - "Paperclip"
  - "agentes proactivos"
  - "rutinas de agentes"
  - "orquestación de IA"
  - "automatización 2026"
canonical: "https://arceapps.com/es/blog/openbot-vs-hermes-vs-paperclip-ai-agents-2026/"
heroImage: "/images/openbot-vs-hermes-vs-paperclip-ai-agents-2026-es.svg"
tags: ["OpenBot", "Hermes Agent", "Paperclip", "Agentes IA", "Automatización", "Orquestación"]
category: ai-agents
reference_id: "7f2c4a19-8b3d-4c60-9e51-2a6d0b8c4f37"
---

Toda demo de agentes termina igual: alguien escribe algo. La herramienta piensa, llama a un par de funciones y suelta una respuesta que impresiona durante noventa segundos. Luego la persona cierra la pestaña y no vuelve a pasar nada hasta la siguiente demo.

Eso no es lo interesante. Lo interesante es qué ocurre a las 3 de la mañana, cuando no escribe nadie y algo de tu proyecto ha cambiado.

He pasado las últimas semanas dentro de tres plataformas que responden a esa pregunta de tres formas genuinamente distintas: **OpenBot** (el espacio de trabajo local-first de escritorio de Synthetify Labs), **Hermes Agent** (Nous Research) y **Paperclip** (el servidor de "empresas de agentes"). Ya escribí sobre [Hermes frente a OpenClaw](/es/blog/hermes-vs-openclaw) y sobre [la propuesta de Paperclip de una empresa sin humanos](/es/blog/paperclip-ai-empresa-cero-humanos). Este artículo no repite ninguno de los dos: va de la parte que separa un chat con herramientas de un sistema que sigue trabajando mientras duermes.

Una advertencia antes de los números: si has leído algo sobre "OpenBot" últimamente, comprueba de cuál hablas. Existe **otro proyecto con el mismo nombre** de CopilotKit en [open.bot](https://open.bot/). Todo lo que sigue se refiere a `nightly-labs/openbot`, la app de [openbot.run](https://openbot.run/). Otra licencia, otras funciones, otro producto.

Los datos de repositorio que aparecen abajo se leyeron de la API de GitHub el **14 de noviembre de 2026**, porque este ecosistema se mueve cada semana y una comparativa sin fecha es un rumor.

## El eje que no mide ningún benchmark

Los benchmarks miden modelos. No miden lo que de verdad determina si una plataforma de agentes te sirve: **qué hace que el agente empiece a trabajar, y qué hace que pare.**

Las tres herramientas saben leer un archivo, ejecutar un comando y llamar a una API. Las diferencias que importan están en la fontanería de alrededor:

| Origen del arranque | Qué significa de verdad | Cómo falla |
|---|---|---|
| **Reloj** | Salta un horario: cron, "cada día laborable a las 9:00" | Arranca cuando no hay nada que hacer e inventa trabajo para justificar los tokens |
| **Evento** | Algo de fuera llama: un webhook, una acción de GitHub, un formulario | Se entrega dos veces, o se entrega con la máquina dormida y se pierde en silencio |
| **Cola** | Se asigna trabajo: una tarea, una tarjeta, un comentario | Se acumula: seis cosas esperando detrás de una ejecución atascada |
| **Juez** | Un segundo modelo decide que no está terminado y continúa | No converge nunca, y te lo demuestra gastando |
| **Agente** | Otro agente le pasa el trabajo | Dos agentes se lo devuelven el uno al otro para siempre |

Hay un quinto patrón que parece proactividad y es lo contrario: **el sondeo en vacío**. Un agente que despierta cada cinco minutos para preguntar si ha pasado algo. La documentación de Paperclip argumenta en contra con una franqueza poco habitual, y el argumento vale para las tres herramientas: un agente que hace tic cada cinco minutos, cinco agentes en cadena, produce sesenta ejecuciones a la hora que en su mayoría dicen *nada que hacer, vuelvo a dormir*. La reacción humana es pausar a los agentes, y pausar es un interruptor brutal que también mata los despertares que sí querías. Su regla: *si te pasas el día pausando y reanudando un agente, el problema es el heartbeat, no tu flujo de trabajo.*

Tenlo presente, porque las tres plataformas apuestan de forma muy distinta en ese espectro. OpenBot apuesta por un equipo tamaño humano encima de tu mesa. Hermes apuesta por un planificador con memoria. Paperclip apuesta por un organigrama donde el trabajo llega en forma de ticket.

## Los tres, en un párrafo cada uno

**OpenBot** es una app de escritorio (macOS, Windows, Linux) que ejecuta como agentes las CLIs de IA que ya pagas —Codex, Claude Code, Gemini, Grok, OpenCode, Cursor, Cline, Pi, Mercury, cualquier agente ACP—, cada una con su espacio de trabajo, su hilo, su cola y su conversación. Es local-first: la base SQLite es tuya y los archivos son tuyos. 7.659 estrellas, 771 forks, PolyForm Noncommercial 1.0.0 (source-available; el uso comercial exige licencia de pago), una release casi diaria y apps nativas de iPhone y Android que son clientes del ordenador que ejecuta OpenBot.

**Hermes Agent** es un agente en Python con licencia MIT de Nous Research que crece contigo: memoria persistente en `~/.hermes/`, skills que se escribe a sí mismo, un gateway de mensajería para una veintena de plataformas de chat, cron con disparadores por evento, un tablero Kanban durable donde cada tarea es una fila en SQLite y bucles de objetivo. 263.302 estrellas, 59.341 forks, repositorio creado en julio de 2025, primera release pública en febrero de 2026. Hermes Cloud (agentes alojados) arranca en 20 $/mes en el plan Plus.

**Paperclip** es un servidor Node.js con interfaz React que orquesta un *equipo* de agentes: organigrama, roles, líneas de reporte, presupuestos en dinero, fases de revisión y aprobación, proyectos privados y rastro de auditoría. No es un framework de agentes; le da igual cómo esté construido el tuyo, solo que sepa recibir un heartbeat. 113.834 estrellas, 18.893 forks, MIT, Node 24.11+, Postgres embebido en local, `npx paperclipai onboard --yes`. Paperclip Cloud existe solo como lista de espera, sin fecha ni precio público.

Tres productos, tres filosofías. Ahora la parte que todo el mundo se salta: cómo despierta cada uno.

## OpenBot: una app que lleva su propio reloj

La primitiva de OpenBot es la **rutina**, y su definición es refrescantemente estrecha: *una instrucción y las horas a las que ejecutarla*. Cuando salta, el agente trabaja en su espacio y en su hilo, así que el resultado aterriza donde ya está el contexto, y el historial de ejecuciones queda al lado. El hilo marca qué turnos inició una rutina, lo que suena cosmético hasta la primera vez que confundes una respuesta programada con algo que pediste tú.

Dos detalles de la documentación dicen más del diseño que cualquier lista de funciones:

> Dimensiona la instrucción para que "nada que reportar" sea una respuesta normal. Una rutina que siempre tiene que encontrar algo, siempre se lo inventará.

> Una rutina es una instrucción para un agente, no un ejecutor de trabajos para tu máquina. No tiene política de reintentos ni grafo de dependencias, y es la herramienta equivocada para cualquier cosa que deba ocurrir exactamente una vez en un momento exacto.

Es una descripción honesta de un límite deliberado. OpenBot no intenta ser Airflow con un LLM en medio. Intenta ser ese compañero que revisa algo cada mañana.

**Horarios y webhooks.** Las rutinas se ejecutan con horario, y también existen rutinas por webhook. Lo interesante es qué pasa cuando el host está dormido. En un servidor alojado, OpenBot se detiene tras un periodo de inactividad pero conserva sus datos, y despierta poco antes de una rutina programada para que dispare a tiempo. Los mensajes y las entregas de webhook también lo despiertan: la primera entrega recibe un "inténtalo más tarde" mientras el servidor arranca, lo que tarda unos minutos, y la mayoría de emisores de webhooks (sus ejemplos son Shopify y Stripe) reintentan por su cuenta durante horas. No es un disparador garantizado exactamente-una-vez; es un sistema que asume que la red volverá a llamar.

**Colas y canales.** Cada agente tiene su cola FIFO con pausa, reanudación, cancelación y persistencia a prueba de caídas. Un **canal** es un hilo compartido que varios agentes leen y escriben, con **un propietario de la tarea a la vez** y un traspaso explícito. Tú conservas Stop, Resume, Reassign, Archive y Restore. El traspaso es un mensaje, así que puedes leer quién cogió el trabajo y por qué. Es una primitiva de colaboración mucho mejor que "lanzo cinco agentes y a ver", porque hace legible la propiedad.

**El modelo de respaldo.** Si el plan de un agente llega a su límite, o el proveedor está caído o sobrecargado, el agente puede pasar a un modelo de respaldo en otro proveedor conservando su chat y su espacio de trabajo, y deja una nota en el chat diciéndolo. Para quien haya visto morir una sesión de Claude Code a mitad de refactor por un rate limit a las 2 de la mañana, esta es la función más práctica del producto.

**Memoria y skills.** Cada agente de OpenBot tiene instrucciones, memorias guardadas, skills, un espacio de trabajo y un hilo. No es la profundidad de Hermes (lo comparo abajo), pero tampoco es nada, y existe un importador de perfiles de Hermes: cada perfil se convierte en un agente de OpenBot con sus instrucciones, entradas de `MEMORY.md` y `USER.md` (sujetas a los límites de memoria de OpenBot) y skills personalizadas. Las credenciales, el historial de chat, las skills empaquetadas y la configuración MCP no viajan. El exportador te dice qué se saltó, que es la forma correcta de hacer una migración.

**La decisión de seguridad que hay que leer.** Los agentes de OpenBot corren con `danger-full-access` y `approvalPolicy: never`. El README lo dice sin rodeos: pueden leer y modificar archivos, ejecutar comandos, usar la red y controlar el navegador embebido sin confirmaciones por acción después del consentimiento inicial. Puedes fijar el acceso por agente (completo, solo workspace, preguntar primero), y deberías. Para ser preciso con algo que circula por las comparativas: el aviso de Linux del README es sobre **no** arrancar OpenBot con `--no-sandbox`, que elimina la frontera entre el renderer y el resto del ordenador. No es un aviso sobre ejecutar Hermes. No encontré ninguna fuente primaria para esa afirmación, y la busqué.

**Dónde gana OpenBot:** es el único de los tres con apps nativas de móvil, el único donde "mis agentes usan los planes de ChatGPT y Claude que ya pago" es el comportamiento por defecto y no una integración, y el único que se siente como un espacio de trabajo y no como un panel de control. **Dónde pierde:** durabilidad. Una app de escritorio es una app de escritorio. Si la máquina duerme, el equipo duerme — salvo que pagues un servidor alojado (desde 20 €/25 $ al mes en Starter) o lo montes tú en un VPS.

## Hermes: un planificador con cuerpo

Hermes tiene cinco mecanismos distintos que pueden iniciar trabajo, y confundirlos es la razón principal de que la gente lo configure mal. Las fronteras son más nítidas de lo que parecen:

| Mecanismo | Dónde vive | Disparador | Cuándo usarlo |
|---|---|---|---|
| `cron` | Fuera de toda sesión, planificador durable | Hora, intervalo o una ruta de webhook | El trabajo debe correr sin nadie y sobrevivir reinicios |
| `/heartbeat` | Dentro de una conversación | Tiempo ocioso cumplido | Quieres que el agente vigile algo *en este hilo* |
| `/loop` | Dentro de una conversación | Cadencia fija o condición | Sondear un despliegue, iterar hasta verde, monitorizar durante una sesión |
| `/goal` | Dentro de una conversación | Un modelo juez decide que el objetivo no está cumplido | "Sigue hasta que esto esté de verdad terminado" |
| Kanban | Un tablero durable aparte | Tarea creada, dependencia resuelta, revisión pedida | Trabajo que cruza agentes, necesita revisión o debe sobrevivir a la sesión |

**Cron, en detalle.** Hermes cron hace lo que esperas —expresiones cron, intervalos, ejecuciones únicas, zona horaria por trabajo, pausar/reanudar/editar/disparar/eliminar, ventanas de recuperación para ocurrencias perdidas (la mitad del periodo, acotada entre dos minutos y dos horas por defecto, configurable por trabajo)— y además tres cosas que cambian el diseño:

1. **Trabajos cron disparados por webhook.** Un trabajo puede llevar una ruta de webhook y dispararse en el momento en que ocurre algo, en vez de esperar al siguiente tic. Un PR recibe feedback, un servicio suelta una alerta, el trabajo despierta.
2. **Modo sin agente.** Un trabajo puede ejecutar un script con horario y entregar su stdout tal cual, con cero intervención del LLM. Suena a nota al pie y es la diferencia entre un bucle de monitorización de 0 € y uno de 40 €/mes.
3. **Validación antes del despacho.** Antes de gastar un token, el planificador comprueba que la clave del proveedor resuelve, que las skills adjuntas están listas, que el destino de entrega tiene credenciales y que los servidores MCP nombrados resuelven. Si no, el trabajo queda en `blocked_config` y recibes **una** alerta, no una por tic. Un trabajo mal configurado no gasta dinero.

Los trabajos cron también cargan skills, corren dentro de un directorio de proyecto (`--workdir`, que inyecta el `AGENTS.md` y hace que las herramientas de archivo y terminal operen ahí), admiten modelo y esfuerzo de razonamiento fijados por trabajo, y entregan el resultado al chat de origen o a cualquier destino configurado. Y una ejecución de cron no puede crear más trabajos cron: la programación en cadena está desactivada por diseño. Decisiones pequeñas, todas en la dirección correcta.

**El tablero Kanban es la cola de verdad.** Cada tarea es una fila en `~/.hermes/kanban.db`. Un bucle despachador recorre los tableros, recupera reclamaciones obsoletas y workers caídos, promociona tareas cuyos padres están hechos y lanza el perfil asignado como un proceso del sistema completo con su propio espacio de trabajo. Las tareas tienen estados (`triage`, `todo`, `ready`, `running`, `blocked`, `review`, `done`), dependencias, comentarios que se convierten en contexto en el siguiente arranque, bloqueos con tipo (dependencia, falta de input, capacidad, transitorio) y **contratos de finalización de PR**: una tarjeta puede declarar `OWNER/REPO` y no puede completarse hasta que pasen los checks obligatorios del repositorio en el commit exacto de cabeza. Los heartbeats también son filas, así que una ejecución larga se ve viva en vez de invisiblemente atascada.

Esto importa para la proactividad porque un tablero es una cola con memoria. Un trabajo cron que crea tres tarjetas y muere deja tres tarjetas. El trabajo no se evapora porque un proceso se cayera.

**Bucles de objetivo.** `/goal` fija un objetivo permanente; después de cada turno, un modelo juez comprueba si está cumplido y, si no, inyecta un prompt de continuación en la misma sesión hasta que lo esté o se agote el presupuesto de turnos. Las tarjetas de Kanban pueden correr en ese mismo modo. La documentación es inusualmente honesta con el límite: `/goal` es de una sola sesión y nunca crea tarjetas; si quieres trabajo en el tablero, lo pones tú en el tablero. El modo de fallo es real —un juez que sigue diciendo "aún no" mientras el agente recoloca sillas—, y por eso existen el presupuesto de turnos y el aviso de checkpoint cerca del 90%.

**Hooks.** Cuatro sistemas: hooks de gateway (manejadores Python sobre eventos del gateway, solo gateway), hooks de plugin, hooks de shell que pueden bloquear una llamada a herramienta y **webhooks salientes** que empujan eventos de ciclo de vida firmados a endpoints externos. Ese último es cómo Hermes participa en un sistema que no es suyo: le dice a tu CI, a tu panel o a otro agente que algo pasó.

**Dónde gana Hermes:** el planificador, la cola y la memoria viven en el mismo proceso, y el destino de entrega es una app de chat. Un cron que termina a las 3 de la mañana manda un mensaje de Telegram que no despierta a nadie; uno que falla a las 3 manda uno que sí. Es MIT, así que el uso comercial es libre, y la opción alojada mantiene al agente vivo cuando tu portátil no lo está. **Dónde pierde:** no hay app nativa de móvil (tu móvil es Telegram, Signal o WhatsApp), no hay presupuesto en dinero por agente (topes de turnos, límites de gasto en algunas herramientas y los topes por miembro del plan Business en su lugar), y la superficie de configuración es genuinamente grande. Una flota de cron es un animal de compañía: la vas a mantener.

## Paperclip: el organigrama que reparte trabajo

Paperclip parte del supuesto contrario: los agentes deben estar dormidos casi todo el tiempo, y la estructura de la organización decide quién despierta. Su documentación lista **cuatro** orígenes de arranque, y el marco merece copiarse para tus propios sistemas:

| Origen | Qué lo dispara |
|---|---|
| Temporizador | Pasa un intervalo de heartbeat, haya trabajo o no |
| Asignación | Se asigna una tarea al agente, o llega un comentario a una de sus tareas abiertas |
| Bajo demanda | Pulsas "Wake now", o otro agente le pasa trabajo |
| Automatización | Una rutina salta con su horario y le entrega al agente un issue |

Los heartbeats por temporizador vienen **apagados por defecto** en agentes nuevos, y ese defecto es lo más opinionado del producto. Su razonamiento es el párrafo que cité antes: el ruido produce pausas, y las pausas matan los despertares por evento que sí querías. La combinación recomendada es *heartbeat apagado, despertar bajo demanda encendido*, lo que significa que el agente parece activo en el panel las 24 horas y no consume nada hasta que le llega trabajo al escritorio.

**Las rutinas** son el sitio del trabajo programado: una definición de trabajo reutilizable con disparadores. Los tipos soportados incluyen un **horario** (cron, en tu zona horaria, mostrado en inglés llano en la interfaz), un **webhook** (una URL firmada que cualquiera de fuera puede llamar), un **webhook de GitHub** y un **disparador de API**. Cuando un disparador salta, la rutina crea o reabre una tarea, la asigna, y la asignación despierta al agente. La ejecución aparece en la bandeja con un enlace a la rutina que la causó, así que "¿por qué corrió este agente?" siempre tiene respuesta. Hay Run now con variables por ejecución, marcadores `{{variable}}`, secretos por rutina, políticas de entrega para ejecuciones solapadas y horarios perdidos (coalescer si hay una activa, saltar las perdidas por defecto) y un historial de revisiones.

**El dinero.** Hay presupuestos por empresa, por agente y por proyecto. Un aviso salta al 80% por defecto y una parada dura al 100%: Paperclip pausa el ámbito, cancela las ejecuciones en cola y en marcha y rechaza las nuevas, manteniendo las tareas asignadas para que se reanuden cuando subas el tope. Los presupuestos de empresa y agente se reinician a las 00:00 UTC del día 1; los de proyecto son de por vida por defecto. Solo un usuario a nivel de board puede subir un tope. Cada ejecución registra proveedor, modelo, tokens y coste, y el gasto queda atado a la ejecución y al issue.

**Gobernanza.** Las acciones sensibles pueden requerir firma humana. Los esfuerzos grandes pueden requerir revisar un plan antes de asignar a nadie; cambiar el plan resetea la aprobación. La política de ejecución tiene tres capas —comentario obligatorio para cerrar, fase de revisión opcional, fase de aprobación opcional— con un contador de rondas (tres por defecto) que escala a un humano cuando dos agentes no convergen. El rastro de auditoría registra qué leyó, decidió e hizo el agente.

**Dónde gana Paperclip:** es el único de los tres donde "quién puede gastar qué y quién firma" es un objeto de primera clase y no una convención. Si tres personas comparten el equipo de agentes, esa es la diferencia entre un sistema y un incidente. **Dónde pierde:** es un servidor que ejecutas tú (Node 24.11+, Postgres), no hay app nativa de móvil (una interfaz web responsive, alcanzable con Tailscale o VPN), la nube es una lista de espera y no hay memoria persistente por agente: el contexto vive en tareas e hilos, por diseño. La respuesta de Paperclip a "qué aprendimos el mes pasado" es un documento en una tarea, no un archivo de memoria.

## El mismo trabajo, de cuatro maneras

Las comparativas abstractas no sirven. Aquí van cuatro trabajos concretos, resueltos con cada plataforma como los resolvería de verdad. Ninguna herramienta gana los cuatro.

### Trabajo 1: un resumen nocturno de la build en el chat

El trabajo: cada noche a las 02:00, ejecutar la suite de tests, resumir los fallos y dejar el resultado donde lo vea con el café.

**OpenBot.** Una rutina en el agente `test-engineer`: *"Ejecuta `./gradlew testDebugUnitTest`, lista los tests que fallaron desde la ejecución anterior y nada más."* Salta a las 02:00, trabaja en su hilo y el resultado está en la app. Los agentes pueden responder en Slack, Discord o Telegram, así que el resumen también puede aterrizar en un canal. Si el portátil está cerrado y estás en un servidor alojado, el servidor despierta antes de la rutina. Si estás en la app de escritorio, no corre nada: esa es la limitación honesta, y es la razón de que exista el plan alojado.

**Hermes.** Un trabajo cron con `--workdir` apuntando al repo, para que el `AGENTS.md` y las herramientas de terminal estén en su sitio, y entrega a Telegram. Si el trabajo solo necesita ejecutar un script y pegar la salida, el modo `no_agent` lo hace gratis. Si el comando de tests falla porque la clave del proveedor caducó, la validación previa lo marca `blocked_config` y te avisa una vez en vez de cuarenta.

**Paperclip.** Una rutina con disparador de horario asignada al agente de QA, que produce una tarea cada noche. La ejecución es una tarea real con hilo de comentarios, así que el resumen de hace tres semanas es buscable, y el gasto de cada noche queda registrado. Si el presupuesto del agente de QA está agotado al 100%, la tarea de la rutina se crea y espera en vez de no ejecutarse en silencio.

**Veredicto.** Hermes para un desarrollador solo (más barato, más control, entrega en una app de chat). Paperclip si el resumen forma parte de un proceso auditable. OpenBot si ya vives en la app y tu máquina está encendida, o pagas un servidor alojado.

### Trabajo 2: llega un pull request a las 23:40

El trabajo: cuando se abre un PR, revisarlo, ejecutar los checks y aprobarlo con un resumen o pedir cambios.

**OpenBot.** Una rutina por webhook despierta al agente revisor; el agente trabaja en un canal con el agente implementador, coge la propiedad de la tarea y la devuelve. El traspaso es un mensaje, así que por la mañana lees la cadena de razonamiento. Lo que OpenBot **no** te da es una aprobación que el runtime haga cumplir: los agentes pueden decir "aprobado" y nada impide un merge. La puerta es tu protección de rama.

**Hermes.** Un trabajo cron con ruta de webhook se dispara al instante con el evento de GitHub, o se crea una tarjeta en el tablero y el despachador la recoge. La revisión es una transición de tarjeta: `kanban_request_review` la mueve a un perfil revisor, `kanban_request_changes` la devuelve con un comentario, y un contrato de finalización de PR significa que la tarjeta no se cierra hasta que pasen los checks obligatorios del repo en el commit exacto. Esa última parte es la diferencia entre "el agente dice que funciona" y "el repositorio está de acuerdo".

**Paperclip.** Una rutina disparada por webhook de GitHub crea una tarea, la asignación despierta al revisor, y la política de ejecución encamina el cierre por una fase de revisión y, si la configuraste, por una fase de aprobación humana. El agente literalmente no puede darlo por hecho sin el comentario y la firma. Con presupuestos, un bucle de revisión que va y viene cuesta dinero que puedes ver y parar.

**Veredicto.** Paperclip, si el PR es un proceso de negocio con firma. Hermes, si quieres que el tablero y el repo sean la misma fuente de verdad y el único humano eres tú. OpenBot, si el valor está en ver discutir a los dos agentes y leerlo luego.

### Trabajo 3: páralo, que está gastando

El trabajo: un agente se emociona a la 01:00 y empieza a generar 400 variantes de un puzzle.

**OpenBot.** Puedes parar la ejecución y reasignar el canal. No hay presupuesto en dinero por agente; el límite es el plan del proveedor, y el modelo de respaldo puede mover al agente a otro proveedor cuando el primero llega a su tope. Eso es estupendo para la continuidad y terrible para la sorpresa en la factura, exactamente en la misma medida.

**Hermes.** No hay tope de dinero por agente. Lo que sí hay: presupuestos de turnos, modelos fijados por trabajo (para que el trabajo ruidoso corra en un modelo barato), modo `no-agent` para todo lo que no necesita modelo, y la posibilidad de parar un cron en marcha sin tocar su horario. Si usas una herramienta MCP con límites de gasto, se aplican. En dinero, la respuesta honesta es que Hermes te da palancas, no un libro mayor.

**Paperclip.** Este es el caso para el que se construyó el producto. Aviso al 80%, parada dura al 100%, ejecuciones en cola y en marcha canceladas, trabajo nuevo rechazado, tareas preservadas hasta que subas el tope y un registro de coste por ejecución que puedes atribuir a una persona y a un proyecto.

**Veredicto.** Paperclip por amplio margen. Si ejecutas agentes que tocan APIs de pago, una parada dura con auditoría no es un extra.

### Trabajo 4: la máquina se reinicia a las 04:00

El trabajo: un despliegue, una actualización del kernel o una caída en mitad de una ejecución, y el trabajo no puede desaparecer en silencio.

**OpenBot.** Las colas son persistentes y a prueba de caídas, las conversaciones sobreviven a los reinicios y los servidores alojados se paran y reanudan alrededor de las rutinas. En la app de escritorio, una ejecución caída es una ejecución caída: lo verás al abrir la app.

**Hermes.** El tablero Kanban es SQLite en disco. Un worker que muere es reclamado por el despachador (PID desaparecido, reclamación caducada), la tarea vuelve a `ready` y se lanza un worker nuevo con el hilo de comentarios como contexto. Las ejecuciones de cron tienen recuperación de admisión: una ejecución interrumpida conserva su identidad, y un resultado terminal conocido se entrega a la cola de entrega sin volver a ejecutar al agente.

**Paperclip.** Las ejecuciones son filas con estado y auditoría; un heartbeat atascado es una ruta de depuración documentada y no un misterio, y la tarea sigue asignada. Las rutinas tienen políticas explícitas de recuperación para cuando el planificador estuvo apagado.

**Veredicto.** Hermes y Paperclip, en ese orden para un montaje personal. OpenBot es honesto al ser una app: colas durables, no un servicio durable.

### Trabajo 5: preguntar desde el tren

**OpenBot** tiene apps nativas de iPhone y Android que se conectan a tu ordenador, así que el espacio de trabajo del agente va en tu bolsillo sin VPN.

**Hermes** no tiene app nativa; el móvil es Telegram, WhatsApp, Signal, Slack o SMS, y el agente responde ahí con la misma memoria. Hermes Desktop y la webapp cubren el escritorio.

**Paperclip** tiene una interfaz web responsive que funciona como PWA, pero por defecto escucha solo en la máquina; el acceso remoto es Tailscale, una VPN o una dirección pública que configures.

**Veredicto.** OpenBot para app nativa, Hermes para "ya está en mi app de chat", Paperclip para "lo abro en el portátil".

## Memoria y skills: qué sobrevive a la noche

Proactividad sin memoria es automatización con pasos extra. Aquí la comparación es menos halagüeña para dos de los tres, así que voy a ser concreto.

| | OpenBot | Hermes Agent | Paperclip |
|---|---|---|---|
| Memoria persistente por agente | Sí — instrucciones, memorias guardadas (con límites), espacio de trabajo | Sí — `MEMORY.md` + `USER.md` por perfil, inyectadas como instantánea congelada, presupuesto de caracteres duro | No — el contexto vive en tareas, hilos y documentos de proyecto |
| Skills | Sí — skills y un Marketplace; importa skills personalizadas de Hermes | Sí — skills con divulgación progresiva, autoescritas durante el trabajo con `skill_manage` | Sí — biblioteca de skills de empresa, versionadas y testeables en Skill Studio |
| Recuerdo de sesiones pasadas | Historial de conversación por agente | Búsqueda de sesiones con FTS5 sobre todo el historial | Búsqueda de tareas; ejecuciones auditadas |
| Qué compone con los meses | Instrucciones que refinas, archivos en el espacio de trabajo | Memorias + skills + archivo de sesiones | Documentos, planes y proceso |

La diferencia práctica: con Hermes, la décima vez que el agente depura un problema de daemon de Gradle se escribe una skill sobre ello y la undécima sale barata. Con OpenBot obtienes un espacio estable y un archivo de instrucciones bien escrito, y la mejora es la que escribiste tú. Con Paperclip la mejora es organizativa: mejores planes, mejor revisión, mejores presupuestos; el conocimiento vive en la empresa, no en un agente.

Ninguna de las tres está mal. Pero si tu pregunta es "¿esto se va a volver mejor en mi trabajo concreto sin que yo lo reentrene?", Hermes es el único de los tres con un mecanismo para ello.

## Dinero y licencia

| | OpenBot | Hermes Agent | Paperclip |
|---|---|---|---|
| Licencia del código | PolyForm Noncommercial 1.0.0 | MIT | MIT |
| Uso comercial | Licencia de pago (Starter 10 €/mes; Team 25 €/mes base para 2 asientos + 15 € por asiento extra hasta 10; 10% menos con servidor alojado, 20% de descuento anual) | Gratis, incluido comercial | Gratis, incluido comercial |
| Alojado | Servidores en la UE desde 20 €/25 $ al mes (Starter), facturación mensual o anual | Hermes Cloud: Free / Plus 20 $ / Super 100 $ / Ultra 200 $ al mes; Business sin precio público | Cloud: solo lista de espera, sin precio publicado |
| Qué pagas por modelos | Tus planes actuales de ChatGPT / Claude / Gemini / Grok, o claves de API | 200+ modelos vía Nous Portal, o tus propias claves | Lo que usen los adaptadores de tus agentes; el coste de cada ejecución se registra contra un presupuesto |
| Autoalojado | App de escritorio, o VPS con Docker | CLI, gateway, escritorio, webapp | Un proceso Node.js con Postgres embebido |

Dos cosas que la gente interpreta mal. Primera: OpenBot es gratis para uso personal y no comercial, y **eso se acaba en el momento en que tu proyecto factura**; el artículo que estás leyendo describe una plataforma que necesitaría licencia comercial si generase ingresos. Segunda: los 20 $ de Hermes Cloud son un agente alojado, no una cuota de licencia; autoalojarlo es genuinamente gratis y MIT. La nube de Paperclip no existe todavía en ninguna forma comprable, así que cualquier comparativa que cotice un precio de Paperclip Cloud se lo está inventando.

## Matriz de decisión

| Si eres esto | Elige | Porque |
|---|---|---|
| Desarrollador solo, una máquina, quieres agentes que usen tus planes de ChatGPT/Claude y tenerlos en el móvil | **OpenBot** | Móvil nativo, planes que ya pagas, Vault para logins, modelo de respaldo |
| Desarrollador solo con servidor, quieres agentes que no paren y lo recuerden todo, vives en Telegram | **Hermes** | Cron + webhooks + Kanban + memoria + MIT, por el precio de los modelos |
| 3–10 personas compartiendo agentes, con dinero que hay que topar y trabajo que hay que firmar | **Paperclip** | Organigrama, presupuestos, política de ejecución, proyectos privados, auditoría |
| Un producto que debe correr de noche, sin nadie, y recuperarse de caídas | **Hermes**, o **Paperclip** si hay equipo | Cola y planificador durables con semántica de recuperación |
| Demo de un equipo de agentes en un escritorio, hoy | **OpenBot** | Es una app: la descargas y funciona |
| Un techo duro de gasto por agente al mes | **Paperclip** | Parada dura al 100%, gasto registrado por ejecución |
| Agentes que deben mejorar en tu dominio con el tiempo | **Hermes** | Skills autoescritas + memoria + búsqueda de sesiones |

## La combinación que nadie documenta bien

No son mutuamente excluyentes, y los montajes más interesantes usan dos.

**Hermes dentro de Paperclip.** Paperclip trae un adaptador de Hermes (local) y otro de gateway. Dos caminos: *invitar* a un Hermes externo que ya corre en otra máquina (copiar el prompt de invitación en Hermes, aprobar la petición de unión, y Paperclip manda tareas al servidor API de Hermes), o crear un agente con la tarjeta de Hermes en el host de Paperclip y dejar que Paperclip lo arranque en un heartbeat. El adaptador local acepta modelo y proveedor, lista de toolsets, `timeoutSec`, `maxTurnsPerRun`, `persistSession`, `worktreeMode` y checkpoints; Hermes lee su modelo de `~/.hermes/config.yaml`, no de Paperclip.

La división del trabajo es limpia: Paperclip es dueño del organigrama, los presupuestos, las fases de revisión y aprobación y la auditoría; Hermes es dueño de la memoria, las skills, las treinta y pico herramientas, MCP y el enrutado multiproveedor. Hermes reporta tokens y coste, así que un presupuesto de Paperclip puede pausarlo. Y en el camino de gateway, **cada tarea de Paperclip obtiene su propia sesión de Hermes**, que es justo lo que quieres: la memoria de una tarea no se filtra a la siguiente, pero la memoria y las skills del perfil siguen aplicando.

**Hermes dentro de OpenBot.** El importador de OpenBot convierte perfiles de Hermes en agentes: instrucciones, memorias de `MEMORY.md` y `USER.md`, skills personalizadas, rutinas soportadas. Deja atrás credenciales, sesiones de chat, skills empaquetadas y ajustes MCP, con un informe de lo que se saltó. Si quieres la experiencia de escritorio y móvil con el agente que ya entrenaste, este es el camino de migración, y es una puerta de un solo sentido: exporta tu perfil de Hermes antes.

**La combinación que no montaría:** Paperclip y OpenBot en la misma máquina, los dos intentando ser dueños de la cola. Dos planificadores, dos juegos de presupuestos (uno imaginario), dos sitios donde una tarea puede quedarse atascada. Elige quién es el dueño de la cola.

## Lo que yo ejecutaría

Para un proyecto personal con un solo desarrollador: **Hermes como motor y planificador, Telegram como interfaz, y un trabajo cron que no haga ningún trabajo de LLM** — el bucle de monitorización barato que te avisa cuando algo se rompe. Añade OpenBot si quieres una cabina de escritorio y apps nativas de móvil y ya pagas Claude o ChatGPT; los dos conviven bien siempre que decidas qué rutina pertenece a cada uno.

Para un equipo pequeño con ingresos: **Paperclip como cáscara exterior, Hermes como runtime de agentes dentro, Codex o Claude Code para el código.** Obtienes presupuestos y firma donde hay dinero, memoria y skills donde se hace el trabajo, y una frontera de sesión por tarea que mantiene el contexto de un proyecto fuera del de otro.

Lo que no haría es elegir por número de estrellas. 263.000 en Hermes significan mucha gente que quería un agente MIT que recuerde; 113.000 en Paperclip significan mucha gente que quería dejar de ser el único adulto en una sala llena de agentes; 7.600 en OpenBot significan una apuesta más pequeña, más nueva y más enfocada. Son tres deseos distintos, y los números son solo los deseos contados.

## Cierre: la prueba que importa

Esta es la prueba que ahora hago a cualquier plataforma de agentes antes de confiarle un proyecto real. Escribo una rutina que tiene que producir **nada que reportar** nueve noches de cada diez, y la dejo una semana.

Una herramienta que despierta a su hora, no hace nada y se calla se ha ganado el siguiente trabajo. Una que despierta a su hora, se inventa algo para justificarse y me escribe a las 02:40 me ha contado exactamente qué hará con mi proyecto a escala. Y una que directamente no despierta me ha dicho cuál de los dos es responsable del reloj.

OpenBot pasa esta prueba en una máquina que sigue encendida. Hermes la pasa en una máquina que no necesita estarlo. Paperclip solo la pasa si la rutina está asignada a un agente con presupuesto y con motivo.

Los agentes ya están listos para trabajar sin ti. La pregunta es si has construido la parte que decide cuándo.

---

*Si quieres la mitad práctica de esto —una plataforma de puzzles y una app de brain training construidas de principio a fin con las tres, con los flujos nocturnos, el reparto de agentes, los costes y los modos de fallo— la escribí como caso de uso aparte: [Una plataforma de puzzles dirigida por agentes](/es/blog/puzzle-platform-brain-training-agents-case-study-2026).*
