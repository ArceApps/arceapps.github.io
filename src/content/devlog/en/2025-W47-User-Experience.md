---
title: "2025 W47: The White Lie and the Redesign"
description: "How we redesigned the app's main entrance and discovered we had been lying to our users about their stats."
pubDate: 2025-11-23
tags: ["devlog", "frontend", "stats", "bugfix", "design-system"]
heroImage: "/images/devlog-w47-ux-design.svg"
---

They say there is no second chance for a first impression. In a mobile app, that first impression happens in the first 3 seconds after launch.

For months, the `HomeScreen` of *PuzzleSuite* has been... utilitarian. A vertical list of buttons. "Minesweeper", "Sudoku", "Hashi". Functional, yes. Inspiring, no. It looked more like a debug menu than a portal to a world of logic and entertainment.

Week 47 (November 17th to 23rd) began with an aesthetic mission: give *PuzzleSuite* the face it deserves. But it ended with an ethical mission: correct an error that was silently corrupting our players' data.

## The Art of Welcome

The redesign of the home screen wasn't just "putting pretty colors". It was an exercise in information architecture.
With 9 games (and counting), a simple list no longer scales. The user suffers from "choice paralysis".

We reimagined the Home based on the concept of "Game Cards" (`GameCard`).
Each card is not just a button. It is a miniature dashboard:
*   **Dynamic Icon**: Shows a stylized representation of the puzzle.
*   **Current Status**: "Do you have a game in progress?". We show elapsed time and percentage completed directly on the card. A "Continue" button shines inviting you back.
*   **Quick Stats**: Your total wins and best streak, visible at a glance. Passive gamification.

Technically, this involved changing how we query the database. Before, the Home didn't ask for data. Now, it needs to query the status of 9 different tables (`MinesweeperDao`, `HashiDao`, etc.) in real-time without blocking the UI.
We implemented a `HomeViewModel` that uses `Kotlin Flows` to combine (`combine`) all these data streams into a single `HomeUiState` object. The screen reacts instantly: if you finish a puzzle and go back, the card is already updated. It feels alive.

We also renewed the **Onboarding**. Before, when opening the app for the first time, we dropped you into the menu without a map or compass. Now, a sequence of clean slides explains what the app is, how difficulties work, and promises that we don't collect your private data. It's a digital handshake before starting to play.

## The Bug of the "Empty Victory"

While testing the new Home and its shiny stats counters, we noticed something strange.

I was testing the game *Hitori*. I got stuck on an Expert level and, out of pure frustration (and testing purposes, of course), I pressed the debug button **"Solve"**. The puzzle completed before my eyes. The victory dialog appeared. I went back to the menu.

The "Wins" counter remained the same.

I thought it was a UI refresh error. I closed the app. Opened it. Nothing.
I got a chill. What if statistics weren't being saved?

I investigated the `HitoriGameViewModel` code. I found the `solve()` function:

```kotlin
fun solve() {
    val solvedPuzzle = logic.solve(currentPuzzle)
    _uiState.value = _uiState.value.copy(puzzle = solvedPuzzle, isCompleted = true)
    // End of function.
}
```

Do you see it? Something was missing. *Everything* was missing.
The function updated the UI visually to show the solved puzzle, but **never called the database**. It didn't call `repository.updateStats()`. It didn't calculate streaks. It didn't unlock achievements.

For the system, that game never happened. It was a ghost victory.

### The Scale of Disaster

I did a quick audit. Only Hitori?
No. **Shikaku**. **KenKen**. **Kakuro**. **Hashi**. **Fillomino**. **Minesweeper**.
7 of our 9 games had the same defect in their autocomplete/solve function.

We had to emergency patch 7 ViewModels. We created a unified pattern:
1.  Solve the puzzle in memory.
2.  Save the puzzle state in DB (so it counts as finished).
3.  **Explicitly** trigger stats update (`trackStatsOnCompletion`).
4.  **Explicitly** check achievements (`checkAchievements`).

Now, if you use "Solve", the game counts as a win (although internally we mark it as "assisted", basic stats go up). We are honest with the database.

## Hitori and the Mathematics of Progress Bars

Since we were fixing numbers, we attacked another visual report in *Hitori* and *Hashi*.
Users reported that the progress bar sometimes reached 110% or stayed at 90% when finishing.

In **Hashi**, the bar was calculated by summing the required bridges of all islands.
`Progress = Placed_Bridges / Sum_Required_Bridges`.
Rookie mistake: Each bridge connects TWO islands. Therefore, each bridge contributes to satisfying TWO numbers. We were counting demand double, but supply single (or vice versa depending on code version).
The fix was a lesson in mathematical humility: `Real_Total = Required_Sum / 2`.

In **Galaxies**, the problem was similar with walls. Internal walls divide two galaxies, external ones only one. Our formula treated all walls equal. We had to split the problem into "Edge Walls" and "Internal Walls" to normalize the percentage to exactly 100%.

## Conclusion

Week 47 was a reminder that a pretty interface is useless if the data it shows is a lie.
We have dressed the monkey in silk, yes, but we have also ensured that the monkey is healthy inside.

Now the Home invites you in, and when you play (or even when you cheat and hit "Solve"), the app remembers you and counts you. Trust between user and system has been restored.

One week left to finish November. And we have a pending debt with two games that still have no stats or achievements: *Minesweeper* and *Galaxies*. They are the last outcasts. In week 48, we will go for them.
