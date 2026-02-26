---
title: "Automated Versioning in Android with CI/CD"
description: "Stop manually bumping `versionCode`. Use GitHub Actions and SemVer to automate your Android app versioning strategy."
pubDate: 2025-10-18
heroImage: "/images/placeholder-article-automated-versioning.svg"
tags: ["Android", "Versioning", "Gradle", "CI/CD", "Semantic Versioning", "GitHub Actions"]
reference_id: "f0d36318-91ed-4f7c-a447-f460ea56e7a0"
---
## 🔢 The Manual Problem

Releasing an Android app involves:
1.  Open `build.gradle.kts`.
2.  Increment `versionCode`.
3.  Update `versionName`.
4.  Git commit "Bump version".
5.  Tag "v1.0.1".

This is manual, error-prone (forgetting to bump code), and annoying.

## 🚀 The Automated Solution

Use **Semantic Release** or simple GitHub Actions to calculate the version based on your git history.

### Strategy: Conventional Commits + SemVer

1.  **Commits**: Format commits like `feat: login screen` (minor) or `fix: crash on startup` (patch).
2.  **Tool**: Analyze commits since the last tag.
3.  **Result**: Determine next version (e.g., 1.0.0 -> 1.1.0).

### Implementation: Gradle Script

Create a `versioning.gradle.kts` file:

```kotlin
val versionPropsFile = file("version.properties")
val versionProps = Properties()

if (versionPropsFile.canRead()) {
    versionProps.load(FileInputStream(versionPropsFile))
} else {
    versionProps["VERSION_CODE"] = "1"
    versionProps["VERSION_NAME"] = "0.0.1"
}

tasks.register("bumpVersion") {
    doLast {
        val type = project.findProperty("bumpType") as? String ?: "patch"
        // Logic to increment version based on type
        // ...
        versionProps.store(versionPropsFile.writer(), null)
    }
}
```

### CI/CD Pipeline (GitHub Actions)

In your `.github/workflows/release.yml`:

1.  **Checkout**: Get code.
2.  **Calculate Version**: Use `semantic-release` action.
3.  **Write Version**: Update `version.properties`.
4.  **Build**: `./gradlew bundleRelease`.
5.  **Tag**: Create git tag with new version.
6.  **Release**: Upload AAB to Play Store.

```yaml
name: Release App
on:
  push:
    branches: [ main ]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Semantic Release
        uses: cycjimmy/semantic-release-action@v3
        id: semantic
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Update Version File
        if: steps.semantic.outputs.new_release_published == 'true'
        run: |
          echo "VERSION_NAME=${{ steps.semantic.outputs.new_release_version }}" > version.properties
          # Logic to increment versionCode based on commit count or timestamp

      - name: Build Release
        run: ./gradlew bundleRelease
```

## 🧠 Why Automate?

1.  **Consistency**: No more "version 1.2.0" followed by "1.2.0-fix".
2.  **Traceability**: Every build is linked to a git tag.
3.  **Speed**: Release with a single merge to `main`.

## ⚠️ Caveats

- **Version Code**: Must be an integer and always increase. A common pattern is `Major * 10000 + Minor * 100 + Patch` or simply using the git commit count / timestamp.
- **Hotfixes**: Requires a specific branch strategy (e.g., `release/v1.0`).

## 🏁 Conclusion

Automated versioning is a hallmark of a mature CI/CD pipeline. It removes friction from the release process and ensures your `versionName` always reflects the actual changes in the app.
