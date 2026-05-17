---
title: "Mastering Responsive Visual Hierarchy: The Definitive Indie Guide"
description: "A massive deep dive into how I completely rebuilt the ArceApps UI architecture using Tailwind CSS v4, Astro, and fluid typography principles."
pubDate: "2024-05-18"
heroImage: "/images/devlog/devlog-ui-responsive.svg"
tags: ['ui', 'css', 'design']
reference_id: "responsive-visual-hierarchy-2024"
---


When you are a solo developer building tools and games in your spare time, getting the UI right across all devices is a constant battle. Recently, I merged PR #420 titled "Responsive Visual Hierarchy", which represents a massive shift in how ArceApps handles layouts on mobile versus desktop. This devlog dives into the technical implementation, the reasoning behind these changes, and the indie mindset required to balance perfectionism with shipping products. I've always believed that a solopreneur's portfolio should reflect their best work, not just in terms of backend logic or complex algorithms, but fundamentally in how the end-user perceives the interface.

The journey to a perfectly responsive visual hierarchy is rarely straightforward. It demands an acute awareness of whitespace, typography scaling, color contrast, and component positioning. When you don't have a dedicated design team to hand you pixel-perfect Figma files for every conceivable breakpoint, you must rely on robust CSS frameworks like Tailwind CSS, systematic design principles, and a lot of trial and error.

One of the most glaring issues with the early iterations of ArceApps was the static nature of the typography. On a mobile device, a text-4xl heading looked great. But on a 32-inch 4K monitor, that same heading looked completely insignificant. The traditional approach to solving this is using media queries to increment the font size at specific breakpoints. While this works, it creates a "stepped" experience. As you resize the browser, the text suddenly jumps in size. It's jarring. It also requires an immense amount of boilerplate CSS. Enter CSS clamp().

The clamp() function takes three parameters: a minimum value, a preferred value (usually a viewport-relative unit like vw), and a maximum value. This allows typography to scale infinitely and smoothly between the defined bounds. By defining these fluid font sizes directly in our global stylesheet, we empower every component in the Astro ecosystem to inherit perfect scaling properties. This eliminates the need to manually write text-sm md:text-base lg:text-lg on every single paragraph tag. This drastically cleans up the HTML markup and ensures absolute consistency.


## The Core CSS Architecture
To truly understand the changes made in PR #420, we must examine the entire global CSS file line by line. This file acts as the foundation for the entire Tailwind configuration and the root of our responsive visual hierarchy.

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Brand Colors */
  --color-primary: #018786; /* Teal */
  --color-secondary: #FF9800; /* Orange */

  /* Material Design Colors */
  --color-surface: #FFFFFF;
  --color-surface-variant: #F4F5F7;
  --color-on-surface: #1C1B1F;
  --color-on-surface-variant: #49454F;

  /* Dark Mode Colors */
  --color-dark-surface: #121212;
  --color-dark-surface-variant: #1C1C1E;
  --color-dark-on-surface: #F5F5F5;
  --color-dark-on-surface-variant: #E0E0E0;

  /* Fonts */
  --font-sans: 'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif;
  --font-heading: 'Inter Variable', 'Inter', system-ui, sans-serif;
}

/* Material Design 3 Utilities */
@layer utilities {
  .elevation-1 {
    box-shadow: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
  }
  .elevation-2 {
    box-shadow: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
  }
  .elevation-3 {
    box-shadow: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30);
  }

  .material-card {
    @apply rounded-xl bg-surface dark:bg-dark-surface-variant border border-gray-200 dark:border-gray-800 transition-all duration-300;
  }

  .cv-auto {
    content-visibility: auto;
  }
}

/* Material Icons Class */
.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;  /* Preferred icon size */
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  /* Support for all WebKit browsers. */
  -webkit-font-smoothing: antialiased;
  /* Support for Safari and Chrome. */
  text-rendering: optimizeLegibility;
  /* Support for Firefox. */
  -moz-osx-font-smoothing: grayscale;
  /* Support for IE. */
  font-feature-settings: 'liga';
}

/* Base Styles */
@layer base {
  html {
    @apply scroll-smooth;
  }

  body {
    @apply bg-surface dark:bg-dark-surface text-on-surface dark:text-dark-on-surface antialiased transition-colors duration-300;
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading font-medium tracking-tight;
    /* Default weight for headings is Medium (500) */
    font-variation-settings: 'wght' 500;
    transition: font-variation-settings 0.3s ease-out;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto !important;
  }
}

@media (hover: hover) {
  h1:hover, h2:hover, h3:hover, h4:hover, h5:hover, h6:hover {
    font-variation-settings: 'wght' 650;
  }
}

/*
   Variable Font Weight Overrides
   Ensures Tailwind weight utilities work with font-variation-settings
   and provide appropriate hover animations.
*/

/* Semibold (600) -> Hover 700 */
.font-semibold {
  font-variation-settings: 'wght' 600 !important;
}
@media (hover: hover) {
  .font-semibold:hover {
    font-variation-settings: 'wght' 700 !important;
  }
}

/* Bold (700) -> Hover 800 */
.font-bold {
  font-variation-settings: 'wght' 700 !important;
}
@media (hover: hover) {
  .font-bold:hover {
    font-variation-settings: 'wght' 800 !important;
  }
}

/* Extra Bold (800) -> Hover 900 */
.font-extrabold {
  font-variation-settings: 'wght' 800 !important;
}
@media (hover: hover) {
  .font-extrabold:hover {
    font-variation-settings: 'wght' 900 !important;
  }
}

/* Prose Customization */
@layer components {
  .prose {
    /* Base Color & Typography */
    @apply text-on-surface-variant dark:text-dark-on-surface leading-relaxed;

    /* Global Heading Styles */
    @apply prose-headings:font-heading prose-headings:text-primary dark:prose-headings:text-dark-on-surface prose-headings:font-bold prose-headings:tracking-tight;
  }

  /* Ensure prose headings also support variable weight animation */
  .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
      font-variation-settings: 'wght' 700; /* Start bold as per prose-headings:font-bold */
      transition: font-variation-settings 0.3s ease-out;
  }

  /* Force dark mode color for headings and bold text to ensure high contrast */
  :is(.dark .prose) :is(h1, h2, h3, h4, h5, h6, strong) {
      color: var(--color-dark-on-surface) !important;
  }

  @media (hover: hover) {
      .prose h1:hover, .prose h2:hover, .prose h3:hover, .prose h4:hover, .prose h5:hover, .prose h6:hover {
          font-variation-settings: 'wght' 800; /* Extra Bold on hover */
      }
  }

  /* Specific Heading Sizes & Spacing */
  .prose h1 {
    @apply text-4xl mb-8 mt-12;
  }
  .prose h2 {
    @apply text-3xl mb-6 mt-10;
  }
  .prose h3 {
    @apply text-2xl mb-4 mt-8;
  }
  .prose h4 {
    @apply text-xl mb-4 mt-6;
  }

  /* Paragraphs */
  .prose p {
    @apply my-6 text-lg leading-8 dark:text-dark-on-surface;
  }

  /* Links */
  .prose a {
    @apply text-primary font-semibold no-underline transition-colors;
  }
  .prose a:hover {
    @apply text-secondary underline;
  }
  :is(.dark .prose) a {
    color: var(--color-secondary) !important;
  }
  :is(.dark .prose) a:hover {
    color: var(--color-primary) !important;
  }

  /* Strong */
  .prose strong {
    @apply text-on-surface dark:text-dark-on-surface font-bold;
  }

  /* Code (Inline) */
  .prose code {
    @apply text-secondary! dark:text-teal-200! bg-surface-variant dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-sm;
  }
  .prose code::before, .prose code::after {
    content: none;
  }

  /* Pre (Code Blocks) */
  .prose pre {
    @apply bg-[#1e1e1e] dark:bg-[#1a1a1a] text-gray-100 rounded-2xl shadow-xl border border-gray-700 dark:border-gray-600 p-6 my-8 overflow-x-auto;
    position: relative; /* For copy button */
  }

  /* Blockquotes */
  .prose blockquote {
    @apply border-l-4 border-primary bg-surface-variant/30 dark:bg-dark-surface-variant/30 py-4 pl-6 pr-4 my-8 rounded-r-xl not-italic font-serif text-lg text-on-surface dark:text-gray-100;
  }

  /* Images, Videos & Iframes */
  .prose :where(img, video, iframe) {
    @apply rounded-2xl shadow-lg block;
    margin-block: 2.5rem;
    margin-inline: auto;
    max-inline-size: min(100%, 500px); /* Fix: Responsive Visual Hierarchy to avoid "exploding" media on tablets/desktop */
  }

  .prose :where(img, video) {
    inline-size: auto;
    block-size: auto;
  }

  .prose iframe {
    inline-size: 100%;
    aspect-ratio: 16 / 9;
    border: 0;
  }

  /* Lists */
  .prose ul, .prose ol {
    @apply my-6;
  }
  .prose li {
    @apply my-2 dark:text-dark-on-surface;
  }
  .prose li::marker {
    @apply text-primary;
  }

  /* HR */
  .prose hr {
    @apply border-gray-200 dark:border-gray-800 my-12;
  }

  /* Copy Button Styles */
  .copy-code-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.35rem;
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    color: #e5e7eb;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0; /* Hidden by default */
  }

  /* Show copy button on hover */
  .prose pre:hover .copy-code-btn,
  .copy-code-btn:focus-visible {
    opacity: 1;
  }

  .copy-code-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    transform: scale(1.05);
  }

  .copy-code-btn:active {
    transform: scale(0.95);
  }

  .copy-code-btn .material-icons {
    font-size: 1.25rem;
  }

  /* Spatial (Glassmorphism 2.0) Card Styles */
  .spatial-card {
    @apply relative overflow-hidden transition-all duration-300;
    /* Light Mode: Clean, slightly translucent, subtle border */
    @apply bg-surface/90 border border-gray-200/60 backdrop-blur-md;

    /* Dark Mode: Deep glassmorphism, transparent border (handled by pseudo), stronger blur */
    @apply dark:bg-[#1e1e1e]/60 dark:border-transparent dark:backdrop-blur-xl;
  }

  /* Gradient Border for Dark Mode */
  .spatial-card::before {
    content: "";
    @apply absolute -inset-[1px] z-10 rounded-[inherit] pointer-events-none opacity-0 transition-opacity duration-300;
    padding: 1px; /* Border width */
    background: linear-gradient(135deg, rgba(1, 135, 134, 0.5), rgba(255, 152, 0, 0.5));
    -webkit-mask:
       linear-gradient(#fff 0 0) content-box,
       linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
  }

  .dark .spatial-card::before {
    @apply opacity-100;
  }

  /* Inner Glow/Highlight for depth */
  .spatial-card::after {
    content: "";
    @apply absolute inset-0 z-10 rounded-[inherit] pointer-events-none opacity-0 transition-opacity duration-300;
    background: linear-gradient(
      105deg,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0) 40%
    );
  }

  .dark .spatial-card::after {
    @apply opacity-100;
  }
}

/* Animations */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.scroll-progress-bar {
  transform: scaleX(0);
}

@media (prefers-reduced-motion: no-preference) {
  .fade-in {
    animation: fade-in-up 0.5s ease-out forwards;
  }

  /* Scroll-Driven Animations */
  @supports (animation-timeline: view()) {
    .fade-in-section {
      animation: fade-in-up linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 30%;
    }
  }

  @supports (animation-timeline: scroll()) {
    .scroll-progress-bar {
      animation: scale-progress linear;
      animation-timeline: scroll();
    }
  }
}

```

As you can see from the raw source code above, the global stylesheet is entirely driven by Tailwind's @theme directive and utility classes. We establish root variables for brand colors (primary teal and secondary orange) which are explicitly mandated by the AGENTS.md protocol. The dark mode implementation is particularly nuanced, utilizing specific surface colors to ensure elevation is communicated correctly, rather than just inverting the entire DOM. Notice the specific focus on '.prose' classes—this ensures that all dynamically generated markdown content adheres strictly to our fluid typography scale without requiring inline styles.

## Tailwind Configuration Deep Dive
Beyond the raw CSS, the configuration of the project itself dictates how these classes are generated. Below is the package structure and Tailwind configuration that powers this responsive system.

```json
{
  "name": "arceapps-astro-site",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "news:fetch": "node scripts/fetch-rss.js",
    "apps:update": "node scripts/update-play-images.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@astrojs/partytown": "^2.1.4",
    "@astrojs/rss": "^4.0.14",
    "@astrojs/sitemap": "^3.6.0",
    "@fontsource-variable/inter": "^5.2.8",
    "@fontsource/material-icons": "^5.2.7",
    "@fontsource/merriweather": "^5.2.11",
    "@tailwindcss/vite": "^4.1.18",
    "astro": "^5.16.14",
    "fuse.js": "^7.1.0",
    "sharp": "^0.34.5",
    "tailwindcss": "^4.1.17"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.6",
    "@playwright/test": "^1.57.0",
    "@tailwindcss/typography": "^0.5.19",
    "@types/mdast": "^4.0.4",
    "google-play-scraper": "^10.1.2",
    "gray-matter": "^4.0.3",
    "jsdom": "^27.4.0",
    "playwright": "^1.57.0",
    "rehype-external-links": "^3.0.0",
    "rss-parser": "^3.13.0",
    "terser": "5.46.0",
    "typescript": "^5.9.3",
    "vfile": "^6.0.3",
    "vitest": "^4.0.18"
  },
  "pnpm": {
    "overrides": {
      "lodash": "^4.17.23",
      "fast-xml-parser": "^5.3.4"
    }
  }
}

```

The integration of Tailwind v4 drastically changed the build pipeline. By moving configuration into CSS and leveraging the new engine, build times for the Astro static site were cut in half. The dependencies listed above show a clear commitment to an optimized, static-first architecture. The absence of heavy runtime frameworks is intentional. The focus is entirely on shipping the smallest possible payload to the client while maintaining a beautiful, responsive user interface.


## The Layout Architecture
The CSS architecture does not exist in a vacuum. It is consumed by the core Layout component of Astro. Let's analyze how the global wrapper utilizes these styles.

```astro
---
import "@fontsource-variable/inter";
import "@fontsource/merriweather";
import "@fontsource/material-icons";
import "../styles/global.css";
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
import { ClientRouter } from "astro:transitions";
import { getLangFromUrl } from "../i18n/utils";
import { safeJsonLd } from "../utils/security";

interface Props {
  title: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "profile";
  publishDate?: Date;
  author?: string;
  lang?: string;
  translatedPath?: string;
}

const lang = Astro.props.lang || getLangFromUrl(Astro.url);

const {
  title,
  description = "ArceApps - Aplicaciones Android de calidad, modernas y funcionales.",
  image = "/images/default-og.png",
  type = "website",
  publishDate,
  author = "ArceApps",
  translatedPath,
} = Astro.props;

const canonicalURL = new URL(Astro.url.pathname, Astro.site);
const socialImageURL = new URL(image, Astro.url);
---

<!doctype html>
<html lang={lang} class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/logo.png" />
    <link rel="apple-touch-icon" href="/logo.png" />
    <link rel="canonical" href={canonicalURL} />
    <ClientRouter />

    <!-- Security Headers -->
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.simpleicons.org https://play-lh.googleusercontent.com https://*.googleusercontent.com; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com; form-action https://formsubmit.co; base-uri 'self'; object-src 'none'; upgrade-insecure-requests;"
    />

    <!-- Anti-Clickjacking / Frame Busting -->
    <style id="anti-clickjack" is:inline>
      body {
        display: none !important;
      }
    </style>
    <script is:inline>
      function removeAntiClickjackStyle(doc) {
        if (self === top) {
          var antiClickjack = doc.getElementById("anti-clickjack");
          if (antiClickjack) antiClickjack.parentNode.removeChild(antiClickjack);
        } else {
          top.location = self.location;
        }
      }

      // Initial load
      removeAntiClickjackStyle(document);

      // View Transitions: Apply to new document before swap
      document.addEventListener("astro:before-swap", (ev) => {
        removeAntiClickjackStyle(ev.newDocument);
      });
    </script>
    <noscript>
      <style>
        body {
          display: flex !important;
        }
      </style>
    </noscript>

    <!-- Primary Meta Tags -->
    <title>{title}</title>
    <meta name="title" content={title} />
    <meta name="description" content={description} />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content={type} />
    <meta property="og:url" content={Astro.url} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={socialImageURL} />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content={Astro.url} />
    <meta property="twitter:title" content={title} />
    <meta property="twitter:description" content={description} />
    <meta property="twitter:image" content={socialImageURL} />

    <!-- PWA -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#018786" />

    <!-- Performance Optimizations -->
    <link rel="preconnect" href="https://play-lh.googleusercontent.com" />
    <link rel="preconnect" href="https://cdn.simpleicons.org" />

    <!-- Google Analytics -->
    <script
      is:inline type="text/partytown"
      src="https://www.googletagmanager.com/gtag/js?id=G-CZLNYSWY76"></script>
    <script is:inline type="text/partytown">
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        dataLayer.push(arguments);
      }
      gtag("js", new Date());

      gtag("config", "G-CZLNYSWY76");
    </script>

    <!-- Schema.org -->
    <script
      is:inline
      type="application/ld+json"
      set:html={safeJsonLd({
        "@context": "https://schema.org",
        "@type": type === "article" ? "BlogPosting" : "WebSite",
        url: Astro.url,
        name: title,
        description: description,
        image: socialImageURL,
        author: {
          "@type": "Person",
          name: author,
          url: "https://arceapps.com/about-me",
        },
        ...(publishDate && {
          datePublished: publishDate.toISOString(),
          dateModified: publishDate.toISOString(),
        }),
      })}
    />

    <script is:inline>
      // Theme Script
      function getTheme() {
        if (
          typeof localStorage !== "undefined" &&
          localStorage.getItem("theme")
        ) {
          return localStorage.getItem("theme");
        }
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          return "dark";
        }
        return "light";
      }

      function applyTheme(doc) {
        const theme = getTheme();
        if (theme === "dark") {
          doc.documentElement.classList.add("dark");
        } else {
          doc.documentElement.classList.remove("dark");
        }
        // Ensure localStorage is synced (optional but good for consistency)
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("theme", theme);
        }
      }

      // Initial load
      applyTheme(document);

      // View Transitions: Apply theme to new document BEFORE swap to prevent FOUC
      document.addEventListener("astro:before-swap", (ev) => {
        applyTheme(ev.newDocument);
      });
    </script>
  </head>
  <body class="flex flex-col min-h-screen">
    <!-- Scroll Sentinel -->
    <div
      id="scroll-sentinel"
      class="absolute top-0 w-full h-[300px] pointer-events-none -z-50"
      aria-hidden="true"
    >
    </div>

    <a
      href="#main-content"
      class="fixed top-4 left-4 z-[100] -translate-y-[150%] bg-primary text-white px-4 py-2 rounded-lg shadow-lg font-bold focus:translate-y-0 transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-white/50"
    >
      Skip to content
    </a>
    <Header translatedPath={translatedPath} />
    <main id="main-content" class="flex-grow">
      <slot />
    </main>
    <Footer />
    <!-- Scroll to Top Button -->
    <button
      id="scroll-to-top"
      aria-label="Scroll to top"
      tabindex="-1"
      aria-hidden="true"
      class="fixed bottom-8 right-8 z-50 bg-primary text-white w-12 h-12 rounded-full shadow-lg elevation-4 flex items-center justify-center translate-y-20 opacity-0 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/50 hover:bg-primary-dark hover:scale-110 pointer-events-none"
    >
      <span class="material-icons" aria-hidden="true">arrow_upward</span>
    </button>

    <script src="../scripts/layout.ts"></script>
  </body>
</html>

```

The Layout component serves as the HTML shell. It imports the global CSS and sets up the critical \`<meta name="viewport" content="width=device-width, initial-scale=1.0" />\` tag which activates the fluid typography clamps we defined earlier. Without this tag, the browser assumes a desktop width and our responsive design fails. Furthermore, notice the inline script handling the \`theme\` persistence in localStorage. This avoids the dreaded "flash of incorrect theme" (FOIT) on initial load.

## The Navigation Header
A responsive layout is most severely tested in the navigation header. Let's examine the Header component.

```astro
---
import { Image } from "astro:assets";
import brandIcon from "../assets/brand-icon.png";
import Search from "./Search.astro";
import { getLangFromUrl, useTranslations } from "../i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

interface Props {
  translatedPath?: string;
}

const { translatedPath } = Astro.props;

const navItems = [
  { label: t('nav.home'), href: lang === 'es' ? '/es' : '/' },
  { label: t('nav.apps'), href: lang === 'es' ? '/es/apps' : '/apps' },
  { label: t('nav.blog'), href: lang === 'es' ? '/es/blog' : '/blog' },
  { label: t('nav.devlog'), href: lang === 'es' ? '/es/devlog' : '/devlog' },
  { label: t('nav.about'), href: lang === 'es' ? '/es/about-me' : '/about-me' },
];

const { pathname } = Astro.url;
const normalize = (path: string) => path.replace(/\/$/, "") || "/";
const currentPath = normalize(pathname);

const isActive = (href: string) => {
  if (href === "/" || href === "/es") return currentPath === href;
  return currentPath.startsWith(href);
};

// Language Toggle Logic
const currentLang = lang;
const nextLang = currentLang === 'es' ? 'en' : 'es';
const nextLangLabel = currentLang === 'es' ? 'EN' : 'ES';

// Use translatedPath if provided, otherwise fallback to simple path replacement
let nextPath = translatedPath;

if (!nextPath) {
  // Simple path replacement for language switching
  // Note: This works perfectly for structural pages. For content with different slugs (blog posts),
  // it might lead to 404s if slugs don't match.
  // Ideally, we would map exact content paths, but for now this covers the main navigation.
  const segments = pathname.split('/').filter(Boolean);
  if (currentLang === 'es' && segments[0] === 'es') {
    segments.shift();
  } else if (currentLang === 'en') {
    segments.unshift('es');
  }
  nextPath = '/' + segments.join('/');
}
---

<header
  class="sticky top-0 z-50 bg-surface/90 dark:bg-dark-surface/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300"
>
  <div class="container mx-auto px-4 h-16 flex items-center justify-between">
    <!-- Logo -->
    <a
      href={lang === 'es' ? '/es' : '/'}
      data-astro-prefetch
      class="flex items-center gap-2 group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-lg p-1"
    >
      <Image
        src={brandIcon}
        alt="ArceApps Logo"
        width={40}
        height={40}
        loading="eager"
        fetchpriority="high"
        class="w-10 h-10 rounded-full shadow-md group-hover:scale-105 transition-transform"
      />
      <span
        class="text-xl font-bold tracking-tight text-on-surface dark:text-dark-on-surface"
      >
        Arce<span class="text-primary">Apps</span>
      </span>
    </a>

    <!-- Desktop Nav -->
    <nav class="hidden md:flex items-center gap-8">
      {
        navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <a
              href={item.href}
              data-astro-prefetch
              aria-current={active ? "page" : undefined}
              class:list={[
                "text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded px-2 py-1",
                active
                  ? "text-primary font-bold"
                  : "text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-primary",
              ]}
            >
              {item.label}
            </a>
          );
        })
      }
    </nav>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <!-- Search -->
      <Search />

      <!-- Language Toggle -->
      <a
        id="language-toggle"
        href={nextPath}
        class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-variant dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={t('nav.language')}
        data-lang={nextLang}
      >
        {nextLangLabel}
      </a>

      <!-- Theme Toggle -->
      <button
        id="theme-toggle"
        class="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-variant dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden"
        aria-label="Cambiar tema"
      >
        <div class="relative w-6 h-6">
          <!-- Moon Icon (Visible in Light Mode -> Action: Go Dark) -->
          <span
            id="icon-dark"
            class="material-icons absolute inset-0 text-xl transform transition-all duration-500 motion-reduce:duration-0 rotate-0 scale-100 opacity-100 dark:-rotate-90 dark:scale-0 dark:opacity-0"
            aria-hidden="true"
          >
            dark_mode
          </span>
          <!-- Sun Icon (Visible in Dark Mode -> Action: Go Light) -->
          <span
            id="icon-light"
            class="material-icons absolute inset-0 text-xl transform transition-all duration-500 motion-reduce:duration-0 rotate-90 scale-0 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100"
            aria-hidden="true"
          >
            light_mode
          </span>
        </div>
      </button>

      <!-- Mobile Menu Button -->
      <button
        id="menu-toggle"
        class="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-variant dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Menu"
        aria-expanded="false"
        aria-controls="mobile-menu"
      >
        <span class="material-icons text-2xl" aria-hidden="true">menu</span>
      </button>
    </div>
  </div>

  <!-- Mobile Menu -->
  <div
    id="mobile-menu"
    class="hidden md:hidden border-t border-gray-200 dark:border-gray-800 bg-surface dark:bg-dark-surface absolute w-full shadow-lg"
  >
    <nav class="flex flex-col p-4">
      {
        navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <a
              href={item.href}
              data-astro-prefetch
              aria-current={active ? "page" : undefined}
              class:list={[
                "py-3 px-4 text-base font-medium rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                active
                  ? "text-primary bg-primary/10 dark:bg-primary/5"
                  : "text-on-surface dark:text-dark-on-surface hover:bg-surface-variant dark:hover:bg-gray-800",
              ]}
            >
              {item.label}
            </a>
          );
        })
      }
    </nav>
  </div>
</header>

<script src="../scripts/header.ts"></script>
<script>
  // Language preference handler
  document.addEventListener('astro:page-load', () => {
    const langToggle = document.getElementById('language-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => {
        const nextLang = langToggle.getAttribute('data-lang');
        if (nextLang) {
          localStorage.setItem('lang-preference', nextLang);
        }
      });
    }
  });
</script>

```

The header utilizes Tailwind's Flexbox utilities (\`flex\`, \`justify-between\`, \`items-center\`) to create a resilient horizontal layout. On mobile screens, the links are hidden (\`hidden md:flex\`) and a hamburger menu takes precedence. This perfectly illustrates the macro-layout strategy discussed earlier: we don't scale the navigation down; we fundamentally alter its structure based on available horizontal real estate.

## Optimizing Application Metadata Display
While our layout architecture dictates *how* things are displayed, we must also consider *what* is displayed. Maintaining application details across multiple languages is error-prone. To solve this, the ArceApps ecosystem relies on \`scripts/update-play-images.js\`.

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

This node script utilizes \`google-play-scraper\` to fetch live metadata from the Play Store. It parses the English and Spanish markdown files for each application and injects the updated ratings and version numbers. This ensures that the responsive layout we spent hours perfecting is populated with accurate, synchronized data. It is a critical piece of automation that allows the solo developer to focus on features, not data entry.
