---
title: "Numberlink: el bug no era el algoritmo, era la calibración"
description: "Un crash de unicidad y 56 de 64 celdas convertidas en números: cómo rehice el generador de Numberlink desde el presupuesto de búsqueda."
pubDate: 2026-09-09
lastmod: 2026-10-21
author: "ArceApps"
keywords: ["PuzzleHub", "Numberlink", "generación procedural", "Kotlin", "Android"]
heroImage: "/images/devlog/puzzlehub-numberlink-generator-calibration.svg"
tags: ["Android", "Kotlin", "generación procedural", "algoritmos", "devlog"]
draft: false
reference_id: "puzzlehub-numberlink-generator-calibration"
---

Hay un tipo de bug que no se parece a ningún otro. No es una condición de carrera, no es una fuga de memoria, no es un `null` que se cuela por un `when` mal escrito. Es un bug que funciona exactamente como le han pedido. Corre, no lanza excepciones, cumple su contrato técnico. Y aun así, el resultado es basura.

El 2 de septiembre de 2026Abrí el issue #341 en `ArceApps/PuzzleHub` porque Numberlink me estaba dando dos símbolos muy distintos del mismo síntoma: un crash reproducible en una dificultad concreta y, en las dificultades fáciles, unos tableros que no se parecían en nada a un puzle lógico.

El crash era honesto y fácil de leer:

```
java.lang.IllegalStateException: Generator failed to verify a unique puzzle within its search budget
    at com.arceapps.puzzlesuite.features.numberlink.domain.logic.NumberlinkPuzzleGenerator.generate(NumberlinkPuzzleGenerator.kt:111)
```

El otro síntoma no era un crash. Era peor, porque no se arreglaba con un `try-catch`. En dificultad fácil, el tablero venía prácticamente lleno de números. La complaint que escribí en el issue era literal: *«ahora es solo unir números que sale uno al lado del otro»*.

Este artículo es la historia de cómo investigué ese problema, por qué la respuesta obvia («el algoritmo está mal, reescríbelo») era la respuesta equivocada, y qué hice con ella. Es también el registro de un trabajo que duró cinco días y que terminó en el commit `2e471a80`, aunque el recorrido real tuvo tres iteraciones y un plan de casi megabyte.

Antes de entrar, una nota de honestidad que merece su propio párrafo: **el repositorio fue renombrado.** El código, lasissues y parte de la documentación interna hablan de `PuzzleSuite` porque así se llamaba cuando se escribió. Hoy el repositorio canónico es `ArceApps/PuzzleHub`. Los enlaces de este artículo apuntan al nombre actual; las citas literales conservan el nombre original.

## El modelo del problema: por qué esta búsqueda es amarga

Antes de tocar una línea de código conviene escribir el problema en el papel, porque las decisiones que siguen dependen de un hecho concreto: **no existe forma barata de saber si un tablero de Numberlink tiene solución única.**

El variant que implementamos es el *strict*: la unión de todos los caminos debe cubrir exactamente las `W × H` celdas del tablero. Cada par de extremos idénticos se conecta con un camino ortogonal, los caminos no se cruzan ni comparten celda, y cada puzzle debe tener exactamente una solución. El contrato está escrito en el spec de la implementación inicial (`docs/specai/20260827-implementar-numberlink/`):

> «Todos los caminos juntos deben cubrir la totalidad de celdas del tablero (variante strict).»
> «Cada puzzle tiene solución única.»

Ese último punto es el que nos quita el sueño. Existe un resultado académico que lo demuestra de forma bastante directa: *Zig-Zag Numberlink is NP-Complete* (Adcock et al., 2014, [arXiv:1410.5845](https://arxiv.org/abs/1410.5845)). Si el problema es NP-completo, no puede existir un algoritmo polinomial que verifique la unicidad en el caso general. La consecuencia práctica que escribí en el documento de research es la que gobierna todo el diseño:

> «No existe algoritmo polinomial para verificación de unicidad en el caso general. La verificación debe usar heurísticas (A*, backtracking con poda) y aceptar un presupuesto acotado de búsqueda como prueba operacional de unicidad.»

Es decir: **el presupuesto de búsqueda no es un parche de rendimiento, es parte del modelo de corrección.** Si el solver agota el presupuesto, la respuesta honesta no es «no hay solución», es «no lo sé». Y durante meses, el código no distinctions entre las dos cosas. Ese es el germen del crash.

## Lo que el presupuesto estaba ocultando

El generador v1 (`NumberlinkPuzzleGenerator.kt`, tal y como estaba el 2 de septiembre, el día del reporte) trabajaba con esta tabla de rangos calibrados:

```kotlin
val CALIBRATED_PAIR_RANGES: Map<Int, Map<Difficulty, IntRange>> = mapOf(
    49 to mapOf(
        Difficulty.EXPERT to 16..20, Difficulty.HARD to 18..21,
        Difficulty.MEDIUM to 20..23, Difficulty.EASY to 22..24
    ),
    64 to mapOf(
        Difficulty.EXPERT to 20..24, Difficulty.HARD to 22..26,
        Difficulty.MEDIUM to 25..29, Difficulty.EASY to 28..31
    )
)
```

Fíjate en lo que dice esa tabla. En un tablero de 8×8 (64 celdas) en dificultad fácil, el generador elegía entre **28 y 31 pares**. Cada par son dos extremos. Eso significa entre 56 y 62 celdas ocupadas por números: el 87 % del tablero, según el propio PRD del rediseño:

> «Esto provoca que entre 56 y 62 de las 64 celdas del tablero sean extremos numéricos contiguos con segmentos de longitud 1–2, desvirtuando por completo la experiencia de juego lúdica e interactiva al convertir el puzzle en una mera unión de casillas adyacentes triviales sin deducción espacial.»

Ahí está el bug real. No era un problema de Connectivity ni de particionamiento. Era un problema de **aritmética**: le estaba pidiendo al espacio combinatorio 28 soluciones disjuntas dentro de 64 celdas, un objetivo que roza lo imposible por construcción. El solver no fallaba. El solver estaba intentando responder correctamente a una pregunta mal hecha, y cuando se agotaba su presupuesto, `error(...)`convertía ese «no lo sé» en un `IllegalStateException` que nadie capturaba en la capa de UI.

Por eso el crash no aparecía en todos los tamaños ni en todas las dificultades. En 5×5, donde el rango EASY era `8..11`, la aritmética era razonable y el presupuesto daba para resolverlo. En 8×8 Experto (`20..24` pares sobre celdas que además competían por cobertura strict) el espacio libre era tan pequeño que el solver no encontraba unicidad dentro de 500.000 nodos. La tabla de v1 tenía, en efecto, dos bugs que parecían uno: la calibración absurda y un presupuesto que no distinguía «imposible» de «no garantizado».

## La investigación: tres arquitecturas y un veredicto

Antes de reescribir nada escribí un documento de research de 38 KB (`docs/specai/20260903-numberlink-generator-redesign/20260904-numberlink-generator-research.md`) comparando tres estrategias. No lo hice por método, sino porque la intuición de «rehacer el algoritmo» ya había producido un crash y no quería repetir el ciclo confiando en el criterio de diseño.

**Arquitectura A — síntesis orgánica con poda de paréntesis** (estilo del generador `ste42`). Parte de una cuadrícula vacía y va creando esquinas y segmentos por Weighted Backward Generation, con reglas de Balance de Paréntesis, Estacas Laterales y Bloques Locked. Es determinista por semilla y muy rápido: el research recoge que `ste42` resuelve su suite de 270 puzzles en 0,14 s y genera de 40×10 al instante.

El veredicto, textual:

> «No genera garantía de unicidad. Requiere `NumberlinkSolver` como segunda fase (post-procesado).»

Ahí está la razón de fondo: **cualquier generador que nowns un solver no puede promising uniqueness.** Thomas Ahle, autor de la implementación de referencia más citada, lo dice sin rodeos en su propio README, y el research lo reproduce:

> «You can't use numberlink for checking if a puzzle is unique. Indeed numberlink will assume the puzzle has just one solution and only it such that the solution uses 100% of the paper and no link touches itself.»

Lo que sí mereció la pena foi la poda de paréntesis, que quedó adoptada como idea.

**Arquitectura B — verificación SAT incremental** (Sat4j o Z3). Formalmente la opción más limpia: CNF, solver, prueba de unicidad por fuerza bruta sobre las satisfacciones. Los contras documentados son tres y todos reales:

> «Sat4j añade ~600 KB al APK.»
> «Para nuestro presupuesto de 8 s en 10×15=150 celdas con ~12 colores, el CNF tendría ≈ 6.000 vars y 200.000 cláusulas: probablemente borderline.»
> «Curva de aprendizaje alta para el equipo.»

Se descartó. No porque fuera incorrecto, sino porque 600 KB para un juego de rompecabezas y un encoders que hay que mantener es un precio que no estamos dispuestos a pagar en una app de catálogo.

**Arquitectura C — carving hamiltoniano.** Esto es, literalmente, lo que ya teníamos. Y el veredicto sobre ella es la frase que reorganizó todo el trabajo:

> «Es la fuente del bug reportado: produce tableros “fáciles” con demasiados pares porque la partición del camino hamiltoniano genera naturalmente segmentos largos y bien definidos, pero no impone control fino sobre la distribución espacial de los extremos ni sobre la densidad de entrelazado.»

Fíjate en el matiz, porque es importante y se pierde fácil: el veredicto **no dice que el algoritmo hamiltoniano esté mal**. Dice que es «funcionalmente correcto para el subproblema cobertura completa» pero «ortogonal al problema dificultad calibrada». El diagnóstico final lo dice sin ambigüedad:

> «El bug del usuario no es un fallo del algoritmo: es una calibración mal escogida (`CALIBRATED_PAIR_RANGES`).»

Esa frase es el corazón del artículo. Todo lo que vino después se deriva de aceptarla.

## La fórmula que sustituyó a los números inventados

Si el problema es de calibración, la pregunta correcta es: ¿cuál es el número correcto de pares? La respuesta no la saqué de la intuición, sino de la literatura. El research recoge que los ratios de la industria coinciden en `k ≈ √(W·H)` como densidad óptima, y que Thomas Ahle propone una corrección por ratio de aspecto:

```text
K_target = round( α_d · √(W · H) · β_aspect )

α_d      = EASY: 0.50 · MEDIUM: 0.70 · HARD: 0.85 · EXPERT: 1.00
β_aspect = 1 + 0.15 · (1 − min(W,H) / max(W,H))
```

El término `β_aspect` corrige la asimetría: un tablero 7×10 no tiene la misma forma que un 8×12, así que el mismo número de pares no produce la misma experiencia. Aplicando la fórmula, el cambio en `NumberlinkDifficultyProfile` es surgical:

```kotlin
// v1 — 8×8
64 to mapOf(
    Difficulty.EASY to 28..31, Difficulty.MEDIUM to 25..29,
    Difficulty.HARD to 22..26, Difficulty.EXPERT to 20..24
)

// v2 — 8×8
64 to mapOf(
    Difficulty.EASY to 6..7, Difficulty.MEDIUM to 7..8,
    Difficulty.HARD to 8..9, Difficulty.EXPERT to 8..9
)
```

De 28–31 pares a 6–7. Un orden de magnitud. Y la dirección se invierte con sentido: en v1, más pares era «más fácil» (más celdas numéricas, menos deducción). En v2, más pares es «más difícil» (menos espacio libre por par, más entrelazado). La tabla de hoy, ya con los tamaños rectangulares que el issue #352 Parties añadir, conserva ese mismo criterio:

```kotlin
/** Approximately sqrt(area); adjacent difficulty bands intentionally overlap. */
```

Ese comentario es una decisión de diseño disfrazada de comentario: las bandas de dificultad se solapan a propósito, porque un puzzle no es una categoría discreta.

## Lo que sí hubo que reescribir: las podas que hacen que la calibración funcione

Cambiar la tabla no bastaba. Con 6–7 pares, el generador tiene mucho más espacio libre y el riesgo de ambigüedad se dispara. Cuatro mecanismos, verificados en el código real:

**1. Longitud mínima y distancia Manhattan.** En `isValidPartition` (commit `dc01b3e1`):

```kotlin
val minLen = if (isRelaxed) 2 else 3
for (segment in regions) {
    if (segment.size < minLen) return false
    if (!isRelaxed) {
        val start = segment.first()
        val end = segment.last()
        val manhattan = kotlin.math.abs(start.row - end.row) +
                        kotlin.math.abs(start.col - end.col)
        if (manhattan < 2) return false
    }
}
```

Dos celdas no son un camino, son un borde. Y dos extremos ortogonalmente adyacentes tampoco.

**2. Poda anti-ambigüedad de ciclos 2×2.** Un bloque 2×2 con dos transiciones paralelas intercambiables produce simetrías: la misma región se puede resolver de dos maneras equivalentes, y el solver las cuenta como soluciones distintas. `hasAmbiguous2x2` construye rejillas auxiliares de color y de índice de path y las compara:

```kotlin
val h0 = kotlin.math.abs(pathIndex[c00] - pathIndex[c01]) == 1
val h1 = kotlin.math.abs(pathIndex[c10] - pathIndex[c11]) == 1
if (h0 && h1) return true
```

**3. Poda de dead-ends en el solver.** Esta es la más interesante desde el punto de vista algorítmico, y el plan documenta el resultado con una cifra concreta: seguimiento `O(1)` de frentes activos (`isFront`) y verificación de grado mínimo en celdas libres (≥ 2) y sumideros (≥ 1), con una «reducción de hasta un 80 % en los nodos explorados por el solver». El código real (`NumberlinkSolver.kt`) lo confirma:

```kotlin
if (hasDeadEmptyCell()) return false
if (hasStrandedColor()) return false
```

`hasDeadEmptyCell` (línea 161) detecta celdas libres que ya no pueden recibir suficientes incidencias de camino; `hasStrandedColor` (línea 164) poda pares incompletos que no pueden alcanzar su extremo. Son podas de *viabilidad estructural*, no de corrección: eliminan ramas que el DFS iba a explorar para terminar en un callejón sin salida.

**4. Presupuesto con dos fases.** El `DefaultNumberlinkUniquenessSolver` separa una búsqueda especulativa de la confirmación:

```kotlin
const val DEFAULT_PROBE_MAX_NODES = 15_000
const val DEFAULT_CONFIRM_MAX_NODES = 60_000
```

El `probe` es barato y descarta la mayoría de candidatos; el `confirm` es el que certifica. La invariante declarada es explícita en `NumberlinkUniqueness.kt`:

> «A puzzle is considered unique and accepted if and only if both probe and confirmation phases found exactly 1 solution with COMPLETED stop reason.»

Fíjate en la parteaking de la que ya hablamos: `COMPLETED`. Si el solver se detiene por límite de nodos o por deadline, el resultado es «inconcluyente», no «no único». Esa distinción es la que convierte un bug en una característica del contrato.

## Reducir 10× el presupuesto: la decisión contraintuitiva

La parte que más me costó defender internamente fue bajar el presupuesto. El razonamiento era: si el generador falla por agotar el presupuesto, la solución obvia es darle más presupuesto. Hice lo contrario.

```kotlin
// v1
const val MAX_HAMILTONIAN_NODES = 500_000
const val PROBE_SEARCH_NODES = 40_000

// v2
const val MAX_HAMILTONIAN_NODES = 50_000   // era 500_000: 10× menos
const val PROBE_SEARCH_NODES = 15_000
const val DEFAULT_CONFIRM_SEARCH_NODES = 60_000
const val DEFAULT_TIME_BUDGET_MS = 8_000L
```

La justificación es esta: con la calibración correcta, el espacio que el solver tiene que explorar es mucho más pequeño. Un presupuesto enorme no garantiza encontrar la solución; garantiza, en el peor caso, tardar mucho en descubrir que no la hay. Bajar el presupuesto a 50.000 nodos es una afirmación sobre la calidad del generador: si un candidato no encuentra unicidad en 50.000 nodos, probablemente no la tenga, y el tiempo que gastamos buscándola se lo debemos a otro candidato.

Y aquí viene la pieza que convierte un crash en un mensaje. El `NumberlinkMenuViewModel` pasó a tratar el fallo como lo que es, un estado esperado del sistema:

```kotlin
} catch (e: Exception) {
    if (e is kotlinx.coroutines.CancellationException) throw e
    android.util.Log.e("NumberlinkMenuViewModel", "Error generating puzzle", e)
    if (id == requestId) _ui.value = _ui.value.copy(showRetryDialog = true)
}
```

La re-lanzada de `CancellationException` es el detalle que más me importa, porque es el tipo de error más fácil de Convertir en bug: sin esa línea, el `catch (e: Exception)` se traga también las cancelaciones de structured concurrency y la UI se queda esperando un resultado que nunca llegará.

## Compatibilidad: versionar en lugar de migrar

Cambiar el algoritmo detrás de partidas guardadas es un problema de datos, no de código. La solución fue deliberadamente boring: una columna.

`NumberlinkPuzzleEntity` lleva `val generatorVersion: Int` con default `1`, y el repositorio escribe `NumberlinkPuzzleRepository.GENERATOR_VERSION` en cada puzzle nuevo. Cuando la tabla de calibración cambió, `GENERATOR_VERSION` pasó de `1` a `2` en el commit `d0454070`, con esta justificación:

> «Requerido para trazar e invalidar de forma limpia las partidas de sesiones previas generadas con el algoritmo heredado v1»

La clave es que la base de datos **no** cambió de versión. `NumberlinkDatabase` sigue en `version = 1`, sin migración destructiva. Las sesiones viejas se deserializan con `generatorVersion = 1` y siguen renderizando perfectamente, porque el formato almacenado (pares, caminos, métricas, pistas en JSON) no cambió. La versión es informativa, no destructiva.

Migrar sería más elegante en apariencia y peor en la práctica: habríamos tenido que reescribir las partidas guardadas de los usuarios que conservaban el mismo puzzle con un algoritmo distinto. La regla que seguimos, y que ahora está en el contrato, es: **cambiar el generador no puede cambiar el esquema de lo que ya está en el disco.**

## Verificación: contratos ejecutables, no revisiones manuales

La forma de probar todo esto fue una suite de contratos, no una revisión manual. El commit `470743a5` añadió tests exhaustivos con nombres que describen la propiedad que protegen:

- `rectangularBoardsReturnVerifiedUniquePuzzles`
- `generatorIsDeterministic_sameSeedProducesIdenticalPuzzleAndSolution`
- `shikakuSizesReturnVerifiedUniquePuzzles`
- `everySupportedRectangularSizeAndDifficultyReturnsVerifiedUniquePuzzle`

Esa última es la que más me gusta: no prueba que un tablero concreto sea único, prueba que **el generador nunca devuelve un tablero sin certificar**, para cualquier combinación de tamaño y dificultad soportada. Es la diferencia entre probar el resultado y probar el contrato.

El determinismo, por su parte, no es un lujo. Con `Random(seed)` como única fuente de aleatoriedad, la misma tupla `(size, difficulty, seed)` produce el mismo puzzle y la misma solución, siempre. Eso convierte el generador en una función testeable y hace que los tests de contrato puedan afirmar sobre valores concretos en lugar de sobre propiedades difusas.

### Una honestidad incómoda sobre los benchmarks

Hay una tarea en el plan que dice `[x]`: *«Task I3-1: Reproduce and benchmark 7x10 EASY generation across multiple random seeds»*, con un fichero `NumberlinkGenerationBenchmarkTest.kt`. Ese fichero no existe. Lo comprobé en el árbol actual y en todo el historial de git: `git log --all --diff-filter=A` para ese nombre no devuelve nada. Nunca existió.

Lo encontré después de dar por cerrado el trabajo, revisando el plan línea por línea. La tarea está marcada como completada en el documento, pero el artefacto que la respalda no está. No sé cómo pasó: probablemente se marcó durante una iteración de verificación y se perdió al reescribir el árbol. Lo dejo escrito aquí porque es exactamente el tipo de deuda que se propaga en silencio, y porque un plan con checks que no se corresponden con la realidad es peor que un plan sin checks.

Lo que sí existe como evidencia de rendimiento son estimaciones documentadas en el research (con la hipótesis explícita «CPU ARM Cortex-A78»): 7×10 → 550 ms; 8×12 → 1,3 s; 10×15 → 5,5 s con un reintento, 8 s de timeout con tres. Son estimaciones, no mediciones, y las trato como tales.

## De aquí a v3: por qué esto no fue el final

La semana del 10 al 21 de septiembre continuó con `GENERATOR_VERSION` subiendo a 3. El motivo está en el issue #352, que sigue abierto, y en su título: *«Numberlink Generator v3 — Hamiltonian + 2-opt + DP + uniqueness + logical difficulty + buffer»*.

El motivo por el que v2 no era suficiente es preciso y lo describe el propio PRD: v2 construye covers de «calles rectas» y usa `twoLanePath` en un caso especial, lo que produce «una geometría limitada». Traducido: los tableros salen legibles, pero con las calles siempre en las mismas direcciones, lo que hace que el jugador reconozca patrones de una partida a otra.

La respuesta de v3 fue construir el cover como un ciclo hamiltoniano real y luego trabajarlo: DFS aleatorio con heurística Warnsdorff-like, fallback a perturbación determinista, `2-opt` con mejora estricta y desempate lexicográfico para que el resultado sea reproducible, y una partición por programación dinámica encima. Todo eso desemboca en el mismo invariante: unicidad certificada, presupuesto acotado, y dificultad que se mide en vez de declararse.

Un detalle de diseño que me gusta mucho y que quiero destacar: la fórmula del score de dificultad está escrita explícitamente para no depender de la dificultad solicitada.

```kotlin
// Difficulty score: strictly independent of requestedDifficulty or its ordinal
val score = (
    pairRatio * 16f +
    turnRatio * 28f +
    minOf(2.5f, detourRatio) * 12f +
    vector.geometry.interactionScore * 25f +
    minOf(1f, branchRatio) * 15f
).coerceIn(0f, 100f)
```

Pedir fácil y puntuar fácil con la misma escala es el error clásico de la calibración circular: el generador cumple y nadie sabe si el puzzle era realmente fácil. Separar la medición de la petición es lo que permite que el perfil de dificultad sea auditable.

## Lo que me llevo de este ciclo

Tres cosas, y ninguna es sobre Numberlink.

**Un presupuesto de búsqueda es una decisión semántica, no de rendimiento.** Cuando el solver no puede responder, la respuesta correcta es «inconcluyente». La diferencia entre devolver una excepción y devolver un estado con nombre propio es la diferencia entre un crash y un diálogo de reintento.

**El bug más caro no está en el código, está en los números.** El algoritmo hamiltoniano era correcto. Lo que estaba roto era un rango `28..31` escrito sin derivarlo de nada. Si el problema parece de algoritmo y tu investigación dice que no, tienes que tener la humildad de tirar el trabajo hecho y recalibrar — aunque duela, porque el git log ya tiene commits que dicen «generador».

**Escribir la investigación antes de reescribir es la única forma de no volver a intentarlo.** De los tres cambios grandes de esta semana (podas de dead-ends, partición DP, `2-opt` con desempate estable), ninguno se me ocurrió leyendo el código viejo. Salieron de un documento que comparaba tres algoritmos y escribía, sin adornos, que la arquitectura que ya teníamos era correcta para su subproblema y ortogonal al que nos dolía.

Y queda una tarea sin cerrar, porque las honestas: el issue #352 sigue abierto, la PR #354 sigue sin mergear, y el `Gate UA` del documento de verificación v3 permanece en PENDING. El trabajo que puedo contar con pruebas está terminado; el que sigue, no lo voy a dar por bueno hasta verlo en la app.

## Referencias y documentación

- **Repositorio (nombre canónico actual)**: [ArceApps/PuzzleHub](https://github.com/ArceApps/PuzzleHub) — antes `ArceApps/PuzzleSuite`, mismo repo, id 1035648947.
- **Issue #341**: [En el juego numberlink hay que rehacer todo el algoritmo para la generación de tableros](https://github.com/ArceApps/PuzzleHub/issues/341)
- **Issue #352**: [Numberlink Generator v3 — Hamiltonian + 2-opt + DP + uniqueness + logical difficulty + buffer](https://github.com/ArceApps/PuzzleHub/issues/352)
- **PR #351**: [Merge Numberlink board visual redesign](https://github.com/ArceApps/PuzzleHub/pull/351)
- **Commits clave**: `dc01b3e1` (generador v2 con poda anti-ambigüedad), `d0454070` (`GENERATOR_VERSION` 1→2), `470743a5` (tests de contrato exhaustivos), `65194ed4` (poda del solver y cuotas no triviales), `92cf2bb7` (generación multi-corte para tamaños Shikaku).
- **Documentación interna**: `docs/specai/20260903-numberlink-generator-redesign/` (prd, spec, designs, plan, tasks, verify) y `docs/specai/20260904-numberlink-generator-research.md`.
- **Código**: `NumberlinkPuzzleGenerator.kt`, `NumberlinkSolver.kt`, `DefaultNumberlinkUniquenessSolver.kt`, `DefaultNumberlinkCheapFilter.kt`, `NumberlinkPathValidator.kt`, `NumberlinkDifficultyProfile.kt`, `NumberlinkUniqueness.kt`.

### Documentación externa

- Adcock, van Rooij, Velpic, — [Zig-Zag Numberlink is NP-Complete](https://arxiv.org/abs/1410.5845) (arXiv:1410.5845, 2014). La base teórica de por qué la unicidad se verifica con presupuesto acotado.
- Thomas Ahle, — [numberlink](https://github.com/thomasahle/numberlink). La implementación de referencia; su README contiene la advertencia sobre no poder usarla para comprobar unicidad.
- Matt Zucker, — [mzucker/flow_solver](https://github.com/mzucker/flow_solver). Benchmarks de verificación de unicidad por SAT usados para dimensionar la opción descartada.
- [Sat4j](https://gitlab.ow2.org/sat4j/sat4j) — Solver SAT en Java puro, la alternativa evaluada y descartada por tamaño de APK y coste de encoding.
- [Jetpack Compose](https://developer.android.com/develop/ui/compose) — Framework de UI del proyecto.
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html) — Structured concurrency, base del manejo de cancelación en la capa de UI.

---

*Este artículo documenta el período del 3 al 9 de septiembre de 2026. Trabajo realizado sobre `ArceApps/PuzzleHub`, publicado el 21 de octubre de 2026 dentro del backlog histórico del proyecto.*