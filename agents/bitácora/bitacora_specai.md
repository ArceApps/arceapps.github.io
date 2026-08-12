# Bitácora SpecAI

## [2026-08-12] 20260812-cookie-consent-banner

**Feature:** Consentimiento de cookies (Consent Mode v2) en arceapps.github.io

**Contexto:** La web cargaba Google Analytics (`G-CZLNYSWY76`) sin consentimiento en todas las páginas, incumpliendo ePrivacy art. 5.3, RGPD art. 6 y la Guía AEPD de cookies (2023). Se implementó Consent Mode v2 (opción B elegida por el usuario) + banner bilingüe + política de cookies.

**Archivos tocados:**
- `src/layouts/Layout.astro` — consent default (denied) en `<head>` + gtag.js en main thread
- `src/components/CookieBanner.astro` — banner bilingüe (nuevo)
- `src/i18n/ui.ts` — claves `cookie.*` + `footer.cookies`
- `src/pages/cookies.astro`, `src/pages/es/cookies.astro` — política de cookies (nuevas)
- `src/components/Footer.astro` — enlace "Cookies"
- `src/components/cookie-banner-contract.test.ts` — contract test (nuevo)
- `scripts/e2e-cookie-consent.mjs` — suite E2E de 8 checks (nuevo)
- `astro.config.mjs` — eliminada la integración `@astrojs/partytown` (su único uso era GA)
- `docs/specai/20260812-cookie-consent-banner/` — 5 documentos specai

**Resultado:**
- `pnpm build` OK (1061 páginas)
- Contract test verde (3 tests)
- Suite E2E: **8/8 PASS** (cero cookies pre-consent, `_ga` al aceptar, cero al rechazar, sin banner en retorno)

**Hallazgo técnico:** Con Partytown, el consent default no llega a tiempo al worker → cookies GA creadas sin consentimiento; y el proxy de `dataLayer.push` desvía los comandos aunque gtag.js corra en main thread. Solución: gtag.js en main thread sin Partytown.

**Pendiente:** Gate UA — el usuario debe probar en producción y responder `accept` (o iterar) antes de mergear la rama.

**Nota:** `links-validation.test.ts` tiene 9 fallos pre-existentes (enlaces rotos del blog, ajenos a esta feature).

## [2026-08-12] 20260812-fix-broken-blog-links

**Feature:** Fix de 9 enlaces internos rotos del blog (validador `links-validation.test.ts`).

**Causa:** los posts enlazaban a slugs del otro locale o desactualizados; un caso con `]` extra (sintaxis rota).

**Cambios:**
- `src/content/blog/en/agent-skills-addyosmani-lifecycle-completo.md` — 8 enlaces corregidos a sus traducciones EN (building-ai-agent-skills, ai-agent-skills-dynamic-context, sdd-frameworks-analysis-spec-kit-openspec-bmad, mcp-servers-memory-cross-agent, spec-driven-development-ai) + fix sintaxis línea 460
- `src/content/blog/es/buzz-mobile-coding-agent.md` — 1 enlace corregido a stack-memoria-persistente-implementacion

**Resultado:** `pnpm test` 24/24 archivos, 157/157 PASS (antes 9 fallos); `pnpm build` OK. Validador intacto.

**Pendiente:** Gate UA + merge/push.
