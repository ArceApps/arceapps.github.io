---
title: "2026 W01: House Cleaning and Solid Foundations (Extended Version)"
description: "Starting the year by bringing order to chaos. A technical chronicle of how we dismantled a 600-line ViewModel, unified time logic with Flows, and improved Slitherlink's invisible accessibility."
pubDate: 2026-01-07
tags: ["devlog", "refactoring", "hitori", "accessibility", "clean-architecture", "technical-debt", "kotlin"]
heroImage: "/images/devlog-w01-refactoring.svg"
---

Starting the year coding feels a bit like cleaning the garage on a Sunday morning with a hangover.
You know you have to do it.
You look at the mountain of boxes (or `TODOs`) accumulated during the December frenzy and feel a mix of existential laziness and moral duty.
*"I could leave it like this"*, the procrastination devil whispers. *"The code works. No one is going to see the backend. And anyway, if you don't touch it, it doesn't break"*.

But you know the truth. You know that rusty bicycle (that monolithic `ViewModel`) will make you trip in March. You know that box of cables (that duplicate database logic) will cost you three days of debugging in May.
So you put on your gloves, take a deep breath, and start throwing things in the trash.

That has been the energy of this first week of 2026 at **PuzzleHub**.
We haven't added big visible features. There are no dazzling new games.
But we went down to the basement with a flashlight and a shovel, and started cleaning the foundations.

## The Monster in the Hitori ViewModel

On Monday I opened `HitoriGameViewModel.kt` with the innocent intention of adding a simple Achievement ("Complete 5 games in a row").
What I found there made me want to close my laptop and become a farmer.

The file had grown organically (euphemism for "chaotically") over the holidays.
There was one method in particular, `updateStatsOnCompletion()`, that had taken on a life of its own.
It was 67 lines of *inline* logic mixing everything that is forbidden to mix in a healthy architecture:
1.  **Mutable State**: Streak calculations (`currentStreak++`) based on local variables.
2.  **Persistence**: Direct calls to the DAO (`dao.update(...)`) without going through a repository.
3.  **UI Logic**: Direct side effects (`_uiState.value = ...`).
4.  **Time Math**: Conversions from milliseconds to seconds scattered throughout the code.

It was **imperative code spaghetti**.
The problem isn't that it was "ugly". Ugly code that works is acceptable.
The problem is that it was **rigid and dangerous**.
If I wanted to implement a "Solve" button (for debug), I had to duplicate all that logic or juggle boolean flags to avoid double-counting stats.
If I wanted to test the streak logic, I had to instantiate the entire `ViewModel` with its Android dependencies (Context, SavedStateHandle), which is slow and painful.

I decided to apply textbook **Clean Architecture**. Not for academic purism, but for pure mental survival.
I created a specific UseCase: `ProcessHitoriGameCompletionUseCase`.

```kotlin
// Before: A ViewModel doing everything (The One Man Band)
fun updateStatsOnCompletion(isWin: Boolean) {
    if (isWin) {
        // Blocking on Main Thread? Maybe.
        val currentStats = statsDao.getStatsSync()
        val newStreak = currentStats.streak + 1

        // Business logic mixed with presentation logic
        if (newStreak > currentStats.bestStreak) {
             // ... more nested logic ...
        }

        dao.update(currentStats.copy(streak = newStreak))
        _uiState.update { it.copy(showConfetti = true) }
    }
}
```

The solution was to extract all that complexity into a pure Kotlin class.
Now, the ViewModel is an "Orchestra Conductor" that only delegates:

```kotlin
// After: Delegating like a boss
fun onGameFinished(result: GameResult) {
    viewModelScope.launch {
        // All the dirty logic lives inside here, tested and isolated
        val outcome = processGameCompletionUseCase(puzzle, result)

        // The ViewModel only reacts to the pure result
        if (outcome.isNewRecord) {
            _uiState.update { it.copy(showNewRecordBadge = true) }
        }
    }
}
```

The result was a **70% code reduction** in the ViewModel.
But most important is the **peace of mind**.
Now, the business logic ("What happens when you win?") lives in a class with no Android dependencies (`android.*`), which can be tested in milliseconds with JUnit.
It feels good to see the tests pass green on the first try. It's like seeing the garage floor clean after sweeping.

## The Tyranny of Time (Unifying Timers with Flows)

While cleaning Hitori, I noticed another repetitive pattern: **Time**.
We had three different timer implementations in the app, each programmed by a different person (or by me on different days):
1.  `CountUpTimer`: A basic `while(true) { delay(1000) }`.
2.  `CountDownTimer`: A wrapper over the Android class (bad for Compose).
3.  `Stopwatch`: A complex implementation with `System.nanoTime()`.

Each had its own bugs. Some didn't pause when minimizing the app. Others lost precision when rotating the screen.
It was a flagrant violation of the **DRY** (Don't Repeat Yourself) principle.

I dedicated Wednesday to creating the `SharedTimerComponent` (`TASK-2026-003`).
Instead of using threads or callbacks, we use the power of **Kotlin Flows**.
The timer is now an "emitter of truth" that you subscribe to.

```kotlin
// The heart of the new clock
class GameTimer {
    private val _time = MutableStateFlow(0L)
    val time: StateFlow<Long> = _time.asStateFlow()

    fun start() {
        tickerJob = scope.launch {
            while(isActive) {
                delay(1000)
                _time.value++
            }
        }
    }

    // The important part: Lifecycle Integration
    @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
    fun pause() { tickerJob?.cancel() }
}
```

Now, all games consume this same component.
If we fix a precision bug in Hitori, it gets fixed for free in Sudoku and Minesweeper.
It's boring engineering, yes. It won't sell more copies. But it's the kind of engineering that lets you sleep soundly at night knowing time won't "break" randomly.

## Invisible Accessibility: Slitherlink and TalkBack

The other focus of the week was **Slitherlink**.
As sighted developers, we design for the eyes. We group information visually using space and colors.
But for a blind user, the screen is a linear list of elements to read.

I enabled **TalkBack** (Android's screen reader) to test the accessibility of the Stats screen.
The experience was painful, almost insulting.
The reader read the stats as robotic, disconnected elements:
*"Text: Played"* -> Swipe -> *"Text: 10"* -> Swipe -> *"Text: Won"* -> Swipe -> *"Text: 8"*.
Navigating a 5-row table required 20 swipe gestures. It was tedious and cognitively exhausting.

The technical solution was ridiculously simple, but the human impact is huge.
We used Compose's **Semantics** API to "merge" nodes.

```kotlin
// The 'Semantic Hug'
Row(
    modifier = Modifier
        .semantics(mergeDescendants = true) {
            // This tells TalkBack:
            // "Don't read children separately. Treat this as ONE single phrase".
        }
) {
    Text("Games Won", style = LabelStyle)
    Text("85%", style = ValueStyle)
}
```

Now, when accessibility focus reaches that row, the user hears:
*"Games Won: 85%"*. A single group. A single idea.
It's a one-line code change (`mergeDescendants = true`).
But it drastically changes the experience of dignity and efficiency for someone who cannot see the screen.
It made me reflect on how many invisible barriers we create unintentionally simply by not "closing our eyes" and testing our own app for five minutes.

## Weekly Reflection

This week we haven't uploaded anything to the Play Store.
There are no new screenshots to show on Twitter.
If you show today's code to an average user (or an impatient Product Manager), they'll tell you "it's the same as yesterday".

But beneath the surface, everything has changed.
We have paid off the technical debt from the December rush.
We have established patterns (Clean Architecture, SharedComponents) that we will use for the rest of the year.
Sometimes the most productive work is the one that isn't seen. It's foundation work.
Because you can't build a skyscraper on a swamp of spaghetti code.

Next week, we go back to building upwards. But this week, we enjoyed digging downwards.

---
*End of weekly report.*
