---
title: "2025 W52: House Cleaning and Solid Foundations"
description: "Massive refactoring of game states and visual improvements in Hashi before closing the year."
pubDate: 2025-12-28
tags: ["devlog", "refactoring", "architecture", "ui", "hashi"]
heroImage: "/images/devlog-w52-state.svg"
---

As 2025 comes to an end, at ArceApps we decided that the best way to welcome the new year wasn't by frantically adding more features, but by making sure our house was in order. This week, the second to last of the year, we rolled up our sleeves to pay off a technical debt that had been haunting us: the inconsistency in how our 10 games handled their internal states.

It's the kind of work that doesn't always shine in screenshots, but makes the engine purr much more smoothly.

## 🏗️ The Great Unification: BaseGameState

For months, each game in PuzzleSuite had grown organically. *Minesweeper* had `difficulty`, *Kakuro* had `gameCompleted`, and *Hashi* counted its time in `secondsPlayed`. Everything worked, but maintaining 10 different "flavors" of state logic was a cognitive nightmare.

This week, we banged on the table (metaphorically) and introduced `BaseGameState`.

It wasn't a small task. We touched the heart of each of the 10 games to align them under a common interface:

```kotlin
interface BaseGameState {
    val isPaused: Boolean
    val isCompleted: Boolean
    val currentTime: Long
    val hintsUsed: Int
    // ...
}
```

The result was incredibly satisfying:
- **~300 lines of code removed**: Goodbye duplicate properties and redundant logic.
- **Total consistency**: Now, if we want to create a generic component (like a "Game Over" dialog), we can do it once and it will work for *all* games.
- **Zero regressions**: Despite touching critical files in all modules, the migration was surgical and the project compiles happily.

## 🎨 Hashi: A Little Color in the Logic

Not everything was invisible code. While reviewing *Hashi*, we realized that distinguishing between a "complete" and an "incomplete" island required too much visual effort. The colors were too similar.

We decided to overhaul the palette:
- **Complete Islands**: Now shine with an **Intense Turquoise** (`cyan500`). Impossible to miss.
- **Incomplete Islands**: Remain a **Vibrant Green**, inviting connection.
- **Bridges**: We adjusted the tones to harmonious greens that blend better with the rest of the board.

The change is subtle but noticeable; the game feels more responsive and less tiring for the eyes.

## 🌐 Speaking Your Language

We also took advantage of this week to polish internationalization. The stats screens for *Minesweeper* and *Kakuro*, which had some texts "burned in" in Spanish or English, are now first-class citizens in our localization system.

The most interesting thing was discovering (and eliminating) an absurd duplication of difficulty definitions (`Easy`, `Medium`...) that lived triplicated in our resource files. Now we have a single source of truth for these terms throughout the app.

## 🔚 Preparing for the Close

With the architecture cleaner than ever and the *Hashi* UI polished, we feel ready for the last week of the year. We know there is one piece of the puzzle pending: more challenging difficulty levels for our most demanding users.

But that... that is a story for next week.

See you at the year end. 👋
