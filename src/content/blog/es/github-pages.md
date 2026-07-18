---
title: "GitHub Pages para Android Devs: Tu Portafolio Profesional Gratis"
description: "Aprende a desplegar este mismo blog, documentación de librerías o landing pages de tus apps usando GitHub Pages y Astro, totalmente gratis."
pubDate: 2025-11-15
lastmod: 2026-07-18
author: ArceApps
keywords:
  - "GitHub Pages"
  - "Portafolio"
  - "Android Devs"
  - "Estático"
  - "Gratis"
canonical: "https://arceapps.com/es/blog/github-pages/"
heroImage: "/images/placeholder-article-github-pages.svg"
tags: ["GitHub Pages", "Web", "Portfolio", "Astro", "Personal Branding"]
reference_id: "45210925-fcbf-46d8-a343-f68613cf8526"
---


## 🌍 ¿Por qué GitHub Pages?

Como desarrolladores Android, a menudo descuidamos nuestra presencia web. "Yo hago apps, no webs", decimos. Pero tener un portafolio o un blog técnico es vital para tu carrera.

**GitHub Pages** es la solución perfecta porque:

1. **Es Gratis**: Hosting ilimitado para proyectos estáticos (dentro de los límites de uso justo).
2. **Es Git-based**: Despliegas con un `git push`.
3. **Es Rápido**: Servido a través de la CDN de GitHub.
4. **Soporta Dominios Personalizados**: `tu-nombre.com` con HTTPS gratis.
5. **SSL automático**: Let's Encrypt gestionado por GitHub, sin tocar nada.

Este artículo es la versión expandida del que publiqué originalmente en noviembre de 2025. Lo actualizo en julio de 2026 con todo lo que he aprendido tras gestionar varios sitios en Pages (incluido este blog que estás leyendo), incluyendo tres gotchas que me costaron horas y que te voy a ahorrar.

## 🚀 Astro: El Framework Web para No-Web Devs

Este blog está construido con **Astro**. ¿Por qué Astro y no React/Angular?

- **Zero JS by Default**: Astro renderiza HTML estático. Carga instantáneamente.
- **Content-Driven**: Diseñado para blogs y documentación (Markdown nativo).
- **Sintaxis Familiar**: Si sabes HTML y un poco de JS (o Kotlin/Java), sabes Astro.
- **Islands Architecture**: Solo hidrata lo que necesita JS, el resto es HTML plano.

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

La sintaxis `---` arriba es el "frontmatter" del componente (en build-time). Después viene HTML directo con expresiones `{variable}` y mapeos `{array.map(...)}`. Si vienes de Kotlin o Java, el concepto de "tipo de dato que vive en el frontmatter" te resultará familiar de Gradle o Dokka.

## 🛠️ El pipeline completo, paso a paso

### Paso 1: Crear el repo con nombre correcto

Para una página de usuario (`tu-usuario.github.io`), el repo **tiene que** llamarse exactamente `tu-usuario.github.io`. Para una página de proyecto, vale cualquier nombre y la URL será `tu-usuario.github.io/nombre-repo`. Esa distinción es la primera confusión que tiene todo el mundo.

```bash
mkdir mi-portafolio && cd mi-portafolio
git init
# Crear el repo en GitHub con nombre tu-usuario.github.io
git remote add origin git@github.com:tu-usuario/tu-usuario.github.io.git
```

### Paso 2: `astro.config.mjs` — el campo crítico que olvidé mil veces

El error más común al desplegar en Pages es olvidar el campo `site:`. Si no lo pones, **la canonical URL se rompe** y tu SEO desaparece. Si estás en una página de proyecto (no de usuario), además necesitas `base:`.

```javascript
// astro.config.mjs

// Para página de USUARIO (recomendado):
export default defineConfig({
  site: 'https://tu-usuario.github.io',
  // base: '/'  // opcional, default es '/'
});

// Para página de PROYECTO (recomendado si tienes varias apps/blogs):
export default defineConfig({
  site: 'https://tu-usuario.github.io',
  base: '/mi-proyecto',  // sin slash final
});
```

Si despliegas con dominio custom, sustituye el `site:` por `https://tu-dominio.com`. Con CNAME configurado (ver paso 6), GitHub Pages sabe que tu repo vive bajo otro dominio y los links funcionan automáticamente.

### Paso 3: GitHub Actions — el workflow oficial

Para desplegar una web Astro en GitHub Pages automáticamente:

1. Habilita Pages en tu repo: `Settings -> Pages -> Source: GitHub Actions`.
2. Crea el workflow `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
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

**Tres detalles que parecen menores y te van a doler:**

1. El `permissions:` block es obligatorio desde 2023. Sin `id-token: write`, el deploy falla con un mensaje críptico de OIDC.
2. El `concurrency.group` evita que dos deploys simultáneos se pisen. Importante si haces `git push` mientras otro workflow está corriendo.
3. `withastro/action@v3` (no v2). La v3 cachea `node_modules` automáticamente; la v2 tardaba 3× más.

### Paso 4: Tu primer commit y tu primera página

```bash
git add .
git commit -m "feat: initial Astro site for GitHub Pages"
git push origin main
```

Ve a `Settings -> Pages`. Espera 1–2 minutos. Tu sitio debería estar en `https://tu-usuario.github.io` (o `https://tu-usuario.github.io/mi-proyecto`).

### Paso 5: Dominio custom + HTTPS

Crea un archivo `public/CNAME` con tu dominio:

```
midominio.com
```

Configura el DNS de tu dominio:

| Tipo | Nombre | Valor |
|---|---|---|
| CNAME | `www` | `tu-usuario.github.io.` |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

(Las IPs son las de GitHub Pages; pueden cambiar, consulta la [doc oficial](https://docs.github.com/es/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).)

En `Settings -> Pages -> Custom domain`, escribe `midominio.com` y marca **Enforce HTTPS**. La propagación DNS puede tardar hasta 24h, aunque suele ser minutos.

### Paso 6: Verificación post-deploy

```bash
# ¿Está vivo?
curl -sLo /dev/null -w "%{http_code}\n" https://midominio.com/
# Esperado: 200

# ¿Está el sitemap?
curl -s https://midominio.com/sitemap-index.xml | head
# Esperado: XML con URLs listadas

# ¿Se renderiza tu contenido nuevo?
find dist -path "*blog*" -name "index.html" | head -5
# Esperado: rutas generadas
```

Si `find dist` devuelve vacío tras un build verde, tienes el **pubDate-future trap** que cubro en mi [guía de debugging de Astro](/es/blog/). La solución es simple: backea `pubDate` un día.

## 🎨 Documentación de Librerías (Dokka + Pages)

Si tienes una librería Android Open Source, **debes** tener documentación web.

1. Genera la documentación con Dokka (ver [artículo de documentación](blog-android-documentation.md)).
2. Configura el output de Dokka para que vaya a una carpeta `docs/`.
3. En GitHub Pages settings, elige `Source: Deploy from a branch` y selecciona la carpeta `/docs`.

¡Listo! Ahora tienes `tu-usuario.github.io/tu-libreria` con documentación profesional navegable.

Alternativa 2026: usa **Kotlin/JS** + Dokka directamente, sin Astro. Más complejo pero genera docs interactivas con búsqueda client-side.

## 📊 GitHub Pages vs alternativas: la tabla honesta

Antes de comprometerte, mira los trade-offs reales:

| Característica | GitHub Pages | Netlify | Vercel | Cloudflare Pages |
|---|---|---|---|---|
| Precio | Gratis | Gratis (tier) | Gratis (tier) | Gratis |
| Build min/mes | 10 (Actions) | 300 | 6000 | 500 |
| Bandwidth | "Soft limit" 100GB | 100GB | 100GB | Ilimitado |
| CDN global | Sí | Sí | Sí | Sí |
| Custom domain | Sí | Sí | Sí | Sí |
| HTTPS auto | Sí (Let's Encrypt) | Sí | Sí | Sí |
| Forms | No | Sí | Sí | Sí (Workers) |
| Functions | No | Sí (Edge) | Sí (Edge) | Sí (Workers) |
| Privacidad del repo | **Solo público** | Privado OK | Privado OK | Privado OK |

**La trampa de GitHub Pages** que casi nadie menciona: tu repo **debe ser público** para Pages gratuitas. Si quieres deployar un blog desde un repo privado, Pages no es opción (salvo que pagues GitHub Pro por la organización). Netlify y Vercel son mejores en ese caso.

Para un portafolio Android, Pages es la opción correcta: gratis, rápido, y ya tienes cuenta en GitHub.

## ⚠️ Troubleshooting: tres gotchas que cuestan horas

**1. `pubDate` futuro → página no se renderiza.** El filtro `data.pubDate <= new Date()` excluye posts publicados "hoy" si el build corre en otro huso horario. Diagnóstico: `find dist -path "*<slug>*"` devuelve vacío tras build verde. Fix: backea `pubDate` un día.

**2. Imágenes en `src/` no se incluyen en build.** Astro solo copia `public/` automáticamente. Si metes imágenes en `src/assets/`, necesitas importarlas (`import img from '../assets/x.png'`). Si las metes en `src/images/`, asegúrate de que el componente las referencia.

**3. Custom domain se rompe tras `git push`.** GitHub Pages reescribe el campo "Custom domain" si no tienes `CNAME` versionado. Solución: añade `public/CNAME` al repo y haz commit. Pages lo lee en cada deploy.

## 🎯 Conclusión

No necesitas ser un experto en React o gastar dinero en AWS para tener una presencia web profesional. Con GitHub Pages y Astro, puedes construir y mantener tu marca personal usando las mismas herramientas (Git, CI/CD) que ya usas cada día.

Si tuviera que recomendarte un siguiente paso: **crea un repo `tu-usuario.github.io` hoy mismo**, mete un `index.html` con tu nombre y un link a tu Play Store. Mañana lo conviertes en Astro. En un mes tienes un blog. La fricción de empezar es lo único que te separa de tener presencia web profesional.

## Bibliografía y Referencias

- [Documentación oficial de Astro](https://docs.astro.build/es/guides/deploy/github/) — La guía canónica, actualizada con cada release.
- [GitHub Pages:官方 docs](https://docs.github.com/es/pages) — Para CNAME, HTTPS enforced, y los nuevos límites de uso.
- [withastro/action en GitHub Marketplace](https://github.com/marketplace/actions/deploy-to-github-pages) — La acción que uso en cada deploy.
- [State of JS 2025: Astro subió al top 3](https://stateofjs.com) — No es evidencia dura pero sí señal de mercado.
- [Artículo del blog sobre Dokka y Android](/es/blog/blog-android-documentation) — Si quieres usar Pages para documentar una librería Android, no para un blog.
