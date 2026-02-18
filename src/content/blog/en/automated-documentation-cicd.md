---
title: "Automated Documentation: CI/CD with Dokka and MkDocs"
description: "Generate and deploy your Android documentation automatically. How to set up GitHub Actions to publish KDoc and MkDocs to GitHub Pages."
pubDate: 2025-10-18
heroImage: "/images/placeholder-article-automated-docs.svg"
tags: ["Documentation", "CI/CD", "Dokka", "GitHub Actions", "Android", "MkDocs"]
reference_id: "1299d2ab-5ddf-49e3-b1dc-6c4925f7f5fd"
---
## 📝 The Documentation Gap

Manual documentation gets stale. Automated documentation (from code) is always accurate.

### Tools
1.  **Dokka**: For API reference (KDoc).
2.  **MkDocs**: For guides and tutorials.
3.  **GitHub Actions**: For deployment.

## 🛠️ Step 1: Configure Dokka

Add to `build.gradle.kts`:

```kotlin
plugins {
    id("org.jetbrains.dokka") version "1.9.20"
}

tasks.dokkaHtml.configure {
    outputDirectory.set(file("build/dokka/html"))
}
```

Run `./gradlew dokkaHtml`. You now have HTML files in `build/dokka`.

## 🛠️ Step 2: Configure MkDocs

Install MkDocs (Python tool).

```yaml
# mkdocs.yml
site_name: My Android Project
theme:
  name: material
nav:
  - Home: index.md
  - Architecture: architecture.md
  - API Reference: api/index.html # Link to Dokka output
```

## 🚀 Step 3: GitHub Actions Workflow

Create `.github/workflows/docs.yml`:

```yaml
name: Deploy Docs
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build Dokka
        run: ./gradlew dokkaHtml

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: 3.x

      - name: Install MkDocs
        run: pip install mkdocs-material

      - name: Move Dokka to MkDocs
        run: |
          mkdir -p docs/api
          cp -r build/dokka/html/* docs/api/

      - name: Build & Deploy
        run: mkdocs gh-deploy --force
```

## 🧠 Why This Matters

1.  **Single Source of Truth**: Code comments = Documentation.
2.  **Versioning**: Docs are versioned with git.
3.  **Accessibility**: Easy for new devs to browse API.

## 🏁 Conclusion

Invest 30 minutes setting this up once, and never worry about stale docs again. Your team will have a professional documentation site updated on every commit.
