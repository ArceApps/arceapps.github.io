---
title: "2025 W42: Geometría Prohibida"
description: "Esta semana nos enfrentamos a los juegos que no encajan en una cuadrícula perfecta: Slitherlink y Galaxies. Vectoriales, curvas y detección de toques sub-pixel."
pubDate: 2025-10-19
tags: ["devlog", "canvas", "geometry", "touch-handling", "slitherlink"]
heroImage: "/images/blog-placeholder-3.jpg"
---

Hasta ahora, nuestros juegos (Hitori, Shikaku) vivían felices dentro de celdas cuadradas. Click en la celda (2,3) -> Pinta la celda (2,3). Fácil.
Pero la Semana 42 (del 13 al 19 de Octubre) trajo a los rebeldes: **Slitherlink** y **Galaxies**.

Estos juegos no tratan sobre las celdas. Tratan sobre lo que hay *entre* ellas.
En *Slitherlink*, interactúas con las **aristas** (los bordes entre puntos).
En *Galaxies*, interactúas con **paredes** arbitrarias que cortan el espacio.

Nuestro sistema de detección de toques `(x / width)` se rompió inmediatamente.

## El Problema del Toque Fantasma

Imagina intentar tocar una línea de 1 pixel de grosor con un dedo de 1.5 cm de ancho. Es imposible.
Para Slitherlink, tuvimos que implementar un sistema de **"Hit Testing" con zonas de influencia**.
No comprobamos si tocaste la línea. Comprobamos a qué línea está más cerca tu dedo.

```kotlin
fun getNearestEdge(touchX: Float, touchY: Float): Edge {
    // Dividir el espacio en rombos invisibles alrededor de cada arista
    val relX = touchX % gridSize
    val relY = touchY % gridSize
    
    return if (dist(relX, relY, centerTop) < threshold) Edge.Top
           else if (dist(relX, relY, centerLeft) < threshold) Edge.Left
           // ...
}
```

Pasamos dos días ajustando los umbrales. Si la zona es muy pequeña, fallas el toque. Si es muy grande, activas la arista equivocada. Es UX invisible: si lo haces bien, nadie lo nota. Si lo haces mal, el juego es "tosco".

## Galaxies y la Simetría Rotacional

**Galaxies** fue el jefe final de la semana.
En este juego, debes dividir el tablero en regiones simétricas rotacionalmente (180 grados) alrededor de centros dados.
Esto requiere matemáticas vectoriales que no había usado desde la universidad.

Para validar una región, no basta con contar celdas. Tienes que verificar que para cada celda `(x, y)` en la región, su "espejo" `(cx + (cx-x), cy + (cy-y))` también esté en la región Y que el camino entre ellas no cruce ninguna pared.
Esto último es lo difícil. "¿Cruzar una pared?"

Implementamos un algoritmo que traza rayos virtuales.
Fue el primer momento en el proyecto donde sentimos que el rendimiento podría sufrir. Validar la simetría de 100 celdas en cada frame es costoso.
Optimización: **Caché de Validación**. Solo re-calculamos la validez de una región cuando sus paredes cambian. Si solo estás moviendo el cursor, reutilizamos el resultado anterior. De 15ms por frame bajamos a 0.5ms.

## El Generador de Puzzles: El Nuevo Cuello de Botella

Con la lógica de visualización resuelta, nos topamos con otro muro: **Generar estos puzzles es lento**.
Generar un Hitori es rápido (borra números hasta que funcione).
Pero generar un Slitherlink válido (un único bucle cerrado que satisfaga todos los números) es un problema NP-completo (o casi).
Nuestro generador tardaba 15 segundos en crear un puzzle 10x10. Inaceptable en móvil.

Decidimos mover la generación a un `Worker` en segundo plano. Pero eso no arregla la espera.
Así que hicimos un truco: **Pre-generación**.
Cuando instalas la app, viene con 10 puzzles de cada tipo pre-calculados. Mientras juegas el primero, la app genera silenciosamente el siguiente en segundo plano.
Para el usuario, la carga es instantánea.
Es como los restaurantes de comida rápida: la hamburguesa no se hace cuando la pides, se hace 5 minutos antes.

## Conclusión

Hemos salido de la cuadrícula. Ahora nuestro motor soporta geometría arbitraria, toques difusos y validación geométrica compleja.
La arquitectura de "Clean Code" sigue aguantando, aunque los `GameView` se están volviendo más grandes de lo que nos gustaría con tanta lógica de dibujo.
Quizás la semana que viene toque dividir esos archivos gigantes.
