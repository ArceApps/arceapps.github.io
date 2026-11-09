---
title: "Claude Desktop: conectar OpenCode y agentes externos"
description: "Conecta Claude Desktop a OpenCode mediante servidores MCP locales y extensiones: compara arquitecturas, permisos, seguridad, sesiones y conectores remotos."
pubDate: "2026-11-09"
lastmod: "2026-11-09"
author: "ArceApps"
keywords: ["Claude Desktop","OpenCode","MCP","desktop extensions","OpenRouter","agentes externos"]
canonical: "https://arceapps.com/es/blog/claude-desktop-external-coding-agents/"
heroImage: "/images/claude-desktop-external-coding-agents.webp"
tags: ["IA","Agentes","MCP","Claude","OpenCode"]
category: "ai-agents"
reference_id: "b57cc834-1ddf-4b6a-a81d-59920b01cd23"
---

> **Serie «Orquestación de agentes sin depender de un proveedor», entrega 2 de 5.** La [primera entrega](/es/blog/chatgpt-desktop-agent-orchestration/) explicó cómo separar ChatGPT, MCP, OpenCode y OpenRouter sin fingir que todos los planes ofrecen las mismas herramientas. Ahora cambiamos la puerta de entrada por Claude Desktop y examinamos qué ganamos, qué perdemos y cómo conservar el mismo servicio de orquestación.

## La paradoja: el cliente también importa

Solemos comparar modelos de IA como si el resultado dependiera exclusivamente de cuál razona mejor. Sin embargo, para un desarrollo que atraviesa varias herramientas, la ergonomía y los permisos del **cliente** pueden importar más que una diferencia pequeña en una evaluación de razonamiento. Un cliente que inicia un servidor MCP local de forma soportada permite un tipo de integración diferente a uno que solo admite apps remotas. No porque su modelo sea más inteligente, sino porque la frontera del proceso está en otro lugar.

Claude Desktop resulta interesante precisamente por el soporte documentado para **servidores MCP locales** y **extensiones de escritorio**. Anthropic ofrece un directorio de extensiones, instalación de paquetes personalizados y mecanismos para descubrir las herramientas conectadas. Eso abre la posibilidad de delegar una tarea a una sesión de OpenCode desde una conversación con Claude, sin necesidad de exponer directamente el puerto HTTP de OpenCode a Internet.

No es automático. Claude Desktop no ejecuta agentes OpenCode por interpretar sus nombres en el prompt. Necesita un servidor MCP que publique una herramienta y algún código que sepa convertir una llamada estructurada en una sesión real de OpenCode. Nuestro objetivo es reutilizar exactamente ese puente, con un transporte adecuado y una política de permisos estable.

## Lo que ya conocemos y lo que cambia

En la entrega anterior propusimos tres operaciones: crear trabajo, consultar estado y solicitar cancelación. El contrato es deliberadamente independiente del cliente. Si Claude Desktop descubre esas herramientas mediante MCP, no tendría por qué conocer el nombre del modelo usado por OpenCode o la estructura interna de sus sesiones. El agente ejecutor sigue siendo OpenCode; Claude actúa como interfaz de planificación y supervisión.

La diferencia principal es la ruta de conexión. Para una integración local en Claude Desktop, un servidor MCP puede ejecutarse como proceso hijo usando transporte por entrada/salida estándar. Para una integración remota, Anthropic documenta conectores personalizados cuyo tráfico proviene de su infraestructura de nube, incluso cuando el usuario conversa desde Claude Desktop. Son dos mecanismos distintos. No hay que concluir «como tengo una VPN y veo mi servidor desde casa, Claude Cloud podrá verlo».

Este matiz marca la arquitectura. Si la app y OpenCode están en el mismo ordenador, empezar con MCP local puede reducir piezas de red. Si el agente reside en un mini PC de casa y la conversación ocurre en otro dispositivo, hay que pensar si ejecutamos el puente cerca del agente, usamos un enlace privado accesible al proceso local o publicamos un conector remoto protegido. Cada opción tiene una política de confianza diferente.

## Claude Desktop no es Claude Code

Otra confusión frecuente: **Claude Desktop** es la aplicación conversacional; **Claude Code** es un agente de programación. Comparten proveedor y tecnologías, pero no son sinónimos. No basta con conectar Claude Desktop a OpenRouter para que ejecute automáticamente un agente de codificación. De la misma forma, instalar Claude Code no implica que Claude Desktop sepa orquestar sus sesiones a través de un conector genérico.

Podemos aprovechar Claude Desktop para dividir tareas, recabar contexto y llamar al puente. Podemos hacer que el puente invocase OpenCode, cuyo modelo a su vez podría venir de OpenRouter. Podríamos añadir Claude Code más adelante como un segundo ejecutor, siempre que contemos con una interfaz soportada y una política de permisos. Ese segundo agente sería distinto de elegir un modelo Claude dentro de OpenCode.

Separar conceptos es también una forma de reducir el acoplamiento. Si mañana cambio el ejecutor, Claude Desktop debería seguir mostrando «tarea aceptada», «en curso», «requiere aprobación» o «revisión disponible». No debería depender de conocer internamente el formato de cada proveedor para ofrecer la misma experiencia básica.

## Elegir entre servidor MCP local y conector remoto

Para un proyecto personal empezaría por el servidor local. Claude Desktop puede lanzar el proceso y comunicarse con él mediante MCP sin publicar una URL en Internet. Eso simplifica la primera prueba, pero no resuelve por arte de magia la seguridad: el proceso local hereda un entorno de ejecución y necesita límites de acceso a los proyectos. Un programa que puede leer todos los archivos de tu usuario sigue siendo peligroso aunque no tenga un puerto abierto.

El conector remoto tiene otro perfil. Anthropic indica que las conexiones remotas se originan desde su infraestructura, y por tanto el servidor debe poder recibirlas por un canal válido. Un puerto disponible solo por Tailscale en un ordenador no se vuelve accesible para los sistemas de Anthropic. Un túnel, proxy autenticado o servicio alojado puede ser parte de la solución, pero exige autenticación, control de red, métricas y posiblemente costes.

La decisión correcta no depende de cuál tiene más capturas bonitas. Depende de dónde vive el agente, dónde está la carpeta de trabajo, quién puede solicitar acciones y cuánto tiempo necesita durar una tarea. Para dos procesos en la misma máquina, MCP local es razonable. Para una orquestación accesible desde varios clientes y dispositivos, un servidor de tareas persistente separado del proceso de la interfaz suele ser más robusto.

## Un ejemplo de configuración local entendible

La documentación de MCP y Claude Desktop recoge la estructura \`mcpServers\` y el uso de un comando de arranque. Este ejemplo es **esquemático**: presupone que hemos implementado un puente local llamado \`arce-agent-bridge\` que habla MCP por stdio. No existe una utilidad oficial con ese nombre y no se crea solo por copiar este JSON.

~~~json
{
  "mcpServers": {
    "coding-orchestrator": {
      "command": "node",
      "args": ["/ruta/absoluta/al/puente/mcp-stdio.js"],
      "env": {
        "BRIDGE_CONFIG": "/ruta/privada/bridge-config.json"
      }
    }
  }
}
~~~

Las rutas deben apuntar a archivos reales que existan en la máquina donde se ejecute Claude Desktop. En Windows variarán la separación de directorios y el comando disponible. En macOS, el entorno de una app gráfica no siempre coincide con el de una sesión interactiva de terminal: un ejecutable que funciona en un shell puede no resolverse al lanzar la app. Conviene usar rutas absolutas para comandos y archivos críticos y verificar los registros de proceso que ofrece el cliente.

No pondría la clave de OpenRouter dentro de ese JSON. El puente puede leer una configuración privada y el proceso OpenCode puede recibir sus secretos por un mecanismo adecuado del sistema operativo. El archivo de configuración de Claude es parte de la infraestructura local, no un almacén que debamos publicar en Git. La forma exacta de empaquetar y proteger credenciales depende del sistema y del modo de extensión.

## Extensiones de escritorio: distribución, no una API mágica

Anthropic documenta la instalación de extensiones de escritorio y de paquetes \`.mcpb\`. Estas extensiones facilitan distribuir y configurar servidores MCP locales sin pedir al usuario que edite manualmente archivos JSON. Son útiles cuando ya tenemos un puente estable y queremos reducir errores de instalación. No cambian el principio fundamental: por detrás sigue existiendo un proceso con herramientas, permisos, dependencias y una superficie de ataque.

En una primera versión no crearía un instalador. Priorizaría un puente ejecutable desde terminal que registre bien sus errores. Después de pasar las pruebas de aceptación, empaquetaría el servidor con su manifiesto, metadatos y campos de configuración sensibles. La documentación indica que determinadas configuraciones marcadas como sensibles pueden aprovechar el almacenamiento seguro del sistema operativo, pero esa protección no convierte en segura cualquier operación de la herramienta.

Una extensión además introduce un ciclo de actualizaciones. Si cambia el SDK de OpenCode o el contrato del bridge, hay que controlar las versiones compatibles. Tener una extensión de «un clic» que luego falla silenciosamente al iniciar sería peor que documentar una instalación más manual y fiable.

## Probar el puente antes de conectar un modelo

Me gusta empezar con una operación que no requiere inferencia: \`task_status\` de un identificador inexistente debería responder «no encontrado» de forma estructurada, sin lanzar OpenCode. Después una \`create_task\` con proyecto no autorizado debe fallar explícitamente. Solo entonces probaría una tarea de análisis real y comprobaría que el proyecto queda intacto.

La fase siguiente sería revisar los registros de Claude Desktop. Anthropic explica cómo inspeccionar los servidores MCP conectados, herramientas disponibles y mensajes de depuración. Si el bridge no aparece, el problema está en el arranque o registro; si aparece pero devuelve un error, hay que mirar el contrato, la autorización y la sesión subyacente. El modelo no tiene por qué narrar con precisión las causas de un fallo de proceso.

Un test interesante consiste en solicitar algo ambiguo: «optimiza el proyecto». El puente no debería tener acceso a un directorio implícito que el modelo elige arbitrariamente. La herramienta tendría que pedir un identificador de proyecto permitido y, si se trata de una modificación, un modo explícito que active la política de confirmaciones.

## Cómo representar un trabajo que tarda

El peor diseño para una herramienta MCP es una función que inicia un agente de programación y bloquea hasta que escribe toda la solución. El cliente podría cerrar la conversación, la red cortarse o el proceso tardar más que el timeout disponible. Si el servicio no tiene identidad persistente, el usuario no sabrá si el trabajo se perdió o continúa editando archivos.

Prefiero responder rápidamente con \`task_id\`, \`status\` y una descripción de la operación. Los progresos se recuperan con otra llamada. El servicio sabe si OpenCode está analizando archivos, si solicitó aprobación o si produjo un diff. El cliente presenta esos estados sin necesitar que Claude reconstruya la historia desde un hilo largo de conversación.

La cancelación necesita una definición precisa. Solicitar cancelación no garantiza que una acción de sistema ya ejecutada se deshaga. Si el agente creó una rama o cambió un archivo, el estado debería registrar qué permanece después de la interrupción. Recuperar el control no consiste en fingir que el tiempo retrocedió, sino en ofrecer mecanismos claros para inspeccionar y revertir el trabajo.

## Integrar OpenCode sin ocultar su sesión real

OpenCode documenta un servidor HTTP, un SDK y operaciones de gestión de sesiones. Eso permite al bridge conservar la correspondencia entre \`task_id\` y la sesión del ejecutor. No hace falta que Claude Desktop conozca los endpoints de OpenCode ni que el modelo improvise llamadas HTTP: el servidor de herramientas valida entradas y delega a un adaptador.

~~~text
Claude Desktop
    └── MCP stdio: create_task(project_id, goal, mode)
           └── bridge local
                  ├── política de proyectos y permisos
                  ├── registro de trabajos
                  └── cliente SDK OpenCode
                         └── sesión identificada
                                └── modelo configurado
~~~

La conversación puede pedir «revisa este cambio» y el servicio debe traducirla a un trabajo concreto: proyecto, referencia de Git, objetivo, límites y entregables esperados. Si no especifica la revisión que hay que hacer, la herramienta debería devolver una pregunta de aclaración a través del contrato; no es necesario resolver ambigüedades creando permisos excesivos.

Una sesión real de OpenCode puede contener instrucciones del proyecto, contexto y resultados de herramientas. Esa información es valiosa para el ejecutor, pero no toda debe volver al cliente. Prefiero exponer un resumen de trabajo, los archivos modificados, el enlace al diff y errores relevantes. Reducir el volumen de contexto también evita costes innecesarios al reintroducir registros extensos en un segundo modelo.

## ¿Qué papel conserva Claude?

Claude no debe ser un mero botón de lanzamiento que repite «tarea iniciada». Puede ayudar a descomponer un objetivo, detectar condiciones de aceptación deficientes y evaluar si vale la pena delegar. Pero esa decisión tiene que producir una orden verificable y autorizada. Cuando el bridge devuelve resultados, Claude puede explicar riesgos, proponer una revisión manual y solicitar una tarea de seguimiento.

No le asignaría permisos para alterar la política del servicio. Si Claude cree que necesita acceso adicional, la respuesta adecuada es pedir autorización al usuario, no reescribir su propia configuración. Un agente capaz de convencer a otro modelo de saltarse un control no es más eficiente; es una regresión de seguridad.

En un flujo de programación, reservaría la decisión de merge a una operación separada y explícita, idealmente realizada tras revisión del diff y CI. Separar orquestación de aprobación evita que un resultado prometedor se convierta automáticamente en código publicado sin inspección.

## Riesgos del proceso local

MCP local reduce la exposición de red, pero no elimina el riesgo de prompt injection. El agente puede leer archivos del repositorio, issues, webs o respuestas que contengan instrucciones maliciosas. Un README puede pedirle al modelo que imprima secretos, y una búsqueda web puede sugerir comandos peligrosos. El orquestador debería tratar esas entradas como datos, con un límite de confianza explícito.

Aislar el proceso de OpenCode en una cuenta o contenedor de menor privilegio puede ser razonable cuando trabaja con código descargado de terceros. Como mínimo, permitiría solo directorios de proyectos, restringiría comandos destructivos y separaría credenciales del proyecto. No basta con poner una frase de seguridad en la descripción del agente si el proceso puede ejecutar cualquier comando en el mismo usuario.

Las extensiones también requieren revisión. Un paquete de terceros puede ejecutar código en tu máquina. Comprobar su origen, versión, permisos y capacidad de actualización es tan importante como leer la descripción de su funcionalidad. Para un flujo personal crítico, un pequeño bridge auditado puede resultar más seguro que una extensión con decenas de dependencias que no necesitamos.

## Local frente a remoto: un ejercicio de decisión

Imaginemos tres situaciones. En la primera, Claude Desktop y OpenCode están instalados en un portátil y trabajan sobre un repositorio local. MCP por stdio es la opción más simple; el servidor HTTP de OpenCode puede escuchar solo en loopback. En la segunda, el ejecutor corre en un mini PC doméstico. Aquí debemos diseñar el acceso privado desde el proceso del bridge y no asumir que el conector remoto de Claude alcanzará una dirección Tailscale.

En la tercera, necesitamos controlar trabajos desde móvil, portátil y navegador. Un servicio de orquestación persistente, autenticado y accesible por los clientes soportados puede ser mejor base. Eso ya implica gestionar usuarios, reintentos, almacenamiento, monitorización y exposición de red. La simplicidad desaparece si copiamos una configuración local y la exponemos tal cual al exterior.

No hay una clasificación universal de «más potente». La ventaja de Claude Desktop local es reducir el número de piezas para un entorno de escritorio. La ventaja de una API remota es la independencia del dispositivo. Y la ventaja de mantener un contrato MCP uniforme es que no necesitamos reescribir los conceptos de tarea cada vez que cambia el cliente.

## Criterios para no duplicar trabajo

El objetivo de orquestar no es que Claude redacte un plan entero y OpenCode vuelva a investigar todo sin contexto. El bridge puede transferir un objetivo acotado, criterios de aceptación, restricciones y referencias a archivos; no necesita enviar cien pantallas de conversación. Un buen resumen de delegación define qué debe entregar el ejecutor, qué no debe tocar y cómo se verificará el resultado.

Del mismo modo, no pediría a Claude que releyese todos los logs de OpenCode para comprobar que hizo una tarea. Expondría eventos y artefactos: test pasado, diff producido, archivos afectados, estado de revisión. El modelo conversacional puede analizar esa información compacta sin gastar tokens en repetir historias completas.

La primera señal de que el diseño está madurando es que podemos detener una conversación, abrir otra y consultar el mismo trabajo sin reconstruir nada a mano. Eso exige estado persistente fuera de Claude y OpenCode, aunque el estado mínimo sea una tabla SQLite con identificadores, estados y referencias al ejecutor.

## Fallos de instalación habituales

Si Claude Desktop no descubre el servidor local, comprobaría primero la ruta del ejecutable, el directorio de trabajo, el entorno disponible para la app gráfica y los logs del servidor. Una ruta relativa que funciona desde una terminal no necesariamente funcionará desde la aplicación. Si el proceso termina de inmediato, una dependencia ausente o una excepción de arranque puede ser más probable que un error de protocolo sofisticado.

Si la herramienta aparece pero no responde, comprobaría la versión del SDK MCP, el transporte stdio y que el proceso no escribe logs de depuración en el canal reservado a mensajes del protocolo. Los mensajes de depuración deben ir por stderr u otro destino apropiado. Mezclar texto arbitrario con el protocolo puede corromper la conversación de herramientas.

Si OpenCode devuelve errores de credenciales, hay que revisar su proveedor, no introducir claves en el prompt para «probar». Si solo falla con determinados proyectos, revisar la lista permitida y los permisos del usuario que ejecuta el servicio. Cada límite tiene su propia prueba: no sirve abrir todos los permisos para averiguar cuál estaba rechazando una petición.

## Un criterio de aceptación reproducible

Antes de añadir un segundo agente real, completaría siete comprobaciones: conexión local visible, llamada de salud o estado, rechazo de proyectos desconocidos, creación de una tarea de análisis, recuperación de resultado tras reiniciar Claude Desktop, cancelación coherente y evidencia de que el repositorio no se modificó. Son pruebas baratas comparadas con las horas que se pierden depurando flujos intermitentes.

Después probaría el modo de propuesta de parche, limitado a una rama de prueba. La salida incluiría un diff y una lista de verificaciones ejecutadas. En ningún caso consideraría un resultado «aprobado» por el hecho de que el modelo use un tono convincente; los tests y la revisión humana siguen siendo límites reales.

Este texto no ofrece cifras de velocidad ni capturas de un conector propio en ejecución. Presenta una arquitectura posible respaldada por interfaces documentadas, no una medición de un producto terminado. Cuando una integración se implemente y mida, sus resultados pueden alimentar un artículo experimental separado.

## Lecciones aprendidas: elegir el cliente por su frontera

Claude Desktop tiene un camino documentado especialmente claro para servidores MCP locales y extensiones. Eso no lo hace automáticamente superior en todos los flujos: cambia la facilidad de despliegue en un ordenador y la forma de gestionar herramientas. La misma capa de orquestación debe seguir aplicando permisos, persistiendo tareas y evitando filtraciones de datos, independientemente del cliente.

Frente al diseño con ChatGPT, reutilizaría el contrato de herramientas, los perfiles de agentes, el registro de tareas y las pruebas de aceptación. Solo cambiaría el adaptador de conexión. Si al sustituir el cliente tenemos que rehacer toda la lógica de tareas, probablemente no habíamos separado bien las responsabilidades.

## Referencias

- [Anthropic: servidores MCP locales en Claude Desktop](https://support.claude.com/es/articles/10949351-primeros-pasos-con-servidores-mcp-locales-en-claude-desktop)
- [Anthropic: conectores remotos personalizados y requisitos de red](https://support.claude.com/es/articles/11175166-comienza-con-conectores-personalizados-usando-mcp-remoto)
- [MCP Python SDK: configuración de un host de escritorio](https://py.sdk.modelcontextprotocol.io/es/get-started/real-host/)
- [OpenCode: servidor HTTP](https://opencode.ai/docs/server)
- [OpenCode: SDK de cliente](https://opencode.ai/docs/sdk)
- [ArceApps: ChatGPT Desktop como orquestador](/es/blog/chatgpt-desktop-agent-orchestration/)
- [ArceApps: memoria compartida con servidores MCP](/es/blog/mcp-servers-memory-cross-agent/)

**Cierre.** Mi elección para experimentar sería un servidor local, un repositorio de ejemplo y permisos exclusivamente de lectura. Si el circuito es predecible, tiene sentido empaquetarlo y añadir ejecutores. El próximo episodio cambia de pregunta: ya no qué cliente utilizamos, sino **qué protocolo conecta cada pieza sin crear otra capa innecesaria**.
