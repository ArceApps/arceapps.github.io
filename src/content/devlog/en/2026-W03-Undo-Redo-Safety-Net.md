---
title: "2026 W03: The Safety Net (Or how we implemented Undo in 10 games at once)"
description: "The detailed technical story behind the implementation of the Undo/Redo system in PuzzleHub: design patterns, concurrency problems with coroutines, efficient memory management, polymorphic serialization, and the search for the perfect UX on Android."
pubDate: 2026-01-18
tags: ["devlog", "architecture", "android", "kotlin", "design-patterns", "testing", "clean-code", "concurrency"]
heroImage: "/images/devlog-default.svg"
---

This week in **PuzzleHub** development, we faced one of those features that, seen from the outside, seems like the most trivial thing in the world: "Just put an undo button, right?". That phrase, often uttered by optimistic Product Managers (or by my own tired brain at 2 AM), hides an iceberg of colossal architectural complexity. Especially when you're not making a _To-Do List_, but you have to maintain stability, data integrity, and fluid performance of **10 different game engines** simultaneously, each with its own rules, data structures, and logical peculiarities.

We are talking, of course, about the **Undo and Redo** system. And I'll spoil the ending: No, it wasn't as easy as putting a button and calling a magic function. It was a whole week of rewriting the foundations of the application, fighting with invisible race conditions that only happened one in a thousand times, and philosophically rethinking how we model the passage of time in our software architecture.

## The Problem: Existential Fear of the Final Click

Let's start with the "why". It might seem like a secondary feature ("nice to have"), but in the logic puzzle genre, it is vital. If you have ever played deep deductive logic games like *Slitherlink*, *Dominosa*, or *Fillomino* on a touch screen, you will know that specific feeling of anxiety. I call it **"The Fear of the Final Click"**.

You are in what psychologists call "The Zone" or "Flow State". You've been playing a Hard level for 15 or 20 minutes. The outside world has disappeared. Your brain has built an extremely complex logical house of cards in your working memory: *"If this cell is a 3, the one next to it cannot be an edge, which means the 2 above must exit to the left, and that forces the 1 to close..."*.
You have the puzzle 95% solved. Only the last strokes remain.
And suddenly... the bus hits a bump. Or your cat decides it's time to jump on the sofa. Or simply, the touch screen interprets a 10-millisecond tap as a drag.

You place a line where it shouldn't go.
In games with strict topological rules like *Slitherlink*, the internal validation system detects the contradiction immediately. The cell flashes aggressive red.
Your state of perfection breaks.
Or worse: you don't realize the mistake at that moment. You keep building your logic on that erroneous base for 5 or 10 more minutes. Suddenly, you reach a logical dead end. An impossible contradiction. You check the board and realize the fundamental error occurred 50 moves ago and is impossible to trace. All your recent work is garbage.

Until last week, **PuzzleHub** was ruthless with these errors. A fatal error often meant having to restart the level from scratch, erasing all progress. This friction cannot be classified as "challenging difficulty" (like in *Dark Souls*); it is simply **interface hostility**.
In 2026, users justifiably have very high expectations. They expect software to be forgiving (*Forgiving UI*). They expect a safety net that allows them to experiment. They want to be able to say: *"What happens if I put a 5 here? I'm going to test this hypothesis"*, and if the answer turns out to be *"Absolute chaos"*, they want to be able to press a button and return to the safe past, as if nothing had happened.

Our goal for this week was clear: Weave that safety net for **all** our games, from the binary simplicity of *Hitori* to the arithmetic complexity of *Kakuro*, and do it without having to rewrite the core logic of each of them from scratch.

## The Architecture: In Search of the Perfect Design Pattern

When faced with the problem of implementing "Undo", the naive solution is tempting. If you have a single simple game (say, a *Sudoku* clone), you can implement it by saving complete copies of the board every time the user does something.
It's what is known as the **Memento** pattern in its crudest version:
*   User puts a number. -> Save a copy of the entire `Board[9][9]` array in a list.
*   User puts another. -> Save another copy.
*   User presses Undo. -> Read position `n-1` from the list and overwrite the current board.
It's code you can write in 10 minutes.

But PuzzleHub is not "a game". It's a professional suite. And our game states are complex and heavy objects.
Imagine a **Kakuro** board in Expert mode, 15x15 cells.
Each `KakuroCell` object is not a simple integer. It contains:
1.  Its Current Value (Int).
2.  Its Lock State (if it is an immutable initial clue).
3.  Its background color (to indicate errors or selection).
4.  A `List<Int>` of "Candidates" or notes the user has written in the corners.
5.  References to parent `Sum` objects (horizontal and vertical).

Multiply that by 225 cells. Now imagine the user, in a quick game, makes 200 moves.
If we used full snapshots, we would be creating 200 deep copies of this entire object graph. In a long game, we would be generating megabytes of heap garbage per second. This would force Android's **Garbage Collector (GC)** to work overtime, pausing app execution to clean memory ("Stop-the-world events").
The visible result for the user would be those micro-stutters (jank) that happen when scrolling or animating. We would ruin the smooth 120fps experience we have fought so hard for.

We discarded Memento quickly. We needed something much more surgical and efficient.
The answer, as is often the case in complex transactional systems, was in the classic *Design Patterns* book by the Gang of Four: The **Command Pattern**.

### Treating Actions as Reified Objects

The fundamental idea that unlocked the entire implementation was a mindset shift: Stop thinking of user actions as "function calls" (`viewModel.setCellValue(5)`) and start thinking of them as **Reified Data Objects** (`val cmd = SetValueCommand(5)`).

"Reify" is a fancy word we engineers use to say "turn an abstract concept into a concrete thing". We turn the verb "set value" into the noun "Set Value Command".
This object is a first-class citizen in our code. You can store it in a variable, serialize it to disk, inspect it, and queue it.

We defined our sacred contract in Kotlin:

```kotlin
// domain/command/GameCommand.kt
interface GameCommand<T> {
    /**
     * Executes the action logic and returns the new resulting state.
     * This function must be pure and deterministic whenever possible.
     */
    fun execute(currentState: T): T

    /**
     * The magic: Contains the exact inverse logic.
     * Knows how to restore the universe to the moment just before execution.
     */
    fun undo(currentState: T): T

    /**
     * A human-readable description of what this command did.
     * Useful for debug logs and future history UI.
     * Ex: "Placed a 5 in cell A3".
     */
    fun getDescription(): String
}
```

This change is profound.
Game history is no longer a heavy list of duplicate states (`List<GameState>`), but a very light list of *intentions* (`List<GameCommand>`).
Saving a `KakuroCellValueCommand(row=3, col=4, value=5, oldValue=0)` object takes up just a few bytes in memory. We could store thousands of these without Android's garbage collector barely blinking. It is an infinitely scalable solution.

### The Time Manager: GameHistoryManager

With commands defined, we needed a component to act as the "Orchestra Conductor" of time.
We implemented `GameHistoryManager`, a generic class that manages the two temporal stacks:
1.  **Undo Stack:** The past. Everything you have done so far.
2.  **Redo Stack:** The alternative future. Actions you undid but might want to recover.

Here is where academic software engineering theory crashes violently with the dirty reality of modern mobile development. We encountered two serious problems.

#### 1. Concurrency and the Silent Danger of Coroutines
PuzzleHub is an intensive multi-threaded application.
*   The User Interface (UI) runs on the `Main` thread.
*   The database (Room) saves games on the `IO` dispatcher.
*   Heavy validation calculations run on `Default`.

This creates the perfect scenario for a **Race Condition**.
Imagine the following fateful sequence of events:
1.  The user makes a quick move. A coroutine is launched on the Calculation thread to process it.
2.  Milliseconds later, they regret it and press "Undo". A coroutine is launched from the UI.
3.  Just at that instant, the periodic auto-save system decides it's time to persist state to disk on the IO thread.

If we aren't careful, we could have three threads trying to read and write to the `undoStack` list simultaneously. The result would be, at best, an application crash (`ConcurrentModificationException`). At worst, we would silently corrupt data, causing visual game state and internal logical state to diverge, creating impossible-to-reproduce bugs.

To fix this, we had to wrap the entire manager in a `Mutex` (coroutines version of the classic `Semaphore` or lock).

```kotlin
class GameHistoryManager<T> {
    private val mutex = Mutex()
    private val undoStack = ArrayDeque<GameCommand<T>>()

    suspend fun execute(command: GameCommand<T>, state: T): T {
        // The semaphore locks the door.
        // Any other coroutine trying to enter here will have to wait
        // patiently at the door until we finish.
        mutex.withLock {
            redoStack.clear() // When changing the past, we erase the alternative future

            // Limit history to 50 steps to not consume infinite memory
            // if the user plays for hours.
            if (undoStack.size >= MAX_HISTORY) {
                undoStack.removeFirst()
            }
            undoStack.addLast(command)

            return command.execute(state)
        }
    }
}
```

Thanks to this `mutex.withLock` block, we guarantee that operations on history are atomic. Time in PuzzleHub is now *thread-safe*.

#### 2. Polymorphic Persistence (The problem of saving interfaces)
A key requirement was that history survives the application lifecycle.
If you are on the subway playing, close the app to answer a message, and open it again, you expect to be able to undo your last move. Keeping history in volatile RAM is not enough.

The problem is that our `undoStack` list contains objects implementing the `GameCommand` interface. SQL databases (like Room) and JSON format don't understand interfaces or polymorphism by default. They need to know exactly what concrete class they are saving.
How do you save a mixed list of `KakuroCellValueCommand`, `HitoriToggleShadeCommand`, and `SlitherlinkEdgeCommand` in a single text field?

We had to implement a **Polymorphic Serialization** system using the `kotlinx.serialization` library.
It was tedious plumbing work. We had to register each command subclass in a serialization module, assigning them a "discriminator" (a unique string like `"kakuro_make_cell_black"`).
This way, when saving the JSON, the library writes: `{"type": "kakuro_make_cell_black", "row": 1, "col": 2...}`.
And when reading it, it knows to instantiate the correct class.
The result is magical: persistence is totally transparent. You can kill the app process, and when you return, your "Undo" stack is still there intact.

## UI Integration: The Civil War for Pixels

With the engine ready, it was time to design the interface. Where do we put the Undo and Redo buttons?
This unleashed an intense debate in the design team (which, being a small indie team, is basically me arguing with myself in front of a mirror).

*   **The FAB Faction (Floating Action Button):** Argued that buttons should be floating at the bottom of the screen, near the user's thumb, for quick access.
*   **The Minimalist Faction (Me):** Argued that the board area is sacred. In dense games like *Minesweeper* or *Nonogram* of 20x20 cells, every pixel counts. Covering a corner of the board with a floating button is the worst cardinal sin in puzzle design: you hide information and cause frustrating accidental clicks.

In the end, logic and minimalism won. We decided to integrate controls into the `GameTopBar`, the top bar.
It is the de facto standard in all productivity tools in the world (think Microsoft Word, Google Docs, or any image editor). Users already have that "mental model": if I want to go back, I look top right.

Also, we implemented real reactivity to improve UX:
*   If you can't undo (because you are at the start), the button **doesn't disable completely**. A gray inactive button sometimes looks broken. Instead, we simply lower its opacity (`alpha`) to 30%. It's still there, giving visual structure, but shouting less.
*   If the game is **Paused**, we explicitly block Undo. During testing we discovered a funny bug: you could pause the game (which hides the board with a curtain to prevent cheating) and keep pressing Undo "blindly", breaking your game without knowing. Now, the button knows if the game is visible or not.

## War Stories: When Theory Fails (The Kakuro Case)

Implementing the system in simple games like *Hitori* was a walk in the park.
In *Hitori*, a cell is white or black. Easy.
Command: `ToggleCell(old=White, new=Black)`. Undo: `Cell=White`. Done in 10 minutes.

But then we got to **Kakuro**. And Kakuro taught us a lesson in humility.
In Kakuro, cells have a large numeric value (the final answer). But they also have "Notes" or "Candidates": those small numbers you write in the corners to remind yourself *"a 1 or a 2 can go here"*.

We had a programmed UX rule: *"When the user writes a large number (makes a final decision), the game must automatically clear all small notes from that cell, to clean up the interface"*. Makes sense, right?
We implemented the set value command with that logic.
But then we tried Undo.

1.  User has notes "1, 2, 4" written in cell A1.
2.  User decides it's a "5" and writes it. The game, helpfully, clears the notes.
3.  User realizes 5 is a mistake and presses **Undo**.
4.  The number 5 disappears... **but notes "1, 2, 4" don't come back!**

The user was left staring at an empty cell feeling foolish. They had lost their train of thought. The Undo system had destroyed information.
This is unacceptable. An "Undo" must be a perfect time machine.

We had to refactor the `KakuroCellValueCommand` to be a complete forensic snapshot.
Now, the command doesn't just save `value=5`. It saves a much richer structure:
*   `oldValue = 0`
*   `newValue = 5`
*   `deletedNotes = [1, 2, 4]` (This was key!)
*   `addedNotes = []`

Now, when `undo()` executes, it doesn't just erase the 5. It reads the `deletedNotes` list and explicitly restores those little numbers in the corners.
Those small details of fidelity are the difference between a "functional" app and a "professional" application that truly respects the user's time and cognitive effort.

## Testing: How to sleep soundly at night

Touching the core of 10 games at once is scary. Very scary.
A bug in the `GameHistoryManager` class could break game saving functionality, corrupt user data, or cause unexpected crashes across the suite.
To not break the production environment, we decided that testing Undo/Redo with isolated unit tests wasn't enough. We had to ensure the application "as a whole" kept working.

We dedicated all of Thursday to writing a new suite of **E2E (End-to-End) Instrumented Tests** (`TASK-2026-028`).
We created a test "robot" that pretends to be a real user:
1.  Installs clean app on emulator.
2.  Plays welcome tutorial.
3.  Enters a Slitherlink game.
4.  Performs exactly 3 specific moves.
5.  Presses Undo button 2 times.
6.  Takes a screenshot and analyzes pixels to verify the board is exactly in the expected state.

This robot now runs automatically in our Continuous Integration pipeline (GitHub Actions) every time we push code. If anyone (probably me) breaks the Undo system in the future, alarms will sound in bright red before that version hits the Play Store.

## Conclusion

This week has been one of the most productive and intense in **PuzzleHub** history.
The Undo/Redo system is not just another "feature" on the list. It fundamentally changes player psychology.
We have observed in our own testing sessions that, with the Undo safety net, we play differently: faster, braver. We dare to test risky hypotheses in *Slitherlink* or *Hashi*, knowing that if we are wrong, the back button will catch us.

Next week we will take this to the limit. We will face the "Final Bosses": **complex topology** games like *Slitherlink* and *Dominosa*, where undoing a move isn't just changing a number, but involves recalculating entire connectivity graphs in real-time to verify if the puzzle is broken or solved.

Thanks for reading and happy coding!
