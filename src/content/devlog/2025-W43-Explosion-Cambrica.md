---
title: "2025 W43: La Explosión Cámbrica"
description: "Ocho juegos en un mes. La velocidad de desarrollo alcanza su pico máximo, pero las grietas en la base empiezan a ser visibles."
pubDate: 2025-10-26
tags: ["devlog", "scaling", "tech-debt", "minesweeper", "hashi"]
heroImage: "/images/blog-placeholder-4.jpg"
---

En biología, la "Explosión Cámbrica" fue un periodo donde la vida en la Tierra se diversificó a una velocidad sin precedentes. Aparecieron casi todos los planes corporales animales que conocemos hoy.
En *PuzzleSuite*, la Semana 43 (del 20 al 26 de Octubre) fue nuestra propia explosión biológica.

Entramos al lunes con 4 juegos (Shikaku, Hitori, Fillomino, Slitherlink).
Salimos el domingo con **8 juegos funcionales**.
Añadimos **Kenken** (Calcudoku), **Kakuro**, **Hashi** y el clásico **Minesweeper**.

¿Cómo es posible doblar el catálogo en 7 días?
La respuesta corta: **Copy-Paste Inteligente**.
La respuesta larga: Nuestra arquitectura modular finalmente dio sus frutos... pero estamos empezando a ver sus límites.

## Kenken y Kakuro: Primos Hermanos

Kenken y Kakuro son matemáticamente muy similares. Ambos requieren llenar celdas con números para sumar un objetivo.
Pudimos reutilizar el 90% del código de la lógica de "Teclado numérico" y "Validación de sumas".
Creamos un componente `NumberInputPad` que ambos comparten.
Aquí nos sentimos genios. La reutilización de código en su máxima expresión.

## Hashi: El Puente Demasiado Lejos

Pero luego llegó **Hashi**.
Hashi requiere conectar islas. No usa números (como input). No usa áreas. Usa líneas.
Intentamos forzar a Hashi a usar la estructura de `Grid` que creamos en la Semana 41.
Fue un error.
Hashi no es una cuadrícula densa. Es un grafo disperso. Forzarlo en una matriz 2D llena de `nulls` complicó el código innecesariamente.
Lo hicimos funcionar, pero el `HashiViewModel` está lleno de "hacks" para traducir entre coordenadas de pantalla y nodos del grafo.
*Nota mental: Reescribir el motor de Hashi en el futuro para que sea un grafo real.*

## Minesweeper: El Intruso

Y finalmente, **Minesweeper**. El padre de todos los puzzles de lógica de PC.
Minesweeper es diferente a todos los demás.
1.  No tiene "Victoria" estática. Puedes perder (Game Over). Los otros puzzles solo están "Incompletos" o "Completos". En Minesweeper, explotas.
2.  Requiere manejo de "Long Press" (bandera) vs "Tap" (cavar).
3.  Es el único juego que requiere un "Primer Clic Seguro" (generar el mapa *después* del primer toque para asegurar que no mueras al instante).

Implementar Minesweeper rompió nuestra abstracción de `BaseGameScreen`. Tuvimos que añadir banderas de `gameOver` y lógica de explosión que no tienen sentido en Sudoku.
Nuestro código base "limpio" empieza a tener `if (gameType == MINESWEEPER)` dispersos por ahí. Eso huele mal. Huele a deuda técnica.

## La Resaca del Éxito

Al cerrar la semana, miramos la app. Es impresionante. 8 juegos. Todos jugables. Generación infinita.
Desde fuera, parece un triunfo total.
Pero desde dentro, vemos las costuras.
*   Las pantallas de "Juego Completado" son ligeramente distintas en cada juego.
*   Los colores de "Selección" no son consistentes (verde en uno, azul en otro).
*   El rendimiento de Hashi en tableros grandes tironea un poco.

Hemos priorizado la **Cantidad** sobre la **Calidad** esta semana para alcanzar la meta de tener el catálogo base listo antes de Noviembre.
Ha valido la pena para validar que la app tiene potencial. Pero no podemos seguir a este ritmo.

Noviembre se acerca. Y con él, la promesa de un nuevo juego (Dominosa) y la inevitable necesidad de limpiar el desorden que hemos creado en esta fiesta de creación desenfrenada.
La "Explosión Cámbrica" ha terminado. Ahora toca la selección natural: solo el código más fuerte sobrevivirá al refactor que se avecina.
