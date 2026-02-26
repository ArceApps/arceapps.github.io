---
title: "Semantic Versioning in Android: Best Practices"
description: "How to apply Semantic Versioning (SemVer) to Android. Managing `versionName` and `versionCode` for predictable releases."
pubDate: 2025-10-18
heroImage: "/images/placeholder-article-semantic-versioning.svg"
tags: ["Semantic Versioning", "Android", "Best Practices", "Versioning", "Release Management"]
reference_id: "ec7574e0-504b-474c-902b-fb10c1fde1d3"
---
## 🏷️ What is Semantic Versioning?

Semantic Versioning (SemVer) is a versioning scheme for software that conveys meaning about the underlying changes.
Format: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`).

### 1. MAJOR version
When you make incompatible API changes.
- **Android**: Removing support for an old API level, changing deep links structure.
- **Example**: `2.0.0` (Major UI overhaul).

### 2. MINOR version
When you add functionality in a backward-compatible manner.
- **Android**: Adding a new feature, screen, or capability.
- **Example**: `1.3.0` (Added Dark Mode).

### 3. PATCH version
When you make backward-compatible bug fixes.
- **Android**: Fixing a crash, correcting a typo.
- **Example**: `1.2.1` (Fixed NPE in Login).

## 📱 Android Versioning: `versionName` vs. `versionCode`

### `versionName` (String)
Visible to users on Play Store (e.g., "v1.2.3"). Use SemVer here.

### `versionCode` (Integer)
Used internally by Play Store to track updates. Must always increase.
- **Best Practice**: Derive from SemVer.
- **Formula**: `Major * 10000 + Minor * 100 + Patch`.
- **Example**: `1.2.3` -> `10203`.

## 🚀 Automating SemVer

Don't guess the version. Use tools like `semantic-release` or Conventional Commits to calculate it automatically based on your git history.
- `fix:` -> Patch bump.
- `feat:` -> Minor bump.
- `BREAKING CHANGE:` -> Major bump.

## 🏁 Conclusion

Adopting SemVer brings discipline to your release process. It communicates the scope of changes clearly to your users (and your QA team).
