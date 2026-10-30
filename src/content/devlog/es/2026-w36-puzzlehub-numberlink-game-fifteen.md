---
title: "Numberlink: cómo encajó el juego 15 en el catálogo"
description: "Un puzle de Nikoli llegó al catálogo como el juego número 15 y arrastró consigo 94 ficheros, un solver propio y dos correcciones de arquitectura."
pubDate: 2026-09-02
lastmod: 2026-10-28
author: "ArceApps"
keywords: ["PuzzleHub", "Numberlink", "arquitectura Android", "algoritmos", "testing"]
heroImage: "/images/devlog/puzzlehub-numberlink-game-fifteen.svg"
tags: ["Android", "Kotlin", "arquitectura", "algoritmos", "devlog"]
draft: false
reference_id: "5dd7d4ec-ec1d-48f9-a940-7009a3879d52"
---

Hay una forma particular de revisar un puzle nuevo: no juegas, no pruebas, no opinas sobre si divierte. Revisas si encaja. Si el menú se parece al de los demás juegos, si las rutas están donde deben estar, si el solver genera tableros que no se rompen al primer error y si el catálogo del museo sigue teniendo los mismos quince huecos que antes.

Numberlink entró en `ArceApps/PuzzleHub` el 2 de septiembre de 2026 como el decimoquinto juego del catálogo. No fue un añadido pequeño: el pull request #342 tocó 94 ficheros, añadió 8.030 líneas y mueve el `GameType` de 14 entradas a 15. Una semana antes, el issue #327 había abierto la puerta con una frase que parecía burocracia: «Orden de implementación: este juego debe implementarse antes que Hidato».

Ese "antes que Hidato" es la única pista de que esto no iba a ser un trámite. Lo que viene a continuación es la historia de cómo encajó un puzle de emparejar caminos en un catálogo que ya tenía catorce juegos, seis capas arquitectónicas y una batería de tests de contrato que se negaba a dejar pasar cualquier cosa que no encajara con el resto.

## El punto de partida: una tarea de Obsidian y un issue

Antes de que existiera una línea de código, hubo una nota en el vault. En `vault/tareas/puzzlehub-implementar-numberlink.md` la tarea aparece con `status: Hecho`, prioridad Media y cuatro subtareas sin marcar:

```
- [ ] Definir reglas, niveles de dificultad y tamaños de tablero.
- [ ] Implementar generación y validación de soluciones.
- [ ] Integrar la interfaz, controles, progreso y final de partida.
- [ ] Añadir estadísticas, onboarding y pruebas.
```

Lo interesante es el "Registro de trabajo" de esa misma nota, que dice: *«2026-08-26 — Completada. Tarea migrada a GitHub Issues del proyecto PuzzleSuite»*. El trabajo dejó de ser una nota de vault y pasó a ser el issue #327 con esas cuatro subtareas y la misma prioridad. La nota hermana para Hidato conserva la dependencia explícita: *«Comenzar después de completar la implementación de Numberlink»*.

Ese intercambio explica por qué la implementación se escalonó como se escalonó. Numberlink no se escribió de golpe: se escribió por fases, y cada fase dejó un contrato verificable.

## La fase 1: el núcleo algorítmico, y por qué el solver no es lo difícil

La fase 1 del plan tenía siete tareas: entidades de dominio, validador de caminos, solver con podas, generador con verificación en dos fases, comando de movimiento, serializador de comandos y tests. Cuatro commits la completan, en este orden:

```
dbd81b60 feat(numberlink): entidades de dominio T1.1
01055545 feat(numberlink): validador de caminos T1.2
ce6b2345 feat(numberlink): solver con podas T1.3
026c4a84 feat(numberlink): generator con verificación 2 fases T1.4
```

Hay una tentación fácil al leer esto: asumir que lo difícil fue el solver. Y sería la lectura equivocada, porque el solver de Numberlink es sorprendentemente convencional. `NumberlinkSolver` es un DFS que hace crecer cada camino desde su origen hasta su destino, con heurística MRV (extender el frente más restringido), detección de callejones sin salida y poda de conectividad. El presupuesto por defecto son 2.000.000 de nodos de búsqueda y se aceptan como máximo 2 soluciones.

```
const val DEFAULT_MAX_SEARCH_NODES = 2_000_000
const val DEFAULT_MAX_SOLUTIONS = 2
```

Lo que hace el solver es encontrar *una* solución y, si encuentra una segunda, demostrar que el puzle no tiene solución única. Por eso el límite de dos soluciones no es arbitrario: es la forma más barata de refutar la unicidad.

El validador (`NumberlinkPathValidator`) es donde vive la regla que define al juego. En la variante *strict* que elegimos, la unión de todos los caminos debe cubrir exactamente las celdas del tablero, los caminos no pueden cruzarse ni compartir celda y solo hay movimientos ortogonales. El chequeo de completado es una línea:

```kotlin
return covered.size == puzzle.totalCells
```

Y los errores posibles están enumerados como un enum con siete casos: `OUT_OF_BOUNDS`, `NOT_ORTHOGONALLY_ADJACENT`, `CELL_OCCUPIED_BY_OTHER_PAIR`, `PAIR_ALREADY_COMPLETE`, `INVALID_ACTIVE_PAIR`, `PUZZLE_ALREADY_COMPLETE`, `INVALID_CURRENT_STATE`. Ese enum es la diferencia entre "el juego falló" y "el jugador intentó algo ilegal". Un juego de puzles necesita las dos respuestas, y solo la segunda es interesante para el usuario.

La decisión de diseño que explica casi todo lo demás es la **AD-1: variante strict con cobertura total**. En el documento de diseño, la alternativa descartada fue la variante libre, donde pueden quedar celdas sin cubrir. Se eligió strict porque simplifica la validación y porque es la variante habitual en publicaciones de Nikoli. El coste se paga después, en el generador, y ese coste ya está documentado en otra entrada de esta bitácora: [el artículo sobre la recalibración del generador](/es/devlog/2026-w36-puzzlehub-numberlink-generator-calibration/).

## La fase 1.4: el generador que construye y luego esconde

El generador de la primera versión sigue un enfoque que el propio código describe sin rodeos: construir primero una solución y ocultar después los caminos.

```kotlin
/**
 * Algoritmo (Approach A): se construye un camino hamiltoniano aleatorio que cubre
 * todas las celdas del tablero y se corta en N segmentos (uno por par). Los extremos
 * de cada segmento son los endpoints del par.
 */
```

Hay dos piezas que merecen atención. La primera es `tryHamiltonianPath`, que busca un camino que visite todas las celdas una sola vez, con un presupuesto explícito de 500.000 nodos y retroceso cuando se atasca.

La segunda es `splitHamiltonian`, y su detalle es más fino de lo que parece a primera vista. Al cortar el camino en N segmentos, los cortes no se eligen al azar: se prefieren aquellos cuyas celdas adyacentes tocan el borde del tablero, porque eso deja al menos un extremo en el borde de cada segmento.

```kotlin
/**
 * Corta el camino hamiltoniano en [pairCount] segmentos contiguos. Para anclar
 * los caminos de la solución se prefieren cortes cuyas celdas adyacentes tocan
 * el borde del tablero: cada segmento queda con al menos un endpoint en el
 * borde, lo que vuelve los caminos más forzados y reduce soluciones alternativas.
 */
```

La intuición detrás es buena: un extremo en el borde tiene menos opciones de salida, así que el camino queda más determinado y es más difícil que exista una segunda solución completa. Si no hay suficientes cortes en el borde, se recurre a cortes aleatorios.

La verificación de unicidad, por su parte, se hace en dos fases, y esa estructura es la que hereda la versión actual del generador:

```kotlin
private const val MAX_PROBES = 1_000
private const val MAX_HAMILTONIAN_NODES = 500_000
private const val PROBE_SEARCH_NODES = 40_000
```

Primero un *probe* barato con 40.000 nodos descarta rápido las instancias no únicas; solo las candidatas que sobreviven pasan al solver completo. Cada candidata se acepta únicamente si el solver confirma **exactamente** una solución sin agotar el presupuesto. Si se agotó, la respuesta honesta es "no lo sé", y el generador sigue buscando. Cuando el presupuesto se agota del todo, el `error("Generator failed to verify a unique puzzle within its search budget")` que acabaría motivando el issue #341.

## Lo que significa "encajar": 14 registros que tocar

Un juego nuevo no es solo una carpeta de código. En `PuzzleHub` un juego se convierte en miembro del catálogo registrándose en una-stream de puntos de extensión, y cada uno de ellos tiene reglas propias que alguien tuvo que escribir primero.

| Punto de extensión | Qué tenía que cumplir Numberlink |
|---|---|
| `GameType` | 14 entradas pasan a 15; `NUMBERLINK("numberlink")` con `routePrefix` propio |
| `AllGamesSizeLists` | `GameType.NUMBERLINK` mapeado a 5×5, 6×6, 7×7 y 8×8 |
| `GameTutorialGameCatalog` | entrada `"numberlink"` para que el tutorial interactivo sea alcanzable |
| `NumberlinkRoutes` | seis constantes: `MENU`, `GAME`, `STATS`, `ACHIEVEMENTS`, `HISTORY`, `INFO` |
| `MainActivity` | seis `composable(...)` nuevos en el grafo de navegación |
| `ChallengeModule` | `@IntoMap @GameTypeKey(GameType.NUMBERLINK)` para el Daily Challenge |
| `BufferConfig` | `GAME_NAME_NUMBERLINK` para el worker de generación en segundo plano |
| `GameStatsHistoryAdapter` | `@IntoMap @GameStatsHistoryKey(GameType.NUMBERLINK)` para el facade de estadísticas |
| `NumberlinkModule` | `@Binds` de repositorios y `@Provides` del generador, `@Singleton` |
| `GenericGameInfoScreen` | `"numberlink" -> Icons.Filled.Extension` en el resolver genérico |
| `GameArtRepositoryImpl` | enlace a `R.drawable.art_numberlink` |
| `museum-game-art-catalog-spec.md` | invariante de tamaño subido de 14 a 15 obras |
| `NumberlinkShareBoard` | tarjeta de compartir resultados, en el catálogo común de share boards |
| `.specai/backlog.json` | entrada 61, `status: verifying` |

Ese último punto merece atención porque explica el tono final de la historia. La entrada del backlog no se cerró como `done`. Se estableció como `verifying`, con la nota de que los artefactos estaban reconciliados pero la verificación formal seguía bloqueada.

El catálogo del museo es un ejemplo de por qué estos puntos de extensión no son un detalle cosmético. La especificación `museum-game-art-catalog-spec.md` afirma que el catálogo tiene exactamente 15 obras y que `result.size == 15`. Cuando el artwork de Numberlink entró, ese invariante pasó de 14 a 15, y el test que lo verifica tuvo que cambiar con él. Un catálogo auto-consistente con tests es un catálogo que puede crecer sin que nadie lo note a mano.

Los tres PRs de la tarde remataron el trabajo con material que no es algoritmo sino contenido y pulido:

```
#345 feat(numberlink): redesign interactive tutorial and onboarding to canonical 10-page sequence
#346 feat(numberlink): 3D Cosmic Glassmorphism artwork for museum and onboarding (#343)
#348 fix(home): display numberlink played games count on home card (#347)
```

El issue #347 que cerró el #348 lo cuenta todo: *«En el juego numberlink no aparecen las partidas jugadas en la card de l[uego] en la pantalla de la home de la app»*. Al añadir un juego nuevo no basta con registrarlo en el menú: también tiene que aparecer en la pantalla de inicio con sus estadísticas. El arreglo fue una consulta reactiva, `getPuzzlesCount()` sobre `NumberlinkPuzzleDao`, expuesta como `Flow<Int>` y combinada en el `gameStats` del `HomeViewModel`.

## El momento en que el catálogo dijo "no encajas"

Los contratos de esta feature no se escribieron al final: se escribieron antes, y hay pruebas que documentan esa secuencia. `NumberlinkMenuContractTest` existe con tres tests que verifican comportamientos muy concretos, entre ellos que el id de puzle generado se reenvía al host **exactamente una vez**:

```kotlin
assertTrue(source.contains("onGenerate = { viewModel.generate(onNavigateToGame) }"))
assertFalse(source.contains("onNavigateToGame(NumberlinkRoutes.game(id))"))
```

Ese `assertFalse` no es decorativo. Es la respuesta directa a un bug real. El log de ejecución de la feature conserva el reporte textual del problema, sin retocar:

> *«Al darle click a generar tablero la aplicación crashea porque intenta navegar a `numberlink_game/numberlink_game/<id>`. El menú de Numberlink no usa el color de su categoría, debe seguir los componentes genéricos y la coherencia de los demás juegos, y hay que quitar "see a path come together" porque no aporta y no existe en los otros menús.»*

Tres defectos en un solo mensaje, y ninguno era un problema de algoritmo:

1. **Doble prefijo de ruta.** La ruta canónica `numberlink_game/{puzzleId}` ya incluye el prefijo, y el callback de generación la envolvía otra vez. El resultado era una ruta que no existía en el grafo.
2. **Color de acento en lugar de color de categoría.** El menú usaba `getGameAccent(GameType.NUMBERLINK)` cuando el patrón de la casa es `getCategoryColor(GameType.NUMBERLINK)`, que además debe coincidir con el de Zip.
3. **Una tarjeta exclusiva que no existía en ningún otro menú.** La *"See a path come together"*, con su recurso y su lógica de animación, se eliminó.

El segundo test lo fija con precisión, y la comparación con Zip no es arbitraria:

```kotlin
assertEquals(
    ChallengeThemeUtils.getCategoryColor(GameType.NUMBERLINK),
    ChallengeThemeUtils.getCategoryColor(GameType.ZIP)
)
```

Y el tercero merece una precisión honesta, porque es el tipo de detalle que se cuenta mal por accidente. Ese test no comprueba que la tarjeta "See a path come together" exista. Comprueba que **no** exista:

```kotlin
assertFalse(source.contains("NumberlinkDemoCard"))
assertFalse(source.contains("numberlink_menu_demo_title"))
assertFalse(source.contains("demoSolution"))
```

No hay ningún `NumberlinkDemoCard` en el historial completo del repositorio: la tarjeta se diseñó y se descartó antes de llegar a código. El contrato no protege una feature, protege su ausencia, para que nadie la reintroduzca mañana. Eso es más valioso de lo que parece, porque la tentación de "añadir una demo bonita al menú" es exactamente el tipo de detalle que hace que un menú se salga del patrón común.

La segunda iteración del mismo día fue de otra categoría. El reporte decía: *«Hay que generar la pantalla de información completamente como en el juego Waypoint de ejemplo y guía, verificando que tiene los mismos apartados, diseño, etc.»*. La causa raíz era de otro tipo: `NumberlinkInfoScreen` ya delegaba en `GenericGameInfoScreen`, pero su documento Markdown solo contenía encabezados simples, y el parser compartido esperaba bloques `<details>` con `<summary>`. La pantalla se veía pero no tenía las tarjetas desplegables, ni el bloque de estadísticas, ni el subtítulo que sí tenía Waypoint.

La solución fue completar los documentos EN y ES con el mismo catálogo y orden semántico que Waypoint: Resumen, Estadísticas, reglas, controles, historia y origen, estrategias y técnicas, consejos para principiantes, beneficios cognitivos, variantes, FAQ y créditos. Y añadir `NumberlinkInfoDocsCatalogTest` para que el catálogo se verifique en ambos idiomas. Ese test es la versión legible de "el orden de las secciones importa", algo que un test de igualdad de strings no podría expresar.

## Lo que quedó sin verificar, y por qué importa decirlo

Aquí es donde este trabajo se separa de una entrada de bitácora normal, y donde el propio repositorio es más honesto que yo si me limito a resumirlo.

El `verify.md` de la feature lista 80 criterios o más, la mayoría marcados como cumplidos. Pero el propio documento es explícito sobre lo que **no** se pudo verificar:

```
- V9.1: no se generó un informe formal de cobertura superior al 80%.
- V9.5: no se ejecutó `lint`.
- V11.1–V11.4: no se tomó una medición de rendimiento instrumentada.
- Aceptación visual en emulador/dispositivo: `android` y `adb` no están
  disponibles en el entorno.
```

Y las tareas que quedaron pendientes llevan el motivo escrito al lado, no escondido:

```
- [ ] T9.3 Tests de integración de repositorios — Pendiente: la suite actual no contiene un harness Room de Numberlink
- [ ] T9.7 Verificación final contra checklist — Pendiente: aceptación visual en dispositivo/emulador
```

El resultado final de la feature es, literalmente, `🟡 IN PROGRESS`. El log de reconciliación lo dice sin adornos: *«Progreso pendiente: no hay Gate UA aceptado, el verifier no está en PASS y siguen pendientes T9.3/T9.7/V9.1/V9.5/V11.1–V11.4»* y *«No se marca ningún criterio ni gate como pasado en esta reconciliación»*.

Lo que sí está verificado es concreto: `compileDebugKotlin` en verde, `assembleDebug` en verde, `testDebugUnitTest` completo en verde con `tests=1311, failures=0, errors=0, skipped=48`, `git diff --check` en verde y `SPEC_DRIFT` en PASS. La suite unitaria de la feature en particular son siete ficheros bajo `app/src/test/.../numberlink/`, entre ellos los contratos de menú, de generación, de validador de caminos, de tutorial y de catálogo de información.

Hay un matiz que conviene no perder: el performance quedó sin medir, y ese hueco tiene consecuencias que solo se verían más tarde. Los criterios V11.1 a V11.4 pedían generación por debajo de 2 segundos en tableros de 5×5 a 7×7, por debajo de 5 segundos en 8×8, validación en tiempo real por debajo de 16 ms por movimiento y un solver por debajo de 3 segundos. Ninguno se midió. Semanas después, la calibración del generador se convertiría en el problema central del proyecto, y este es uno de los puntos ciegos que contribuyó a que llegara tan lejos sin detectarse.

Esa es, creo, la lección más transferible de este trabajo. Un checklist con 80 marcas de verificación en verde dice mucho menos que cuatro líneas que enumerate lo que no se pudo comprobar. Lo que no se midió no es ruido del proceso: es el mapa de lo que puede fallar sin que nadie se entere.

## Lo que aprendí

**Un juego nuevo es un contrato con el catálogo, no una carpeta de ficheros.** Cada punto de extensión tiene reglas propias y cada una de ellas es un sitio donde un juego nuevo puede no encajar. Los catorce registros de la tabla no son burocracia: son la razón por la que el invariant de 15 obras del museo y el color de categoría compartido con Zip se pueden verificar con un test en lugar de a ojo.

**El contrato que más valor tiene es el que dice "esto no debe existir".** `assertFalse(source.contains("NumberlinkDemoCard"))` protege una feature que nunca se implementó. Es un test barato contra la tentación más común en un menú: añadir algo que solo tiene sentido en un juego concreto.

**Cuando el patrón es "todos los menús hacen lo mismo", el test debe comparar con otro juego, no con una constante.** El test de color no comprueba `assertEquals(color, 0xFF00FF)`. Compara con `getCategoryColor(GameType.ZIP)`. Si algún día la paleta de categoría cambia, los dos juegos cambian juntos y el test sigue diciendo la verdad sobre lo que le importa: que Numberlink se parece a Zip.

**Escribir en el log lo que no se pudo verificar es parte del trabajo.** El `verify.md` de esta feature es, para mí, uno de los documentos más útiles que he escrito. Dice qué se ejecutó (`compileDebugKotlin`, `assembleDebug`, `testDebugUnitTest`, `git diff --check`, `SPEC_DRIFT`), con números (`1311` tests, `0` fallos, `48` omitidos), y dice qué no se ejecutó y por qué. Un checklist que solo puede marcar casillas verdes no sirve para nada; uno que enumera los huecos sí sirve, porque esos huecos son la lista de cosas que pueden romperse en silencio.

## Continuidad

Esta entrada cubre la llegada de Numberlink al catálogo entre el 26 de agosto y el 2 de septiembre de 2026. Lo que vino después está en otra parte de la bitácora: el generador de la primera versión, con su partición hamiltoniana y su tabla de rangos calibrados, resultó ser la base sobre la que se reconstruyó el generador actual, y esa reconstrucción tiene su propio artículo con sus podas, su fórmula de calibración y su presupuesto de búsqueda.

Y un recordatorio con fecha: el issue #341 se abrió el 2 de septiembre a las 07:15 UTC, casi una hora antes de que se fusionara el pull request #342 a las 08:09 UTC. El mismo día que el juego entraba en el catálogo, ya estaba escrito que había que rehacer todo el algoritmo de generación de tableros. Algunas señales viajan más rápido que las feature branches.

## Referencias y documentación

**Repositorio y pull requests**

- [ArceApps/PuzzleHub](https://github.com/ArceApps/PuzzleHub) — repositorio canónico (anteriormente `ArceApps/PuzzleSuite`)
- [Issue #327 — Implementar Numberlink como siguiente juego](https://github.com/ArceApps/PuzzleHub/issues/327)
- [PR #342 — feat: add Numberlink as next game](https://github.com/ArceApps/PuzzleHub/pull/342)
- [PR #345 — tutorial y onboarding canónicos de 10 páginas](https://github.com/ArceApps/PuzzleHub/pull/345)
- [PR #346 — artwork 3D Cosmic Glassmorphism para museo y onboarding](https://github.com/ArceApps/PuzzleHub/pull/346)
- [PR #348 — contador de partidas jugadas en la card de home](https://github.com/ArceApps/PuzzleHub/pull/348)
- [Issue #341 — hay que rehacer todo el algoritmo de generación](https://github.com/ArceApps/PuzzleHub/issues/341)
- [Issue #347 — las partidas de numberlink no aparecen en la card de home](https://github.com/ArceApps/PuzzleHub/issues/347)

**Documentación interna de la feature**

- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-prd.md`
- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-spec.md`
- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-designs.md` (AD-1 a AD-9)
- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-plan.md` (execution log de las dos iteraciones)
- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-tasks.md`
- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-verify.md`

**Código de la feature**

- `features/numberlink/domain/logic/NumberlinkSolver.kt`, `NumberlinkPathValidator.kt`, `NumberlinkPuzzleGenerator.kt`, `NumberlinkDifficultyProfile.kt`
- `features/numberlink/presentation/screen/NumberlinkMenuScreen.kt`, `NumberlinkInfoScreen.kt`
- `features/numberlink/di/NumberlinkModule.kt`
- `app/src/test/.../features/numberlink/` (7 ficheros de test)

**Documentación oficial**

- [Numberlink en Nikoli](https://www.nikoli.co.jp/en/puzzles/numberlink/) — reglas de la variante y catálogo de la casa
- [Numberlink en Wikipedia](https://en.wikipedia.org/wiki/Numberlink) — historia y variantes del puzle
- [Compose:pointer input y gestos](https://developer.android.com/develop/ui/compose/touch-input/pointer-input) — `awaitEachGesture`, `awaitFirstDown` y `drag`
- [Compose: gráficos y `Canvas`](https://developer.android.com/develop/ui/compose/graphics) — renderizado del tablero
- [Room](https://developer.android.com/training/data-storage/room) — persistencia y versionado de la base de datos
- [Hilt para Android](https://developer.android.com/training/dependency-injection/hilt-android) — `@Binds`, `@Provides` y multibindings `@IntoMap`

**Artículos relacionados de esta bitácora**

- [Numberlink: el bug no era el algoritmo, era la calibración](/es/devlog/2026-w36-puzzlehub-numberlink-generator-calibration/) — la reconstrucción del generador y sus podas
- [PuzzleHub: estadísticas persistentes](/es/devlog/2026-w26-puzzlehub-estadisticas/) — el contrato de estadísticas que este juego tuvo que implementar
