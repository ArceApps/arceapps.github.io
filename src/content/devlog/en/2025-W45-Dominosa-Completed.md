---
title: "2025 W45: Dominating Uncertainty"
description: "From theory to practice: How we implemented Dominosa in a week and learned that true randomness is an enemy."
pubDate: 2025-11-09
tags: ["devlog", "algorithms", "dominosa", "completion", "production"]
heroImage: "/images/devlog-w45-algorithms.svg"
---

If last week was about the audacity of starting something new, Week 45 (November 3rd to 9th) has been about the harsh reality of finishing it. It's one thing to say "let's make a domino game" and quite another to make it feel fair, fun, and bug-free on a mobile phone.

Dominosa has gone from being a prototype in our mind to being an executable on our devices. But the path wasn't a straight line. It was a graph of cyclic dependencies, recursion bugs, and lots of coffee.

## The Heart of the Beast: The Unique Generator

On Monday we ran smack into our first major obstacle. The generator we had sketched out the week before worked, yes, but it produced monsters.

Generating a Dominosa board is easy: put tiles randomly until the rectangle is full. The problem is that the player sees only the numbers, not the edges. And often, that soup of numbers could be interpreted in three or four different ways.

A good logic puzzle must have **one and only one solution**. If the player reaches a situation where they have to "guess" between two equally valid options, the designer has failed. The game ceases to be logic and becomes chance.

### Implementing the Backtracking Solver

To guarantee uniqueness, we had to write a *Solver* capable of solving the puzzle as an omniscient machine would.

We used a **Recursive Backtracking with Pruning** algorithm.
1.  Find the first empty cell.
2.  Try to place a valid tile (horizontal or vertical) that connects with a neighbor.
3.  Verify if that tile has already been used elsewhere on the board.
4.  If valid, advance to the next cell.
5.  If it hits a dead end, backtrack and try another orientation.

The trick to detecting uniqueness is not stopping at the first solution.

```kotlin
fun countSolutions(board: Board, inventory: Set<Tile>): Int {
    if (isFull(board)) return 1

    var solutions = 0
    // ... placement logic ...

    // If we find more than 1 solution, abort early.
    // We only care if it is 1 or >1.
    if (solutions > 1) return solutions

    return solutions
}
```

We modified the generator to work in a loop:
*   Generate a candidate board.
*   Pass it through the `Solver`.
*   Does it have exactly 1 solution? -> **SUCCESS**.
*   Does it have >1 or 0 solutions? -> **DISCARD** and retry.

This increased the load time from a few milliseconds to almost 2 seconds for large boards (Expert Level). To mitigate this, we moved generation to a `Dispatcher.Default` (background thread) and added a small "Shuffling tiles" animation. User perception went from "the app has frozen" to "the app is thinking of a worthy challenge for me". UX saves the day, again.

## The Battle of Touch Interaction

Mid-week, with the logic solved, we faced the UX. Dominosa requires drawing many small lines. In an 8x9 cell puzzle on a 6-inch screen, finger precision is a problem.

Our first testers (ourselves) reported frustration. They tried to connect the `3` with the `4` and ended up connecting the `3` with the `1` below.

We implemented a **"Snap-to-Grid" system with hysteresis**.
*   It's not enough to touch near an edge to activate the line.
*   We calculate the finger's movement vector.
*   If the user drags > 50% of the distance towards a neighbor cell, the system assumes intent and "magnets" the connection.
*   We added haptic feedback (a tiny vibration, 5ms) when the connection locks.

The difference was night and day. The game stopped feeling "slippery" and started feeling "mechanical", tactile, satisfying. Like snapping virtual Lego pieces.

## The Art of Giving Hints (Without giving away the solution)

On Thursday we realized that Dominosa is *hard*. Very hard. Unlike Sudoku, where an incorrect number is often revealed soon, in Dominosa an early mistake can go unnoticed until you are left with the last two tiles and realize nothing fits.

We needed a Hint System. But what is a hint in Dominosa?
*   Reveal a random edge? (Too easy).
*   Tell you where you messed up? (Too intrusive).

We opted for a **deductive AI**. We wrote a small inference engine that knows the basic logical rules a human would use:
1.  *Uniqueness*: "If there is only one possible place for the pair [6|6], then that must be the connection".
2.  *Exclusion*: "If the 3 in the corner only has one free neighbor, it must connect with it".

When you ask for a hint, the game doesn't "look" at the final solution. Instead, it runs this logic engine on your current state. If it finds a logically forced move, it shows it to you and explains *why* ("This 5 only has one free neighbor").

This is crucial: **teach the player to fish, don't give them the fish**. If the hint explains the logic, you become a better player. If it just reveals the answer, you become dependent on the machine.

## Integration and Deployment

On Saturday night, Dominosa was ready.
It was the moment of truth: execute `./gradlew build`.

Integration with the CI/CD system was surprisingly smooth, thanks to the previous work of Week 44. Dominosa wasn't a stranger; it was just another module fulfilling contracts.
*   Statistics initialized to zero.
*   Dark/light theme applied automatically thanks to our design tokens in `MaterialTheme`.
*   Translations (which we now handle more rigorously) were ready in `strings.xml`.

On Sunday, November 9th, we pushed the (metaphorical) merge button. *PuzzleSuite* now has 9 games.

## Weekly Reflection: The Hidden Debt

Closing this week, however, not everything is a celebration. When implementing Dominosa, we had to copy and paste the `GameCompletionDialog` code (the little window that pops up when you win).

Now we have 9 files called `GameCompletionDialog` (or variants) scattered around the project. 9 places to maintain. 9 places to introduce bugs. 9 places to change if we decide to refresh the design.

We have gone fast, yes. We have delivered value, yes. But we have made a mess in the kitchen.

Next week there will be no new games. No shiny features. Next week it's time to put on the rubber gloves and bleach. We are going to standardize. We are going to eliminate duplicates. We are going to pay the technical debt before the interest eats us alive.

Dominosa is alive. Now let's make sure the house where it lives doesn't collapse.
