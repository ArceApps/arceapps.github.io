---
title: "2026 W37: Codex aprende a repartir trabajo (Agent Router)"
description: "Crónica de cómo convertí Codex en un centro de control para subagentes y workers externos con OpenCode, MiniMax, Big Pickle y Antigravity."
pubDate: 2026-09-10
lastmod: 2026-09-10
author: "ArceApps"
keywords: ["ArceApps", "Codex", "Agent Router", "OpenCode", "Antigravity"]
canonical: "https://arceapps.com/es/devlog/2026-W37-codex-agent-router/"
heroImage: "/images/devlog-codex-agent-router.svg"
tags: ["devlog", "building-in-public", "codex", "ai-agents", "opencode", "antigravity"]
draft: false
---

## La semana en la que “delegar” dejó de significar cualquier cosa

Hay palabras que en informática deberían venir con un pequeño abogado incorporado. “Servicio”. “Proceso”. “Agente”. Y, desde esta semana, “delegar”.

Llevaba tiempo usando Codex como punto principal de trabajo y acumulando a su alrededor herramientas que me gustan por motivos distintos: OpenCode, Antigravity, varios modelos accesibles desde distintos proveedores y la posibilidad de sacar trabajo largo a MiniMax. El problema no era conseguir que cada herramienta funcionara por separado. Ese problema, sorprendentemente, es el fácil.

El problema era que todas funcionaban **demasiado por separado**.

Abrir una herramienta, copiar una tarea, pegar contexto, esperar, volver a otra ventana, comprobar qué cambió, intentar recordar quién había tocado qué y luego seguir la conversación original es una forma muy moderna de recrear manualmente una centralita telefónica de 1950.

La idea de esta semana fue acabar con eso.

Quería seguir hablando con Codex. Quería que Codex siguiera siendo el lugar desde el que pienso una feature, reviso un bug o decido qué hacer con un repositorio. Pero quería poder decir: esta parte mándasela a otro agente. No “dame un prompt para copiar”. No “abre otro programa”. **Mándasela tú**.

Y, ya puestos, quería que no todos los agentes fueran iguales. Un trabajo sencillo no necesita la misma ruta que una migración enorme. Una tarea que exige ejecutar, compilar, fallar, corregir y repetir no se parece a generar documentación. Un modelo gratuito tiene sentido para ciertas cosas y no para otras.

Así empezó lo que terminó convirtiéndose en cinco skills: `agent-opencode`, `agent-free`, `agent-minimax`, `agent-agy` y `agent-router`.

En el artículo técnico de esta semana explico toda la arquitectura con más calma. Este devlog es la otra cara: cómo llegué hasta ella, qué decisiones cambié por el camino y por qué una simple palabra —“enruta”— terminó siendo una de las mejores partes del diseño.

Si quieres el análisis técnico completo, está en [Codex Agent Router: Orquestar agentes externos](/es/blog/codex-agent-router-external-agents/). Aquí vamos con la cocina.

![Arquitectura del sistema que terminamos montando.](/images/codex-agent-router-architecture-es.svg)

## Punto de partida: si agy puede hacerlo, ¿por qué no los demás?

Todo empezó con Antigravity.

Ya tenía claro que `agy` permitía lanzar una tarea de Antigravity desde CLI. Eso cambia mucho la naturaleza de una herramienta. Una aplicación con interfaz gráfica puede ser estupenda, pero desde el punto de vista de automatización vive detrás de una puerta que un humano abre. Una CLI no interactiva, en cambio, se convierte en una pieza que otro proceso puede invocar.

Y Codex sabe invocar procesos.

La primera idea fue casi infantil:

```text
Codex -> agy -> Antigravity
```

Si yo puedo escribir en una terminal:

```bash
agy -p "Revisa este módulo"
```

Codex también puede.

La pregunta siguiente apareció cinco segundos después: OpenCode también tiene CLI. Y no una CLI simbólica, sino un modo `run` específicamente útil para automatización.

Entonces el diagrama se estiró:

```text
Codex
├── agy -> Antigravity
└── opencode run -> modelo externo
```

Aquí es donde la cosa dejó de ser un experimento gracioso y empezó a tener posibilidades reales. OpenCode podía actuar como harness común para varios modelos. Eso significaba que no necesitaba construir una integración distinta para cada proveedor.

En ese momento revisé los modelos que tenía disponibles y aparecieron varias opciones interesantes. Decidimos centrarnos en tres rutas dentro de OpenCode: DeepSeek V4 Flash como worker generalista, Big Pickle como worker gratuito y MiniMax M3 para trabajo largo a través del plan de MiniMax.

La cuarta ruta seguiría siendo Antigravity con `agy`.

En papel ya sonaba bien. En la práctica todavía no habíamos resuelto casi nada.

## Primera discusión: ¿una skill o cuatro?

Mi primera pregunta fue muy normal: ¿de verdad necesito cuatro skills? ¿No puedo crear una sola y pasarle el modelo?

Sí, puedo.

Y durante unos minutos parece la solución más elegante.

```text
$opencode deepseek ...
$opencode minimax ...
$opencode free ...
```

Pero cuanto más miraba los detalles, peor me parecía.

No quería que `big-pickle` fuera solo un string distinto. Quería que el worker gratuito tuviera reglas propias sobre información sensible. No quería que Antigravity compartiera el mismo contrato de permisos que OpenCode porque sus CLIs no funcionan igual. No quería que MiniMax pudiera terminar usando otra ruta de proveedor por un fallback silencioso. Y quería que el worker general de OpenCode tuviera una identidad estable.

Acabamos usando nombres consistentes:

```text
agent-opencode
agent-free
agent-minimax
agent-agy
```

La nomenclatura me gustó porque deja hueco para crecer sin convertir la carpeta de skills en un cajón desastre.

Lo curioso es que separar las skills no hizo el sistema más complejo. Hizo el sistema más fácil de pensar.

Cada una sabe hacer una cosa.

El problema de “cuál uso” lo resolveríamos después, en otro nivel.

## agent-opencode: el trabajador de propósito general

Para `agent-opencode` fijamos:

```text
opencode-go/deepseek-v4-flash
```

La idea no era hacer una tabla de benchmarks y declarar ganador universal. Quería un worker rápido para el 80% de las tareas que no necesito mantener en Codex: un bug acotado, una implementación bastante clara, pruebas, refactor moderado, cambios en varios archivos pero con objetivo bien definido.

El comando base fue tomando forma:

```bash
opencode run \
  --model "opencode-go/deepseek-v4-flash" \
  --dir "$REPOSITORY" \
  --auto \
  "$TASK"
```

Hasta aquí, fácil.

Luego apareció la palabra “permisos”.

Y aquí empezó una de esas pequeñas madrigueras de conejo que hacen que una tarde de “voy a crear un alias” termine pareciéndose a diseñar un sistema distribuido.

OpenCode tiene permisos que pueden pedir confirmación. Eso es estupendo si estoy delante del terminal. Pero el plan era justo lo contrario: el agente externo debía trabajar desatendido.

Si OpenCode se para a preguntar y el proceso está lanzado dentro de Codex, tenemos una especie de muñeca rusa del bloqueo: OpenCode espera, Codex espera, yo sigo pensando que todo está trabajando y veinte minutos después descubro que faltaba aprobar una operación trivial.

Así que elegimos `--auto`.

El detalle importante es que autoaprueba lo que no está expresamente denegado. Un `deny` sigue siendo un muro.

Y eso nos llevó al siguiente debate: Git.

## El pequeño drama de “¿puede hacer push?”

Inicialmente escribimos algo parecido a:

```text
Do not commit, push, merge or delete branches unless explicitly requested.
```

La frase es razonable. Pero inmediatamente surgió la duda: ¿esto significa que el worker puede detenerse, preguntarle al orquestador, esperar mi respuesta y continuar?

No necesariamente.

Ese descubrimiento fue importante porque estábamos mezclando dos niveles distintos: reglas de comportamiento y protocolo interactivo de permisos.

Una skill puede decirle al agente “no hagas push salvo autorización”. Eso no crea mágicamente un canal de conversación entre OpenCode, Codex y yo.

Podríamos construirlo. OpenCode tiene sesiones y mecanismos que permiten continuar trabajo. `agy` también. Pero en ese punto decidimos algo que simplificó mucho el diseño:

**estos workers externos serán desatendidos**.

Si hay una decisión rutinaria, la toman.

Si hay una ambigüedad pequeña, eligen la opción conservadora y la explican al final.

Si hay una decisión importante que podría cambiar el producto de forma incorrecta, no tocan esa parte, continúan lo demás y devuelven el bloqueo.

No quiero que un worker de veinte minutos se convierta en una conversación de veinte aprobaciones.

Y tampoco quise bloquear Git con `deny` absoluto. Si un día escribo de forma explícita “haz commit y push”, quiero que la tarea pueda hacerlo. La autorización debe venir del prompt original.

## agent-free: por qué quería un worker que no doliera gastar

El siguiente fue `agent-free`.

Modelo:

```text
opencode/big-pickle
```

Podría parecer un capricho tener una skill dedicada a “lo gratis”, pero en mi flujo tiene bastante sentido.

Hay tareas que son útiles y baratas intelectualmente. Un análisis preliminar. Un pequeño conjunto de tests. Documentación. Cambios mecánicos. Revisar un módulo de forma inicial. Si cada una de esas cosas consume el mismo modelo que reservo para una migración compleja, termino optimizando mis prompts alrededor de la cuota en vez de alrededor del trabajo.

El worker gratuito crea un carril psicológico y económico diferente.

También obliga a ser más consciente de privacidad. La skill lleva una instrucción explícita para no mandar deliberadamente claves, tokens, credenciales, `.env` ni información especialmente sensible.

Y eso me recordó algo que conviene repetir: cuando hacemos routing de modelos, hacemos routing de datos.

No todo código debe enviarse a cualquier proveedor simplemente porque técnicamente se pueda.

En los ejemplos de este artículo y del devlog he sido deliberadamente aburrido: rutas genéricas, nombres genéricos, ninguna IP, ningún host privado, ninguna credencial, ningún fragmento de configuración personal.

Lo aburrido es bueno cuando hablamos de secretos.

## agent-minimax: otro modelo, el mismo harness

MiniMax fue una decisión más interesante porque podía haber añadido otra herramienta completamente diferente.

Pero OpenCode ya estaba ahí.

Y si OpenCode podía usar MiniMax como proveedor, la pregunta pasó a ser: ¿quiero integrar otro frontend o quiero mantener el mismo harness?

Elegí el mismo harness.

`agent-minimax` fija:

```text
minimax-coding-plan/MiniMax-M3
```

Eso me permite mantener el mismo runner conceptual que `agent-opencode`.

Lo que cambia es para qué lo uso.

No quería una clasificación infantil tipo:

```text
fácil -> gratis
medio -> DeepSeek
difícil -> MiniMax
muy difícil -> Antigravity
```

Eso suena ordenado y es falso.

Hay tareas difíciles que son pequeñas. Hay tareas fáciles que son enormes.

MiniMax quedó definido como **worker para trabajo largo**: migraciones, cambios repetitivos, refactors amplios, implementaciones con muchos archivos y tareas donde el agente puede pasarse un buen rato avanzando de forma autónoma.

La ventaja añadida es que el consumo puede ir por el plan de MiniMax, separando cuotas.

En un mundo ideal los tokens no importarían. En el mundo donde vivo, claro que importan.

## agent-agy: “todos los permisos” significa exactamente eso

Con Antigravity el usuario de la semana —yo mismo— tenía una petición muy clara: quiero que pueda trabajar sin quedarse parado pidiendo permisos.

`agy` ofrece:

```bash
--dangerously-skip-permissions
```

No hay mucho margen para interpretar ese nombre.

Lo usamos deliberadamente.

También configuramos:

```bash
--effort high
--print-timeout 30m
```

y posteriormente añadimos:

```bash
--output-format stream-json
```

La razón del timeout era sencilla: cinco minutos pueden ser suficientes para responder una pregunta, pero no para una tarea que implique leer proyecto, ejecutar build, encontrar un fallo, tocar código y volver a probar.

La razón de `stream-json` apareció un poco más tarde y acabó siendo clave para el sistema completo.

Pero antes de llegar ahí todavía faltaba construir la pieza que decidiera quién hace qué.

## Nace agent-router y, como buen router, al principio tenía demasiado equipaje

Una vez creados los cuatro workers apareció la pregunta inevitable:

¿voy a recordar siempre cuál era el mejor para cada cosa?

Probablemente sí durante una semana.

Después empezaría a mandar todo a `agent-opencode` porque es el nombre que me saldría primero de los dedos.

Así nació `agent-router`.

El primer borrador fue larguísimo. Tenía reglas de permisos, modelos, Git, sesiones, fallbacks, concurrencia, explicación de cada worker, ejemplos, verificación y casi ganas de pedir una hipoteca.

Entonces paramos y revisamos qué debía hacer de verdad una skill-router.

No debía saber manejar `agy`.

No debía saber los flags de OpenCode.

No debía repetir la política completa de `agent-free`.

Solo necesitaba responder una pregunta:

**¿dónde debe ir esta tarea?**

El resto debía vivir en las skills específicas.

Recortarla fue probablemente la mejora más importante que hicimos en toda la configuración.

Cuando trabajas con agentes es muy fácil pensar que más instrucciones significan más control. A partir de cierto punto significan más contexto, más contradicciones y más oportunidades para que una regla secundaria tape la intención principal.

## El momento de “delega” y “enruta”

Aun con el router simplificado quedaba un problema ridículamente humano.

Yo decía “delega esta tarea”.

¿A quién?

¿A un subagente de Codex?

¿A OpenCode?

¿A Antigravity?

Técnicamente todos son agentes y todos reciben trabajo delegado.

Podíamos hacer que `agent-router` analizara el prompt y eligiera. Pero entonces una palabra cotidiana como “delega” no tendría una semántica estable.

Así que hicimos algo mucho mejor: inventar una pequeña convención.

**Delega** = agentes internos de Codex.

**Enruta** = agentes externos.

Me encanta porque es sencilla y porque no intenta ocultar la arquitectura.

Si digo:

```text
$agent-router delega la revisión de los tests
```

quiero un subagente Codex.

Si digo:

```text
$agent-router enruta la revisión de los tests
```

quiero que el trabajo real salga hacia un worker externo.

Y puedo añadir:

```text
enruta a MiniMax
enruta con Antigravity
enruta usando el agente gratuito
```

sin perder control.

Si no digo ninguna de las dos cosas, entonces sí dejo al router decidir automáticamente.

![Cómo interpreta Agent Router las órdenes de delegación y routing.](/images/codex-agent-router-routing-es.svg)

## Pero los agentes externos desaparecían detrás del proceso

En ese punto el sistema ya podía ejecutar trabajo.

Y apareció el siguiente problema: yo quería verlo.

No necesito leer el razonamiento interno del modelo. De hecho, eso no es lo importante. Quiero saber si está leyendo archivos, ejecutando tests, modificando cosas, atascado o terminado.

Con OpenCode podíamos plantear un servidor web y abrir su UI. También podíamos usar sesiones, TUI y logs.

Con Antigravity había una posibilidad especialmente buena: `stream-json`.

Pero cuanto más añadía paneles paralelos, más traicionaba la idea original de tener Codex como centro.

La pregunta cambió:

¿puedo hacer que el agente externo aparezca dentro del sistema de subagentes de Codex?

No como si fuera un subagente nativo —porque no lo es—, sino usando un subagente de Codex como **host**.

Y ahí la arquitectura hizo clic.

## El subagente host: un supervisor al que le está prohibido ayudar

El host es un subagente nativo de Codex con una tarea muy poco heroica.

No programa.

No corrige.

No “aprovecha mientras tanto” para tocar otro archivo.

Lanza la skill externa, observa el proceso, mantiene la salida y devuelve el resultado.

Algo así:

```text
Codex principal
    |
    +-- host "AGY · corregir build"
            |
            +-- agent-agy
                    |
                    +-- agy
                            |
                            +-- Antigravity hace el trabajo
```

O:

```text
Codex principal
    |
    +-- host "OpenCode · refactor"
            |
            +-- agent-opencode
                    |
                    +-- OpenCode
                            |
                            +-- DeepSeek hace el trabajo
```

La instrucción “no implementes tú la tarea” es crucial.

Parece absurdo crear un agente capaz y luego prohibirle ayudar, pero precisamente eso evita dos agentes escribiendo al mismo tiempo en el mismo sitio.

El host es una carcasa de observabilidad.

Y, de repente, la distinción entre “delega” y “enruta” se volvió todavía más útil.

“Delega” crea un subagente que **sí trabaja**.

“Enruta” crea un subagente que **supervisa a quien trabaja**.

Eso es fácil de explicar y, por tanto, fácil de usar.

## Streaming: cuando la terminal deja de ser una caja negra

Para que el host tenga algo que observar, los runners necesitan emitir progreso.

OpenCode soporta formato JSON de eventos:

```bash
opencode run \
  --format json \
  ...
```

Antigravity tiene:

```bash
agy \
  --output-format stream-json \
  ...
```

En `agy`, el stream incluye eventos de inicialización, pasos, herramientas y resultado. Eso significa que el host puede recibir actividad conforme ocurre.

No es el “pensamiento secreto” del modelo. Tampoco lo quiero.

Es algo mucho más útil para ingeniería: actividad observable.

¿Ha ejecutado una herramienta?

¿Está todavía trabajando?

¿Ha terminado?

¿Con error?

¿Cuántos pasos lleva?

Eso es telemetría, no voyeurismo neuronal.

Añadimos `stdbuf` y `tee` a los runners para reducir buffering y conservar la salida.

Y entonces apareció el último pequeño cinturón de seguridad: logs persistentes.

## current-agent-*.log: porque no confío mi vida a una UI

La idea del host funciona, pero las interfaces multiagente siguen evolucionando. No quería que un cambio en cómo Codex muestra un subagent thread dejara a los workers invisibles.

Así que cada runner escribe también un log.

Conceptualmente:

```text
~/.codex/agent-runs/
├── current-agent-opencode.log
├── current-agent-minimax.log
├── current-agent-free.log
└── current-agent-agy.log
```

Cada ejecución real usa un fichero con timestamp y el `current-*` apunta al último.

Si algo no se ve bien en la UI:

```bash
tail -f ~/.codex/agent-runs/current-agent-agy.log
```

y asunto arreglado.

No hay rutas privadas reales en este ejemplo; `~` es la forma estándar y genérica de representar el directorio home.

En algún momento pensé que esto era redundante. Después recordé cuántas veces una interfaz bonita me ha enseñado menos información que un fichero de texto.

El log se quedó.

## Qué hace agent-router cuando no le doy el destino

La política final no intenta ganar un premio de inteligencia artificial.

`agent-opencode` es el default externo.

`agent-free` es para trabajo sencillo o cuando quiero preservar cuota.

`agent-minimax` es para trabajo largo, amplio o repetitivo.

`agent-agy` es para tareas muy agentic y cargadas de herramientas.

Si digo “enruta”, el router escoge entre esos cuatro.

Si digo un nombre, mi elección gana.

Si digo “delega”, no mira esos cuatro: usa subagentes nativos de Codex.

Y si solo escribo `$agent-router` con una tarea, tiene libertad para elegir Codex principal, subagentes internos o ruta externa.

Esa última opción es útil, pero me gusta que las palabras explícitas existan porque hacen que el flujo sea predecible.

La automatización no debería obligarme a perder el control del modelo mental.

## Una decisión pequeña que evita una gran fiesta de subagentes

También limitamos la delegación interna.

Por defecto, máximo tres subagentes concurrentes.

Y les decimos que no creen más subagentes salvo que yo lo pida.

Esto puede parecer demasiado conservador en 2026, cuando todo producto de IA quiere enseñarte una animación con veinte agentes corriendo en paralelo.

Mi experiencia es que veinte agentes son impresionantes en un gráfico y bastante menos impresionantes cuando cinco de ellos han investigado lo mismo y tres están editando el mismo archivo.

Los subagentes son excelentes cuando las tareas son independientes.

Por ejemplo:

```text
subagente A -> algoritmo
subagente B -> tests
subagente C -> rendimiento
```

Perfecto.

```text
subagente A -> cambia clase X
subagente B -> cambia clase X
subagente C -> refactoriza clase X mientras tanto
```

Eso no es multiagente. Es una recreación digital de tres personas intentando escribir en el mismo teclado.

## La parte que no se ve: preparar un buen handoff

A estas alturas tenía nombres, routing, hosts y streaming.

Podía haber dado el trabajo por terminado.

Pero hay una cosa que mata sistemas de agentes mejores que este: mandarles tareas vagas.

`agent-router` tiene que convertir la conversación en un handoff autocontenido.

No copiar todo.

No pegar media hora de chat.

Extraer objetivo, restricciones, módulo relevante, comportamiento esperado, verificación y permisos especiales.

Eso reduce tokens y reduce errores.

También es una barrera de privacidad. Si la conversación contiene información de otros proyectos, no tiene por qué viajar al proveedor externo.

Una arquitectura de agentes bien montada no solo decide dónde se ejecuta el código. Decide qué contexto cruza cada frontera.

## Ollama entró en la reunión y salió sin una skill

Durante el diseño miramos también Ollama.

Yo no quería modelos locales en ese momento, pero Ollama Cloud tiene uso remoto y el plan gratuito incluye una cantidad starter para ciertos modelos.

Podíamos añadir otro worker.

No lo hicimos.

Esta parte me parece importante porque en building in public es muy fácil contar todas las cosas que añadiste y ninguna de las que **decidiste no añadir**.

Ya teníamos un worker gratuito.

Crear `agent-ollama` solo porque técnicamente era posible añadía una nueva ruta, otra política, otra fuente de disponibilidad cambiante y otra cosa que mantener.

La pregunta fue: ¿qué problema nuevo resuelve?

En ese momento, ninguno.

Así que salió del diseño.

Puede volver otro día.

## Lo bueno: por qué estoy contento con el resultado

Lo primero que gano es continuidad.

No abandono Codex para “usar otro agente”. Desde Codex decido que otra herramienta haga una parte del trabajo.

Lo segundo es separación de recursos. Puedo descargar tareas largas en MiniMax, tareas baratas en el worker gratuito, loops de herramientas en Antigravity y trabajo general en OpenCode/DeepSeek.

Lo tercero es que los nombres significan cosas.

`agent-opencode` no es una caja aleatoria.

`agent-minimax` no cambia silenciosamente de proveedor.

`agent-free` representa un objetivo de coste.

`agent-agy` representa autonomía y herramientas.

`agent-router` representa política.

Lo cuarto es la observabilidad.

El host-subagent me da un hilo.

El stream me da actividad.

El log me da una red de seguridad.

Lo quinto es que puedo sustituir piezas. Si dentro de seis meses cambia el modelo que quiero detrás de `agent-opencode`, el router no tiene por qué enterarse.

Lo sexto es una cosa menos visible: tengo un vocabulario.

“Delega” y “enruta” quizá sea la feature que más use de todo esto.

## Lo malo: porque por supuesto hay una factura

La primera factura son tokens.

Un host Codex que espera a un worker externo no es gratis. Estoy usando una capa adicional para ganar visibilidad.

La segunda es complejidad operativa.

Cinco skills son más que cero skills. Hay scripts. Hay CLIs. Hay autenticaciones. Hay versiones.

La tercera es el working tree.

Si me emociono y lanzo tres workers que escriben a la vez sobre los mismos archivos, la culpa no es de la IA. Es mía.

Necesitaré worktrees o scopes claramente separados para paralelismo de escritura serio.

La cuarta es Antigravity con permisos completos.

`--dangerously-skip-permissions` es útil precisamente porque es peligroso. No hay que maquillarlo.

La quinta es la privacidad.

Cada proveedor externo es una frontera. Aunque el flujo sea cómodo, sigo teniendo que decidir qué código puede salir.

La sexta es que `agent-router` no es omnisciente.

Puede mandar una tarea al worker equivocado. Por eso el routing explícito existe.

Y la séptima es que la UI de Codex no está obligada a enseñarme cada evento exactamente como yo sueño. Los logs existen por algo.

## Qué solucionamos de verdad esta semana

Al principio pensaba que estaba construyendo un mecanismo para “usar OpenCode desde Codex”.

Eso habría sido una descripción bastante pobre.

Lo que terminó apareciendo es una capa de orquestación pequeña.

Antes:

```text
yo -> herramienta A
yo -> herramienta B
yo -> herramienta C
yo -> reconciliarlo todo
```

Ahora:

```text
yo -> Codex -> router -> worker
                  |
                  +-> Codex verifica
```

Y, cuando necesito paralelismo interno:

```text
yo -> Codex -> delega -> subagentes Codex
```

La palabra clave no es “agentes”.

Es **flujo**.

He reducido el número de cambios de contexto humanos. Ese es el valor.

No me importa demasiado si por debajo hay cuatro modelos, seis procesos o doce formatos JSON si yo puedo mantener una conversación coherente con un orquestador.

## Qué haría después

Hay varias mejoras obvias.

Una es capturar métricas de los workers: duración, exit code, número de archivos, tests, quizá coste cuando esté disponible. Entonces el router podría basarse menos en heurísticas y más en historial.

Otra es crear worktrees automáticamente cuando se enrutan tareas de escritura paralelas.

Otra es mejorar el host para que, si un agente externo devuelve una pregunta importante, Codex pueda evaluarla y responder sin cortar toda la ejecución. Esto requeriría sesiones más persistentes.

Y otra es un pequeño dashboard sobre los logs. Aunque paradójicamente ahora mismo no lo necesito porque justo acabamos de esforzarnos para no necesitar otra interfaz.

La tentación será añadir todo.

Intentaré resistirla.

## Una última regla: llamar a cada cosa por su nombre

Durante la conversación hubo otra pequeña corrección que acabó importando más de lo previsto: dejar de llamar “subagente de Codex” a cualquier cosa que Codex lance.

Si Codex crea un agente nativo con su mecanismo multiagente, eso es un **subagente de Codex**. Puede heredar el modelo del padre, recibe una subtarea y trabaja dentro del sistema multiagente de Codex.

Si Codex ejecuta OpenCode, MiniMax a través de OpenCode, Big Pickle o `agy`, eso es un **agente externo**. Aunque el proceso se lance desde un subagente host y aparezca asociado a un hilo dentro de Codex, el trabajo real lo está realizando otra herramienta y, potencialmente, otro proveedor.

Parece una obsesión terminológica, pero evita decisiones equivocadas. Cuando digo que una tarea se mantiene “interna”, estoy hablando también de fronteras de contexto y de proveedor. Cuando digo que una tarea se enruta fuera, sé que debo pensar en autenticación, cuota, políticas de datos y comportamiento de otro CLI.

El host no borra esa frontera. Solo la hace más cómoda de supervisar.

Esta semana me ha recordado algo bastante básico: una arquitectura empieza a ser manejable cuando sus nombres dejan de mentir. Si todo se llama agente, worker, subagente o tarea de forma intercambiable, acabas escribiendo reglas enormes para compensar una taxonomía mala. En cambio, con cuatro palabras bastante claras —Codex principal, subagente interno, host y agente externo— el diagrama casi se explica solo.

Y si el diagrama se explica solo, la skill también puede ser más corta. Menos instrucciones significa menos tokens gastados en recordar la infraestructura cada vez que quiero arreglar un botón.

## Referencias técnicas de esta semana

- [OpenAI — Codex](https://openai.com/codex/)
- [OpenAI — Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/)
- [OpenAI Codex — implementación de `spawn_agent`](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/handlers/multi_agents_spec.rs)
- [OpenCode — documentación del CLI](https://opencode.ai/docs/cli/)
- [Google Antigravity — modo headless de AGY](https://antigravity.google/docs/cli/headless/)
- [MiniMax — Token Plan](https://platform.minimax.io/subscribe/token-plan)
- [Ollama — pricing](https://ollama.com/pricing)

## Cierre: una centralita pequeña es mejor que cinco teléfonos

Hay semanas en las que termino con una feature visible. Un botón nuevo. Una pantalla. Algo que puedes señalar.

Esta semana he terminado con cinco carpetas de skills y varios scripts.

No es especialmente fotogénico.

Pero cambia mucho cómo quiero trabajar.

Lo que más me gusta es que no he intentado sustituir una herramienta por otra. He aceptado que cada una tiene cosas que me interesan y he intentado darles una jerarquía sencilla.

Codex manda.

Sus subagentes ayudan cuando digo “delega”.

Los agentes externos trabajan cuando digo “enruta”.

Un host los vigila.

Los logs cuentan lo ocurrido.

Y yo intento no lanzar tres agentes contra el mismo fichero a las dos de la mañana.

Eso último todavía no está automatizado.

Dame otra semana.
