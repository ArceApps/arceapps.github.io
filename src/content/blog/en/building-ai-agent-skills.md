---
title: "Power Up Your AI Agents with Skills: From Gemini to Copilot"
description: "Discover how to transform your generalist AI assistant into a team of specialists using Agent Skills. Includes practical examples for Android, Kotlin, and Conventional Commits."
pubDate: 2025-05-24
heroImage: "/images/agent-skills-gemini.svg"
tags: ["AI", "Gemini", "GitHub Copilot", "Android", "Kotlin", "Productivity"]
reference_id: "42909a97-16db-483c-97dd-4c63fa42ee3c"
---

Artificial Intelligence in software development has evolved rapidly. We have moved from simple "copy and paste" prompts to complex contexts managed by files like `AGENTS.md` or `GEMINI.md`. However, as our projects grow, so does the context we need to provide. This is where the next big leap comes in: **Agent Skills**.

Both **Google Gemini** and **GitHub Copilot** (and others like Claude Code or ChatGPT) are adopting this modular model. Instead of loading a giant monolithic context, "Skills" allow the AI to load specific knowledge on demand, behaving like a true team of specialists.

## 🧩 What is a Skill?

A **Skill** is basically a folder that encapsulates specific knowledge. Imagine it as installing a plugin in your digital brain. Instead of explaining to your AI how your company's rules work in every chat, the agent "discovers" that it has a skill called `company-standards` and invokes it only when it detects that it needs it.

The standard structure (largely defined by tools like Gemini CLI) is usually:

```text
.gemini/skills/ (or .github/skills/)
└── my-skill/
    ├── SKILL.md       <-- Instructions and metadata
    └── scripts/       <-- Executable tools (optional)
```

You can read more about the official specification in the [Gemini CLI documentation](https://geminicli.com/docs/cli/skills/) or explore thousands of skills created by the community at [SkillsMP](https://skillsmp.com/en).

## 🛠️ Example 1: The Conventional Commits Expert

One of the most repetitive tasks is writing commit messages that strictly follow convention. Let's create a Skill that turns your agent into a **Conventional Commits** expert.

**File:** `.gemini/skills/conventional-commits/SKILL.md`

```markdown
---
name: conventional-commits
description: Expert in writing commit messages following the Conventional Commits standard. Use it when the user asks to generate a commit or review changes to push.
---

# Conventional Commits Expert

Act as a version control expert who strictly follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Message Structure

```text
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

## Allowed Types
- **feat**: A new feature for the user.
- **fix**: A bug fix for the user.
- **docs**: Documentation only changes.
- **style**: Formatting changes (spaces, commas) that do not affect the code.
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **perf**: A code change that improves performance.
- **test**: Adding missing tests or correcting existing tests.
- **build**: Changes that affect the build system or external dependencies.
- **ci**: Changes to our CI configuration files and scripts.
- **chore**: Other changes that don't modify src or test files.

## Golden Rules
1.  **Imperative**: The description must be in the imperative mood ("add" instead of "added").
2.  **Lowercase**: Do not capitalize the first letter of the short description.
3.  **No period**: The first line should not end with a period.
4.  **Breaking Changes**: If there are changes that break compatibility, add `BREAKING CHANGE:` in the footer or a `!` after the type (e.g., `feat!: ...`).

## Workflow
1.  Analyze the changes in the `git diff`.
2.  Identify the main purpose (feature, fix, refactor, etc.).
3.  Generate 3 commit message options.
```

With this skill installed, every time you ask "generate the commit for these changes", the AI will know exactly what format to use without you having to remind it.

## 📱 Example 2: Android Leak Detector (Kotlin)

For Android developers, detecting *Memory Leaks* is crucial. This skill helps the AI identify dangerous patterns in Kotlin code.

**File:** `.gemini/skills/android-leak-detector/SKILL.md`

```markdown
---
name: android-leak-detector
description: Specialist in detecting memory leaks in Android and Kotlin code. Use it to review code or analyze OutOfMemoryError.
---

# Android Leak Hunter

Your goal is to identify code patterns that commonly cause memory leaks in Android.

## Patterns to Watch (Red Flags)

### 1. Context in Static Objects
**Bad:** `companion object { var context: Context? = null }`
**Good:** Never store `Context`, `View`, or `Activity` in static fields. If you need a global context, suggest using `WeakReference<Context>` or injecting the `ApplicationContext`.

### 2. Non-Static Inner Classes
**Bad:** Inner classes (`inner class`) or anonymous classes (like `Handler` or `Runnable`) defined inside an Activity that outlive the lifecycle.
**Solution:** Suggest converting them to `static class` (in Java) or normal nested classes in Kotlin, and passing necessary dependencies as weak references.

### 3. Listeners and Observables without Cleanup
**Rule:** If a component subscribes to an event (EventBus, BroadcastReceiver, LocationManager) in `onStart`/`onResume`, it MUST unsubscribe in `onStop`/`onPause`.
**Verification:** Look for calls to `register` without their corresponding `unregister`.

### 4. Coroutines and Lifecycle
**Bad:** Launching coroutines in `GlobalScope` from components with lifecycle (Activity/Fragment).
**Solution:** Always suggest using `lifecycleScope` or `viewModelScope` to ensure tasks are automatically cancelled when the view is destroyed.

## Recommended Action
If you detect one of these patterns:
1.  Point out the exact line.
2.  Explain why it causes a leak (retained reference).
3.  Provide refactored code using best practices (e.g., `WeakReference`, `LifecycleOwner`).
```

## 🧹 Example 3: The Kotlin Style Guardian

A skill to ensure code not only works but is idiomatic and clean.

**File:** `.gemini/skills/kotlin-style-guardian/SKILL.md`

```markdown
---
name: kotlin-style-guardian
description: Kotlin code linter and refactorer focused on idiomaticity and cleanliness. Use it for Code Reviews.
---

# Kotlin Style Guardian

Act as a Senior Android Developer reviewing Pull Requests.

## Idiomaticity Checklist

1.  **Null Safety:**
    -   Avoid `!!` at all costs. Suggest `?.let {}`, `?:` (Elvis operator), or smart casts.
    -   Prefer `val` over `var` whenever possible (immutability).

2.  **Scope Functions:**
    -   Use `apply` for object configuration.
    -   Use `let` for blocks dependent on a non-null result.
    -   Use `run` for initialization and calculation blocks.

3.  **Collections:**
    -   Prefer `Sequence` (with `asSequence()`) for long chains of operations (`map`, `filter`) on large lists to improve performance.
    -   Use extension functions like `firstOrNull()` instead of checking size.

4.  **Expressions:**
    -   Prefer `if` and `when` as expressions (assigning their value) instead of imperative control flow statements.
    -   Use "Expression Body" for single-line functions (`fun sum(a: Int, b: Int) = a + b`).

## Refactoring Example
**Input:**
```kotlin
fun getUserName(user: User?): String {
    if (user != null) {
        if (user.name != null) {
            return user.name!!
        }
    }
    return "Guest"
}
```

**Suggested Output:**
```kotlin
fun getUserName(user: User?) = user?.name ?: "Guest"
```
```

## Conclusion

The **Agent Skills** architecture allows us to scale the help we receive from AI without saturating its context or our token budget. By defining clear roles (the commit expert, the leak hunter, the style guardian), we turn tools like Gemini and Copilot into true teammates who know the rules of the game.

Ready to create your first skill? Start by identifying that repetitive task you always have to correct your current chat on and encapsulate it in a `SKILL.md` file.
