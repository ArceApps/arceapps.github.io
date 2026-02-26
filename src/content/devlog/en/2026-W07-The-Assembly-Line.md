---
title: "2026 W07: The Assembly Line (and the pleasure of deleting legacy code)"
description: "How we went from craftsmanship to industrial production: 11 interactive tutorials in 7 days. A technical chronicle on scaling, technical debt, and the art of teaching geometry without using words."
pubDate: 2026-02-15
tags: ["devlog", "scaling", "refactoring", "ux-design", "education", "legacy-code", "kotlin", "jetpack-compose"]
heroImage: "/images/devlog-default.svg"
---

On Monday, February 9th, I woke up with a strange feeling in my stomach. A mix of excitement and existential panic.
The previous week (W06) had been a resounding success: we refactored the tutorial engine and created a wonderful educational experience for *Hashi*.
But *Hashi* is only one of our twelve "children".
Eleven orphaned games remained. Eleven complex games, abstract and difficult for the novice to understand, still relying on boring and useless static text screens.

The weekly goal was absurd, almost irresponsible: **Implement the remaining 11 tutorials before Sunday**.
In any other circumstance of my career, this would have been a "Death March". It would have meant sleepless nights, stale coffee, bugs from exhaustion, and garbage code copied and pasted desperately to meet the deadline.

But this time we had a secret weapon. We had the **Education Engine** we built with so much pain last week.
This week wasn't going to be about "programming" in the artisanal sense. It was going to be about **Industrializing**.
We were going to stop being artisans carving every pixel by hand to become Henry Ford.

## Monday and Tuesday: The Trial by Fire (Akari and the UX Crisis)

We started with *Akari* (Light Up).
On paper, it was the perfect candidate to test our new assembly line. Simple rules, visual board, boolean logic.
We started the factory.
Created `AkariInteractiveTutorial.kt`. Inherited from our base class. Defined steps.
In 4 hours we had a functional tutorial.
*"It works! We are invincible!"*, we shouted, high-fiving virtually. *"At this rate we finish Wednesday"*.

And then, we made the mistake (or the success) of testing it on a 10-inch Tablet.

The disaster was major (`TASK-2026-101`).
In our eagerness to reuse components, we assumed "one size fits all".
But *Akari* has different information density than *Hashi*.
Practical examples that looked beautiful and compact on phone rendered as grotesque monstrosities on tablet.
Light bulbs were size of melons (400dp height). Help texts floated lost in sea of negative space.
Interface screamed "Hastily Ported Software".

A humbling experience. Industrialization has risks: if mold has millimeter defect, manufacture thousand defective copies per minute.

We had to stop the assembly line (Stop the Line!) and recalibrate machinery.
Learned valuable lesson **Responsive Visual Hierarchy**. Cannot simply use `Modifier.fillMaxSize()`.
Had to introduce maximum size constraints (`widthIn`) avoid components "exploding" large screens.

```kotlin
// Fix saving Akari dignity on Tablets
Box(
    modifier = Modifier
        .fillMaxWidth()
        .wrapContentSize(Alignment.Center) // Center in parent
) {
    Box(
        modifier = Modifier
            .widthIn(max = 200.dp) // <--- KEY. Never grow more than this.
            .aspectRatio(1f)
            .clip(RoundedCornerShape(12.dp))
            .background(BoardColors.Background)
    ) {
        // ... Drawing Logic ...
    }
}
```

Simple `.widthIn(max = 200.dp)` marked difference amateur vs professional app.
Reduced effective component height **42%**.
Result interface felt native respectful tiny Pixel 4 and Galaxy Tab S9 Ultra.

## Wednesday: Silent Geometry Challenge (Galaxies)

Akari crisis solved, Wednesday faced pedagogy final boss: *Galaxies* (Tentai Show).

Explaining *Sudoku* easy. "Put numbers 1 to 9".
Explaining *Galaxies* linguistic nightmare.
Rules imply **180-degree Rotational Symmetry**.
Try explain grandmother without technical words. Worse, mobile screen no one reads two lines.
*"Must form region such that if rotated around center, coincides with self"*.
People read, brain explodes, uninstall app.

Decided text enemy.
If explain visual rule text paragraph, **UI failed**.
For *Galaxies* tutorial (`TASK-2026-106`), implemented visual demonstration without words.
Created custom animation `Canvas` Compose Animation APIs.

No video. Code.
Draw irregular shape ("L") center point.
Apply smooth matrix rotation, piece spins around point.

```kotlin
// Intuition Physics
val rotation = remember { Animatable(0f) }

LaunchedEffect(Unit) {
    // Infinite hypnotic teaching loop
    while(true) {
        rotation.animateTo(
            targetValue = 180f,
            animationSpec = tween(2000, easing = FastOutSlowInEasing)
        )
        delay(500)
        rotation.animateTo(
            targetValue = 360f, // Full turn
            animationSpec = tween(2000, easing = FastOutSlowInEasing) // Physical "Weight"
        )
    }
}

Canvas(...) {
    rotate(degrees = rotation.value, pivot = center) {
        drawPath(path = galaxyShape, color = GalaxyColor)
    }
}
```

Used `FastOutSlowIn` interpolation spin "weight". Inertia.
Seeing piece fit self 180 degrees produces instant mental *click* in user.
*"Ah! Like windmill. Not mirror, spin"*.

Didn't write single text line explaining degrees rotations.
Animation taught "visual osmosis". Absolute victory philosophy "Show, don't tell".

## Thursday and Friday: Cruising Speed

From Thursday, entered "The Zone" (Flow State).
Tablet problems solved animation tools ready, machinery perfectly oiled.
*   Thursday morning: *Fillomino* and *Slitherlink*. Ready before lunch.
*   Thursday afternoon: *Minesweeper* and *Dominosa*. Ready before dinner.
*   Friday: *Shikaku*, *Kakuro*, *Kenken*, and *Math Crossword*.

Almost hypnotic.
Copy structure. Define specific rules `TutorialStepContainer`. Adjust validators. Compile.
Month ago took two weeks churn out spaghetti code fix state bugs, now flowed like water.
Code clean, predictable, robust.
Each tutorial shared 90% DNA (navigation, styles, animations) varied 10% essential (game rules).

Empirical demonstration power **Infrastructure Investment** and **Composable Architecture**.
Lost whole last week (W06) building engine. Seemed not advancing. Wasting time "pretty code".
Investment allowed travel light speed this week.
Sometimes, go fast, stop sharpen the axe.

## Saturday: The Great Purge

Saturday morning, 12 tutorials implemented working production, sweetest moment week.
Task `TASK-2026-110`.
Description brief, almost poetic: **"Delete Old Onboarding System"**.

Opened `InteractiveTutorialOverlay.kt`.
Old ugly file, patched, nested `if-else`, `TODOs` six months ago.
Code written young naive (December).
Right click -> **Delete**.
Then `TutorialContent.kt`. **Delete**.
Searched references static PNG images used before. **Delete**.

Deleted almost 3,000 lines code morning.
Seeing project line counter drop vertically functionality quality app increased physical lightness sensation.
Like throwing away that box of old cables in the closet "just in case". Know don't need, scary throw.
Do it, house (codebase) breathes better. Less noise. Less cognitive load.

## Sunday: Reflection from the Peak

Finished week exhausted euphoric.
12 games equipped first-class interactive tutorials.
Each tutorial own "Graduation Ceremony".
Teaches complex rules visual tactile way, respecting user intelligence guiding firm hand.

Seven weeks ago, *PuzzleHub* heterogeneous loose puzzles collection.
Today, starts looking like **Coherent Educational Platform**.
User not just "plays". Learns. Improves. Understands hidden geometry things.

Next week (W08) last before Release Candidate.
Polish. Optimize performance (60fps not maintain self low-end). Check colorblind accessibility.
Hard core, experience heart, finished. Beats strong.

---
*End of weekly report.*
