---
title: "2025 W41: Multiply by Three"
description: "From one game to three in record time. How the right abstraction and Kotlin Generics allowed us to scale without copying code."
pubDate: 2025-10-12
tags: ["devlog", "kotlin", "generics", "scaling", "refactoring"]
heroImage: "/images/devlog/2025-w41-cover.png"
---

They say if you do something once, it's a fluke. If you do it twice, it's a coincidence. If you do it three times, it's a pattern.
In Week 41 (October 6th to 12th), we set out to turn our solitary *Shikaku* prototype into a serial game factory.

On Monday morning, we looked at the code. Shikaku worked well.
But the weekly goal was aggressive: add **Hitori** and **Fillomino** before Sunday.
Three games in total.

The temptation of the devil (and of every programmer in a rush) appeared: *"Copy the Shikaku folder. Paste it. Rename it to Hitori. Change the rules. Done."*
If we had done that, we would have finished by Tuesday noon. But we would have sown the seeds of our own destruction. We would have three copies of the "Draw Board" code, three copies of the "Timer", three copies of the "Database".
Maintaining that is hell. If you want to change the background color in the future, you have to do it three times.

Instead, we took a deep breath and dedicated the first three days not to creating games, but to destroying code. Massive refactoring.

## The Infinite Grid Abstraction

Hitori, Shikaku, Sudoku... looking closely, they all share a common DNA: they are grid games (`Grid`).
It doesn't matter if you put numbers, colors, or walls. The topology is identical.

We created a generic `Grid<T>` class that handles the "boring" spatial logic:
*   Is the coordinate (x,y) inside the board?
*   Give me the orthogonal neighbors of this cell (up, down, left, right).
*   Iterate over all cells safely.

```kotlin
class Grid<T>(val width: Int, val height: Int, init: (Int, Int) -> T) {
    private val cells = Array(width * height) { i -> init(i % width, i / width) }

    operator fun get(x: Int, y: Int): T = cells[y * width + x]
    // ...
}
```

It seems trivial, but by centralizing this, we achieved a silent victory in performance. Internally, we went from using a `List<List<T>>` (which is memory inefficient) to a flat one-dimensional `Array`. Thanks to encapsulation, none of the games had to change their logic. They just got faster for free.

## The Challenge of Hitori: Flood Algorithms

Implementing **Hitori** was very different from Shikaku.
In Shikaku, you draw rectangles.
In Hitori, your mission is to shade cells to eliminate duplicate numbers, but with a critical rule: **The remaining white area must be continuous**. You cannot leave isolated "islands".

Validating this rule is not trivial. It requires analyzing the connectivity of the entire graph.
We had to implement a classic algorithm: **Flood Fill**.

1.  Choose an arbitrary white cell as a "seed".
2.  Expand to all white neighbors recursively.
3.  Count how many cells you have visited.
4.  If the number of visited cells equals the total number of white cells on the board, then they are all connected.

This algorithm must run in real-time. Every time the user touches a cell to shade it.
If it takes 100ms, the game will feel "laggy".
Thanks to Kotlin and Android's JVM optimization (ART), we managed to get it running in less than 2 milliseconds even on large boards. The feeling is instant.

## The Trap of Visual Inheritance

On the UI (User Interface) side, we almost made a fatal mistake.
We tried to create a `BaseGameScreen` that did everything: draw the board, draw the timer, draw the pause button.
It worked for Shikaku and Hitori. Both are simple square grids.

But when **Fillomino** arrived on Friday, the abstraction broke into a thousand pieces.
Fillomino doesn't draw squares. It draws irregular shapes ("polyominoes") with complex internal borders that snake through the grid.
Our `BaseGameScreen` didn't know how to handle that.

We learned (or remembered) a valuable lesson in software engineering: **Composition over Inheritance**.
Instead of a giant parent class (`BaseGameScreen`) imposing its will, we split the UI into small, submissive components:
*   `GameTimer`: Only knows how to paint the clock. Doesn't care about the game.
*   `GridRenderer`: Draws the grid lines.
*   `CellHighlighter`: Handles shading selected cells.

Each game now *composes* these elements as it pleases.
*   Hitori uses `CellHighlighter` to paint eliminated cells black.
*   Shikaku ignores `CellHighlighter` and uses its own `RectangleRenderer`.

This flexibility was key. It allowed us to implement Fillomino on Saturday afternoon, reassembling pieces like Lego, instead of fighting against a rigid class hierarchy.

## Three Games, One New Problem

As we finish the week, we look at the phone. We have 3 icons in the menu. The app is starting to look like a real suite, not just an experiment.
But having 3 games has revealed a new problem we didn't foresee: **Navigation**.

Our `Home Screen` is an ugly static list of hardcoded buttons. And passing data between the menu screen and the game (like: "What difficulty did the user choose?", "What random seed to use?") is getting complicated. We are passing too many arguments in the Compose navigation URL (`game/{id}/{difficulty}/{size}/{seed}/{isDaily}...`).

We need a more robust state management system for navigation. But that will be a problem for "Next Week Me".
For now, let's celebrate. 3 games. 0 crashes. And a codebase that (still) smells clean.
