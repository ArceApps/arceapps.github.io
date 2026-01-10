---
title: "2026 W02: Generics, Canvas y la Búsqueda de la Eficiencia"
description: "Cómo eliminamos cientos de líneas de código repetido con Repositorios Genéricos y por qué migramos Kakuro a Canvas puro."
pubDate: 2026-01-14
tags: ["devlog", "optimization", "android", "compose", "canvas", "generics"]
heroImage: "/images/blog-placeholder-2.jpg"
---

Esta semana ha sido una de contrastes: por un lado, abstracciones de alto nivel con Generics de Kotlin, y por otro, bajando al barro de los píxeles con Canvas.

## La Tiranía del Copy-Paste

Tengo 10 juegos en PuzzleSuite. Eso significa 10 `PuzzleRepository` y 10 `StatsRepository`. Cada vez que quería arreglar un bug en cómo guardamos el progreso, tenía que hacerlo en 20 archivos distintos. 

Me cansé.

El objetivo de la semana fue crear `BasePuzzleRepository<T>` y `BaseStatsRepository<T>`. Suena intimidante, pero Kotlin lo hace sorprendentemente elegante.

El mayor desafío fue lidiar con las particularidades. Minesweeper necesitaba IDs específicos al guardar, Dominosa guardaba tiles de solución, otros no. La tentación de meter todo en la base es fuerte, pero resistí. Mantuve la base limpia: solo CRUD puro. 

```kotlin
// La belleza de la herencia
class KakuroPuzzleRepositoryImpl @Inject constructor(...) : 
    BasePuzzleRepository<KakuroPuzzle>(...), KakuroPuzzleRepository
```

Eliminé unas 400 líneas de código duplicado. El compilador se quejó durante horas hasta que ajusté todos los tipos, pero ahora, añadir un nuevo juego será cuestión de minutos, no horas.

## Kakuro y el Canvas

Mientras tanto, en el frontend, **Kakuro** estaba sufriendo. Una grilla de 15x15 celdas usando `LazyVerticalGrid` y composables anidados estaba causando ~100 recomposiciones solo por cargar. En un Pixel 8 vuela, pero en dispositivos gama media se notaba el tirón.

La solución drástica: **Canvas**.

Dejé de componer "Celdas" y empecé a "dibujar" rectángulos y líneas.
El cambio mental es fuerte. Ya no tienes `clickable` en cada cajita. Tienes un `detectTapGestures` global que calcula matemáticas: `x / cellSize`.

Resultados del benchmark:
- **Recomposiciones de carga:** De ~105 a ~5.
- **Fluidez:** Mantequilla pura.

Lo más difícil fue reimplementar la lógica visual: dibujar las diagonales y los textos alineados manualmente. Pero el control que te da Canvas es adictivo.

## Lo que aprendí

No optimices prematuramente, pero cuando optimices, ve con todo. Pasar a Canvas fue costoso en tiempo de desarrollo (4 horas para una feature que "ya funcionaba"), pero la deuda técnica de rendimiento que pagamos valió cada minuto.

---
*Soñando con rectángulos y coroutines.*
