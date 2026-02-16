---
title: "2025 W41: Multiplicar por Tres"
description: "De un juego a tres en tiempo récord. Cómo la abstracción correcta y los Genéricos de Kotlin nos permitieron escalar sin copiar código."
pubDate: 2025-10-12
tags: ["devlog", "kotlin", "generics", "scaling", "refactoring"]
heroImage: "/images/devlog/2025-w41-cover.png"
---

Dicen que si haces algo una vez, es una casualidad. Si lo haces dos veces, es una coincidencia. Si lo haces tres veces, es un patrón.
En la Semana 41 (del 6 al 12 de Octubre), nos propusimos convertir nuestro prototipo solitario de *Shikaku* en una fábrica de juegos en serie.

El lunes por la mañana, miramos el código. Shikaku funcionaba bien.
Pero el objetivo semanal era agresivo: añadir **Hitori** y **Fillomino** antes del domingo.
Tres juegos en total.

La tentación del diablo (y de todo programador con prisa) apareció: *"Copia la carpeta de Shikaku. Pégala. Renómbrala a Hitori. Cambia las reglas. Listo."*
Si hubiéramos hecho eso, habríamos terminado el martes a mediodía. Pero habríamos sembrado la semilla de nuestra propia destrucción. Tendríamos tres copias del código de "Dibujar Tablero", tres copias del "Cronómetro", tres copias de la "Base de Datos".
Mantener eso es el infierno. Si quieres cambiar el color del fondo en el futuro, tienes que hacerlo tres veces.

En su lugar, respiramos hondo y dedicamos los primeros tres días a no crear juegos, sino a destruir código. Refactorización masiva.

## La Abstracción de la Cuadrícula Infinita

Hitori, Shikaku, Sudoku... mirándolos de cerca, todos comparten un ADN común: son juegos de cuadrícula (`Grid`).
No importa si pones números, colores o paredes. La topología es idéntica.

Creamos una clase genérica `Grid<T>` que maneja la lógica espacial "aburrida":
*   ¿Está la coordenada (x,y) dentro del tablero?
*   Dame los vecinos ortogonales de esta celda (arriba, abajo, izquierda, derecha).
*   Iterar sobre todas las celdas de forma segura.

```kotlin
class Grid<T>(val width: Int, val height: Int, init: (Int, Int) -> T) {
    private val cells = Array(width * height) { i -> init(i % width, i / width) }
    
    operator fun get(x: Int, y: Int): T = cells[y * width + x]
    // ...
}
```

Parece trivial, pero al centralizar esto, conseguimos una victoria silenciosa de rendimiento. Internamente, pasamos de usar una `List<List<T>>` (que es ineficiente en memoria) a un `Array` plano unidimensional. Gracias a la encapsulación, ninguno de los juegos tuvo que cambiar su lógica. Solo se volvieron más rápidos gratis.

## El Desafío de Hitori: Algoritmos de Inundación

Implementar **Hitori** fue muy diferente a Shikaku.
En Shikaku dibujas rectángulos.
En Hitori, tu misión es sombrear celdas para eliminar números duplicados, pero con una regla crítica: **El área blanca restante debe ser continua**. No puedes dejar "islas" aisladas.

La validación de esta regla no es trivial. Requiere analizar la conectividad del grafo entero.
Tuvimos que implementar un algoritmo clásico: **Flood Fill** (relleno por difusión o inundación).

1.  Elige una celda blanca arbitraria como "semilla".
2.  Expándete a todos los vecinos blancos recursivamente.
3.  Cuenta cuántas celdas has visitado.
4.  Si el número de celdas visitadas es igual al total de celdas blancas en el tablero, entonces están todas conectadas.

Este algoritmo debe ejecutarse en tiempo real. Cada vez que el usuario toca una celda para sombrearla.
Si tarda 100ms, el juego se sentirá "laggy".
Gracias a Kotlin y a la optimización de la JVM de Android (ART), logramos que se ejecute en menos de 2 milisegundos incluso en tableros grandes. La sensación es instantánea.

## La Trampa de la Herencia Visual

En el lado de la UI (User Interface), casi cometemos un error fatal.
Intentamos crear una `BaseGameScreen` que lo hiciera todo: dibujar el tablero, dibujar el temporizador, dibujar el botón de pausa.
Funcionó para Shikaku y Hitori. Ambos son rejillas cuadradas simples.

Pero cuando llegó **Fillomino** el viernes, la abstracción se rompió en mil pedazos.
Fillomino no dibuja cuadros. Dibuja formas irregulares ("poliominós") con bordes internos complejos que serpentean por la rejilla.
Nuestra `BaseGameScreen` no sabía cómo manejar eso.

Aprendimos (o recordamos) una lección valiosa de la ingeniería de software: **Composición sobre Herencia**.
En lugar de una clase padre gigante (`BaseGameScreen`) que impone su voluntad, dividimos la UI en componentes pequeños y sumisos:
*   `GameTimer`: Solo sabe pintar el reloj. No le importa el juego.
*   `GridRenderer`: Dibuja las líneas de la cuadrícula.
*   `CellHighlighter`: Se encarga de sombrear celdas seleccionadas.

Cada juego ahora *compone* estos elementos a su gusto.
*   Hitori usa `CellHighlighter` para pintar de negro las celdas eliminadas.
*   Shikaku ignora el `CellHighlighter` y usa su propio `RectangleRenderer`.

Esta flexibilidad fue clave. Nos permitió implementar Fillomino el sábado por la tarde, re-ensamblando piezas como si fuera Lego, en lugar de luchar contra una jerarquía de clases rígida.

## Tres Juegos, Un Nuevo Problema

Al terminar la semana, miramos el teléfono. Tenemos 3 iconos en el menú. La app empieza a parecer una suite real, no solo un experimento.
Pero tener 3 juegos ha revelado un nuevo problema que no previmos: **La Navegación**.

Nuestra `Home Screen` es una lista estática fea de botones hardcodeados. Y pasar datos entre la pantalla de menú y el juego (como: "¿Qué dificultad eligió el usuario?", "¿Qué semilla aleatoria usar?") se está volviendo complicado. Estamos pasando demasiados argumentos en la URL de navegación de Compose (`game/{id}/{difficulty}/{size}/{seed}/{isDaily}...`).

Necesitamos un sistema de gestión de estado más robusto para la navegación. Pero ese será un problema para el "Yo" de la semana que viene.
Por ahora, celebremos. 3 juegos. 0 crashes. Y un código base que (todavía) huele a limpio.
