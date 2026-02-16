---
title: "2026 W04: El Árbitro Silencioso (y por qué borrar botones es la mejor mejora de UX)"
description: "Una inmersión técnica y filosófica en la eliminación de la burocracia de UI. Cómo pasamos de pedirle al usuario que rellene formularios a crear un sistema de Auto-Verificación reactiva, y cómo optimizamos la detección de ciclos en grafos O(N) para que funcione a 60fps."
pubDate: 2026-01-25
tags: ["devlog", "ux", "android", "algorithms", "performance", "graph-theory", "kotlin"]
heroImage: "/images/devlog-w47-ux-design.svg"
---

La semana pasada, hay que reconocerlo, nos vinimos arriba.
Habíamos implementado con éxito el sistema de "Deshacer y Rehacer" en los juegos más sencillos de **PuzzleHub**. *Hitori*, *Sudoku*, *Kakuro*... todos habían caído ante nuestro poderoso patrón Command y nuestro Gestor de Historial Thread-Safe.
El viernes por la tarde cerré el portátil con esa arrogancia peligrosa, casi patológica, que precede siempre a los bugs más humillantes de nuestra carrera.
*"Esto está chupado"*, pensé, con una sonrisa de satisfacción que ahora, vista retrospectivamente, me dan ganas de abofetear. *"La arquitectura es sólida. La lógica es perfecta. La semana que viene solo será cuestión de Copy-Paste para el resto de juegos. Estaré libre el jueves."*

Qué equivocado estaba.
Qué joven, ingenuo y estúpidamente optimista era ese "yo" de hace apenas siete días.

Esta semana nos hemos lanzado de cabeza contra los que llamamos internamente los **"Gigantes Topológicos"**: *Slitherlink*, *Fillomino*, *Dominosa* y *Galaxies*.
Estos no son juegos donde la interacción sea simplemente cambiar un número en una celda aislada (localidad estática). Son juegos donde cada acción del usuario altera la estructura fundamental de un grafo global (topología dinámica).
Y mientras peleábamos en las trincheras con aristas rebeldes, ciclos infinitos y regiones conexas que se negaban a cerrarse, nos dimos cuenta de que nuestro precioso "botón de deshacer" era solo la mitad de la ecuación.
La otra mitad del problema era mucho más sutil, casi invisible, pero fundamental para la experiencia de juego: la **burocracia de ganar**.

## Parte 1: Slitherlink y el Trilema del Borde

Empecemos nuestra crónica de guerra con *Slitherlink*.
Si no lo conoces, es un puzzle diabólico de origen japonés (como casi todo lo bueno en este género) donde el objetivo es conectar puntos en una rejilla para formar un único bucle cerrado, sin cruces ni bifurcaciones, rodeando números que indican cuántas líneas deben tocarlos.

En *Hitori* o *Sudoku*, el "átomo de interacción" es una celda. Una caja.
En *Slitherlink*, el átomo es un **Borde** (Edge). La línea invisible entre dos puntos.
Y aquí es donde nuestra arquitectura empezó a crujir.
En nuestra implementación para pantallas táctiles, decidimos que un borde no podía ser simplemente binario (LÍNEA o VACÍO). Necesitábamos un tercer estado para ayudar al usuario a descartar caminos imposibles.
Así nació el **Trilema del Borde**:
1.  **LÍNEA (Line)**: "Aquí pasa el bucle. Estoy seguro". (Se dibuja un trazo sólido de color).
2.  **X (Cross)**: "Por aquí seguro que NO pasa nada. Es un muro invisible". (Se dibuja una pequeña cruz gris).
3.  **VACÍO (Empty)**: "Ni idea, Paco. Aún no lo he pensado". (Transparente).

### El Bug del "Toggle" Ingenuo

Mi primer intento de escribir el comando `SlitherlinkToggleEdgeCommand` fue... digamos, optimista.
Asumí que podía tratar la interacción como un simple interruptor cíclico.
*"El usuario toca un borde. Si estaba Vacío, pasa a Línea. Si era Línea, pasa a X. Si era X, vuelve a Vacío"*.
Fácil, ¿no? Código de primero de carrera.

```kotlin
// Versión 1 (La que rompió todo y me hizo perder una tarde)
class ToggleEdgeCommand(val r: Int, val c: Int) : GameCommand {
    override fun execute(board: Board) {
        val current = board.getEdge(r, c)
        board.setEdge(r, c, current.nextState()) 
    }
    
    override fun undo(board: Board) {
        // "Simplemente retrocede uno en el ciclo, ¿qué podría salir mal?"
        val current = board.getEdge(r, c)
        board.setEdge(r, c, current.previousState()) 
    }
}
```

Esto funcionaba de maravilla en las pruebas unitarias controladas ("Test: Hago A, Hago B, Deshago B, Deshago A. Todo verde").
Pero en el mundo real, el caos impera.
¿Qué pasaba si el usuario, preso del pánico o la impaciencia, tocaba tres veces muy rápido el mismo borde?
¿Qué pasaba si, entre el comando original y el deshacer, el sistema de "pistas automáticas" había modificado el estado del tablero?

El comando `undo` de mi primera versión era **Relativo** ("retrocede uno").
Al deshacer en un contexto "sucio" (modificado por otros actores), el comando simplemente rotaba el estado al valor incorrecto.
El usuario veía cómo su línea se convertía en una X en lugar de desaparecer.
El estado del juego se corrompía irremediablemente.

Aprendizaje a base de golpes: **Los comandos de Undo deben ser Idempotentes y Absolutos**.
Un comando no debe decir "resta 1". Debe decir "El valor ERA 5, así que pon un 5, me da igual lo que haya ahora".
Tuvimos que reescribir toda la lógica para capturar "Snapshots" quirúrgicos del estado.

```kotlin
// Versión 2 (La buena, la robusta)
class SlitherlinkToggleEdgeCommand(
    val edgeIndex: Int,
    val oldMark: EdgeMark, // Snapshot inmutable del pasado: EdgeMark.CROSS
    val newMark: EdgeMark  // Snapshot inmutable del futuro: EdgeMark.EMPTY
) : GameCommand<SlitherlinkGameState> {

    override fun undo(state: SlitherlinkGameState): SlitherlinkGameState {
        // Restauración autoritaria. 
        // No preguntamos qué hay. Imponemos la verdad del pasado.
        return state.copy(
            edges = state.edges.toMutableMap().apply {
                this[edgeIndex] = oldMark
            }
        )
    }
}
```

Este pequeño cambio filosófico —apostar por la verdad absoluta frente a la relativa— nos salvó la vida más tarde en *Galaxies* y *Hashi*, donde las interacciones son aún más caóticas.

## Parte 2: La Muerte del Botón "Comprobar"

A mitad de semana, mientras mi compañero peleaba con la renderización de arcos en *Hashi*, yo estaba probando un nivel difícil de *Fillomino*.
Me llevó 12 minutos de sudor y deducción.
Finalmente, coloqué la última pieza. El tablero estaba perfecto. Cada poliominó tenía el tamaño correcto. La armonía matemática era total.

Y el juego... no hizo nada.
Silencio digital absoluto.

Me quedé mirando la pantalla del móvil como un idiota durante cinco segundos.
*"Ah, claro"*, pensé, sintiéndome estúpido. *"Tengo que darle al botón"*.
Levanté el dedo hacia la barra superior, busqué el icono de un "Tick" (Check), y lo pulsé.
Apareció el diálogo de "¡Felicidades!".
Pero ya era tarde. El momento había pasado.

En ese instante, sentí una fricción cognitiva tan fuerte que casi me provocó una reacción alérgica.
Estamos en 2026. Mi teléfono tiene un procesador neuronal (**NPU**) capaz de generar obras de arte por Inteligencia Artificial en segundos o traducir idiomas en tiempo real.
¿Por qué diablos tengo que *pedirle por favor* a mi teléfono que compruebe si he sumado bien unos números?

Es indignante.
Es como marcar un gol de chilena en la final del Mundial, mirar al árbitro, y que este te pida rellenar el **Formulario B-12: Solicitud de Reconocimiento de Gol** por triplicado, adjuntar una fotocopia del DNI, y esperar 15 días hábiles para que suba al marcador.
Es anticlimático. Es burocracia. Destruye la dopamina.

### El Reto: El Árbitro Silencioso

Esa tarde tomamos una decisión radical: **Eliminar el botón "Check"**.
Fue un placer sádico borrar esas líneas de XML y código Jetpack Compose. Ver desaparecer ese icono fue liberador.

En su lugar, planteamos el concepto del **Árbitro Silencioso**.
Queríamos un sistema omnisciente que observara cada movimiento del jugador y validara el estado del juego en tiempo real, de forma invisible.
El flujo ideal que buscábamos era:
1.  Usuario pone la última pieza.
2.  < 50ms de procesamiento invisible.
3.  ¡Boom! Confeti. "Has ganado". Sin clics extra. Sin preguntas.

### El Problema de Rendimiento: O(N) vs La Batería

Esto suena genial sobre el papel, pero técnicamente tiene un riesgo enorme: **El Rendimiento**.
Validar un Sudoku es computacionalmente barato (comprobar sumas de filas y columnas).
Pero validar un *Fillomino* o un *Slitherlink* es, en términos técnicos, "un dolor de muelas".

En *Slitherlink*, para saber si has ganado, el algoritmo debe hacer dos cosas:
1.  **Validación Local (Rápida):** Verificar que cada celda tiene el número correcto de aristas a su alrededor. Esto es O(1) o O(Cells). Barato.
2.  **Validación Global (Lenta):** Verificar que todas las líneas forman un **ÚNICO** bucle cerrado. No dos bucles separados. No un bucle con un "rabillo" suelto. Un único ciclo Hamiltoniano (o similar).

Para verificar la unicidad del bucle, tienes que recorrer el grafo entero (DFS o BFS).
La complejidad es **O(N)**, donde N es el número de aristas. En un tablero de 20x20, hay cientos de aristas.
Si ejecutamos este algoritmo pesado CADA VEZ que el usuario toca la pantalla (y los usuarios expertos tocan muy rápido, a veces 3 o 4 veces por segundo), el teléfono se calentaría como una tostadora en cuestión de minutos. Y peor aún, bloquearíamos el hilo principal, haciendo que la interfaz fuera a tirones (Jank).

### La Solución: Optimización en Capas (Fast-Fail)

Diseñamos una estrategia de validación en "Embudo" (`TASK-2026-045`) para filtrar el trabajo pesado:

**Fase 1: El Portero (Checks O(1))**
Antes de lanzar nada pesado, comprobamos lo obvio. Mantenemos contadores incrementales en memoria.
¿Hay "cabos sueltos" (vértices con grado impar)?
Mantenemos una variable `looseEndsCount` que se actualiza con cada movimiento (+1 o -1).
`if (looseEndsCount > 0) return NO_GANADO`.
Si hay un solo cabo suelto, es matemáticamente imposible que haya un bucle cerrado perfecto. Así que abortamos la validación inmediatamente. Coste: 0 nanosegundos.

**Fase 2: La Validación Asíncrona con Debounce**
Si pasa el filtro del portero, lanzamos la validación pesada (recorrer el grafo).
PERO nunca en el hilo principal (`Main`).
Y nunca inmediatamente.
Usamos las bondades de **Kotlin Coroutines** para hacerlo "en diferido".

```kotlin
// ViewModel Logic: El arte de esperar
var validationJob: Job? = null

fun onBoardChanged() {
    // 1. Cancelamos cualquier validación anterior que estuviera corriendo.
    // Si el usuario teclea rápido, "matamos" el trabajo anterior a medias.
    validationJob?.cancel()
    
    validationJob = viewModelScope.launch(Dispatchers.Default) {
        // 2. DEBOUNCE: Esperamos 50ms en silencio.
        // Si el usuario toca otra vez antes de 50ms, este trabajo morirá.
        delay(50) 
        
        // 3. Ejecutamos el algoritmo pesado en un hilo secundario
        val result = validateGameUseCase(currentState)
        
        if (result is ValidationResult.Success) {
            // 4. Solo molestamos al hilo principal si hay buenas noticias
            withContext(Dispatchers.Main) {
                onGameWon() // ¡Confeti!
            }
        }
    }
}
```

El **Debounce** (`delay(50)`) fue la clave maestra.
Si el usuario arrastra el dedo para marcar una línea de 10 celdas, el ViewModel recibe 10 eventos en 200ms.
Sin debounce, lanzaríamos 10 validaciones de grafos paralelas, saturando la CPU.
Con debounce, las 9 primeras se cancelan antes de nacer. Solo validamos el estado final, cuando el usuario levanta el dedo.
La UI se mantiene a 120fps rocosos como una piedra, y la batería nos lo agradece.

## Bonus Track: La Masacre de las Views en Kakuro

Ya que estábamos con las manos llenas de grasa arquitectónica, aprovechamos para arreglar una vergüenza técnica que arrastrábamos en *Kakuro*.
Hacía semanas que notábamos que *Kakuro* iba lento en dispositivos de gama media. El scroll se sentía pesado.

Investigando con el Profiler de Android Studio, encontramos el culpable: **Exceso de Composables**.
Para un tablero de 15x15, estábamos usando el componente estándar `LazyVerticalGrid`.
Cada celda de Kakuro era un `Box` complejo que contenía:
-   Un `Text` para el valor central.
-   Un `Canvas` para pintar la línea diagonal.
-   Dos `Text` pequeños para las pistas (suma horizontal y vertical).
-   Un `FlowRow` con hasta 9 `Text` diminutos para las notas de usuario.

Multiplica 15x15 = 225 celdas.
Por ~10 elementos gráficos por celda.
Teníamos más de **2.500 nodos de UI** que el sistema tenía que medir, colocar y dibujar en cada frame. Es una locura. Android es potente, pero no mágico.

Decidimos tirar `LazyVerticalGrid` a la basura.
Reescribimos el componente `KakuroBoard` desde cero usando un único **Canvas** gigante (`TASK-2026-019`).
Ahora, en lugar de 2.500 nodos, tenemos **1 nodo**.
Un solo Canvas.
Nosotros calculamos manualmente las coordenadas X/Y de cada línea, cada número y cada nota, y le decimos a la GPU: *"Dibuja texto en (340, 520)"*.

El resultado fue brutal:
-   Tiempo de carga inicial del nivel: **-80%**.
-   Consumo de memoria RAM: **-60%**.
-   Suavidad del scroll y zoom: Mantequilla pura.

Sí, dibujar píxeles a mano es más difícil de mantener que usar componentes de alto nivel. Tienes que gestionar tú los clicks, las animaciones y el layout. Pero para el componente central del juego, donde el usuario pasa el 100% de su tiempo, vale la pena cada hora de ingeniería invertida.

## Conclusión

Esta semana va de eliminar fricción.
Hemos eliminado la **fricción de interacción** con un Undo robusto que entiende de topología.
Hemos eliminado la **fricción burocrática** con un Árbitro Silencioso que valida tu victoria al instante.
Y hemos eliminado la **fricción de rendimiento** reescribiendo el motor de renderizado de Kakuro.

PuzzleHub es ahora una aplicación más silenciosa. Más respetuosa. No te grita cuando te equivocas. No te pide que rellenes impresos para ganar. Simplemente está ahí, observando, validando y asegurándose de que la experiencia sea fluida.

La semana que viene, dejamos de pulir lo existente y volvemos a la fase de construcción creativa. Dos nuevos juegos entran en la arena. Uno de ellos implica matemáticas complejas, así que id preparando las calculadoras (o vuestros cerebros).

---
*Fin del reporte semanal.*
