---
title: "Automated Versioning in Android: Goodbye Manual Versions"
description: "Implement automated semantic versioning in your Android projects using GitHub Actions and Conventional Commits. Stop guessing versions."
pubDate: 2025-08-25
heroImage: "/images/placeholder-article-versioning.svg"
tags: ["Android", "Versioning", "Gradle", "CI/CD", "Semantic Versioning"]
reference_id: "a64da282-5a63-4e98-addc-0445e45cad78"
---

Manual versioning (`versionCode 1`, `versionCode 2`, `versionName "1.0"`) is a recipe for disaster.
*   You forget to bump the version -> Google Play rejects the upload.
*   Two devs bump to the same number -> Merge conflict.
*   What does "1.2.3" even mean? Did we fix a bug or rewrite the whole app?

The solution is **Automated Semantic Versioning**.

## Semantic Versioning (SemVer)

The format `MAJOR.MINOR.PATCH` has meaning:
1.  **MAJOR**: Breaking changes (API incompatible).
2.  **MINOR**: New features (Backwards compatible).
3.  **PATCH**: Bug fixes (Backwards compatible).

But how do we know when to increment which number? **Conventional Commits**.

## Conventional Commits

By formatting commit messages in a specific way, we tell the CI system how to bump the version.

*   `feat: add login screen` -> Triggers **MINOR** bump (1.1.0 -> 1.2.0).
*   `fix: crash on rotation` -> Triggers **PATCH** bump (1.1.0 -> 1.1.1).
*   `feat!: rewrite database layer` -> Triggers **MAJOR** bump (1.1.0 -> 2.0.0).

## 🛠️ Implementation in GitHub Actions

We use a tool like `semantic-release` or a dedicated action to parse the git history and calculate the next version.

### Step 1: Calculate Version

In your `.github/workflows/release.yml`:

```yaml
      - name: Calculate Semantic Version
        id: semver
        uses: PaulHatch/semantic-version@v5.3.0
        with:
          change_path: "app/src"
          major_pattern: "(MAJOR|BREAKING CHANGE)"
          minor_pattern: "feat:"
          version_format: "${major}.${minor}.${patch}"
```

This action outputs `steps.semver.outputs.version` (e.g., "1.2.3").

### Step 2: Calculate Android VersionCode

Android requires an integer `versionCode` that must always increase. We can derive this mathematically from the SemVer string.

`Code = Major * 10000 + Minor * 100 + Patch`

Example: `2.1.9` -> `20109`.
This ensures that `2.2.0` (`20200`) is always greater than `2.1.9`.

```yaml
      - name: Compute Android Version Code
        id: calc
        run: |
          MAJOR=$(echo ${{ steps.semver.outputs.version }} | cut -d. -f1)
          MINOR=$(echo ${{ steps.semver.outputs.version }} | cut -d. -f2)
          PATCH=$(echo ${{ steps.semver.outputs.version }} | cut -d. -f3)

          # Bash math
          CODE=$((MAJOR * 10000 + MINOR * 100 + PATCH))

          echo "Calculated Code: $CODE"
          echo "version_code=$CODE" >> $GITHUB_OUTPUT
```

### Step 3: Injection at Build Time

Do not edit `build.gradle` in the repo (that creates noisy "version bump" commits). Instead, inject the versions as environment variables or Gradle parameters.

**In `app/build.gradle`:**
```groovy
android {
    defaultConfig {
        // If no params (local dev), use defaults. If present (CI), use injected.
        versionCode = project.hasProperty('versionCode') ? project.versionCode.toInteger() : 1
        versionName = project.hasProperty('versionName') ? project.versionName : "1.0.0-dev"
    }
}
```

**In Build Workflow:**
```yaml
      - name: Build Release AAB
        run: ./gradlew bundleRelease -PversionCode=${{ needs.calc.outputs.version_code }} -PversionName=${{ needs.calc.outputs.new_tag }}
```

## ⚡ Advanced Strategies for Large Teams

### Branch-based Versioning
For large teams, `develop` and `main` can diverge.
- **Main (Production)**: v1.2.0 (Code: 10200)
- **Develop (Beta)**: v1.3.0-beta.1 (Code: 103001) -> We use an extra digit at the end for pre-releases.

### Automatic Changelog Generation
Since we use Conventional Commits, we can generate release notes automatically grouped by type.

```yaml
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true # GitHub knows how to read conventional commits natively now
          tag_name: ${{ needs.calc.outputs.new_tag }}
```

## ⚠️ Risks and Mitigations

### The "Version Race"
If two PRs merge to `main` very quickly, both might try to generate version `v1.3.0`.
**Solution**: Set `concurrency` in your GitHub Actions workflow to ensure releases are sequential, never parallel.

```yaml
concurrency:
  group: production_release
  cancel-in-progress: false # Wait for the previous one to finish
```

### VersionCode Limits
Android has a limit of `2100000000` for versionCode. Our formula `Major * 10000` is safe for years, but if you use `github.run_number` or timestamp, you might exhaust numbers or break monotonicity if you migrate CI. The deterministic math formula based on SemVer is the most robust long-term.

## 🎯 Conclusion

Automating versioning isn't just "saving 5 minutes". It's implementing **trust infrastructure**. You eliminate the question "What version is this?" and the error "Why did the Play Store upload fail?".

You transform versioning from a manual, error-prone task into a logical, mathematical consequence of your development work.

**Implementation Summary:**
1.  Adopt **Conventional Commits**.
2.  Use an action to **calculate SemVer** based on git graph.
3.  Calculate **VersionCode** mathematically.
4.  Inject both via **Gradle Properties** (-P) in CI.
5.  Enjoy your weekends.
