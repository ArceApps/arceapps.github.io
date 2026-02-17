---
title: "Automated Documentation with CI/CD"
description: "How to integrate documentation generation into your CI/CD pipeline for always up-to-date docs. Automate Javadoc/KDoc deployment with GitHub Actions."
pubDate: 2025-08-10
heroImage: "/images/placeholder-article-auto-docs.svg"
tags: ["Documentation", "CI/CD", "Dokka", "GitHub Actions", "Android"]
reference_id: "f57a2568-83ab-46ee-a0b4-aafb684b8d38"
---

The only thing worse than no documentation is **outdated documentation**. If you have to remember to run a command to generate docs, you will forget.

In this guide, we will set up a GitHub Actions workflow that automatically builds your project's documentation and deploys it to GitHub Pages on every merge to `main`.

## 🛠️ The Goal

1.  **Code Change**: Developer pushes code with KDoc comments.
2.  **Build**: CI runs `./gradlew dokkaHtml`.
3.  **Deploy**: CI pushes the generated HTML to the `gh-pages` branch.
4.  **Result**: Your documentation site (e.g., `your-org.github.io/repo`) is instantly updated.

## 📦 Setting up GitHub Actions

Create `.github/workflows/docs.yml`:

```yaml
name: Deploy Docs

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write # Needed to push to gh-pages branch

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Generate Dokka Docs
        run: ./gradlew dokkaHtml

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build/dokka/html
```

## 🧠 Why automate this?

1.  **Source of Truth**: The code IS the documentation. If the code changes, the docs change.
2.  **Onboarding**: New developers can always find the latest API reference without asking "is this wiki page current?".
3.  **Review Process**: You can even run this on PRs to verify that documentation builds correctly, failing the PR if KDoc is invalid (using Dokka's strict mode).

## ⚠️ Common Pitfalls

*   **Permissions**: Ensure your GITHUB_TOKEN has write permissions in the repo settings.
*   **Java Version**: Match the JDK version used in your project (usually 11 or 17 for modern Android).
*   **Gradle Caching**: Enable Gradle build caching to speed up the process if your project is large.

## 🏁 Conclusion

Automating documentation is a low-effort, high-reward investment. It turns documentation from a chore into a reliable artifact of your engineering process.
