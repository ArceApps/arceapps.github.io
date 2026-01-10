---
title: "2025 W44: El Noveno Pasajero"
description: "Cuando creías que el catálogo estaba cerrado, Dominosa llega para desafiar nuestra arquitectura. Una historia sobre feature creep y diseño modular."
pubDate: "2025-11-02"
tags: ["devlog", "architecture", "dominosa", "planning", "philosophy"]
heroImage: "/images/devlog-w44-dominosa-genesis.svg"
---

Hay un momento en todo proyecto de software donde el equipo se mira a los ojos y dice: "Ya está. No más *features*". Es el momento de congelar, de pulir, de estabilizar. En *PuzzleSuite*, pensábamos que habíamos llegado a ese punto a finales de Octubre. Teníamos ocho juegos sólidos: *KenKen* para los matemáticos, *Hashi* para los arquitectos, *Slitherlink* para los topólogos. La suite se sentía completa.

Pero entonces, como siempre pasa, apareció una idea. O más bien, un viejo recuerdo en forma de fichas de dominó.

La Semana 44 (del 27 de Octubre al 2 de Noviembre) fue testigo de cómo rompimos nuestra propia promesa de "no más juegos" para dar la bienvenida al noveno pasajero de nuestra colección: **Dominosa**. Y lo que empezó como un "vamos a ver si es posible", se convirtió en una prueba de fuego para la arquitectura modular que habíamos estado construyendo durante todo el año.

## ¿Qué es Dominosa? (Y por qué nos obsesionó)

Para los no iniciados, Dominosa es un puzzle lógico inventado por O.S. Adler en 1874. Tienes una cuadrícula rectangular llena de números. Tu misión es emparejar esos números adyacentes para formar un set completo de fichas de dominó (0-0, 0-1, 0-2... hasta el doble par máximo). La trampa es que cada par de números aparece solo una vez en todo el tablero.

Desde el punto de vista del jugador, es un desafío de deducción delicioso. Pero desde el punto de vista del desarrollador, *Dominosa* presentaba un reto único que no teníamos en otros juegos: la **unicidad global de las piezas**.

En *Sudoku* o *KenKen*, las restricciones son locales (fila, columna, caja). En *Dominosa*, la restricción es el inventario global. Si usas el par `[3|4]` en la esquina superior izquierda, ese par deja de existir para el resto del universo del tablero. Esto cambia radicalmente cómo validamos el estado del juego.

### El Dilema del Feature Creep

Añadir un juego nuevo en esta etapa del desarrollo es peligroso. Se llama *Feature Creep* (el alcance que se arrastra y crece), y es la causa número uno de proyectos que nunca se lanzan.

Nos sentamos el lunes 27 de Octubre con una pizarra en blanco. La discusión no fue técnica al principio, sino filosófica:

> *"¿Aporta Dominosa algo que los otros 8 juegos no tengan?"*

La respuesta fue sí. *Connect the dots* (como Hashi) ya lo teníamos. *Region filling* (como Shikaku) también. *Loop making* (Slitherlink/Hitori), chequeado. Pero *Pair matching* (emparejamiento) con restricción de inventario no existía en *PuzzleSuite*. Mecánicamente, llenaba un hueco que no sabíamos que teníamos.

Decidimos arriesgarnos. Pero con una condición: **Tenía que implementarse sin tocar el núcleo de la aplicación.** Si teníamos que modificar la `MainActivity` o la base de datos global de usuarios para meter Dominosa, el proyecto se cancelaba. Era la prueba definitiva de nuestro diseño Clean Architecture.

## Ingeniería Reversa de un Clásico

El diseño de la solución empezó el martes. No podíamos simplemente "pintar números". Necesitábamos un modelo de datos robusto.

Analizamos la estructura de un puzzle de Dominosa estándar y nos dimos cuenta de que es esencialmente un grafo de adyacencia donde los nodos son las celdas y las aristas son las posibles conexiones de dominó.

```kotlin
data class DominosaTile(
    val value1: Int,
    val value2: Int
) {
    // La identidad de una ficha es independiente del orden
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DominosaTile) return false
        return (value1 == other.value1 && value2 == other.value2) ||
               (value1 == other.value2 && value2 == other.value1)
    }
}
```

Este pequeño fragmento de código (simplificado) fue nuestra primera victoria. Definir la identidad de una ficha (`[1|2]` es igual a `[2|1]`) simplificaría enormemente toda la lógica de validación posterior.

### El Problema de la Generación

Donde otros juegos generan el puzzle y luego verifican si es resoluble, Dominosa requiere lo inverso. Primero generas un set de dominó válido colocado aleatoriamente en el tablero, y luego presentas solo los números, ocultando los bordes.

Nuestro algoritmo de generación inicial (diseñado el miércoles en papel) se veía así:
1.  Crear una lista de todas las fichas posibles para un tamaño dado (ej: Doble-3 tiene 10 fichas).
2.  Colocar fichas aleatoriamente en una cuadrícula vacía.
3.  Si llegamos a un callejón sin salida (huecos donde no cabe ninguna ficha restante), hacer *backtracking*.

Parecía sencillo, hasta que nos topamos con la ambigüedad. Un tablero generado aleatoriamente podría tener **múltiples soluciones**. En Dominosa, al igual que en Sudoku, un puzzle bien diseñado debe tener **una única solución lógica**.

Esto significaba que necesitábamos no solo un *Generador*, sino un *Solver* capaz de detectar ambigüedades. Si el Solver encuentra dos formas de colocar las fichas para los mismos números, el puzzle se descarta.

## La Arquitectura "Plug-and-Play"

Aquí es donde brilló el trabajo de los meses anteriores. Para integrar Dominosa, solo tuvimos que extender las clases base que ya usábamos para los otros juegos.

1.  **DominosaGameScreen** hereda de nuestro sistema de renderizado en Canvas.
2.  **DominosaViewModel** implementa la interfaz `IGameViewModel`.
3.  **DominosaRepository** se conecta al módulo de `Room` existente.

Fue casi mágico ver cómo, al crear las clases vacías el jueves, la aplicación ya reconocía el nuevo juego, lo añadía al menú principal y preparaba las rutas de navegación. No hubo que tocar ni una línea de código del `AppNavigation` central ni del `HomeScreen`. El sistema de inyección de dependencias (Hilt) encontró los nuevos módulos y los integró silenciosamente.

Esto validó meses de insistir en desacoplar componentes. Si hubiéramos intentado esto en Junio, habríamos roto la app entera. En Noviembre, fue como insertar un cartucho nuevo en una consola.

## UX: El Desafío de la Interacción

El viernes lo dedicamos a prototipar la interacción. ¿Cómo se juega a esto en una pantalla táctil?
En papel, dibujas una línea entre dos números. En digital, probamos varias ideas:
*   **Tap-Tap**: Tocar un número, luego tocar el vecino. (Lento).
*   **Drag**: Arrastrar el dedo entre dos números. (Intuitivo, pero propenso a errores en pantallas pequeñas).
*   **Long Press**: Mantener para ver opciones. (Oculto, mala descubribilidad).

Nos decantamos por el **Drag** (arrastre), pero con una "zona de atracción" generosa. Si tu dedo termina cerca de un vecino válido, el sistema "imanta" la conexión. También añadimos una característica visual crucial: cuando formas un par (ej: `[3|4]`), la lista de fichas disponibles en la parte inferior de la pantalla actualiza el estado de esa ficha específica.

Creamos un pequeño componente visual, `InventoryView`, que muestra todas las fichas posibles.
*   **Gris**: Ficha no colocada.
*   **Color**: Ficha colocada en el tablero.
*   **Rojo/Tachado**: Error (ficha duplicada colocada en el tablero).

Este feedback inmediato transformó el juego de "adivinar" a "deducir".

## Mirando hacia la Semana 45

Terminamos la semana 44 con el "esqueleto" de Dominosa funcionando. El generador produce tableros (a veces ambiguos, todavía), el renderizado funciona y la interacción es prometedora.

Pero falta lo más difícil: pulir. El juego es feo. Los números son Times New Roman por defecto. No hay animaciones de victoria. Y el solver todavía se traba con tableros grandes.

La próxima semana (Semana 45) será un sprint de implementación pura. Queremos llevar Dominosa de "prototipo funcional" a "ciudadano de primera clase" antes del día 9. Y después de eso... la gran limpieza. Porque al añadir Dominosa, hemos notado que nuestros otros 8 hijos están un poco desordenados.

Pero esa será otra historia. Por ahora, nos quedamos con la satisfacción de saber que nuestra arquitectura ha sobrevivido a un *Feature Creep* de última hora. Y eso, en este oficio, es lo más parecido a una victoria que existe.
