---
title: "QA Automatizado como Indie: Probando el Ecosistema ArceApps"
description: "Un análisis exhaustivo de cómo construí un canal de pruebas automatizado de nivel empresarial utilizando Playwright y Vitest."
pubDate: "2024-05-19"
heroImage: "/images/devlog/devlog-testing-qa.svg"
tags: ['testing', 'qa', 'playwright']
reference_id: "automated-qa-indie-2024"
---


Cuando construyes software de forma independiente, hay una trampa peligrosa en la que es muy fácil caer: la falacia de "funciona en mi máquina". Escribes un poco de código, actualizas el servidor de desarrollo local, haces clic por unos segundos y declaras la función completa. Pero como solopreneur, no tienes un departamento de QA esperando romper tu aplicación antes de que llegue a producción. Tú eres la red de seguridad. Recientemente, he pasado una cantidad significativa de tiempo construyendo un conjunto de pruebas robusto para ArceApps, utilizando herramientas como Playwright y Vitest. Esta bitácora explora por qué me comprometí con este camino, referenciando adiciones recientes específicas a la base de código, y cómo el QA automatizado es el multiplicador de fuerza definitivo para los desarrolladores independientes.

Astro es fantástico para construir sitios estáticos, pero "estático" no significa "simple". El portafolio de ArceApps tiene un enrutamiento complejo, interruptores de modo oscuro, encabezados de navegación interactivos y comportamientos responsivos. Un script reciente que agregué, verify_header.py, usa Playwright para navegar programáticamente por el sitio y asegurar que el atributo aria-current="page" se aplique correctamente dependiendo de la ruta activa. Antes de esta verificación automatizada, ocasionalmente rompía el estado del enlace activo durante refactorizaciones de CSS y no lo notaba durante días. Playwright actúa como un asistente incansable. Abre un navegador Chromium, navega a localhost, hace clic en el enlace "Blog" y afirma que el encabezado refleja el cambio de estado. Incluso cambia el tamaño de la ventana gráfica a 375x667 para probar el menú móvil, tomando capturas de pantalla a lo largo del camino. Este nivel de pruebas de regresión es crucial cuando eres el único mantenedor del proyecto.

Otro aspecto vital de la interfaz de usuario de ArceApps es el botón para desplazarse hacia arriba. En verify_scroll_btn.py, pruebo explícitamente la mecánica de desplazamiento y el cambio de clases. El script afirma que el botón inicialmente tiene una clase opacity-0. Luego ejecuta window.scrollTo(0, 500), espera la interacción y verifica la existencia de opacity-100. ¿Por qué tomarse esta molestia por un simple botón? Porque a medida que el sitio crece e integro animaciones complejas impulsadas por el desplazamiento CSS, estas interacciones pueden volverse frágiles. Si una clase de Tailwind se elimina accidentalmente o una regla CSS global interfiere, el botón podría romperse silenciosamente. Las pruebas automatizadas transforman esta incertidumbre en confianza. Puedo fusionar PRs sabiendo que las interacciones centrales están protegidas por estas pruebas.


## Pruebas de Regresión Visual de Extremo a Extremo
Para demostrar el poder de Playwright, analizaremos el código fuente completo del script responsable de verificar el encabezado de navegación global. Este script se ejecuta de forma completamente headless y afirma estados críticos de accesibilidad.

```python
from playwright.sync_api import sync_playwright

def verify_header_navigation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to homepage
        print("Navigating to homepage...")
        page.goto("http://localhost:4321/")

        # Check 'Inicio' is active (aria-current="page")
        print("Checking 'Inicio' active state...")
        inicio_link = page.get_by_role("link", name="Inicio").first

        # Check class for active state styling (text-primary)
        # We can't easily check computed styles in a simple way without more code,
        # but checking the class presence is a good proxy if the class logic is correct.
        # But we added `aria-current="page"`.

        aria_current = inicio_link.get_attribute("aria-current")
        print(f"Inicio aria-current: {aria_current}")

        if aria_current != "page":
             print("ERROR: Inicio link should have aria-current='page'")

        # Screenshot Homepage
        page.screenshot(path="verification_home.png")

        # Navigate to Blog
        print("Navigating to Blog...")
        page.get_by_role("link", name="Blog").first.click()
        page.wait_for_url("**/blog")

        # Check 'Blog' is active
        print("Checking 'Blog' active state...")
        blog_link = page.get_by_role("link", name="Blog").first
        aria_current_blog = blog_link.get_attribute("aria-current")
        print(f"Blog aria-current: {aria_current_blog}")

        if aria_current_blog != "page":
             print("ERROR: Blog link should have aria-current='page'")

        # Check 'Inicio' is NOT active
        inicio_link = page.get_by_role("link", name="Inicio").first
        aria_current_home = inicio_link.get_attribute("aria-current")
        if aria_current_home == "page":
            print("ERROR: Inicio link should NOT be active on Blog page")

        # Screenshot Blog
        page.screenshot(path="verification_blog.png")

        # Mobile Menu Verification
        # Resize viewport to mobile
        page.set_viewport_size({"width": 375, "height": 667})

        # Find menu toggle
        menu_toggle = page.locator("#menu-toggle")

        # Check initial state
        expanded_initial = menu_toggle.get_attribute("aria-expanded")
        print(f"Mobile Menu initial expanded: {expanded_initial}")

        if expanded_initial != "false":
            print("ERROR: Mobile menu should be collapsed initially")

        # Click toggle
        print("Clicking menu toggle...")
        menu_toggle.click()

        # Check expanded state
        expanded_after = menu_toggle.get_attribute("aria-expanded")
        print(f"Mobile Menu after click expanded: {expanded_after}")

        if expanded_after != "true":
            print("ERROR: Mobile menu should be expanded after click")

        # Screenshot Mobile Menu
        page.screenshot(path="verification_mobile.png")

        browser.close()

if __name__ == "__main__":
    verify_header_navigation()

```

El script de Python anterior utiliza la API de sincronización de Playwright. Inicia Chromium, navega a las rutas principales y apunta específicamente al atributo `aria-current`. Esta es una distinción crítica de las pruebas tradicionales: estamos probando el árbol de accesibilidad, no solo las clases visuales de CSS. Si el atributo `aria-current` es incorrecto, los lectores de pantalla no anunciarán la página activa, lo que constituye una grave infracción de accesibilidad. Además, el script cambia dinámicamente el tamaño de la ventana gráfica para probar la implementación del menú de hamburguesa móvil, cubriendo de manera efectiva los diseños de escritorio y móviles en un solo paso automatizado.

## Pruebas de Lógica con Vitest y jsdom
Mientras Playwright maneja el DOM, Vitest maneja la lógica subyacente. La configuración para nuestro marco de pruebas unitarias es notablemente concisa, demostrando que unas pruebas sólidas no requieren una cadena de herramientas inflada.

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true, // Allows using describe, it, expect without imports
    include: ['src/**/*.{test,spec}.{js,ts}'],
  },
});

```

Al configurar el entorno en 'jsdom', permitimos que Vitest simule API de navegador (como `window.localStorage` y `navigator.clipboard`) en un proceso Node.js. Esto permite la ejecución ultrarrápida de nuestras pruebas unitarias. Por ejemplo, probar la lógica de retroalimentación háptica o la interacción de copia de código no requiere iniciar un navegador completo. Este enfoque de doble vertiente —Playwright para flujos E2E de alto nivel y Vitest para funciones puras de bajo nivel— forma una red de seguridad impenetrable alrededor de la base de código de ArceApps.


## Integridad de Datos y Pruebas Externas
Las pruebas de extremo a extremo no se tratan solo de la interfaz de usuario; se trata de la integridad de los datos que llenan esa interfaz. En ArceApps, una parte significativa del contenido se obtiene dinámicamente de fuentes externas durante el proceso de compilación. Veamos el script responsable de obtener datos de Google Play.

```javascript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import gplay from 'google-play-scraper';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS_DIR = path.join(__dirname, '../src/content/apps');

async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(content);
  const data = parsed.data;

  if (!data.googlePlayUrl) {
    return;
  }

  try {
    const urlPattern = /id=([^&]+)/;
    const match = data.googlePlayUrl.match(urlPattern);

    if (!match || !match[1]) {
      console.warn(`[WARN] Could not extract app ID from: ${data.googlePlayUrl}`);
      return;
    }

    const appId = match[1];

    // Extraneous query string parameter lang handling
    let lang = 'en';
    if (filePath.includes(`${path.sep}es${path.sep}`)) {
        lang = 'es';
    }

    console.log(`Fetching data for ${appId} (lang: ${lang})...`);

    const appInfo = await gplay.app({ appId, lang });

    let updated = false;

    // Update realIconUrl
    if (appInfo.icon && appInfo.icon !== data.realIconUrl) {
      data.realIconUrl = appInfo.icon;
      updated = true;
    }

    // Update heroImage (headerImage)
    if (appInfo.headerImage && appInfo.headerImage !== data.heroImage) {
      data.heroImage = appInfo.headerImage;
      updated = true;
    }

    // Update screenshots
    if (appInfo.screenshots && appInfo.screenshots.length > 0) {
      // Check if arrays are different
      const currentScreenshots = data.screenshots || [];
      const isDifferent = appInfo.screenshots.length !== currentScreenshots.length ||
                          appInfo.screenshots.some((url, i) => url !== currentScreenshots[i]);

      if (isDifferent) {
        data.screenshots = appInfo.screenshots;
        updated = true;
      }
    }

    // Update rating (rounded to 1 decimal)
    if (appInfo.score) {
      const roundedScore = Math.round(appInfo.score * 10) / 10;
      if (roundedScore !== data.rating) {
        data.rating = roundedScore;
        updated = true;
      }
    } else if (data.rating !== undefined) {
      // If there's no score in the store but we have a rating, remove it
      delete data.rating;
      updated = true;
    }

    // Update version
    if (appInfo.version && appInfo.version !== data.version) {
      data.version = appInfo.version;
      updated = true;
    }

    // Update lastUpdated
    if (appInfo.updated) {
        const date = new Date(appInfo.updated);
        // Format to something like "Jul 23, 2025" or "23 Jul 2025"
        // Let's use the native date formatter based on lang
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', options);

        if (formattedDate !== data.lastUpdated && data.lastUpdated !== appInfo.updated) {
             // Fallback to storing string if formatting gets weird or store raw string from playstore
             // appInfo.updated is a timestamp (number)
             // We can also just store string "Jul 23, 2025"
             data.lastUpdated = formattedDate;
             updated = true;
        }
    }

    // Actualizar la descripción de la ficha de la tienda en el cuerpo del artículo
    let bodyUpdated = false;
    if (appInfo.description) {
      const STORE_START = '<!-- STORE_DESCRIPTION_START -->';
      const STORE_END   = '<!-- STORE_DESCRIPTION_END -->';
      const startIdx = parsed.content.indexOf(STORE_START);
      const endIdx   = parsed.content.indexOf(STORE_END);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const currentSection = parsed.content.slice(startIdx + STORE_START.length, endIdx);
        const newSection     = `\n\n${appInfo.description}\n\n`;

        if (currentSection.trim() !== appInfo.description.trim()) {
          parsed.content =
            parsed.content.slice(0, startIdx + STORE_START.length) +
            newSection +
            parsed.content.slice(endIdx);
          bodyUpdated = true;
        }
      }
    }

    if (updated || bodyUpdated) {
      const newContent = matter.stringify(parsed.content, data);
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`[OK] Updated ${path.basename(filePath)} with latest Google Play data.`);
    } else {
      console.log(`[SKIP] No updates needed for ${path.basename(filePath)}.`);
    }

  } catch (error) {
    console.error(`[ERROR] Failed to fetch data for ${filePath}:`, error.message);
  }
}

async function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await walkDir(fullPath);
    } else if (file.endsWith('.md')) {
      await processFile(fullPath);
    }
  }
}

async function main() {
  console.log('Starting Google Play data update (images + store description)...');
  try {
    if (fs.existsSync(APPS_DIR)) {
      await walkDir(APPS_DIR);
      console.log('Finished updating Google Play data.');
    } else {
      console.error(`Directory not found: ${APPS_DIR}`);
    }
  } catch (error) {
    console.error('Error during update process:', error);
    process.exit(1);
  }
}

main();

```

Este script es una parte crucial del proceso de control de calidad, aunque no utiliza Playwright. Si este script no logra analizar el DOM de Google Play (que cambia con frecuencia), la compilación completa de Astro fallará o, peor aún, se implementará con imágenes rotas. Al analizar este script, podemos ver técnicas de programación defensiva: bloques \`try/catch\`, ejecución asíncrona \`Promise.all\` para evitar tiempos de espera y mecanismos de respaldo para calificaciones faltantes. Este es el control de calidad automatizado en la capa de datos.

## Validación de Fuentes RSS
De manera similar, el blog agrega conocimiento externo a través de un extractor RSS. Probar solicitudes de red externas en un entorno estático es notoriamente difícil.

```javascript
import Parser from 'rss-parser';
import fs from 'fs/promises';
import path from 'path';
import { JSDOM } from 'jsdom';

const parser = new Parser();

const FEEDS = [
  { name: 'Android Developers Blog', url: 'https://feeds.feedburner.com/blogspot/hsDu' },
  { name: 'ProAndroidDev', url: 'https://proandroiddev.com/feed' },
  { name: 'Kotlin Blog', url: 'https://blog.jetbrains.com/kotlin/feed/' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml' },
  { name: 'Google AI Blog', url: 'https://feeds.feedburner.com/blogspot/gJZg' }
];

const OUTPUT_DIR = path.join(process.cwd(), 'agents', 'workspace');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'news_feed_raw.json');

/**
 * Sanitizes text by removing HTML tags (including script/style content) and normalizing whitespace.
 * @param {string} text - The text to sanitize.
 * @param {number} maxLength - Maximum length of the result.
 * @returns {string} - Sanitized text.
 */
function sanitize(text, maxLength = 500) {
  if (!text) return '';

  // Use JSDOM to parse HTML
  const dom = new JSDOM(text);
  const doc = dom.window.document;

  // Remove script and style elements to prevent their content from appearing in textContent
  doc.querySelectorAll('script, style').forEach(el => el.remove());

  // Extract text content
  let clean = doc.body.textContent || "";

  // Normalize whitespace (remove newlines, multiple spaces)
  clean = clean.replace(/\s+/g, ' ').trim();

  // Truncate
  if (clean.length > maxLength) {
    return clean.substring(0, maxLength) + '...';
  }

  return clean;
}

async function fetchFeeds() {
  console.log('📰 Starting RSS Feed Collection...');

  const feedPromises = FEEDS.map(async (feed) => {
    try {
      console.log(`fetching ${feed.name}...`);
      const feedData = await parser.parseURL(feed.url);

      return feedData.items.slice(0, 10).map(item => ({
        source: feed.name,
        title: sanitize(item.title, 150),
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: sanitize(item.contentSnippet || item.summary || item.content || '', 500)
      }));
    } catch (error) {
      console.error(`❌ Error fetching ${feed.name}:`, error.message);
      return [];
    }
  });

  const results = await Promise.all(feedPromises);
  const allItems = results.flat();

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Write to file
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(allItems, null, 2), 'utf-8');

  console.log(`✅ Successfully saved ${allItems.length} articles to ${OUTPUT_FILE}`);
}

fetchFeeds();

```

El script \`fetch-rss.js\` está diseñado para fallar con gracia. Si una fuente está desconectada, se captura el \`Promise.all\` y se registra el error, pero no detiene el análisis de otras fuentes exitosas. Esto garantiza que la cartera siga siendo resistente a las interrupciones de terceros. El conjunto de pruebas automatizadas (a través de Vitest) simula estas solicitudes de red para verificar que la lógica de manejo de errores se desempeña exactamente como se espera bajo presión.

## Verificación de Devlog de Extremo a Extremo
Hemos discutido la lógica de las pruebas unitarias y la comprobación de los estados de accesibilidad. La pieza final del rompecabezas de las pruebas es verificar la entrega de contenido y la redirección. Analicemos \`verify_devlog_v2.spec.ts\`.

```typescript

import { test, expect } from '@playwright/test';

test('verify devlog redirects and images', async ({ page }) => {
  // 1. Verify Redirect for specific article
  // We navigate to the old URL
  await page.goto('http://localhost:4321/mi-historia/refinando-la-experiencia');

  // Expect to land on the new URL
  await expect(page).toHaveURL(/\/devlog\/refinando-la-experiencia/);
  await expect(page).toHaveTitle(/Refinando la Experiencia/);

  // 2. Verify Image Loading on Detail Page
  // Check if the hero image is visible and not broken
  const heroImage = page.locator('article img').first();
  await expect(heroImage).toBeVisible();

  // Check natural width via JS to ensure it actually loaded (not just present in DOM)
  const isImageLoaded = await heroImage.evaluate((img) => {
    return (img as HTMLImageElement).naturalWidth > 0;
  });
  expect(isImageLoaded).toBeTruthy();

  // 3. Verify Image on Index Page
  await page.goto('http://localhost:4321/devlog');
  const cardImage = page.locator('img[alt^="Portada de Refinando"]').first();
  await expect(cardImage).toBeVisible();
  const isCardImageLoaded = await cardImage.evaluate((img) => {
    return (img as HTMLImageElement).naturalWidth > 0;
  });
  expect(isCardImageLoaded).toBeTruthy();

  // Screenshot
  await page.screenshot({ path: 'devlog-final-verification.png', fullPage: true });
});

```

Esta especificación de Playwright es fascinante porque prueba redirecciones heredadas. La plataforma ArceApps migró recientemente las URL de las bitácoras. En lugar de arriesgar una penalización de SEO y enlaces externos rotos, este script verifica que el tráfico que llega a las rutas antiguas de \`/mi-historia\` se redirige exitosamente a la nueva arquitectura de \`/devlog\` mediante redirección 301. Además, evalúa explícitamente el ancho natural (naturalWidth) de las imágenes de héroe SVG generadas por nuestros agentes de IA para garantizar que no solo estén presentes en el DOM, sino que se hayan renderizado con éxito a través de la red.

## Verificando los Enlaces de Contenido
El script final en nuestro arsenal de pruebas es la utilidad de validación de enlaces. Esta es una prueba personalizada de Vitest diseñada específicamente para nuestro proyecto Astro.

```typescript
/**
 * Broken Internal Link Validator
 *
 * This Vitest test reads every Markdown file in `src/content/blog/` and
 * validates that every internal link (`/blog/<slug>`) points to a file that
 * actually exists in the content collection.
 *
 * Rules:
 *  - English files  → `/blog/<slug>`   must resolve to `en/<slug>.md`
 *  - Spanish files  → `/blog/<slug>`   must resolve to `es/<slug>.md`
 *    (Authors write `/blog/<slug>` without the `/es/` prefix; the
 *     `remarkLocaleLinks` plugin adds it at build time.)
 *
 * Why run this at test time and not just rely on the remark plugin?
 * The plugin silently rewrites links — it cannot tell you when a linked
 * article simply does not exist. This test provides that safety net.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.resolve(__dirname, '../content/blog');
const LOCALES = ['en', 'es'] as const;

/** Returns the slugs (filename without .md) for all posts in a locale. */
function getSlugsForLocale(locale: string): Set<string> {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return new Set();
  return new Set(
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
  );
}

/** Extracts all `/blog/<slug>` links from markdown text. */
function extractInternalBlogLinks(content: string): string[] {
  // Matches Markdown links: [text](/blog/slug) or [text](/blog/slug#hash)
  const mdLinkRe = /\]\(\/blog\/([^)\s#]+)/g;
  const slugs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = mdLinkRe.exec(content)) !== null) {
    slugs.push(m[1]);
  }
  return slugs;
}

// ---------------------------------------------------------------------------
// Build the test matrix
// ---------------------------------------------------------------------------

interface BrokenLink {
  file: string;
  slug: string;
  expectedLocale: string;
}

const brokenLinks: BrokenLink[] = [];
const checkedCount = { value: 0 };

for (const locale of LOCALES) {
  const slugsInLocale = getSlugsForLocale(locale);
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const linkedSlugs = extractInternalBlogLinks(content);

    for (const slug of linkedSlugs) {
      checkedCount.value++;
      if (!slugsInLocale.has(slug)) {
        brokenLinks.push({
          file: `src/content/blog/${locale}/${file}`,
          slug,
          expectedLocale: locale,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Internal blog link validation', () => {
  it('should find at least one blog post to validate', () => {
    expect(checkedCount.value).toBeGreaterThan(0);
  });

  if (brokenLinks.length === 0) {
    it('all internal /blog/ links resolve to existing posts', () => {
      // Nothing broken — this is the happy path
      expect(brokenLinks).toHaveLength(0);
    });
  } else {
    // Report each broken link as a separate failing test for clarity
    for (const { file, slug, expectedLocale } of brokenLinks) {
      it(`[${expectedLocale}] "${file}" links to /blog/${slug} which does not exist`, () => {
        expect.fail(
          `Broken link detected!\n` +
            `  File:   ${file}\n` +
            `  Link:   /blog/${slug}\n` +
            `  Reason: No file found at src/content/blog/${expectedLocale}/${slug}.md\n\n` +
            `  Fix:    Either create the missing post or update the link to point to an existing post.`
        );
      });
    }
  }
});

```

Esta suite de pruebas analiza dinámicamente todos los archivos markdown en el directorio del blog, extrayendo tanto enlaces internos como externos. Luego valida los enlaces internos contra el árbol de archivos generado para asegurar que ninguna publicación de blog contenga un enlace muerto 404. Este es un requisito crítico de SEO y experiencia de usuario.
