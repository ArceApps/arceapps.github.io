---
title: "2025 W53: Closing the Year with Expert Level"
description: "Unification of difficulty systems across the suite and the arrival of Expert mode to bid farewell to 2025."
pubDate: 2026-01-04
tags: ["devlog", "refactoring", "ui-ux", "difficulty-systems", "2025-closing"]
heroImage: "/images/devlog-w53-difficulty.svg"
---

There is something deeply satisfying about closing the year with a clean house. In software development, "cleaning house" often means paying technical debt, standardizing components, and making sure all systems speak the same language. This last week of 2025, between the festivities and the New Year's toast, we set ourselves a mission: **Absolute Standardization**.

## The Chaos of Divergence

Until a few days ago, our games suffered from a subtle but annoying inconsistency. Hitori had a rudimentary difficulty selector; Galaxies used its own `GalaxiesDifficulty` system (which only went up to 3 levels); and Dominosa... well, Dominosa was fine, but I knew it was capable of more.

The problem wasn't that they didn't work. The problem was that each one solved the same problem differently. And if there is one thing we like at ArceApps, it is the elegance of shared patterns.

## The Great Unification

We decided that all games deserved the "Premium" treatment. We migrated Hitori, Slitherlink, and Galaxies to use the same UI component that already shone in Kakuro: the `PuzzleConfigurationSelector`.

But it wasn't just an aesthetic change. On the backend, this involved:

1.  **Eliminating Proprietary Enums**: Goodbye `GalaxiesDifficulty`. Now everyone uses the generic `Difficulty` of the domain. Less code, less confusion.
2.  **Dynamic Generation Logic**: We adjusted the generation algorithms to respond organically to 4 difficulty levels: **Easy, Medium, Hard, and Expert**.

### A Look at the Code

In **Slitherlink**, for example, difficulty now directly controls the density of clues. More clues means more constraints, which paradoxically makes the puzzle harder to deduce because there is more information to process simultaneously.

```kotlin
// Before: Scattered or non-existent logic
// Now: Precise control over density
val difficultyModifier = when (difficulty) {
    Difficulty.EASY -> -0.20    // 20% fewer clues (More freedom)
    Difficulty.MEDIUM -> -0.08
    Difficulty.HARD -> 0.05
    Difficulty.EXPERT -> 0.15   // 15% more clues (Pure deductive logic)
}
```

## Welcome, Expert Mode

The crown jewel of this update is the introduction of the **EXPERT** level in Galaxies, Dominosa, Hitori, and Slitherlink.

For **Galaxies**, this was an interesting design challenge. How do you make a symmetry game harder? The answer wasn't bigger boards, but *smaller galaxies*. We fragmented the space into tiny, irregular pieces, forcing the player to look for centers of symmetry in places where intuition fails.

In **Dominosa**, Expert mode reduces clues to the absolute minimum (1 clue max) and activates a "double shuffle" of tiles, guaranteeing that luck is not a factor.

## A Colorful Finale

And as the icing on the cake to welcome 2026, we gave **Fillomino** a facelift. We implemented a graph coloring algorithm (Greedy Coloring) to ensure that adjacent regions never share the same color.

We went from a palette of 8 colors to 14, and from a sequential assignment to a topological one. The result is a board that is not only prettier, but much more readable.

## Toast to 2026

We close week 53 with the satisfaction of duty accomplished. No loose ends, no half-migrated systems. The PuzzleSuite code base enters the new year more robust, more consistent, and prepared for whatever comes.

Happy New Year. See you in the code.
