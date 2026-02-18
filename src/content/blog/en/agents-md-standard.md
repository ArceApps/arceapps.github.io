---
title: "Agents.md Standard: Blueprint for AI-Ready Projects"
description: "Introducing the Agents.md standard. A file convention to context-load AI agents with project architecture, coding rules, and domain knowledge."
pubDate: 2025-05-15
heroImage: "/images/placeholder-article-agents-md.svg"
tags: ["AI", "Standard", "Agents", "Documentation", "Productivity", "Workflow"]
reference_id: "18f8fad7-3b63-4ea6-a8b2-bf9e057ed125"
---
## 📜 The Problem: Context Amnesia

Every time you start a new chat with an AI (Copilot, ChatGPT, Claude), it knows **nothing** about your project's specific rules.
- "Use Hilt, not Koin."
- "All ViewModels must extend `BaseViewModel`."
- "Target SDK is 34."

You repeat these instructions ad nauseam. This is inefficient and error-prone.

## 💡 The Solution: `AGENTS.md`

We propose a standard file, `AGENTS.md`, placed at the root of your repository. This file is written **specifically for AI agents**, not humans (though humans benefit too).

It serves as a "System Prompt Injection" for your codebase.

### Structure of `AGENTS.md`

1.  **Project Overview**: High-level summary.
2.  **Architecture**: Layering, patterns (MVVM/MVI), directory structure.
3.  **Tech Stack**: Libraries, versions, constraints.
4.  **Coding Conventions**: Naming, formatting, prohibited patterns.
5.  **Testing Strategy**: Libraries, coverage goals.
6.  **Common Tasks**: "Few-shot" examples of how to implement common features.

## 📱 Example: Android Project

```markdown
# Android Project - Agents Guide

## Overview
A modern task management app built with Jetpack Compose.

## Architecture
- **Clean Architecture**: `data` -> `domain` -> `presentation`.
- **UI**: Single Activity, Compose Navigation.
- **State**: `StateFlow` + `UiState` sealed hierarchy.

## Tech Stack
- **DI**: Hilt
- **Async**: Coroutines + Flow
- **Network**: Retrofit
- **DB**: Room

## Coding Rules
- Use `val` by default.
- ViewModels expose `StateFlow<UiState>`.
- Composables: Accept `modifier: Modifier` as the first optional param.
- **NO**: `LiveData`, `AsyncTask`, `Synthetics`.

## Testing
- Unit: JUnit5 + Mockk
- UI: Compose Test Rule
```

## 🚀 How to Use It

1.  **Create the File**: Add `AGENTS.md` to your root.
2.  **Reference It**: When asking an AI to generate code, say:
    > "Generate a Login Screen following the guidelines in AGENTS.md."
3.  **Automate It**: Configure tools like Cursor or Copilot to always index this file.

## 📈 Benefits

- **Consistency**: AI generates code that looks like *your* code.
- **Speed**: No need to prompt-engineer every request.
- **Onboarding**: New devs (humans) can read it to understand the "soul" of the project.

## 🔮 The Future

We envision IDEs automatically detecting `AGENTS.md` and pre-loading it into the context window of every AI interaction. It's a small file that makes a massive difference in AI-assisted development.
