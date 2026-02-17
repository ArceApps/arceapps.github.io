---
title: "Conventional Commits: Writing History, Not Just Code"
description: "Stop writing 'fix bug' in your commits. Learn how Conventional Commits improve traceability, automate versioning, and make your team happier."
pubDate: 2025-08-15
heroImage: "/images/placeholder-article-commits.svg"
tags: ["Git", "Best Practices", "Conventional Commits", "DevOps"]
reference_id: "265ec237-e59c-4ad6-ae9e-dc28c1fdf199"
---

How many times have you seen a git history like this?
- "fix bug"
- "wip"
- "changes"
- "fix final final"

This is useless. It tells you nothing about *what* happened or *why*.

**Conventional Commits** is a specification for formatting commit messages. Ideally, it looks like this:

`type(scope): description`

## The Types

*   **feat**: A new feature (correlates with MINOR in Semantic Versioning).
*   **fix**: A bug fix (correlates with PATCH).
*   **docs**: Documentation only changes.
*   **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
*   **refactor**: A code change that neither fixes a bug nor adds a feature.
*   **perf**: A code change that improves performance.
*   **test**: Adding missing tests or correcting existing tests.
*   **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm).
*   **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs).
*   **chore**: Other changes that don't modify src or test files.
*   **revert**: Reverts a previous commit.

## Why Bother?

1.  **Automated Changelogs**: Tools can read your history and generate `CHANGELOG.md` automatically.
2.  **Semantic Versioning**: As seen in [Automated Versioning](automated-versioning-android), CI can determine if the next version is 1.0.1 or 1.1.0 based on whether you committed a `fix` or a `feat`.
3.  **Better Context**: When debugging a regression 6 months from now, `fix(auth): handle null token` is infinitely more useful than `fix`.

## Examples

**Good:**
`feat(login): add biometric authentication support`
`fix(ui): correct padding on profile screen`
`docs(readme): update installation instructions`

**Bad:**
`added stuff`
`fixed login`
`update`

Start using it today. Your future self (and your CI pipeline) will thank you.
