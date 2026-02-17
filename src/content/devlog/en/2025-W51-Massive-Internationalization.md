---
title: "2025 W51: Breaking the Language Barrier"
description: "A massive internationalization sprint to eliminate hardcoded text and prepare PuzzleSuite for the world."
pubDate: 2025-12-21
tags: ["devlog", "i18n", "refactoring", "quality"]
heroImage: "/images/devlog-w51-i18n.svg"
---

Sometimes, to go fast, you leave things behind. In the development of *PuzzleSuite*, one of those things was language. "We'll fix it later," we said as we wrote `Text("Statistics")` directly into the UI code.

Well, this week, "later" finally arrived.

## 🌍 The Great String Migration

Week 51 (December 15th to 21st) officially became Internationalization Week. We realized that our stats and history screens were a mosaic of Spanish text "hardcoded" into the code, making it impossible to offer a quality experience in any other language.

The team (well, me and my AI agents) embarked on a mission to search and destroy hardcoded strings.

### The Scope of Work

It wasn't just one game. It was a systematic operation that covered almost the entire catalog:

*   **Minesweeper**: We cleaned up over 15 texts in its complex stats screen.
*   **Kakuro, Hitori, Shikaku, Fillomino**: All their stats and history screens were refactored.

In total, we moved hundreds of lines of text from Kotlin `(.kt)` files to our `strings.xml` resource files.

## 🛠️ Why does this matter?

It might seem like boring "copy and paste" work, but the impact on code quality is huge:

1.  **Zero Magic Texts**: Now, `R.string.hitori_stats_best_time` is the single source of truth. If we want to change "Best time" to "Record", we do it in one place.
2.  **Real Multi-language Support**: Now the app magically changes from English to Spanish (and in the future to French, German, Japanese...) respecting the user's phone settings.
3.  **Cleaner Code**: Separating logic from presentation is the ABC of software engineering, and our UI screens are now pure, with no text strings cluttering the component hierarchy.

## 🐛 Hunting Duplicates

During this process, we found something embarrassing but instructive: we had duplicate (and triplicate!) definitions for things as simple as difficulty levels (`Easy`, `Medium`, `Hard`).

Each game had defined its own versions: `dominosa_difficulty_easy`, `fillomino_difficulty_easy`, etc. We took advantage of the cleanup to unify everything under a single set of generic strings: `difficulty_easy`.

Less code, less redundancy, less chance of errors.

## 🚀 Towards the Year End

With the language barrier torn down, we feel much more professional. *PuzzleSuite* no longer looks like a weekend project, but a robust application ready for a global audience.

Next week (the second to last of the year), we will focus on standardizing the state architecture, because if the UI now speaks well, we want the internal logic to "think" with the same clarity.

See you in week 52!
