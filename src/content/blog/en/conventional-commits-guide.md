---
title: "Conventional Commits: The Communication Standard"
description: "Why your commit messages matter. A guide to Conventional Commits for better team communication and automated tooling."
pubDate: 2025-06-21
heroImage: "/images/placeholder-article-conventional-commits.svg"
tags: ["Git", "Best Practices", "Conventional Commits", "DevOps", "Communication"]
reference_id: "c81d684b-4edf-4881-afb5-722e474a8980"
---
## 📝 The Importance of Commit Messages

A commit message is a note to your future self and your team. "Fixed bug" is useless. "Fix null pointer in LoginActivity" is better.

Conventional Commits standardizes this format, making messages readable by both humans and machines.

### Format
`<type>(<scope>): <description>`

- **feat**: A new feature (correlates with MINOR SemVer).
- **fix**: A bug fix (correlates with PATCH SemVer).
- **docs**: Documentation only changes.
- **style**: Changes that do not affect the meaning of the code (white-space, formatting).
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **perf**: A code change that improves performance.
- **test**: Adding missing tests or correcting existing tests.
- **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm).
- **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs).
- **chore**: Other changes that don't modify src or test files.
- **revert**: Reverts a previous commit.

## 🚀 Examples

### Good
`feat(auth): add google login button`
`fix(home): prevent crash on orientation change`
`docs(readme): update setup instructions`

### Bad
`added login`
`fixed stuff`
`wip`

## 🤖 Why Use It?

1.  **Automation**: Generate changelogs automatically.
2.  **Versioning**: Determine semantic version bumps (feat -> minor, fix -> patch).
3.  **Searchability**: Easily grep for all `fix` commits in a module.

## 🛠️ Tools

- **Commitizen**: CLI tool to help you write formatted messages.
- **Husky**: Git hooks to lint messages before commit.
- **Conventional Changelog**: Generate `CHANGELOG.md` from git history.

## 🏁 Conclusion

Adopting Conventional Commits is a small habit change with massive ROI. It turns your git log into a structured database of project history.
