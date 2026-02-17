---
title: "2025 W40: The First Pixel"
description: "The fear of the blank page, the critical decision between Canvas and Compose, and why we chose an architecture that slowed us down for three days to speed us up for the rest of the year."
pubDate: 2025-10-05
tags: ["devlog", "architecture", "canvas", "clean-code", "jetpack-compose"]
heroImage: "/images/devlog/2025-w40-cover.png"
---

Every big project starts with a `File > New Project`. It's a moment of pure optimism, but also of paralyzing terror. The terror of the "blank page".

Week 40 (October 1st to 5th, 2025) marks the official birth of **PuzzleHub**.

The idea on paper is simple yet ambitious: to create the definitive collection of logic puzzles for Android. We don't want to be another Sudoku clone full of intrusive ads and questionable aesthetics. We want to be the "Bible" of puzzles. A clean interface, no distractions, a free "premium" experience, and above all, a technical depth that respects the player's intelligence.

But before the first pixel was born on the screen, we had to make decisions that will define the next years of development. Decisions that, if wrong, will condemn us to rewrite everything by Christmas.

## The Tyranny of Architecture

We could have started by throwing code into the `MainActivity`. A couple of `Buttons`, a quick `Canvas`, and done. We would have had a functional prototype of *Shikaku* by Tuesday afternoon.
But *PuzzleHub* won't have one game. It will have ten. Maybe twenty.

If we don't separate concerns now, in November we'll be drowning in a plate of unmanageable spaghetti code. Imagine having to fix a bug in the timer and having to edit 15 different files. That is the death of the project.

We decided to adopt **Clean Architecture** (the variant recommended by Google, but applied strictly).
Each game will be a logical module (or at least a fully isolated package) with its own waterproof layers:
1.  **Domain**: Pure rules. Is this move valid? Here Android does not exist. No Context. No UI. Only pure Kotlin.
2.  **Data**: Persistence. How do we save the game? Room, DataStore, JSON.
3.  **Presentation**: UI. Jetpack Compose. ViewModels.

This decision has an immediate cost: **Boilerplate**.
To make a simple "Hello World" in this system, you need to create at least 5 files: `GameEntity`, `GameDao`, `GameRepository`, `GameUseCase`, `GameViewModel`.

During the first three days (Monday, Tuesday, and Wednesday), the feeling was like walking in molasses. We were writing hundreds of lines of infrastructure code that did *nothing* visible on the screen.

> *"Are we over-engineering this? Is a UseCase necessary just to save the score?"*

That's the question we asked ourselves on Wednesday night, looking at screens full of empty interfaces. But then, on Thursday, we implemented the logic for the first game: **Shikaku**.

### Shikaku: The Guinea Pig

We chose Shikaku (dividing a grid into rectangles containing a single number) because its rules are geometric but simple.
Thanks to the separated architecture, we were able to write unit tests (`ShikakuLogicTest`) without even having an `Activity`.
We could verify that the rectangle validation algorithm worked in the console, running in nanoseconds.

When we finally connected the **Presentation** (UI) layer on Friday, it was a "plug-and-play" experience. The UI had no logic. It only painted what the `ViewModel` told it. If the model said "error", the UI painted red. The separation worked. And suddenly, the molasses turned into a highway.

## The Great Schism: Canvas vs. Components

The second big decision of the week was about the rendering engine.
Jetpack Compose is wonderful. It allows you to build UIs by composing little boxes (`Box`, `Row`, `Column`).
The temptation to use this for the board was strong.
*   "Each cell is a `Box` with a border".
*   "Each number is a `Text` inside the `Box`".

For a 5x5 board, it works wonderfully.
But what about a 20x20 board? That's 400 cells.

We did a proof of concept ("Stress Test"). Rendering 400 cells using individual composables destroyed performance. The *frame rate* dropped to 22fps when scrolling or zooming. The overhead of creating so many View/Node objects, measuring their sizes, and drawing them individually is too much for a mid-range mobile.

The solution was radical: **Canvas**.
We draw the entire board on a single giant `Canvas`. It's like going back to programming video games in the 90s. We control every line, every circle, every pixel of text.

*   **Advantage**: Infinite performance. Stable 60fps (or 120fps) even on 50x50 boards. There is only "one view" to redraw.
*   **Disadvantage**: We lose accessibility and native click events. A `Canvas` is a flat image. It doesn't know what a "button" is.

We had to write our own gesture detection system (`detectTapGestures`). We had to do math to translate a touch on the screen (x=453, y=890) to a logical cell (Row 4, Column 8).

```kotlin
// 7th-grade math to the rescue
val cellWidth = size.width / cols
val col = (tapOffset.x / cellWidth).toInt()
val row = (tapOffset.y / cellWidth).toInt()
```

Simple math, but powerful. Now we have a graphics engine that flies.

## The First Real Commit

We closed the week with a functional skeleton.
We have a `MainActivity` that navigates to an empty menu.
We have an `AppDatabase` configured with Hilt injecting dependencies as if it cost nothing.
And we have a prototype of *Shikaku* that, although ugly (we used neon debug colors that would make a designer cry), feels solid under the finger. It responds instantly.

It doesn't look like much for a whole week of 30 hours of work. Just one ugly game.
But the foundations of a skyscraper are never pretty; they are deep.
Next week, we will try to build the second floor on these foundations. And if the Clean Architecture theory is true, the second floor should be built in half the time.

We'll see if the theory survives reality.
