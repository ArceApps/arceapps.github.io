---
title: "GitHub Pages para Android Devs: Tu Portafolio Gratis y Profesional"
description: "Aprende a desplegar este mismo blog, documentación de librerías o landing pages de tus apps usando GitHub Pages y Astro, totalmente gratis."
pubDate: "2025-11-15"
heroImage: "/images/placeholder-article-github-pages.svg"
tags: ["GitHub Pages", "Web", "Portfolio", "Astro", "Personal Branding"]
---
## 🌍 ¿Por qué GitHub Pages?

Como desarrolladores Android, a menudo descuidamos nuestra presencia web. "Yo hago apps, no webs", decimos. Pero tener un portafolio o un blog técnico es vital para tu carrera.

**GitHub Pages** es la solución perfecta porque:
1.  **Es Gratis**: Hosting ilimitado para proyectos estáticos.
2.  **Es Git-based**: Despliegas con un `git push`.
3.  **Es Rápido**: Servido a través de la CDN de GitHub.
4.  **Soporta Dominios Personalizados**: `tu-nombre.com` con HTTPS gratis.

## 🚀 Astro: El Framework Web para No-Web Devs

Este blog está construido con **Astro**. ¿Por qué Astro y no React/Angular?

-   **Zero JS by Default**: Astro renderiza HTML estático. Carga instantáneamente.
-   **Content-Driven**: Diseñado para blogs y documentación (Markdown nativo).
-   **Sintaxis Familiar**: Si sabes HTML y un poco de JS (o Kotlin/Java), sabes Astro.

```astro
---
// Esto es como el "backend" del componente (se ejecuta en build time)
const title = "Mi Portafolio Android";
const apps = ["Sudoku", "TodoApp", "Weather"];
---

<!-- Esto es el template (HTML + variables) -->
<html>
  <body>
    <h1>{title}</h1>
    <ul>
      {apps.map((app) => <li>{app}</li>)}
    </ul>
  </body>
</html>
```

## 🛠️ Configurando el Pipeline de Despliegue

Para desplegar una web Astro en GitHub Pages automáticamente:

1.  Habilita Pages en tu repo: `Settings -> Pages -> Source: GitHub Actions`.
2.  Crea el workflow `.github/workflows/deploy.yml`:

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

## 🎨 Documentación de Librerías (Dokka + Pages)

Si tienes una librería Android Open Source, **debes** tener documentación web.

1.  Genera la documentación con Dokka (ver [artículo de documentación](blog-android-documentation.md)).
2.  Configura el output de Dokka para que vaya a una carpeta `docs/`.
3.  En GitHub Pages settings, elige `Source: Deploy from a branch` y selecciona la carpeta `/docs`.

¡Listo! Ahora tienes `tu-usuario.github.io/tu-libreria` con documentación profesional navegable.

## 🎯 Conclusión

No necesitas ser un experto en React o gastar dinero en AWS para tener una presencia web profesional. Con GitHub Pages y Astro, puedes construir y mantener tu marca personal usando las mismas herramientas (Git, CI/CD) que ya usas cada día.
