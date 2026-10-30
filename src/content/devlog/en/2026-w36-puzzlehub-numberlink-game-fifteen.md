---
title: "Numberlink: how game 15 fitted into the catalog"
description: "A Nikoli puzzle joined the catalog as game number 15, dragging along 94 files, a purpose-built solver and two architectural corrections."
pubDate: 2026-09-02
lastmod: 2026-10-28
author: "ArceApps"
keywords: ["PuzzleHub", "Numberlink", "Android architecture", "algorithms", "testing"]
heroImage: "/images/devlog/puzzlehub-numberlink-game-fifteen.svg"
tags: ["Android", "Kotlin", "architecture", "algorithms", "devlog"]
draft: false
reference_id: "5dd7d4ec-ec1d-48f9-a940-7009a3879d52"
---

There is a particular way to review a new puzzle: you don't play it, you don't test it, you don't opine on whether it's fun. You check whether it fits. Whether the menu looks like every other menu, whether the routes landed where they were supposed to, whether the solver generates boards that don't fall over on the first mistake, and whether the museum catalog still has the same fifteen slots it had before.

Numberlink joined `ArceApps/PuzzleHub` on 2 September 2026 as the fifteenth game in the catalog. It wasn't a small addition: pull request #342 touched 94 files, added 8,030 lines, and moved `GameType` from 14 entries to 15. A week earlier, issue #327 had opened the door with a sentence that looked like bureaucracy: *"Orden de implementación: este juego debe implementarse antes que Hidato."*

That "before Hidato" is the only hint that this was not going to be a formality. What follows is the story of how a path-pairing puzzle fitted into a catalog that already had fourteen games, six architectural layers, and a battery of contract tests that refused to let anything pass that didn't fit the pattern.

## The starting point: an Obsidian task and an issue

Before there was a line of code, there was a note in the vault. In `vault/tareas/puzzlehub-implementar-numberlink.md` the task appears with `status: Hecho`, medium priority and four unchecked subtasks:

```
- [ ] Definir reglas, niveles de dificultad y tamaños de tablero.
- [ ] Implementar generación y validación de soluciones.
- [ ] Integrar la interfaz, controles, progreso y final de partida.
- [ ] Añadir estadísticas, onboarding y pruebas.
```

What's interesting is the work log on that same note, which reads: *"2026-08-26 — Completada. Tarea migrada a GitHub Issues del proyecto PuzzleSuite"*. The work stopped being a vault note and became issue #327, with those same four subtasks and the same priority. The sibling note for Hidato preserves the dependency explicitly: *"Comenzar después de completar la implementación de Numberlink"*.

That exchange explains why the implementation was staggered the way it was. Numberlink wasn't written in one go: it was written in phases, and every phase left behind a verifiable contract.

## Phase 1: the algorithmic core, and why the solver isn't the hard part

Phase 1 of the plan had seven tasks: domain entities, path validator, solver with prunings, generator with two-phase verification, move command, command serializer and tests. Four commits complete it, in this order:

```
dbd81b60 feat(numberlink): entidades de dominio T1.1
01055545 feat(numberlink): validador de caminos T1.2
ce6b2345 feat(numberlink): solver con podas T1.3
026c4a84 feat(numberlink): generator con verificación 2 fases T1.4
```

There's an easy temptation when reading this: assuming the hard part was the solver. That would be the wrong reading, because Numberlink's solver is surprisingly conventional. `NumberlinkSolver` is a DFS that grows each path from its source toward its sink, with an MRV heuristic (extend the most constrained front), dead-end detection and connectivity pruning. The default budget is 2,000,000 search nodes, and at most 2 solutions are accepted.

```
const val DEFAULT_MAX_SEARCH_NODES = 2_000_000
const val DEFAULT_MAX_SOLUTIONS = 2
```

What the solver does is find *one* solution and, if it finds a second, demonstrate that the puzzle has no unique solution. That's why the limit of two solutions isn't arbitrary: it's the cheapest way to refute uniqueness.

The validator (`NumberlinkPathValidator`) is where the rule that defines the game lives. In the *strict* variant we chose, the union of all paths must cover exactly the board's cells, paths cannot cross or share a cell, and only orthogonal moves are allowed. The completion check is a single line:

```kotlin
return covered.size == puzzle.totalCells
```

And the possible errors are enumerated as an enum with seven cases: `OUT_OF_BOUNDS`, `NOT_ORTHOGONALLY_ADJACENT`, `CELL_OCCUPIED_BY_OTHER_PAIR`, `PAIR_ALREADY_COMPLETE`, `INVALID_ACTIVE_PAIR`, `PUZZLE_ALREADY_COMPLETE`, `INVALID_CURRENT_STATE`. That enum is the difference between "the game broke" and "the player tried something illegal". A puzzle game needs both answers, and only the second one is interesting to the user.

The design decision that explains almost everything else is **AD-1: the strict variant with full coverage**. In the design document, the rejected alternative was the free variant, where cells may be left uncovered. Strict was chosen because it simplifies validation, and because it's the variant usually seen in Nikoli publications. The cost gets paid later, in the generator, and that cost is already documented elsewhere in this devlog: [the article on recalibrating the generator](/devlog/2026-w36-puzzlehub-numberlink-generator-calibration/).

## Phase 1.4: the generator that builds first and hides second

The first version's generator follows an approach the code itself describes without any hedging: build a solution first, then hide the paths.

```kotlin
/**
 * Algoritmo (Approach A): se construye un camino hamiltoniano aleatorio que cubre
 * todas las celdas del tablero y se corta en N segmentos (uno por par). Los extremos
 * de cada segmento son los endpoints del par.
 */
```

Two pieces deserve attention. The first is `tryHamiltonianPath`, which looks for a path visiting every cell exactly once, with an explicit budget of 500,000 nodes and backtracking when it gets stuck.

The second is `splitHamiltonian`, and its detail is subtler than it first appears. When cutting the path into N segments, the cuts aren't chosen at random: they're preferentially taken where the adjacent cells touch the board edge, because that leaves at least one endpoint on the edge of each segment.

```kotlin
/**
 * Corta el camino hamiltoniano en [pairCount] segmentos contiguos. Para anclar
 * los caminos de la solución se prefieren cortes cuyas celdas adyacentes tocan
 * el borde del tablero: cada segmento queda con al menos un endpoint en el
 * borde, lo que vuelve los caminos más forzados y reduce soluciones alternativas.
 */
```

The intuition behind it is sound: an endpoint on the edge has fewer ways out, so the path becomes more constrained and a second complete solution becomes harder to come by. If there aren't enough edge cuts available, it falls back to random cuts.

Uniqueness verification, in turn, happens in two phases, and that structure is what the current generator inherits:

```kotlin
private const val MAX_PROBES = 1_000
private const val MAX_HAMILTONIAN_NODES = 500_000
private const val PROBE_SEARCH_NODES = 40_000
```

First, a cheap *probe* with 40,000 nodes quickly discards non-unique instances; only candidates that survive move on to the full solver. Each candidate is accepted only if the solver confirms **exactly** one solution without exhausting the budget. If the budget runs out, the honest answer is "I don't know", and the generator keeps looking. When the budget is exhausted entirely, you get the `error("Generator failed to verify a unique puzzle within its search budget")` that would eventually motivate issue #341.

## What "fitting in" means: 14 registration points to touch

A new game isn't just a folder of code. In `PuzzleHub`, a game becomes a member of the catalog by registering itself at a stream of extension points, and each one has rules of its own that somebody had to write first.

| Extension point | What Numberlink had to satisfy |
|---|---|
| `GameType` | 14 entries become 15; `NUMBERLINK("numberlink")` with its own `routePrefix` |
| `AllGamesSizeLists` | `GameType.NUMBERLINK` mapped to 5×5, 6×6, 7×7 and 8×8 |
| `GameTutorialGameCatalog` | a `"numberlink"` entry so the interactive tutorial is reachable |
| `NumberlinkRoutes` | six constants: `MENU`, `GAME`, `STATS`, `ACHIEVEMENTS`, `HISTORY`, `INFO` |
| `MainActivity` | six new `composable(...)` entries in the navigation graph |
| `ChallengeModule` | `@IntoMap @GameTypeKey(GameType.NUMBERLINK)` for Daily Challenge |
| `BufferConfig` | `GAME_NAME_NUMBERLINK` for the background generation worker |
| `GameStatsHistoryAdapter` | `@IntoMap @GameStatsHistoryKey(GameType.NUMBERLINK)` for the stats facade |
| `NumberlinkModule` | `@Binds` for repositories plus a `@Provides @Singleton` generator |
| `GenericGameInfoScreen` | `"numberlink" -> Icons.Filled.Extension` in the generic resolver |
| `GameArtRepositoryImpl` | a link to `R.drawable.art_numberlink` |
| `museum-game-art-catalog-spec.md` | the size invariant raised from 14 to 15 works |
| `NumberlinkShareBoard` | a results share card, in the shared share-board catalog |
| `.specai/backlog.json` | entry 61, `status: verifying` |

That last row is worth dwelling on, because it explains the final tone of the story. The backlog entry wasn't closed as `done`. It was set to `verifying`, with a note that the artifacts were reconciled but formal verification was still blocked.

The museum catalog is a good illustration of why these extension points aren't cosmetic. The `museum-game-art-catalog-spec.md` specification states that the catalog holds exactly 15 works and that `result.size == 15`. When Numberlink's artwork arrived, that invariant went from 14 to 15, and the test verifying it had to change with it. A catalog that is self-consistent under test is a catalog that can grow without anyone noticing by hand.

The three pull requests from that afternoon rounded off the work with material that isn't algorithm but content and polish:

```
#345 feat(numberlink): redesign interactive tutorial and onboarding to canonical 10-page sequence
#346 feat(numberlink): 3D Cosmic Glassmorphism artwork for museum and onboarding (#343)
#348 fix(home): display numberlink played games count on home card (#347)
```

The issue #347 that #348 closed tells the whole story: *"En el juego numberlink no aparecen las partidas jugadas en la card de l[uego] en la pantalla de la home de la app"*. Adding a new game isn't enough to register it in the menu: it also has to show up on the home screen with its statistics. The fix was a reactive query, `getPuzzlesCount()` on `NumberlinkPuzzleDao`, exposed as a `Flow<Int>` and combined into the `HomeViewModel`'s `gameStats`.

## The moment the catalog said "this doesn't fit"

This feature's contracts weren't written at the end: they were written first, and there are tests documenting that sequence. `NumberlinkMenuContractTest` exists with three tests verifying very specific behaviours, among them that the generated puzzle id is forwarded to the host **exactly once**:

```kotlin
assertTrue(source.contains("onGenerate = { viewModel.generate(onNavigateToGame) }"))
assertFalse(source.contains("onNavigateToGame(NumberlinkRoutes.game(id))"))
```

That `assertFalse` isn't decorative. It's the direct answer to a real bug. The feature's execution log preserves the textual problem report, unedited:

> *"Al darle click a generar tablero la aplicación crashea porque intenta navegar a `numberlink_game/numberlink_game/<id>`. El menú de Numberlink no usa el color de su categoría, debe seguir los componentes genéricos y la coherencia de los demás juegos, y hay que quitar "see a path come together" porque no aporta y no existe en los otros menús."*

Three defects in a single message, and not one of them was an algorithmic problem:

1. **A doubled route prefix.** The canonical route `numberlink_game/{puzzleId}` already includes the prefix, and the generation callback wrapped it a second time. The result was a route that didn't exist in the graph.
2. **Accent colour instead of category colour.** The menu used `getGameAccent(GameType.NUMBERLINK)` where the house pattern is `getCategoryColor(GameType.NUMBERLINK)`, which must in turn match Zip's.
3. **An exclusive card that existed in no other menu.** The *"See a path come together"* card, with its resource and its animation logic, was removed.

The second test pins this down precisely, and the comparison against Zip isn't arbitrary:

```kotlin
assertEquals(
    ChallengeThemeUtils.getCategoryColor(GameType.NUMBERLINK),
    ChallengeThemeUtils.getCategoryColor(GameType.ZIP)
)
```

The third one deserves an honest caveat, because it's the kind of detail that gets misreported by accident. That test doesn't check that the "See a path come together" card exists. It checks that it **does not**:

```kotlin
assertFalse(source.contains("NumberlinkDemoCard"))
assertFalse(source.contains("numberlink_menu_demo_title"))
assertFalse(source.contains("demoSolution"))
```

There is no `NumberlinkDemoCard` anywhere in the repository's history: the card was designed and discarded before it ever reached code. The contract doesn't protect a feature, it protects its absence, so nobody reintroduces it tomorrow. That's more valuable than it looks, because the temptation to "add a nice little demo to the menu" is exactly the kind of detail that makes a menu drift away from the common pattern.

The second iteration of the same day was a different category of problem. The report said: *"Hay que generar la pantalla de información completamente como en el juego Waypoint de ejemplo y guía, verificando que tiene los mismos apartados, diseño, etc."* The root cause was of another kind: `NumberlinkInfoScreen` already delegated to `GenericGameInfoScreen`, but its Markdown document contained only simple headings, and the shared parser expected `<details>` blocks with `<summary>`. The screen rendered, but it had none of the expandable cards, none of the stats block, and none of the subtitle that Waypoint had.

The fix was to complete the EN and ES documents with the same catalogue and semantic order as Waypoint: Summary, Statistics, rules, controls, history and origin, strategies and techniques, beginner tips, cognitive benefits, variants, FAQ and credits. And to add `NumberlinkInfoDocsCatalogTest` so the catalogue gets verified in both languages. That test is the readable form of "the order of the sections matters", which a string-equality test couldn't express.

## What stayed unverified, and why saying so matters

This is where the work separates from a normal devlog entry, and where the repository itself is more honest than I would be if I limited myself to summarizing.

The feature's `verify.md` lists 80 or more criteria, most of them marked complete. But the document itself is explicit about what **could not** be verified:

```
- V9.1: no se generó un informe formal de cobertura superior al 80%.
- V9.5: no se ejecutó `lint`.
- V11.1–V11.4: no se tomó una medición de rendimiento instrumentada.
- Aceptación visual en emulador/dispositivo: `android` y `adb` no están
  disponibles en el entorno.
```

And the tasks that remained pending carry the reason written next to them, not hidden:

```
- [ ] T9.3 Tests de integración de repositorios — Pendiente: la suite actual no contiene un harness Room de Numberlink
- [ ] T9.7 Verificación final contra checklist — Pendiente: aceptación visual en dispositivo/emulador
```

The final state of the feature is literally `🟡 IN PROGRESS`. The reconciliation log says it without embellishment: *"Progreso pendiente: no hay Gate UA aceptado, el verifier no está en PASS y siguen pendientes T9.3/T9.7/V9.1/V9.5/V11.1–V11.4"* and *"No se marca ningún criterio ni gate como pasado en esta reconciliación"*.

What *is* verified is concrete: `compileDebugKotlin` green, `assembleDebug` green, the full `testDebugUnitTest` green with `tests=1311, failures=0, errors=0, skipped=48`, `git diff --check` green and `SPEC_DRIFT` in PASS. The feature's unit test suite in particular is seven files under `app/src/test/.../numberlink/`, including the menu, generation, path validator, tutorial and info catalogue contracts.

There's one nuance worth not losing: performance went unmeasured, and that gap had consequences only visible later. Criteria V11.1 through V11.4 asked for generation under 2 seconds on 5×5 to 7×7 boards, under 5 seconds on 8×8, real-time validation under 16 ms per move, and a solver under 3 seconds. None of them were measured. Weeks later, generator calibration became the project's central problem, and this is one of the blind spots that contributed to it travelling so far before anyone noticed.

That's, I think, the most transferable lesson in this work. A checklist with 80 green verification marks says far less than four lines enumerating what couldn't be checked. What went unmeasured isn't process noise: it's the map of what can break without anyone noticing.

## What I learned

**A new game is a contract with the catalog, not a folder of files.** Every extension point has its own rules, and each one is a place where a new game can fail to fit. The fourteen rows in that table aren't bureaucracy: they're the reason the museum's 15-work invariant and the category colour shared with Zip can be verified by a test instead of by eye.

**The most valuable contract is the one that says "this must not exist".** `assertFalse(source.contains("NumberlinkDemoCard"))` protects a feature that was never implemented. It's a cheap test against the most common temptation in a menu: adding something that only makes sense for one particular game.

**When the pattern is "every menu does the same thing", the test should compare against another game, not against a constant.** The colour test doesn't check `assertEquals(color, 0xFF00FF)`. It compares against `getCategoryColor(GameType.ZIP)`. If the category palette ever changes, both games change together and the test keeps telling the truth about what actually matters: that Numberlink looks like Zip.

**Writing down what you couldn't verify is part of the work.** This feature's `verify.md` is, to me, one of the most useful documents I've written. It says what was executed (`compileDebugKotlin`, `assembleDebug`, `testDebugUnitTest`, `git diff --check`, `SPEC_DRIFT`), with numbers (`1311` tests, `0` failures, `48` skipped), and it says what wasn't executed and why. A checklist that can only tick green boxes is worth nothing; one that enumerates the holes is worth something, because those holes are the list of things that can break in silence.

## Continuity

This entry covers Numberlink's arrival in the catalog between 26 August and 2 September 2026. What came next lives elsewhere in the devlog: the first version's generator, with its Hamiltonian partition and its table of calibrated ranges, turned out to be the base on which the current generator was rebuilt, and that rebuild has its own article, with its prunings, its calibration formula and its search budget.

And one reminder with a timestamp: issue #341 was opened on 2 September at 07:15 UTC, almost an hour before pull request #342 merged at 08:09 UTC. On the very day the game entered the catalog, it was already written that the whole board-generation algorithm had to be redone. Some signals travel faster than feature branches.

## References and documentation

**Repository and pull requests**

- [ArceApps/PuzzleHub](https://github.com/ArceApps/PuzzleHub) — canonical repository (formerly `ArceApps/PuzzleSuite`)
- [Issue #327 — Implementar Numberlink como siguiente juego](https://github.com/ArceApps/PuzzleHub/issues/327)
- [PR #342 — feat: add Numberlink as next game](https://github.com/ArceApps/PuzzleHub/pull/342)
- [PR #345 — canonical 10-page tutorial and onboarding](https://github.com/ArceApps/PuzzleHub/pull/345)
- [PR #346 — 3D Cosmic Glassmorphism artwork for museum and onboarding](https://github.com/ArceApps/PuzzleHub/pull/346)
- [PR #348 — played games counter on the home card](https://github.com/ArceApps/PuzzleHub/pull/348)
- [Issue #341 — the whole generation algorithm has to be redone](https://github.com/ArceApps/PuzzleHub/issues/341)
- [Issue #347 — numberlink games don't show up on the home card](https://github.com/ArceApps/PuzzleHub/issues/347)

**Internal feature documentation**

- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-prd.md`
- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-spec.md`
- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-designs.md` (AD-1 through AD-9)
- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-plan.md` (execution log for both iterations)
- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-tasks.md`
- `docs/specai/20260827-implementar-numberlink/20260827-implementar-numberlink-verify.md`

**Feature code**

- `features/numberlink/domain/logic/NumberlinkSolver.kt`, `NumberlinkPathValidator.kt`, `NumberlinkPuzzleGenerator.kt`, `NumberlinkDifficultyProfile.kt`
- `features/numberlink/presentation/screen/NumberlinkMenuScreen.kt`, `NumberlinkInfoScreen.kt`
- `features/numberlink/di/NumberlinkModule.kt`
- `app/src/test/.../features/numberlink/` (7 test files)

**Official documentation**

- [Numberlink at Nikoli](https://www.nikoli.co.jp/en/puzzles/numberlink/) — rules for the variant and the house catalogue
- [Numberlink on Wikipedia](https://en.wikipedia.org/wiki/Numberlink) — history and variants of the puzzle
- [Compose: pointer input and gestures](https://developer.android.com/develop/ui/compose/touch-input/pointer-input) — `awaitEachGesture`, `awaitFirstDown` and `drag`
- [Compose: graphics and `Canvas`](https://developer.android.com/develop/ui/compose/graphics) — board rendering
- [Room](https://developer.android.com/training/data-storage/room) — persistence and database versioning
- [Hilt for Android](https://developer.android.com/training/dependency-injection/hilt-android) — `@Binds`, `@Provides` and `@IntoMap` multibindings

**Related devlog entries**

- [Numberlink: the bug wasn't the algorithm, it was the calibration](/devlog/2026-w36-puzzlehub-numberlink-generator-calibration/) — the generator rebuild and its prunings
- [PuzzleHub: persistent statistics](/es/devlog/2026-w26-puzzlehub-estadisticas/) — the statistics contract this game had to implement
