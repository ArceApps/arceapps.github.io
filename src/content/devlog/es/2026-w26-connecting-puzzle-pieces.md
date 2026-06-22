---
title: "2026 W26: Conectando los puntos del rompecabezas"
description: "Una semana donde dos features aparentemente pequeñas terminaron por revelar la arquitectura profunda de PuzzleSuite: navegación clicable desde el perfil y persistencia retroactiva de XP y scores en los doce juegos."
pubDate: "2026-06-22"
heroImage: "/images/devlog/devlog-w26-connecting.svg"
tags: ["devlog", "android", "kotlin", "compose", "room", "navigation"]
---

Hay semanas donde uno se sienta frente al editor convencido de que va a escribir tres líneas de código, tomarse un café, y volver a la cama. Esta no fue una de esas semanas. Esta fue la semana donde dos Pull Requests "sencillitos" — añadir un clic a una tarjeta y meter dos columnas nuevas en una base de datos — me arrastraron a una reflexión sobre la naturaleza misma del estado en una aplicación Android. Pero vayamos por partes, como siempre, porque la historia merece ser contada desde el principio.

## El gancho: una tarjeta que no hacía nada

Si llevas tiempo usando PuzzleSuite, probablemente conozcas la pestaña de Perfil. Es esa pantalla donde, además de tu racha y tus estadísticas globales, aparece una grilla elegante con el progreso de los doce juegos que componen la suite: Akari, Dominosa, Fillomino, Galaxies, Hashi, Hitori, Kakuro, Kenken, MathCrossword, Minesweeper, Shikaku y Slitherlink. La grilla tiene su miga — usa `SuiteProgressGrid`, un componente compartido que renderiza una `GameProgressCard` por juego, con barras de dificultad, contadores de completados y un porcentaje calculado al vuelo.

El problema es que esas tarjetas eran, hasta esta semana, bonitas pero inertes. Podías mirarlas, sentir el orgullo de tus cien Akaris completados, y poco más. La navegación a la pantalla de logros del juego correspondiente vivía en otro sitio: en el menú del juego, dos niveles de profundidad más abajo. Si querías ver los logros de Dominosa desde el Perfil, tenías que volver al Home, abrir el menú de Dominosa y luego saltar a sus logros. Tres taps. Una fricción absurda para una de las interacciones más naturales del mundo: "oye, he visto mi progreso en Dominosa desde aquí, déjame ver los detalles sin tener que navegar como si estuviera resolviendo un laberinto".

La primera tarea documentada, `20260618-profile-achievements-navigation`, nació exactamente para arreglar esto. El título suena pomposo para lo que terminó siendo una feature de tres commits, pero el diablo estaba en los detalles. O mejor dicho: el diablo estaba en la firma de los composables.

## El nudo: cuando Compose no te deja mentir

`SuiteProgressGrid` ya existía. `GameProgressCard` ya existía. `ProfileScreen` ya existía. Lo que no existía era una manera limpia de decirle al sistema "cuando alguien toque esta tarjeta, vete a la pantalla de logros de Dominosa" sin acoplar la grilla al `NavController` global. Si haces eso — pasar el `NavController` como parámetro hasta el componente más interno — conviertes cada `Composable` en un mini-aplicación con conocimiento de toda la jerarquía de navegación. Y entonces cualquier refactor futuro se convierte en un juego de Jenga donde nadie quiere mover la pieza del medio.

La solución limpia, que es la que adoptamos, fue propagar un callback hacia arriba. En Compose, el patrón "datos hacia abajo, eventos hacia arriba" no es una sugerencia: es una obligación moral. Así que la cadena quedó así:

`MainScreen` recibe `onNavigateToGame: (String) -> Unit` del navegador global. Cuando declara `ProfileScreen` en su `NavHost` interno, le pasa `onNavigateToGameAchievements = onNavigateToGame`. `ProfileScreen` recibe ese callback, lo mapea añadiendo el sufijo `_achievements` al ID del juego, y se lo entrega a `SuiteProgressGrid` como `onGameClick`. `SuiteProgressGrid` lo propaga a cada `GameProgressCard`. Y `GameProgressCard`, finalmente, añade el modificador `.clickable { onGameClick(progress.gameId) }` a la tarjeta principal.

Suena a trabalenguas, y lo es. Pero funciona porque cada pieza solo conoce a su padre inmediato. La grilla no sabe que existe un navegador global; el perfil no sabe que existe un `NavController`; la tarjeta solo sabe que cuando la tocan, tiene que invocar una lambda. Esta es la magia — y a veces la tortura — de Compose: te obliga a ser explícito sobre las dependencias, lo cual escala mejor pero requiere más tipeo.

El otro detalle interesante fue el manejo del back stack. Cuando navegas desde el Perfil y luego presionas "atrás" en la pantalla de logros, ¿adónde deberías volver? Si navegas desde el Perfil, la respuesta intuitiva es "al Perfil". Si navegas desde el Menú del Juego, la respuesta intuitiva es "al Menú del Juego". Compose Navigation lo resuelve solo, sin que tengamos que intervenir, porque cada `popBackStack()` se queda en la pantalla anterior del stack. Es uno de esos momentos donde la herramienta te da lo que necesitas si dejaste de pelear con ella cinco minutos antes.

## El clímax inesperado: el problema del dato histórico

Hasta aquí, todo era arquitectura limpia y propagación de callbacks. Pero la segunda tarea, `20260621-game-stats-persistence`, tenía una trampa escondida bajo una superficie inocente.

La premisa era simple: queremos que cada puzzle completado registre su `score` y su `xp` en la base de datos, para que el historial pueda mostrar "has ganado +150 XP y 320 puntos en este Hashi" en lugar de solo "completado en 4:32". Hasta aquí, todo bien. Dos columnas nuevas en cada una de las doce tablas de puzzles. Doce migraciones Room, una por juego. Trivial.

Pero entonces alguien — yo, sentado con el tercer café de la mañana — formuló la pregunta obvia: "¿Y qué pasa con los puzzles que ya estaban completados antes de esta actualización?". Y la respuesta fue: nada. Estarían en la base de datos con `score = 0` y `xp = 0` para siempre, a menos que ejecutemos alguna lógica retroactiva.

Si tienes mil quinientos puzzles completados en tu instalación local — que es perfectamente plausible si llevas dos años jugando a PuzzleSuite — eso son mil quinientas filas que necesitan ser recalculadas y actualizadas. ¿Cuándo? ¿Cómo? ¿Con qué reglas?

Aquí es donde la decisión "nullable vs no-nullable" deja de ser un detalle sintáctico y se convierte en una cuestión filosófica. Si las columnas son `Int?`, podemos representar limpiamente "este puzzle fue completado antes de que existiera el sistema de puntuación, así que su score es desconocido". Si son `Int = 0`, estamos mintiendo: estamos diciendo que esos puzzles antiguos tienen cero puntos, cuando en realidad nunca se les calculó ninguno. La opción B — `Int = 0` con un `DEFAULT 0` en la migración — es la que ganó, por consistencia con el resto del modelo de datos (los campos de timing ya siguen ese patrón), pero la decisión requirió una entrada entera en el documento de diseño explicando por qué elegíamos mentir elegantemente en lugar de admitir nuestra ignorancia.

Pero el verdadero clímax fue la **población retroactiva**. Una vez decidido que las columnas empezarían en cero, necesitábamos rellenarlas. Y aquí teníamos tres caminos:

1. **SQL puro en la migración**: ejecutar `UPDATE akari_puzzles SET score = ...` dentro de la transacción de Room. La ventaja era velocidad y atomicidad. La desventaja era que replicar la lógica de `GameScoreCalculator` — que tiene en cuenta thresholds de velocidad por tamaño y dificultad, bonuses dinámicos, hints usados, y reglas distintas para cada uno de los doce juegos — en SQL puro era una pesadilla de mantenimiento.

2. **Lógica en Kotlin al arrancar**: dejar que las migraciones añadan las columnas vacías, y luego, al iniciar la app, un componente recorre los repositorios, busca los puzzles con `score == 0`, y los recalcula usando las funciones de scoring existentes en Kotlin. Es lo que hicimos.

3. **Callback de Room**: ejecutar el cálculo dentro de `RoomDatabase.Callback.onOpen`. La ventaja era automatización. La desventaja era bloquear la inicialización de la base de datos y crear dependencias circulares con Hilt y `GlobalStatsRepository`.

La opción dos ganó por una razón muy concreta: respeta la regla de oro de "una sola fuente de verdad para la lógica de negocio". Si mañana cambio la fórmula del XP, no quiero tener que reescribir doce queries SQL diferentes. Quiero cambiar `XpCalculator.calculate()` y que el próximo arranque de la app aplique los nuevos valores. Esa es la promesa del recalculo retroactivo: no solo arregla el pasado, sino que se mantiene vivo en el futuro.

## El desenlace: doce archivos, una sola arquitectura

Lo que más me gusta de cómo quedó esta semana es que, aunque toqué doce bases de datos diferentes, el patrón fue exactamente el mismo en todas. Para cada juego:

1. Modifiqué el `data class` de dominio para añadir `score: Int = 0` y `xp: Int = 0`.
2. Modifiqué la entidad de Room con los mismos campos, asegurándome de que el mapeo `toDomain()` y `toEntity()` los propagara.
3. Añadí una migración de versión que incrementa el schema en uno y ejecuta dos `ALTER TABLE … ADD COLUMN`.
4. Añadí el juego correspondiente al `RetroactiveStatsPopulator` — un `@Singleton` con `@Inject` para los doce repositorios.

Es gratificante ver cómo una arquitectura Clean estricta paga dividendos cuando tienes que aplicar el mismo cambio N veces. Cuando cada capa está aislada, los cambios son predecibles. Cuando acoplas capas, cada repetición es una oportunidad para introducir un bug sutil. He vivido lo suficiente en este proyecto como para saber que esa predictibilidad vale su peso en café.

## Aprendizajes y despedida

Las dos lecciones que me llevo de esta semana son técnicamente modestas, pero filosóficamente densas.

La primera: **la navegación en Compose no es un lujo arquitectónico, es una declaración de principios**. Cuando decides propagar callbacks en lugar de pasar el `NavController` a todo el mundo, estás diciendo "mi UI es testeable, mi UI es refactorizable, mi UI es comprensible". El coste inmediato son más líneas de código y firmas más verbosas. El beneficio a largo plazo es que nunca tendrás que reescribir media app porque cambiaste de `NavHost` a `Voyager`.

La segunda: **los datos históricos son una ventana al pasado, y las ventanas se pueden actualizar**. La idea de que un usuario con mil quinientos puzzles completados pudiera ver todos con score cero era inaceptable. Pero más importante que arreglar el pasado fue diseñar un sistema que pueda arreglarse a sí mismo cuando las reglas cambien. Ese es el verdadero valor del `RetroactiveStatsPopulator`: no es un parche, es una garantía.

Si has llegado hasta aquí leyendo, te debo una confesión: este devlog estaba planeado como un único artículo, pero la materia prima se rebeló y terminó partiéndose en dos. La segunda parte, *"La rebelión de los `Int?`"*, es un deep dive técnico sobre todo lo que hubo que decidir para hacer funcionar el sistema de persistencia retroactiva. Te espero allí si quieres bajar al barro del SQL, los trade-offs de nullable, y el código de `RetroactiveStatsPopulator`. Si prefieres quedarte en la superficie narrativa, nos vemos en la próxima entrada.

Mientras tanto, ve a la pestaña Perfil y toca una tarjeta. Si todo ha ido bien, aterrizarás en la pantalla de logros del juego con un ripple elegante y el orgullo de un developer que por fin se atrevió a conectar los puntos.

## Un apunte sobre el ripple, porque nadie habla del ripple

Hay un detalle que me encanta de Material Design 3 y que rara vez se comenta: el modificador `.clickable` no solo añade el handler de touch, sino que aplica automáticamente la animación ripple que ves cuando presionas la tarjeta. Esa onda expansiva, ese círculo que se expande desde el punto donde tocaste, no es gratuita: está implementada en `androidx.compose.foundation` como un `Indication` configurable, y por defecto usa `LocalIndication.current` que en Material Theme 3 es precisamente el `rememberRipple()`. Lo que significa que añadir `clickable { }` a un componente y obtener feedback táctil instantáneo es una decisión arquitectónica que alguien en el equipo de Compose tomó hace años para ti, y que probablemente nunca agradeces lo suficiente.

En PuzzleSuite ese ripple es la diferencia entre una tarjeta que se siente como un botón y una que se siente como una foto. Cuando navegas por la grilla del Perfil, cada toque te devuelve una pequeña confirmación visual de que la app te escuchó. En un juego de puzzles, donde la respuesta a tus acciones es el centro de la experiencia, ese tipo de micro-detalles son los que separan una app "que funciona" de una app "que se siente bien". No es magia, es Compose haciendo su trabajo.

## Por qué ser indie importa aquí

Trabajas solo. No hay un product manager que te diga "esto es prioridad uno". No hay un equipo de QA que te diga "oye, en este caso el usuario toca dos veces porque el ripple no se ve". No hay un diseñador que te entregue una especificación detallada de cada interacción. Tienes tu cabeza, tu café, y los issues abiertos en GitHub. Y esa soledad, que a veces pesa, otras veces libera: porque te permite tomar decisiones que en una empresa mediana requerirían tres reuniones, un acta y un Jira actualizado.

Cuando decidí que `Int = 0` era mejor que `Int?` para los campos de score, no tuve que escribir un RFC. Cuando decidí propagar callbacks en lugar de pasar el `NavController`, no tuve que convencer a un tech lead. Cuando decidí que doce migraciones idénticas eran mejor que un script de migración genérico, no tuve que justificar el trade-off ante un equipo de arquitectura. Solo tuve que estar seguro, y eso es un privilegio que no valoras hasta que has trabajado en equipos donde cada cambio de tres líneas pasa por cuatro aprobaciones.

Pero ese privilegio tiene su contrapartida: la responsabilidad de equivocarte bien. Si me equivoqué con el nullable, no hay code review que me corrija. Si la navegación pierde el back stack en algún caso edge, no hay tester que me lo reporte antes del release. Soy yo, en mi sofá, viendo cómo los issues se acumulan en el repositorio. Y eso, curiosamente, también está bien. Porque cada error que meto en producción es un error que documentaré, que aprenderé, y que la próxima vez no meteré.

## El cierre que no es cierre

Esta semana aprendí que a veces las features pequeñas son las más peligrosas. No porque sean complejas — al contrario, son engañosamente simples — sino porque te tientan a no prestarles la atención arquitectónica que merecen. El clic en una tarjeta parece trivial. Dos columnas nuevas en una tabla parecen triviales. Pero ambos cambios tocan los nervios expuestos de la aplicación: cómo navegas, cómo persistes, cómo mantienes la coherencia entre lo viejo y lo nuevo.

Si estás construyendo algo similar, te dejo tres reglas que me han servido esta semana:

1. **Cada callback tiene un dueño.** Si no puedes rastrear quién invoca un lambda, refactoriza hasta que puedas.
2. **Cada migración cuenta una historia.** Si vas a alterar una tabla, piensa en las filas que ya están ahí. No son un detalle, son el pasado de tu usuario.
3. **Cada patrón que repites diez veces merece una abstracción.** Doce juegos con la misma columna nueva no son una casualidad; son una lección de arquitectura esperando ser aprendida.

Nos vemos en la próxima entrada, donde bajaremos al barro del SQL y del Kotlin para ver cómo se construye un `RetroactiveStatsPopulator` que realmente funcione.

— *Scribe*