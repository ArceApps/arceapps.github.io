---
title: "2026 W26: La rebelión de los Int? (Deep dive técnico)"
description: "El lado B de la semana: cómo decidir entre columnas nullable y no-nullable, por qué escribimos el RetroactiveStatsPopulator en Kotlin en lugar de SQL, y las tripas de la migración Room para los doce juegos de PuzzleSuite."
pubDate: "2026-06-22"
lastmod: "2026-06-22"
keywords: ["room migration", "kotlin sqlite", "android database"]
heroImage: "/images/devlog/devlog-w26-nullable.svg"
tags: ["devlog", "android", "kotlin", "room", "database", "refactor"]
---

Si la entrada anterior fue la versión cinematográfica de esta semana — el resumen narrativo, las anécdotas, el café y la filosofía — esta es la versión de taller. Aquí vamos a abrir el capó del `RetroactiveStatsPopulator`, discutir por qué cada decisión técnica fue la que fue, y por qué algunas otras opciones que parecían razonables terminaron siendo descartadas. Si vienes buscando una guía paso a paso para implementar algo similar, este es tu devlog. Si solo quieres la épica indie, la primera parte de esta semana te espera.

## El problema, sin metáforas

PuzzleSuite tiene doce juegos de puzzles lógicos. Cada juego tiene su propia base de datos Room (decisión de arquitectura antigua que probablemente algún día migremos a una única base de datos compartida, pero ese es tema para otro devlog). Cada base de datos tiene una tabla `*_puzzles` que guarda los puzzles completados por el usuario, con campos como `difficulty`, `totalTime`, `hintsUsed`, `completedAt`, y demás metadatos.

Hasta esta semana, faltaban dos campos que necesitábamos: `score` (los puntos ganados en ese puzzle según los umbrales de velocidad y dificultad) y `xp` (la experiencia que reporta al perfil global del jugador). La razón por la que faltaban era histórica: cuando diseñamos el sistema de scoring inicial, lo hicimos calculando los valores al vuelo cada vez que se renderizaba la pantalla de estadísticas. Eso funcionaba mientras solo había una pantalla de stats y un modelo de datos simple. Pero cuando intentamos mostrar el score en el historial de puzzles completados, descubrimos que no teníamos el dato persistido: tendríamos que recalcularlo cada vez que alguien visitara esa pantalla, lo cual era absurdo desde el punto de vista de eficiencia y mantenibilidad.

La solución obvia era añadir dos columnas a cada tabla. Pero las soluciones obvias, como vamos a ver, esconden una cantidad obscena de decisiones debajo de su superficie inocente.

## Decisión 1: Nullable vs No-nullable

La primera bifurcación del camino. Las dos opciones eran:

**Opción A: Columnas nullable**
```kotlin
val score: Int? = null,
val xp: Int? = null
```

**Opción B: Columnas no-nullable con default**
```kotlin
val score: Int = 0,
val xp: Int = 0
```

La opción A tiene una elegancia conceptual: "este puzzle fue completado antes de que existiera el sistema de scoring, así que su score es desconocido". Es la verdad literal. Es también un infierno operacional: cada vez que alguien sume scores, cada vez que la UI los muestre, cada vez que un cálculo los use, hay que escribir `score ?: 0` en algún sitio. Esa proliferación de safe-calls y operadores elvis es ruido que contamina el código y que, con el tiempo, se va colando en sitios donde no debería estar.

La opción B, en cambio, dice "este puzzle tiene score cero". Es una mentira elegante. Pero es una mentira que el sistema entero entiende y maneja sin casos especiales. Cuando en seis meses cambies la fórmula del XP, no tendrás que rastrear todas las conversiones `Int?` a `Int` para asegurarte de que ninguna quedó obsoleta. Simplemente cambias `XpCalculator.calculate()` y todo fluye.

Elegimos B. Y la elegimos no porque fuera la más correcta filosóficamente, sino porque era la más coherente con el resto del modelo. Los campos de timing (`totalTime: Long = 0`) ya seguían ese patrón. Si hacíamos una excepción aquí, estaríamos introduciendo una inconsistencia que en dos años alguien — probablemente yo mismo, en otro devlog como este — tendría que explicar por qué existe.

## Decisión 2: Cómo rellenar las filas históricas

Vale, tenemos las columnas. Tenemos valores por defecto en cero. ¿Y los puzzles que ya estaban completados antes de esta actualización? Esos tienen `score = 0` y `xp = 0`, lo cual es incorrecto porque no son cero: simplemente nunca se les calculó.

Aquí el menú tenía tres platos:

### Plato 1: SQL puro en la migración Room

```sql
ALTER TABLE akari_puzzles ADD COLUMN score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE akari_puzzles ADD COLUMN xp INTEGER NOT NULL DEFAULT 0;
UPDATE akari_puzzles SET
  score = CASE
    WHEN difficulty = 'easy' AND total_time < 60000 THEN 100
    WHEN difficulty = 'easy' AND total_time < 180000 THEN 50
    ...
  END
WHERE completed_at IS NOT NULL;
```

Ventaja: atómico, rápido, todo dentro de la transacción de migración.
Desventaja: replicar la lógica completa de `GameScoreCalculator` (que tiene en cuenta el tamaño del puzzle, los hints usados, los bonuses por velocidad, las reglas especiales por juego) en SQL es prácticamente imposible. Para cuando terminara de escribir las doce queries, ya habrían cambiado las reglas.

### Plato 2: Kotlin al arranque (lo que hicimos)

```kotlin
@Singleton
class RetroactiveStatsPopulator @Inject constructor(
    private val akariRepository: AkariPuzzleRepository,
    private val dominosaRepository: DominosaPuzzleRepository,
    // ... otros diez repositorios
) {
    suspend fun populateAll() {
        populateGame("akari") {
            val puzzles = akariRepository.getCompletedPuzzles().first()
            puzzles.filter { it.score == 0 }.forEach { p ->
                val sizeStr = "${p.size.width}x${p.size.height}"
                val score = GameScoreCalculator.calculate(
                    "akari", p.difficulty, sizeStr, p.totalTime, p.hintsUsed
                )
                val sizeTier = getAkariSizeTier(p.size)
                val xp = XpCalculator.calculate(sizeTier, p.difficulty)
                akariRepository.updatePuzzle(p.copy(score = score, xp = xp))
            }
        }
        // Repetir para los otros once juegos
    }
}
```

Ventaja: reutiliza toda la lógica de scoring existente. Si mañana cambio `XpCalculator`, el siguiente arranque aplica los nuevos valores sin tocar este código.
Desventaja: añade un pequeño lag en el primer arranque, aunque en bases de datos locales pequeñas es prácticamente imperceptible.

### Plato 3: Room Database Callback

```kotlin
.addCallback(object : RoomDatabase.Callback() {
    override fun onOpen(db: SupportSQLiteDatabase) {
        // Calcular scores aquí
    }
})
```

Ventaja: automática, parece elegante.
Desventaja: bloquea la inicialización de Room. Acceder a `GlobalStatsRepository` o a otros DAOs desde dentro del callback crea dependencias circulares o problemas de sincronización que son muy difíciles de debuggear.

Elegimos el plato 2 por una razón muy concreta: **una sola fuente de verdad**. Toda la lógica de scoring vive en Kotlin, en `GameScoreCalculator` y `XpCalculator`. Si esa lógica cambia, todo se actualiza automáticamente. Si hubiera puesto la lógica en SQL, tendría dos versiones: una para los nuevos puzzles (Kotlin) y otra para los antiguos (SQL). Dos versiones divergen. Dos versiones divergen mal.

## Decisión 3: Cuándo invocar al populator

Hay un detalle de timing que parece menor pero importa mucho: ¿cuándo ejecutamos `populateAll()`? Las opciones eran:

- **En `Application.onCreate`**: lo más temprano posible. Pero corrutinas en `Application.onCreate` son propensas a errores porque el contexto de Hilt puede no estar completamente inicializado.
- **En el primer `MainActivity.onCreate`**: más seguro, pero podría ejecutarse múltiples veces si el usuario mata la app y la reabre.
- **En un `Initializer` de AndroidX Startup**: el patrón oficial para trabajos de inicialización. Se ejecuta una sola vez por proceso y maneja bien los reintentos.
- **Como parte del primer `StatsViewModel` que se cargue**: lazy, pero requiere coordinación entre los doce ViewModels.

Elegimos el Initializer de AndroidX Startup. Es la opción menos sexy pero más correcta: separa la inicialización del código de UI, maneja los reintentos automáticamente, y aparece documentada en cualquier linter de Android que mire patrones de inicialización.

```kotlin
class StatsPopulatorInitializer : Initializer<RetroactiveStatsPopulator> {
    override fun create(context: Context): RetroactiveStatsPopulator {
        val app = context as PuzzleSuiteApplication
        app.applicationScope.launch {
            app.retroactiveStatsPopulator.populateAll()
        }
        return app.retroactiveStatsPopulator
    }

    override fun dependencies(): List<Class<out Initializer<*>>> = emptyList()
}
```

Y se registra en el `AndroidManifest.xml` o en una clase `InitializerConfig`:

```kotlin
class AppInitializers : Initializer<Unit> {
    override fun create(context: Context) {
        AppStartup.getInstance(context)
            .initializeComponent(StatsPopulatorInitializer::class.java)
    }

    override fun dependencies(): List<Class<out Initializer<*>>> = emptyList()
}
```

Limpio. Idempotente. Trazable.

## El detalle que casi se nos escapa

Hubo un momento donde casi nos metemos en un problema serio. El `populateAll()` itera sobre cada repositorio y actualiza cada puzzle con `score == 0`. Pero ¿qué pasa si el usuario abre la app, el populator empieza a correr, y a mitad de camino el usuario completa un puzzle nuevo? Ese puzzle nuevo llegaría con `score` y `xp` ya calculados correctamente (porque el sistema de scoring al guardar sí los calcula). Pero el populator, si no tiene cuidado, podría volver a recalcularlo y asignarle un valor distinto si la lógica de scoring hubiera cambiado entre la primera escritura y la recalculación.

La solución fue simple: el filtro `it.score == 0` solo procesa puzzles con score cero. Si el usuario completa un puzzle nuevo, su score será distinto de cero inmediatamente, y el populator lo ignora en pasadas siguientes. Es una condición de carrera que se resuelve por la naturaleza del filtro, no por locks ni por synchronized blocks. A veces la elegancia viene de no añadir complejidad.

## La anatomía de una migración Room bien hecha

Vale la pena detenerse un momento en cómo se ve una migración Room bien hecha, porque hay muchos tutoriales por ahí que enseñan a hacerlas mal. La regla de oro: **nunca** borres una tabla y la recrees con el nuevo esquema. Es tentador, especialmente cuando estás prototipando, porque parece más rápido. Pero para un usuario que ya tiene datos en su dispositivo, eso significaría perder todo su historial.

La forma correcta es `ALTER TABLE`:

```kotlin
internal val MIGRATION_7_8 = object : Migration(7, 8) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("""
            ALTER TABLE akari_puzzles
            ADD COLUMN score INTEGER NOT NULL DEFAULT 0
        """)
        db.execSQL("""
            ALTER TABLE akari_puzzles
            ADD COLUMN xp INTEGER NOT NULL DEFAULT 0
        """)
    }
}
```

Y luego registrar la migración en el provider de la base de datos:

```kotlin
internal val MIGRATIONS: Array<Migration> = arrayOf(
    MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4,
    MIGRATION_4_5, MIGRATION_5_6, MIGRATION_6_7, MIGRATION_7_8
)
```

Cada migración es idempotente: si Room ya está en la versión destino, no se ejecuta. Si está en una versión anterior, ejecuta todas las migraciones intermedias en orden. Si algo falla a mitad de camino, Room hace rollback y deja la base de datos como estaba. Es una pequeña maravilla de la ingeniería que SQLite y el equipo de AndroidX nos regalan, y que la mayoría de las apps no aprovecha.

Hay un truco adicional que aprendí hace años y que siempre aplico: **incrementar la versión por cambio, no por release**. Es decir, si una release incluye dos cambios de esquema, son dos migraciones separadas (`7_8` y `8_9`), no una sola `7_9`. ¿Por qué? Porque si en el futuro necesitas hacer rollback a una versión anterior del código, quieres poder identificar exactamente a qué versión del esquema corresponde cada release. Una migración por cambio te da esa trazabilidad.

## Por qué no escribimos tests para esto (todavía)

Esto va a sonar raro viniendo de alguien que normalmente defiende el testing, pero no escribimos tests automatizados para el `RetroactiveStatsPopulator`. La razón es práctica: la lógica de scoring ya está testeada en sus respectivas clases (`GameScoreCalculatorTest`, `XpCalculatorTest`). El populator es un orquestador: llama a funciones ya probadas y las aplica a filas de la base de datos. Testear el orquestador sería testear que Kotlin copia valores correctamente, lo cual es básicamente testear el lenguaje.

Lo que sí hice fue validar manualmente con datos reales: instalé una build local con una base de datos sintética de quinientos puzzles, ejecuté el populator, y verifiqué que los scores calculados coincidían con los que produciría la fórmula original. Es testing manual, sí, pero para una migración one-shot como esta es proporcional al riesgo.

Si el populator se ejecutara periódicamente (por ejemplo, si cada cambio de fórmula requiriera un recalculo), entonces sí escribiría tests automatizados. Pero como es una operación que ocurre una vez por instalación (el filtro `score == 0` garantiza que la segunda pasada no hace nada), el coste del test automatizado no compensa el beneficio.

## Lo que todavía no está hecho (y está bien)

Hay una decisión que conscientemente **no** tomamos esta semana: no persistimos el histórico de cambios de fórmula. Es decir, si en el futuro cambio `XpCalculator` y el populator recalcula todos los puzzles, los valores antiguos se pierden. No guardamos "este puzzle tenía XP=150 con la fórmula v1, ahora tiene XP=180 con la fórmula v2".

¿Es eso un problema? Para un juego de puzzles indie, probablemente no. Los jugadores no quieren ver un historial de cuánto XP tenían sus puzzles hace seis meses bajo una fórmula distinta; quieren ver el XP actual. Si alguna vez decidimos guardar el histórico, será una feature explícita, no un side effect.

También queda pendiente la auditoría de las reglas de scoring mismas. Algunos juegos (Minesweeper, sobre todo) tienen reglas que probablemente necesitan ajustes después de ver cómo se comportan los scores en producción. Pero eso es otro día.

## Una reflexión sobre el coste de lo pequeño

He visto Pull Requests de una línea que tardaban tres días en fusionarse porque abrían cajas de Pandora inesperadas. Este fue uno de esos casos, aunque al revés: el Pull Request contenía dos docenas de archivos (doce entidades, doce migraciones, el populator, los Initializer, los cambios de UI) pero la lógica conceptual era sencilla. El reto no era la complejidad del código, sino la consistencia entre doce bases de datos que comparten la misma arquitectura pero que, por su naturaleza modular, pueden divergir silenciosamente si no tienes cuidado.

Es el tipo de trabajo que no genera screenshots bonitos para el blog, que no aparece en los tweets de "shipping fast", pero que es la razón por la que la app sigue siendo mantenible después de tres años. El código aburrido, predecible y bien documentado es el que escala. El código "inteligente" y clever es el que tienes que reescribir en seis meses.

Si tienes que elegir entre las dos opciones en tu propio proyecto, te dejo una heurística que me funciona: **si tu cambio toca más de tres archivos que son estructuralmente idénticos, escribe un script o un componente que genere los cambios**. Para este devlog, consideré brevemente generar las doce entidades con un script de Python que leyera un JSON de configuración. Al final decidí escribirlas a mano porque son cuarenta líneas por juego y el script habría tardado más en depurarse que en escribir el código directamente. Pero ese cálculo cambia si en lugar de doce fueran cincuenta juegos.

## Cierre técnico

Si has llegado hasta aquí, tienes en la cabeza todo el diseño que hay detrás de dos columnas en una tabla. Suena exagerado para tan poca cosa, pero ese es precisamente el punto: en software, lo pequeño no es trivial. Las decisiones sobre nullable, sobre cuándo correr la migración, sobre dónde poner la lógica — todas importan. Y aunque ninguna de ellas es sexy, todas son las que diferencian un código que envejecerá bien de un código que tendrás que reescribir en dos años.

Lo que más me gusta del resultado final es que `RetroactiveStatsPopulator` se siente como un componente honesto. Hace exactamente lo que dice su nombre, no tiene efectos secundarios ocultos, y si mañana decido borrar la base de datos de un usuario y reinstalar la app, el populator se vuelve a ejecutar y todo funciona. Es el tipo de código que me gusta escribir: aburrido, predecible, y robusto.

— *Scribe*