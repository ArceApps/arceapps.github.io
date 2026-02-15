---
title: "2026 W03: La Red de Seguridad (O cómo implementamos Deshacer en 10 juegos a la vez)"
description: "La historia técnica detallada detrás de la implementación del sistema Undo/Redo en PuzzleHub: patrones de diseño, problemas de concurrencia con corrutinas, gestión de memoria eficiente, serialización polimórfica y la búsqueda de la UX perfecta en Android."
pubDate: 2026-01-18
tags: ["devlog", "architecture", "android", "kotlin", "design-patterns", "testing", "clean-code", "concurrency"]
heroImage: "/images/devlog-default.svg"
---

Esta semana en el desarrollo de **PuzzleHub**, nos hemos enfrentado a una de esas características que, vistas desde fuera, parecen la cosa más trivial del mundo: "Solo pon un botón de deshacer, ¿no?". Esa frase, pronunciada a menudo por Product Managers optimistas (o por mi propio cerebro cansado a las 2 de la mañana), esconde un iceberg de complejidad arquitectónica descomunal. Especialmente cuando no estás haciendo un _To-Do List_, sino que tienes que mantener la estabilidad, la integridad de datos y el rendimiento fluido de **10 motores de juego diferentes** simultáneamente, cada uno con sus propias reglas, estructuras de datos y peculiaridades lógicas.

Hablamos, por supuesto, del sistema de **Deshacer y Rehacer (Undo/Redo)**. Y os adelanto el final: No, no fue tan fácil como poner un botón y llamar a una función mágica. Fue una semana entera de reescribir los cimientos de la aplicación, pelearse con condiciones de carrera invisibles que solo ocurrían una de cada mil veces, y replantear filosóficamente cómo modelamos el paso del tiempo en nuestra arquitectura de software.

## El Problema: El Miedo Existencial al Clic Final

Empecemos por el "por qué". Puede parecer una feature secundaria ("nice to have"), pero en el género de los puzles lógicos, es vital. Si has jugado alguna vez a juegos de lógica deductiva profunda como *Slitherlink*, *Dominosa* o *Fillomino* en una pantalla táctil, conocerás esa sensación específica de ansiedad. Yo la llamo **"El Miedo al Clic Final"**.

Estás en lo que los psicólogos llaman "La Zona" o "Estado de Flujo". Llevas 15 o 20 minutos de partida en un nivel Difícil. Todo el mundo exterior ha desaparecido. Tu cerebro ha construido un castillo de naipes lógico extremadamente complejo en tu memoria de trabajo: *"Si esta celda es un 3, la de al lado no puede ser un borde, lo que significa que el 2 de arriba tiene que salir obligatoriamente por la izquierda, y eso fuerza al 1 a cerrarse..."*.
Tienes el puzzle resuelto al 95%. Solo quedan los últimos trazos.
Y de repente... el autobús da un bache. O tu gato decide que es hora de saltar sobre el sofá. O simplemente, la pantalla táctil interpreta un toque de 10 milisegundos como un arrastre.

Colocas una línea donde no debía ir.
En juegos con reglas topológicas estrictas como *Slitherlink*, el sistema de validación interna detecta la contradicción inmediatamente. La celda parpadea en un rojo agresivo.
Tu estado de perfección se rompe.
O peor aún: no te das cuenta del error en ese momento. Sigues construyendo tu lógica sobre esa base errónea durante 5 o 10 minutos más. De repente, llegas a un callejón sin salida lógico. Una contradicción imposible. Revisas el tablero y te das cuenta de que el error fundamental ocurrió hace 50 movimientos y es imposible de rastrear. Todo tu trabajo reciente es basura.

Hasta la semana pasada, **PuzzleHub** era implacable con estos errores. Un error fatal a menudo significaba tener que reiniciar el nivel desde cero, borrando todo el progreso. Esta fricción no se puede clasificar como "dificultad desafiante" (como en *Dark Souls*); es simplemente **hostilidad de interfaz**.
En 2026, los usuarios tienen, justificadamente, expectativas muy altas. Esperan que el software sea indulgente (*Forgiving UI*). Esperan una red de seguridad que les permita experimentar. Quieren poder decir: *"¿Qué pasa si pongo un 5 aquí? Voy a probar esta hipótesis"*, y si la respuesta resulta ser *"El caos absoluto"*, quieren poder pulsar un botón y volver al pasado seguro, como si nada hubiera ocurrido.

Nuestro objetivo para esta semana era claro: Tejer esa red de seguridad para **todos** nuestros juegos, desde la simplicidad binaria de *Hitori* hasta la complejidad aritmética de *Kakuro*, y hacerlo sin tener que reescribir la lógica central de cada uno de ellos desde cero.

## La Arquitectura: En busca del Patrón de Diseño Perfecto

Cuando te enfrentas al problema de implementar "Undo", la solución ingenua es tentadora. Si tienes un solo juego sencillo (digamos, un clon de *Sudoku*), puedes implementarlo guardando copias completas del tablero cada vez que el usuario hace algo.
Es lo que se conoce como el patrón **Memento** en su versión más bruta:
*   El usuario pone un número. -> Guardas una copia de todo el array `Board[9][9]` en una lista.
*   El usuario pone otro. -> Guardas otra copia.
*   El usuario pulsa Deshacer. -> Lees la posición `n-1` de la lista y sobrescribes el tablero actual.
Es código que puedes escribir en 10 minutos.

Pero PuzzleHub no es "un juego". Es una suite profesional. Y nuestros estados de juego son objetos complejos y pesados.
Imagina un tablero de **Kakuro** en modo Experto, de 15x15 celdas.
Cada objeto `KakuroCell` no es un simple entero. Contiene:
1.  Su Valor actual (Int).
2.  Su Estado de Bloqueo (si es una pista inicial inmutable).
3.  Su color de fondo (para indicar errores o selección).
4.  Una `List<Int>` de "Candidatos" o notas que el usuario ha escrito en las esquinas.
5.  Referencias a los objetos `Sum` padres (horizontal y vertical).

Multiplica eso por 225 celdas. Ahora imagina que el usuario, en una partida rápida, hace 200 movimientos.
Si usáramos snapshots completos, estaríamos creando 200 copias profundas (Deep Copies) de todo este grafo de objetos. En una partida larga, estaríamos generando megabytes de basura en la memoria Heap por segundo. Esto obligaría al **Garbage Collector (GC)** de Android a trabajar horas extra, pausando la ejecución de la app para limpiar memoria ("Stop-the-world events").
El resultado visible para el usuario serían esos micro-tirones (jank) que ocurren al hacer scroll o animaciones. Arruinaríamos la experiencia fluida de 120fps por la que tanto hemos luchado.

Descartamos Memento rápidamente. Necesitábamos algo mucho más quirúrgico y eficiente.
La respuesta, como suele ser habitual en sistemas transaccionales complejos, estaba en el clásico libro de *Design Patterns* de la Gang of Four: El **Patrón Command**.

### Tratar las Acciones como Objetos Reificados

La idea fundamental que desbloqueó toda la implementación fue un cambio de mentalidad: Dejar de pensar en las acciones del usuario como "llamadas a funciones" (`viewModel.setCellValue(5)`) y empezar a pensar en ellas como **Objetos de Datos Reificados** (`val cmd = SetValueCommand(5)`).

"Reificar" es una palabra elegante que usamos los ingenieros para decir "convertir un concepto abstracto en una cosa concreta". Convertimos el verbo "poner valor" en el sustantivo "Comando de Poner Valor".
Este objeto es un ciudadano de primera clase en nuestro código. Lo puedes guardar en una variable, lo puedes serializar a disco, lo puedes inspeccionar y lo puedes encolar.

Definimos nuestro contrato sagrado en Kotlin:

```kotlin
// domain/command/GameCommand.kt
interface GameCommand<T> {
    /**
     * Ejecuta la lógica de la acción y devuelve el nuevo estado resultante.
     * Esta función debe ser pura y determinista siempre que sea posible.
     */
    fun execute(currentState: T): T
    
    /**
     * La magia: Contiene la lógica inversa exacta.
     * Sabe cómo restaurar el universo al momento justo antes de la ejecución.
     */
    fun undo(currentState: T): T
    
    /**
     * Una descripción legible por humanos de lo que hizo este comando.
     * Útil para logs de depuración y para una futura UI de historial.
     * Ej: "Colocaste un 5 en la celda A3".
     */
    fun getDescription(): String 
}
```

Este cambio es profundo.
El historial del juego ya no es una pesada lista de estados duplicados (`List<GameState>`), sino una lista ligerísima de *intenciones* (`List<GameCommand>`).
Guardar un objeto `KakuroCellValueCommand(row=3, col=4, value=5, oldValue=0)` ocupa apenas unos pocos bytes en memoria. Podríamos guardar miles de estos sin que el recolector de basura de Android apenas pestañee. Es una solución infinitamente escalable.

### El Gestor del Tiempo: GameHistoryManager

Con los comandos definidos, necesitábamos un componente que actuara como el "Director de Orquesta" del tiempo.
Implementamos el `GameHistoryManager`, una clase genérica que gestiona las dos pilas temporales:
1.  **Undo Stack (Pila de Deshacer):** El pasado. Todo lo que has hecho hasta ahora.
2.  **Redo Stack (Pila de Rehacer):** El futuro alternativo. Las acciones que deshiciste pero que podrías querer recuperar.

Aquí es donde la teoría académica de la ingeniería de software choca violentamente con la realidad sucia del desarrollo móvil moderno. Nos encontramos con dos problemas graves.

#### 1. Concurrencia y el Peligro Silencioso de las Corrutinas
PuzzleHub es una aplicación multihilo intensiva.
*   La Interfaz de Usuario (UI) corre en el hilo `Main`.
*   La base de datos (Room) guarda partidas en el despachador `IO`.
*   Los cálculos pesados de validación corren en `Default`.

Esto crea el escenario perfecto para una **Condición de Carrera (Race Condition)**.
Imaginemos la siguiente secuencia de eventos fatídica:
1.  El usuario hace un movimiento rápido. Se lanza una corrutina en el hilo de Cálculo para procesarlo.
2.  Milisegundos después, se arrepiente y pulsa "Deshacer". Se lanza una corrutina desde la UI.
3.  Justo en ese instante, el sistema de auto-guardado periódico decide que es hora de persistir el estado en disco en el hilo IO.

Si no tenemos cuidado, podríamos tener tres hilos intentando leer y escribir en la lista `undoStack` simultáneamente. El resultado sería, en el mejor de los casos, un crash de la aplicación (`ConcurrentModificationException`). En el peor de los casos, corromperíamos los datos silenciosamente, haciendo que el estado visual del juego y el estado lógico interno diverjan, creando bugs imposibles de reproducir.

Para solucionar esto, tuvimos que envolver todo el gestor en un `Mutex` (la versión de corrutinas del clásico `Semaphore` o bloqueo).

```kotlin
class GameHistoryManager<T> {
    private val mutex = Mutex()
    private val undoStack = ArrayDeque<GameCommand<T>>()
    
    suspend fun execute(command: GameCommand<T>, state: T): T {
        // El semáforo echa el cerrojo. 
        // Cualquier otra corrutina que intente entrar aquí tendrá que esperar
        // pacientemente en la puerta hasta que terminemos.
        mutex.withLock {
            redoStack.clear() // Al cambiar el pasado, borramos el futuro alternativo
            
            // Limitamos la historia a 50 pasos para no consumir memoria infinita
            // si el usuario juega durante horas.
            if (undoStack.size >= MAX_HISTORY) {
                undoStack.removeFirst()
            }
            undoStack.addLast(command)
            
            return command.execute(state)
        }
    }
}
```

Gracias a este bloque `mutex.withLock`, garantizamos que las operaciones sobre el historial son atómicas. El tiempo en PuzzleHub ahora es *thread-safe*.

#### 2. La Persistencia Polimórfica (El problema de guardar interfaces)
Un requisito clave era que el historial sobreviviera al ciclo de vida de la aplicación.
Si vas en el metro jugando, cierras la app para contestar un mensaje, y la vuelves a abrir, esperas poder deshacer tu último movimiento. No vale con tener el historial en memoria RAM volátil.

El problema es que nuestra lista `undoStack` contiene objetos que implementan la interfaz `GameCommand`. Las bases de datos SQL (como Room) y el formato JSON no entienden de interfaces o polimorfismo por defecto. Necesitan saber exactamente qué clase concreta están guardando.
¿Cómo guardas una lista mixta de `KakuroCellValueCommand`, `HitoriToggleShadeCommand` y `SlitherlinkEdgeCommand` en un solo campo de texto?

Tuvimos que implementar un sistema de **Serialización Polimórfica** utilizando la librería `kotlinx.serialization`.
Fue un trabajo de fontanería bastante tedioso. Tuvimos que registrar cada una de las subclases de comandos en un módulo de serialización, asignándoles un "discriminador" (un string único como `"kakuro_make_cell_black"`).
De esta forma, al guardar el JSON, la librería escribe: `{"type": "kakuro_make_cell_black", "row": 1, "col": 2...}`.
Y al leerlo, sabe instanciar la clase correcta.
El resultado es mágico: la persistencia es totalmente transparente. Puedes matar el proceso de la app, y al volver, tu pila de "Deshacer" sigue ahí intacta.

## Integración UI: La Batalla Civil por los Píxeles

Con el motor listo, llegó el momento de diseñar la interfaz. ¿Dónde ponemos los botones de Undo y Redo?
Esto desató un debate intenso en el equipo de diseño (que, siendo un equipo indie pequeño, soy básicamente yo discutiendo conmigo mismo frente a un espejo).

*   **La Facción FAB (Floating Action Button):** Argumentaba que los botones debían estar flotando en la parte inferior de la pantalla, cerca del pulgar del usuario, para facilitar el acceso rápido.
*   **La Facción Minimalista (Yo):** Argumentaba que el área del tablero es sagrada. En juegos densos como *Minesweeper* o *Nonogram* de 20x20 celdas, cada píxel cuenta. Cubrir una esquina del tablero con un botón flotante es el peor pecado capital en el diseño de puzzles: ocultas información y provocas clics accidentales frustrantes.

Al final, ganó la lógica y el minimalismo. Decidimos integrar los controles en la `GameTopBar`, la barra superior.
Es el estándar de facto en todas las herramientas de productividad del mundo (piensa en Microsoft Word, Google Docs, o cualquier editor de imagen). Los usuarios ya tienen ese "modelo mental": si quiero volver atrás, miro arriba a la derecha.

Además, implementamos una reactividad real para mejorar la UX:
*   Si no puedes deshacer (porque estás al inicio), el botón **no se deshabilita del todo**. Un botón grisáceo e inactivo a veces parece roto. En su lugar, simplemente bajamos su opacidad (`alpha`) al 30%. Sigue estando ahí, dando estructura visual, pero grita menos.
*   Si el juego está **Pausado**, bloqueamos explícitamente el Undo. Durante el testing descubrimos un bug gracioso: podías pausar el juego (que oculta el tablero con una cortinilla para evitar trampas) y seguir pulsando Deshacer "a ciegas", rompiendo tu partida sin saberlo. Ahora, el botón sabe si el juego está visible o no.

## War Stories: Cuando la Teoría Falla (El Caso Kakuro)

Implementar el sistema en juegos sencillos como *Hitori* fue un paseo.
En *Hitori*, una celda es blanca o negra. Fácil.
Comando: `ToggleCell(old=Blanco, new=Negro)`. Undo: `Cell=Blanco`. Listo en 10 minutos.

Pero entonces llegamos a **Kakuro**. Y Kakuro nos dio una lección de humildad.
En Kakuro, las celdas tienen un valor numérico grande (la respuesta final). Pero también tienen "Notas" o "Candidatos": esos numeritos pequeños que escribes en las esquinas para recordarte a ti mismo *"aquí puede ir un 1 o un 2"*.

Teníamos una regla de UX programada: *"Cuando el usuario escribe un número grande (toma una decisión final), el juego debe borrar automáticamente todas las notas pequeñas de esa celda, para limpiar la interfaz"*. Tiene sentido, ¿verdad?
Implementamos el comando de poner valor con esa lógica.
Pero entonces probamos a hacer Undo.

1.  El usuario tiene las notas "1, 2, 4" escritas en la celda A1.
2.  El usuario decide que es un "5" y lo escribe. El juego, servicialmente, borra las notas.
3.  El usuario se da cuenta de que el 5 es un error y pulsa **Deshacer**.
4.  El número 5 desaparece... **¡pero las notas "1, 2, 4" no vuelven!**

El usuario se quedaba mirando una celda vacía con cara de tonto. Había perdido su tren de pensamiento. El sistema de Undo había destruido información.
Esto es inaceptable. Un "Deshacer" debe ser una máquina del tiempo perfecta.

Tuvimos que refactorizar el comando `KakuroCellValueCommand` para que fuera una instantánea forense completa.
Ahora, el comando no solo guarda `valor=5`. Guarda una estructura mucho más rica:
*   `oldValue = 0`
*   `newValue = 5`
*   `deletedNotes = [1, 2, 4]` (¡Esta fue la clave!)
*   `addedNotes = []`

Ahora, cuando el método `undo()` se ejecuta, no solo borra el 5. Lee la lista de `deletedNotes` y restaura explícitamente esos pequeños numeritos en las esquinas.
Esos pequeños detalles de fidelidad son la diferencia entre una app "funcional" y una aplicación "profesional" que realmente respeta el tiempo y el esfuerzo cognitivo del usuario.

## Testing: Cómo dormir tranquilo por las noches

Tocar el núcleo de 10 juegos a la vez da miedo. Mucho miedo.
Un error en la clase `GameHistoryManager` podría romper la funcionalidad de guardar partidas, corromper datos de usuarios o causar cierres inesperados en toda la suite.
Para no romper el entorno de producción, decidimos que no bastaba con probar el Undo/Redo con tests unitarios aislados. Teníamos que asegurarnos de que la aplicación "como un todo" siguiera funcionando.

Dedicamos todo el jueves a escribir una nueva suite de **Tests Instrumentados E2E (End-to-End)** (`TASK-2026-028`).
Creamos un "robot" de pruebas que simula ser un usuario real:
1.  Instala la app limpia en un emulador.
2.  Juega el tutorial de bienvenida.
3.  Entra en una partida de Slitherlink.
4.  Realiza exactamente 3 movimientos específicos.
5.  Pulsa el botón de Undo 2 veces.
6.  Toma una captura de pantalla y analiza los píxeles para verificar que el tablero está exactamente en el estado que esperamos.

Este robot corre ahora automáticamente en nuestro pipeline de Integración Continua (GitHub Actions) cada vez que subimos código. Si alguien (probablemente yo) rompe el sistema de Undo en el futuro, las alarmas sonarán en rojo brillante antes de que esa versión llegue a la Play Store.

## Conclusión

Esta semana ha sido una de las más productivas e intensas en la historia de **PuzzleHub**.
El sistema Undo/Redo no es solo una "feature" más en la lista. Cambia fundamentalmente la psicología del jugador.
Hemos observado en nuestras propias sesiones de prueba que, con la red de seguridad del Undo, jugamos de forma diferente: más rápido, más valiente. Nos atrevemos a probar hipótesis arriesgadas en *Slitherlink* o *Hashi*, sabiendo que si nos equivocamos, el botón de retroceso nos atrapará.

La semana que viene llevaremos esto al límite. Nos enfrentaremos a los "Jefes Finales": los juegos de **topología compleja** como *Slitherlink* y *Dominosa*, donde deshacer un movimiento no es solo cambiar un número, sino que implica recalcular grafos de conectividad enteros en tiempo real para verificar si el puzzle está roto o resuelto.

¡Gracias por leer y feliz codificación!
