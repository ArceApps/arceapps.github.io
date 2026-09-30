---
title: "PuzzleHub: estadísticas persistentes"
description: "Cómo PuzzleHub unificó puntos y progresión en doce juegos, corrigió la persistencia con Room y convirtió estadísticas dispersas en un contrato común."
pubDate: 2026-06-23
lastmod: 2026-09-30
author: "ArceApps"
keywords: ["PuzzleHub", "Room", "Kotlin", "Jetpack Compose", "Android"]
heroImage: "/images/devlog/puzzlehub-score-xp-persistence.svg"
tags: ["Android", "Room", "arquitectura", "estadísticas", "devlog"]
draft: false
---

Hay bugs que no rompen una partida y, precisamente por eso, pueden sobrevivir bastante tiempo. El jugador resuelve el puzzle, aparece la celebración y ve una puntuación razonable. Pero al abrir Estadísticas más tarde, parte de aquella recompensa no está donde debería.

Eso era PuzzleSuite —hoy PuzzleHub— a finales de junio de 2026. La aplicación ya tenía doce juegos, un `GameScoreCalculator`, progresión global, estadísticas e historiales. El problema estaba en las costuras: calcular un valor para el diálogo de finalización no significa persistirlo, y tener una tarjeta reutilizable no significa que doce pantallas compartan el mismo contrato de datos.

## Doce juegos, una misma promesa

Akari, Dominosa, Fillomino, Galaxies, Hashi, Hitori, Kakuro, Kenken, MathCrossword, Minesweeper, Shikaku y Slitherlink tienen verticales propias. El diseño de persistencia enumeró para cada uno dominio, entidad Room, estadísticas, ViewModel, pantalla e historial. Era una matriz de superficie de cambio.

La investigación encontró cinco familias de inconsistencias: algunos ViewModels calculaban score pero no lo guardaban; nueve juegos carecían de columna `score`; ocho modelos no exponían `totalXp` o `totalScore`; ocho StatsViewModels no consultaban `GlobalStatsRepository`; y ocho pantallas no mostraban `XpAndScoreCard`.

No había un único bug. Había varias implementaciones parciales de la misma feature.

## Calcular no es persistir

`GameScoreCalculator.calculate()` ya producía puntuaciones válidas para el flujo de finalización. El fallo era de propiedad: el número pertenecía temporalmente al diálogo, no a la partida persistida.

La corrección hizo explícito el orden:

```kotlin
val score = GameScoreCalculator.calculate(
    gameId = gameId,
    difficulty = puzzle.difficulty,
    size = size,
    elapsedTimeMs = elapsed,
    hintsUsed = hints
)
repository.updatePuzzle(puzzle.copy(score = score))
```

A partir de ahí, el total deja de ser un contador paralelo y se deriva de hechos:

```kotlin
val totalScore = completedPuzzles.sumOf { it.score }
```

Esta diferencia es pequeña en código y grande en arquitectura. Una puntuación mostrada es feedback; una puntuación guardada es historial.

## Puntos y XP tienen fuentes distintas

La puntuación pertenece a cada partida. El XP forma parte de la progresión global. La solución evitó duplicar el XP dentro de cada base local. Los StatsViewModels combinan partidas completadas con el XP por juego de `GlobalStatsRepository`.

```text
Room / partidas completadas ──> suma score ──┐
                                             ├─> Stats UI
GlobalStatsRepository ─────────> XP juego ───┘
```

Room conoce el historial concreto; el repositorio global conoce la progresión. Compose recibe un estado ya compuesto en el ViewModel.

## Migraciones Room sin perder historial

Para los juegos sin columna `score`, el patrón fue incrementar versión y añadir una columna no nula:

```sql
ALTER TABLE ... ADD COLUMN score INTEGER NOT NULL DEFAULT 0
```

El informe histórico registra, entre otras, Hitori 8→9, Kenken 6→7, Fillomino 8→9, Slitherlink 7→8 y Minesweeper 7→8. No se usó fallback destructivo.

También se corrigió un detalle revelador: `MIGRATION_7_8` existía para Shikaku pero faltaba registrarla en la ruta real de la base. Una migración escrita no sirve si Room nunca la recibe.

## Las partidas antiguas

El diseño comparó tres estrategias para registros anteriores. Recalcular en SQL habría duplicado la lógica de `GameScoreCalculator` y `XpCalculator`. Ejecutar trabajo complejo en `RoomDatabase.Callback.onOpen` habría acoplado inicialización y repositorios.

La opción recomendada fue separar migración de esquema y migración semántica: Room añade columnas; Kotlin localiza partidas completadas sin puntuación y reutiliza los calculadores existentes. Es una regla útil más allá de PuzzleHub: la base debe transformar estructura; el dominio debe conservar la lógica de negocio.

## La UI común exige datos comunes

`XpAndScoreCard` ya funcionaba en Akari, Shikaku, Galaxies y MathCrossword. El trabajo extendió el patrón a los demás juegos. Pero copiar el composable era la parte fácil.

La verificación final comprobó por juego seis puntos: score persistido, campo en entidad, totales en estadísticas, repositorio global en ViewModel, tarjeta en pantalla y migración cuando correspondía. Esa matriz convirtió “parece consistente” en un contrato comprobable.

## Los tests también forman parte del contrato

Añadir `GlobalStatsRepository` a los StatsViewModels rompió tests que los construían directamente. La documentación registra trece pruebas afectadas por firmas nuevas o argumentos en orden incorrecto. Se añadieron mocks y se corrigieron constructores; también apareció un import de `PuzzleSize` ausente en MathCrossword.

El informe registra `assembleDebug` correcto en 2 minutos y 19 segundos y compilación de tests unitarios correcta en 15 segundos. Son mediciones históricas del período, no benchmarks actuales.

## La duplicación quedó a la vista

La solución también reveló una deuda: ocho ViewModels, ocho modelos y ocho pantallas necesitaron cambios parecidos. La arquitectura por feature sigue teniendo sentido porque cada juego conserva métricas específicas, pero lo transversal estaba demasiado repetido.

La documentación posterior de agosto sobre commonización de historial y estadísticas identificaría componentes repetidos como `HeroStatCard`, `StatRow`, `StatsByDifficultySection` y `XpAndScoreCard`. El trabajo de junio no terminó esa abstracción, pero alineó primero los datos, que es el orden correcto.

## La puntuación como hecho histórico

Persistir score evita otro problema: recalcular el pasado con una fórmula futura. Si `GameScoreCalculator` cambia, una partida antigua no debería necesariamente cambiar de valor. Guardar el resultado al completar permite tratarlo como un hecho histórico.

El backfill de registros antiguos es una excepción controlada. Si el scoring evoluciona mucho, un siguiente paso razonable sería guardar también una versión de fórmula.

## Lo que haría distinto hoy

Convertiría la matriz de doce juegos en tests contractuales parametrizados. Cada GameType debería declarar capacidades como scoring, XP, estadísticas, historial, retos y logros. Así, una ausencia sería visible por construcción y no tras buscar manualmente doce implementaciones.

También mantendría la separación que funcionó bien: `GameScoreCalculator` como lógica compartida, `GlobalStatsRepository` como autoridad de progresión, Room como historial local y el ViewModel como frontera de composición para la UI.

## Una suite crece por sus contratos

El aprendizaje no es “cómo añadir una columna a Room”. Es detectar cuándo una suite ha crecido más rápido que sus invariantes.

Doce juegos pueden tener doce motores y doce estadísticas especializadas. Pero si todos prometen puntos y XP, esa promesa debe atravesar el mismo camino: **calcular → persistir → agregar → observar → mostrar**.

En junio de 2026, PuzzleHub hizo ese camino explícito. Una victoria dejó de ser un dato efímero de un diálogo y pasó a formar parte de la historia persistente del jugador. Para una suite que quiere construir progresión sobre muchos puzzles distintos, esa diferencia importa más que dos números bonitos en una tarjeta.


## Una migración aditiva también es una decisión de producto

Es fácil leer `ALTER TABLE` como una preocupación puramente técnica. En realidad decide qué experiencia recibe una persona que actualiza la aplicación después de meses de uso. Si la salida cómoda fuese recrear la base, la nueva pantalla de estadísticas nacería a costa de borrar el historial que pretende resumir.

Por eso la restricción “sin migración destructiva” tiene valor de producto. Los datos locales de una app de puzzles no son una caché intercambiable: contienen partidas, tiempos y progreso que el usuario ha construido. Preservarlos limita las soluciones disponibles, pero también obliga a diseñar una evolución más seria.

El patrón `NOT NULL DEFAULT 0` fue una solución compatible con esa prioridad. No resuelve por sí solo el significado de los registros antiguos, pero garantiza que la estructura puede avanzar sin invalidarlos. La fase de backfill se ocupa después de enriquecerlos con lógica Kotlin.

## Por qué no mover toda la puntuación a estadísticas

Otra alternativa posible habría sido mantener únicamente un acumulado por juego. Cada victoria sumaría puntos a una fila de estadísticas y el historial no necesitaría almacenar el score individual. Es más simple en apariencia, pero pierde información.

Guardar la puntuación en la partida permite reconstruir el total, mostrarla en historial, depurar discrepancias y, si algún día se necesita, analizar distribución por tamaño o dificultad. Un total agregado no puede reconstruir sus sumandos.

La dirección elegida aplica un principio clásico: conservar los hechos y derivar los agregados. `totalScore` puede calcularse desde partidas completadas; una partida concreta no puede recuperarse desde `totalScore`.

Ese principio también reduce el riesgo de contadores desincronizados. Si una partida se elimina, importa o corrige, el agregado derivado puede reflejar el nuevo conjunto. Un contador incremental necesitaría lógica adicional para cada mutación.

## La frontera entre dominio y persistencia

El diseño de junio también deja clara una responsabilidad que a veces se diluye en aplicaciones Compose: Room no debería decidir cuánto vale una partida. La base almacena el resultado; `GameScoreCalculator` lo calcula.

Separar esas responsabilidades permite probar la fórmula sin base de datos y migrar el almacenamiento sin duplicar reglas. También hace posible reutilizar el mismo cálculo en retos diarios, pantallas de finalización o nuevas features sin convertir SQL en una API de negocio.

La persistencia, por su parte, sí debe garantizar durabilidad y compatibilidad. De ahí que las migraciones sean parte del contrato de datos y no un detalle interno del ViewModel.

## Qué nos dice el fallo sobre una suite modular

Cuando una feature falla de cinco maneras distintas en doce juegos, la conclusión fácil es que hay “demasiada duplicación”. Es cierto a medias. La modularidad por juego aporta aislamiento y hace que cada puzzle pueda evolucionar sin convertir un único módulo en un bloque inmanejable.

El problema no es que existan doce features. Es no distinguir suficientemente entre lo que varía y lo que debe permanecer invariante. El algoritmo de Kenken varía respecto a Hitori. La obligación de guardar una puntuación al completar no debería variar.

Una arquitectura madura de suite necesita ambos niveles: verticales independientes para la mecánica y contratos horizontales para capacidades compartidas. Este trabajo fue, en la práctica, una auditoría de uno de esos contratos horizontales.

## De la matriz documental a un registro ejecutable

La tabla de verificación funcionó bien porque obligó a recorrer todos los juegos. Pero una tabla puede quedarse obsoleta. La evolución natural es convertirla en código.

Un registro de juegos podría declarar identificador, tamaños, dificultades y capacidades. Los tests recorrerían ese registro y comprobarían que cualquier juego con scoring tiene calculador, persistencia y adaptador de estadísticas. Cualquier juego con XP tendría integración de progresión. Cualquier juego con historial tendría el mapping necesario.

Eso no elimina tests específicos. Los complementa con una capa de invariantes de suite. La diferencia es importante: un test de Hitori demuestra que Hitori funciona; un test contractual demuestra que ningún juego registrado queda fuera de una promesa común.

## El valor de una fuente de verdad por concepto

Este cambio también funciona como ejemplo de algo que intento mantener en proyectos grandes: una fuente de verdad por concepto, no una fuente de verdad para toda la aplicación.

La partida persistida es la fuente para su score. `GlobalStatsRepository` es la fuente para progresión global y XP por juego. Los StatsViewModels son consumidores que combinan ambas. No hace falta forzar todo a una única tabla para decir que la arquitectura tiene fuentes de verdad claras.

De hecho, juntar datos con ciclos de vida distintos suele empeorar las cosas. La claridad viene de poder responder sin ambigüedad dónde nace y quién modifica cada valor.

## Una comprobación visual no sustituye una comprobación de datos

La tarjeta común podía hacer que todas las pantallas parecieran alineadas aunque por debajo algunas siguieran devolviendo ceros. Por eso el trabajo no se cerró al ver la UI.

La verificación recorrió persistencia, modelo, ViewModel y pantalla. Esa secuencia es reutilizable para cualquier feature transversal: comprobar primero el hecho almacenado, después la transformación, luego el estado expuesto y finalmente la representación.

En interfaces reactivas es especialmente fácil confundir “la pantalla renderiza” con “el dato es correcto”. Compose puede dibujar perfectamente un cero incorrecto.

## Qué quedó pendiente deliberadamente

El período no cerró toda la historia de estadísticas de PuzzleHub. La commonización completa de pantallas e historial llegaría como trabajo posterior; tampoco este cambio convirtió todos los modelos específicos en una entidad genérica.

Eso fue una decisión razonable. Mezclar una corrección de integridad de datos con un refactor masivo de presentación habría aumentado el riesgo y dificultado saber qué cambio resolvía qué problema.

Primero se estabilizó el significado de score y XP. Después podía reducirse duplicación con una base más consistente. En refactors transversales, el orden importa tanto como el diseño final.

## Un criterio útil para futuras features

Después de este trabajo, una feature compartida puede evaluarse con cinco preguntas: ¿se calcula con una regla común?, ¿se persiste donde corresponde?, ¿sobrevive a actualización de esquema?, ¿se expone mediante un contrato coherente?, ¿se verifica para todos los juegos registrados?

Si alguna respuesta depende de “en este juego lo hacemos distinto” sin una razón de dominio, probablemente existe una inconsistencia esperando aparecer.

Ese criterio es más útil que contar componentes compartidos. Una suite puede tener muchas clases y seguir siendo coherente si sus invariantes están claras. También puede tener una UI muy reutilizada y ser inconsistente si cada pantalla interpreta los datos de forma diferente.


## Del diseño inicial al contrato que realmente quedó

Hay un matiz importante entre los documentos del 21 y del 23 de junio. El diseño inicial de persistencia planteaba añadir tanto `score` como `xp` a las partidas y contemplaba un poblador retroactivo en Kotlin. Dos días después, el plan de corrección que sí quedó verificado acotó el contrato de otra forma: **el score se persiste con la partida; el XP por juego se consulta a través de `GlobalStatsRepository`**.

No es una contradicción que convenga ocultar, sino una evolución útil del diseño. El primer documento exploraba cómo llevar ambos valores hasta historial y estadísticas. La implementación posterior reconoció que el XP ya tenía una autoridad global y evitó crear una segunda copia en cada base de juego solo para alimentar la pantalla de estadísticas.

El informe final permite separar con precisión lo que quedó demostrado de lo que era una propuesta. Está verificado que los doce juegos guardan el score calculado antes de persistir, que todas las estadísticas suman los scores de partidas completadas y que todas leen el XP del juego desde el repositorio global. También están verificadas las migraciones necesarias para las nueve entidades que no tenían columna de score. El poblador retroactivo descrito en el diseño anterior, en cambio, no forma parte de los criterios que el informe del 23 marca como completados.

Esa diferencia importa al escribir sobre arquitectura meses después. Un documento de diseño explica intención y alternativas; un informe de verificación explica qué contrato llegó a quedar operativo. Para reconstruir una decisión técnica no basta con encontrar el documento más detallado: hay que seguir la historia hasta la evidencia de cierre.

## Nueve migraciones, pero una sola regla

El informe de verificación cifra en nueve los juegos que necesitaron una nueva columna de score. Algunos números de versión están documentados explícitamente: Hitori pasó de 8 a 9, Kenken de 6 a 7, Fillomino de 8 a 9, Slitherlink de 7 a 8 y Minesweeper de 7 a 8. Para Hashi y Dominosa, el propio informe deja el número concreto como pendiente de verificar, aunque confirma que la migración existe.

Ese detalle es un buen recordatorio de cómo escribir documentación técnica honesta. No hace falta rellenar los huecos con una inferencia. Podemos afirmar la propiedad que sí está verificada —hay migración no destructiva— y reservar el número de versión para cuando exista evidencia equivalente.

Lo interesante es que nueve esquemas distintos obedecen a la misma regla:

```sql
ALTER TABLE ... ADD COLUMN score INTEGER NOT NULL DEFAULT 0
```

La repetición aquí no es necesariamente un defecto. Cada juego conserva su base y su ciclo de esquema, pero todos respetan la misma política de compatibilidad. El contrato compartido vive en la decisión —preservar datos y añadir el campo de forma aditiva— aunque la ejecución esté distribuida.

Room exige precisamente que una aplicación que cambia su esquema disponga de una ruta de migración válida entre las versiones que un usuario puede tener instaladas y la versión objetivo. Es la razón por la que registrar la migración es tan importante como escribir el objeto `Migration`: código que nunca se incorpora al builder no constituye una ruta real de actualización.

## Qué verificaron realmente los tests

El plan registra trece tests que dejaron de compilar después de cambiar las firmas de los StatsViewModels. Siete —Akari, Dominosa, Fillomino, Galaxies, Hitori, Kakuro y Shikaku— necesitaban el mock de `GlobalStatsRepository`. Hashi, Kenken, Minesweeper y Slitherlink tenían además argumentos desordenados. MathCrossword necesitaba tanto `puzzleRepository` como `globalStatsRepository`, y un test del generador arrastraba un import de `PuzzleSize` ausente.

Es tentador describir aquello como “arreglar tests rotos”, pero la lectura arquitectónica es más interesante. Las pruebas estaban enumerando, de forma indirecta, las dependencias necesarias para construir estadísticas. Cuando el XP global pasó a formar parte explícita del estado, los constructores de test tuvieron que reconocer esa dependencia.

La verificación histórica no afirma que se ejecutara toda la batería de tests. Afirma algo más concreto: `:app:compileDebugUnitTestKotlin` terminó sin errores en 15 segundos. Mantener esa precisión evita convertir “los tests compilan” en “todos los tests pasan”, dos garantías diferentes. Del mismo modo, `assembleDebug` terminó correctamente en 2 minutos y 19 segundos con advertencias preexistentes y sin errores nuevos.

## Un contrato transversal necesita una prueba transversal

La matriz manual del informe es buena porque fuerza a mirar los doce juegos, pero también muestra el siguiente paso natural. Si la aplicación añade un decimotercer puzzle, una tabla de junio no puede avisar de que el nuevo juego olvidó score, XP o estadísticas.

Una prueba contractual sí podría hacerlo. No necesita conocer cómo se resuelve un Kakuro o cómo se genera un Slitherlink. Necesita conocer las capacidades declaradas por cada juego y comprobar que las integraciones obligatorias existen.

Una posible evolución sería un registro de capacidades parecido a este:

```kotlin
data class GameCapabilities(
    val scoring: Boolean,
    val progression: Boolean,
    val history: Boolean,
    val statistics: Boolean,
)
```

No es código que se añadiera en junio; es una consecuencia arquitectónica del patrón observado. Su utilidad estaría en convertir una checklist humana en una invariante ejecutable. Si un juego declara `scoring = true`, los tests de integración pueden exigir que exista un camino persistente hasta estadísticas. Si declara progresión, pueden comprobar su conexión con la autoridad global correspondiente.

El objetivo no sería eliminar las diferencias entre juegos. Sería hacer explícito qué diferencias son legítimas y qué obligaciones son comunes.

## La lección más útil: seguir el dato completo

La forma más fiable de revisar una feature transversal no es empezar por la pantalla donde se ve. Es elegir un dato y seguirlo de extremo a extremo.

En este caso el recorrido del score es concreto: el juego termina, `GameScoreCalculator` calcula, el ViewModel copia el valor a la partida, el repositorio persiste, Room conserva, estadísticas recupera partidas completadas, el ViewModel suma y Compose representa. El XP sigue otro recorrido: la progresión se acumula en su autoridad global, `GlobalStatsRepository` expone el valor del juego y el StatsViewModel lo combina con los datos locales.

Que ambos números terminen juntos en `XpAndScoreCard` no significa que deban compartir almacenamiento. La pantalla es el punto de composición, no necesariamente el punto de propiedad.

Esta distinción es probablemente el resultado más valioso del trabajo de junio. PuzzleHub no necesitaba una megabase común para ser coherente. Necesitaba contratos claros entre datos especializados y capacidades compartidas.


## Referencias y documentación

- [Repositorio PuzzleHub](https://github.com/ArceApps/PuzzleHub)
- [Diseño de persistencia](https://github.com/ArceApps/PuzzleHub/blob/main/docs/specai/feature/20260621-game-stats-persistence/20260621-game-stats-persistence-designs.md)
- [Plan Score/XP](https://github.com/ArceApps/PuzzleHub/blob/main/docs/specai/feature/20260623-fix-stats-score-xp/20260623-fix-stats-score-xp-plan.md)
- [Informe de verificación](https://github.com/ArceApps/PuzzleHub/blob/main/docs/specai/feature/20260623-fix-stats-score-xp/20260623-fix-stats-score-xp-verify.md)
- [Android Developers — Room migrations](https://developer.android.com/training/data-storage/room/migrating-db-versions)
