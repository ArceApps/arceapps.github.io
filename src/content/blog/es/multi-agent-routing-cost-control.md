---
title: "OpenRouter: controlar costes y routing entre agentes"
description: "Aprende a combinar OpenRouter y OpenCode con presupuestos por tarea, routing, modelos locales, métricas y fallbacks sin duplicar trabajo ni gastos."
pubDate: "2026-11-17"
lastmod: "2026-11-17"
author: "ArceApps"
keywords: ["OpenRouter","model routing","agentes IA","cost control","OpenCode","fallback"]
canonical: "https://arceapps.com/es/blog/multi-agent-routing-cost-control/"
heroImage: "/images/multi-agent-routing-cost-control.webp"
tags: ["IA","Agentes","OpenRouter","Costes","OpenCode"]
category: "ai-agents"
reference_id: "30ba592f-4b9f-42da-8cf1-348a593f6f26"
---

> **Serie «Orquestación de agentes sin depender de un proveedor», entrega 5 de 5.** Hemos construido el mapa desde [ChatGPT Desktop](/es/blog/chatgpt-desktop-agent-orchestration/) y [Claude Desktop](/es/blog/claude-desktop-external-coding-agents/), separado [MCP, ACP y A2A](/es/blog/mcp-acp-a2a-agent-protocols/) y diseñado un [flujo multiagente hasta una PR](/es/blog/multi-provider-coding-agent-workflow/). Falta una parte poco espectacular pero esencial: **cuánto cuesta operar todo esto y cuándo conviene usar cada ejecutor**.

## Un sistema multiagente puede ser más caro y menos fiable

La promesa habitual es sencilla: un modelo económico clasifica el trabajo, otro programa, uno potente revisa y, si algo falla, se cambia de proveedor. El esquema suena perfecto. La realidad incluye herramientas que vuelven a pedir contexto, revisiones que no encuentran problemas nuevos, reintentos que duplican tokens y modelos que responden rápido pero no obedecen bien las herramientas. Sin métricas ni límites, la orquestación puede multiplicar tanto el coste como la incertidumbre.

Mi punto de partida sería evitar el routing automático durante los primeros días. Configuraría una ruta por defecto, registraría cada trabajo y definiría qué condiciones justifican una escalada. Si no conocemos el coste de una tarea simple, no podremos demostrar que un sistema de cinco modelos es más eficiente. Los precios publicados por proveedores cambian; este artículo enseña el método de comparación, no una tabla de tarifas que quede obsoleta mañana.

Además, no quiero confundir tres planos. La **selección del ejecutor** decide qué agente realizará la tarea: OpenCode, Claude Code u otro. La **selección del modelo** elige la inferencia dentro de ese agente. La **selección del proveedor o endpoint** determina dónde se atiende una solicitud del modelo, por ejemplo mediante las políticas de OpenRouter. Una misma tarea puede involucrar las tres decisiones, y mezclarlas en una única regla de «modelo más barato» es una simplificación peligrosa.

## Un router no es un orquestador

OpenRouter ofrece acceso a modelos y mecanismos de routing entre proveedores, con opciones documentadas de preferencia, precio, disponibilidad y fallback. Esto sirve para elegir dónde procesar la inferencia. Pero OpenRouter no crea por sí mismo una rama Git, no espera a que CI termine ni conserva necesariamente la semántica de una tarea que se delegó a OpenCode. La orquestación de trabajos tiene que vivir en otro componente.

OpenCode, por su parte, admite distintos proveedores y modelos, incluido OpenRouter. Puede utilizar modelos económicos para tareas ligeras y otros para trabajo más complejo, en función de su configuración y de las capacidades disponibles. La elección de modelo puede afectar soporte de herramientas, longitud de contexto, calidad, latencia y coste. Dos modelos con tarifas parecidas no garantizan compatibilidad idéntica con un flujo de edición.

En nuestro diseño, el coordinador elige un **perfil de trabajo**, el ejecutor resuelve ese perfil a un modelo permitido y OpenRouter puede decidir qué proveedor atiende la petición según sus políticas. Esta separación permite comprobar cada nivel: si hay un error de herramienta, no es automáticamente un problema del proveedor; si un modelo tiene demasiado contexto, no es necesariamente culpa del agente.

## Primero un catálogo pequeño, luego sofisticación

No comenzaría con una lista de cincuenta modelos. Definiría tres perfiles: \`analysis\` para exploración de lectura, \`implementation\` para cambios de código y \`review\` para inspección de diffs. Cada perfil tiene un ejecutor permitido, un modelo elegido a partir del catálogo actual, límites de coste y una política de permisos. Los nombres de los perfiles son estables, aunque cambien los IDs de modelos al actualizar el sistema.

~~~yaml
profiles:
  analysis:
    executor: opencode
    tools: read-only
    max_attempts: 1
  implementation:
    executor: opencode
    tools: propose-patch
    max_attempts: 1
  review:
    executor: claude-code
    tools: read-only
    max_attempts: 1
~~~

Este YAML es **configuración conceptual del coordinador**, no un archivo válido de OpenCode ni de OpenRouter. Los modelos, presupuestos y proveedores reales se fijan en otra configuración autorizada; la intención es evitar que el cliente conversacional seleccione arbitrariamente un servicio de coste elevado.

El perfil debe capturar restricciones operativas, no solo el nombre del modelo. Una revisión necesita acceso de lectura a un commit preciso; una implementación necesita una rama aislada; una investigación puede necesitar búsqueda externa pero no escritura. La ruta más barata que incumple esos requisitos no es una alternativa aceptable.

## Configurar OpenRouter en OpenCode sin sorpresas

La documentación actual de OpenCode describe la conexión con OpenRouter y la selección de modelos mediante su catálogo. Conviene seguir ese procedimiento y revisar los IDs de modelos disponibles, en vez de copiar ejemplos antiguos que usen opciones de configuración retiradas o versiones distintas del producto.

~~~text
OpenCode
  /connect  →  OpenRouter  →  clave guardada fuera de Git
  /models   →  seleccionar modelo disponible
~~~

Una prueba inicial debería crear una tarea de lectura con un modelo conocido, comprobar qué proveedor fue seleccionado y registrar el gasto observado en la plataforma. Después comprobaría que el modelo soporta las llamadas a herramientas exigidas por el agente. El hecho de que un modelo responda a preguntas normales no garantiza que pueda participar en un ciclo largo de edición con herramientas.

Nunca pondría la clave de OpenRouter en una respuesta de chat, un archivo de configuración versionado ni el frontend de una web. Los secretos se gestionan en el entorno del ejecutor, con rotación y alcance apropiados. El coordinador debería poder indicar «proveedor configurado» sin revelar el valor de la credencial.

## La fórmula mínima para entender el coste

Una estimación básica distingue tokens de entrada y salida, multiplicados por las tarifas correspondientes. Si hay caché de contexto, imágenes, herramientas con coste externo o tarifas especiales, se contabilizan aparte. La fórmula general, cuando los precios se expresan por millón de tokens, es:

~~~text
coste_modelo = (tokens_entrada × precio_entrada +
                tokens_salida × precio_salida) / 1 000 000
~~~

A esto hay que sumar otros costes: infraestructura del ejecutor, almacenamiento, herramientas pagadas, tiempo humano y llamadas repetidas por fallos o revisiones. La cifra de una sola respuesta no representa el gasto de todo el trabajo. Una tarea puede incluir veinte turnos de agente aunque el usuario haya escrito una instrucción breve.

No tomaría los tokens informados por el modelo como una contabilidad definitiva sin contrastarlos con los registros de facturación disponibles. Los proveedores pueden informar uso de caché, razonamiento u otros conceptos de forma diferente. Para comparar proveedores, normalizaría categorías y señalaría lo que no sabemos medir.

## Presupuesto por tarea, no solo gasto mensual

Un límite mensual ayuda, pero no impide que una sola tarea mal configurada consuma gran parte del presupuesto. Necesitamos un **presupuesto por trabajo** y una reserva para completar las acciones ya iniciadas. El coordinador debería asignar un máximo permitido, contabilizar el gasto observado y evaluar si puede lanzar otro intento o necesita autorización.

El presupuesto se controla antes de la siguiente llamada, pero la factura final puede llegar después. Esto implica que un límite de gasto observado no siempre garantiza un tope absoluto exacto. Para trabajos de coste sensible, conviene complementar la contabilidad con límites de proveedor, número máximo de iteraciones y una política de parada conservadora.

Por ejemplo, no permitiría que un agente revise indefinidamente su propio parche y lo devuelva al implementador. Definiría una ronda de implementación, una revisión independiente y, como máximo, una corrección automática antes de exigir intervención humana. Así controlamos tanto tokens como riesgo de deriva.

## Routing de modelos frente a routing de proveedores

OpenRouter documenta mecanismos de selección de proveedores dentro de un mismo modelo, así como estrategias relacionadas con precio, latencia, disponibilidad y fallback. También pueden existir opciones para especificar modelos alternativos. No son exactamente la misma decisión. Cambiar de proveedor que sirve el mismo modelo no equivale a cambiar de familia de modelos, y las diferencias de comportamiento pueden variar.

La política por defecto del router puede elegir proveedores en función de su salud y coste, mientras que una configuración explícita puede ordenar o restringir destinos. Para tareas con datos privados, una política de retención o elegibilidad del proveedor debe tener prioridad frente al ahorro marginal. Nunca usaría «más barato» como único criterio si el servicio puede retener información que no deseo compartir.

Separaría además el routing de inferencia de la decisión de cambiar de ejecutor. Una sesión de OpenCode que encuentra un error transitorio de proveedor puede reintentarse dentro de la misma sesión si es seguro. Migrar la tarea a Claude Code exige transferir estado y artefactos; no se puede asumir que un segundo agente verá exactamente el mismo contexto.

## Diseñar un fallback que no duplique modificaciones

Un fallback ingenuo recibe un timeout y lanza otra sesión que repite la tarea. Si la primera sesión seguía viva, ahora tenemos dos procesos capaces de modificar archivos. Para una lectura quizá sea tolerable; para una implementación, es una fuente de conflictos y sobrecoste. La regla debería ser **reconciliar antes de repetir**.

El coordinador consulta el estado del trabajo, comprueba la rama y el proceso del ejecutor, y solo entonces decide si puede reintentar. Si el fallo fue una llamada del proveedor y el agente mantiene estado, quizá basta con una nueva llamada. Si la sesión está corrupta, será necesario recuperar el último artefacto confirmado y continuar desde un estado conocido.

No permitiría fallbacks infinitos entre proveedores. Establecería un número máximo de intentos por tarea y una lista de errores recuperables. Un error por permisos no debe activar otro modelo; un límite de contexto exige resumir o dividir el trabajo; un test que falla exige corregir el código, no cambiar de endpoint esperando suerte.

## Caché, reutilización y prompts más pequeños

Reducir costes no siempre significa escoger un modelo peor. Los flujos que repiten el mismo contexto, documentación, archivos o instrucciones pueden beneficiarse de mecanismos de caché compatibles con el proveedor. Pero la caché no debe considerarse garantizada: las políticas, ventanas y tarifas cambian. Mediría el ahorro real a partir de los registros disponibles.

El traspaso entre agentes también importa. Enviar al revisor un diff, contrato y resultados de tests suele ser más barato y preciso que copiar toda la conversación del implementador. Además, reduce la exposición de datos. En este punto, una arquitectura más ordenada puede ahorrar más que una regla compleja de selección automática de modelos.

Conviene hacer las preguntas en el momento adecuado. Para una tarea trivial, quizá no hace falta un planificador separado. Para un cambio peligroso, una segunda revisión puede compensar su coste. El objetivo es gastar deliberadamente, no convertir cada acción en un ritual con varios modelos.

## Modelos locales: ahorro monetario no significa coste cero

Ejecutar un modelo local puede reducir llamadas facturadas por API, pero introduce consumo eléctrico, memoria, mantenimiento, tiempo de inferencia y posibles limitaciones de calidad. Si un modelo local tarda demasiado o falla con herramientas, el ahorro económico aparente puede convertirse en más supervisión. Antes de incluirlo en routing automático, comprobaría compatibilidad con el agente y capacidad de completar tareas de ejemplo.

La privacidad también cambia. Un modelo local puede ayudar a mantener ciertos datos en la propia máquina, pero solo si todo el flujo —herramientas, logs, telemetría y dependencias— respeta esa frontera. Un modelo local conectado a herramientas que envían contenido a servicios externos no convierte automáticamente la solución en privada.

Mi orden sería explorar primero tareas de lectura y clasificación con modelos locales, y dejar cambios complejos para modelos cuyo comportamiento con herramientas haya sido comprobado. No por prejuicio contra los modelos pequeños, sino porque la escritura de código tiene efectos secundarios que requieren fiabilidad.

## Un registro de gasto que pueda auditar

Guardaría por tarea un identificador, perfil, ejecutor, modelo, proveedor elegido si lo informa la API, timestamps, número de intentos, tokens reportados, coste facturado o estimado, y resultado. Separaría explícitamente \`estimated_cost\` de \`billed_cost\` y añadiría el origen de cada medición. Si un proveedor no ofrece un dato, lo dejaría como desconocido en vez de rellenarlo.

~~~json
{
  "task_id": "task-042",
  "profile": "review",
  "executor": "claude-code",
  "model": "modelo_configurado",
  "attempts": 1,
  "input_tokens_reported": null,
  "output_tokens_reported": null,
  "estimated_cost": null,
  "billed_cost": null,
  "result": "awaiting_review"
}
~~~

Estos valores son una **estructura de ejemplo**, no una medición. En un dashboard real añadiría duración, errores y artefactos disponibles. No guardaría prompts completos ni archivos sin una necesidad explícita; para diagnosticar basta muchas veces con categorías de error y referencias internas autorizadas.

Esta distinción también evita comparaciones engañosas. Dos tareas con el mismo gasto de tokens pueden tener resultados muy distintos: una produjo un parche correcto; otra agotó intentos sin resolver nada. El coste por tarea aceptada, acompañado por calidad y supervisión humana, es más relevante que el precio de una respuesta.

## Cómo construir un benchmark justo

Tomaría un conjunto pequeño de tareas de dificultad conocida: análisis de una función, bug con test de regresión, revisión de un diff y refactorización acotada. Cada ejecución parte del mismo commit base y usa los mismos criterios de aceptación. Si probamos modelos distintos, registramos los cambios de configuración y controlamos el acceso a herramientas.

Compararía tres estrategias: un solo agente y modelo, un agente con routing de modelos y un flujo con revisor independiente. Evaluaría porcentaje de tareas aceptadas, coste real, duración, defectos detectados por CI y tiempo humano de supervisión. Repetiría tareas cuando fuera posible, porque las ejecuciones no son deterministas.

No publicaría una tabla de números sin haber ejecutado realmente ese benchmark. Este artículo proporciona el diseño experimental para hacerlo. Los resultados solo tendrían sentido con registros, versiones, tareas accesibles y una explicación de las limitaciones de la muestra.

## La política de calidad antes que el ahorro

El presupuesto de una tarea de análisis puede ser bajo si un error es reversible. En una migración de base de datos o un cambio que afecte pagos, preferiría controles más fuertes, quizá revisión humana obligatoria y pruebas de integración. El riesgo de una tarea debe influir tanto como su complejidad en el routing.

Un modelo más caro no garantiza seguridad. Puede inventar resultados de tests, ignorar instrucciones o producir un parche incorrecto. Del mismo modo, uno económico puede resolver tareas sencillas con brillantez. La forma de elegir no es un ranking permanente, sino una evaluación basada en tareas reales de nuestro repositorio y en controles que no dependan únicamente del modelo.

La mejor política probablemente será híbrida: decisiones automáticas dentro de límites seguros y escalada explícita cuando aparezca incertidumbre. Así los agentes siguen siendo herramientas de desarrollo y no operadores con autoridad irrestricta.

## Cuando un fallback debe detenerse

Si una tarea falla por permisos, no debe probar un modelo más persuasivo. Si falla por falta de contexto, debe pedir la información necesaria. Si detecta cambios fuera de alcance, debe bloquear y devolver evidencia. Si CI falla, lo correcto es inspeccionar la causa; una serie de reintentos idénticos solo consume presupuesto.

También detendría un trabajo cuando se agota el máximo de intentos o una llamada supera el presupuesto restante. La respuesta útil al usuario es un informe: qué se intentó, qué funcionó, qué no, cuál es el coste observado y qué decisión se necesita. Un fallo bien documentado vale más que un sistema que no sabe terminar.

En un coordinador pequeño, estas reglas pueden implementarse con una máquina de estados, una tabla de límites y un conjunto de errores tipados. No necesitamos introducir un motor sofisticado de políticas hasta que exista un requisito que lo justifique.

## Qué haría en un proyecto personal

En la primera semana utilizaría OpenCode con un proveedor configurado y guardaría las métricas básicas. En la segunda, si hubiera suficiente volumen, separaría análisis de implementación por perfil. Solo cuando existiesen datos aceptables añadiría un revisor independiente y un fallback explícito. Cada cambio se evaluaría con las mismas tareas de aceptación, no con impresiones subjetivas.

Evitaría empezar construyendo un panel enorme. Un CSV o una tabla SQLite con duración, estado, gasto estimado y enlaces a Git puede bastar. Las mejores optimizaciones suelen aparecer al observar tareas repetidas, fallos frecuentes y contexto enviado inútilmente, no al añadir un segundo router.

Tampoco confundiría coste monetario y valor. Una revisión adicional que evita un error de publicación puede merecer mucho más que su precio en tokens. Un agente barato que introduce una regresión puede salir caro por el tiempo de reparación.

## Lecciones de las cinco entregas

La serie comenzó con una idea tentadora: controlar agentes de distintos proveedores desde ChatGPT o Claude Desktop. Hemos visto que el cliente, el protocolo, el ejecutor y el modelo son piezas diferentes. MCP no crea agentes; ACP integra clientes y agentes de código; A2A facilita colaboración entre sistemas independientes. El SDK del ejecutor puede ser más sencillo que introducir un nuevo protocolo si solo necesitamos una conexión concreta.

Después llevamos la arquitectura a Git: planificar, implementar, revisar, pasar CI y no confundir terminar una tarea con publicar cambios. Ahora añadimos una regla más: orquestar sin medir ni limitar el gasto es una forma de perder el control, incluso cuando cada pieza funciona bien.

No necesito que diez agentes estén ocupados para considerar que el sistema aporta valor. Necesito poder iniciar un trabajo, recuperarlo, cancelar lo que sea seguro cancelar, inspeccionar un diff, saber cuánto he gastado y decidir si lo publico. Esa es mi definición de autonomía útil.


## Una política medible de escalada

El primer routing automático que probaría no intentaría adivinar cuál es «el mejor modelo» para cualquier problema. Usaría un criterio observable: si la tarea es de lectura y no afecta archivos, emplea el perfil de análisis; si debe modificar código, exige rama y pruebas; si el cambio toca seguridad, autenticación, datos o despliegue, solicita una revisión adicional. El riesgo del cambio gobierna la política antes que el coste por millón de tokens.

La escalada debe tener un límite por escrito. Por ejemplo, si el primer intento no produce un artefacto verificable, el coordinador devuelve un fallo tipado. Si se trata de un error transitorio del proveedor y queda presupuesto, permite un reintento. Si hay un fallo de tests, encarga una corrección acotada. Si se agota el presupuesto o el trabajo se sale de alcance, pide una decisión humana y no vuelve a llamar a modelos por su cuenta.

Mediría los resultados mediante coste por tarea aceptada, no solo el precio de la inferencia. Aceptada significa que el resultado superó las condiciones acordadas: diff válido, tests pertinentes y revisión cuando corresponde. Si una ruta barata tiene muchos reintentos, su precio final puede superar el de una ruta más cara que resuelve a la primera. También hay que incluir el tiempo de supervisión.

Y mantendría una política de reversión: cada ajuste de routing se puede desactivar para volver al modelo y ejecutor anteriores. Sin esa posibilidad, una decisión de optimización se convierte en una migración de arquitectura. Los presupuestos deben ayudar a elegir mejores herramientas, no obligarnos a depender de una configuración difícil de diagnosticar.

## Bibliografía y lecturas relacionadas

- [OpenCode: configuración de proveedores y OpenRouter](https://opencode.ai/docs/providers)
- [OpenCode: configuración de modelos y herramientas](https://opencode.ai/docs/config)
- [OpenRouter: estrategias de routing entre proveedores](https://openrouter.ai/blog/insights/model-routing/)
- [OpenRouter: documentación de API](https://openrouter.ai/docs)
- [ArceApps: ChatGPT Desktop y OpenCode](/es/blog/chatgpt-desktop-agent-orchestration/)
- [ArceApps: Claude Desktop y agentes externos](/es/blog/claude-desktop-external-coding-agents/)
- [ArceApps: MCP, ACP y A2A](/es/blog/mcp-acp-a2a-agent-protocols/)
- [ArceApps: flujo de trabajo hasta una PR](/es/blog/multi-provider-coding-agent-workflow/)

**Cierre de la serie.** Empezaría con un puente sencillo, un agente con permisos acotados, un resultado revisable y un presupuesto explícito. El resto debe ganarse su lugar a través de pruebas, no de promesas.
