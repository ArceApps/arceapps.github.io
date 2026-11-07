---
title: "ChatGPT Desktop y OpenCode: qué permite MCP"
description: "Descubre qué permite realmente MCP entre ChatGPT y OpenCode: diferencias entre web y escritorio, arquitectura con OpenRouter, permisos y límites por plan."
pubDate: "2026-11-07"
lastmod: "2026-11-07"
author: "ArceApps"
keywords: ["ChatGPT Desktop","MCP","OpenCode","OpenRouter","orquestación de agentes","coding agents"]
canonical: "https://arceapps.com/es/blog/chatgpt-desktop-agent-orchestration/"
heroImage: "/images/chatgpt-desktop-agent-orchestration.webp"
tags: ["IA","Agentes","MCP","OpenCode","OpenRouter"]
category: "ai-agents"
reference_id: "8a216b4c-c8f2-40c7-94a1-9d3a7845e551"
---

> **Serie «Orquestación de agentes sin depender de un proveedor», entrega 1 de 5.** En esta serie pasaremos de un cliente que solicita trabajo a otro agente a una arquitectura con varios ejecutores, revisión y control de costes. El índice de la serie, situado junto al artículo, enlaza automáticamente las entregas que ya están publicadas.

> **Antes de empezar:** esta es una arquitectura documentada y un procedimiento de integración, no una demostración de que todas las cuentas de ChatGPT pueden ejecutar un MCP propio con permisos de escritura. La disponibilidad de MCP y de acciones de modificación depende del plan y de las funciones habilitadas. El ejemplo de puente es ilustrativo; no afirmo haber realizado una prueba de extremo a extremo.

> **Compatibilidad comprobada (7 de noviembre de 2026):** OpenAI documenta la creación de conexiones MCP personalizadas en **ChatGPT web** para espacios Business, Enterprise y Edu con los permisos correspondientes. No documenta esa misma instalación como función universal de la **aplicación ChatGPT Desktop**. Por tanto, el flujo de escritorio de este artículo es una **arquitectura objetivo**, no un procedimiento actualmente garantizado. Para implementarlo hoy, parte de un cliente y plan compatibles, de Claude Desktop con MCP local o de una aplicación propia mediante API.

## La pregunta correcta no es qué modelo responde mejor

Imagina una tarea aparentemente pequeña: «Revisa el error del formulario de mi web, escribe un test, corrige la causa y deja preparado un pull request». Una conversación con un modelo potente puede razonar sobre el problema, pero eso no implica que tenga acceso al repositorio, sepa qué rama usar, pueda ejecutar pruebas o conserve una sesión de trabajo en el agente de programación preferido. El salto interesante no consiste en pedirle a otro modelo que escriba una respuesta. Consiste en **delegar una unidad de trabajo a otro agente con herramientas, estado, permisos y resultados observables**.

En este blog ya hablamos de [subagentes en OpenCode](/es/blog/opencode-subagents/) y del [orquestador Paseo](/es/blog/paseo-orchestrator-multi-provider-2026/). Aquellos artículos se centran en la organización dentro del ecosistema de agentes o en herramientas que ofrecen su propia interfaz. Aquí la pregunta es diferente: ¿podemos utilizar ChatGPT, desde su interfaz habitual, como una capa de coordinación sin renunciar a OpenCode, Claude Code u otros ejecutores? Sí, como arquitectura, pero no con una casilla mágica que conecte todos los proveedores. Hace falta diseñar el puente y respetar las limitaciones reales del cliente.

El objetivo práctico de esta primera entrega es comprender una ruta: **ChatGPT → servidor MCP remoto o túnel seguro → servicio de orquestación → API/SDK de OpenCode → modelo configurado en OpenCode**. La palabra «modelo» al final es intencional: OpenRouter puede servir el modelo que usa el ejecutor; no sustituye por sí mismo sus herramientas de programación.

## Cuatro piezas que conviene no confundir

**ChatGPT** es aquí el punto de entrada conversacional. Interpreta la petición, ayuda a acotar alcance y, cuando las herramientas conectadas están disponibles, puede invocarlas conforme a sus permisos. **MCP** expone capacidades como herramientas estructuradas, entradas con esquema y respuestas. **OpenCode** es un agente de desarrollo con sesiones, acceso controlado al entorno y acciones sobre código. **OpenRouter** es una vía para acceder a modelos de distintos proveedores mediante API; no es otro «trabajador» con su propia carpeta de proyecto por el mero hecho de cambiar una clave.

Esta distinción evita la trampa más frecuente al diseñar arquitecturas multiagente: una lista de modelos no equivale a una lista de agentes. Sonnet, Haiku y otros modelos pueden servir tareas distintas, pero el agente que ejecuta comandos, maneja herramientas y mantiene sesiones es una capa adicional. Si cambiamos el modelo de OpenCode, seguimos usando OpenCode. Si lanzamos una sesión independiente de Claude Code para revisar un parche, entonces sí tenemos otro ejecutor con su propio ciclo de vida.

MCP tampoco es una cola de trabajos ni una base de datos de tareas. Puede transportar la invocación «inicia esta sesión», pero alguien tiene que persistir su identificador, supervisar el estado, evitar duplicados y comunicar el resultado. Ese alguien es nuestro pequeño orquestador. Reducir su responsabilidad hace que sea mantenible: no debe inventar otro framework de agentes, solo traducir órdenes seguras a las APIs que ya existen.

## La limitación decisiva: ChatGPT no es un cliente MCP local universal

La documentación oficial de OpenAI distingue las **aplicaciones MCP remotas** de los servidores locales. En el momento de esta investigación, la conexión directa de ChatGPT a un proceso MCP local no está disponible del mismo modo que en Claude Desktop. Para conectar un proceso que vive en el ordenador o en una red privada, OpenAI documenta **Secure MCP Tunnel**; no conviene abrir un puerto de desarrollo públicamente y llamarlo integración.

Además, la ayuda de OpenAI describe una disponibilidad diferente según el plan. El soporte completo para acciones de escritura/modificación no debe darse por supuesto en cuentas personales: su despliegue está documentado para entornos Business, Enterprise y Edu, mientras que otros planes tienen límites más estrictos. También separa las capacidades de apps personalizadas, modo agente y *deep research*. Por eso cualquier tutorial que afirme «instala este JSON en ChatGPT Desktop y ya puedes controlar OpenCode» sin matices estaría simplificando en exceso o describiendo otro producto.

La primera comprobación debe ser funcional, no estética: ¿puede tu cuenta registrar una app MCP personalizada?, ¿qué operaciones admite?, ¿requiere aprobación?, ¿el servidor es accesible desde el entorno de ChatGPT? Si la respuesta a la primera pregunta es no, la arquitectura sigue siendo útil, pero el cliente ChatGPT no podrá realizar ese flujo con la cuenta y configuración actuales. Una alternativa es implementar la misma lógica mediante una aplicación propia con la API de OpenAI, que tiene requisitos y costes diferentes; no es idéntica a la app de escritorio.

## Arquitectura mínima: menos magia y menos superficie de ataque

El diseño que usaría tiene cuatro límites explícitos. La interfaz recoge la intención; el servidor MCP presenta un contrato reducido; el orquestador autoriza proyectos, registra trabajos y aplica límites; OpenCode es quien dispone de herramientas de programación. En lugar de ofrecer una herramienta genérica «ejecuta cualquier comando de shell» desde ChatGPT, ofrecería tres operaciones: crear trabajo, consultar trabajo y solicitar cancelación. No expondría lectura arbitraria del sistema de archivos ni una API para desactivar las confirmaciones.

~~~text
Cliente ChatGPT (si el plan permite esta conexión)
              |
       MCP remoto / túnel
              |
    create_task / task_status / cancel_task
              |
      Servicio de orquestación
       |                  |
  control y registro   OpenCode API
                          |
                   sesión de agente
                          |
             modelo vía proveedor elegido
~~~

Las tareas deberían vivir bajo un identificador generado por el servicio, distinto del ID interno de la sesión de OpenCode. Así podemos cambiar de ejecutor en el futuro sin romper enlaces del panel. Guardaría la fecha de solicitud, repositorio permitido, rama, estado, coste si está disponible, resumen y trazas mínimas. Las conversaciones completas, secretos, tokens y archivos del proyecto no deberían copiarse indiscriminadamente a esa base de datos.

El servicio necesita una lista permitida de repositorios y rutas. En un proyecto personal puede bastar una configuración declarativa, pero nunca aceptaría una ruta absoluta enviada por el modelo sin validarla. El modelo es un planificador probabilístico, no una autoridad para ampliar permisos. También separaría «analizar» de «modificar»: el primer tipo de trabajo puede ser automático; el segundo merece aprobación humana o un flujo explícito de privilegios.

## Primer paso: levantar OpenCode como servicio controlado

OpenCode documenta el modo servidor mediante \`opencode serve\`, una API HTTP y una especificación OpenAPI consultable localmente. No hace falta automatizar una interfaz de terminal con teclas simuladas. Esta es una diferencia enorme frente a propuestas que dependen de copiar texto de una ventana: la API puede manejar sesiones, mensajes, rutas, permisos y cancelaciones de manera estructurada.

~~~bash
# Ejemplo local. No publiques este puerto en Internet.
export OPENCODE_SERVER_PASSWORD="establece-un-secreto-fuerte"
opencode serve --hostname 127.0.0.1 --port 4096

# En otra terminal, verifica que responde.
curl -fsS http://127.0.0.1:4096/global/health
~~~

El endpoint de salud está documentado, pero si habilitas contraseña básica tendrás que proporcionar credenciales también en la comprobación. El ejemplo \`curl\` sin autenticación es válido únicamente para una instancia sin esa protección; con contraseña configurada, utiliza un cliente autenticado y no dejes el secreto en el historial. Tampoco confundas el servidor de OpenCode con el servidor MCP: son procesos o capas de protocolo diferentes y es el puente quien los conecta.

OpenCode proporciona además un SDK JavaScript/TypeScript. Si el orquestador ya usa Node, este SDK evita construir manualmente peticiones con rutas y estructuras que pueden evolucionar. Puedes iniciar servidor y cliente juntos o conectarte a uno existente. Elegiría la segunda opción para un servicio persistente, porque separa el proceso de trabajo del ciclo de vida del puente y facilita diagnosticar reinicios.

## Segundo paso: comprobar la API con una tarea inocua

Antes de conectar un cliente conversacional, haría una prueba reproducible contra un repositorio de ejemplo sin secretos. El objetivo no sería modificar la web real, sino demostrar que una sesión nace, admite una instrucción acotada y puede consultarse. La siguiente secuencia utiliza las operaciones publicadas del SDK: el contrato puede variar entre generaciones del paquete, así que hay que fijar versión y contrastarlo con su documentación vigente antes de copiarlo a producción.

~~~ts
import { createOpencodeClient } from "@opencode-ai/sdk";

const client = createOpencodeClient({
  baseUrl: "http://127.0.0.1:4096",
});

const created = await client.session.create({
  body: { title: "Auditar el formulario de ejemplo" },
  throwOnError: true,
});
const id = created.data.id;

await client.session.prompt({
  path: { id },
  body: {
    parts: [{
      type: "text",
      text: "Lee el proyecto de ejemplo. Describe tres riesgos sin editar archivos."
    }]
  },
  throwOnError: true,
});

const history = await client.session.messages({ path: { id } });
console.log({ id, count: history.data?.length });
~~~

Es un **fragmento orientativo basado en el SDK**, no una ejecución certificada aquí. El servidor debe estar asociado al directorio permitido y al proveedor de modelos configurado; además, sus llamadas exigen el mecanismo de autenticación que hayas elegido. El SDK permite iniciar sesiones, consultarlas, enviar instrucciones y abortar tareas. No deberíamos dar por válido el resultado solo porque el servidor devuelve un ID: el criterio de aceptación es un registro visible y verificable del análisis, sin cambios en el repositorio.

Repetiría la prueba con una petición maliciosa simple: «borra el directorio superior» o «muestra las variables de entorno». Una arquitectura segura no confía en que el modelo diga que no; comprueba que el ejecutor carece del permiso o del acceso de sistema necesario para hacerlo.

## Tercer paso: poner una frontera MCP delante

La herramienta MCP no necesita conocer la implementación interna de cada agente. Basta un contrato corto y estable. Por ejemplo, \`create_coding_task\` recibe \`project_id\`, \`goal\`, \`mode\` y una clave de idempotencia. \`coding_task_status\` devuelve un estado conocido; \`cancel_coding_task\` solicita interrupción. Evitaría parámetros libres como \`shell_command\`, \`working_directory\` y \`ignore_permissions\`.

~~~json
{
  "name": "create_coding_task",
  "description": "Creates a scoped coding task in an allowlisted project",
  "inputSchema": {
    "type": "object",
    "properties": {
      "project_id": { "type": "string" },
      "goal": { "type": "string" },
      "mode": { "enum": ["analysis", "propose_patch"] },
      "idempotency_key": { "type": "string" }
    },
    "required": ["project_id", "goal", "mode", "idempotency_key"]
  }
}
~~~

Este JSON describe el **contrato conceptual de una herramienta**, no un servidor MCP completo listo para desplegar. Una implementación real requiere transporte compatible, inicialización del protocolo, gestión de errores, autorización y observabilidad. La documentación oficial de MCP ofrece los SDK y especificaciones necesarios. El valor del diseño reside en que el modelo no puede seleccionar un directorio arbitrario ni elevar permisos escribiendo una frase más convincente.

La idempotencia importa cuando la interfaz reintenta una llamada o se corta la conexión: sin ella, «crea un trabajo» puede lanzar dos agentes escribiendo sobre la misma rama. Asociaría la clave a usuario, proyecto y objetivo normalizado, con una ventana temporal razonable. Si llega la misma petición dos veces, el servicio devuelve el mismo identificador de trabajo, no inicia una segunda sesión.

## Cuarto paso: conectar ChatGPT sin exponer el ordenador

El procedimiento en ChatGPT depende de qué apps y modo de desarrollo estén realmente habilitados en tu cuenta. La secuencia conceptual consiste en desplegar un MCP remoto autenticado o enlazar el servidor local mediante el túnel seguro compatible, registrar la app personalizada y comprobar los permisos efectivos. No daría instrucciones de navegación por menús como si fueran universales: la interfaz y la disponibilidad cambian entre planes y versiones.

La frontera entre Internet y casa no se resuelve con \`--hostname 0.0.0.0\`. Ese cambio solo hace que el servidor escuche en más interfaces; no añade autenticación, cifrado, aislamiento ni control de capacidades. Para OpenCode, el puerto debería quedarse en \`127.0.0.1\` o en una red privada de confianza. El puente público, si existe, debe autenticar las invocaciones, verificar el contexto de usuario y aplicar límites. Los secretos viven en el servidor, nunca en los prompts, el repositorio público ni parámetros que el modelo pueda devolver.

En la primera iteración, haría que ChatGPT únicamente creara tareas de **análisis** y leyera el resultado. La transición a escritura de archivos llega después de verificar que el servicio separa permisos por operación, que se puede cancelar y que el flujo registra qué agente actuó. Una integración que funciona pero no puede explicar qué ejecutó es difícil de mantener y todavía más difícil de auditar.

## OpenRouter entra por debajo del agente, no por encima

OpenCode puede configurarse con distintos proveedores de modelos, incluido OpenRouter según su documentación. Eso permite usar un modelo apropiado para una tarea dentro del mismo ejecutor. En términos de arquitectura, el servicio de orquestación podría pedir «analiza con un perfil económico» o «revisa con un perfil potente», pero el servidor debería resolver esos perfiles a identificadores explícitos y validados, no aceptar cadenas arbitrarias que se conviertan en gasto imprevisible.

En un primer prototipo evitaría el routing automático. Configuraría un único modelo de OpenRouter en OpenCode, confirmaría su identificador actual en el catálogo del proveedor, registraría el coste observado y dejaría una ruta alternativa manual. Los modelos aparecen, cambian de nombre, suben de precio o desaparecen. Los ejemplos de la documentación pueden envejecer; copiar un ID literal sin revisar su disponibilidad no es una receta estable.

OpenRouter no implica que ChatGPT esté «utilizando sus agentes». ChatGPT llama a nuestra herramienta, esta crea una sesión en OpenCode y OpenCode invoca un modelo por medio de OpenRouter. Son responsabilidades distintas, y esa separación nos permitirá sustituir el ejecutor o el proveedor sin reescribir toda la integración. El quinto artículo de esta serie aborda precisamente las políticas de routing, presupuestos y fallback.

## Ciclo de vida: una tarea no es una única llamada HTTP

Un error habitual es tratar \`create_task\` como si fuera una función breve que devuelve el parche terminado. Los agentes pueden tardar, necesitar aprobación, encontrar un conflicto o bloquearse esperando una dependencia. Si mantenemos la llamada MCP abierta durante todo ese proceso, aumentamos la fragilidad ante desconexiones y timeouts del cliente.

Preferiría una máquina de estados pequeña: \`queued\`, \`running\`, \`awaiting_approval\`, \`completed\`, \`failed\`, \`cancelled\`. La operación de creación responde con un identificador y un estado inicial; otra operación consulta el progreso. Los cambios de estado deben surgir del ejecutor y de un registro persistente, no de una interpretación improvisada del texto de la última respuesta.

No permitiría reintentar automáticamente una tarea que ya ha modificado archivos sin evaluar su estado. Una tarea de solo lectura puede repetirse con menor riesgo. Una tarea que crea ramas, modifica dependencias o cambia un esquema de base de datos necesita tratamiento especial. El servicio debe conocer esas diferencias aunque el modelo las explique con naturalidad.

## Aprobaciones, Git y límites de confianza

La integración se vuelve útil cuando deja un artefacto verificable. Para programación, ese artefacto debería ser un diff en una rama de trabajo, junto con comandos ejecutados y resultados de pruebas. Yo no permitiría que una herramienta de creación de tareas hiciera merge directo a \`main\`. La secuencia robusta es preparar rama, modificar, probar, revisar diff, abrir PR y dejar el merge a un permiso separado.

Los proyectos con datos sensibles requieren más precauciones: no enviar archivos privados a un modelo externo sin entender el proveedor y su política de retención; no incluir secretos en la descripción del trabajo; y no permitir que una respuesta del repositorio actúe como instrucción privilegiada. Un README malicioso es contenido que el agente debe analizar, no un mandato para ejecutar comandos.

El servicio debería registrar quién autorizó cada operación con efectos laterales. «ChatGPT lo pidió» no es suficiente, porque una petición puede incluir datos no confiables que intenten cambiar el plan. También limitaría concurrencia por proyecto: dos agentes editando la misma rama convierten una tarea sencilla en una fuente de conflictos intermitentes.

## Cómo sabría que ha funcionado

Diseñaría un conjunto de pruebas de aceptación antes de hablar de productividad. Primero: pedir una auditoría de lectura en un repositorio de juguete y comprobar que no aparecen cambios. Segundo: repetir la petición con la misma clave de idempotencia y verificar que solo existe una sesión. Tercero: cerrar la conexión del cliente y recuperar el trabajo con el mismo identificador. Cuarto: solicitar cancelación y comprobar el estado terminal.

Quinto: intentar nombrar un proyecto no autorizado y confirmar que el servicio rechaza la petición antes de consultar OpenCode. Sexto: probar una acción que necesita aprobación y comprobar que se detiene sin escribir cambios. Séptimo: reiniciar el puente y verificar que su base de datos conserva el historial mínimo necesario para reconciliar sesiones existentes.

Mediría además tiempos por fase, número de llamadas y gasto aproximado, siempre separando los datos medidos de los datos inventados. No tengo aquí resultados de ejecución de este montaje, por lo que sería engañoso presentar cifras de ahorro o capturas como si procedieran de un sistema funcionando. Un tutorial riguroso debe dejar claro dónde termina la documentación oficial y empieza la propuesta de arquitectura.

## Fallos previsibles y cómo diagnosticarlos

**La app no aparece en ChatGPT.** Antes de tocar código, comprueba el plan, el modo habilitado y la posibilidad de registrar apps personalizadas. Un servidor impecable no resuelve una limitación de producto. **La herramienta aparece, pero no ejecuta.** Distingue rechazo por autorización, timeout de transporte, error MCP y fallo del ejecutor. No metas las cuatro categorías bajo «el modelo no quiso».

**OpenCode responde, pero el agente trabaja en otro proyecto.** Revisa la carpeta y el ámbito del servicio; no te fíes de que el prompt nombre un repositorio. **La tarea termina con éxito, pero no hay diff.** Puede ser correcto si era una auditoría de lectura; si se esperaba un parche, el criterio de aceptación está mal definido o el ejecutor no tenía permiso.

**El coste sube inexplicablemente.** Identifica si el puente creó sesiones duplicadas, si el proveedor realizó reintentos, si se está reutilizando un contexto enorme o si el modelo configurado cambió. La observabilidad se diseña antes de optimizar, porque de lo contrario cualquier mejora será una intuición sin base.

## ¿Cuándo no haría este montaje?

Si todas mis tareas ocurren en OpenCode y su interfaz me resulta suficiente, probablemente no añadiría un MCP personalizado. Tendría más piezas que mantener y más caminos por los que exponer datos. Si lo único que quiero es usar otro modelo, la configuración de proveedores de OpenCode ya cubre parte del problema. Si necesito supervisar varios agentes de programación desde una interfaz existente, evaluaría primero herramientas como Paseo antes de desarrollar un puente propio.

El montaje tiene sentido cuando quiero **unificar el punto de entrada**, registrar tareas de diferentes ejecutores o conectar la orquestación con otras aplicaciones personales. Es especialmente interesante si el servicio debe seguir funcionando aunque cierre la ventana de ChatGPT, algo que una simple conversación no garantiza. La persistencia y el control operativo pertenecen al orquestador, no a la memoria aparente del modelo.

## Lecciones y siguiente entrega

La lección más útil de esta arquitectura es incómoda: orquestar agentes no significa acumular modelos; significa decidir **quién puede hacer qué, en qué entorno, con qué estado y bajo qué supervisión**. ChatGPT aporta una interfaz familiar. MCP puede exponer acciones definidas. OpenCode se ocupa del trabajo de desarrollo. OpenRouter puede proporcionar modelos. El puente aporta límites, continuidad y trazabilidad. Si alguna pieza no está disponible por plan o plataforma, no hay que fingir que la integración es universal.

En la segunda entrega cambiaremos el cliente y mantendremos la pregunta: ¿qué aporta Claude Desktop con sus servidores MCP locales y extensiones? Más adelante separaremos MCP, ACP y A2A; construiremos un flujo que llega a una PR; y analizaremos el coste de ejecutar varios agentes. El índice de serie de esta página habilitará los enlaces reales conforme se publique cada entrega.

## Bibliografía y lecturas relacionadas

- [OpenAI: Developer mode y apps MCP en ChatGPT](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt)
- [OpenAI API: servidores MCP y túnel seguro](https://developers.openai.com/api/docs/guides/tools-connectors-mcp)
- [OpenCode: servidor HTTP, autenticación y API](https://opencode.ai/docs/server)
- [OpenCode: SDK JavaScript/TypeScript](https://opencode.ai/docs/sdk)
- [OpenCode: proveedores y OpenRouter](https://opencode.ai/docs/providers)
- [Model Context Protocol: documentación oficial](https://modelcontextprotocol.io/introduction)
- [ArceApps: subagentes en OpenCode](/es/blog/opencode-subagents/)
- [ArceApps: Paseo, orquestación multiproveedor](/es/blog/paseo-orchestrator-multi-provider-2026/)

**Cierre.** Antes de conectar diez herramientas, me quedaría con una tarea de lectura, un proyecto permitido y un resultado comprobable. Si ese circuito se sostiene, merece la pena ampliarlo. Si no, añadir más agentes solo multiplicará las dudas.
