---
title: "2025 W42: Forbidden Geometry"
description: "Slitherlink and Galaxies break our grid. Introducing vector math, fuzzy hit zones, and background thread generation."
pubDate: 2025-10-19
tags: ["devlog", "canvas", "math", "algorithms", "performance"]
heroImage: "/images/devlog/2025-w42-cover.png"
---

Until now, our games (Hitori, Shikaku, Fillomino) lived happily inside perfect square cells.
Click on cell (2,3) -> Paint cell (2,3). Life was simple.

But Week 42 (October 13th to 19th) brought the rebels of the group: **Slitherlink** and **Galaxies**.

These games aren't about the cells. They're about what's *between* them.
In *Slitherlink*, you interact with the **edges** (the borders between points). Your goal is to draw a loop.
In *Galaxies*, you interact with arbitrary **walls** that cut space according to symmetry.

Our simple touch detection system `(coordinate / cell_size)` broke immediately.

## The Ghost Touch Problem

Imagine trying to touch a 1-pixel thick line with a finger that covers almost a square centimeter of screen space. It's impossible to hit accurately.
If we ask the user for surgical precision, they'll throw the phone out the window.

For Slitherlink, we had to trash our simple click detection and implement a **"Hit Testing" system with zones of influence**.
We no longer check if "you touched the line". We check "which line is the center of your pressure closest to?".

```kotlin
fun getNearestEdge(touchX: Float, touchY: Float): Edge? {
    // We calculate the distance to the 4 nearest edges
    val distTop = abs(touchY - cellTop)
    val distLeft = abs(touchX - cellLeft)
    // ...

    // If the distance is less than a threshold (ex: 24dp), we accept the touch.
    if (minDist < TOUCH_THRESHOLD) return closestEdge
    return null
}
```

We spent two whole days tuning this `TOUCH_THRESHOLD` constant.
*   If the zone is too small, you miss the touch and get frustrated.
*   If it's too large, you try to touch a vertical line and trigger the neighboring horizontal one by mistake.

It's invisible UX: if you do it right, no one notices. The game simply "feels good". If you do it wrong, the game feels "broken" or "clunky".

## Galaxies and Rotational Symmetry

**Galaxies** was the final boss of the week. Possibly the hardest game to program in the entire catalog.
In this game, you must divide the board into regions that are **rotationally symmetric (180 degrees)** around various given centers.

This requires vector math I hadn't used since college.
To validate if a region is correct, counting cells isn't enough. You have to verify geometrically:
1.  For each cell `C` in the region...
2.  Calculate its "mirror" position `C'` with respect to the galaxy center.
3.  Verify that `C'` also belongs to the region.
4.  And the hardest part: Verify that the path from `C` to `C'` inside the region is continuous and doesn't cross walls.

We implemented an algorithm that casts "virtual rays" to check connectivity.
It was the first moment in the project where we felt performance could suffer. Validating the symmetry of 100 cells in every frame (60 times per second) is expensive for the CPU.

We introduced our first serious optimization: **Validation Cache**.
We only re-calculate the validity of a region when the user modifies a wall. If you're just moving the cursor or scrolling, we reuse the previous result (green or red). From 16ms per frame, we dropped to 0.5ms.

## The Puzzle Generator: The New Bottleneck

With the visualization logic solved, we hit another wall: **Generating these puzzles is slow**.
Generating a Hitori is fast (delete numbers at random until it works).
But generating a valid Slitherlink (a single closed loop that mathematically satisfies all numbers) is an extremely complex problem (NP-complete in certain variants).

Our initial generator took 15 seconds to create a 10x10 puzzle.
A mobile user doesn't wait 15 seconds. They close the app and open Instagram.

We couldn't make the algorithm faster (math is math), so we pulled an illusionist trick: **Pre-generation**.
When you install the app, it comes with 10 pre-calculated puzzles of each type in a JSON file.
While you play the first one, the app wakes up a background thread (`Worker`) that silently starts generating puzzle #11, #12...
They are stored in a local "Buffer" database.

For the user, loading is instant. There is always a puzzle ready waiting for them.
It's like fast-food restaurants: the burger isn't cooked when you order it. It was cooked 5 minutes earlier and is waiting under a heat lamp. In our case, the lamp is SQLite.

## Conclusion

We have left the safety of the simple grid.
Now our engine supports arbitrary geometry, probabilistic fuzzy touches, and complex geometric validation.
The "Clean Code" architecture is still holding up, although the `GameView` files are getting dangerously large with so much vector drawing logic.

Maybe next week it will be time to split those giant files before they take on a life of their own. But for now, seeing the smooth curves of Slitherlink working on screen makes it all worthwhile.
