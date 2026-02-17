---
title: "2026 W04: The Silent Referee (and why deleting buttons is the best UX improvement)"
description: "A technical and philosophical dive into eliminating UI bureaucracy. How we moved from asking the user to fill out forms to creating a Reactive Auto-Verification system, and how we optimized O(N) graph cycle detection to run at 60fps."
pubDate: 2026-01-25
tags: ["devlog", "ux", "android", "algorithms", "performance", "graph-theory", "kotlin"]
heroImage: "/images/devlog-w47-ux-design.svg"
---

Last week, we have to admit, we got carried away.
We had successfully implemented the "Undo and Redo" system in the simplest **PuzzleHub** games. *Hitori*, *Sudoku*, *Kakuro*... all had fallen to our powerful Command pattern and Thread-Safe History Manager.
On Friday afternoon I closed my laptop with that dangerous, almost pathological arrogance that always precedes the most humiliating bugs of our career.
*"This is a piece of cake"*, I thought, with a satisfied smile that now, looking back, makes me want to slap myself. *"The architecture is solid. Logic is perfect. Next week will be just a matter of Copy-Paste for the rest of the games. I'll be free on Thursday."*

How wrong I was.
How young, naive, and stupidly optimistic was that "me" from just seven days ago.

This week we threw ourselves headfirst against what we internally call the **"Topological Giants"**: *Slitherlink*, *Fillomino*, *Dominosa*, and *Galaxies*.
These aren't games where interaction is simply changing a number in an isolated cell (static locality). These are games where every user action alters the fundamental structure of a global graph (dynamic topology).
And while fighting in the trenches with rebellious edges, infinite cycles, and connected regions that refused to close, we realized that our precious "undo button" was only half the equation.
The other half of the problem was much more subtle, almost invisible, but fundamental to the game experience: the **bureaucracy of winning**.

## Part 1: Slitherlink and the Edge Trilemma

Let's start our war chronicle with *Slitherlink*.
If you don't know it, it's a diabolical puzzle of Japanese origin (like almost everything good in this genre) where the goal is to connect points on a grid to form a single closed loop, with no crossings or branches, surrounding numbers that indicate how many lines must touch them.

In *Hitori* or *Sudoku*, the "atom of interaction" is a cell. A box.
In *Slitherlink*, the atom is an **Edge**. The invisible line between two points.
And here is where our architecture started to creak.
In our implementation for touch screens, we decided that an edge couldn't be just binary (LINE or EMPTY). We needed a third state to help the user discard impossible paths.
Thus was born the **Edge Trilemma**:
1.  **LINE**: "The loop passes here. I'm sure". (A solid colored stroke is drawn).
2.  **CROSS (X)**: "Nothing passes here for sure. It's an invisible wall". (A small gray cross is drawn).
3.  **EMPTY**: "No idea, buddy. I haven't thought about it yet". (Transparent).

### The Naive "Toggle" Bug

My first attempt to write the `SlitherlinkToggleEdgeCommand` was... let's say, optimistic.
I assumed I could treat interaction as a simple cyclic switch.
*"User touches an edge. If Empty, goes to Line. If Line, goes to X. If X, goes back to Empty"*.
Easy, right? Freshman code.

```kotlin
// Version 1 (The one that broke everything and made me lose an afternoon)
class ToggleEdgeCommand(val r: Int, val c: Int) : GameCommand {
    override fun execute(board: Board) {
        val current = board.getEdge(r, c)
        board.setEdge(r, c, current.nextState())
    }

    override fun undo(board: Board) {
        // "Just go back one in the cycle, what could go wrong?"
        val current = board.getEdge(r, c)
        board.setEdge(r, c, current.previousState())
    }
}
```

This worked wonderfully in controlled unit tests ("Test: Do A, Do B, Undo B, Undo A. All green").
But in the real world, chaos reigns.
What happened if the user, panicked or impatient, tapped the same edge three times very quickly?
What happened if, between the original command and the undo, the "auto-hints" system had modified the board state?

The `undo` command of my first version was **Relative** ("go back one").
When undoing in a "dirty" context (modified by other actors), the command simply rotated the state to the wrong value.
The user watched their line turn into an X instead of disappearing.
Game state was irrecoverably corrupted.

Learning by hard knocks: **Undo commands must be Idempotent and Absolute**.
A command shouldn't say "subtract 1". It should say "Value WAS 5, so put a 5, I don't care what's there now".
We had to rewrite all logic to capture surgical "Snapshots" of state.

```kotlin
// Version 2 (The good one, the robust one)
class SlitherlinkToggleEdgeCommand(
    val edgeIndex: Int,
    val oldMark: EdgeMark, // Immutable snapshot of the past: EdgeMark.CROSS
    val newMark: EdgeMark  // Immutable snapshot of the future: EdgeMark.EMPTY
) : GameCommand<SlitherlinkGameState> {

    override fun undo(state: SlitherlinkGameState): SlitherlinkGameState {
        // Authoritarian restoration.
        // We don't ask what's there. We impose the truth of the past.
        return state.copy(
            edges = state.edges.toMutableMap().apply {
                this[edgeIndex] = oldMark
            }
        )
    }
}
```

This small philosophical change —betting on absolute truth versus relative— saved our lives later in *Galaxies* and *Hashi*, where interactions are even more chaotic.

## Part 2: The Death of the "Check" Button

Mid-week, while my colleague fought with arc rendering in *Hashi*, I was testing a hard level of *Fillomino*.
It took me 12 minutes of sweat and deduction.
Finally, I placed the last piece. The board was perfect. Every polyomino was the right size. Mathematical harmony was total.

And the game... did nothing.
Absolute digital silence.

I stared at my phone screen like an idiot for five seconds.
*"Ah, right"*, I thought, feeling stupid. *"I have to hit the button"*.
I lifted my finger to the top bar, looked for a "Check" icon, and pressed it.
The "Congratulations!" dialog appeared.
But it was too late. The moment had passed.

In that instant, I felt cognitive friction so strong it almost gave me an allergic reaction.
We are in 2026. My phone has a Neural Processing Unit (**NPU**) capable of generating AI art in seconds or translating languages in real-time.
Why the hell do I have to *ask my phone nicely* to check if I added some numbers correctly?

It's outrageous.
It's like scoring a bicycle kick goal in the World Cup final, looking at the referee, and having him ask you to fill out **Form B-12: Goal Recognition Request** in triplicate, attach a photocopy of your ID, and wait 15 business days for it to go up on the scoreboard.
It's anticlimactic. It's bureaucracy. It kills dopamine.

### The Challenge: The Silent Referee

That afternoon we made a radical decision: **Eliminate the "Check" button**.
It was sadistic pleasure deleting those lines of XML and Jetpack Compose code. Seeing that icon disappear was liberating.

Instead, we proposed the concept of the **Silent Referee**.
We wanted an omniscient system that watched every player move and validated game state in real-time, invisibly.
The ideal flow we sought was:
1.  User places last piece.
2.  < 50ms of invisible processing.
3.  Boom! Confetti. "You won". No extra clicks. No questions.

### The Performance Problem: O(N) vs Battery

This sounds great on paper, but technically carries huge risk: **Performance**.
Validating a Sudoku is computationally cheap (check row and column sums).
But validating a *Fillomino* or *Slitherlink* is, technically speaking, "a pain in the ass".

In *Slitherlink*, to know if you won, the algorithm must do two things:
1.  **Local Validation (Fast):** Verify each cell has the correct number of edges around it. This is O(1) or O(Cells). Cheap.
2.  **Global Validation (Slow):** Verify all lines form a **SINGLE** closed loop. Not two separate loops. Not a loop with a loose "tail". A single Hamiltonian cycle (or similar).

To verify loop uniqueness, you have to traverse the entire graph (DFS or BFS).
Complexity is **O(N)**, where N is the number of edges. On a 20x20 board, there are hundreds of edges.
If we run this heavy algorithm EVERY TIME the user touches the screen (and expert users tap very fast, sometimes 3 or 4 times per second), the phone would heat up like a toaster in minutes. And worse, we would block the main thread, making the interface stutter (Jank).

### The Solution: Layered Optimization (Fast-Fail)

We designed a "Funnel" validation strategy (`TASK-2026-045`) to filter heavy work:

**Phase 1: The Doorman (Checks O(1))**
Before launching anything heavy, we check the obvious. We keep incremental counters in memory.
Are there "loose ends" (vertices with odd degree)?
We keep a `looseEndsCount` variable that updates with every move (+1 or -1).
`if (looseEndsCount > 0) return NOT_WON`.
If there is a single loose end, it is mathematically impossible to have a perfect closed loop. So we abort validation immediately. Cost: 0 nanoseconds.

**Phase 2: Asynchronous Validation with Debounce**
If it passes the doorman filter, we launch heavy validation (traverse graph).
BUT never on the main thread (`Main`).
And never immediately.
We use the goodness of **Kotlin Coroutines** to do it "delayed".

```kotlin
// ViewModel Logic: The art of waiting
var validationJob: Job? = null

fun onBoardChanged() {
    // 1. Cancel any previous validation that was running.
    // If user types fast, we "kill" previous half-done work.
    validationJob?.cancel()

    validationJob = viewModelScope.launch(Dispatchers.Default) {
        // 2. DEBOUNCE: Wait 50ms in silence.
        // If user touches again before 50ms, this job will die.
        delay(50)

        // 3. Run heavy algorithm on background thread
        val result = validateGameUseCase(currentState)

        if (result is ValidationResult.Success) {
            // 4. Only bother main thread if there is good news
            withContext(Dispatchers.Main) {
                onGameWon() // Confetti!
            }
        }
    }
}
```

**Debounce** (`delay(50)`) was the master key.
If the user drags their finger to mark a 10-cell line, the ViewModel receives 10 events in 200ms.
Without debounce, we would launch 10 parallel graph validations, saturating CPU.
With debounce, the first 9 cancel before birth. We only validate final state, when user lifts finger.
UI stays at rock-solid 120fps, and battery thanks us.

## Bonus Track: The Massacre of Views in Kakuro

Since we had our hands full of architectural grease, we took the opportunity to fix a technical embarrassment we dragged in *Kakuro*.
For weeks we noticed *Kakuro* ran slow on mid-range devices. Scroll felt heavy.

Investigating with Android Studio Profiler, we found the culprit: **Excess Composables**.
For a 15x15 board, we were using standard component `LazyVerticalGrid`.
Each Kakuro cell was a complex `Box` containing:
-   A `Text` for central value.
-   A `Canvas` to paint diagonal line.
-   Two small `Text` for clues (horizontal and vertical sum).
-   A `FlowRow` with up to 9 tiny `Text` for user notes.

Multiply 15x15 = 225 cells.
Times ~10 graphic elements per cell.
We had over **2,500 UI nodes** system had to measure, place, and draw each frame. It's madness. Android is powerful, not magic.

We decided to throw `LazyVerticalGrid` in trash.
We rewrote `KakuroBoard` component from scratch using a single giant **Canvas** (`TASK-2026-019`).
Now, instead of 2,500 nodes, we have **1 node**.
A single Canvas.
We manually calculate X/Y coordinates of every line, number, and note, and tell GPU: *"Draw text at (340, 520)"*.

Result was brutal:
-   Initial level load time: **-80%**.
-   RAM usage: **-60%**.
-   Scroll and zoom smoothness: Pure butter.

Yes, drawing pixels by hand is harder to maintain than using high-level components. You have to handle clicks, animations, and layout yourself. But for the core game component, where user spends 100% of time, it's worth every hour of engineering invested.

## Conclusion

This week is about removing friction.
We removed **interaction friction** with robust Undo understanding topology.
We removed **bureaucratic friction** with Silent Referee validating victory instantly.
And we removed **performance friction** rewriting Kakuro rendering engine.

PuzzleHub is now a quieter app. More respectful. It doesn't yell when you mess up. It doesn't ask you to fill forms to win. It's simply there, watching, validating, and ensuring experience is fluid.

Next week, we stop polishing existing stuff and go back to creative building phase. Two new games enter arena. One involves complex math, so get calculators (or brains) ready.

---
*End of weekly report.*
