---
title: "2026 W05: The Quest for Mathematical Truth (and why we imported a quantum physics library)"
description: "A 3000-word chronicle on how we tried to add two 'simple' games and ended up fighting NP-Complete problems. The story of how a simple light board forced us to use industrial SAT Solvers and how integer division almost destroyed our mental health."
pubDate: 2026-02-01
tags: ["devlog", "algorithms", "sat-solver", "procedural-generation", "difficulty-design", "android", "math"]
heroImage: "/images/devlog-default.svg"
---

This week was supposed to be quiet. I swear.
The plan at Monday's *Daily* was insultingly simple: "PuzzleHub engine is stable. This week is content time. Two new games: *Akari* and *Math Crossword*. Static grids, simple logic. We'll be done by Thursday".

Narrator: *They were not done by Thursday.*

What followed was one of the most intense, frustrating, and technically demanding weeks of the entire project. We went from designing pretty interfaces in Jetpack Compose to reading obscure academic papers on boolean satisfiability at 3 AM, and debugging backtracking algorithms performing half a million operations per second just to try and place a simple plus sign (`+`) without breaking fundamental laws of the universe.

This is the story of how two seemingly harmless games almost broke our brains, and how **Hardcore Algorithmic Engineering** (the kind college tells you you'll never use in real life) saved us from disaster.

## Part 1: Akari and the Illusion of Simplicity

*Akari* (also known as *Light Up*) is a puzzle of almost insulting Japanese elegance.
You have a dark grid. You have light bulbs.
Rules fit in a haiku:
Bulbs light up in a cross until hitting a wall. Two bulbs cannot look directly at each other. All white cells must be lit.
Seems like child's play.

By Monday afternoon we had visual implementation working. Board looked beautiful with dark theme. You could place bulbs. Lights turned on.
Only one small piece missing: **Level Generator**.
"Bah", I thought with typical arrogance of engineer who hasn't checked Wikipedia. "It's easy. Place bulbs randomly where they fit, then place black walls to fit solution".

### First Attempt: Naivety of Greedy Algorithm

I wrote a *Greedy* algorithm in 30 minutes.
Logic was simple: Iterate through empty board. Does a bulb fit here without breaking anything? Place it with 30% probability. Repeat until everything lit. Count final bulbs. Say **15**.
Done. That's "Level Record". Target to beat.

We launched internal build. Sat on couch, coffee in hand, to test creation.
Medium Level (10x10). Game challenged me: **"Target: 15 Bulbs"**.
Started playing. Placed bulb here, there... optimizing moves.
Solved puzzle. Board glowed orange.
Looked at counter: **12 Bulbs**.

Blood ran cold.
I had beaten generator "Record" by 3 moves.
In logic puzzle world, this is cardinal sin. "Par" (ideal target) must be **mathematically perfect**. Absolute Truth. If user can solve puzzle with fewer resources than machine, machine is stupid. And if machine is stupid, user instantly loses respect for game. Magic breaks.

Problem with Greedy algorithm is it's short-sighted. Makes local decisions. Places bulb in corner (0,0) because "it fits", without knowing if it waited and placed one at (0,1), it would have lit two corridors at once instead of one.
My generator wasn't finding optimal solution. It was finding *any* solution, a sloppy lazy solution.

### Descent into Backtracking Madness

Tuesday decided to fix it. "We need to find Global Minimum", said in meeting.
Implemented solver by **Backtracking** (Recursive Brute Force).
Algorithm is conceptually simple, kind of thing asked in job interview:
Try placing bulb. Call function recursively. If reach end, save record. If not, backtrack, remove bulb and try another path.

For 7x7 board (Easy Level), worked in 50 milliseconds. Perfect.
For 10x10 board (Medium Level), took about 2 seconds. Acceptable for background generator.
For 15x15 board (Expert Level)...
Emulator froze.
Laptop fan started sounding like Boeing 747 trying to take off from desk.
Checked logs: `Recursion depth: 225`.
10 seconds passed. 20 seconds. 30 seconds. **Timeout**.

Realized with horror what I had gotten myself into.
*Akari* is **NP-Complete** problem. Search space grows exponentially with each cell (`2^N`). On 15x15 board there are 225 cells. `2^225` is number with more zeros than atoms in observable universe.
Was trying to count to infinity one by one.
Couldn't use brute force. Needed science.

### Nuclear Solution: SAT Solvers and Sat4j

Here story stops being about video game development and becomes advanced Computational Logic class.
Vaguely remembered college classes. "Every NP problem can be reduced to SAT (Boolean Satisfiability) problem".
If we could translate *Akari* visual rules to arid language of propositional logic, could use industrial SAT engine (same ones NASA uses to verify critical software or Intel to design chips) to solve it in milliseconds.

Decided to import `org.sat4j.core` library to Android project.
Yes, put 5MB compiler library in mobile puzzle game. No regrets.

Challenge was **Encoding**. Had to translate game to Boolean Algebra.
Defined each cell (i, j) as variable $X_{i,j}$.
If $X_{i,j}$ is True, there is bulb. If False, empty.
Then, wrote human rules as CNF (Conjunctive Normal Form) clauses:

**No-Conflict Rule** became: "For every pair of cells seeing each other, $(\neg A \lor \neg B)$" (Cannot both be true).
**Lighting Rule** became massive disjunction: "For every white cell, $(L_1 \lor L_2 \lor ... \lor L_k)$" (At least one neighbor must be true).
**Numeric Wall Rule** was hardest. Wall with "2" forced complex cardinality constraints.

Once entire system of logical equations modeled, threw problem at `Sat4j`.
But SAT Solver is binary. Only says "Yes, possible" or "No, impossible". Doesn't tell minimum number of bulbs.
So had to wrap solver in **Binary Search**:
1.  Solver, solution with 20 bulbs exists? -> YES.
2.  Solver, exists with 10? -> NO.
3.  Solver, exists with 15? -> YES.
4.  Solver, exists with 12? -> NO.
...

Result is pure technological black magic.
Solver chews 15x15 board, builds implication graph with thousands of nodes, uses conflict-driven clause learning (CDCL) heuristics, prunes impossible universe branches... and spits result: **"Mathematical minimum is 17"**.
Execution time: **210 milliseconds**.

Went from 30 seconds (and possible StackOverflow crash) to 0.2 seconds.
Now, when playing Akari on PuzzleHub and see "Record: 17", that's not suggestion. It's **Absolute Truth**. Mathematically no configuration of 16 bulbs exists in this universe to solve board. You can try all your life, but math says no. And that certainty gives quality to puzzle game.

## Part 2: Math Crossword and Tyranny of Integers

With ego in clouds after taming NP-Complete problem, thought: "Next game trivial. Math Crossword. Add and subtract. Elementary stuff. Piece of cake".

*Math Crossword* is grid where words are intersecting equations.
Horizontal: `12 + 5 = 17`.
Vertical: `17 - 8 = 9`.
All intersections must match perfectly.

Generating this procedurally turned out to be **CSP (Constraint Satisfaction Problem)** nightmare.
Imagine generating horizontal row: `10 / 2 = 5`.
Good. Now have fixed `2` on board.
Have to generate vertical column crossing compulsorily through that `2`.
Say `2 + 8 = 10`.
Good. Now have `8` and `10` fixed in other positions.
Those numbers force creation of new horizontal rows...
Explosive chain reaction. And if mistake in step 1, error propagates like wave to opposite corner of board, making it impossible to fill.

But the true villain of story wasn't recursion. It was simple symbol: **Division (/)**.

If only used addition and subtraction, problem trivial. Any number can be added or subtracted.
But wanted 4 operations. And division is **toxic**.
Extremely demanding:
*   `7 / 2 = 3.5`. Don't want decimals in game.
*   `10 / 3 = 3.333`. Don't want recurring decimals.
*   `5 / 0`. App crash.

Decided to impose **Golden Rule**: All divisions must be integer and exact (`a % b == 0`).
Seems reasonable, but drastically reduces search space. Of all possible number pairs in universe, only tiny fraction is exactly divisible.
This caused generator to constantly get "cornered". Reached cell desperately needing number satisfying four impossible conditions at once:
1.  Result of `X + 5`.
2.  Exact dividend of `Y / 4`.
3.  Positive (no negatives to scare kids).
4.  Less than 200 (to fit UI).

Often, magic number didn't exist. Generator died.

Since couldn't use SAT Solver (too many numeric variables with infinite domains), went back to **Backtracking**, but armed with **Aggressive Retry Strategy**.

Algorithm now works like stubborn, tireless builder:
Pick slot. Try generating valid equation. Fail because division not exact? Try another operator (`+`). Fail too? Try `-`.
Fail 10 times in row? Perform **Local Backtrack**. Delete *previous* equation (forcing this number here) and try regenerating to give different number at intersection.

Defined `MAX_RETRIES_PER_SLOT = 500`.
Give algorithm 500 chances to fail *per damn cell*.
On 11x11 Expert board, means engine performing millions of failed attempts, corrections, and retries per second in background.

Watching `Logcat` logs while generating level is fascinating, like watching someone try to crack safe trying combinations at light speed:
```text
[CSP] Slot(3,4) impossible. Constraint: Must be divisible by 7.
[CSP] Retrying Slot(3,4)... Attempt 154.
[CSP] Retrying Slot(3,4)... Attempt 155.
[CSP] Backtracking to Slot(2,4)... Changing '14+2' to '28-12'.
[CSP] Slot(3,4) success!
```
Controlled chaos. Brute force directed by strict constraints. But guarantees every puzzle **unique, valid, and solvable**.

## Part 3: Visual Soul (From Engineer to Artist)

After so much algorithmic fighting and math blood, had to relax brain with visual design.
First functional prototype of *Akari* was, generously speaking, horrible.
Black walls (`#000000`). Standard gray grid. Yellow bulbs (`#FFFF00`).
Looked like broken Excel sheet. Functional, yes, but no soul. Didn't invite play.

Decided to apply color theory to breathe life. Here discovered power of nuance.

First, banished pure black. Never use `#000000` in modern interface. Pure black is black hole absorbing screen light creating infinite contrast with white tiring eyes quickly.
Switched to **"Charcoal"** (`#1A1A1C`), deep charcoal gray with touch of warmth. Softer, organic, "premium".

Then, attacked light problem. Standard yellow on dark background tends to look greenish sickly on OLED screens.
Switched to vibrant **Amber Orange** (`#FF9800`). Wanted bulbs not looking like cold LEDs, but incandescent tungsten filaments. Wanted board feeling warm, like fireplace.

But most important change wasn't aesthetic, functional. Called **Reactive Feedback** (Cognitive Offloading).
In *Akari*, have numeric clues on walls (ex. "2").
Initially, had to count mentally: *"Let's see, wall has 2, has two bulbs next to it... okay, complete"*.
Useless cognitive load. Forcing user brain to do administrative micro-tasks instead of focusing on puzzle logic.

Made numbers come alive.
*   If bulbs missing, number neutral white.
*   If exceeded (have 3 bulbs around "2"), number turns **Alarm Red**.
*   If condition perfectly satisfied, number glows bright **Amber Orange**.

Effect on gameplay immediate. Now scan board with quick glance, your lizard brain detects color patterns without conscious arithmetic. *"Orange is good. White needs attention"*.
Game flows. Friction disappears.

## Conclusion

This week added two new games to suite.
Visually, just grids with numbers and lights. Seem simple.
But under hood, logic engine worthy of doctoral thesis.

In *Akari*, **SAT Solver** pruning $2^{225}$ branch decision trees in 200 milliseconds to tell mathematical truth about record.
In *Math Crossword*, **Constraint Satisfaction** algorithm fighting combinatorial chaos millions times per second ensuring never meet inexact division.

User will never know. Probably never read this post.
User only sees game "feels good". Levels "fun" and "fair". "Always solution".
And that is greatest compliment for engineer: complexity invisible, only magic remains.

---
*End of weekly report.*
