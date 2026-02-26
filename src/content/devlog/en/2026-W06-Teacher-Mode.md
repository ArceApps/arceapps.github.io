---
title: "2026 W06: Teacher Mode (Or how we taught users to think like the machine)"
description: "We redesigned the onboarding system. No more static texts. We implemented an interactive 'Teacher Mode' that guides you step by step, detects your confusion, and celebrates your small victories."
pubDate: 2026-02-08
tags: ["devlog", "ux", "onboarding", "tutorial", "education", "design"]
heroImage: "/images/devlog-default.svg"
---

This week, **PuzzleHub** has graduated.
And I don't mean we've left beta, or that we reached a thousand downloads.
I mean that, finally, we have taught our application to **teach**.

We have 12 fantastic logic games. Some, like *Minesweeper* or *Sudoku*, are heritage of humanity (thanks, Windows 95 and Sunday papers). Everyone knows how to play them.
But how many people really know how to play *Hashi* (Bridges)? Or *Dominosa*? Or *Slitherlink*?
They are wonderful games, but they have a brutal barrier to entry.

Until now, our "Onboarding" strategy was... optimistic, if not naive.
We had an "Info" screen accessible from the menu. A wall of static text with passive diagrams.
*"Bridges connect islands with the indicated number. Bridges can be double..."*.
The result was predictable and bleak.
The **First Law of Mobile UX** says: **"Nobody reads manuals"**.
Our retention metrics in "niche" games were abysmal. People opened *Hashi*, saw a bunch of circles with numbers, tapped the screen randomly for 20 seconds, nothing interesting happened, got frustrated, and closed the app forever.

We knew we had to fix it. We needed an **Interactive Tutorial**. A "Teacher Mode" that took you by the hand and said: *"Touch here. See that? That's a bridge. Very good"*.
What started as a simple script to guide the user became a software architecture odyssey and one of the most aggressive refactorings we've done in months.

## The Original Sin: The Hashi Monolith

We chose *Hashi* as our guinea pig. It's a perfect game for this: very visual rules, strict logic, but anti-intuitive for the novice.

On Monday we started writing code with the zeal of a convert (`TASK-2026-097`).
We wrote a file called `HashiInteractiveTutorial.kt`.
By Tuesday afternoon, it worked wonderfully. It had an animated hand pointing where to tap. It had dialogs reacting to your mistakes. It had confetti.
We felt like geniuses.

Then we looked at the file size.
**2,099 lines of code.**

Our hearts sank.
We had made the beginner's mistake (or the rush mistake, which is the same). We had created a **Monolith**. Tight coupling everywhere.
In that single gigantic file coexisted, in an orgy of messy code:
1.  The tutorial state machine logic (`var currentStep = 3`).
2.  The visual UI definition (`Box`, `Column`, `Text`...).
3.  Complex Lottie animations.
4.  Specific Hashi game logic (validating if a bridge is legal).
5.  Styles, colors, borders, and paddings.

We did a quick multiplication and panic took over.
We have 12 games.
If we copied and pasted this pattern for the other 11...
2,100 lines x 12 games = **25,200 lines of boilerplate code**.

Maintaining that would be suicide.
Imagine in a month we decide to change the "Next" button color from blue to green, or decide texts should be slightly larger. We would have to manually edit 12 files of 2,000 lines each. Technical debt would eat us alive before launching version 2.0.

## The Great Extraction: "Education Engine" is Born

Wednesday morning, at the Daily, we made the hard decision: **Stop production**.
"We can't go on like this. We have to refactor before creating a single tutorial more".
We took out the digital scalpel and started dissecting the Hashi monster.
Our goal: Extract everything NOT specific to *Hashi* and move it to a shared library. We wanted to create an "Education Engine".

We created a new package structure in `presentation/component/tutorial/` and started moving pieces:

### 1. The Shell (The Stage)
First, we extracted the infrastructure. `TutorialHeader` and `TutorialFooter`.
It seems trivial, but standardizing navigation (top progress bar, cancel button, "3/5" step counter) guarantees that *Sudoku* and *Minesweeper* feel part of the same coherent application. You don't want each game to have a different tutorial interface.

### 2. Content "Cards" (The Bricks)
Here's where things got interesting. Analyzing the Hashi script, we realized all logic game tutorials follow identical narrative patterns. You are always doing one of these four things:
*   Explain a Rule -> We created `RuleItem` (Icon + Bold Text).
*   Give a strategic tip -> We created `StrategyTip` (Soft gradient background + Bulb Icon).
*   Show Valid vs Invalid example -> We created `RestrictionCard` (Green and red boxes).
*   Sell mental benefits of the game -> We created `BenefitCard` (Animation + "Improves spatial memory").

By creating these generic Composable Components, the Hashi tutorial code went from being an unreadable spaghetti of `Box`, `Column`, `Row`, `Text`, `Spacer`... to being a beautiful semantic script:

```kotlin
// Before (The Horror)
Column {
    Text("Rule 1: Bridges are straight", fontSize = 20.sp, fontWeight = Bold)
    Spacer(modifier = Modifier.height(8.dp))
    Row {
        Icon(Icons.Default.Close, tint = Color.Red)
        Text("They cannot cross or go diagonally")
    }
    // ... 50 more lines of style ...
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

It's like reading a book. The code describes the *intent*, not the implementation.

### 3. The Numerical Result

After the final refactor on Thursday, the specific `HashiInteractiveTutorial.kt` file dropped from **2,099 lines to 1,280 lines**.
A **40%** reduction.
But most important isn't what we deleted, but what we gained. Those 1,000 lines of UI logic now live in a shared, tested, and polished library.
Next week, when we implement the *Akari* tutorial, those 1,000 lines come "free".
We estimate we can produce new tutorials at a rate of **one every two days** instead of one per week. It is the difference between slow craftsmanship and industrial production.

## UX Psychology: The Graduation Ceremony

Reducing lines of code is very satisfying for the engineer (we love deleting code), but the end user doesn't care about our architecture.
The user wants to feel good. Wants to feel ready.

During user tests on Thursday (`TASK-2026-092`), we detected an emotional problem we called "The Anti-climax".
User completed the tutorial, sweated bullets to solve the interactive practice exercises... and when finished, the app simply closed the tutorial and sent them to the main menu.
Tester reaction was unanimous: *"That's it? Okay. I guess I'll play."*
The dopamine closure was missing. Recognition of effort was missing. They had learned a new skill, and no one had patted them on the back.

We introduced the concept of **Graduation Ceremony**.
It's a special screen at the end of the tutorial. It has no new content. Its only function is to celebrate user success and validate their competence.

### Engineering Celebration
We didn't want a simple "Well done!" text. We wanted it to feel physical. Tangible.
We designed three key elements:

**1. The Physical Badge**
We created a 120dp diploma/medal vector. But we didn't show it statically.
We used Compose's `Animatable` API with spring physics (`Spring.DampingRatioHighBouncy`).
The badge doesn't "appear". The badge *falls* from the top of the screen, crashes into the center, bounces elastically, and settles. It has weight. It has inertia. It feels like someone hung a real medal on you.

**2. Competence Summary**
Below the badge, we list what the user has learned, with sequentially animated checks:
*   ✅ Connect Islands
*   ✅ Avoid Crossings
*   ✅ Corner Strategy

This reinforces the feeling of competence (Self-Efficacy). The subconscious message is: *"You haven't just played. You have acquired tools. You are ready to win"*.

**3. Confetti (Particle System)**
Yes, it's a cliché. But it works. We launched a simple particle system over the badge.

The result in A/B tests was dramatic. Users who saw "Graduation" were **30% more likely** to play a full game immediately after the tutorial. They felt empowered.

## The "Ghost Teacher" Architecture

Finally, I want to briefly touch on the most technically complex part, which we call the "Ghost in the Machine": The **Interactive Overlay**.

The challenge was: How do you get a tutorial to guide the user *inside* the real game, without having to rewrite the game for the tutorial?
If we had created a "Fake Hashi" screen just for the tutorial, we would have to maintain two parallel game engines. A hell of duplicate bugs.

The solution was to use the real Hashi engine (`HashiGameScreen`), but "hijack" user inputs from above.
We created an `InteractiveTutorialOverlay` placed on the Z-axis above the game board, like an invisible glass.

We implemented an **Event Interceptor** pattern:
The Overlay has a transparent mask capturing ALL touches on screen.
Before the click reaches the game, the Overlay consults the tutorial logic:
*"User tapped at coordinate (3, 4). We are at Step 2 of tutorial. Is this what we expected?"*

*   **YES (Hit)**: Overlay steps aside. Passes event (Pass-through) to underlying game board. Real game processes click, draws bridge, plays "clack" sound, and updates state. Tutorial celebrates ("Good!") and advances to Step 3.
*   **NO (Miss)**: Overlay **consumes** event. Game board doesn't even know there was a touch. Overlay shows error message ("No! You have to touch the flashing island") and waves indicator hand.

This separation of powers (Game plays, Tutorial supervises) is what allows us to scale. We can put this Overlay on top of *Sudoku*, *Minesweeper*, or *Kakuro* with minimal changes, because the tutorial doesn't need to know how the game works inside, only needs to know which cells are valid targets.

## Philosophy: Suggestion vs Prison

One last note on UX/Philosophy. We had an intense debate in the team about whether we should **force** the user to finish practice.
*"If we let them skip it, they won't learn. They'll get frustrated later and uninstall"*, argued one part of my brain.
We implemented a hard block. "Back" button was disabled until you finished.

It was a mistake.
Advanced users (who already knew the game and just wanted to see UI) felt trapped. "I know how to play Hashi, leave me alone".
We switched to a **Strong Suggestion** model.
Now, you can try to exit at any time.
But if you do before graduating, we show a Dialog (Modal) with very thoughtful copy:
*"Are you sure you want to leave? Skipping practice usually ends in tears and sad Game Overs on Hard levels. Your call."*

"Exit anyway" button is there. Enabled.
We respect adult autonomy, but clearly inform of risk. We treat user as intelligent partner, not child.

## Conclusion

Week 06 hasn't been about adding games. It's been about adding **players**.
Because a game without players who understand the rules isn't a game, it's a confusing and hostile interactive screensaver.
With new Modular Tutorial Engine and Graduation Ceremony, we are ready to open doors of our most complex games (*Akari*, *Fillomino*) to general public.

Next week: Massive scaling. Factory ready, time to produce. 11 tutorials in 7 days. Wish us luck (and lots of coffee).

---
*End of weekly report.*
