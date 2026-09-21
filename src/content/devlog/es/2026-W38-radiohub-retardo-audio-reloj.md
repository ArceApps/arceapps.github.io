---
title: "RadioHub: retrasar audio sin romper el reloj"
description: "Cómo RadioHub convirtió un retardo de hasta 60 segundos en un pipeline PCM continuo y unificó la grabación con los bytes realmente reproducidos."
pubDate: 2026-09-20
lastmod: 2026-09-21
author: "ArceApps"
keywords: ["RadioHub", "Media3", "AudioTrack", "PCM", "Android"]
heroImage: "/images/devlog/radiohub-delay-pcm-pipeline.svg"
tags: ["Android", "audio", "Media3", "devlog"]
draft: false
---

Añadir un control para retrasar una radio entre 0 y 60 segundos parece, desde fuera, una función pequeña. Un deslizador, un número, un buffer y listo. Esta semana RadioHub me recordó por qué el audio en tiempo real castiga esa clase de simplificaciones: retrasar el sonido no consiste solamente en guardar bytes y devolverlos más tarde. En cuanto el reproductor, el `AudioSink`, `AudioTrack` y el grabador comparten la misma corriente PCM, también hay que preservar progreso, identidad de buffers, escrituras parciales y una línea temporal coherente.

El resultado final acabó siendo más sencillo que varias de las soluciones intermedias. El pipeline quedó con una regla que ahora parece obvia: **`DelayedAudioSink` decide qué PCM debe sonar; `RecordingCaptureAdapter` registra únicamente el rango que `AudioTrack` consume realmente**. Directo y retardo usan el mismo camino. El retardo cambia el contenido del PCM, no el mecanismo de grabación.

Llegar ahí requirió tres PR —[#19](https://github.com/ArceApps/RadioHub/pull/19), [#20](https://github.com/ArceApps/RadioHub/pull/20) y [#21](https://github.com/ArceApps/RadioHub/pull/21)— y, sobre todo, descartar una idea que inicialmente parecía razonable: tratar el preroll del retardo como una pausa sin progreso.

## El problema real no era guardar 60 segundos

RadioHub reproduce streams mediante Media3. La función de retardo se apoya en un `AudioSink` que recibe PCM decodificado antes de que llegue a la salida de plataforma. Para conseguir, por ejemplo, 30 segundos de retraso, el sistema necesita conservar suficiente audio histórico y reproducir muestras anteriores en vez de las recién recibidas.

El primer modelo mental era directo: mientras no exista suficiente historial, se retiene el audio; cuando el buffer alcanza la duración elegida, empieza la reproducción retrasada. Funcionalmente describe bien lo que quiere el usuario. Técnicamente tiene una consecuencia importante: desde el punto de vista del renderer, durante ese preroll puede parecer que no existe progreso.

Eso chocó con una protección legítima de Media3. La PR #19 documentó que el detector de reproductor bloqueado interpretaba los retrasos largos como una reproducción que permanecía en `STATE_READY` sin avanzar. El timeout normal era inferior a la ventana intencionada de 0–60 segundos. El primer arreglo elevó el timeout del reproductor de radio a 75 segundos y dejó el servicio de alarmas intacto.

Era una corrección acotada y tenía una prueba de regresión útil: el timeout debía permanecer por encima del máximo retardo permitido. También era una señal de que el contrato estaba siendo forzado. Si para implementar un retardo deliberado había que convencer al reproductor de que tolerase un minuto sin progreso, quizá la abstracción equivocada era “no progreso”.

## Un reloj continuo aunque todavía no haya radio audible

La PR #21 cambió el enfoque. En vez de mantener al sink sin consumir mientras se llenaba el historial, cada buffer PCM entrante pasó a producir una salida de la misma duración. Durante el preroll, esa salida es silencio PCM válido. Cuando el historial alcanza el retardo solicitado, el silencio se sustituye por el PCM retrasado.

Esta diferencia es pequeña en una descripción y enorme en el contrato temporal:

```text
PCM entrante -> historial de retardo -> selección de salida -> AudioTrack
                                      |-> silencio durante preroll
                                      |-> PCM histórico después
```

El renderer deja de ver un agujero. Hay muestras que consumir desde el principio y la línea temporal avanza continuamente. El retardo deja de representarse como “esperar antes de reproducir” y pasa a representarse como “reproducir ahora el contenido correspondiente a otro punto del historial”.

Eso permitió retirar el workaround del timeout ampliado. Es una de las partes que más me interesan de este cambio: la PR #19 no fue inútil porque la #21 la sustituyera. Sirvió para aislar el síntoma, confirmar la interacción con Media3 y mantener estable el comportamiento mientras se encontraba una solución que respetase mejor el modelo del reproductor.

La documentación oficial de [Media3 ExoPlayer](https://developer.android.com/media/media3/exoplayer) ayuda a entender por qué el progreso temporal importa, mientras que la referencia de [AudioTrack](https://developer.android.com/reference/android/media/AudioTrack) es imprescindible cuando la discusión baja al consumo real de PCM. En este caso no bastaba con pensar en “audio reproducido” como una operación atómica.

## El silencio también tiene formato

Emitir silencio durante el preroll parece trivial: llenar un bloque con ceros. Pero el sink no puede inventar bytes arbitrarios; debe respetar la codificación PCM configurada. La PR #21 añadió cobertura específica para silencio PCM de 8 y 16 bits.

El objetivo no era crear una nueva fuente de audio. Era mantener la cadencia de consumo con frames válidos hasta que existiera historial suficiente. Ese detalle separa una solución temporalmente correcta de otra que solo funciona bajo una configuración concreta.

Además, el estado interno mantiene `isPreparing=true` hasta que se consume el primer PCM retrasado real. El reloj puede avanzar y el pipeline puede estar activo sin afirmar antes de tiempo que el contenido retrasado ya está sonando. Progreso técnico y significado de producto no son exactamente la misma cosa.

## El segundo bug: grabar con retardo

Una vez estabilizados los retrasos largos apareció el problema más incómodo: la grabación. Sin retardo, RadioHub grababa correctamente. Con retardo activo, el resultado podía quedar a tirones y con una reverberación evidente.

Ese contraste era una pista muy fuerte. Si la entrada de red, el decodificador y el encoder podían producir una grabación limpia en modo directo, introducir una ruta especial para el retardo multiplicaba los lugares donde podían divergir reproducción y grabación.

La PR #20 intentó estabilizar ese camino capturando el PCM liberado por `DelayedAudioSink` antes de que los reintentos parciales de `AudioTrack` pudieran fragmentar la grabación. También corrigió dos problemas relacionados: transiciones transitorias de `isPlaying=false` mientras el player seguía preparado para reproducir, y timestamps AAC cuando un bloque PCM se dividía entre varios buffers de `MediaCodec`.

Era una mejora fundamentada. Pero la prueba real mostró que la grabación con retardo seguía sin comportarse como la grabación directa. Ahí apareció la pregunta que terminó simplificando todo: **si ya sabemos exactamente qué bytes se oyen, ¿por qué no grabar esos mismos bytes?**

## AudioTrack no promete consumir todo de una vez

La clave está en que una escritura hacia `AudioTrack` puede ser parcial. Un buffer que el código ofrece a la salida no equivale necesariamente a un buffer que la salida ha consumido completo. Puede haber reintentos. Puede haber un `flush`. Puede producirse una discontinuidad.

Si el grabador copia por adelantado el buffer completo que *pretendemos* reproducir, la grabación puede incorporar datos que todavía no han sido consumidos. Si luego la escritura parcial obliga a reintentar parte de ese contenido, el modelo de captura puede duplicar o desalinear muestras respecto a lo que realmente pasó por la salida.

La PR #21 movió la frontera de captura. `RecordingCaptureAdapter` ya no recibe “el bloque que queremos enviar”, sino el rango que la operación de salida consumió de verdad.

Conceptualmente:

```text
DelayedAudioSink
      |
      v
RecordingCaptureAdapter
      |
      +---- copia SOLO bytes consumidos ----> encoder AAC
      |
      v
AudioTrack
```

Este orden hace que la grabación siga el hecho observable más fiable del pipeline: el consumo efectivo. Si `AudioTrack` consume una parte, se captura esa parte. Si hay retry, no se inventa una segunda copia. Si se descarta contenido antes de llegar a la salida, tampoco aparece mágicamente en el archivo.

## Un solo pipeline para directo y retardo

La decisión importante no fue añadir más lógica específica para el delay, sino eliminarla. Después de #21, la grabación ya no necesita saber si el PCM proviene del stream actual o del historial retrasado.

`DelayedAudioSink` tiene una responsabilidad: elegir el PCM que corresponde escuchar. Puede ser audio directo, silencio de preroll o audio histórico.

`RecordingCaptureAdapter` tiene otra: observar cuánto de ese PCM consume realmente la salida y copiar exactamente ese rango cuando la grabación está activa.

`AudioTrack` sigue siendo la frontera con la reproducción de plataforma.

El encoder recibe las muestras capturadas y construye el archivo.

Esta separación reduce estados cruzados. Antes era posible razonar sobre “grabación normal” y “grabación retrasada” como dos variantes. Ahora la grabación es una sola; lo que cambia aguas arriba es la señal que llega a ella.

Para una aplicación pequeña e independiente, este tipo de simplificación tiene un valor especial. No se trata solo de ahorrar líneas. Cada bifurcación de audio es una combinación adicional que habrá que entender meses después, probar con cambios de Media3 y reproducir cuando aparezca un informe extraño de un usuario.

## La identidad del ByteBuffer importa

Otro detalle cubierto por la implementación final es conservar la identidad del `ByteBuffer` durante escrituras parciales. En APIs de streaming de bajo nivel no siempre basta con que dos buffers contengan los mismos bytes. El consumidor puede mantener estado asociado al objeto o a su posición, y un retry debe continuar exactamente desde el punto correcto.

La PR #21 incluye regresiones para escrituras parciales y retries, además de cambios de retardo, vuelta a directo, `flush` y discontinuidades. Esa matriz importa porque un pipeline de audio raramente falla solo en el camino feliz. Los errores interesantes viven en las transiciones.

Cambiar de 10 a 30 segundos no es equivalente a arrancar directamente en 30. Reducir el retardo puede obligar a descartar historial. Volver a directo cambia qué parte del buffer debe alimentar la salida. Un `flush` invalida supuestos sobre datos pendientes. Una discontinuidad obliga a distinguir la cronología del renderer de la cronología que queremos escribir en un M4A.

## El reloj del archivo no debe depender del reloj de reproducción

La otra simplificación importante afectó a AAC. La PR #20 ya había identificado que dividir PCM entre varios buffers de `MediaCodec` requería avanzar timestamps de forma consistente. La #21 llevó la idea hasta su consecuencia natural: el timestamp del archivo grabado no debe derivarse del timestamp del renderer cuando la grabación representa una secuencia continua de muestras efectivamente capturadas.

El encoder mantiene fragmentos PCM incompletos entre llamadas y reconstruye frames completos. En paralelo, los timestamps del M4A se generan a partir del número acumulado de muestras grabadas.

En términos conceptuales:

```text
presentationTimeUs =
    recordedSamples * 1_000_000 / sampleRate
```

La fórmula es sencilla; la decisión arquitectónica es lo importante. El archivo tiene su propio reloj basado en lo que contiene. Si el reloj de reproducción salta hacia delante o hacia atrás por una discontinuidad o por la mecánica del retardo, eso no obliga al archivo a heredar el salto.

La documentación de [MediaCodec](https://developer.android.com/reference/android/media/MediaCodec) describe el modelo de buffers y timestamps del codec. En RadioHub, desacoplar ambas líneas temporales evita pedirle al timestamp de reproducción que represente dos cosas distintas.

## Buffering no es lo mismo que un falso “no estoy reproduciendo”

La PR #20 también cubrió una sutileza de estado. Con el pipeline activo podían aparecer transiciones transitorias de `isPlaying=false` aunque el player siguiera en `STATE_READY`, con `playWhenReady=true` y sin supresión.

Interpretar cualquier `isPlaying=false` como una pausa real de grabación era demasiado agresivo. La solución distingue esos huecos transitorios de causas reales como buffering, pérdida de audio focus o una interrupción.

Esta distinción sigue siendo relevante en el diseño final. Durante el preroll se emite silencio para mantener el progreso del sink, pero la prueba de grabación exige no grabar ese silencio cuando la grabación está pausada por `BUFFERING`. Que existan bytes técnicamente consumibles no significa que todas las condiciones de producto para capturarlos estén satisfechas.

## Las pruebas que merecía este cambio

La PR #21 no se limitó a comprobar “delay funciona”. Añadió regresiones sobre:

- preroll de silencio y transición al PCM retrasado;
- 60 segundos completos con progreso continuo;
- timestamps de reproducción monotónicos;
- escrituras parciales y retries de `AudioTrack`;
- aumento y reducción del delay;
- vuelta a directo, `flush` y discontinuidades;
- silencio PCM correcto en 8 y 16 bits;
- exclusión del silencio de preroll durante pausas por buffering;
- captura exclusiva de bytes consumidos;
- reensamblado de PCM fragmentado antes de AAC;
- reloj AAC continuo aunque cambien los timestamps de reproducción.

No todas esas pruebas verifican la misma capa. Algunas protegen el contrato con Media3; otras, el adaptador de captura; otras, la construcción del archivo. Juntas documentan mejor la arquitectura que un comentario largo dentro del sink.

También hay un límite que conviene mantener explícito: la propia PR señala que el síntoma final de reverberación o tirones necesita validación en dispositivo real porque depende del comportamiento efectivo de `AudioTrack` y `MediaCodec`. Los tests pueden demostrar invariantes y regresiones lógicas; no convierten automáticamente una simulación en un altavoz físico.

## Una cronología que conviene no reescribir

Hay un detalle editorial importante. La documentación SpecAI cerró los criterios C1–C5 con aceptación runtime el 19 de septiembre. Después llegaron #19, #20 y, finalmente, #21. Por tanto, esa aceptación no puede utilizarse como prueba retrospectiva de la arquitectura final.

Es tentador contar una historia más limpia: “se implementó, se validó y quedó terminado”. El historial real es más útil. Hubo una feature aceptada, apareció un comportamiento problemático en condiciones concretas, se introdujo un workaround razonable, se mejoró la captura y después se simplificó el modelo completo.

El commit [28819031](https://github.com/ArceApps/RadioHub/commit/28819031dcecf7de90fcc9d12842001e2786f9f0) integra la solución final de reproducción y grabación. Poco después, los commits de preparación y [release 1.8.0](https://github.com/ArceApps/RadioHub/commit/d462039606dc40ffe8e7c092c0518799f40099b7) cerraron el período.

## Qué me llevo de esta semana

La primera lección es que un retardo de audio es, ante todo, un problema de tiempo. El almacenamiento es necesario, pero no define por sí solo la corrección. Hay que decidir qué significa progreso para el renderer, qué timestamp representa cada capa y qué ocurre durante la fase en la que todavía no existe historial reproducible.

La segunda es que **la frontera de observación importa**. Capturar “lo que voy a enviar” y capturar “lo que realmente se consumió” parecen casi equivalentes hasta que aparecen escrituras parciales. Colocar la grabación después de la decisión de delay y en el punto de consumo efectivo elimina una categoría completa de discrepancias.

La tercera es desconfiar de las ramas especiales cuando dos modos deberían compartir semántica. La grabación sin retardo ya funcionaba bien. El objetivo correcto no era construir una grabación con delay cada vez más sofisticada, sino hacer que el delay entregase su PCM al mismo mecanismo fiable.

La cuarta es que un workaround puede ser útil sin convertirse en arquitectura. Ampliar el timeout resolvió un fallo concreto y aportó evidencia. Retirarlo después fue una mejora, no una contradicción: el sistema dejó de necesitar una excepción cuando el sink empezó a mantener progreso continuo.

Y la quinta es documental: no conviene atribuir a una validación anterior garantías sobre código posterior. Un devlog técnico gana más mostrando la secuencia real que puliendo retrospectivamente las aristas.

## El estado final

Al terminar la semana, RadioHub tenía un modelo más coherente que al empezar. El retardo de hasta 60 segundos ya no necesita congelar el progreso del sink. El preroll mantiene una línea temporal mediante silencio PCM válido. Cuando existe historial suficiente, la salida cambia al PCM retrasado. La grabación observa los bytes realmente consumidos por `AudioTrack`, conserva fragmentos hasta formar unidades adecuadas para el encoder y calcula el tiempo del archivo a partir de las muestras acumuladas.

Sobre todo, directo y retardo han dejado de ser dos mundos para la grabación.

Ese es el tipo de refactor que prefiero conservar en una bitácora: no porque la solución final sea espectacular, sino porque termina siendo más fácil de explicar que el problema que sustituyó. Cuando una arquitectura de audio puede resumirse con “decide qué suena, captura lo que realmente sonó y cuenta las muestras grabadas”, hay menos lugares donde esconder un eco fantasma.

## Invariantes que quedan explícitos

Una de las ventajas de haber pasado por varias iteraciones es que ahora resulta más fácil escribir las invariantes del sistema sin depender de detalles accidentales de implementación.

**Primera: el renderer siempre debe poder progresar.** Elegir 60 segundos de retardo no puede convertir 60 segundos de funcionamiento correcto en algo indistinguible de un bloqueo. Durante el preroll se consume tiempo real mediante PCM válido; después se consume PCM histórico. La naturaleza de la señal cambia, no la continuidad del contrato.

**Segunda: el retardo nunca autoriza al grabador a adelantarse a la salida.** El hecho de que un bloque exista en memoria no significa que haya sido reproducido. Solo el rango confirmado como consumido puede entrar en la captura. Esta regla cubre de una vez escrituras completas, parciales y reintentos.

**Tercera: cambiar el delay es una transición de estado, no un reinicio conceptual del reproductor.** El historial debe adaptarse sin romper las garantías del buffer que ya está siendo procesado. Por eso las pruebas de aumentar y reducir delay son tan importantes como la prueba estática de 60 segundos.

**Cuarta: un flush corta supuestos sobre trabajo pendiente.** Cualquier diseño que conserve referencias a datos anteriores debe tener claro qué estado sobrevive y qué estado debe descartarse. Lo mismo ocurre con discontinuidades: son precisamente el momento en que usar ciegamente el reloj del renderer para el archivo grabado se vuelve más frágil.

**Quinta: la grabación tiene una cronología derivada de muestras.** Si se han codificado N muestras a una frecuencia determinada, existe una respuesta objetiva para la posición temporal del archivo. No hace falta reconstruirla a partir de eventos de reproducción que responden a otras necesidades.

Estas invariantes son más útiles que una lista de clases. Si mañana cambia una implementación interna, permiten preguntar si el comportamiento sigue siendo correcto sin exigir que el código conserve exactamente la forma actual.

## Por qué no bastaba con “hacer el buffer más grande”

Otra tentación habitual al ver fallos que aparecen con 30, 45 o 60 segundos es sospechar simplemente de capacidad. Un retardo largo, al fin y al cabo, exige almacenar más PCM. Pero los síntomas observados no apuntaban solo a falta de memoria: Media3 detectaba ausencia de progreso y la grabación con delay divergía de una grabación directa que ya era estable.

Aumentar capacidad puede evitar un overflow; no corrige un contrato temporal. Tampoco arregla una captura situada en el lado equivocado de una escritura parcial. Separar estos problemas evitó convertir el buffer circular en el culpable universal de cualquier fallo de audio.

Esto también explica por qué #19 y #21 atacan niveles distintos. #19 modifica cuánto tiempo tolera Media3 antes de declarar que no hay progreso. #21 hace que sí exista progreso. La segunda solución elimina la condición que obligaba a la primera excepción.

En ingeniería de audio es fácil confundir tamaño, latencia y tiempo porque se relacionan mediante el bitrate o el formato PCM. Sin embargo, son dimensiones diferentes. La cantidad de memoria necesaria responde a cuánto historial queremos conservar. La latencia elegida responde a qué punto del historial queremos oír. El progreso responde a si el consumidor sigue avanzando en su contrato. Mezclarlas produce parches que parecen correctos porque todos se expresan finalmente en “segundos”.

## El valor de probar las fronteras

El caso de 60 segundos merece una prueba no porque sea un número mágico, sino porque es el extremo del contrato de producto. Si el usuario puede elegirlo, no debe tratarse como una condición excepcional sin cobertura.

Las escrituras parciales son otra frontera, esta vez de API. En una ejecución normal pueden ser poco visibles, pero el diseño no puede depender de que cada write consuma todo el buffer. La regresión convierte esa posibilidad documentada en una propiedad que el código debe soportar siempre.

Y las discontinuidades son la frontera temporal. Obligan a responder qué reloj pertenece a qué cosa. El renderer puede necesitar ajustar su posición; el archivo, en cambio, necesita representar de manera continua las muestras que realmente contiene.

Miradas juntas, estas pruebas forman una estrategia más general: probar el máximo de producto, el comportamiento no atómico de la API y las transiciones que rompen la continuidad. Son tres lugares donde un happy path suele ocultar supuestos.

## De la corrección local a una arquitectura más pequeña

La secuencia de PR también muestra una diferencia entre corregir un síntoma y reducir el espacio de estados.

Aumentar el timeout corrige un síntoma local. Capturar el buffer liberado antes de retries intenta estabilizar una ruta concreta. Hacer que el sink progrese siempre y capturar únicamente consumo efectivo reduce estados: ya no existe “un minuto válido sin progreso” y ya no existe “una grabación especial del delay que debe mantenerse sincronizada con la salida”.

Reducir estados tiene un efecto acumulativo. Hay menos combinaciones que probar, menos comentarios que mantener y menos posibilidades de que una futura modificación de Media3 o del grabador arregle el modo directo pero deje atrás el modo retrasado.

No significa que toda duplicación sea mala ni que un único pipeline sea siempre superior. Aquí funciona porque la semántica buscada es explícitamente la misma: el archivo debe contener lo que el usuario escucha, sujeto al estado real de grabación. Cuando dos caminos comparten esa definición, hacerlos converger en la misma frontera de captura elimina diferencias que no aportaban valor.

La versión 1.8.0 cerró esta etapa con esa idea mucho más clara que al inicio. Para mí, ese es el resultado técnico principal de la semana: el delay dejó de ser una excepción que contaminaba al reproductor y al grabador, y pasó a ser una transformación concreta de la señal dentro de un pipeline común.

## Referencias

- [RadioHub — repositorio](https://github.com/ArceApps/RadioHub)
- [PR #19 — Fix long radio delay triggering Media3 stuck-player error](https://github.com/ArceApps/RadioHub/pull/19)
- [PR #20 — Stabilize recordings with radio delay enabled](https://github.com/ArceApps/RadioHub/pull/20)
- [PR #21 — Stabilize delayed playback and recording](https://github.com/ArceApps/RadioHub/pull/21)
- [Commit de integración de #21](https://github.com/ArceApps/RadioHub/commit/28819031dcecf7de90fcc9d12842001e2786f9f0)
- [Release commit 1.8.0](https://github.com/ArceApps/RadioHub/commit/d462039606dc40ffe8e7c092c0518799f40099b7)
- [Android Developers — Media3 ExoPlayer](https://developer.android.com/media/media3/exoplayer)
- [Android Developers — AudioTrack](https://developer.android.com/reference/android/media/AudioTrack)
- [Android Developers — MediaCodec](https://developer.android.com/reference/android/media/MediaCodec)
