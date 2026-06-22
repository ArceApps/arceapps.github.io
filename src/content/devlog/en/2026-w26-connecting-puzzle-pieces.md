---
title: "2026 W26: Connecting the dots of the puzzle"
description: "A week where two seemingly small features ended up exposing the deep architecture of PuzzleSuite: clickable navigation from the profile and retroactive persistence of XP and scores across all twelve games."
pubDate: "2026-06-22"
lastmod: "2026-06-22"
keywords: ["puzzle suite", "android compose", "room database navigation"]
heroImage: "/images/devlog/devlog-w26-connecting.svg"
tags: ["devlog", "android", "kotlin", "compose", "room", "navigation"]
---

There are weeks where you sit down in front of your editor convinced that you're going to write three lines of code, grab a coffee, and head back to bed. This was not one of those weeks. This was the week where two "simple" Pull Requests — adding a click to a card and inserting two new columns into a database — dragged me into a reflection on the very nature of state in an Android application. But let's go in order, as always, because the story deserves to be told from the beginning.

## The hook: a card that did nothing

If you've been using PuzzleSuite for a while, you probably know the Profile tab. It's that screen where, in addition to your streak and your global stats, an elegant grid appears showing the progress of the twelve games in the suite: Akari, Dominosa, Fillomino, Galaxies, Hashi, Hitori, Kakuro, Kenken, MathCrossword, Minesweeper, Shikaku and Slitherlink. The grid has substance — it uses `SuiteProgressGrid`, a shared component that renders a `GameProgressCard` per game, with difficulty bars, completion counters and a percentage calculated on the fly.

The problem is that, until this week, those cards were pretty but inert. You could look at them, feel the pride of your hundred completed Akaris, and that was about it. The navigation to the corresponding game's achievements screen lived elsewhere: in the game's menu, two levels of depth further down. If you wanted to see Dominosa's achievements from the Profile, you had to go back to Home, open Dominosa's menu and then jump to its achievements. Three taps. An absurd amount of friction for one of the most natural interactions in the world: "hey, I saw my Dominosa progress from here, let me see the details without having to navigate as if I were solving a maze".

The first documented task, `20260618-profile-achievements-navigation`, was born exactly to fix this. The title sounds pompous for what ended up being a three-commit feature, but the devil was in the details. Or rather: the devil was in the signature of the composables.

## The knot: when Compose won't let you lie

`SuiteProgressGrid` already existed. `GameProgressCard` already existed. `ProfileScreen` already existed. What didn't exist was a clean way to tell the system "when someone touches this card, go to Dominosa's achievements screen" without coupling the grid to the global `NavController`. If you do that — pass the `NavController` as a parameter down to the innermost component — you turn every `Composable` into a mini-application with knowledge of the entire navigation hierarchy. And then any future refactor becomes a game of Jenga where nobody wants to move the middle piece.

The clean solution, which is the one we adopted, was to propagate a callback upward. In Compose, the "data down, events up" pattern is not a suggestion: it is a moral obligation. So the chain went like this:

`MainScreen` receives `onNavigateToGame: (String) -> Unit` from the global navigator. When it declares `ProfileScreen` in its internal `NavHost`, it passes `onNavigateToGameAchievements = onNavigateToGame`. `ProfileScreen` receives that callback, maps it by appending the `_achievements` suffix to the game ID, and hands it to `SuiteProgressGrid` as `onGameClick`. `SuiteProgressGrid` propagates it to each `GameProgressCard`. And `GameProgressCard`, finally, adds the `.clickable { onGameClick(progress.gameId) }` modifier to the main card.

It sounds like a tongue twister, and it is. But it works because each piece only knows its immediate parent. The grid doesn't know a global navigator exists; the profile doesn't know a `NavController` exists; the card only knows that when it's touched, it has to invoke a lambda. This is the magic — and sometimes the torture — of Compose: it forces you to be explicit about dependencies, which scales better but requires more typing.

The other interesting detail was the back stack handling. When you navigate from the Profile and then press "back" on the achievements screen, where should you return to? If you navigate from the Profile, the intuitive answer is "to the Profile". If you navigate from the Game Menu, the intuitive answer is "to the Game Menu". Compose Navigation resolves this on its own, without us having to intervene, because each `popBackStack()` stays on the previous screen of the stack. It's one of those moments where the tool gives you what you need if you stopped fighting it five minutes earlier.

## The unexpected climax: the historical data problem

Up to here, everything was clean architecture and callback propagation. But the second task, `20260621-game-stats-persistence`, had a trap hidden under an innocent surface.

The premise was simple: we want each completed puzzle to record its `score` and its `xp` in the database, so that the history can show "you earned +150 XP and 320 points on this Hashi" instead of just "completed in 4:32". So far so good. Two new columns in each of the twelve puzzle tables. Twelve Room migrations, one per game. Trivial.

But then someone — me, sitting with my third coffee of the morning — asked the obvious question: "And what happens to the puzzles that were already completed before this update?". And the answer was: nothing. They would sit in the database with `score = 0` and `xp = 0` forever, unless we run some retroactive logic.

If you have fifteen hundred completed puzzles in your local install — which is perfectly plausible if you've been playing PuzzleSuite for two years — that's fifteen hundred rows that need to be recalculated and updated. When? How? With which rules?

This is where the "nullable vs non-nullable" decision stops being a syntactic detail and becomes a philosophical question. If the columns are `Int?`, we can cleanly represent "this puzzle was completed before the scoring system existed, so its score is unknown". If they are `Int = 0`, we are lying: we are saying that those old puzzles have zero points, when in reality none were ever calculated for them. Option B — `Int = 0` with a `DEFAULT 0` in the migration — is what won, for consistency with the rest of the data model (timing fields already follow that pattern), but the decision required a whole entry in the design document explaining why we chose to lie elegantly instead of admitting our ignorance.

But the real climax was the **retroactive population**. Once we decided that the columns would start at zero, we needed to fill them. And here we had three paths:

1. **Pure SQL in the migration**: run `UPDATE akari_puzzles SET score = ...` inside the Room transaction. The advantage was speed and atomicity. The disadvantage was that replicating the logic of `GameScoreCalculator` — which takes into account speed thresholds per size and difficulty, dynamic bonuses, hints used, and different rules for each of the twelve games — in pure SQL was a maintenance nightmare.

2. **Kotlin logic at startup**: let the migrations add the empty columns, and then, on app startup, a component walks through the repositories, looks for puzzles with `score == 0`, and recalculates them using the existing scoring functions in Kotlin. That's what we did.

3. **Room callback**: execute the calculation inside `RoomDatabase.Callback.onOpen`. The advantage was automation. The disadvantage was blocking database initialization and creating circular dependencies with Hilt and `GlobalStatsRepository`.

Option two won for one very specific reason: it respects the golden rule of "single source of truth for business logic". If tomorrow I change the XP formula, I don't want to rewrite twelve different SQL queries. I want to change `XpCalculator.calculate()` and have the next app startup apply the new values. That is the promise of retroactive recalculation: not only does it fix the past, but it stays alive in the future.

## The denouement: twelve files, one architecture

What I liked most about how this week ended is that, although I touched twelve different databases, the pattern was exactly the same in all of them. For each game:

1. I modified the domain `data class` to add `score: Int = 0` and `xp: Int = 0`.
2. I modified the Room entity with the same fields, making sure the `toDomain()` and `toEntity()` mapping propagated them.
3. I added a version migration that increments the schema by one and runs two `ALTER TABLE … ADD COLUMN`.
4. I added the corresponding game to the `RetroactiveStatsPopulator` — a `@Singleton` with `@Inject` for the twelve repositories.

It is gratifying to see how a strict Clean architecture pays dividends when you have to apply the same change N times. When each layer is isolated, changes are predictable. When you couple layers, each repetition is an opportunity to introduce a subtle bug. I've lived long enough on this project to know that this predictability is worth its weight in coffee.

## Learnings and farewell

The two lessons I take from this week are technically modest but philosophically dense.

The first: **navigation in Compose is not an architectural luxury, it is a statement of principles**. When you decide to propagate callbacks instead of passing the `NavController` to everyone, you are saying "my UI is testable, my UI is refactorable, my UI is understandable". The immediate cost is more lines of code and more verbose signatures. The long-term benefit is that you will never have to rewrite half the app because you switched from `NavHost` to `Voyager`.

The second: **historical data is a window to the past, and windows can be updated**. The idea that a user with fifteen hundred completed puzzles could see them all with zero score was unacceptable. But more important than fixing the past was designing a system that can fix itself when the rules change. That is the true value of `RetroactiveStatsPopulator`: it is not a patch, it is a guarantee.

If you've read this far, I owe you a confession: this devlog was planned as a single article, but the raw material rebelled and ended up splitting in two. The second part, *"The Rebellion of the `Int?`"*, is a technical deep dive on everything that had to be decided to make the retroactive persistence system work. I'll see you there if you want to get down into the mud of SQL, the nullable trade-offs, and the `RetroactiveStatsPopulator` code. If you prefer to stay at the narrative surface, we'll see you in the next entry.

In the meantime, go to the Profile tab and tap a card. If all has gone well, you'll land on the game's achievements screen with an elegant ripple and the pride of a developer who finally dared to connect the dots.

## A note on the ripple, because nobody talks about the ripple

There is a detail that I love about Material Design 3 and is rarely discussed: the `.clickable` modifier not only adds the touch handler, but automatically applies the ripple animation you see when you press the card. That expanding wave, that circle that spreads from where you touched, is not free: it's implemented in `androidx.compose.foundation` as a configurable `Indication`, and by default uses `LocalIndication.current` which in Material Theme 3 is precisely `rememberRipple()`. Which means that adding `clickable { }` to a component and getting instant tactile feedback is an architectural decision that someone on the Compose team made years ago for you, and that you probably never appreciate enough.

In PuzzleSuite that ripple is the difference between a card that feels like a button and one that feels like a photo. When you navigate through the Profile grid, each tap returns a small visual confirmation that the app heard you. In a puzzle game, where the response to your actions is the center of the experience, that kind of micro-detail is what separates an app that "works" from an app that "feels good". It's not magic, it's Compose doing its job.

## Why being indie matters here

You work alone. There is no product manager to tell you "this is priority one". There is no QA team to tell you "hey, in this case the user taps twice because the ripple isn't visible". There is no designer handing you a detailed specification of every interaction. You have your head, your coffee, and the open issues on GitHub. And that loneliness, which sometimes weighs, other times liberates: because it lets you make decisions that in a medium-sized company would require three meetings, an act and an updated Jira.

When I decided that `Int = 0` was better than `Int?` for the score fields, I didn't have to write an RFC. When I decided to propagate callbacks instead of passing the `NavController`, I didn't have to convince a tech lead. When I decided that twelve identical migrations were better than a generic migration script, I didn't have to justify the trade-off to an architecture team. I just had to be sure, and that is a privilege you don't appreciate until you've worked on teams where every three-line change goes through four approvals.

But that privilege has its counterpart: the responsibility of being wrong well. If I got the nullable wrong, there's no code review to correct me. If the navigation loses the back stack in some edge case, there's no tester to report it before release. It's me, on my couch, watching how the issues pile up in the repository. And that, curiously, is also fine. Because every error I put in production is an error I will document, learn from, and not make next time.

## The closing that isn't a closing

This week I learned that sometimes small features are the most dangerous. Not because they are complex — on the contrary, they are deceptively simple — but because they tempt you to not pay them the architectural attention they deserve. The click on a card seems trivial. Two new columns in a table seem trivial. But both changes touch the exposed nerves of the application: how you navigate, how you persist, how you maintain consistency between the old and the new.

If you're building something similar, I'll leave you with three rules that have served me well this week:

1. **Every callback has an owner.** If you can't trace who invokes a lambda, refactor until you can.
2. **Every migration tells a story.** If you're going to alter a table, think about the rows that are already there. They are not a detail, they are the past of your user.
3. **Every pattern you repeat ten times deserves an abstraction.** Twelve games with the same new column is not a coincidence; it is an architecture lesson waiting to be learned.

See you in the next entry, where we'll get down into the mud of SQL and Kotlin to see how to build a `RetroactiveStatsPopulator` that actually works.

— *Scribe*