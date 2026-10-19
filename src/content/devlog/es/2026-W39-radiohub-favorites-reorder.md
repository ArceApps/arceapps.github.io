---
title: "RadioHub: reordenar favoritas arrastrando sin perder orden"
description: "Cómo RadioHub convirtió favoritas en una lista persistente y por qué retirar el permiso full-screen-intent fue la única salida."
pubDate: 2026-09-21
lastmod: 2026-10-19
author: "ArceApps"
keywords: ["RadioHub", "Android", "favorites", "Room", "drag-and-drop"]
heroImage: "/images/devlog/radiohub-favorites-reorder.svg"
tags: ["Android", "Compose", "Room", "devlog", "permissions"]
draft: false
reference_id: "radiohub-favorites-reorder-w39"
---

Una lista de favoritas en una aplicación de radio parece una de las funcionalidades más aburridas del mundo hasta que la usas dos semanas y descubres que el orden en el que aparecen las emisoras determina por completo tu relación con el producto. Si tu favorita de las seis de la mañana siempre está abajo del todo, terminas abriendo el buscador cada día en lugar de pulsar un botón. Es la diferencia entre una aplicación que te entiende y una aplicación que solo guarda datos.

RadioHub arrastró ese problema varios meses. La versión 1.7.0 ya permitía guardar favoritas, pero el orden lo decidía el identificador interno de la base de datos: un rowid estable, sin ningún criterio humano. La versión 1.8.1, publicada el 21 de septiembre de 2026, cambió tres cosas a la vez. Permitió reordenar favoritas arrastrando con un gesto de mantener pulsado. Conservó ese orden entre sesiones. Y, como guinda inesperada, dejó de pedir un permiso que Google Play había decidido que ya no podíamos seguir declarando.

Estos tres cambios llegaron juntos porque tenían más en común de lo que parecía. Los tres eran decisiones sobre persistencia y presentación: en la base de datos, en la pantalla y en el manifiesto. Este artículo explica cada uno, las decisiones intermedias que se descartaron y por qué la iteración posterior terminó cambiando detalles que parecían menores.

## La necesidad que estaba debajo de la funcionalidad

Guardar una favorita en RadioHub es trivial: un toque en el icono de estrella de la pantalla de exploración o del reproductor. Pero esa favorita entraba en una lista mostrada por `StationDao.getFavoritesFlow()`, y esa lista ordenaba por `stationuuid ASC`. Es un orden estable, determinista, pero completamente arbitrario para la persona que va a usar la aplicación. Si descubres una emisora a las tres de la tarde, te aparece arriba; si la descubres a las once de la noche, te aparece en medio del resto.

El comportamiento tenía una lógica interna: cualquier fila de la base de datos tenía un orden implícito por su rowid, y la consulta simplemente delegaba en SQLite. Pero «orden por rowid» no es una experiencia, es una lotería. Cuando alguien construye una colección —emisoras favoritas, lecturas guardadas, listas de reproducción— espera imponer un orden humano. La expectativa no es nueva, pero a veces sigue siendo invisible hasta que te la encuentras.

El primer síntoma real fue un comentario durante una prueba interna: «¿por qué mi favorita de la mañana siempre queda la última?». La respuesta técnica era correcta y totalmente inútil: «porque su identificador es mayor». Lo que la persona quería decir era «he perdido la posibilidad de decidir qué es lo primero que veo al abrir la app».

La decisión fue añadir una columna explícita para el orden, mantener el orden por defecto para emisoras que aún no se habían reordenado y dejar que el gesto lo actualizara en el sitio.

## Una columna nueva en una tabla con datos reales

El cambio de esquema es el más fácil de explicar y el más arriesgado de ejecutar. RadioHub usa Room desde hace varias versiones, así que la columna `favoriteOrder` tenía que entrar con una migración real.

La migración MIGRATION_5_6 vive en `AppMigrations.kt`:

```kotlin
val MIGRATION_5_6: Migration = object : Migration(5, 6) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE station_cache ADD COLUMN favoriteOrder INTEGER")
        db.execSQL("UPDATE station_cache SET favoriteOrder = rowid WHERE isFavorite = 1")
    }
}
```

Dos sentencias. La primera añade una columna nullable. La segunda asigna el rowid actual como valor de orden para todas las favoritas existentes. Es deliberadamente sencillo: cualquier favorita preexistente recibe un orden que coincide con el orden implícito anterior. Una persona que abre la app después de la migración ve exactamente las mismas emisoras en el mismo orden que antes. Nadie nota el cambio de esquema.

La elección de `rowid` no es trivial. Podría haber ordenado por `lastPlayedAt`, por nombre, por fecha de marcado. Elegir `rowid` significa que el orden humano, cuando llegue, no competirá con un orden calculado. Cuando alguien decida que «Radio 3» va arriba, eso sustituye al `rowid` original. Mientras nadie reordene, el orden es el de siempre.

El segundo detalle es que la columna es nullable. Una favorita marcada antes de la migración tiene un valor entero. Una favorita marcada en una fila de caché que no estaba previamente como favorita podría tener null hasta que se le asigne un orden. La consulta de favoritos lo refleja:

```sql
SELECT * FROM station_cache
WHERE isFavorite = 1
ORDER BY
    CASE WHEN favoriteOrder IS NULL THEN 1 ELSE 0 END,
    favoriteOrder ASC,
    stationuuid ASC
```

Los nulos van al final. Los valores no nulos se ordenan por la columna. Y como desempate final, `stationuuid ASC` garantiza estabilidad si dos favoritas terminan con el mismo orden por algún error. Esa tercera clave no es paranoia: es la diferencia entre una lista que salta cuando hay un empate y una lista que se queda quieta.

La migración quedó registrada en el constructor de Koin, sumándose a las cuatro anteriores:

```kotlin
AppMigrations.MIGRATION_2_3,
AppMigrations.MIGRATION_3_4,
AppMigrations.MIGRATION_4_5,
AppMigrations.MIGRATION_5_6
```

Esto importa porque Room compara la versión persistida en el dispositivo con la versión declarada por el código. Si la lista no está completa, la app falla al primer arranque. La prueba `KoinModuleMigrationsTest` lo verifica: tras añadir la migración, el test confirma que la versión registrada en producción es 6. Saltarse ese test significa confiar en que la próxima persona que añada una migración recordará actualizar la lista. Confiar en disciplina manual cuando hay una forma automática de comprobarlo es exactamente lo que el pipeline de release de RadioHub intenta evitar.

## El DAO como contrato entre gesto y disco

Una vez decidido el esquema, el diseño del DAO es la parte que define el coste de mantener esta funcionalidad en el futuro. Hay tres métodos que vale la pena revisar.

El primero es la asignación automática de orden cuando se marca una nueva favorita:

```kotlin
@Query("SELECT COALESCE(MAX(favoriteOrder), -1) + 1 FROM station_cache WHERE isFavorite = 1")
suspend fun nextFavoriteOrder(): Int
```

Una nueva favorita recibe `MAX(favoriteOrder) + 1`, lo que la coloca al final de la lista. El `-1` cuando no hay favoritas significa que la primera obtendrá `0`, no `1`. Es un detalle que no afecta a la persona que usa la app, pero hace que `UPDATE favoriteOrder = 0` sea estable y predecible en la base de datos.

El segundo método es la operación que ejecuta el gesto de arrastre:

```kotlin
@Transaction
suspend fun reorderFavorites(orderedUuids: List<String>) {
    orderedUuids.forEachIndexed { index, uuid ->
        updateFavoriteOrder(uuid, index)
    }
}
```

La anotación `@Transaction` garantiza atomicidad: si la aplicación se cierra a mitad de un reordenamiento largo, la base de datos no queda con índices a medio escribir. La función recibe la lista de UUIDs en el orden visible de la UI y reasigna índices `0, 1, 2, ...` consecutivamente.

Esta elección —reasignar índices consecutivos— tiene una consecuencia que solo se aprecia semanas después. La columna FavoriteOrder no acumula huecos. Una favorita eliminada no deja un `favoriteOrder = 5` huérfano en mitad de la lista. Las inserciones posteriores pueden usar `MAX + 1` sin preocuparse de reindexar. Es un esquema denso.

El tercer método es la separación entre «guardar favorita» y «actualizar estado de favorita». `saveFavorite` recibe una entidad, mira si ya existe y, según el caso, hace `insert` con orden nuevo o `update` manteniendo el orden previo. La rama clave es esta:

```kotlin
if (existing == null) {
    insert(entity.copy(isFavorite = true, favoriteOrder = favoriteOrder))
} else if (!existing.isFavorite || existing.favoriteOrder == null) {
    updateFavorite(entity.stationuuid, true, favoriteOrder)
}
```

Si la fila existe y ya es favorita con un orden asignado, no se reescribe nada. Si existe pero todavía no tenía orden, se le asigna ahora. Esto cubre dos casos reales: una favorita marcada en una versión antigua (sin orden) y una favorita marcada en una versión nueva (con orden). El DAO no necesita saber de versiones: distingue por el estado del dato.

## La pantalla, donde la persistencia se convierte en gesto

La PR #24 añadió 144 líneas a `FavoritesScreen.kt` y quitó 19. La PR #25, al día siguiente, añadió 108 más y quitó 23. Juntas, 252 líneas de cambios en el mismo archivo. La pantalla tuvo dos rondas de revisión y vale la pena entender por qué.

La estructura del gesto se sostiene en cuatro estados locales:

```kotlin
var draggingUuid by remember { mutableStateOf<String?>(null) }
var dragOffsetPx by remember { mutableStateOf(0f) }
var dragStartOrder by remember { mutableStateOf<List<Station>>(emptyList()) }
var dragMoved by remember { mutableStateOf(false) }
```

`draggingUuid` identifica la fila que está siendo arrastrada. `dragOffsetPx` es el desplazamiento vertical en píxeles desde el inicio del gesto. `dragStartOrder` guarda una copia de la lista en el momento en que empezó el arrastre — se usa para restaurar si el gesto se cancela. `dragMoved` es la señal que decide si se persiste el reordenamiento al terminar o si se descarta.

El gesto empieza con un `onDragStarted` que captura el orden actual, marca la fila como arrastrada y dispara una vibración larga para confirmar que el gesto se ha reconocido. `onDragBy` actualiza el desplazamiento. `onDragFinished` decide: si el usuario movió la fila al menos una posición, persiste; si no, restaura el orden original.

La animación sigue al dedo con tres componentes:

```kotlin
translationY = if (isDragging) dragOffsetPx else 0f
scaleX = dragScale
scaleY = dragScale
shadowElevation = dragElevation
```

La fila arrastrada se eleva visualmente sobre el resto (mayor sombra, ligera escala) y se desplaza siguiendo el dedo. Las filas que no están siendo arrastradas permanecen en su sitio hasta que la fila activa cruza su posición.

## La histéresis que evita la indecisión

La primera versión del gesto tenía un problema sutil: cada vez que el dedo cruzaba el 60% de la altura de una fila, esa fila se movía. Si alguien arrastraba de arriba a abajo, llegaba al 60% de la primera fila, esa fila se movía hacia arriba, la geometría cambiaba y, al seguir arrastrando, podía cruzar el 60% de la siguiente fila y volver a mover. En un gesto continuo y decidido no pasa nada. En un gesto dubitativo, la lista vibra hacia adelante y hacia atrás.

La solución fue histéresis: usar un umbral distinto según la dirección del movimiento:

```kotlin
val direction = if (dragOffsetPx > 0f) 1 else -1
val isReversing = (lastDirection != 0 && lastDirection != direction)
val threshold = slotSizePx * if (isReversing) 0.72f else 0.62f
```

Hacia adelante, basta cruzar el 62% de la altura de la fila para que la fila saltada cambie de posición. Para invertir la dirección, hay que cruzar el 72%. Ese 10% extra es el espacio que evita que un pequeño temblor del dedo haga oscilar la lista.

La consecuencia visible es que la lista se siente firme. Las decisiones de movimiento son más difíciles de revertir accidentalmente, pero más fáciles de completar cuando son intencionadas. Es una decisión que solo se nota si la quitas: durante las pruebas internas, la versión sin histéresis producía feedback del tipo «a veces las favoritas se mueven solas». Con histéresis, nadie comenta nada, que suele ser la mejor señal de que un detalle funciona.

## Vibración háptica en dos momentos, no en todos

La pantalla dispara dos tipos de vibración durante un arrastre. Una `LongPress` al comenzar el gesto, que confirma que se ha reconocido la pulsación prolongada. Una `TextHandleMove` cada vez que una fila cambia de posición, marcando el cruce del umbral.

La decisión fue no vibrar en otros momentos. No al iniciar un arrastre cancelado. No al restaurar el orden original. No al reordenarse automáticamente al terminar. La razón es simple: la vibración se vuelve ruido si ocurre en cada frame o en cada transición. Una háptica es información cuando ocurre poco, en los momentos donde el usuario necesita saber que algo ha cambiado.

`HapticFeedbackType.TextHandleMove` existe en la API de Compose precisamente para esto: indicar al usuario que un manipulador de texto o lista ha saltado de posición. Es una constante pensada para editores de texto, pero se ajusta perfectamente a una lista reordenable. Reutilizar un valor semánticamente correcto de la plataforma es mejor que inventar un canal nuevo que el sistema no sabe interpretar.

El test correspondiente no necesita un dispositivo real para verificar la decisión. La unidad `HapticFeedback` de Compose expone el tipo como dato; basta con comprobar que se llama a `performHapticFeedback` con `TextHandleMove` cuando corresponde y con nada cuando no.

## Cancelar un gesto y volver al estado anterior

Hay una categoría de gestos que nunca termina en `onDragFinished` con persistencia: los gestos en los que el dedo no llegó a mover ninguna fila. En ese caso, `dragMoved` queda en `false` y `dragStartOrder` tiene la lista previa al gesto.

El flujo de cancelación es este: si `dragMoved` es `false`, `onDragFinished` no llama a `viewModel.reorderFavorites`. La lista vuelve a su estado original porque los valores mostrados dependen de `dragStartOrder` mientras `draggingUuid` no sea `null`. Cuando `draggingUuid` pasa a `null` y `dragMoved` es `false`, la lista se recompone con el orden previo.

Es una decisión de UX casi invisible pero importante. Si alguien pulsa por error en una fila y la suelta sin mover, la lista no se altera. Esto distingue un arrastre serio de un toque casual. Sin esa rama de cancelación, abrir la sección de favoritas y pulsar sin querer una fila reorganizaría la lista para todos los futuros arranques.

## TalkBack: mover arriba y mover abajo

El arrastre por gesto es solo una de las dos formas de reordenar. La segunda son las acciones nativas de TalkBack: «mover arriba» y «mover abajo».

Las cadenas están en `values/strings.xml` y `values-es/strings.xml`:

```xml
<string name="favorites_move_up">Move up</string>
<string name="favorites_move_down">Move down</string>
<string name="favorites_reorder_description">Reorder %1$s. Press and hold, then drag.</string>
```

El patrón es el estándar de accesibilidad para listas reordenables. Una persona que usa lector de pantalla enfoca una fila, activa la acción contextual «mover arriba» y la fila sube una posición. Cada acción produce el mismo cambio en la base de datos que un arrastre: una llamada a `viewModel.reorderFavorites`.

La descripción accesible de la fila incluye «Press and hold, then drag», lo que indica a TalkBack que la fila tiene un comportamiento de arrastre. La persona que navega con gestos puede decidir si usa el lector de pantalla o el arrastre directo; ambos caminos llegan al mismo estado.

El detalle importa porque la tentación cuando se añade una nueva interacción es olvidar a las personas que no pueden usar gestos táctiles. Un reorderable sin acción accesible es una función incompleta para una fracción significativa de usuarias.

## Por qué Google Play bloqueó 1.8.0

El mismo día que se integró el reordenamiento, otra PR —la #23— retiró un permiso del manifiesto. Era una decisión forzada por la revisión de Google Play, no una optimización estética.

El permiso retirado fue `android.permission.USE_FULL_SCREEN_INTENT`. Hasta 1.8.0, RadioHub declaraba este permiso para poder mostrar la pantalla de alarma por encima del lock screen usando un full-screen intent. La API existe desde Android 10 y permite lanzar una actividad al detectar una notificación de alta prioridad, ideal para alarmas.

El problema es que, desde Android 14, Google Play endureció la política sobre este permiso. Las aplicaciones que lo declaran deben justificarlo en el formulario de revisión de la ficha. Si la justificación no es convincente, la app puede ser rechazada antes de la actualización.

RadioHub ya tenía la pantalla `AlarmRingingActivity`. Pero la pregunta de revisión no era «¿la tienes?» sino «¿es esencial para tu funcionalidad de alarma?». La respuesta honesta era «no». Una alarma se puede atender perfectamente desde una notificación de alta prioridad con acciones «Detener» y «Posponer», sin necesidad de lanzar una actividad que ocupe toda la pantalla. El lock screen del propio sistema operativo se encarga de presentar la notificación con el formato correcto.

La retirada del permiso obligó a tres cambios coordinados.

El primero fue el manifiesto: quitar la línea del permiso. El segundo fue el `AlarmService.kt`: dejar de adjuntar el `full-screen-intent` a la notificación de alarma. El tercero fue la pantalla de alarmas: ya no mostraba el banner de Android 14 pidiendo el permiso. El archivo `FullScreenAlarmPermissionBanner.kt`, de 72 líneas, dejó de existir.

## El test que verifica la retirada

Una PR que quita un permiso necesita un test que demuestre que la retirada es real. Si el test pasa y el permiso sigue declarado, hay una contradicción detectable.

`AlarmNotificationTest.kt` se actualizó con esta aserción explícita:

```kotlin
@Test
fun alarmNotificationDoesNotUseFullScreenIntent() {
    val notification = buildAlarmNotification(...)
    assertNull(notification.fullScreenIntent)
}
```

La notificación construida por el servicio no tiene `fullScreenIntent` definido. Si alguien en el futuro añade por descuido el `setFullScreenIntent` a la notificación de alarma, este test falla. Es una invariante verificable, no una convención.

El test no necesita un dispositivo. `Notification` es una clase POJO con un campo booleano. Construir una notificación de prueba con el constructor real y comprobar que el campo es `null` es trivial y robusto. Lo que verifica es la decisión, no la compilación.

## El trade-off de no pedir un permiso

Quitar `USE_FULL_SCREEN_INTENT` cambia la experiencia de la alarma de dos formas.

La primera: en Android 14+, ya no aparece el banner que pedía al usuario conceder el permiso la primera vez que la app lo usaba. Esto reduce fricción y evita un paso donde muchas personas pulsan «no» sin entender qué estaban rechazando.

La segunda: cuando suena la alarma, la persona ve una notificación estándar de alta prioridad, no una pantalla a pantalla completa. En la mayoría de dispositivos con lock screen, el resultado visible es muy parecido: la notificación aparece encima del reloj con botones grandes de Detener y Posponer. Pero en dispositivos donde el sistema operativo estaba optimizando para full-screen intents, la presentación puede ser ligeramente menos prominente.

RadioHub aceptó el trade-off porque la diferencia visual es marginal y el coste de revisión de Google Play era real. Cada actualización de la app pasaba por una espera mientras un revisor decidía si la justificación era suficiente. Para una aplicación indie, ese riesgo no compensa el beneficio marginal de una pantalla a pantalla completa.

El release 1.8.1 describe el cambio exactamente así en el CHANGELOG:

> Alarms now use a high-priority lock-screen notification with Stop and Snooze instead of requesting full-screen intent access.

Frases cortas, sin jerga de marketing. Una persona que actualiza la app sabe exactamente qué ha cambiado en su experiencia.

## El release 1.8.1 como cierre del ciclo

La rama que integró el reordenamiento —el PR #24— también cerró la PR #22, que había quedado abierta durante los cambios de alarma. La #22 proponía la primera versión del reordenamiento; cuando se reabrió el trabajo sobre main, ya existían los commits de alarma y la nueva migración. Aplicar la #22 encima requería rebase. La solución fue reaplicar el trabajo sobre el main actual —PR #24— con la migración correcta y los tests actualizados.

El CHANGELOG refleja el orden cronológico del producto, no el orden de merges:

```markdown
## [1.8.1] - 2026-09-21

### Added
- Favorites can now be reordered by dragging and keep the chosen order between app sessions.

### Changed
- Redesigned the Favorites section to make saved stations clearer and easier to organize.
- Alarms now use a high-priority lock-screen notification with Stop and Snooze instead of requesting full-screen intent access.
```

La sección «Added» contiene la funcionalidad nueva. La sección «Changed» contiene los ajustes que afectan a una persona que ya tenía la app instalada. La nota sobre alarmas vive en «Changed» porque no es una característica nueva: es una decisión sobre cómo se presenta una característica existente.

El git tag `v1.8.1` se creó después de que los tests pasaran y el AAB estuviera construido. No se creó como marcador de intención al principio del trabajo, sino como confirmación al final. Es una pequeña disciplina que mantiene el significado de los tags.

## Lo que esta versión no intenta resolver

El reordenamiento por arrastre no resuelve varios problemas que están fuera de su alcance.

No sincroniza el orden entre dispositivos. Si una persona guarda favoritas en su teléfono y abre la app en una tablet, el orden es independiente. RadioHub no tiene cuenta de usuario ni sincronización en la nube; añadirla sería un proyecto aparte.

No reordena automáticamente por uso. La columna `lastPlayedAt` existe desde hace varias versiones, pero no influye en el orden de la lista. Una favorita que se escucha cada mañana no sube automáticamente a la primera posición. Esa decisión es deliberada: si el reordenamiento fuera automático, una persona no podría imponer su propio criterio.

No permite arrastrar entre listas. La sección «Recently Played» es independiente de la sección «Favorites». Mover una fila de una a otra no es un gesto soportado; requiere desmarcar y volver a marcar.

No exporta el orden. No hay un botón «compartir mi lista de favoritas en este orden». Si alguien quiere recomendar una lista, tiene que enumerarla manualmente.

Cada una de estas ausencias es una decisión, no una limitación. Una sección de favoritas que intenta hacerlo todo termina siendo confusa. RadioHub mantiene el alcance pequeño y predecible.

## Por qué la iteración PR #24 → PR #25 fue necesaria

La PR #24 integró el reordenamiento. La PR #25 lo pulió. Sin la #25, el gesto funcionaba, pero la lista se sentía nerviosa en ciertos bordes.

Los cambios específicos de la #25:

Los umbrales pasaron a depender de la altura real medida de la fila (`slotSizePx`) en lugar de un valor fijo de 44 dp. Esto importa en pantallas con densidad muy alta o muy baja: 44 dp pueden ser demasiado sensibles en algunos dispositivos y demasiado perezosos en otros.

La histéresis se hizo explícita con `lastDirection`, una variable que recuerda la dirección del último movimiento. Esto formalizó el comportamiento que antes era implícito: una inversión de dirección exige un poco más de desplazamiento antes de revertir.

La elevación y la escala pasaron a animarse con `animateFloatAsState`. Antes, los valores aparecían y desaparecían bruscamente. Ahora, la fila se eleva suavemente al comenzar el arrastre y vuelve a su sitio con la misma animación al terminar.

La persistencia solo se ejecuta tras un movimiento completo. `dragMoved` se activa con el primer cruce de umbral y no se desactiva hasta que el gesto termina. Una persona que mueve la fila dos posiciones y luego cancela ve la lista volver a su estado original, no quedarse a medias.

Cada uno de estos cambios es pequeño. Juntos, convierten un gesto «funciona» en un gesto que se siente terminado. La diferencia entre las dos PR es la clase de pulido que distingue a una aplicación indie que se preocupa por los detalles de una que solo implementa lo mínimo.

## Aprendizajes del ciclo

La primera lección es que un gesto táctil no termina cuando «hace lo que dice». Termina cuando la lista se siente firme bajo el dedo. La histéresis, la animación y la persistencia condicionada son parte del mismo diseño que la consulta SQL.

La segunda es que un DAO no es solo una capa de persistencia. Es un contrato sobre cómo la UI y el almacenamiento se hablan. Las firmas como `nextFavoriteOrder` o `reorderFavorites` imponen restricciones que hacen imposible ciertos bugs desde el diseño.

La tercera es que un permiso declarado en el manifiesto es un compromiso. No es estático: hay que justificarlo en cada ciclo de release si Google Play lo exige. Si la justificación se debilita, retirar el permiso es preferible a mantener un parche de revisión tras otro.

La cuarta es que la accesibilidad no es una capa adicional. Las acciones «mover arriba» y «mover abajo» de TalkBack son la mitad del contrato de reordenamiento. Sin ellas, la funcionalidad existe solo para una parte de las personas.

La quinta es que un CHANGELOG honesto cabe en dos frases por cambio. No hace falta marketing ni épica. Una persona que actualiza la app quiere saber qué ha cambiado en su experiencia; el resto vive en commits, PRs y devlogs como este.

## Resultado

Tras este ciclo, RadioHub ofrece una sección de favoritas que respeta el orden humano, lo conserva entre sesiones, sigue siendo accesible vía TalkBack y elimina un compromiso de permisos que Google Play había dejado de aceptar.

El release 1.8.1, fechado el 21 de septiembre de 2026, incluye:

- migración Room v5 → v6 con `favoriteOrder` denso;
- DAO con contrato explícito para reordenamiento atómico;
- gesto de arrastre con histéresis, háptica en dos puntos y persistencia condicionada;
- acciones nativas TalkBack para mover arriba y abajo;
- retirada del permiso `USE_FULL_SCREEN_INTENT`;
- notificaciones de alarma de alta prioridad con Detener y Posponer;
- CHANGELOG con dos entradas Added y dos entradas Changed, sin ruido editorial.

Nada de esto cambia la experiencia de uso de una persona que solo quiere escuchar la radio. Pero alguien que use la sección de favoritas cada día nota que ahora la app hace lo que esperaba.

## Referencias

- [PR #22 — feat(favorites): add persistent drag reordering (cerrada)](https://github.com/ArceApps/RadioHub/pull/22)
- [PR #23 — fix(alarms): remove full-screen intent permission](https://github.com/ArceApps/RadioHub/pull/23)
- [PR #24 — feat(favorites): integrate persistent drag reordering](https://github.com/ArceApps/RadioHub/pull/24)
- [PR #25 — Improve favorite reorder feedback](https://github.com/ArceApps/RadioHub/pull/25)
- [Android Developers — Build accessible apps with Compose](https://developer.android.com/develop/ui/compose/accessibility)
- [Android Developers — Permissions on Android: USE_FULL_SCREEN_INTENT](https://developer.android.com/reference/android/Manifest.permission#USE_FULL_SCREEN_INTENT)
- [Android Developers — Room migrations](https://developer.android.com/training/data-storage/room/migrating-db-versions)
- [Compose — LocalHapticFeedback](https://developer.android.com/reference/kotlin/androidx/compose/ui/hapticfeedback/package-summary)
- [Devlog previo — RadioHub: audio delay and recording pipeline (2026-W38)](https://arceapps.github.io/devlog/2026-W38-radiohub-audio-delay-clock/)
- [Devlog previo — RadioHub: self-contained release gate (2026-W38)](https://arceapps.github.io/devlog/2026-W38-radiohub-release-gate/)