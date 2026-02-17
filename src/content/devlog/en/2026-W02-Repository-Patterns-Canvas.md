---
title: "2026 W02: Generics, Canvas, and the Quest for Absolute Efficiency"
description: "A chronicle of extremes: eliminating 400 lines of repeated code with generic architectures and redrawing every pixel by hand to save performance on mid-range devices."
pubDate: 2026-01-14
tags: ["devlog", "kotlin", "architecture", "performance", "canvas", "compose", "refactoring", "generics"]
heroImage: "/images/devlog-w02-canvas.svg"
---

There are weeks in software development that feel like building a cathedral: everything is structure, steel beams, blueprints, and lofty discussions about wind load or dependency injection. And there are other weeks that feel like being an obsessive Swiss watchmaker, with a loupe in your eye, filing a microscopic gear so the second hand doesn't lose a millisecond.

This week, the second of 2026, I had the strange fortune (or misfortune) of being both.

In the mornings, I put on my architect helmet to solve a technical debt that was consuming my soul: massive duplication in the data layer. In the afternoons, I went down to the *pixel-perfect* trenches because **Kakuro**'s performance on mid-range devices was being, to put it mildly, unacceptable.

It's a strange dichotomy in our trade. In the morning you are defining generic `<T>` interfaces that abstract reality into pure, Platonic concepts. In the afternoon you are calculating `(x, y)` coordinates and fighting with basic elementary school trigonometry to know if a finger touched a rectangle or a line. From total abstraction to absolute concretion.

Welcome to Week 02. Make yourself a long coffee, because we're going to talk about how deleting code is better than writing it, and how drawing rectangles by hand is sometimes the only way to survive in the brutal world of Android.

## Part 1: The Tyranny of Copy-Paste (and how to break its chains)

Let's start with a shameful confession. A public *mea culpa*. I have 10 games in **PuzzleSuite**.

When I started this project months ago, speed was the only metric that mattered. The pressure (self-imposed, of course) was to launch. "Ship me Sudoku", "Ship me Kakuro", "Ship me Hitori". And in that frenetic race, I committed the developer's cardinal sin: **Copy-Paste**.

I made the repository for *Kakuro*. It worked. It was beautiful. It was clean.
Then I copied `KakuroPuzzleRepository.kt`, pasted it, renamed it to `HitoriPuzzleRepository.kt`, did a `Find & Replace` from "Kakuro" to "Hitori", and went to sleep feeling productive. "I've implemented the data layer for a new game in 5 minutes!", I thought, naive me.

Repeat this 10 times.
Then repeat it for the `StatsRepository`.

The result was a codebase with **20 Repositories** that were 95% identical. A twenty-headed hydra where cutting one meant two more bugs grew back.

```kotlin
// KakuroRepository.kt
fun getPuzzle(id: String): Flow<KakuroPuzzle> {
    return dao.getPuzzle(id).map { it.toDomain() }
}

// HitoriRepository.kt
fun getPuzzle(id: String): Flow<HitoriPuzzle> {
    return dao.getPuzzle(id).map { it.toDomain() } // Sound familiar?
}
```

The problem with this approach isn't aesthetic. It's not that the code is "ugly" or "inelegant". It's that it's a death trap for maintenance. This week, I wanted to add a simple feature: an option in settings to clear stats for a specific game. Trivial, right? `DELETE FROM stats WHERE game_id = ?`.

I had to open 10 different files (`KakuroStatsRepository`, `HitoriStatsRepository`, etc).
I had to write the same `deleteStats()` function 10 times.
And, of course, because I am human and not a machine, I made a typo in 3 of them. And forgot to inject the DAO in 2.
The result: 5 potential crashes in production and a whole morning lost fixing what should have been a 5-minute change.

I looked in the mirror, with the dark circles of someone who has been fighting with Dagger Hilt imports all morning, and said: "Enough. I am not a code-writing robot. I am an engineer. Let's fix this".

### The Holy Grail: `BasePuzzleRepository<T>`

The theoretical solution is simple: Inheritance and Polymorphism. Freshman concepts. But in practice, with Kotlin and Coroutines, things get interesting.

The goal was to create a base class that handled all the common CRUD (Create, Read, Update, Delete), but keeping strong typing. I didn't want a `BaseRepository` that returned `Any` or a generic `Puzzle` that I had to cast later in every ViewModel. If I ask the Kakuro repository for a puzzle, I want the compiler to know, without a doubt, that it is a `KakuroPuzzle`.

Here is where Kotlin **Generics** come in.

```kotlin
// The mother interface definition
interface BasePuzzleRepository<T : Puzzle> {
    fun getPuzzleById(id: String): Flow<T?>
    suspend fun savePuzzle(puzzle: T)
    suspend fun deletePuzzle(id: String)
    fun getInProgressPuzzles(): Flow<List<T>>
    fun getCompletedPuzzles(): Flow<List<T>>
}
```

Look at that `<T : Puzzle>`. That little "T" is what makes the magic happen. It tells the compiler: "This repository is going to work with a specific type of Puzzle, and I don't want you to lose that information". It's a contract.

Implementing this base was cathartic. Seeing how I deleted entire functions from child repositories to leave empty lines or simple calls to `super` was one of the best feelings of the week. It's like spring cleaning in your digital house. Every deleted line is a line that won't have bugs in the future.

### The Curious Case of Minesweeper (and the exception to the rule)

But total abstraction is a myth. Always, always there is an exception. In my case, the rebellious child was **Minesweeper**.

Turns out Minesweeper doesn't behave like the others. When you save a Minesweeper puzzle, the game needs to know immediately the ID generated in the database to be able to start a specific timer associated with that ID. The other games don't need that; they save "fire-and-forget" and let the UI update itself reacting to the database Flow. Minesweeper, by its tense and timed nature, needed immediate confirmation.

The signature in the base was:
```kotlin
suspend fun savePuzzle(puzzle: T) // Returns Unit
```

But Minesweeper desperately needed:
```kotlin
suspend fun savePuzzle(puzzle: MinesweeperPuzzle): String // Returns the ID
```

Kotlin is strict. And rightly so. You cannot change the return type in an override (`override`). If the interface says you return `Unit`, you return `Unit`. Period.

Here I faced a philosophical dilemma that defines a developer's maturity:
1.  **Option A (The Purist)**: Change the base interface so `savePuzzle` *always* returns a `String` (the ID), even if the other 9 games don't use it at all. I dirty the definition of 9 to accommodate 1.
2.  **Option B (The Pragmatic)**: Leave `savePuzzle` as is in the base, and add a specific method in the Minesweeper repository.

I chose Option B. Purity is fine for textbooks, but dirtying the API of 9 clients because of 1 is bad architecture.

```kotlin
class MinesweeperPuzzleRepositoryImpl(...) : BasePuzzleRepository<MinesweeperPuzzle>(...) {
    // Implementation of the base method (mandatory, even if redundant here)
    override suspend fun savePuzzle(puzzle: MinesweeperPuzzle) {
        dao.insert(puzzle.toEntity())
    }

    // Specific method for Minesweeper use case
    suspend fun savePuzzleAndGetId(puzzle: MinesweeperPuzzle): String {
        val id = dao.insertReturningId(puzzle.toEntity())
        return id
    }
}
```

It's a compromise. But real software is made of compromises. There is no perfect architecture, only the architecture that best adapts to your current constraints.

### The Script of Shame

To close the refactoring chapter, I have to admit something ironic that would probably cost me my "Clean Coder" card.

Part of the refactoring involved adding the `deleteStats()` method to all DAOs (Data Access Objects). DAOs are Room interfaces, and Room interfaces cannot inherit implementation in the same easy way (or at least, not without getting into complicated interface hierarchies that Room sometimes rejects). So I *had* to add the line `@Query("DELETE FROM table_stats")` in 10 files manually.

Did I do it by hand? No.
Did I do it with smart IDE refactoring (IntelliJ Structural Search)? It didn't work well with SQL annotations inside interfaces.

I did the unthinkable. I wrote a **PowerShell** script (yes, PowerShell) that iterated through the files, looked for the line of the last bracket `}` and injected the SQL code before it.

```powershell
# Crime snippet
$files = Get-ChildItem ".*Dao.kt" -Recurse
foreach ($file in $files) {
    $content = Get-Content $file.FullName
    # Dirty code injection here
    Set-Content $file.FullName $newContent
}
```

Yes. I used a dirty script to automate writing repetitive code for a refactoring destined to eliminate repetitive code. The irony is not lost on me. But it worked. And in 2 seconds, 10 files were updated. Sometimes, the dumbest tool is the most effective. Don't tell Bob Martin.

At the end of the day, `git diff` marked **-400 lines**. Four hundred lines of potential bugs, future maintenance, and cognitive noise, eliminated forever. The codebase breathes better. I breathe better.

## Part 2: The Frame War (The Descent into Canvas)

While my mind floated in the clouds of Generics and clean architecture, reality hit me in the face with a brick. Or rather, with a **lag spike**.

I was testing the new version of **Kakuro** on a Pixel 4a (my "reality" device, because on the PC emulator with an i9 everything flies at 120fps). I opened a large puzzle, 15x15.
Scrolling was jerky.
Touching a cell had a perceptible delay of about 100-200ms before it was selected.
Logcat spat warnings of *"Skipped frames! The application may be doing too much work on its main thread."*

For a static puzzle game, this is unacceptable. We aren't rendering *Cyberpunk 2077*. We are rendering numbers on a grid. What was happening? If there aren't even complex animations, why was my phone heating up?

### The Culprit: `LazyVerticalGrid` and Composition Overhead

The standard tool for grids in Jetpack Compose is `LazyVerticalGrid`. It's wonderful. It's flexible. It's easy to use.
But it has a hidden cost that no one tells you in "Hello World" tutorials.

Each cell in my Kakuro grid wasn't a simple rectangle. It was a complex composition tree:
1.  A `Box` (for layout and borders).
2.  A `Surface` (for elevation and background color).
3.  A `Column` (because clue cells have two split numbers).
4.  Two `Text` composables (for numeric values).
5.  A small `Canvas` or `Line` (the diagonal separator).
6.  A `.clickable` modifier with its own interaction state (Ripple effect).

Multiply that by 225 cells (15x15). We are talking about **more than 1300 nodes** that Compose has to manage, measure (`measure`), position (`layout`), and draw (`draw`) in every frame.

And the worst part: **Kakuro is not "lazy"**. When you play, you need to see the whole board (or the vast majority) to solve the puzzle. `LazyVerticalGrid` is optimized for infinite Instagram lists where you recycle views as you scroll. Here we weren't recycling anything, just paying the cost of the recycling infrastructure without getting its benefits.

The Android Studio Profiler showed me the naked truth: upon starting the board, **105 recompositions** occurred. The system was recalculating the entire UI tree over and over because a state changed on startup. The phone was spending more CPU calculating where to put boxes than on game logic.

### The Nuclear Solution: Pure `Canvas`

I decided I couldn't optimize existing code. I could remove shadows, simplify layouts, use `key {}`, but the base problem persisted: too many nodes.

I had to change the paradigm. I had to stop "composing" components and start "drawing" pixels.

In Android (and in almost any graphics system), drawing directly on a **Canvas** is orders of magnitude faster than managing view hierarchies. In a Canvas, there are no "Children". There is no recursive "Layout Pass".

You tell the GPU: "Draw a blue rectangle at (0,0) of 100x100". And the GPU says: "Done". End.
It's old-school graphics programming. Immediate. Brutal.

But with great power comes great responsibility (and a great mathematical headache).

When switching to Canvas, you lose everything Compose gives you for free:
- You no longer have `clickable`. You have to detect raw `(x, y)` touches and calculate which cell it is.
- You no longer have auto-adjusting `Text`. You have to measure text width and height manually.
- You no longer have automatic accessibility (TalkBack). You have to implement it yourself with `Modifier.semantics`.
- You no longer have automatic themes. You have to pass colors manually.

I decided to start with **Hitori** as a pilot (TASK-2026-011), and then, if I survived, scale to Kakuro.

### Drawing Math: The Code

The `HitoriGrid` code went from being a pretty declarative DSL to an imperative rendering loop. It's less readable for a junior, but it's poetry for the CPU.

```kotlin
Canvas(modifier = Modifier.fillMaxSize().pointerInput(Unit) {
    detectTapGestures { offset ->
        // Math magic to know what you touched
        // "If I touched at X=350 and each cell measures 50, I am in column 7"
        val col = (offset.x / cellSize).toInt()
        val row = (offset.y / cellSize).toInt()

        if (col in 0 until cols && row in 0 until rows) {
            onCellClick(row, col)
        }
    }
}) {
    // Drawing Phase: A simple for loop
    puzzle.cells.forEach { cell ->
        val x = cell.col * cellSize
        val y = cell.row * cellSize

        // 1. We draw the background
        drawRect(color = cell.color, topLeft = Offset(x, y), size = Size(cellSize, cellSize))

        // 2. If it is a complex cell (Kakuro), we draw the diagonal
        if (cell.type == CLUE) {
             drawLine(
                 start = Offset(x, y),
                 end = Offset(x + cellSize, y + cellSize),
                 strokeWidth = 2f
             )
        }
    }
}
```

The hardest part was undoubtedly text. In standard Compose, you put `Text("5")` and forget about it. It knows how to center itself. In Canvas, you have to use `TextMeasurer`.

You have to ask the system: *"Excuse me, system, exactly how many pixels does the glyph for number '5' measure when rendered in Roboto Bold font size 24sp?"*.
The system returns dimensions (ex. 12x18 pixels).
Then you have to calculate the exact offset to center those 12x18 pixels inside your 60x60 cell.

Elementary school math, yes, but get it wrong by one pixel and your whole design looks *off*.

`val textResult = textMeasurer.measure("5")`
`val textX = cellX + (cellWidth - textResult.size.width) / 2`
`val textY = cellY + (cellHeight - textResult.size.height) / 2`

It seems tedious, and it is. It's painful. But when you compile and run it...

### Pure Butter: The Results

The result was, without exaggeration, **pure butter**. An epiphany.

We did comparative measurements (documented in TASK-2026-023 and TASK-2026-019) and the numbers don't lie:

- **Load Recompositions**: Dropped from ~105 to **~5**. The system only draws once and that's it. There is no tree to recalculate.
- **Initial Render Time**: Reduced by **50%** (from 130ms to 66ms).
- **Memory**: RAM consumption dropped 14% by not having thousands of `Node` objects in memory.
- **Feeling**: From "stutters" and lag, to locked 60 FPS.

But most important is the intangible. The feeling. Dragging your finger across the board, the response is instantaneous. There isn't even a microsecond of doubt. The game feels *solid*, professional. It feels truly native.

### Future Challenges: The Fear of Emojis

This was just the beginning. Now I have the plan (TASK-2026-022) to migrate **Minesweeper**. And there, I am scared.
Minesweeper uses emojis (💣, 🚩, 💥).
Drawing emojis on a Canvas is not as trivial as drawing text. Emojis are complex bitmaps, not simple vectors. Will they pixelate when scaling? Will `TextMeasurer` correctly measure the width of a red flag vs a black one? Will Android render the color emoji or the monochrome version of the system font?

And then there is **Dominosa** (TASK-2026-021). Dominosa requires a drag gesture (drag-and-drop) to connect two numbers. In the previous version, each cell listened to its own drag. It was easy.
Now, the global Canvas has to listen to the drag, calculate which cells the finger passes over in real-time (while the user moves their finger at 100km/h), draw a visual feedback line *while* the movement occurs, and update the state only upon release.

It's a lot of math. It's a lot of manual state management. It's reinventing the UI event wheel.
But after seeing the fluidity of Hitori on Canvas, there is no going back. Once you taste stable 60 FPS on a mid-range device, `LazyVerticalGrid` looks like a prototyping toy.

## Conclusion: The Yin and Yang of Development

This week has been a brutal reminder of the duality of our profession.

Sometimes, the right answer is **abstraction**. Going up the mountain. Creating generic, clean, reusable systems like my new Repositories. Investing time to save future time. Thinking in years. It is the beauty of structure.

Other times, the right answer is **concretion**. Going down to the mud. Breaking abstraction, getting your hands dirty with pixel coordinates, `forEach` loops, and font measurements. Investing time to save present milliseconds. Thinking in frames. It is the beauty of the machine.

A good engineer is not the one who always abstracts, nor the one who always optimizes. It is the one who knows **when** to do each thing. It is the one who knows when to use a scalpel and when to use a hammer.

This week, I deleted 400 lines of duplicate code to make my future "self" happy. And I wrote 500 lines of manual drawing code to make my present user happy.

I think it's a good karmic balance.

Now, if you'll excuse me, I have to go to stackoverflow to investigate how on earth you draw a bomb emoji on an Android Canvas without it looking like a black ink blot. Suggestions and prayers accepted.

See you in W03. Rumors say we are going to try to implement a universal **Undo/Redo** system for all 10 games. And considering I just changed how they render and how they save... it will surely be *fun*. Or tragic. Probably both.

---
*Written listening to the Tron: Legacy soundtrack and dreaming of perfect Cartesian coordinate systems.*
