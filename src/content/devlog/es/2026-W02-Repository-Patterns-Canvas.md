---
title: "2026 W02: Generics, Canvas y la Búsqueda de la Eficiencia Absoluta"
description: "Una crónica de extremos: eliminando 400 líneas de código repetido con arquitecturas genéricas y redibujando cada píxel a mano para salvar el rendimiento en gama media."
pubDate: 2026-01-14
tags: ["devlog", "kotlin", "architecture", "performance", "canvas", "compose", "refactoring", "generics"]
heroImage: "/images/devlog-w02-canvas.svg"
---

Hay semanas en el desarrollo de software que se sienten como construir una catedral: todo es estructura, vigas de acero, planos azules y discusiones elevadas sobre la carga estructural del viento o la inyección de dependencias. Y hay otras semanas que se sienten como ser un relojero suizo obsesivo, con una lupa en el ojo, limando un engranaje microscópico para que el segundero no pierda un milisegundo.

Esta semana, la segunda de 2026, tuve la extraña fortuna (o desgracia) de ser ambos.

Por las mañanas, me ponía el casco de arquitecto para resolver una deuda técnica que me estaba consumiendo el alma: la duplicación masiva en la capa de datos. Por las tardes, bajaba a las trincheras del *pixel-perfect* porque el rendimiento de **Kakuro** en dispositivos de gama media estaba siendo, para decirlo suavemente, inaceptable.

Es una dicotomía extraña la de nuestro oficio. En la mañana estás definiendo interfaces genéricas `<T>` que abstractan la realidad en conceptos puros y platónicos. En la tarde estás calculando coordenadas `(x, y)` y peleándote con la trigonometría básica de primaria para saber si un dedo tocó un rectángulo o una línea. De la abstracción total a la concreción absoluta.

Bienvenidos a la Semana 02. Preparaos un café largo, porque vamos a hablar de cómo borrar código es mejor que escribirlo, y de cómo dibujar rectángulos a mano es a veces la única forma de sobrevivir en el brutal mundo de Android.

## Parte 1: La Tiranía del Copy-Paste (y cómo romper sus cadenas)

Empecemos con una confesión vergonzosa. Un *mea culpa* público. Tengo 10 juegos en **PuzzleSuite**.

Cuando empecé este proyecto hace meses, la velocidad era la única métrica que importaba. La presión (autoimpuesta, claro) era lanzar. "Shippeame el Sudoku", "Shippeame el Kakuro", "Shippeame el Hitori". Y en esa carrera frenética, cometí el pecado capital del desarrollador: **Copy-Paste**.

Hice el repositorio para *Kakuro*. Funcionó. Era hermoso. Estaba limpio.
Luego copié `KakuroPuzzleRepository.kt`, lo pegué, lo renombré a `HitoriPuzzleRepository.kt`, hice un `Find & Replace` de "Kakuro" a "Hitori", y me fui a dormir sintiéndome productivo. "¡He implementado la capa de datos de un juego nuevo en 5 minutos!", pensé, ingenuo de mí.

Repite esto 10 veces.
Luego repítelo para los `StatsRepository`.

El resultado fue una base de código con **20 Repositorios** que eran idénticos en un 95%. Una hidra de veinte cabezas donde cortar una significaba que te crecían dos bugs más.

```kotlin
// KakuroRepository.kt
fun getPuzzle(id: String): Flow<KakuroPuzzle> { 
    return dao.getPuzzle(id).map { it.toDomain() }
}

// HitoriRepository.kt
fun getPuzzle(id: String): Flow<HitoriPuzzle> { 
    return dao.getPuzzle(id).map { it.toDomain() } // ¿Te suena familiar?
}
```

El problema de este enfoque no es estético. No es que el código sea "feo" o "poco elegante". Es que es una trampa mortal para el mantenimiento. Esta semana, quise añadir una funcionalidad simple: una opción en la configuración para borrar las estadísticas de un juego específico. Algo trivial, ¿verdad? `DELETE FROM stats WHERE game_id = ?`.

Tuve que abrir 10 archivos distintos (`KakuroStatsRepository`, `HitoriStatsRepository`, etc).
Tuve que escribir la misma función `deleteStats()` 10 veces.
Y, por supuesto, como soy humano y no una máquina, cometí un error tipográfico en 3 de ellos. Y olvidé inyectar el DAO en 2.
El resultado: 5 crashes potenciales en producción y una mañana entera perdida arreglando lo que debería haber sido un cambio de 5 minutos.

Me miré al espejo, con las ojeras de quien ha estado peleando con imports de Dagger Hilt toda la mañana, y dije: "Basta. No soy un robot de escribir código. Soy un ingeniero. Vamos a arreglar esto".

### El Santo Grial: `BasePuzzleRepository<T>`

La solución teórica es simple: Herencia y Polimorfismo. Conceptos de primero de carrera. Pero en la práctica, con Kotlin y Corrutinas, las cosas se ponen interesantes.

El objetivo era crear una clase base que manejara todo el CRUD (Create, Read, Update, Delete) común, pero manteniendo el tipado fuerte. No quería un `BaseRepository` que devolviera `Any` o un `Puzzle` genérico que tuviera que castear luego en cada ViewModel. Si pido un puzzle al repositorio de Kakuro, quiero que el compilador sepa, sin lugar a dudas, que es un `KakuroPuzzle`.

Aquí es donde entran los **Generics** de Kotlin.

```kotlin
// La definición de la interfaz madre
interface BasePuzzleRepository<T : Puzzle> {
    fun getPuzzleById(id: String): Flow<T?>
    suspend fun savePuzzle(puzzle: T)
    suspend fun deletePuzzle(id: String)
    fun getInProgressPuzzles(): Flow<List<T>>
    fun getCompletedPuzzles(): Flow<List<T>>
}
```

Fíjate en ese `<T : Puzzle>`. Esa pequeña "T" es la que hace la magia. Le dice al compilador: "Este repositorio va a trabajar con un tipo específico de Puzzle, y no quiero que pierdas esa información". Es un contrato.

La implementación de esta base fue catártica. Ver cómo borraba funciones enteras de los repositorios hijos para dejar líneas vacías o simples llamadas a `super` fue una de las mejores sensaciones de la semana. Es como hacer limpieza de primavera en tu casa digital. Cada línea borrada es una línea que no tendrá bugs en el futuro.

### El Caso Curioso de Minesweeper (y la excepción a la regla)

Pero la abstracción total es un mito. Siempre, siempre hay una excepción. En mi caso, el niño rebelde fue **Minesweeper**.

Resulta que Minesweeper no se comporta como los demás. Cuando guardas un puzzle de Minesweeper, el juego necesita saber inmediatamente el ID que se generó en la base de datos para poder iniciar un temporizador específico asociado a ese ID. Los demás juegos no necesitan eso; guardan "fire-and-forget" y dejan que la UI se actualice sola reaccionando al Flow de la base de datos. Minesweeper, por su naturaleza tensa y cronometrada, necesitaba una confirmación inmediata.

La firma en la base era:
```kotlin
suspend fun savePuzzle(puzzle: T) // Devuelve Unit
```

Pero Minesweeper necesitaba desesperadamente:
```kotlin
suspend fun savePuzzle(puzzle: MinesweeperPuzzle): String // Devuelve el ID
```

Kotlin es estricto. Y hace bien en serlo. No puedes cambiar el tipo de retorno en una sobreescritura (`override`). Si la interfaz dice que devuelves `Unit`, devuelves `Unit`. Punto.

Aquí me enfrenté a un dilema filosófico que define la madurez de un desarrollador:
1.  **Opción A (La Purista)**: Cambiar la interfaz base para que `savePuzzle` devuelva *siempre* un `String` (el ID), aunque los otros 9 juegos no lo usen para nada. Ensucio la definición de 9 para acomodar a 1.
2.  **Opción B (La Pragmática)**: Dejar `savePuzzle` como está en la base, y añadir un método específico en el repositorio de Minesweeper.

Elegí la Opción B. La pureza está bien para los libros de texto, pero ensuciar la API de 9 clientes por culpa de 1 es mala arquitectura.

```kotlin
class MinesweeperPuzzleRepositoryImpl(...) : BasePuzzleRepository<MinesweeperPuzzle>(...) {
    // Implementación del método base (obligatorio, aunque sea redundante aquí)
    override suspend fun savePuzzle(puzzle: MinesweeperPuzzle) {
        dao.insert(puzzle.toEntity())
    }
    
    // Método específico para el caso de uso de Minesweeper
    suspend fun savePuzzleAndGetId(puzzle: MinesweeperPuzzle): String {
        val id = dao.insertReturningId(puzzle.toEntity())
        return id
    }
}
```

Es un compromiso. Pero el software real está hecho de compromisos. No existe la arquitectura perfecta, solo la arquitectura que mejor se adapta a tus restricciones actuales.

### El Script de la Vergüenza

Para cerrar el capítulo de la refactorización, tengo que admitir algo irónico que probablemente me costaría mi carnet de "Clean Coder".

Parte de la refactorización implicaba añadir el método `deleteStats()` a todos los DAOs (Data Access Objects). Los DAOs son interfaces de Room, y las interfaces de Room no pueden heredar implementación de la misma manera fácil (o al menos, no sin meterse en jerarquías de interfaces complicadas que Room a veces rechaza). Así que *tenía* que añadir la línea `@Query("DELETE FROM table_stats")` en 10 archivos manualmente.

¿Lo hice a mano? No.
¿Lo hice con una refactorización inteligente del IDE (IntelliJ Structural Search)? No funcionaba bien con anotaciones SQL dentro de interfaces.

Hice lo impensable. Escribí un script de **PowerShell** (sí, PowerShell) que iteraba por los archivos, buscaba la línea del último corchete `}` y le inyectaba el código SQL antes.

```powershell
# Fragmento del crimen
$files = Get-ChildItem ".*Dao.kt" -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName
    # Inyección de código sucio aquí
    Set-Content $file.FullName $newContent
}
```

Sí. Usé un script sucio para automatizar la escritura de código repetitivo de una refactorización destinada a eliminar código repetitivo. La ironía no se me escapa. Pero funcionó. Y en 2 segundos, 10 archivos estaban actualizados. A veces, la herramienta más tonta es la más efectiva. No se lo contéis a Bob Martin.

Al final del día, el `git diff` marcaba **-400 líneas**. Cuatrocientas líneas de bugs potenciales, de mantenimiento futuro y de ruido cognitivo, eliminadas para siempre. La base de código respira mejor. Yo respiro mejor.

## Parte 2: La Guerra de los Frames (El Descenso al Canvas)

Mientras mi mente flotaba en las nubes de los Generics y la arquitectura limpia, la realidad me golpeó en la cara con un ladrillo. O mejor dicho, con un **lagazo**.

Estaba probando la nueva versión de **Kakuro** en un Pixel 4a (mi dispositivo de "realidad", porque en el emulador de PC con un i9 todo vuela a 120fps). Abrí un puzzle grande, de 15x15.
El scroll iba a tirones.
Al tocar una celda, había un retraso perceptible de unos 100-200ms antes de que se seleccionara.
El Logcat escupía advertencias de *"Skipped frames! The application may be doing too much work on its main thread."*

Para un juego de puzzles estático, esto es inaceptable. No estamos renderizando *Cyberpunk 2077*. Estamos renderizando números en una cuadrícula. ¿Qué estaba pasando? Si ni siquiera hay animaciones complejas, ¿por qué mi teléfono se estaba calentando?

### El Culpable: `LazyVerticalGrid` y la Sobrecarga de Composición

La herramienta estándar para grillas en Jetpack Compose es `LazyVerticalGrid`. Es maravillosa. Es flexible. Es fácil de usar.
Pero tiene un costo oculto que nadie te cuenta en los tutoriales de "Hello World".

Cada celda en mi grilla de Kakuro no era un simple rectángulo. Era un árbol de composición complejo:
1.  Un `Box` (para el layout y bordes).
2.  Un `Surface` (para la elevación y el color de fondo).
3.  Un `Column` (porque las celdas de pista tienen dos números divididos).
4.  Dos comparables `Text` (para los valores numéricos).
5.  Un `Canvas` pequeño o `Line` (el separador diagonal).
6.  Un modificador `.clickable` con su propio estado de interacción (Ripple effect).

Multiplica eso por 225 celdas (15x15). Estamos hablando de **más de 1300 nodos** que Compose tiene que gestionar, medir (`measure`), posicionar (`layout`) y dibujar (`draw`) en cada frame.

Y lo peor: **Kakuro no es "lazy"**. Cuando juegas, necesitas ver todo el tablero (o la gran mayoría) para resolver el puzzle. `LazyVerticalGrid` está optimizado para listas infinitas de Instagram donde reciclas vistas a medida que scrolleas. Aquí no reciclábamos nada, solo pagábamos el costo de la infraestructura de reciclaje sin obtener sus beneficios.

El Profiler de Android Studio me mostró la verdad desnuda: al iniciar el tablero, ocurrían **105 recomposiciones**. El sistema estaba recalculando todo el árbol de UI una y otra vez porque un estado cambiaba al iniciar. El teléfono estaba gastando más CPU en calcular dónde poner las cajitas que en la lógica del juego.

### La Solución Nuclear: `Canvas` Puro

Decidí que no podía optimizar lo existente. Podía quitar sombras, simplificar layouts, usar `key {}`, pero el problema base persistía: demasiados nodos.

Tenía que cambiar el paradigma. Tenía que dejar de "componer" componentes y empezar a "dibujar" píxeles.

En Android (y en casi cualquier sistema gráfico), dibujar directamente en un **Canvas** es órdenes de magnitud más rápido que gestionar jerarquías de vistas. En un Canvas, no hay "Hijos". No hay "Layout Pass" recursivo.

Tú le dices a la GPU: "Dibuja un rectángulo azul en (0,0) de 100x100". Y la GPU dice: "Hecho". Fin.
Es programación gráfica de la vieja escuela. Inmediata. Brutal.

Pero con gran poder viene una gran responsabilidad (y un gran dolor de cabeza matemático).

Al pasar a Canvas, pierdes todo lo que Compose te da gratis:
- Ya no tienes `clickable`. Tienes que detectar toques `(x, y)` crudos y calcular qué celda es.
- Ya no tienes `Text` con auto-ajuste. Tienes que medir el ancho y alto del texto manualmente.
- Ya no tienes accesibilidad automática (TalkBack). Tienes que implementarla tú con `Modifier.semantics`.
- Ya no tienes temas automáticos. Tienes que pasar los colores manualmente.

Decidí empezar con **Hitori** como piloto (TASK-2026-011), y luego, si sobrevivía, escalar a Kakuro.

### Dibujando Matemáticas: El Código

El código de `HitoriGrid` pasó de ser un DSL declarativo bonito a ser un bucle de renderizado imperativo. Es menos leíble para un junior, pero es poesía para la CPU.

```kotlin
Canvas(modifier = Modifier.fillMaxSize().pointerInput(Unit) {
    detectTapGestures { offset ->
        // Magia matemática para saber qué tocaste
        // "Si toqué en X=350 y cada celda mide 50, estoy en la columna 7"
        val col = (offset.x / cellSize).toInt()
        val row = (offset.y / cellSize).toInt()
        
        if (col in 0 until cols && row in 0 until rows) {
            onCellClick(row, col)
        }
    }
}) {
    // Fase de Dibujo: Un bucle for simple
    puzzle.cells.forEach { cell ->
        val x = cell.col * cellSize
        val y = cell.row * cellSize
        
        // 1. Dibujamos el fondo
        drawRect(color = cell.color, topLeft = Offset(x, y), size = Size(cellSize, cellSize))
        
        // 2. Si es una celda compleja (Kakuro), dibujamos la diagonal
        if (cell.type == CLUE) {
             drawLine(
                 start = Offset(x, y),
                 end = Offset(x + cellSize, y + cellSize),
                 strokeWidth = 2f
             )
        }
    }
}
```

La parte más complicada fue, sin duda, el texto. En Compose estándar, pones `Text("5")` y te olvidas. Él solo sabe centrarse. En Canvas, tienes que usar `TextMeasurer`.

Tienes que preguntarle al sistema: *"Disculpa, sistema, ¿cuánto mide exactamente, en píxeles, el glifo del número '5' renderizado en la fuente Roboto Bold tamaño 24sp?"*.
El sistema devuelve unas dimensiones (ej. 12x18 píxeles).
Luego tienes que calcular el offset exacto para centrar esos 12x18 píxeles dentro de tu celda de 60x60.

Matemáticas de primaria, sí, pero hazlo mal por un píxel y todo tu diseño se ve *off*.

`val textResult = textMeasurer.measure("5")`
`val textX = cellX + (cellWidth - textResult.size.width) / 2`
`val textY = cellY + (cellHeight - textResult.size.height) / 2`

Parece tedioso, y lo es. Es doloroso. Pero cuando compilas y lo ejecutas...

### Mantequilla Pura: Los Resultados

El resultado fue, sin exagerar, **mantequilla pura**. Una epifanía.

Hicimos las mediciones comparativas (documentadas en TASK-2026-023 y TASK-2026-019) y los números no mienten:

- **Recomposiciones de carga**: Bajaron de ~105 a **~5**. El sistema solo dibuja una vez y ya. No hay árbol que recalcular.
- **Tiempo de renderizado inicial**: Se redujo en un **50%** (de 130ms a 66ms).
- **Memoria**: El consumo de RAM bajó un 14% al no tener miles de objetos `Node` en memoria.
- **Sensación**: De "tropezones" y lag, a 60 FPS clavados.

Pero lo más importante es lo intangible. La sensación. Al arrastrar el dedo por el tablero, la respuesta es instantánea. No hay ni un microsegundo de duda. El juego se siente *sólido*, profesional. Se siente nativo de verdad.

### Los Retos Futuros: El Miedo a los Emojis

Esto fue solo el comienzo. Ahora tengo el plan (TASK-2026-022) para migrar **Minesweeper**. Y ahí, tengo miedo.
Minesweeper usa emojis (💣, 🚩, 💥).
Dibujar emojis en un Canvas no es tan trivial como dibujar texto. Los emojis son bitmaps complejos, no vectores simples. ¿Se pixelarán al escalar? ¿El `TextMeasurer` medirá bien el ancho de una bandera roja vs una negra? ¿Android renderizará el emoji de color o la versión monocromática de la fuente del sistema?

Y luego está **Dominosa** (TASK-2026-021). Dominosa requiere un gesto de arrastre (drag-and-drop) para conectar dos números. En la versión anterior, cada celda escuchaba su propio drag. Era fácil.
Ahora, el Canvas global tiene que escuchar el drag, calcular por qué celdas pasa el dedo en tiempo real (mientras el usuario mueve el dedo a 100km/h), dibujar una línea de feedback visual *mientras* ocurre el movimiento, y actualizar el estado solo al soltar.

Es mucha matemática. Es mucha gestión de estado manual. Es reinvertar la rueda de los eventos de UI.
Pero después de ver la fluidez de Hitori en Canvas, no hay vuelta atrás. Una vez que pruebas los 60 FPS estables en un gama media, el `LazyVerticalGrid` te parece un juguete para prototipar.

## Conclusión: El Yin y el Yang del Desarrollo

Esta semana ha sido un recordatorio brutal de la dualidad de nuestra profesión.

A veces, la respuesta correcta es **abstraer**. Subir a la montaña. Crear sistemas genéricos, limpios y reutilizables como mis nuevos Repositorios. Invertir tiempo en ahorrar tiempo futuro. Pensar en años. Es la belleza de la estructura.

Otras veces, la respuesta correcta es **concretar**. Bajar al barro. Romper la abstracción, ensuciarse las manos con coordenadas de píxeles, bucles `forEach` y mediciones de fuentes. Invertir tiempo en ahorrar milisegundos presentes. Pensar en frames. Es la belleza de la máquina.

Un buen ingeniero no es el que siempre abstrae, ni el que siempre optimiza. Es el que sabe **cuándo** hacer cada cosa. Es el que sabe cuándo usar un bisturí y cuándo usar un martillo.

Esta semana, eliminé 400 líneas de código duplicado para hacer feliz a mi "yo" del futuro. Y escribí 500 líneas de código de dibujo manual para hacer feliz a mi usuario del presente.

Creo que es un buen balance kármico.

Ahora, si me disculpáis, tengo que ir a stackoverflow a investigar cómo diantres se dibuja un emoji de una bomba en un Canvas de Android sin que parezca una mancha de tinta negra. Se aceptan sugerencias y oraciones.

Nos vemos en la W03. Los rumores dicen que vamos a intentar implementar un sistema de **Undo/Redo** universal para los 10 juegos. Y considerando que acabo de cambiar cómo se renderizan y cómo se guardan todos... seguramente será *divertido*. O trágico. Probablemente ambas.

---
*Escrito escuchando la banda sonora de Tron: Legacy y soñando con sistemas de coordenadas cartesianas perfectos.*
