---
title: "2025 W48: Invisible Foundations"
description: "Preparing the ground for feature parity. Backend work, Room migrations, and why Minesweeper is different from everything else."
pubDate: 2025-11-30
tags: ["devlog", "backend", "room", "architecture", "minesweeper"]
heroImage: "/images/devlog-w48-foundations.svg"
---

We reached the end of November. Week 48 (November 24th to 30th) has been, visually, the least impressive of the month. If you download this week's version and compare it with the previous one, you will barely notice differences on the screen.

But if you could see the database schemas with X-rays, you would see a massive construction site.

Our goal for December is ambitious: **Total Parity**. We want all games to have Statistics, History Achievements, and Tutorials. Currently, two of our most popular games, *Minesweeper* and *Galaxies*, are second-class citizens. They don't remember your best times. They don't celebrate your streaks. They just let you play and forget.

This week we put on the hard hat and went down to the code basement: the `Data Layer`.

## The Challenge of Minesweeper

Implementing stats for *Minesweeper* sounds trivial. "Save the time and that's it", right?
Not so fast.

Most of our puzzles (*Sudoku*, *Kakuro*) have a fixed difficulty based on logic. But *Minesweeper* is a game of **probabilities and mechanical speed**.
A time of 30 seconds on an "Easy" board is not comparable to 30 seconds on "Expert". And a "Custom" board is a world apart.

We had to design a statistics entity (`MinesweeperStatsEntity`) much more complex than its siblings.
*   We need to track `bestTime` for *each* difficulty level.
*   We need efficiency metrics: `3BV` (Bechtel's Board Benchmark), a standard measure in the competitive Minesweeper community to calculate the minimum click difficulty required.
*   We need `winStreak`, but with a cruel condition: restarting or quitting counts as a loss.

We designed a relational table in Room that could scale. We didn't want a column `bestTimeEasy`, `bestTimeMedium`... because it's rigid. We opted for a normalized structure where statistics are linked to `difficultyID`.

## Galaxies and Data Symmetry

*Galaxies* presented another problem. It doesn't have standard difficulties ("Easy", "Hard"). It relies on **Sizes** (10x10, 15x15).
How do you compare a game?
We decided that for Galaxies, the queen metric is not just time, but **Symmetry**.
We prepared the database to store not just `timeTaken`, but `actionsTaken`. We want to be able to tell the user: "You solved this 10x10 in 40 moves, the theoretical minimum was 36".

## The Nightmare of Migrations

Touching the database of an app in production is like defusing a bomb. One false step and you erase the history of thousands of users.
Android uses **Room** as an ORM over SQLite. When you change the structure of a table, you need to write a `Migration`.

This week we wrote migrations `MIGRATION_1_2` for Minesweeper and Galaxies.
1.  Create temporary table `new_stats`.
2.  Copy existing data (if any, which there isn't, but the script must be robust).
3.  Rename tables.
4.  Create indexes for fast lookups.

We tested this migration repeatedly. We created fake databases with old structures, applied the migration, and verified that the app didn't crash on startup. It's tedious work, "plumbing", but sleeping soundly knowing we won't cause an `SQLiteException` on anyone's phone is worth it.

## Preparing the UseCases

With tables ready, we went up a level to the Domain layer. We wrote the **UseCases** that encapsulate business logic.

*   `UpdateMinesweeperStatsUseCase`: Receives the result of a game. Decides if it's a new record. Calculates if the streak continues.
*   `GetGalaxiesHistoryUseCase`: Prepares data for the charts we will implement next week.

Here is where we define the "House Rules". For example: Does a win in less than 1 second count? (Probably a bug or a hack). We decided to put minimum validation thresholds in the UseCases to protect the integrity of future global leaderboards.

## Conclusion of November

We close the book of November exhausted but satisfied.
*   We launched a new game (**Dominosa**).
*   We unified the user interface.
*   We fixed the geometry of **Hashi**.
*   We redesigned the Home.
*   And now, we have poured the concrete for the skyscrapers of statistics we will build in December.

The codebase is 40% larger than a month ago, but it feels lighter. More ordered.
December will be the month of "Sparkle". Charts, medals, celebrations. But none of that would be possible without the dirty, dark, and silent work of this week 48.

See you in December.
