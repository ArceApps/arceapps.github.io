---
title: "2025 W46: The Broken Window Theory"
description: "Why we decided to halt development of new features to fix a pixel 6dp out of place, and the hunt for the geometric bug in Hashi."
pubDate: 2025-11-16
tags: ["devlog", "refactoring", "bugfix", "ui", "clean-code"]
heroImage: "/images/devlog-w46-broken-window.svg"
---

There is a criminological theory called "The Broken Window". It states that if you leave a broken window in a building, soon all the other windows will be smashed. Disorder invites disorder. Visible neglect indicates that "no one cares", and that lowers everyone's standards.

In software development, this is an absolute truth. If you have a screen with a misaligned title, soon you will have functions with inconsistent names, then ignored logic bugs, and finally, an unmaintainable product.

Week 46 (November 10th to 16th) was our "fix windows" week. After the Dominosa sprint, we looked at *PuzzleSuite* and saw many small cracks.

## The Case of the Missing Button

The first target was a recurring complaint (even internal): the **Reset** button on the top bar.
We had a "refresh" icon in the top right corner of some games (Shikaku, Dominosa, Fillomino), but not others (Minesweeper). Inconsistency #1.

Worse, the behavior was ambiguous.
*   In Shikaku, the button cleared your current progress but kept the same puzzle.
*   In Hitori, it sometimes seemed to generate a new one.

And most serious: it was dangerously close to the options menu. Imagine solving an Expert puzzle for 20 minutes, going to change the dark theme, missing the click by 4 millimeters, and seeing your work erased instantly. No confirmation. No "Undo".

We decided to apply a radical solution: **Elimination**.

We deleted the Reset button from the top bar in all games. Instead, we standardized the "New Game" flow. Now, if you want to restart, you must go to the explicit menu or finish the game.
But we went further. We modified the "Game Completed" dialog so that the main button is not "Play Again" (which was ambiguous), but **"New Puzzle"** (with a `+` icon).

This required touching 16 files in 10 different modules. It was tedious. It's not the kind of work you put on a resume ("Deleted a button"). But UX gained clarity and safety immediately. No more accidental restarts.

## Hashi: Forbidden Geometry

While we were cleaning the interface, our automated reporting system (Sentinel) started spewing silent errors coming from **Hashi**.
Hashi is a game about connecting islands with bridges. The golden rule is: **"Bridges cannot cross"**.

Turns out our code wasn't respecting its own golden rule.

Under certain conditions, the puzzle generator created islands in positions such that the only logical solution required two bridges to cross in an 'X'. And since our validator prevented the user from crossing bridges, the puzzle became unsolvable. A mathematical dead end.

### The Anatomy of the Crossing

To fix this, we had to dive into computational geometry.
It's not enough to check if two lines touch. We had to implement a robust `bridgesWouldCross(bridge1, bridge2)` function.

```kotlin
fun bridgesWouldCross(b1: HashiBridge, b2: HashiBridge): Boolean {
    // If they go in the same direction (both horizontal), they don't cross (overlap or parallel)
    if (b1.direction == b2.direction) return false

    val h = if (b1.isHorizontal) b1 else b2
    val v = if (b1.isVertical) b1 else b2

    // For them to cross, H's row must be INSIDE V's row range
    // And V's column must be INSIDE H's column range
    return (h.row in (v.startRow + 1) until v.endRow) &&
           (v.col in (h.startCol + 1) until h.endCol)
}
```

We implemented this validation in three layers (The "Defense in Depth" strategy):
1.  **In the UI**: The game now physically prevents you from dragging a bridge if it's going to cut another existing one. Shows immediate red feedback.
2.  **In the Generator**: Each generated puzzle passes through a validity filter. If the generator produces a puzzle requiring a crossing, it is discarded and retried (up to 3 times).
3.  **In the Solver**: The "Solve" button (our source of truth) now verifies that its proposed solution does not contain crossings. If it does, it falls back to a slower but safer recursive search.

It was like fixing a leaky pipe while the water was still running. But now, Hashi is mathematically honest.

## Standardization of Screens

With critical bugs resolved, we went back to aesthetics.
We unified margins. It seems trivial, but having 16dp padding on the *KenKen* screen and 24dp on *Galaxies* created a subconscious feeling of "cheap", of "amateur".

We created a base Composable `GameScreenScaffold` that enforces:
*   The same TopBar.
*   The same inset handling (so the front camera doesn't cover the game).
*   The same `GamePauseOverlay` behavior.

Speaking of the pause overlay: we discovered that in some games, even though the "PAUSE" screen was visible, you could still touch the board behind it. A clever user could pause time and continue solving the puzzle "blindly" or visually.
We fixed this by intercepting all touch events on the pause layer. The timer is now sacred. If you stop time, you stop the game.

## Reflection: The Discipline of the Invisible

This week we haven't added a single new feature that the marketing team can sell. "Now margins are equal" doesn't sell copies.

But software quality isn't measured only by what it does, but by how it makes you feel while using it. Consistency breeds trust. A user who sees that buttons, dialogs, and errors behave the same in 10 different games starts to trust the application. Stops fighting the interface and starts flowing with the game.

We've spent the week sweeping the floor and changing light bulbs. And the house has never looked better.
Now that the foundations are clean, we are ready to bring in the new furniture. Week 47, here we come.
