---
title: "2025 W53: Cerrando el Año con Nivel Experto"
description: "Unificación de sistemas de dificultad en toda la suite y la llegada del modo Experto para despedir el 2025."
pubDate: 2026-01-04
tags: ["devlog", "refactoring", "ui-ux", "difficulty-systems", "2025-closing"]
heroImage: "/images/blog-placeholder-4.jpg"
---

Hay algo profundamente satisfactorio en cerrar el año con la casa limpia. En el desarrollo de software, "limpiar la casa" a menudo significa pagar deuda técnica, estandarizar componentes y asegurarse de que todos los sistemas hablen el mismo idioma. Esta última semana de 2025, entre las festividades y el brindis de fin de año, nos propusimos una misión: **Estandarización Absoluta**.

## El Caos de la Divergencia

Hasta hace unos días, nuestros juegos sufrían de una sutil pero molesta inconsistencia. Hitori tenía un selector de dificultad rudimentario; Galaxies usaba su propio sistema de `GalaxiesDifficulty` (que solo llegaba a 3 niveles); y Dominosa... bueno, Dominosa estaba bien, pero sabía que podía dar más de sí.

El problema no era que no funcionaran. El problema era que cada uno resolvía el mismo problema de forma diferente. Y si hay algo que nos gusta en ArceApps, es la elegancia de los patrones compartidos.

## La Gran Unificación

Decidimos que todos los juegos merecían el tratamiento "Premium". Migramos Hitori, Slitherlink y Galaxies para usar el mismo componente de UI que ya brillaba en Kakuro: el `PuzzleConfigurationSelector`.

Pero no fue solo un cambio estético. En el backend, esto implicó:

1.  **Eliminar Enums Propietarios**: Adiós `GalaxiesDifficulty`. Ahora todos usan el `Difficulty` genérico del dominio. Menos código, menos confusión.
2.  **Lógica de Generación Dinámica**: Ajustamos los algoritmos de generación para que respondan orgánicamente a 4 niveles de dificultad: **Fácil, Medio, Difícil y Experto**.

### Un Vistazo al Código

En **Slitherlink**, por ejemplo, la dificultad ahora controla directamente la densidad de las pistas. Más pistas significa más restricciones, lo que paradójicamente hace el puzzle más difícil de deducir porque hay más información que procesar simultáneamente.

```kotlin
// Antes: Lógica dispersa o inexistente
// Ahora: Control preciso sobre la densidad
val difficultyModifier = when (difficulty) {
    Difficulty.EASY -> -0.20    // 20% menos pistas (Más libertad)
    Difficulty.MEDIUM -> -0.08
    Difficulty.HARD -> 0.05
    Difficulty.EXPERT -> 0.15   // 15% más pistas (Pura lógica deductiva)
}
```

## Bienvenido, Modo Experto

La joya de esta actualización es la introducción del nivel **EXPERT** en Galaxies, Dominosa, Hitori y Slitherlink.

Para **Galaxies**, esto fue un desafío de diseño interesante. ¿Cómo hacer más difícil un juego de simetría? La respuesta no fue hacer tableros más grandes, sino *galaxias más pequeñas*. Fragmentamos el espacio en piezas diminutas e irregulares, obligando al jugador a buscar centros de simetría en lugares donde la intuición falla.

En **Dominosa**, el modo Experto reduce las pistas al mínimo absoluto (1 pista máxima) y activa un "doble shuffle" de las fichas, garantizando que la suerte no sea un factor.

## Un Final Colorido

Y como guinda del pastel para recibir el 2026, le dimos un lavado de cara a **Fillomino**. Implementamos un algoritmo de coloración de grafos (Greedy Coloring) para asegurar que regiones adyacentes nunca compartan el mismo color.

Pasamos de una paleta de 8 colores a 14, y de una asignación secuencial a una topológica. El resultado es un tablero que no solo es más bonito, sino mucho más legible.

## Brindis por el 2026

Cerramos la semana 53 con la satisfacción del deber cumplido. No hay cabos sueltos, ni sistemas a medio migrar. La base de código de PuzzleSuite entra al nuevo año más robusta, más consistente y preparada para lo que venga.

Feliz año nuevo. Nos vemos en el código.
