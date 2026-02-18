---
title: "2025 W49: Achievements Unlocked"
description: "Minesweeper and Galaxies join the party, completing the achievement system for all 10 games."
pubDate: 2025-12-07
tags: ["devlog", "gamification", "minesweeper", "galaxies"]
heroImage: "/images/devlog-w49-achievements.svg"
---

This week marks an important milestone in the history of *PuzzleSuite*. For a long time, *Minesweeper* and *Galaxies* were the "little brothers" of the catalog, mechanically excellent but lacking that layer of depth offered by statistics and achievements.

In week 49, we corrected that historical injustice.

## 🏆 Feature Parity

The goal was clear: ensure no game felt less complete than the others. We dove into the codebase to implement:

1.  **Complete Statistics Systems**:
    *   For **Minesweeper**: We track "Win Rate", "Best Times" by difficulty, and specific actions like "Flags placed".
    *   For **Galaxies**: Symmetry metrics, solution times, and "Perfect Games".

2.  **20 Achievements per Game**:
    *   We designed 20 unique challenges for each title, from basic tutorials to expert-level feats.
    *   Win an Expert Minesweeper without using flags? There's an achievement for that.
    *   Solve a giant Galaxies in less than 2 minutes? There's a medal too.

## 💾 The Invisible Plumbing

What the user sees are shiny medals, but what we see are **Database Migrations**.

Implementing this required touching the sensitive core of our data persistence (Room). We had to create new tables `minesweeper_stats` and `galaxies_achievements` making sure not to lose a single byte of our existing users' saved games. It is the kind of open-heart surgery that is terrifying, but went perfectly.

## 🎯 10 out of 10

With these changes, now we can say that we have a consistent suite of 10 games. There are no more "beta games" or "legacy games". All share the same architecture, the same 'quality of life' features, and the same love for detail.

Next week, we will focus on polishing those small UX details that make the difference between a good app and a great one.
