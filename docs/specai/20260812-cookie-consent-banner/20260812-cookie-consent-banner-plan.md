# Consentimiento de cookies (Consent Mode v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use specai:specai-subagent-driven-development (recommended) or specai:specai-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer cumplir la normativa de cookies (ePrivacy/RGPD/Guía AEPD) en arceapps.github.io implementando Google Consent Mode v2 con banner bilingüe y política de cookies, conservando datos de analytics (reales para aceptantes, modelados para denegantes).

**Architecture:** El consent default (todo `denied`) se declara en un script inline del `<head>` en hilo principal, antes del bloque gtag.js de Partytown; el banner (`CookieBanner.astro`) persiste la elección en `localStorage['cookie-consent']` y actualiza `analytics_storage` vía `window.gtag()` (reenviado al worker por `forward: ["dataLayer.push"]`). Solo `analytics_storage` puede pasar a `granted`; las señales `ad_*` permanecen `denied` siempre. La verificación es empírica (E2E Playwright sobre red/cookies), no TagAssistant.

**Tech Stack:** Astro 5 (estático), Tailwind 4 + DaisyUI, Partytown (@astrojs/partytown 2.1.4), i18n propio (`src/i18n/ui.ts`), Vitest + Playwright (ya instalados).

**Status:** 🟢 BACKLOG

---

## Dependency & Package Validation

No se instala ningún paquete nuevo. `package.json` ya incluye Astro, Tailwind, Vitest, Playwright y @astrojs/partytown. Riesgo de dependencia nueva: **ninguno**.

## Constraints & Guardrails

- **No tocar** `astro.config.mjs` (config partytown `forward` intacta) ni la CSP de `Layout.astro`.
- El stub de gtag **debe** usar `dataLayer.push(arguments)` con el objeto `arguments` nativo — **prohibido** `Array.from(arguments)` (la Consent API de Google ignora el comando y el modo queda desactivado en silencio).
- El consent default debe ejecutarse **antes** de la carga de gtag.js (script main-thread previo al bloque partytown).
- `ad_storage`, `ad_user_data`, `ad_personalization` permanecen `denied` **siempre** (incluso tras aceptar).
- Sin cookies antes de la decisión del usuario; sin casillas pre-marcadas; sin cookie wall.
- Commits por tarea, **solo de los archivos tocados en esa tarea**. Nunca commitear `dist/`, `public/images/` (OG images regeneradas por el prebuild) ni archivos pre-existentes no tocados.
- La rama feature se crea **solo después** de la aprobación del PRD/plan (Gate P2).
- Los documentos specai se commitean en `main` **antes** de crear la rama (los crea el flujo sin rama).
- El idioma de la UI del banner se resuelve con `getLangFromUrl(Astro.url)` + `useTranslations` (patrón del repo).
- Verificación de funcionamiento por **red/cookies reales** (E2E); TagAssistant no sirve con Partytown (one-way proxying).

## Architectural Notes

1. **Flujo de datos** (verificado contra guía real Astro+GTM+Partytown): página carga → `Layout.astro` ejecuta el default (todo denied) en main thread → Partytown carga gtag.js en el worker (recibe el dataLayer reenviado, incluido el default) → `CookieBanner.astro` muestra el banner → el usuario decide → `window.gtag('consent','update',...)` en main thread → `dataLayer.push` → `forward` → worker → gtag.js aplica el estado. El worker tiene su propia copia del dataLayer; el main thread **no ve** los updates (one-way proxying) — por eso la verificación es por red/cookies.
2. **Visitante de retorno:** el script del `<head>` lee `localStorage['cookie-consent']` y hace el `update` inmediatamente después del default; el banner se elimina en `astro:before-swap` y al cargar si ya hay elección.
3. **View Transitions:** el banner se renderiza en cada página (Layout global); el listener `astro:before-swap` evita el parpadeo al navegar.
4. **i18n:** todas las cadenas del banner y del footer van en `src/i18n/ui.ts` (claves `cookie.*`, `footer.cookies`); el contenido de las páginas de política se escribe por idioma en `src/pages/cookies.astro` y `src/pages/es/cookies.astro` (mismo patrón que `privacy-policy.astro`).
5. **Partytown + cookies:** al aceptar, gtag.js (en worker) crea `_ga`/`_gid`; Partytown proxifica `document.cookie` al main thread, así que las cookies son visibles en el navegador y verificables por E2E.

## File map

| Archivo | Responsabilidad | Estado |
|---------|-----------------|--------|
| `src/layouts/Layout.astro` | Consent default (main thread, `<head>`) + render `<CookieBanner />` | Ya implementado (sin commitear) |
| `src/components/CookieBanner.astro` | Banner bilingüe, localStorage, gtag update, View Transitions | Ya implementado (nuevo, sin commitear) |
| `src/i18n/ui.ts` | Claves `cookie.*` y `footer.cookies` (EN+ES) | Ya implementado (sin commitear) |
| `src/pages/cookies.astro` | Política de cookies EN (tabla AEPD) | Ya implementado (nuevo, sin commitear) |
| `src/pages/es/cookies.astro` | Política de cookies ES | Ya implementado (nuevo, sin commitear) |
| `src/components/Footer.astro` | Enlace "Cookies" en sección Legal | Ya implementado (sin commitear) |
| `docs/specai/20260812-cookie-consent-banner/*.md` | Documentos specai del feature | Este conjunto (5 archivos) |
| `src/components/cookie-banner-contract.test.ts` | Contract test del banner (Vitest+jsdom) | Por crear (Task 4) |
| `scripts/e2e-cookie-consent.mjs` | Suite E2E Playwright (verificación por red/cookies) | Por crear (Task 6) |
| `agents/bitácora/bitacora_specai.md` | Bitácora del flujo specai (regla AGENTS.md) | Por crear (Task 7) |

## Delta

> No existe `docs/specai/project/<spec>.md` en este repo (sin specs de nivel sistema). El feature solo cambia comportamiento de feature-level.

### ADDED Requirements
- (no system-level changes)

### MODIFIED Requirements
- (no system-level changes)

### REMOVED Requirements
- (no system-level changes)

## Execution Log

_Living record, updated by the documenter subagent. Do not edit by hand._

<!-- Documenter appends entries here, format:
### [<ISO date> <ISO time>] Task <N>: <title>
**Done:** ...
**Why:** ...
**Outcome:** ✅ success | ❌ failed
**Problems & fixes:** ...
-->
