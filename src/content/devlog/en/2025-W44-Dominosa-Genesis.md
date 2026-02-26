---
title: "2025 W44: The Ninth Passenger"
description: "Just when you thought the catalog was closed, Dominosa arrives to challenge our architecture. A story about feature creep and modular design."
pubDate: 2025-11-02
tags: ["devlog", "architecture", "dominosa", "planning", "philosophy"]
heroImage: "/images/devlog-w44-dominosa-genesis.svg"
---

There is a moment in every software project where the team looks each other in the eye and says: "That's it. No more *features*". It is the moment to freeze, to polish, to stabilize. In *PuzzleSuite*, we thought we had reached that point at the end of October. We had eight solid games: *KenKen* for mathematicians, *Hashi* for architects, *Slitherlink* for topologists. The suite felt complete.

But then, as always happens, an idea appeared. Or rather, an old memory in the form of domino tiles.

Week 44 (October 27th to November 2nd) witnessed how we broke our own promise of "no more games" to welcome the ninth passenger of our collection: **Dominosa**. And what started as a "let's see if it's possible", became a trial by fire for the modular architecture we had been building all year.

## What is Dominosa? (And why it obsessed us)

For the uninitiated, Dominosa is a logic puzzle invented by O.S. Adler in 1874. You have a rectangular grid full of numbers. Your mission is to pair those adjacent numbers to form a complete set of domino tiles (0-0, 0-1, 0-2... up to the maximum double pair). The catch is that each pair of numbers appears only once on the entire board.

From the player's point of view, it is a delightful deduction challenge. But from the developer's point of view, *Dominosa* presented a unique challenge that we didn't have in other games: the **global uniqueness of pieces**.

In *Sudoku* or *KenKen*, constraints are local (row, column, box). In *Dominosa*, the constraint is the global inventory. If you use the pair `[3|4]` in the top left corner, that pair ceases to exist for the rest of the board universe. This radically changes how we validate the game state.

### The Dilemma of Feature Creep

Adding a new game at this stage of development is dangerous. It's called *Feature Creep* (scope creep), and it is the number one cause of projects that never launch.

We sat down on Monday, October 27th with a blank whiteboard. The discussion wasn't technical at first, but philosophical:

> *"Does Dominosa add something that the other 8 games don't have?"*

The answer was yes. *Connect the dots* (like Hashi) we already had. *Region filling* (like Shikaku) too. *Loop making* (Slitherlink/Hitori), checked. But *Pair matching* with inventory restriction didn't exist in *PuzzleSuite*. Mechanically, it filled a gap we didn't know we had.

We decided to take the risk. But with one condition: **It had to be implemented without touching the core of the application.** If we had to modify the `MainActivity` or the global user database to put Dominosa in, the project was canceled. It was the ultimate test of our Clean Architecture design.

## Reverse Engineering a Classic

The solution design started on Tuesday. We couldn't just "paint numbers". We needed a robust data model.

We analyzed the structure of a standard Dominosa puzzle and realized it is essentially an adjacency graph where nodes are cells and edges are potential domino connections.

```kotlin
data class DominosaTile(
    val value1: Int,
    val value2: Int
) {
    // The identity of a tile is independent of order
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DominosaTile) return false
        return (value1 == other.value1 && value2 == other.value2) ||
               (value1 == other.value2 && value2 == other.value1)
    }
}
```

This small snippet of code (simplified) was our first victory. Defining the identity of a tile (`[1|2]` equals `[2|1]`) would greatly simplify all subsequent validation logic.

### The Generation Problem

Where other games generate the puzzle and then check if it's solvable, Dominosa requires the reverse. You first generate a valid set of dominoes placed randomly on the board, and then present only the numbers, hiding the edges.

Our initial generation algorithm (designed on Wednesday on paper) looked like this:
1.  Create a list of all possible tiles for a given size (ex: Double-3 has 10 tiles).
2.  Place tiles randomly on an empty grid.
3.  If we reach a dead end (holes where no remaining tile fits), do *backtracking*.

It seemed simple, until we ran into ambiguity. A randomly generated board could have **multiple solutions**. In Dominosa, just like in Sudoku, a well-designed puzzle must have **a single logical solution**.

This meant we needed not only a *Generator*, but a *Solver* capable of detecting ambiguities. If the Solver finds two ways to place the tiles for the same numbers, the puzzle is discarded.

## The "Plug-and-Play" Architecture

Here is where the work of previous months shone. To integrate Dominosa, we just had to extend the base classes we already used for the other games.

1.  **DominosaGameScreen** inherits from our Canvas rendering system.
2.  **DominosaViewModel** implements the `IGameViewModel` interface.
3.  **DominosaRepository** connects to the existing `Room` module.

It was almost magical to see how, upon creating the empty classes on Thursday, the application already recognized the new game, added it to the main menu, and prepared the navigation routes. Not a single line of code from the central `AppNavigation` or `HomeScreen` had to be touched. The dependency injection system (Hilt) found the new modules and integrated them silently.

This validated months of insisting on decoupling components. If we had tried this in June, we would have broken the entire app. In November, it was like inserting a new cartridge into a console.

## UX: The Interaction Challenge

Friday was dedicated to prototyping the interaction. How do you play this on a touch screen?
On paper, you draw a line between two numbers. In digital, we tried several ideas:
*   **Tap-Tap**: Touch a number, then touch the neighbor. (Slow).
*   **Drag**: Drag your finger between two numbers. (Intuitive, but prone to errors on small screens).
*   **Long Press**: Hold to see options. (Hidden, bad discoverability).

We opted for **Drag**, but with a generous "attraction zone". If your finger ends up near a valid neighbor, the system "magnets" the connection. We also added a crucial visual feature: when you form a pair (ex: `[3|4]`), the list of available tiles at the bottom of the screen updates the status of that specific tile.

We created a small visual component, `InventoryView`, which shows all possible tiles.
*   **Gray**: Tile not placed.
*   **Color**: Tile placed on the board.
*   **Red/Crossed out**: Error (duplicate tile placed on the board).

This immediate feedback transformed the game from "guessing" to "deducing".

## Looking Towards Week 45

We ended week 44 with the "skeleton" of Dominosa working. The generator produces boards (sometimes ambiguous, still), rendering works, and interaction is promising.

But the hardest part is missing: polishing. The game is ugly. Numbers are Times New Roman by default. No victory animations. And the solver still gets stuck with large boards.

Next week (Week 45) will be a sprint of pure implementation. We want to take Dominosa from "functional prototype" to "first-class citizen" before the 9th. And after that... the big cleanup. Because by adding Dominosa, we noticed that our other 8 children are a bit messy.

But that will be another story. For now, we are left with the satisfaction of knowing that our architecture has survived a last-minute *Feature Creep*. And that, in this trade, is the closest thing to a victory that exists.
