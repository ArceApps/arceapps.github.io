---
title: "Codex Agent Router: Orquestar agentes externos"
description: "Configura Codex Agent Router para delegar en subagentes internos o enrutar trabajo a OpenCode, MiniMax, Big Pickle y Antigravity desde una sola interfaz."
pubDate: 2026-09-10
lastmod: 2026-09-10
author: "ArceApps"
keywords:
  - "Codex"
  - "Agent Router"
  - "OpenCode"
  - "MiniMax M3"
  - "Antigravity"
  - "AI Coding Agents"
canonical: "https://arceapps.com/es/blog/codex-agent-router-external-agents/"
heroImage: "/images/codex-agent-router-external-agents.svg"
tags: ["Codex", "AI Agents", "OpenCode", "MiniMax", "Antigravity", "Indie Dev"]
draft: false
reference_id: "2d1d7d0e-a5df-4d6b-9c0f-2f77bc4a5cc2"
---

## De elegir modelos a construir una centralita de agentes

Hace unas semanas escribí sobre [model routing para subagentes](/es/blog/model-routing-subagents-coding-agents/): cómo dejar de enviar cada tarea al mismo modelo y empezar a escoger el motor adecuado según coste, velocidad y dificultad. Aquello resolvía una parte del problema, pero dejaba otra bastante más incómoda sobre la mesa. Una cosa es decidir qué modelo debería responder. Otra muy distinta es conseguir que varias herramientas de programación con IA trabajen juntas sin convertir mi escritorio en una colección de terminales, interfaces web, pestañas y procesos imposibles de seguir.

Mi problema real era muy concreto. Ya uso Codex como centro principal de trabajo. También quería aprovechar Antigravity y su CLI `agy`, OpenCode, distintos modelos accesibles mediante OpenCode y la posibilidad de utilizar un plan de MiniMax. No quería sustituir Codex. Tampoco quería abrir manualmente otra herramienta, copiar una tarea, pegar contexto, esperar, volver a Codex, explicar qué había pasado y reconciliar cambios. Quería poder escribir algo parecido a «enruta esta tarea» y que Codex decidiera a qué agente externo mandarla, siguiera siendo el punto de control y revisara el resultado al terminar.

Eso nos llevó a diseñar una pequeña arquitectura de orquestación alrededor de las Skills de Codex. El resultado final tiene cinco piezas: `agent-opencode`, `agent-minimax`, `agent-free`, `agent-agy` y una quinta skill, `agent-router`, que decide cómo repartir el trabajo. La parte interesante no son los nombres. Lo interesante es la separación conceptual que terminamos haciendo entre **delegar** y **enrutar**.

En mi flujo, «delega» significa: usa un subagente nativo de Codex. «Enruta» significa: manda el trabajo a un agente externo, pero hazlo desde un subagente host de Codex para que siga existiendo un hilo visible, un lugar donde observar la ejecución y un punto claro al que vuelve el resultado. Esa diferencia parece semántica, pero terminó resolviendo casi todos los problemas de diseño que fueron apareciendo.

Este artículo cuenta el proceso completo: qué intentamos primero, por qué lo cambiamos, cómo funcionan los cuatro workers externos, qué papel tiene `agent-router`, cómo gestionamos permisos, sesiones y salida en streaming, qué descartamos, qué ventajas obtenemos y cuáles son los inconvenientes que siguen ahí.

![Arquitectura final: Codex distingue entre delegación interna y routing externo.](/images/codex-agent-router-architecture-es.svg)

## El objetivo: un solo lugar desde el que mandar trabajo

La idea inicial nació de algo que ya funcionaba con Antigravity. `agy` permite ejecutar Antigravity de forma no interactiva desde la terminal. Si una herramienta puede recibir un prompt, trabajar sobre un repositorio y devolver una salida por CLI, entonces Codex puede tratarla como un proceso externo. El salto conceptual fue sencillo: si Codex puede ejecutar comandos, ¿por qué no convertir Antigravity en un worker al que Codex pueda enviar una tarea completa?

Después vino la segunda pregunta: si podemos hacerlo con `agy`, ¿por qué no con OpenCode?

OpenCode tiene precisamente un modo pensado para automatización:

```bash
opencode run \
  --model "provider/model" \
  --dir "/path/to/repository" \
  --auto \
  "Implementa la tarea descrita aquí"
```

No hay datos privados en este ejemplo ni los habrá en los snippets del artículo. Las rutas son genéricas y cualquier credencial, token, nombre de equipo, IP, hostname privado o endpoint interno queda deliberadamente fuera.

`opencode run` convertía OpenCode en una pieza ideal para la misma arquitectura. Además, el CLI deja seleccionar proveedor y modelo con `--model`. En mi configuración aparecían varias familias, así que en lugar de construir una única skill con una docena de alias decidí separar responsabilidades.

El primer worker sería OpenCode con DeepSeek V4 Flash. El segundo sería un worker gratuito con Big Pickle. El tercero utilizaría MiniMax M3, pero a través de OpenCode como harness. El cuarto seguiría siendo Antigravity mediante `agy`.

En ese momento la arquitectura era todavía muy básica:

```text
Codex
├── agent-opencode -> OpenCode -> DeepSeek V4 Flash
├── agent-free     -> OpenCode -> Big Pickle
├── agent-minimax  -> OpenCode -> MiniMax M3
└── agent-agy      -> agy      -> Antigravity
```

Funcionaba como idea, pero faltaban dos cosas. Primero, una forma inteligente de decidir cuál utilizar sin tener que memorizar qué worker es mejor para cada clase de trabajo. Segundo, visibilidad. Lanzar un proceso externo y recibir únicamente el resultado final está bien para CI; para trabajar durante horas con agentes resulta demasiado opaco.

## Por qué no hice una sola skill con todos los modelos

La primera tentación era obvia: crear `$opencode` y pasarle un alias de modelo.

Algo así:

```text
$opencode deepseek corrige el bug
$opencode free revisa los tests
$opencode minimax migra este módulo
```

Técnicamente es sencillo. Operativamente no me convenció.

Una Skill de Codex no es solo un alias de shell. Su `description` ayuda a decidir cuándo debería usarse y su `SKILL.md` puede contener reglas específicas de comportamiento. Separar los workers me permite dar a cada uno un contrato distinto.

`agent-free`, por ejemplo, debe evitar que el prompt incluya secretos o información especialmente sensible. `agent-agy` necesita una política explícita sobre permisos porque lo ejecutamos en modo de aprobación total de herramientas. `agent-minimax` debe usar el proveedor del plan de MiniMax y no sustituirlo silenciosamente por el modelo homónimo de otro proveedor. `agent-opencode` es mi worker externo generalista.

Si todo eso viviera en una única skill, cada ejecución cargaría reglas de cuatro backends distintos y Codex tendría que decidir simultáneamente proveedor, permisos, coste, modelo y modo de ejecución. Separarlos reduce contexto y, sobre todo, reduce ambigüedad.

Las cuatro skills son las primitivas. `agent-router` es la política.

Esta distinción permite cambiar una pieza sin tocar las demás. Si mañana Big Pickle deja de ser gratuito, puedo modificar `agent-free`. Si MiniMax cambia el identificador del modelo, cambio `agent-minimax`. Si `agy` añade un nuevo modo de streaming, ajusto `agent-agy`. El router solo necesita saber qué tipo de trabajo encaja con cada worker.

En otras palabras, preferí composición frente a una mega-skill.

## Worker 1: agent-opencode como opción generalista

El modelo elegido para el worker general fue:

```text
opencode-go/deepseek-v4-flash
```

No porque sea «el mejor modelo» en términos absolutos, sino porque necesitaba una opción rápida y suficientemente capaz para la mayor parte de las tareas que quiero descargar de Codex: implementar una feature acotada, corregir un bug, refactorizar un módulo moderado, escribir pruebas o hacer cambios en varios archivos cuando la tarea está bien especificada.

La skill fija el modelo. No quiero que el worker cambie silenciosamente a otro proveedor porque un identificador falle. Un sistema de agentes es mucho más fácil de entender cuando cada nombre conserva una identidad estable.

El runner de OpenCode parte de una idea mínima:

```bash
opencode run \
  --model "opencode-go/deepseek-v4-flash" \
  --dir "$REPOSITORY" \
  --auto \
  --format json \
  "$TASK"
```

`--auto` es importante. OpenCode tiene permisos que pueden estar en `allow`, `ask` o `deny`. Para un proceso desatendido, quedarse esperando una aprobación interactiva rompe la delegación. `--auto` autoaprueba los permisos que no estén expresamente denegados. Un `deny` sigue siendo un `deny`.

Eso nos llevó a una decisión de diseño que puede parecer extraña: no usar el sistema de permisos para prohibir de forma absoluta `git push`, `merge` o acciones similares. En vez de eso, las skills contienen una regla de comportamiento: no hacer commit, push, merge, rebase destructivo, borrar ramas o publicar nada salvo que la tarea original lo autorice expresamente.

¿Por qué? Porque si configuro `git push` como `deny`, entonces incluso una tarea que diga «corrige esto, haz commit y push» fallaría. `--auto` no convierte un `deny` en `allow`. Quería workers autónomos, pero que la intención del prompt original siguiera mandando.

La seguridad aquí no se basa en una sola barrera. Se basa en capas: configuración normal de la herramienta, instrucciones de la skill, alcance del repositorio, revisión posterior por Codex y, para operaciones especialmente sensibles, autorización explícita en la tarea.

## Worker 2: agent-free y el valor de tener un carril barato

El segundo worker usa:

```text
opencode/big-pickle
```

La motivación no era tener «otro modelo más». Era tener una ruta que pudiera consumir para tareas sencillas sin gastar las cuotas de los workers más valiosos.

Hay mucho trabajo en programación que no merece el modelo más caro: resumir una zona del repositorio, generar documentación inicial, hacer una transformación mecánica, añadir casos de prueba evidentes, revisar un conjunto pequeño de archivos o preparar una primera hipótesis sobre un bug.

Para eso sirve `agent-free`.

Su existencia también mejora el router porque introduce una dimensión que normalmente se olvida: **el coste es una restricción de routing**, igual que la complejidad o la necesidad de herramientas.

Pero gratuito no significa «mándale cualquier cosa». Añadí una regla específica para no introducir deliberadamente en el prompt credenciales, claves, tokens, contenidos de `.env` o secretos. De hecho, esa misma disciplina debería aplicarse a cualquier proveedor externo, aunque en el worker gratuito la dejé especialmente visible.

Una ventaja adicional de tener una skill separada es que puedo pedirla de forma explícita:

```text
$agent-router enruta esta tarea usando el agente gratuito
```

No hay heurística que discutir: el router respeta la elección.

El inconveniente también es claro. Si una tarea crece durante la ejecución y deja de ser sencilla, Big Pickle puede no ser el worker adecuado. La skill no debería improvisar cambiando de modelo a mitad de trabajo. Lo razonable es que termine lo independiente, reporte el bloqueo y deje al orquestador decidir si escala a `agent-opencode`.

## Worker 3: MiniMax M3 sin renunciar a OpenCode

Con MiniMax apareció una decisión más interesante. Podía intentar usar una herramienta propia de MiniMax, o aprovechar que OpenCode ya estaba funcionando como harness y utilizar dentro de él el proveedor del plan de MiniMax.

Elegí lo segundo.

El identificador que usamos es:

```text
minimax-coding-plan/MiniMax-M3
```

La ventaja es arquitectónica: Codex no necesita aprender otro protocolo. `agent-minimax` se comporta igual que los otros workers OpenCode. El runner cambia de modelo, pero mantiene el mismo mecanismo de directorio, ejecución autónoma, sesiones, archivos adjuntos y salida estructurada.

Además separa claramente dos cosas que a veces se mezclan: **harness** y **modelo/proveedor**. OpenCode es la infraestructura que ejecuta herramientas y mantiene la sesión; MiniMax M3 es el modelo que toma decisiones y genera el trabajo.

El Token Plan de MiniMax está orientado a cargas largas de texto y código y puede integrarse con herramientas compatibles. Eso encaja bien con la función que le dimos: migraciones, refactors amplios, implementaciones largas, trabajo repetitivo o tareas que pueden pasar bastante tiempo iterando sobre muchos archivos.

No lo elegimos como «modelo difícil». Esa etiqueta es demasiado vaga. `agent-minimax` representa **trabajo largo y amplio**. Una tarea puede ser conceptualmente compleja pero pequeña; en ese caso quizá siga encajando mejor en Codex o en OpenCode/DeepSeek. La duración, el volumen de cambios y la cantidad de iteraciones son parte de la decisión.

También existe una ventaja económica: la cuota del plan de MiniMax queda separada de las demás. El router puede descargar ahí trabajos extensos en lugar de consumir siempre el mismo presupuesto de inferencia.

## Worker 4: agent-agy y la autonomía de Antigravity

Antigravity era el caso que inició todo, y sigue siendo el worker más diferente.

`agy` dispone de un modo headless que permite enviar un prompt y recibir la respuesta sin abrir la interfaz interactiva:

```bash
agy \
  -p "$TASK" \
  --effort high \
  --output-format stream-json \
  --dangerously-skip-permissions \
  --print-timeout 30m
```

Aquí hay dos decisiones deliberadas.

La primera es `--dangerously-skip-permissions`. El nombre es honesto: autoaprueba las llamadas de herramientas, incluidas escrituras y ejecución de comandos. Eso es exactamente lo que quería para este worker concreto porque su función es encargarse de tareas muy agentic: investigar, compilar, modificar, volver a probar, corregir y repetir sin detenerse cada pocos minutos para pedir autorización.

No significa que «todo esté permitido» a nivel de intención. La skill sigue prohibiendo publicar cambios o ejecutar operaciones Git destructivas si la tarea original no las autoriza. El flag elimina fricción operativa; no elimina el contrato.

La segunda decisión es `stream-json`. Antigravity emite eventos NDJSON durante la ejecución: inicialización, pasos, llamadas a herramientas, fragmentos de respuesta y un resultado final. Para orquestación es mucho mejor que esperar media hora a que aparezca una única respuesta.

También ampliamos el timeout. El modo headless tiene un límite predeterminado pensado para prompts cortos. Una tarea de programación real puede necesitar bastante más, así que el wrapper usa 30 minutos como valor por defecto y permite modificarlo.

Este worker tiene el mayor potencial y el mayor riesgo. Cuando funciona bien puede encargarse de un ciclo completo de ingeniería. Cuando el prompt está mal definido, una herramienta con permisos amplios puede hacer mucho trabajo equivocado con enorme eficiencia. Por eso el router no lo usa como opción por defecto.

## Qué opciones del CLI dejamos expuestas y cuáles no

Otra pequeña decisión fue no convertir las skills en una copia de `--help`.

OpenCode ofrece más opciones de las que necesitamos en cada ejecución. Si el wrapper aceptara todas y el router intentara escogerlas siempre, volveríamos a inflar el contexto. En cambio, dejamos un conjunto pequeño de capacidades opcionales que Codex puede utilizar cuando aportan valor:

```text
--continue
--session <id>
--fork
--file <path>
--variant <variant>
--attach <url>
--thinking
```

`--continue` y `--session` sirven para retomar contexto anterior cuando realmente queremos que el mismo worker siga una conversación previa. `--fork` permite derivar una sesión sin destruir la línea original. `--file` adjunta un fichero concreto al mensaje. `--variant` deja seleccionar una variante de razonamiento cuando el proveedor la soporte. `--attach` permite conectarse a un servidor OpenCode ya levantado. `--thinking` puede pedir que OpenCode muestre los bloques que el proveedor exponga como razonamiento visible.

No activamos estas opciones por defecto. El runner básico debe seguir siendo predecible: modelo fijo, repositorio actual, `--auto`, salida JSON y tarea. Codex añade una opción solo si mejora de verdad la ejecución.

También valoramos mantener OpenCode permanentemente como servidor y hacer que los tres workers basados en él usaran `--attach`. Es una optimización razonable porque evita reinicializar parte de la infraestructura entre ejecuciones, pero no la convertimos en requisito de la primera versión. Prefiero que una skill pueda funcionar con un simple `opencode run` aunque no exista ningún daemon previo.

Con `agy` ocurre algo parecido. Exponemos esfuerzo, continuación de conversación, selección explícita de modelo o agente y timeout, pero el perfil normal es muy concreto: `effort high`, salida `stream-json`, permisos automáticos completos y un timeout suficientemente amplio.

La regla general fue: **las skills conocen las opciones importantes del CLI, pero el usuario no tiene que programar el CLI para delegar una tarea**. Si para pedir ayuda a un agente tengo que recordar siete flags, no he construido un router; he construido otra terminal con pasos extra.

## De los cuatro workers al quinto componente: agent-router

Con cuatro skills independientes ya podía escribir:

```text
$agent-opencode corrige este bug
$agent-minimax ejecuta esta migración
$agent-free documenta este módulo
$agent-agy investiga, compila y corrige hasta que pase
```

Pero seguía teniendo que elegir manualmente.

La quinta skill nació para resolver eso. Su nombre final fue `agent-router`.

Durante el diseño tuvimos una versión mucho más larga del `SKILL.md`: reglas sobre todos los flags de OpenCode, permisos de `agy`, comportamiento de Git, fallbacks, concurrencia, sesiones, verificación y multitud de ejemplos. Técnicamente era completa. También era una mala skill.

Una skill-router no debe duplicar el manual de cada worker. Cuanto más texto común metemos en ella, más contexto cargamos en cada decisión y más posibilidades existen de que una regla del router contradiga una regla específica del worker.

Así que la recortamos hasta quedarse con lo que realmente necesita saber:

1. qué significa «delega»;
2. qué significa «enruta»;
3. cuándo elegir cada worker externo;
4. cómo preparar un handoff autocontenido;
5. quién verifica al final.

Esta reducción no es cosmética. Es parte de la ingeniería del contexto. El router debe decidir rutas, no aprender a manejar cada motor.

![Matriz de decisión del Agent Router entre Codex interno y workers externos.](/images/codex-agent-router-routing-es.svg)

## La decisión que lo simplificó todo: «delega» no es «enruta»

La ambigüedad más molesta era lingüística. Si digo «delega esto», ¿quiero un subagente de Codex o quiero sacar el trabajo a OpenCode? Ambos son formas de delegación en sentido humano.

En lugar de pedirle al modelo que adivinara cada vez, decidimos crear una pequeña convención de vocabulario.

**Delegar** significa usar agentes internos de Codex.

**Enrutar** significa usar un agente externo.

Eso permite escribir:

```text
$agent-router delega la revisión del algoritmo y de los tests
```

y esperar subagentes nativos de Codex.

Mientras que:

```text
$agent-router enruta la implementación de esta tarea
```

significa que el trabajo real debe ir a uno de los cuatro workers externos.

Si además nombro el destino, mi elección gana:

```text
$agent-router enruta esto a MiniMax
```

O:

```text
$agent-router enruta esto con Antigravity
```

El router no intenta ser más listo que una instrucción explícita.

Y si invoco `$agent-router` sin ninguna de esas palabras, entonces sí puede escoger automáticamente entre Codex principal, subagentes internos o worker externo según la tarea.

La convención parece pequeña, pero reduce muchísimo los errores de interpretación. Me gusta porque está diseñada para humanos: no tengo que recordar flags ni nombres de modelos para expresar la decisión arquitectónica más importante.

## Qué es realmente un subagente interno de Codex

Aquí conviene separar conceptos porque «agente» se usa para demasiadas cosas.

Un subagente nativo de Codex se crea mediante las capacidades multiagente del propio Codex. Hereda por defecto el modelo actual y trabaja dentro de la infraestructura de Codex. Es especialmente útil cuando una tarea se puede dividir en subtareas independientes: investigar dos módulos, revisar implementación y pruebas por separado, buscar varias causas posibles de un bug o inspeccionar zonas distintas del repositorio en paralelo.

Eso no es lo mismo que ejecutar OpenCode o `agy`.

La regla que adoptamos es:

```text
delega -> Codex subagent -> el subagente hace el trabajo
```

Mientras que:

```text
enruta -> external agent -> el agente externo hace el trabajo
```

Inicialmente imaginaba el segundo camino como un simple proceso hijo ejecutado por el Codex principal. Después apareció el problema de observabilidad.

## El problema de los workers desatendidos: ¿qué está haciendo ahora?

Un worker externo puede estar diez, veinte o treinta minutos trabajando. Si lo único que ve el orquestador es que el comando sigue vivo, la experiencia empeora rápidamente.

Podía abrir OpenCode Web, adjuntar una TUI, mirar otra terminal o seguir un fichero de log. Todas son soluciones válidas, pero rompen el objetivo inicial: quería que Codex siguiera siendo mi centro de control.

Entonces apareció una idea mejor: **usar un subagente nativo de Codex como host del proceso externo**.

Es una distinción importante. Ese subagente no implementa la tarea. No compite con el agente externo. Su trabajo es lanzar la skill correspondiente, mantener el proceso, observar la salida y devolver el resultado al agente padre.

El flujo queda así:

```text
Codex principal
    |
    +-- host subagent "OpenCode · tarea"
            |
            +-- agent-opencode
                    |
                    +-- opencode run
                            |
                            +-- DeepSeek V4 Flash
```

Para Antigravity:

```text
Codex principal
    |
    +-- host subagent "AGY · tarea"
            |
            +-- agent-agy
                    |
                    +-- agy --output-format stream-json
                            |
                            +-- Antigravity
```

Ahora «enrutar» sigue significando agente externo, pero cada ejecución tiene un hilo de Codex asociado. Desde el punto de vista de la interfaz es mucho más fácil distinguir qué worker está activo y a qué tarea pertenece.

## El host no debe tocar el código

En cuanto introduje el concepto de host apareció otro riesgo: que el subagente de Codex viera la misma tarea y decidiera ayudar.

Eso sería desastroso.

Dos agentes modificando simultáneamente el mismo working tree pueden pisarse, reescribir archivos, invalidar suposiciones y producir un diff imposible de atribuir. La skill deja por escrito que el host **no debe implementar independientemente la tarea**.

Sus responsabilidades son pequeñas:

```text
1. lanzar el worker externo;
2. transmitir la tarea completa;
3. observar la ejecución;
4. mantener visible la salida útil;
5. esperar a la terminación;
6. devolver resultado y estado al Codex principal.
```

Nada más.

Esta regla transforma el subagente host en infraestructura, no en programador.

Es una de las decisiones que más me gustan del diseño porque conserva el modelo mental. Si veo un hilo llamado «AGY · build fix», sé que Antigravity es quien está editando. Si veo un subagente creado por una orden «delega», sé que ese Codex sí es un worker de verdad.

## Streaming y logs: dos niveles de observabilidad

No todos los CLIs exponen la misma salida.

OpenCode puede usar:

```bash
--format json
```

para producir eventos JSON estructurados. Antigravity tiene:

```bash
--output-format stream-json
```

que está pensado explícitamente para observar el progreso en tiempo real.

Los wrappers pasan esa salida a `stdout`, de modo que el host de Codex puede verla mientras el proceso trabaja. Pero no quise depender por completo de la interfaz de Codex. Las UIs multiagente todavía evolucionan y no siempre presentan cada evento con la granularidad que uno querría.

Así que añadimos un segundo canal: logs persistentes.

Conceptualmente:

```text
~/.codex/agent-runs/
├── current-agent-opencode.log
├── current-agent-minimax.log
├── current-agent-free.log
└── current-agent-agy.log
```

Los nombres de usuario, ubicaciones reales del sistema y demás datos privados no forman parte del artículo; `~` representa de forma genérica el home del usuario.

Cada ejecución crea un fichero con timestamp y actualiza un enlace `current-*`. Si necesito inspeccionar lo que está ocurriendo fuera de la UI, puedo usar:

```bash
tail -f ~/.codex/agent-runs/current-agent-agy.log
```

El sistema sigue siendo usable aunque la interfaz no refresque un detalle concreto.

Esta duplicación me parece justificada. Para los datos de negocio intentaría evitar dos fuentes de verdad; para observabilidad, tener una vista principal y un log crudo de respaldo es una virtud.

## Cómo decide agent-router qué worker externo utilizar

Cuando digo «enruta» sin nombrar destino, el router usa una clasificación deliberadamente sencilla.

`agent-opencode` es el default. Si no existe una razón clara para elegir otro worker, DeepSeek V4 Flash a través de OpenCode recibe la tarea.

`agent-minimax` se reserva para trabajos largos: migraciones, cambios amplios, refactors de repositorio, implementaciones repetitivas o tareas donde la duración y el número de iteraciones importan más que la respuesta rápida.

`agent-free` se usa cuando la tarea es sencilla, de bajo riesgo o cuando indico que quiero preservar cuota pagada.

`agent-agy` entra cuando la tarea necesita mucha autonomía y herramientas: ejecutar, diagnosticar, modificar, compilar, repetir y resolver un ciclo completo.

No es un clasificador científico. Es una política práctica.

La ventaja de mantenerla simple es que puedo predecirla. Los routers demasiado sofisticados tienen un problema curioso: pueden ser más «inteligentes» y al mismo tiempo ser menos útiles porque el usuario deja de entender por qué una tarea terminó en cierto proveedor.

El usuario conserva siempre la última palabra. «Enruta a MiniMax» no se discute. «Usa el gratuito» tampoco.

## Qué hacemos cuando digo simplemente «delega»

La rama interna tiene reglas diferentes.

Si digo:

```text
$agent-router delega esta investigación
```

el router utiliza subagentes nativos de Codex. Puede mandar la tarea entera a uno o dividirla si existen partes realmente independientes.

Pusimos un máximo de tres subagentes concurrentes por defecto. No porque Codex sea incapaz de crear más, sino porque la expansión automática de agentes tiene rendimientos decrecientes. Cada agente añade contexto, coordinación, espera e integración. Y, si permites que cada hijo cree a su vez más hijos, es muy fácil construir un árbol de trabajo mucho más caro que el problema original.

También indicamos que los subagentes no deben generar otros subagentes salvo petición explícita. El objetivo es evitar recursión accidental.

En mi flujo, los subagentes internos son especialmente buenos para lectura paralela y revisión independiente. Por ejemplo:

```text
Codex principal
├── subagente A -> analiza algoritmo
├── subagente B -> analiza tests
└── subagente C -> analiza rendimiento
```

El padre integra resultados.

Eso es distinto del routing externo, donde normalmente quiero entregar un trabajo completo y recuperar a Codex para otras cosas.

## El handoff: la parte menos vistosa y más importante

Un router puede elegir el modelo perfecto y aun así fracasar si manda un prompt mediocre.

Por eso `agent-router` tiene una responsabilidad previa: convertir mi petición en una tarea autocontenida para el worker.

Debe preservar el objetivo, módulo o repositorio relevante, restricciones, comportamiento esperado, criterios de verificación y cualquier autorización Git explícita.

No debe copiar toda la conversación. Eso sería caro, ruidoso y potencialmente peligroso.

Imaginemos que la conversación lleva una hora y hemos hablado de cuatro proyectos. El worker solo necesita lo que afecta a su tarea. La skill funciona como frontera de contexto.

También añadimos una regla de privacidad: ningún ejemplo del artículo ni ningún handoff debería introducir deliberadamente secretos, tokens, claves, ficheros `.env` o información privada que no sea necesaria. En un sistema real, además, conviene revisar las políticas del proveedor al que se está enviando el código.

La idea es sencilla: routing también significa routing de datos. No basta con pensar en qué modelo sabe programar mejor.

## Lo que descartamos: permisos interactivos para workers desatendidos

OpenCode puede trabajar con permisos en modo `ask`. Antigravity también tiene flujos donde ciertas herramientas requieren aprobación.

En una sesión humana eso tiene sentido. En un worker lanzado desde otro agente puede convertirse en una trampa.

El escenario que no quería era:

```text
Codex lanza OpenCode
-> OpenCode necesita permiso
-> espera
-> Codex espera
-> yo no sé que existe una pregunta pendiente
```

Es posible construir un bridge más sofisticado: mantener una sesión, detectar la petición de permiso, subirla al orquestador, preguntarme si hace falta, responder al worker y continuar. OpenCode expone primitivas que permitirían algo así y `agy` tiene modos de conversación continuada.

Pero para esta primera versión decidimos que los workers externos son **desatendidos**.

Las decisiones rutinarias se toman automáticamente. Una ambigüedad pequeña se resuelve de forma conservadora y se documenta al final. Si existe una decisión de producto importante que no se puede inferir con seguridad, el worker deja esa parte sin cambiar, completa lo independiente y devuelve el bloqueo.

Prefiero una tarea parcialmente terminada con una pregunta clara al final que un proceso oculto esperando indefinidamente.

## Lo que descartamos: agent-ollama, de momento

También exploré si tenía sentido añadir un worker para Ollama Cloud sin ejecutar modelos locales.

La respuesta técnica es sí: Ollama tiene plan gratuito con una pequeña cantidad mensual de uso para modelos starter y permite utilizar modelos cloud sin disponer de GPU local. Además ofrece modelos interesantes para programación.

Pero no añadimos `agent-ollama`.

¿Por qué? Porque la semántica de una skill «gratuita» debería ser estable. La lista exacta de modelos starter puede cambiar y el simple hecho de que un modelo aparezca en el catálogo cloud no significa que vaya a pertenecer siempre al cupo gratuito.

Ya tenía `agent-free` con un modelo cuyo uso gratuito estaba claramente identificado en OpenCode en el momento de diseñar el sistema. Añadir otro worker solo para aumentar el número de opciones habría hecho el router más complejo sin resolver un problema nuevo.

Es una decisión reversible. Si Ollama ofrece en el futuro una opción gratuita estable que aporte algo distinto, se añade una skill sin modificar la arquitectura.

## Ventajas reales del sistema

La primera ventaja es evidente: **una sola interfaz mental**. Codex sigue siendo el lugar donde describo el trabajo, reviso el resultado y tomo decisiones.

La segunda es la separación de cuotas. Cada worker puede consumir un proveedor distinto. Una implementación larga puede ir a MiniMax, una tarea sencilla al worker gratuito y un ciclo agentic a Antigravity sin convertir el modelo principal de Codex en la única fuente de capacidad.

La tercera es la especialización sin lock-in del orquestador. `agent-router` no conoce APIs privadas de cada proveedor. Conoce Skills. Cada skill encapsula su CLI. Cambiar el backend no obliga a reescribir el sistema completo.

La cuarta es observabilidad. Los host-subagents, la salida estructurada y los logs dan varias formas de seguir una ejecución.

La quinta es control semántico. «Delega» y «enruta» son palabras normales, pero en este contexto tienen un significado preciso. No necesito recordar qué comando de OpenCode continúa una sesión para expresar que quiero un worker externo.

La sexta es que el sistema degrada con cierta elegancia. Si un worker falla, Codex sigue existiendo como coordinador y puede decidir qué hacer después. No he construido un pipeline donde el fallo de un proveedor deje toda la sesión en un estado incomprensible.

Y la séptima quizá sea la más interesante para un indie: puedo reservar el modelo más capaz para aquello donde realmente aporta valor.

## Inconvenientes y riesgos que no desaparecen

No hay orquestación gratis.

El primer coste es **más contexto y más procesos**. Crear un subagente host para ejecutar un agente externo consume recursos de Codex además de los tokens del modelo externo. Lo hacemos por visibilidad y organización, pero no es la ruta más barata posible.

El segundo es la concurrencia sobre el working tree. Si dejo que Codex principal, un subagente interno y dos externos editen los mismos archivos simultáneamente, la arquitectura deja de ser inteligente y se convierte en una carrera. Para trabajo paralelo de escritura necesito ámbitos disjuntos o worktrees separados.

El tercero es el riesgo de `--dangerously-skip-permissions`. En Antigravity el modo cumple exactamente lo que promete. Un prompt mal formulado puede permitir operaciones que en una sesión interactiva habría detenido. La skill reduce ese riesgo con instrucciones, pero no convierte el flag en inocuo.

El cuarto es la dependencia de CLIs que evolucionan. Flags, identificadores de modelo y formatos de salida pueden cambiar. Las skills encapsulan esa volatilidad, pero siguen necesitando mantenimiento.

El quinto es la privacidad. En cuanto un agente externo recibe código, ese contenido sale del entorno de Codex hacia otro proveedor. La selección del worker debe considerar también qué datos puede recibir.

El sexto es la calidad del routing. Una heurística puede equivocarse. Un trabajo que parecía sencillo puede volverse complejo; una migración enorme puede tener una parte crítica que habría preferido mantener en Codex. La solución no es fingir que el router nunca falla, sino hacer que sus decisiones sean previsibles y fáciles de anular.

El séptimo es la visibilidad de la UI. El host-subagent mejora la experiencia, pero no convierte automáticamente Codex en un dashboard perfecto de cada evento externo. Por eso mantengo los logs.

## Una mejora futura: routing con feedback real

La versión actual decide principalmente a partir del prompt.

La siguiente evolución podría incorporar información de ejecución: duración media por worker, tasas de éxito, número de reintentos, coste, tamaño del diff, tests fallidos y quizá cuota disponible.

Entonces el router podría aprender reglas mucho más interesantes:

```text
si tarea = pequeña y agent-free tiene buen historial -> free
si migración > N archivos -> minimax
si requiere ciclos build/fix -> agy
si worker externo falla una vez -> opencode
si el cambio toca una zona sensible -> Codex interno
```

También podemos construir el bridge interactivo que descartamos en esta fase. Tanto OpenCode como Antigravity tienen conceptos de sesión y continuación. Un host podría detectar que el worker necesita una decisión, intentar resolverla con el contexto de Codex y escalar al usuario solo cuando realmente haga falta.

Eso convertiría el host en algo más que un monitor: sería un adaptador conversacional entre dos agentes.

No lo necesito todavía. Uno de los aprendizajes de este experimento ha sido precisamente no construir la versión más sofisticada antes de saber qué fricción aparece de verdad.

## La arquitectura final

Después de todas las iteraciones, mi esquema queda así:

```text
                         Codex principal
                               |
                         $agent-router
                               |
             +-----------------+------------------+
             |                                    |
          "delega"                            "enruta"
             |                                    |
      Codex subagent                      Codex host subagent
      hace el trabajo                     solo supervisa
                                                  |
                      +---------------------------+------------------------+
                      |             |             |                       |
              agent-opencode   agent-minimax   agent-free             agent-agy
                      |             |             |                       |
                   OpenCode      OpenCode      OpenCode                    agy
                      |             |             |                       |
               DeepSeek V4        MiniMax M3    Big Pickle           Antigravity
                   Flash
```

El Codex principal no desaparece nunca del diseño. Recibe la tarea, decide o respeta la ruta que le indico, integra resultados y verifica.

El subagente interno es un worker Codex real.

El host externo no es un worker de implementación: es una cápsula de supervisión.

Las cuatro skills externas encapsulan cada herramienta y sus peculiaridades.

Y `agent-router` solo contiene política de routing. No necesita saber cómo funciona `--print-timeout` ni qué formato de credencial utiliza un proveedor. Esa información pertenece al borde.

## Qué hemos solucionado realmente

El problema no era «cómo ejecutar OpenCode desde Codex». Eso se resuelve con una línea de shell.

Lo que queríamos solucionar era esto:

**¿Cómo puedo trabajar desde Codex como interfaz principal y, sin abandonar ese flujo, aprovechar otros agentes, modelos y cuotas de una forma entendible, observable y controlable?**

La respuesta terminó teniendo varias piezas porque el problema también las tenía.

Las Skills resolvieron el encapsulado.

Los runners resolvieron la ejecución autónoma.

Los modelos fijos dieron identidad a cada worker.

`agent-router` resolvió la elección.

La convención «delega/enruta» resolvió la ambigüedad humana.

Los host-subagents resolvieron buena parte de la observabilidad.

El streaming y los logs dieron un plan B cuando la UI no es suficiente.

Las reglas Git y de privacidad acotaron el daño potencial.

Y la separación entre Codex principal, subagentes internos y workers externos permitió que todo eso siguiera teniendo un modelo mental razonablemente pequeño.

A veces la mejor automatización no es la que elimina todas las decisiones. Es la que convierte veinte decisiones pequeñas en dos o tres decisiones que tienen sentido.

## Referencias

- [OpenAI — Codex](https://openai.com/codex/)
- [OpenAI — Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- [OpenAI Codex source — multi-agent `spawn_agent`](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/multi_agents_spec.rs)
- [OpenCode — CLI documentation](https://opencode.ai/docs/cli/)
- [Google Antigravity — AGY headless mode](https://antigravity.google/docs/cli/headless/)
- [Google Antigravity — Using AGY CLI](https://antigravity.google/docs/cli/using/)
- [MiniMax — Token Plan](https://platform.minimax.io/subscribe/token-plan)
- [Ollama — Pricing](https://ollama.com/pricing)
- [Ollama — Transparent pricing](https://ollama.com/blog/transparent-pricing)

## Cierre

No creo que haya encontrado «el orquestador definitivo». Lo que sí he conseguido es algo que me resulta más útil: un sistema pequeño que puedo explicar de memoria.

Puedo decir «delega» y sé que Codex crea capacidad interna.

Puedo decir «enruta» y sé que el trabajo sale a un worker externo.

Puedo nombrar MiniMax, Antigravity, OpenCode o el agente gratuito cuando quiero controlar el destino.

Puedo observar la ejecución desde un hilo host y, si hace falta, abrir el log crudo.

Y cuando termina, Codex vuelve a ser el responsable de mirar el diff y decidir si aquello está realmente bien.

Para un flujo indie, donde las herramientas cambian cada pocos meses y las cuotas importan tanto como la calidad, esa combinación de flexibilidad y simplicidad vale más que una arquitectura enorme. El objetivo no es tener muchos agentes. El objetivo es conseguir que los agentes que ya tengo trabajen como un sistema.
