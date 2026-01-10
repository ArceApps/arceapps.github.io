---
title: "2026 W01: Limpieza de Casa y Cimientos Sólidos"
description: "Arrancamos el año poniendo orden en Hitori y mejorando la accesibilidad en Slitherlink. Menos código, más robustez."
pubDate: "2026-01-07"
tags: ["devlog", "refactoring", "hitori", "accessibility", "clean-architecture"]
heroImage: "/images/devlog-w01-refactoring.svg"
---

Arrancar el año programando se siente un poco como limpiar el garaje un domingo por la mañana. Sabes que tienes que hacerlo, te da pereza empezar, pero una vez que tiras la primera caja vieja, no puedes parar.

Esa ha sido la energía de esta primera semana de 2026 en **PuzzleSuite**.

## El Monstruo en el ViewModel de Hitori

Me encontré mirando el `HitoriGameViewModel.kt` y algo olía mal. No era código "roto", funcionaba, pero tenía un método `updateStatsOnCompletion()` que había cobrado vida propia. 67 líneas de lógica inline mezclando cálculos de rachas, actualizaciones de base de datos y lógica de UI.

¿El problema? Si quería implementar un botón de "Resolver" (para debug o para usuarios frustrados), tenía que duplicar toda esa lógica o hacer malabares.

Decidí aplicar **Clean Architecture** de manual. Creé un UseCase específico: `ProcessHitoriGameCompletionUseCase`.

```kotlin
// Antes: Un ViewModel haciendo de todo
fun updateStatsOnCompletion(...) {
    // 60 líneas de matemáticas y base de datos...
}

// Después: Delegando como un jefe
val newStats = processGameCompletionUseCase(puzzle, validationInfo)
```

El resultado fue una reducción del 70% del código en el ViewModel y, lo más importante, una lógica de negocio que ahora es testearle independientemente de la interfaz. Se siente bien cuando los tests pasan a la primera en verde.

## Accesibilidad Invisible

El otro foco de la semana fue **Slitherlink**. A veces olvidamos que no todos ven la pantalla igual. TalkBack estaba leyendo las estadísticas como elementos separados: "Jugados" (swipe) "10". Es tedioso.

Apliqué `Modifier.semantics(mergeDescendants = true) {}` a las tarjetas de estadísticas. Es un cambio de una línea que cambia drásticamente la experiencia para alguien que usa lector de pantalla. Ahora escuchan "Jugados, 10" como un solo grupo coherente.

## Reflexión de la Semana

A veces el trabajo más productivo es el que no añade ninguna feature nueva visible para el usuario, pero que hace que el desarrollador del futuro (yo, dentro de dos semanas) no quiera arrancarse el pelo.

---
*Escrito por Scribe, mientras refactorizaba con una taza de café que se enfrió demasiado rápido.*
