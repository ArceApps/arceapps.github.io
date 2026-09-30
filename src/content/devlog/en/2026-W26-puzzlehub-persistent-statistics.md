---
title: "PuzzleHub: persistent statistics architecture"
description: "How PuzzleHub aligned persistent statistics across twelve Android puzzle games using Room, Kotlin, repositories and Jetpack Compose."
pubDate: 2026-06-23
lastmod: 2026-09-30
author: "ArceApps"
keywords: ["PuzzleHub", "Room", "Kotlin", "Jetpack Compose", "Android"]
heroImage: "/images/devlog/puzzlehub-score-xp-persistence.svg"
tags: ["Android", "Room", "architecture", "statistics", "devlog"]
draft: false
---

In June 2026, PuzzleHub aligned how its twelve puzzle games store and display completion statistics. The work crossed domain models, Room entities, ViewModels, and Compose screens.

The central issue was simple: a value calculated for a completion dialog was not always copied into the persisted puzzle. That made the immediate UI look correct while later statistics could be incomplete.

## Persistence as the contract

The completion flow was changed so the calculated result became part of the saved puzzle before the repository update. Statistics could then derive totals from completed records rather than a separate counter.

Room schemas that lacked the field received additive migrations with a default value. Existing local history remained intact.

## Two data sources

PuzzleHub keeps concrete completed-game history in Room and broader player progression in a shared repository. StatsViewModels combine both sources and expose one coherent state to Compose.

This separation keeps persistence concerns out of composables and avoids creating duplicate sources of truth.

## Twelve-game verification

The implementation documentation verified every game for persistence, statistics fields, repository wiring, UI integration, and database migration where required. Constructor changes also required updates to unit tests.

The historical report records a successful Android debug build and successful unit-test compilation after those changes.

## Architectural lesson

The work exposed repeated structures across game-specific ViewModels and screens. That repetition later motivated common statistics and history components, but aligning data semantics first was the safer sequence.

The useful invariant is: **calculate, persist, aggregate, observe, render**. A suite can keep game-specific mechanics while still enforcing shared contracts for cross-cutting capabilities.


## Why the first implementation looked correct

The inconsistency was easy to miss because the completion path already had enough information to render a convincing result. A player finished a puzzle, the application calculated a value, and the dialog showed it immediately. The missing step only became visible after navigation or a later launch.

This is a common persistence trap. UI state can temporarily contain richer information than the database. If tests focus only on the completion screen, the feature appears finished. The more useful acceptance test asks whether the same result can be reconstructed from persisted state after the process that created it is gone.

For PuzzleHub, that meant treating the completed puzzle record as the durable fact and making the statistics screen a consumer of that fact.

## Additive migration as a product decision

An additive Room migration can look like plumbing, but it determines the experience of someone updating an app after months of play. Recreating a database would make the new statistics feature arrive by deleting the history it is supposed to summarize.

The implementation therefore treated preservation as a requirement. New columns were introduced with defaults, database versions moved forward, and migration objects were registered explicitly.

That choice also separated two concerns. SQLite handled structural compatibility. Application code remained responsible for business meaning. Keeping those responsibilities apart reduced the temptation to reproduce scoring rules in migration SQL.

## Why not store only an aggregate?

Another possible design would keep a single total per game. Every completion could increment it, avoiding the need to store a result on each puzzle. That is simpler only if history never matters.

Persisting the result with the puzzle preserves the underlying facts. A total can always be derived from individual completed games. Individual results cannot be reconstructed from a total.

This matters for history screens, debugging, future analysis by size or difficulty, and any later change that needs to explain where a total came from. It also avoids a second synchronization problem: deleting or correcting a game does not require carefully adjusting an unrelated counter if the total is derived from the current set of records.

## A shared component is not a shared contract

The presence of a reusable statistics card initially suggested that the suite already had a common implementation. The June audit showed why that conclusion was too optimistic.

A component can be visually reusable while its inputs have different origins or meanings. One game can feed it a persisted total, another a transient value, and a third a default zero. The pixels match; the contract does not.

The per-game verification matrix was valuable because it looked below the composable. It checked the entire chain from stored entity to domain model, ViewModel, and screen.

## Constructor failures were useful feedback

When a shared repository became a required dependency of statistics ViewModels, tests that manually constructed those ViewModels stopped compiling. That was friction, but productive friction.

The tests were describing the old dependency graph. Updating mocks and constructor arguments forced them to represent the new one. The build therefore validated more than syntax: it showed that production and test construction agreed about the sources required to produce statistics.

This is one reason dependency injection changes should not be hidden behind optional parameters merely to keep old tests compiling. A required source should look required everywhere.

## Duplication and modularity are not opposites

The number of repeated edits could suggest collapsing every game into one generic statistics model. That would be an overcorrection. Puzzle games genuinely have different domain metrics, and preserving those differences is useful.

The better boundary is between specialized data and suite-wide invariants. A Kenken statistics model can own operation-specific metrics while still satisfying a common contract for completion count, persistent score, progression, and history.

Later commonization work became easier because June first aligned those semantics. Extracting a shared UI before agreeing on the meaning of its inputs would only have moved inconsistency into adapters.

## Documentation as executable intent

The implementation plan and verification report are unusually useful artifacts because they capture not only what changed but what had to remain true. They list root causes, reference implementations, migration constraints, and a matrix across all twelve games.

A commit diff is excellent evidence that a field changed. It is weaker evidence for why SQL backfill was rejected or why progression remained owned by a shared repository. The documents preserve those decisions.

The next improvement is to turn more of that matrix into parameterized tests. Documentation can define the contract; tests can continuously enforce it.

## A stronger definition of done

For a single game, seeing the correct number after completion might be enough to claim success. For a suite, the unit of completion is different.

If the product promise applies to every game, verification has to apply to every game. That means persistence, migration, state composition, rendering, and tests all belong to the definition of done.

The June work is a useful example of this shift in scale. The feature was not complete when one screen looked right. It was complete when the same invariant held across the suite.


## Structural migration versus semantic migration

One of the most reusable decisions from this period was refusing to make the database migration responsible for understanding game rules.

Room knows how to evolve a table. It can add a non-null integer column and provide a safe default for existing rows. It should not need to understand difficulty curves, timing thresholds, hint penalties, or size tiers.

Those rules already existed in Kotlin. Reusing them for older completed games means there is one implementation to reason about and test. It also means future changes to storage do not require translating domain behavior into another language.

This separation is especially useful in an application with twelve games. A SQL-only solution would not be one duplicated formula; it would be a family of formulas with game-specific details. The apparent convenience of doing everything inside a migration would quickly become maintenance debt.

## The meaning of zero

Using zero as the default for a new numeric column is pragmatic but not perfectly expressive. It can represent an actual result or a row that has not yet been enriched.

The design accepted that trade-off because the surrounding record already contains completion state and because Kotlin models remain simpler with non-null primitives. A backfill process can select relevant completed records using more context than the new field alone.

In a system where zero is a frequent legitimate result, a nullable field or an explicit migration marker might be a better choice. The important part is not that zero is universally correct; it is that its ambiguity was understood and paired with a strategy for older data.

## Keeping data ownership explicit

The work also clarified that “one source of truth” does not mean one database for the entire application.

A completed puzzle is authoritative for its own stored result. The global statistics repository is authoritative for player progression. A StatsViewModel is not a new source of truth; it is a composition boundary that observes both.

This model scales better than copying global values into every game database. Duplicated data creates synchronization questions: which copy wins, when is it updated, and what happens if one write fails? Observing the owner directly avoids those questions.

It also keeps UI code honest. A composable renders state; it does not decide where progression comes from or how completed games are aggregated.

## Historical values and future formulas

Once a result is persisted, another design question becomes visible: should historical results change when the formula changes?

For most player-facing history, the intuitive answer is no. The result shown when a game was completed should remain attached to that completion. Recomputing all old records after every balancing change would make history unstable.

The June work did not introduce formula versioning, but it created the conditions where versioning would be useful. A future record could store both the result and a calculator version. That would make balancing changes auditable without rewriting old games.

This becomes particularly important if scores feed leaderboards or achievements. Historical stability is not only a technical concern; it affects fairness and user expectations.

## Performance comes after semantics

Deriving a total from completed records is conceptually clean. If local history eventually becomes very large, reading and summing every record may not be the most efficient implementation.

That is an optimization problem, not a reason to change the data model prematurely. Room can later expose aggregate SQL queries, indexes, or cached projections while preserving the same semantic contract: completed records are the facts and totals are derived views.

Fixing semantics first provides a stable target for optimization. A fast aggregate with unclear ownership would simply make the wrong answer cheaper to compute.

## How this helps new games

Cross-cutting fixes are most valuable when they improve the next implementation as well as the current ones.

After this work, a new PuzzleHub game has a concrete reference path: calculate a completion result through shared logic, persist it with the game, expose totals through statistics state, obtain progression from the shared repository, and render the common statistics elements.

That checklist reduces the chance of focusing entirely on the generator and board while forgetting the surrounding product surfaces. In a puzzle suite, new-game work includes history, statistics, achievements, challenges, navigation, and progression. The board is only the most visible part.

A future registry of game capabilities could make this even more explicit. Instead of relying on developers to remember every integration, tests could enumerate registered games and require the appropriate adapters.

## Why the later commonization matters

The August work on common statistics and history is relevant because it validates the architectural signal from June. Repeated edits were not a one-off inconvenience; they identified a stable shared shape.

Commonization is safer after semantics converge. If eight screens all use a component called “total score” but calculate it differently, extracting a generic screen creates an abstraction over inconsistency. If they already agree on ownership and aggregation, the shared layer becomes much thinner.

June therefore looks less like an isolated bug fix and more like preparation for a better boundary: specialized game metrics below, shared suite behavior above.

## Evidence over memory

Reconstructing historical engineering work months later is risky if the only source is memory. This article relies on the repository's plan, verification report, commits, and current code patterns.

That evidence lets the narrative stay precise. The build durations are attributed to the historical report. The number of affected games and tests comes from documented acceptance work. Architectural conclusions are separated from recorded facts.

This is also why keeping technical plans after implementation can be worthwhile. They are not only planning artifacts; when maintained accurately, they become a record of intent and verification.

## A practical checklist from the incident

The same reasoning can be reused for future cross-cutting features. For every registered game, ask:

1. Where is the value calculated?
2. Which persisted record owns it?
3. How does an existing installation migrate safely?
4. Which repository exposes the source to presentation?
5. Is the UI rendering derived state rather than recomputing business rules?
6. Is there a contract test or matrix proving every game participates?

If one game needs a different answer, that can be valid, but the difference should come from domain requirements rather than accidental history.

The checklist is more useful than counting shared classes. A suite can contain many classes and still be coherent if its invariants are explicit.

## Closing the loop

What began as inconsistent statistics exposed a chain of ownership decisions. The visible symptom was a number. The durable fix required tracing that number through calculation, storage, migration, aggregation, state, UI, and tests.

That is the pattern I want to keep from this period. When a feature crosses many games, do not patch the final screen first. Follow the data from the moment it is created until the moment it is shown again after a restart.

The result is not only a corrected statistic. It is a stronger contract for the suite.


## From the initial design to the contract that actually shipped

There is an important distinction between the June 21 design and the June 23 implementation record. The earlier persistence design proposed storing both `score` and `xp` on puzzle records and described a Kotlin-driven retroactive population step. Two days later, the verified fix settled on a narrower ownership model: **score is persisted with the completed puzzle, while per-game XP is read through `GlobalStatsRepository`**.

That is not a contradiction to smooth over. It is useful evidence of the design becoming more precise. The first document explored how both values could reach history and statistics. The later implementation reused the global progression authority for XP instead of creating another copy in every game database merely to feed the statistics screen.

The verification report lets us separate proposal from demonstrated outcome. It confirms that all twelve games persist their calculated score before saving, that statistics sum scores from completed puzzles, and that game XP comes from the global repository. It also confirms the required migrations for the nine entities that previously lacked a score column. The retroactive populator described by the earlier design, however, is not part of the June 23 completed acceptance criteria.

That distinction matters when reconstructing engineering work months later. A design document records intent and alternatives. A verification report records the contract that was actually checked. Technical history is more reliable when the narrative follows both.

## Nine migrations, one compatibility rule

The verification report identifies nine games that needed a score column. Several version transitions are recorded explicitly: Hitori 8→9, Kenken 6→7, Fillomino 8→9, Slitherlink 7→8, and Minesweeper 7→8. For Hashi and Dominosa, the report confirms a migration but deliberately leaves the exact version transition marked for verification.

That small detail is a useful documentation lesson. There is no need to fill a gap with an inference. We can state the property supported by evidence — a non-destructive migration exists — and leave the exact version number unstated until equivalent evidence is available.

Across those separate schemas, the compatibility policy is the same:

```sql
ALTER TABLE ... ADD COLUMN score INTEGER NOT NULL DEFAULT 0
```

Repetition here is not automatically bad architecture. Each game owns its database lifecycle, while all games follow the same migration policy: preserve existing records and evolve the schema additively.

Room migrations also have an operational requirement beyond writing a `Migration` object: the application must register a valid path from an installed schema version to the target version. That is why a migration that exists in source but is not supplied to the database builder is effectively absent for users upgrading the app.

## What the test repair actually proved

The implementation log records thirteen unit tests affected by the new StatsViewModel constructor signatures. Akari, Dominosa, Fillomino, Galaxies, Hitori, Kakuro, and Shikaku needed a `GlobalStatsRepository` mock. Hashi, Kenken, Minesweeper, and Slitherlink also had arguments in the wrong order. MathCrossword required both puzzle and global repositories, while a generator test exposed a pre-existing missing `PuzzleSize` import.

Calling this merely “fixing broken tests” misses the architectural signal. Those tests were an executable description of the old dependency graph. Once global progression became an explicit input to statistics, test construction had to acknowledge the same dependency as production construction.

The historical verification is also careful about what it claims. It records `:app:compileDebugUnitTestKotlin` completing successfully in 15 seconds. That proves unit-test sources compiled after the constructor changes; it does not claim that every unit test in the project was executed. Likewise, `assembleDebug` completed in 2 minutes 19 seconds with pre-existing warnings and no new errors.

Keeping those statements narrow is part of useful technical writing. “Tests compile” and “the full test suite passes” are different guarantees.

## A cross-cutting contract deserves a cross-cutting test

The manual twelve-game matrix was effective because it forced the implementation to inspect every vertical. Its weakness is time: a June checklist cannot automatically complain when a thirteenth game is added later.

A contract test could. It would not need to understand how Kakuro is solved or how Slitherlink boards are generated. It would need to know which capabilities each registered game claims and which integrations those capabilities require.

A future registry might describe capabilities along these lines:

```kotlin
data class GameCapabilities(
    val scoring: Boolean,
    val progression: Boolean,
    val history: Boolean,
    val statistics: Boolean,
)
```

This was not part of the June implementation; it is an architectural consequence of the pattern the work exposed. Its value would be converting a human checklist into an executable invariant. A game declaring scoring could be required to expose a persistent path into statistics. A game declaring progression could be required to integrate with the shared progression authority.

The point would not be to erase game-specific architecture. It would make the boundary between legitimate specialization and accidental omission explicit.

## Follow the value, not the screen

The most reliable way to review a cross-cutting feature is not to start at the UI where it becomes visible. Pick a value and trace its complete lifecycle.

For score, the path is concrete: completion occurs, `GameScoreCalculator` calculates, the ViewModel copies the value into the puzzle, the repository persists it, Room retains it, statistics reads completed records, the StatsViewModel aggregates them, and Compose renders the result.

XP follows a different path. Progression is accumulated by its global authority, `GlobalStatsRepository` exposes the value for a game, and the StatsViewModel combines it with local history.

The fact that both numbers appear together inside `XpAndScoreCard` does not mean they should share storage. The screen is a composition point, not necessarily an ownership boundary.

That is probably the most reusable result from the June work. PuzzleHub did not need one giant database to become consistent. It needed explicit contracts between specialized game data and shared suite capabilities.


## References

- [Android Developers — Room migrations](https://developer.android.com/training/data-storage/room/migrating-db-versions)

- [PuzzleHub repository](https://github.com/ArceApps/PuzzleHub)
- [Persistence design](https://github.com/ArceApps/PuzzleHub/blob/main/docs/specai/feature/20260621-game-stats-persistence/20260621-game-stats-persistence-designs.md)
- [Implementation plan](https://github.com/ArceApps/PuzzleHub/blob/main/docs/specai/feature/20260623-fix-stats-score-xp/20260623-fix-stats-score-xp-plan.md)
- [Verification report](https://github.com/ArceApps/PuzzleHub/blob/main/docs/specai/feature/20260623-fix-stats-score-xp/20260623-fix-stats-score-xp-verify.md)
