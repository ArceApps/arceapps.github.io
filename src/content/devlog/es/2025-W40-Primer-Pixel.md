---
title: "2025 W40: El Primer Píxel"
description: "El miedo al folio en blanco, la decisión crítica entre Canvas y Compose, y por qué elegimos una arquitectura que nos frenó durante tres días para acelerarnos el resto del año."
pubDate: 2025-10-05
tags: ["devlog", "architecture", "canvas", "clean-code", "jetpack-compose"]
heroImage: "/images/devlog/2025-w40-cover.png"
---

Todo proyecto grande comienza con un `File > New Project`. Es un momento de optimismo puro, pero también de terror paralizante. El terror al "folio en blanco".

La Semana 40 (del 1 al 5 de Octubre de 2025) marca el nacimiento oficial de **PuzzleHub**.

La idea en el papel es sencilla pero ambiciosa: crear la colección definitiva de puzzles lógicos para Android. No queremos ser otro clon de Sudoku lleno de anuncios intrusivos y estéticas dudosas. Queremos ser la "Biblia" de los puzzles. Una interfaz limpia, sin distracciones, una experiencia "premium" gratuita y, sobre todo, una profundidad técnica que respete la inteligencia del jugador.

Pero antes de que naciese el primer píxel en pantalla, tuvimos que tomar decisiones que definirán los próximos años de desarrollo. Decisiones que, si salen mal, nos condenarán a reescribir todo en Navidad.

## La Tiranía de la Arquitectura

Podríamos haber empezado tirando código en la `MainActivity`. Un par de `Buttons`, un `Canvas` rápido y listo. Habríamos tenido un prototipo funcional de *Shikaku* el martes por la tarde.
Pero *PuzzleHub* no va a tener un juego. Va a tener diez. Quizás veinte.

Si no separamos las preocupaciones ahora, en Noviembre estaremos ahogados en un plato de espagueti de código inmanejable. Imaginad tener que corregir un bug en el temporizador y tener que editar 15 archivos diferentes. Eso es la muerte del proyecto.

Decidimos adoptar **Clean Architecture** (la variante recomendada por Google, pero aplicada de forma estricta).
Cada juego será un módulo lógico (o al menos un paquete totalmente aislado) con sus propias capas impermeables:
1.  **Domain (Dominio)**: Reglas puras. ¿Es válido este movimiento? Aquí no existe Android. No hay Contexto. No hay UI. Solo Kotlin puro.
2.  **Data (Datos)**: Persistencia. ¿Cómo guardamos la partida? Room, DataStore, JSON.
3.  **Presentation (Presentación)**: UI. Jetpack Compose. ViewModels.

Esta decisión tiene un coste inmediato: **Boilerplate** (código repetitivo).
Para hacer un simple "Hola Mundo" en este sistema, necesitas crear al menos 5 archivos: `GameEntity`, `GameDao`, `GameRepository`, `GameUseCase`, `GameViewModel`.

Durante los primeros tres días (lunes, martes y miércoles), la sensación fue de estar caminando en melaza. Escribíamos cientos de líneas de código de infraestructura que no hacían *nada* visible en pantalla.

> *"¿Estamos sobre-ingenierizando esto? ¿Es necesario un UseCase solo para guardar la puntuación?"*

Es la pregunta que nos hicimos el miércoles por la noche, mirando pantallas llenas de interfaces vacías. Pero entonces, el jueves, implementamos la lógica del primer juego: **Shikaku**.

### Shikaku: El Conejillo de Indias

Elegimos Shikaku (dividir una cuadrícula en rectángulos que contengan un solo número) porque sus reglas son geométricas pero simples.
Gracias a la arquitectura separada, pudimos escribir las pruebas unitarias (`ShikakuLogicTest`) sin siquiera tener una `Activity`.
Pudimos verificar que el algoritmo de validación de rectángulos funcionaba en la consola, ejecutándose en nanisegundos.

Cuando finalmente conectamos la capa de **Presentation** (UI) el viernes, fue una experiencia "plug-and-play". La UI no tenía lógica. Solo pintaba lo que el `ViewModel` le decía. Si el modelo decía "error", la UI pintaba rojo. La separación funcionó. Y de repente, la melaza se convirtió en una autopista.

## La Gran Cisma: Canvas vs. Componentes

La segunda gran decisión de la semana fue sobre el motor de renderizado.
Jetpack Compose es maravilloso. Te permite construir UIs componiendo cajitas (`Box`, `Row`, `Column`).
La tentación de usar esto para el tablero era fuerte.
*   "Cada celda es un `Box` con un borde".
*   "Cada número es un `Text` dentro del `Box`".

Para un tablero de 5x5, funciona de maravilla.
Pero, ¿y para un tablero de 20x20? Eso son 400 celdas.

Hicimos una prueba de concepto ("Stress Test"). Renderizar 400 celdas usando composables individuales destrozó el rendimiento. El *frame rate* bajó a 22fps al hacer scroll o zoom. La sobrecarga de crear tantos objetos View/Node, medir sus tamaños y dibujarlos individualmente es demasiada para un móvil de gama media.

La solución fue radical: **Canvas**.
Dibujamos todo el tablero en un solo `Canvas` gigante. Es como volver a programar videojuegos en los años 90. Nosotros controlamos cada línea, cada círculo, cada pixel de texto.

*   **Ventaja**: Rendimiento infinito. 60fps (o 120fps) estables incluso en tableros de 50x50. Solo hay "una vista" que redibujar.
*   **Desventaja**: Perdemos la accesibilidad y los eventos de clic nativos. Un `Canvas` es una imagen plana. No sabe lo que es un "botón".

Tuvimos que escribir nuestro propio sistema de detección de gestos (`detectTapGestures`). Tuvimos que hacer matemáticas para traducir un toque en la pantalla (x=453, y=890) a una celda lógica (Fila 4, Columna 8).

```kotlin
// Matemáticas de 1º de ESO al rescate
val cellWidth = size.width / cols
val col = (tapOffset.x / cellWidth).toInt()
val row = (tapOffset.y / cellWidth).toInt()
```

Matemáticas simples, pero poderosas. Ahora tenemos un motor gráfico que vuela.

## El Primer Commit Real

Cerramos la semana con un esqueleto funcional.
Tenemos una `MainActivity` que navega a un menú vacío.
Tenemos una base de datos `AppDatabase` configurada con Hilt inyectando dependencias como si no costara.
Y tenemos un prototipo de *Shikaku* que, aunque feo (usamos colores neón de debug que harían llorar a un diseñador), se siente sólido bajo el dedo. Responde al instante.

No parece mucho para una semana entera de trabajo de 30 horas. Un solo juego feo.
Pero los cimientos de un rascacielos nunca son bonitos; son profundos.
La semana que viene, intentaremos construir el segundo piso sobre estos cimientos. Y si la teoría de la Clean Architecture es cierta, el segundo piso debería construirse en la mitad de tiempo.

Veremos si la teoría sobrevive a la realidad.
