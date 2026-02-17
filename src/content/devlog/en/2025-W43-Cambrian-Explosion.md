---
title: "2025 W43: The Cambrian Explosion"
description: "Doubling the catalog in seven days. From 4 games to 8. Code reuse reaches its peak, but technical debt starts accumulating interest."
pubDate: 2025-10-26
tags: ["devlog", "minesweeper", "hashi", "tech-debt", "productivity"]
heroImage: "/images/devlog/2025-w43-cover.png"
---

In evolutionary biology, the "Cambrian Explosion" was a brief period where life on Earth diversified at an unprecedented speed. Suddenly, almost all animal body plans we know today appeared. It was chaos of biological creativity.

In *PuzzleSuite*, Week 43 (October 20th to 26th) was our own explosion.

We entered Monday with 4 stable games (Shikaku, Hitori, Fillomino, Slitherlink).
We left Sunday, exhausted but euphoric, with **8 functional games**.
We added **Kenken** (Calcudoku), **Kakuro**, **Hashi**, and the classic grandfather of the genre: **Minesweeper**.

How is it possible to double the catalog in 7 days without dying in the attempt?
The short answer is: Copy and Paste with style.
The long answer is that our investment in modular architecture finally paid dividends... but we are also starting to see the small print of the contract.

## Kenken and Kakuro: The Arithmetic Family

We started with Kenken and Kakuro. They are first cousins.
Both require filling cells with numbers. Both have "sum" constraints. Both require an on-screen numeric keypad.

Here we felt like geniuses. We were able to reuse 90% of the code.
We created a `NumberInputPad` component that both share.
The sum validation logic was extracted to a utility function.
Implementing Kakuro was basically: "Extend from Kenken, change the way the grid is drawn (clue triangles), and done". We had Kakuro working in a single day. This is the dream of code reuse.

## Hashi: A Bridge Too Far

But the celebrations ended when **Hashi** arrived.
Hashi requires connecting islands.
The problem is that Hashi is not a dense grid. It is a **sparse graph**. Most of the screen is empty.
We tried to force Hashi to use the `Grid` structure we created in Week 41 (the one using a flat Array).

It was a conceptual error.
To represent a Hashi in memory, we had to fill our Array with `nulls`.
*   "Cell (0,0)? Null."
*   "Cell (0,1)? Null."
*   "Cell (0,2)? Island."

The `HashiViewModel` filled up with "hacks" and patches to translate between screen coordinates and logical graph nodes. It works, but the code is ugly. It's a reminder that **there is no perfect abstraction for everything**. Sometimes, trying to unify too much creates more complexity than it saves.
*Note to self for the future: Rewrite the Hashi engine as a real graph of nodes and edges, not a matrix.*

## Minesweeper: The Intruder

And on Friday came **Minesweeper**.
Minesweeper is the "weirdo" of the collection.
All our other games are static: you solve it at your own pace. You have all the information from the start.
Minesweeper is dynamic. It's a game of hidden information and risk.

It broke all our rules:
1.  **Defeat States**: In Sudoku you don't suddenly "lose". In Minesweeper, one click and *Game Over*. We had to add handling for irreversible defeat states that didn't exist in the base engine.
2.  **Dual Interaction**: Requires clearly differentiating between "Tap" (uncover) and "Long Press" (flag).
3.  **Post-Click Generation**: To be fair, the user's first click must ALWAYS be safe. This means we can't generate the map at the beginning. We have to wait for the user to touch the first cell, and *then* generate the mines around that point to ensure a gap. This "lazy generation" forced us to refactor the entire game start flow.

Minesweeper is full of `if (gameType == MINESWEEPER)` scattered throughout the common code base. That smells bad. It smells like technical debt.

## The Hangover of Success

Closing the week, the app is impressive. 8 games. All playable. Infinite generation.
From the outside, it looks like a total triumph of productivity.

But from the inside, we see the seams of the suit.
*   The "Selection" colors are inconsistent (green in one, blue in another).
*   The "Victory" screens are slightly different because we copied and modified them.
*   Hashi lags a bit on large boards due to the inefficient data structure.

We have prioritized **Quantity** over **Quality** this week. It was necessary to reach the "critical mass" of games that makes the app worth downloading.
But we can't keep up this pace. We have taken out a loan from the Technical Debt bank, and the interest will start being charged in November.

A new month is approaching. And with it, the promise of one last game (Dominosa) and the inevitable need to clean up the mess of this wild party. The "Cambrian Explosion" is over. Now comes natural selection.
