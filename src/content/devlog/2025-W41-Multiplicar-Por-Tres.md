---
title: "2025 W41: Multiplicar por Tres"
description: "Cómo pasamos de tener un juego a tener tres en una semana, gracias a la magia de la herencia y los genéricos en Kotlin."
pubDate: 2025-10-12
tags: ["devlog", "kotlin", "generics", "refactoring", "rapid-development"]
heroImage: "/images/blog-placeholder-2.jpg"
---

Dicen que si haces algo una vez, es una casualidad. Si lo haces dos veces, es una coincidencia. Si lo haces tres veces, es un patrón.
En la Semana 41 (del 6 al 12 de Octubre), convertimos nuestro prototipo de *Shikaku* en una fábrica de juegos.

El objetivo era ambicioso: añadir **Hitori** y **Fillomino** antes del domingo.
Si hubiéramos copiado y pegado el código de Shikaku, habríamos terminado el martes. Pero habríamos sembrado la semilla de nuestra propia destrucción. Mantener tres bases de código idénticas es el infierno.

En su lugar, dedicamos los primeros tres días a refactorizar. Creamos el concepto de `BaseGameState`.

## La Abstracción de la Cuadrícula

Hitori, Shikaku, Sudoku... todos comparten un ADN común: son juegos de cuadrícula (`Grid`).
Creamos una clase genérica `Grid<T>` que maneja la lógica espacial aburrida:
*   ¿Está la coordenada (x,y) dentro del tablero?
*   Dame los vecinos de esta celda (arriba, abajo, izquierda, derecha).
*   Iterar sobre todas las celdas.

Parece trivial, pero centralizar esto significa que si optimizamos la forma de guardar la cuadrícula en memoria (pasando de `List<List<T>>` a un `Array` plano para mejor caché), todos los juegos se benefician gratis.

## El Desafío de Hitori

Implementar **Hitori** fue diferente a Shikaku. En Shikaku dibujas rectángulos. En Hitori, sombreas celdas para eliminar números duplicados.
La lógica de validación de Hitori es fascinante porque incluye un componente de *topología*: "El área blanca debe ser continua". No pueden quedar islas aisladas.

Para validar esto, tuvimos que implementar un algoritmo de **Flood Fill** (relleno por difusión).
1.  Elige una celda blanca arbitraria.
2.  Expándete a todos los vecinos blancos recursivamente.
3.  Cuenta cuántas celdas has visitado.
4.  Si el número de visitadas es igual al total de celdas blancas, el área es continua.

Este algoritmo se ejecuta en tiempo real cada vez que el usuario toca una celda. Gracias a Kotlin y a la JVM optimizada de Android, tarda menos de 2 milisegundos en un tablero de 10x10. Instantáneo.

## La Trampa de la Herencia Visual

En el lado de la UI, caímos en una trampa clásica.
Intentamos crear una `BaseGameScreen` que lo hiciera todo: dibujar el tablero, el temporizador, el botón de pausa.
Funcionó para Shikaku y Hitori. Pero cuando llegó **Fillomino**, la abstracción se rompió.
Fillomino necesita dibujar bordes internos complejos entre las poliominós (formas irregulares). Nuestra `BaseGameScreen` asumía celdas cuadradas simples.

Aprendimos una lección valiosa: **Composición sobre Herencia**.
En lugar de una clase padre gigante (`BaseGameScreen`), dividimos la UI en componentes pequeños y reutilizables:
*   `GameTimer`: Solo pinta el reloj.
*   `GridRenderer`: Solo pinta las líneas.
*   `CellHighlighter`: Solo pinta la selección.

Cada juego compone estos elementos a su gusto. Hitori usa el `CellHighlighter` para sombrear negro/gris. Shikaku no lo usa.
Esta flexibilidad nos permitió implementar Fillomino el sábado por la tarde en tiempo récord.

## Tres Juegos, Un Problema

Al terminar la semana, tenemos 3 juegos funcionando. La app empieza a parecer una suite real.
Pero tener 3 juegos ha revelado un nuevo problema: **La Navegación**.
Nuestra `Home Screen` es una lista estática fea. Y pasar datos entre la pantalla de menú y el juego (como: "¿Qué dificultad eligió el usuario?") se está volviendo complicado. Estamos pasando demasiados argumentos en la URL de navegación de Compose (`game/{id}/{difficulty}/{size}/{seed}...`).

Necesitamos un sistema de gestión de estado más robusto. Pero eso será problema del "Yo" de la semana que viene.
Por ahora, celebremos. 3 juegos. 0 crashes. Y un código base que (todavía) huele a limpio.
