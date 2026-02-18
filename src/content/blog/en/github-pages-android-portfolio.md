---
title: "GitHub Pages for Android Devs: Your Free Professional Portfolio"
description: "Learn how to deploy this very blog, library documentation, or app landing pages using GitHub Pages and Astro, completely free."
pubDate: 2025-11-15
heroImage: "/images/placeholder-article-github-pages.svg"
tags: ["GitHub Pages", "Web", "Portfolio", "Astro", "Personal Branding"]
reference_id: "45210925-fcbf-46d8-a343-f68613cf8526"
---
## 🌍 Why GitHub Pages?

As Android developers, we often neglect our web presence. "I build apps, not webs", we say. But having a portfolio or technical blog is vital for your career.

**GitHub Pages** is the perfect solution because:
1.  **It's Free**: Unlimited hosting for static projects.
2.  **It's Git-based**: You deploy with a `git push`.
3.  **It's Fast**: Served via GitHub's CDN.
4.  **Supports Custom Domains**: `your-name.com` with free HTTPS.

## 🚀 Astro: The Web Framework for Non-Web Devs

This blog is built with **Astro**. Why Astro and not React/Angular?

-   **Zero JS by Default**: Astro renders static HTML. Loads instantly.
-   **Content-Driven**: Designed for blogs and documentation (native Markdown).
-   **Familiar Syntax**: If you know HTML and a bit of JS (or Kotlin/Java), you know Astro.

```astro
---
// This is like the "backend" of the component (runs at build time)
const title = "My Android Portfolio";
const apps = ["Sudoku", "TodoApp", "Weather"];
---

<!-- This is the template (HTML + variables) -->
<html>
  <body>
    <h1>{title}</h1>
    <ul>
      {apps.map((app) => <li>{app}</li>)}
    </ul>
  </body>
</html>
```

## 🛠️ Configuring the Deployment Pipeline

To deploy an Astro website to GitHub Pages automatically:

1.  Enable Pages in your repo: `Settings -> Pages -> Source: GitHub Actions`.
2.  Create the workflow `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v2
        with:
            package-manager: npm

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 🎨 Library Documentation (Dokka + Pages)

If you have an Open Source Android library, you **must** have web documentation.

1.  Generate documentation with Dokka (see [documentation article](android-documentation-best-practices)).
2.  Configure Dokka output to go to a `docs/` folder.
3.  In GitHub Pages settings, choose `Source: Deploy from a branch` and select the `/docs` folder.

Done! Now you have `your-user.github.io/your-library` with professional navigable documentation.

## 🎯 Conclusion

You don't need to be a React expert or spend money on AWS to have a professional web presence. With GitHub Pages and Astro, you can build and maintain your personal brand using the same tools (Git, CI/CD) you use every day.
