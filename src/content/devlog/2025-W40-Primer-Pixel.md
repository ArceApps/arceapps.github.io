---
title: "2025 W40: El Primer Pixel"
description: "Cómo nace una suite de puzzles. La decisión de usar Clean Architecture desde el día 0 y por qué Kotlin Multiplatform todavía no es para nosotros."
pubDate: 2025-10-05
tags: ["devlog", "genesis", "architecture", "android", "kotlin"]
heroImage: "/images/blog-placeholder-about.jpg"
---

Todo proyecto grande comienza con un `File > New Project`. Pero el miedo al "folio en blanco" es real.
La Semana 40 (del 1 al 5 de Octubre) marca el nacimiento oficial de **PuzzleSuite**.

La idea es sencilla pero ambiciosa: crear la colección definitiva de puzzles lógicos para Android. No queremos ser otro clon de Sudoku lleno de anuncios. Queremos ser la "Biblia" de los puzzles. Una interfaz limpia, sin distracciones, y con una profundidad técnica que respete la inteligencia del jugador.

Pero antes de pintar el primer pixel, tuvimos que tomar decisiones que definirán los próximos años de desarrollo.

## La Tiranía de la Arquitectura

Podríamos haber empezado tirando código en la `MainActivity`. Un par de `Buttons`, un `Canvas` y listo. Habríamos tenido un prototipo funcional el martes.
Pero *PuzzleSuite* no va a tener un juego. Va a tener diez. O veinte.
Si no separamos las preocupaciones ahora, en Noviembre estaremos ahogados en un plato de espagueti de código inmanejable.

Decidimos adoptar **Clean Architecture** (la variante recomendada por Google, pero estricta).
Cada juego será un módulo (o al menos un paquete aislado) con sus propias capas:
1.  **Domain**: Reglas puras. ¿Es válido este movimiento de ajedrez? Aquí no existe Android. Solo Kotlin puro.
2.  **Data**: Persistencia. ¿Cómo guardamos la partida? Room, DataStore, JSON.
3.  **Presentation**: UI. Jetpack Compose. ViewModels.

Esta decisión tiene un coste: **Boilerplate**.
Para hacer un simple "Hola Mundo" en este sistema, necesitas crear 5 archivos. `GameEntity`, `GameDao`, `GameRepository`, `GameUseCase`, `GameViewModel`.
Durante los primeros tres días, parecía que no avanzábamos. Escribíamos cientos de líneas de código de infraestructura que no hacían *nada* visible en pantalla.

> *"¿Estamos sobre-ingenierizando esto?"*

Es la pregunta que nos hicimos el miércoles. Pero entonces, implementamos el primer juego: **Shikaku**.

### Shikaku: El Conejillo de Indias

Elegimos Shikaku (dividir una cuadrícula en rectángulos) porque sus reglas son geométricas pero simples.
Gracias a la arquitectura separada, pudimos escribir las pruebas unitarias (`ShikakuLogicTest`) sin siquiera tener una pantalla.
Pudimos verificar que el algoritmo de validación de rectángulos funcionaba en la consola.

Cuando finalmente conectamos la capa de **Presentation** (UI) el viernes, fue "plug-and-play". La UI no tenía lógica. Solo pintaba lo que el `ViewModel` le decía. Si el modelo decía "error", la UI pintaba rojo. La separación funcionó.

## Canvas vs. Componentes

La segunda gran decisión de la semana fue sobre el renderizado.
¿Deberíamos usar botones y celdas de Compose (`Box`, `Row`, `Column`) para dibujar el tablero?
Para un 5x5, funciona. Pero, ¿y para un 20x20?

Hicimos una prueba de concepto. Renderizar 400 celdas usando composables individuales destrozó el rendimiento. El *frame rate* bajó a 20fps al hacer scroll.
La sobrecarga de crear tantos objetos View/Node es demasiada.

La solución: **Canvas**.
Dibujamos todo el tablero en un solo `Canvas` gigante. Es como volver a programar videojuegos en los 90. Nosotros controlamos cada línea, cada círculo, cada texto.
*   **Ventaja**: Rendimiento infinito. 60fps estables incluso en tableros de 50x50.
*   **Desventaja**: Perdemos la accesibilidad y los eventos de clic nativos. Tuvimos que escribir nuestro propio detector de gestos (`detectTapGestures`) para saber en qué celda tocó el usuario basándonos en coordenadas X/Y matemáticas.

```kotlin
val cellWidth = size.width / cols
val col = (tapOffset.x / cellWidth).toInt()
val row = (tapOffset.y / cellWidth).toInt()
```
Matemáticas simples, pero poderosas.

## El Primer Commit

Cerramos la semana con un esqueleto funcional. Tenemos una `MainActivity` que navega a un menú vacío. Tenemos una base de datos `AppDatabase` configurada con Hilt. Y tenemos un prototipo de Shikaku que, aunque feo (colores de debug neón), funciona suave como la seda.

No parece mucho para una semana de trabajo. Pero los cimientos de un rascacielos nunca son bonitos; son profundos.
La semana que viene, intentaremos construir el segundo piso.
