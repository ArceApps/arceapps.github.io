---
title: "2026 W06: Teacher Mode (How to reduce 25,000 lines of code to 1,000 and teach how to play)"
description: "From a monolithic script of 2000 lines to a Modular Education Engine. A story about technical debt, interactive pedagogy, and why we decided to give virtual diplomas with spring physics."
pubDate: 2026-02-08
tags: ["devlog", "refactoring", "software-architecture", "ux-design", "jetpack-compose", "education"]
heroImage: "/images/devlog-default.svg"
---

This week, **PuzzleHub** has graduated.
And I don't mean we left beta, or got a thousand downloads.
I mean, finally, we taught our application to **teach**.

We have 12 fantastic logic games. Some, like *Minesweeper* or *Sudoku*, are heritage of humanity (thanks, Windows 95 and Sunday papers). Everyone knows how to play them.
But how many people really know how to play *Hashi* (Bridges)? Or *Dominosa*? Or *Slitherlink*?
They are wonderful games, but have a brutal entry barrier.

Until now, our "Onboarding" strategy was... optimistic, not to say naive.
We had an "Information" screen accessible from menu. Wall of static text with passive diagrams.
*"Bridges connect islands with indicated number. Bridges can be double..."*.
Result was predictable and bleak.
**First Law of Mobile UX** says: **"No one reads manuals"**.
Our retention metrics on "niche" games were abysmal. People opened *Hashi*, saw bunch of circles with numbers, tapped screen randomly for 20 seconds, nothing interesting happened, frustrated, closed app forever.

Knew we had to fix it. Needed **Interactive Tutorial**. "Teacher Mode" grabbing hand saying: *"Touch here. See that? That's a bridge. Very good"*.
What started as simple script to guide user became software architecture odyssey and one of most aggressive refactorings done in months.

## Original Sin: Hashi Monolith

Chose *Hashi* as guinea pig. Perfect game for this: visual rules, strict logic, but anti-intuitive for newbie.

Monday started coding with fury of convert (`TASK-2026-097`).
Wrote file called `HashiInteractiveTutorial.kt`.
By Tuesday afternoon, worked wonderfully. Had animated hand pointing where to press. Dialogs reacting to errors. Confetti.
Felt like geniuses.

Then looked at file size.
**2,099 lines of code.**

Heart sank.
Committed rookie error (or rushing, same thing). Created **Monolith**. Fierce coupling everywhere.
In single gigantic file lived, in orgy of messy code:
1.  Tutorial state machine logic (`var currentStep = 3`).
2.  Visual UI definition (`Box`, `Column`, `Text`...).
3.  Complex Lottie animations.
4.  Specific Hashi game logic (validate if bridge legal).
5.  Styles, colors, borders, paddings.

Did quick multiplication and panic took over.
Have 12 games.
If copy-pasted pattern for other 11...
2,100 lines x 12 games = **25,200 lines of boilerplate code**.

Maintaining that would be suicide.
Imagine in month decide to change "Next" button color blue to green, or texts bigger. Edit manually 12 files of 2,000 lines each. Technical debt eat us alive before launching version 2.0.

## Great Extraction: "Education Engine" Born

Wednesday morning, Daily, took difficult decision: **Stop production**.
"Can't go on like this. Must refactor before creating single new tutorial".
Took digital scalpel started dissecting Hashi monster.
Goal: Extract everything NOT specific to *Hashi* move to shared library. Wanted to create "Education Engine".

Created new package structure `presentation/component/tutorial/` started moving pieces:

### 1. The Stage
First, extracted infrastructure. `TutorialHeader` and `TutorialFooter`.
Seems trivial, but standardizing navigation (top progress bar, cancel button, step counter "3/5") guarantees *Sudoku* and *Minesweeper* feel part of same coherent app. Don't want every game distinct tutorial interface.

### 2. Content Cards (The Bricks)
Here interesting. Analyzing Hashi script, realized all logic game tutorials follow identical narrative patterns. Always doing one of four things:
*   Explain Rule -> Created `RuleItem` (Icon + Bold Text).
*   Give strategy tip -> Created `StrategyTip` (Soft gradient background + Bulb Icon).
*   Show Valid vs Invalid example -> Created `RestrictionCard` (Green/Red boxes).
*   Sell mental benefits -> Created `BenefitCard` (Animation + "Improves spatial memory").

Creating generic Composable Components, Hashi tutorial code went from unreadable spaghetti `Box`, `Column`, `Row`, `Text`, `Spacer`... to beautiful semantic script:

```kotlin
// Before (The Horror)
Column {
    Text("Rule 1: Bridges are straight", fontSize = 20.sp, fontWeight = Bold)
    Spacer(modifier = Modifier.height(8.dp))
    Row {
        Icon(Icons.Default.Close, tint = Color.Red)
        Text("Cannot cross or go diagonal")
    }
    // ... 50 more style lines ...
}

// Now (Semantic, Clean, Readable)
TutorialStepContainer(title = "Basic Rules") {
    RuleItem(text = stringResource(R.string.hashi_rule_1))
    RestrictionCard(
        isValid = false,
        text = stringResource(R.string.hashi_rule_cross)
    )
    StrategyTip(text = stringResource(R.string.hashi_tip_corners))
}
```

Like reading book. Code describes *intent*, not implementation.

### 3. Numeric Result

After Thursday final refactoring, specific `HashiInteractiveTutorial.kt` dropped **2,099 lines to 1,280 lines**.
**40%** reduction.
But most important not what deleted, what gained. 1,000 lines UI logic now live in shared library, tested polished.
Next week, implementing *Akari* tutorial, those 1,000 lines come "free".
Estimate producing new tutorials pace **one every two days** instead one per week. Difference between slow craft and industrial production.

## UX Psychology: Graduation Ceremony

Reducing code lines satisfying for engineer (love deleting code), but end user doesn't care architecture.
User wants to feel good. Ready.

During Thursday user tests (`TASK-2026-092`), detected emotional problem called "The Anti-climax".
User completed tutorial, sweated solving interactive exercises... finished, app simply closed tutorial sent to main menu.
Tester reaction unanimous: *"That's it? Okay. I'll play."*
Missing dopamine closure. Missing effort recognition. Learned new skill, no one patted back.

Introduced **Graduation Ceremony** concept.
Special screen end tutorial. No new content. Only function celebrate user success validate competence.

### Celebration Engineering
Didn't want simple text "Well done!". Wanted feel physical. Tangible.
Designed three key elements:

**1. Physical Badge**
Created vector diploma/medal 120dp. Not static.
Used Compose `Animatable` API spring physics (`Spring.DampingRatioHighBouncy`).
Badge doesn't "appear". Badge *falls* from top, hits center, bounces elastically settles. Has weight. Inertia. Feels like real medal hung.

**2. Competence Summary**
Below badge, listed what learned, sequentially animated checks:
*   ✅ Connect Islands
*   ✅ Avoid Crossings
*   ✅ Corner Strategy

Reinforces competence feeling (Self-Efficacy). Subconscious message: *"Not just played. Acquired tools. Ready to win"*.

**3. Confetti (Particle System)**
Yes, cliché. Works. Launched simple particle system over badge.

Result A/B tests dramatic. Users seeing "Graduation" **30% more likely** play full game immediately after. Felt empowered.

## "Ghost Teacher" Architecture

Finally, touch technically complex part, called "Ghost in Machine": **Interactive Overlay**.

Challenge: How tutorial guides user *inside* real game, without rewriting game for tutorial?
Created "Fake Hashi" screen only tutorial, maintain two parallel game engines. Bug hell.

Solution use real Hashi engine (`HashiGameScreen`), but "hijack" user inputs from above.
Created `InteractiveTutorialOverlay` sits Z-axis above game board, invisible glass.

Implemented **Event Interceptor** pattern:
Overlay transparent mask captures ALL screen touches.
Before click reaches game, Overlay asks tutorial logic:
*"User touched coordinate (3, 4). Step 2 tutorial. Is this expected?"*

*   **YES (Hit)**: Overlay steps aside. Pass-through event lower game board. Real game processes click, draws bridge, plays "clack" sound, updates state. Tutorial celebrates ("Good!") advances Step 3.
*   **NO (Error)**: Overlay **consumes** event. Game board doesn't know touch happened. Overlay shows error message ("No! Touch flashing island") shakes pointer hand.

Separation powers (Game plays, Tutorial supervises) allows scale. Put Overlay atop *Sudoku*, *Minesweeper*, *Kakuro* minimal changes, tutorial doesn't need know game internals, only valid target cells.

## Philosophy: Suggestion vs Prison

Last note UX/Philosophy. Intense debate team force user finish practice.
*"If let skip, won't learn. Frustrated later uninstall"*, argued brain part.
Implemented hard block. Back button disabled until finish.

Mistake.
Advanced users (knew game wanted see UI) trapped. "Know Hashi, leave alone".
Changed **Strong Suggestion** model.
Now, exit anytime.
But if before graduating, show Dialog (Modal) thoughtful copy:
*"Sure leave? Skipping practice usually ends tears Game Overs Hard levels. Up to you."*

"Leave anyway" button there. Enabled.
Respect adult autonomy, clearly inform risk. Treat user smart partner, not child.

## Conclusion

Week 06 not about adding games. Adding **players**.
Game without players understanding rules not game, confusing hostile screensaver.
New Modular Tutorial Engine Graduation Ceremony, ready open doors complex games (*Akari*, *Fillomino*) mass audience.

Next week: Massive scaling. Factory ready, produce. 11 tutorials 7 days. Wish luck (coffee).

---
*End of weekly report.*
