---
title: "Numberlink: the bug wasn't the algorithm, it was calibration"
description: "A uniqueness crash and 56 of 64 cells turned into numbers: how I rebuilt the Numberlink generator from the search budget up to the pair quotas."
pubDate: 2026-09-09
lastmod: 2026-10-21
author: "ArceApps"
keywords: ["PuzzleHub", "Numberlink", "procedural generation", "Kotlin", "Android"]
heroImage: "/images/devlog/puzzlehub-numberlink-generator-calibration.svg"
tags: ["Android", "Kotlin", "procedural generation", "algorithms", "devlog"]
draft: false
reference_id: "puzzlehub-numberlink-generator-calibration"
---

There's a kind of bug that doesn't resemble any other. It isn't a race condition, it isn't a memory leak, it isn't a `null` that slipped through a badly written `when`. It's a bug that works exactly as it was asked to. It runs, throws no exceptions, honours its technical contract. And the result is still garbage.

On 2 September 2026 I opened issue #341 in `ArceApps/PuzzleHub` because Numberlink was handing me two very different symptoms of the same underlying problem: a reproducible crash on one difficulty, and — on the easy difficulties — boards that didn't look anything like a logic puzzle.

The crash was honest and easy to read:

```
java.lang.IllegalStateException: Generator failed to verify a unique puzzle within its search budget
    at com.arceapps.puzzlesuite.features.numberlink.domain.logic.NumberlinkPuzzleGenerator.generate(NumberlinkPuzzleGenerator.kt:111)
```

The other symptom wasn't a crash. That was worse, because no `try-catch` would fix it. On easy, the board came back practically full of numbers. What I wrote in the issue was literal: *"it's just joining numbers that come out next to each other."*

This article is the story of how I investigated that problem, why the obvious answer — "the algorithm is wrong, rewrite it" — was the wrong answer, and what I did with the conclusion instead. It's also the record of five days of work that ended in commit `2e471a80`, though the route there spanned three iterations and a plan file close to a megabyte.

One honesty note before we start, and it deserves its own paragraph: **the repository was renamed.** The code, the issues, and part of the internal documentation still say `PuzzleSuite` because that's what it was called when they were written. The canonical repository today is `ArceApps/PuzzleHub`. Every link in this article points at the current name; verbatim quotes keep the original.

## The shape of the problem: why this search is bitter

Before touching a line of code it's worth writing the problem on paper, because every decision below follows from one concrete fact: **there is no cheap way to know whether a Numberlink board has a unique solution.**

The variant we implement is the *strict* one: the union of all paths must cover exactly the `W × H` cells of the board. Each pair of matching endpoints is joined by an orthogonal path, paths never cross or share a cell, and every puzzle must have exactly one solution. The contract is written in the initial implementation spec (`docs/specai/20260827-implementar-numberlink/`):

> "All paths together must cover the entirety of the board's cells (strict variant)."
> "Every puzzle has a unique solution."

That last point is what keeps us awake. There's an academic result that demonstrates it quite directly: *Zig-Zag Numberlink is NP-Complete* (Adcock et al., 2014, [arXiv:1410.5845](https://arxiv.org/abs/1410.5845)). If the problem is NP-complete, no polynomial-time algorithm can verify uniqueness in the general case. The practical consequence, recorded in the research document, governs the entire design:

> "There is no polynomial algorithm for uniqueness verification in the general case. Verification must use heuristics (A*, backtracking with pruning) and accept a bounded search budget as an operational proof of uniqueness."

In other words: **the search budget isn't a performance patch, it's part of the correctness model.** When the solver runs out of budget, the honest answer isn't "no solution exists" — it's "I don't know." For months the code did not distinguish the two. That's the seed of the crash.

## What the budget was hiding

The v1 generator (`NumberlinkPuzzleGenerator.kt`, as it stood on 2 September, the day of the crash report) worked with this table of calibrated ranges:

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

Look at what that table says. On an 8×8 board (64 cells) at easy difficulty, the generator was choosing between **28 and 31 pairs**. Each pair is two endpoints. That's between 56 and 62 cells occupied by numbers — 87 % of the board, according to the redesign PRD itself:

> "This causes between 56 and 62 of the board's 64 cells to be contiguous numeric endpoints with segments of length 1–2, completely distorting the playful and interactive experience by turning the puzzle into a mere union of trivial adjacent cells with no spatial deduction."

That's the real bug. It wasn't a connectivity problem or a partitioning problem. It was an **arithmetic** problem: we were asking the combinatorial space for 28 disjoint solutions inside 64 cells, a target that approaches impossibility by construction. The solver wasn't failing. The solver was correctly answering a badly-posed question, and when its budget ran out, `error(...)` turned that "I don't know" into an `IllegalStateException` nobody caught at the UI layer.

Which is why the crash didn't show up at every size or difficulty. At 5×5, where the easy range was `8..11`, the arithmetic was reasonable and the budget was enough to resolve it. At 8×8 expert (`20..24` pairs competing for cells under strict coverage), the free space was so small the solver couldn't find uniqueness within 500,000 nodes. The v1 table really did contain two bugs wearing one costume: the absurd calibration, and a budget that couldn't tell "impossible" apart from "not guaranteed."

## The investigation: three architectures and a verdict

Before rewriting anything I wrote a 38 KB research document (`docs/specai/20260903-numberlink-generator-redesign/20260904-numberlink-generator-research.md`) comparing three strategies. Not for method's sake — because the instinct to "rewrite the algorithm" had already produced a crash, and I didn't want to repeat the cycle by trusting design intuition again.

**Architecture A — organic synthesis with parenthesis pruning** (in the style of the `ste42` generator). It starts from an empty grid and grows corners and segments via Weighted Backward Generation, with Parenthesis Balance, Side Stakes, and Locked Blocks rules. It's seed-deterministic and very fast: the research records `ste42` solving its 270-puzzle suite in 0.14 s and generating 40×10 instantly.

The verdict, verbatim:

> "It does not guarantee uniqueness. It requires `NumberlinkSolver` as a second phase (post-processing)."

There's the reason underneath: **any generator that doesn't own a solver cannot promise uniqueness.** Thomas Ahle, author of the most-cited reference implementation, says it plainly in his own README, and the research reproduces it:

> "You can't use numberlink for checking if a puzzle is unique. Indeed numberlink will assume the puzzle has just one solution and only it such that the solution uses 100% of the paper and no link touches itself."

What *was* worth keeping from it was the parenthesis pruning idea, which survived as an adopted technique.

**Architecture B — incremental SAT verification** (Sat4j or Z3). Formally the cleanest option: CNF, solver, uniqueness proven by exhausting the satisfactions. The documented drawbacks are three, and all three are real:

> "Sat4j adds ~600 KB to the APK."
> "For our 8 s budget at 10×15=150 cells with ~12 colours, the CNF would have ≈ 6,000 vars and 200,000 clauses: probably borderline."
> "High learning curve for the team."

It was rejected — not because it was wrong, but because adding 600 KB to a puzzle game, plus a CNF encoder we have to maintain forever, isn't a trade I want to make in a catalogue app.

**Architecture C — Hamiltonian carving.** That is, literally, what we already had. And the verdict on it is the sentence that reorganised the whole job:

> "It is the source of the reported bug: it produces 'easy' boards with too many pairs because Hamiltonian path partitioning naturally generates long, well-defined segments, but does not impose fine control over the spatial distribution of endpoints or over interleaving density."

Note the nuance, because it's important and easy to lose: the verdict does **not** say the Hamiltonian algorithm is wrong. It says it is "functionally correct for the 'full coverage' subproblem" but "orthogonal to the 'calibrated difficulty' problem." The final diagnosis leaves no room for ambiguity:

> "The user's bug is not an algorithm failure: it is a badly chosen calibration (`CALIBRATED_PAIR_RANGES`)."

That sentence is the centre of this article. Everything after it follows from accepting it.

## The formula that replaced the invented numbers

If the problem is calibration, the right question is: how many pairs is correct? I didn't answer that from intuition. The answer came from the literature. The research records that industry ratios converge on `k ≈ √(W·H)` as optimal density, and that Thomas Ahle proposes a correction for aspect ratio:

```text
K_target = round( α_d · √(W · H) · β_aspect )

α_d      = EASY: 0.50 · MEDIUM: 0.70 · HARD: 0.85 · EXPERT: 1.00
β_aspect = 1 + 0.15 · (1 − min(W,H) / max(W,H))
```

The `β_aspect` term corrects for asymmetry: a 7×10 board isn't the same shape as an 8×12, so the same pair count doesn't produce the same experience. Applying the formula, the change in `NumberlinkDifficultyProfile` is surgical:

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

From 28–31 pairs to 6–7. An order of magnitude. And the direction inverts sensibly: in v1, more pairs meant "easier" (more numbered cells, less deduction). In v2, more pairs is "harder" (less free space per pair, more interleaving). Today's table, now covering the rectangular sizes that issue #352 later added, keeps the same criterion:

```kotlin
/** Approximately sqrt(area); adjacent difficulty bands intentionally overlap. */
```

That comment is a design decision disguised as a comment: difficulty bands deliberately overlap, because a puzzle isn't a discrete category.

## What did have to be rewritten: the pruning that makes calibration work

Changing the table wasn't enough. At 6–7 pairs the generator has far more free space, and the risk of ambiguity goes up accordingly. The four mechanisms below are verified against the code **of that version** — commit `dc01b3e1`, which is where 2×2 pruning was introduced — not against the current state of `main`, where the architecture is a different one:

**1. Minimum length and Manhattan distance.** In `isValidPartition` (commit `dc01b3e1`):

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

Two cells aren't a path, they're an edge. And two orthogonally adjacent endpoints aren't a path either.

**2. 2×2 anti-ambiguity pruning.** A 2×2 block with two swappable parallel transitions produces symmetries: the same region can be solved in two equivalent ways, and the solver counts them as distinct solutions. `hasAmbiguous2x2` builds auxiliary colour and path-index grids and compares them:

```kotlin
val h0 = kotlin.math.abs(pathIndex[c00] - pathIndex[c01]) == 1
val h1 = kotlin.math.abs(pathIndex[c10] - pathIndex[c11]) == 1
if (h0 && h1) return true
```

**3. Dead-end pruning in the solver.** This is the most interesting part algorithmically, and the plan records the result with a concrete figure: `O(1)` tracking of active fronts (`isFront`) plus a minimum-degree check on free cells (≥ 2) and sinks (≥ 1), yielding an "80 % reduction in nodes explored by the solver." The real code (`NumberlinkSolver.kt`) confirms it:

```kotlin
if (hasDeadEmptyCell()) return false
if (hasStrandedColor()) return false
```

`hasDeadEmptyCell` (line 161) detects free cells that can no longer receive enough path incidences; `hasStrandedColor` (line 164) prunes incomplete pairs that can no longer reach their endpoint. These are *structural viability* prunes, not correctness ones: they eliminate branches the DFS was going to explore only to arrive at a dead end.

**4. A two-phase budget.** `DefaultNumberlinkUniquenessSolver` separates a speculative search from the confirmation:

```kotlin
const val DEFAULT_PROBE_MAX_NODES = 15_000
const val DEFAULT_CONFIRM_MAX_NODES = 60_000
```

The probe is cheap and discards most candidates; the confirm is the one that certifies. The invariant is explicit in `NumberlinkUniqueness.kt`:

> "A puzzle is considered unique and accepted if and only if both probe and confirmation phases found exactly 1 solution with COMPLETED stop reason."

Look at that word — `COMPLETED`. If the solver stops because of the node limit or the deadline, the result is "inconclusive," not "not unique." That distinction is what turns a bug into a feature of the contract.

## Cutting the budget 10×: the counterintuitive decision

The part I struggled to defend internally was reducing the budget. The reasoning went: if the generator fails by exhausting its budget, the obvious fix is to give it more budget. I did the opposite.

```kotlin
// v1
const val MAX_HAMILTONIAN_NODES = 500_000
const val PROBE_SEARCH_NODES = 40_000

// v2
const val MAX_HAMILTONIAN_NODES = 50_000   // was 500_000: 10× less
const val PROBE_SEARCH_NODES = 15_000
const val DEFAULT_CONFIRM_SEARCH_NODES = 60_000
const val DEFAULT_TIME_BUDGET_MS = 8_000L
```

Here's the justification: with correct calibration, the space the solver has to explore is much smaller. A huge budget doesn't guarantee finding the solution; in the worst case it guarantees taking a long time to discover there isn't one. Dropping to 50,000 nodes is an assertion about generator quality — if a candidate can't find uniqueness within 50,000 nodes, it probably doesn't have any, and the time we spent looking would have been better spent on another candidate.

And here comes the piece that turns a crash into a message. `NumberlinkMenuViewModel` started treating the failure as what it is — an expected state of the system:

```kotlin
} catch (e: Exception) {
    if (e is kotlinx.coroutines.CancellationException) throw e
    android.util.Log.e("NumberlinkMenuViewModel", "Error generating puzzle", e)
    if (id == requestId) _ui.value = _ui.value.copy(showRetryDialog = true)
}
```

The `CancellationException` re-throw is the detail I care about most, because it's the easiest error to convert into a bug: without that line, `catch (e: Exception)` swallows the cancellations of structured concurrency too, and the UI waits forever for a result that will never arrive.

## Compatibility: versioning instead of migrating

Changing the algorithm underneath saved games is a data problem, not a code problem. The solution was deliberately boring: a column.

`NumberlinkPuzzleEntity` carries `val generatorVersion: Int` defaulting to `1`, and the repository writes `NumberlinkPuzzleRepository.GENERATOR_VERSION` on every new puzzle. When the calibration table changed, `GENERATOR_VERSION` went from `1` to `2` in commit `d0454070`, with this justification:

> "Required to cleanly trace and invalidate games from previous sessions generated with the legacy v1 algorithm"

The key point is that the database **did not** change version. `NumberlinkDatabase` stays at `version = 1`, with no destructive migration. Old sessions deserialise with `generatorVersion = 1` and render perfectly, because the stored format (pairs, paths, metrics, hints as JSON) didn't change. The version is informational, not destructive.

Migrating would look more elegant and be worse in practice: we'd have had to rewrite the saved games of everyone still replaying the same puzzle under a different algorithm. The rule we adopted, now written into the contract, is: **changing the generator must not change the schema of what's already on disk.**

## Verification: executable contracts, not code review

The way this got tested was a contract suite, not a manual review. Commit `470743a5` added exhaustive tests whose names state the property they defend:

- `rectangularBoardsReturnVerifiedUniquePuzzles`
- `generatorIsDeterministic_sameSeedProducesIdenticalPuzzleAndSolution`
- `shikakuSizesReturnVerifiedUniquePuzzles`
- `everySupportedRectangularSizeAndDifficultyReturnsVerifiedUniquePuzzle`

That last one is my favourite: it doesn't check that some particular board is unique, it checks that **the generator never returns an uncertified board**, for any supported size/difficulty combination. That's the difference between testing the output and testing the contract.

Determinism, meanwhile, isn't a luxury. With `Random(seed)` as the only source of randomness, the same `(size, difficulty, seed)` tuple always produces the same puzzle and the same solution. That turns the generator into a testable function and lets contract tests assert on concrete values instead of vague properties.

### An uncomfortable admission about benchmarks

There's a task in the plan marked `[x]`: *"Task I3-1: Reproduce and benchmark 7x10 EASY generation across multiple random seeds"*, pointing at a file `NumberlinkGenerationBenchmarkTest.kt`. That file does not exist. I checked the current tree and the entire git history: `git log --all --diff-filter=A` for that name returns nothing. It never existed.

I found this after signing the work off, reading the plan line by line. The task is marked complete in the document, but no artefact backs it. I don't know how it happened — most likely marked during a verification iteration and lost when the tree was rewritten. I'm writing it down here because it's exactly the kind of debt that spreads silently, and because a plan whose checkmarks don't correspond to reality is worse than a plan with no checkmarks at all.

What does exist as performance evidence are estimates recorded in the research document (with the hypothesis stated explicitly: "CPU ARM Cortex-A78"): 7×10 → 550 ms; 8×12 → 1.3 s; 10×15 → 5.5 s with one retry, 8 s timeout with three. These are estimates, not measurements, and I treat them as such.

## Onward to v3: why this wasn't the end

The week of 10 to 21 September continued with `GENERATOR_VERSION` climbing to 3. The reason sits in issue #352, still open, and in its title: *"Numberlink Generator v3 — Hamiltonian + 2-opt + DP + uniqueness + logical difficulty + buffer"*.

Why v2 wasn't enough is precise, and the PRD states it: v2 builds "straight street" covers and uses `twoLanePath` in one special case, producing "limited geometry." Translated: the boards come out legible, but with the runs always in the same directions, which lets players recognise patterns from one game to the next.

v3's answer was to build the cover as a genuine Hamiltonian cycle and then work on it: randomised DFS with a Warnsdorff-like heuristic, deterministic perturbation as fallback, `2-opt` with strict improvement and lexicographic tie-breaking so the result stays reproducible, and dynamic-programming partitioning on top. All of it lands on the same invariant: certified uniqueness, bounded budget, and difficulty that is *measured* rather than declared.

One design detail I like a great deal, and which deserves highlighting: the difficulty score formula is explicitly written not to depend on the requested difficulty.

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

Asking for easy and scoring easy on the same scale is the classic trap of circular calibration: the generator complies and nobody knows whether the puzzle was genuinely easy. Separating measurement from request is what makes the difficulty profile auditable.

## What I take from this cycle

Three things, none of them about Numberlink.

**A search budget is a semantic decision, not a performance one.** When the solver can't answer, the correct response is "inconclusive." The distance between returning an exception and returning a properly named state is the distance between a crash and a retry dialog.

**The most expensive bug isn't in the code, it's in the numbers.** The Hamiltonian algorithm was correct. What was broken was a `28..31` range nobody had derived from anything. If the problem looks algorithmic and your investigation says otherwise, you have to be willing to throw away committed work and recalibrate — even when it stings, especially when the git log already says "generator."

**Writing the investigation before the rewrite is the only way not to try it again.** None of the three big wins that week (dead-end pruning, DP partitioning, `2-opt` with stable tie-breaking) occurred to me from reading the old code. They came out of a document that compared three algorithms and wrote, without ornament, that the architecture we already had was correct for its subproblem and orthogonal to the one that hurt.

One task stays open, because honesty requires it: issue #352 is still open, PR #354 is still unmerged, and v3's `Gate UA` remains PENDING. The work I can account for with tests is finished; the work that isn't, I won't call good until I've seen it in the app.

## References and documentation

- **Repository (current canonical name)**: [ArceApps/PuzzleHub](https://github.com/ArceApps/PuzzleHub) — formerly `ArceApps/PuzzleSuite`, same repository, id 1035648947.
- **Issue #341**: [The numberlink game's board generation algorithm has to be redone entirely](https://github.com/ArceApps/PuzzleHub/issues/341)
- **Issue #352**: [Numberlink Generator v3 — Hamiltonian + 2-opt + DP + uniqueness + logical difficulty + buffer](https://github.com/ArceApps/PuzzleHub/issues/352)
- **PR #351**: [Merge Numberlink board visual redesign](https://github.com/ArceApps/PuzzleHub/pull/351)
- **Key commits**: `dc01b3e1` (v2 generator with anti-ambiguity pruning), `d0454070` (`GENERATOR_VERSION` 1→2), `470743a5` (exhaustive contract tests), `65194ed4` (solver pruning and non-trivial quotas), `92cf2bb7` (multi-cut generation for Shikaku sizes).
- **Internal documentation**: `docs/specai/20260903-numberlink-generator-redesign/` (prd, spec, designs, plan, tasks, verify) and `docs/specai/20260904-numberlink-generator-research.md`.
- **Code**: `NumberlinkPuzzleGenerator.kt`, `NumberlinkSolver.kt`, `DefaultNumberlinkUniquenessSolver.kt`, `DefaultNumberlinkCheapFilter.kt`, `NumberlinkPathValidator.kt`, `NumberlinkDifficultyProfile.kt`, `NumberlinkUniqueness.kt`.

### External documentation

- Adcock, Demaine, Demaine, O'Brien, Reidl, Sánchez Villaamil, Sullivan — [Zig-Zag Numberlink is NP-Complete](https://arxiv.org/abs/1410.5845) (arXiv:1410.5845, 2014). The theoretical basis for why uniqueness is verified under a bounded budget.
- Thomas Ahle — [numberlink](https://github.com/thomasahle/numberlink). The reference implementation; its README carries the warning about not being usable to check uniqueness.
- Matt Zucker — [mzucker/flow_solver](https://github.com/mzucker/flow_solver). SAT-based uniqueness verification benchmarks used to size the rejected alternative.
- [Sat4j](https://gitlab.ow2.org/sat4j/sat4j) — pure-Java SAT solver, the alternative evaluated and rejected on APK size and encoding cost.
- [Jetpack Compose](https://developer.android.com/develop/ui/compose) — the project's UI framework.
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html) — structured concurrency, the basis for cancellation handling in the UI layer.

---

*This article documents the period from 3 to 9 September 2026. Work performed on `ArceApps/PuzzleHub`, published on 21 October 2026 as part of the project's historical backlog.*