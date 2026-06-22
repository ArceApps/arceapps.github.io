---
title: "2026 W26: The Rebellion of the Int? (Technical Deep Dive)"
description: "The B-side of this week: how to decide between nullable and non-nullable columns, why we wrote the RetroactiveStatsPopulator in Kotlin instead of SQL, and the guts of the Room migration for the twelve games of PuzzleSuite."
pubDate: "2026-06-22"
lastmod: "2026-06-22"
keywords: ["room migration", "kotlin sqlite", "android database"]
heroImage: "/images/devlog/devlog-w26-nullable.svg"
tags: ["devlog", "android", "kotlin", "room", "database", "refactor"]
---

If the previous entry was the cinematic version of this week — the narrative summary, the anecdotes, the coffee and the philosophy — this is the workshop version. Here we're going to pop the hood of `RetroactiveStatsPopulator`, discuss why each technical decision was the one it was, and why some other options that seemed reasonable ended up being discarded. If you're looking for a step-by-step guide to implementing something similar, this is your devlog. If you just want the indie epic, the first part of this week awaits you.

## The problem, no metaphors

PuzzleSuite has twelve logic puzzle games. Each game has its own Room database (an old architecture decision that we'll probably migrate to a single shared database someday, but that's a topic for another devlog). Each database has a `*_puzzles` table that stores the puzzles completed by the user, with fields like `difficulty`, `totalTime`, `hintsUsed`, `completedAt`, and other metadata.

Until this week, two fields were missing that we needed: `score` (the points earned on that puzzle according to speed and difficulty thresholds) and `xp` (the experience reported to the player's global profile). The reason they were missing was historical: when we designed the initial scoring system, we did it calculating the values on the fly each time the stats screen was rendered. That worked while there was only one stats screen and a simple data model. But when we tried to show the score in the completed puzzle history, we discovered we didn't have the data persisted: we would have to recalculate it every time someone visited that screen, which was absurd from an efficiency and maintainability standpoint.

The obvious solution was to add two columns to each table. But obvious solutions, as we're about to see, hide an obscene amount of decisions beneath their innocent surface.

## Decision 1: Nullable vs Non-nullable

The first fork in the road. The two options were:

**Option A: Nullable columns**
```kotlin
val score: Int? = null,
val xp: Int? = null
```

**Option B: Non-nullable columns with default**
```kotlin
val score: Int = 0,
val xp: Int = 0
```

Option A has a conceptual elegance: "this puzzle was completed before the scoring system existed, so its score is unknown". It's the literal truth. It's also an operational hell: every time someone sums scores, every time the UI displays them, every time a calculation uses them, you have to write `score ?: 0` somewhere. That proliferation of safe-calls and elvis operators is noise that contaminates the code and that, over time, sneaks into places where it shouldn't be.

Option B, on the other hand, says "this puzzle has a score of zero". It's an elegant lie. But it's a lie that the entire system understands and handles without special cases. When in six months you change the XP formula, you won't have to track down all the `Int?` to `Int` conversions to make sure none became obsolete. You simply change `XpCalculator.calculate()` and everything flows.

We chose B. And we chose it not because it was the most philosophically correct, but because it was the most consistent with the rest of the model. The timing fields (`totalTime: Long = 0`) already followed that pattern. If we made an exception here, we would be introducing an inconsistency that in two years someone — probably me, in another devlog like this — would have to explain why it exists.

## Decision 2: How to fill historical rows

Okay, we have the columns. We have default values at zero. What about the puzzles that were already completed before this update? Those have `score = 0` and `xp = 0`, which is incorrect because they aren't zero: they were simply never calculated.

Here the menu had three dishes:

### Dish 1: Pure SQL in the Room migration

```sql
ALTER TABLE akari_puzzles ADD COLUMN score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE akari_puzzles ADD COLUMN xp INTEGER NOT NULL DEFAULT 0;
UPDATE akari_puzzles SET
  score = CASE
    WHEN difficulty = 'easy' AND total_time < 60000 THEN 100
    WHEN difficulty = 'easy' AND total_time < 180000 THEN 50
    ...
  END
WHERE completed_at IS NOT NULL;
```

Advantage: atomic, fast, all within the migration transaction.
Disadvantage: replicating the full logic of `GameScoreCalculator` (which takes into account puzzle size, hints used, speed bonuses, special rules per game) in SQL is practically impossible. By the time I finished writing the twelve queries, the rules would have changed.

### Dish 2: Kotlin on startup (what we did)

```kotlin
@Singleton
class RetroactiveStatsPopulator @Inject constructor(
    private val akariRepository: AkariPuzzleRepository,
    private val dominosaRepository: DominosaPuzzleRepository,
    // ... ten other repositories
) {
    suspend fun populateAll() {
        populateGame("akari") {
            val puzzles = akariRepository.getCompletedPuzzles().first()
            puzzles.filter { it.score == 0 }.forEach { p ->
                val sizeStr = "${p.size.width}x${p.size.height}"
                val score = GameScoreCalculator.calculate(
                    "akari", p.difficulty, sizeStr, p.totalTime, p.hintsUsed
                )
                val sizeTier = getAkariSizeTier(p.size)
                val xp = XpCalculator.calculate(sizeTier, p.difficulty)
                akariRepository.updatePuzzle(p.copy(score = score, xp = xp))
            }
        }
        // Repeat for the other eleven games
    }
}
```

Advantage: reuses all existing scoring logic. If tomorrow I change `XpCalculator`, the next startup applies the new values without touching this code.
Disadvantage: adds a small lag on the first startup, although in small local databases it's practically imperceptible.

### Dish 3: Room Database Callback

```kotlin
.addCallback(object : RoomDatabase.Callback() {
    override fun onOpen(db: SupportSQLiteDatabase) {
        // Calculate scores here
    }
})
```

Advantage: automatic, seems elegant.
Disadvantage: blocks Room initialization. Accessing `GlobalStatsRepository` or other DAOs from inside the callback creates circular dependencies or synchronization issues that are very difficult to debug.

We chose dish 2 for one very specific reason: **single source of truth**. All scoring logic lives in Kotlin, in `GameScoreCalculator` and `XpCalculator`. If that logic changes, everything updates automatically. If I had put the logic in SQL, I would have two versions: one for new puzzles (Kotlin) and one for old ones (SQL). Two versions diverge. Two versions diverge badly.

## Decision 3: When to invoke the populator

There is a timing detail that seems minor but matters a lot: when do we run `populateAll()`? The options were:

- **In `Application.onCreate`**: as early as possible. But coroutines in `Application.onCreate` are prone to errors because the Hilt context may not be fully initialized.
- **In the first `MainActivity.onCreate`**: safer, but could run multiple times if the user kills the app and reopens it.
- **In an AndroidX Startup `Initializer`**: the official pattern for initialization jobs. Runs once per process and handles retries well.
- **As part of the first `StatsViewModel` that loads**: lazy, but requires coordination among the twelve ViewModels.

We chose the AndroidX Startup Initializer. It's the least sexy but most correct option: separates initialization from UI code, handles retries automatically, and shows up in any Android linter that looks at initialization patterns.

```kotlin
class StatsPopulatorInitializer : Initializer<RetroactiveStatsPopulator> {
    override fun create(context: Context): RetroactiveStatsPopulator {
        val app = context as PuzzleSuiteApplication
        app.applicationScope.launch {
            app.retroactiveStatsPopulator.populateAll()
        }
        return app.retroactiveStatsPopulator
    }

    override fun dependencies(): List<Class<out Initializer<*>>> = emptyList()
}
```

And it's registered in the `AndroidManifest.xml` or in an `InitializerConfig` class:

```kotlin
class AppInitializers : Initializer<Unit> {
    override fun create(context: Context) {
        AppStartup.getInstance(context)
            .initializeComponent(StatsPopulatorInitializer::class.java)
    }

    override fun dependencies(): List<Class<out Initializer<*>>> = emptyList()
}
```

Clean. Idempotent. Traceable.

## The detail that almost got away from us

There was a moment where we almost got into a serious problem. `populateAll()` iterates over each repository and updates each puzzle with `score == 0`. But what happens if the user opens the app, the populator starts running, and halfway through the user completes a new puzzle? That new puzzle would arrive with `score` and `xp` already calculated correctly (because the scoring system does calculate them when saving). But the populator, if not careful, could recalculate it and assign it a different value if the scoring logic had changed between the first write and the recalculation.

The solution was simple: the `it.score == 0` filter only processes puzzles with a zero score. If the user completes a new puzzle, its score will be different from zero immediately, and the populator ignores it on subsequent passes. It's a race condition that's resolved by the nature of the filter, not by locks or synchronized blocks. Sometimes elegance comes from not adding complexity.

## The anatomy of a well-done Room migration

It's worth pausing for a moment on what a well-done Room migration looks like, because there are many tutorials out there that teach you to do it wrong. The golden rule: **never** drop a table and recreate it with the new schema. It's tempting, especially when you're prototyping, because it seems faster. But for a user who already has data on their device, that would mean losing their entire history.

The correct way is `ALTER TABLE`:

```kotlin
internal val MIGRATION_7_8 = object : Migration(7, 8) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("""
            ALTER TABLE akari_puzzles
            ADD COLUMN score INTEGER NOT NULL DEFAULT 0
        """)
        db.execSQL("""
            ALTER TABLE akari_puzzles
            ADD COLUMN xp INTEGER NOT NULL DEFAULT 0
        """)
    }
}
```

And then register the migration in the database provider:

```kotlin
internal val MIGRATIONS: Array<Migration> = arrayOf(
    MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4,
    MIGRATION_4_5, MIGRATION_5_6, MIGRATION_6_7, MIGRATION_7_8
)
```

Each migration is idempotent: if Room is already at the target version, it doesn't run. If it's at an earlier version, it runs all intermediate migrations in order. If something fails halfway through, Room rolls back and leaves the database as it was. It's a small marvel of engineering that SQLite and the AndroidX team give us, and that most apps don't take advantage of.

There's an additional trick I learned years ago and always apply: **increment the version per change, not per release**. That is, if a release includes two schema changes, they are two separate migrations (`7_8` and `8_9`), not a single `7_9`. Why? Because if in the future you need to roll back to an earlier version of the code, you want to be able to identify exactly which schema version each release corresponds to. One migration per change gives you that traceability.

## Why we didn't write tests for this (yet)

This is going to sound weird coming from someone who normally defends testing, but we didn't write automated tests for `RetroactiveStatsPopulator`. The reason is practical: the scoring logic is already tested in its respective classes (`GameScoreCalculatorTest`, `XpCalculatorTest`). The populator is an orchestrator: it calls already-tested functions and applies them to database rows. Testing the orchestrator would be testing that Kotlin correctly copies values, which is basically testing the language.

What I did do was manually validate with real data: I installed a local build with a synthetic database of five hundred puzzles, ran the populator, and verified that the calculated scores matched what the original formula would produce. It's manual testing, yes, but for a one-shot migration like this, it's proportional to the risk.

If the populator ran periodically (for example, if each formula change required a recalculation), then I would write automated tests. But since it's an operation that happens once per installation (the `score == 0` filter ensures that the second pass does nothing), the cost of the automated test doesn't justify the benefit.

## What's still not done (and that's okay)

There's a decision we consciously **didn't** make this week: we don't persist the history of formula changes. That is, if in the future I change `XpCalculator` and the populator recalculates all the puzzles, the old values are lost. We don't save "this puzzle had XP=150 with formula v1, now it has XP=180 with formula v2".

Is that a problem? For an indie puzzle game, probably not. Players don't want to see a history of how much XP their puzzles had six months ago under a different formula; they want to see the current XP. If we ever decide to save the history, it will be an explicit feature, not a side effect.

Also pending is the audit of the scoring rules themselves. Some games (Minesweeper, especially) have rules that probably need adjustments after seeing how the scores behave in production. But that's another day.

## A reflection on the cost of small things

I've seen one-line Pull Requests that took three days to merge because they opened unexpected Pandora's boxes. This was one of those cases, but in reverse: the Pull Request contained two dozen files (twelve entities, twelve migrations, the populator, the Initializer, the UI changes) but the conceptual logic was simple. The challenge wasn't the code's complexity, but the consistency between twelve databases that share the same architecture but that, by their modular nature, can silently diverge if you're not careful.

It's the kind of work that doesn't generate pretty screenshots for the blog, that doesn't appear in "shipping fast" tweets, but that's the reason the app remains maintainable after three years. Boring, predictable, well-documented code is what scales. "Smart" and clever code is what you have to rewrite in six months.

If you have to choose between the two options in your own project, I'll leave you with a heuristic that works for me: **if your change touches more than three files that are structurally identical, write a script or a component that generates the changes**. For this devlog, I briefly considered generating the twelve entities with a Python script that read a JSON configuration. In the end I decided to write them by hand because they're forty lines per game and the script would have taken longer to debug than to write the code directly. But that calculation changes if instead of twelve there were fifty games.

## Technical closing

If you've made it this far, you have in your head the entire design behind two columns in a table. It sounds exaggerated for so little, but that's precisely the point: in software, the small isn't trivial. Decisions about nullable, about when to run the migration, about where to put the logic — they all matter. And although none of them is sexy, they're all what differentiates code that ages well from code you'll have to rewrite in two years.

What I like most about the final result is that `RetroactiveStatsPopulator` feels like an honest component. It does exactly what its name says, it has no hidden side effects, and if tomorrow I decide to wipe a user's database and reinstall the app, the populator runs again and everything works. It's the kind of code I like to write: boring, predictable, and robust.

— *Scribe*