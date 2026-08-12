# Consentimiento de cookies (Consent Mode v2) — Verificación

> **Fuente única de verdad de los criterios de aceptación.** Los criterios viven SOLO aquí, nunca en el plan.

**Feature ID:** 20260812-cookie-consent-banner
**Fecha:** 2026-08-12
**Estado:** Pendiente de ejecución

---

## Criterios de aceptación globales

| ID | Criterio | Cómo se verifica | Estado |
|----|----------|------------------|--------|
| V1 | El consent default (4 señales `denied`) aparece en el `<head>` **antes** del script partytown de gtag.js | Contract test (Task 4) + grep en `dist/index.html` (Task 5) | ⬜ |
| V2 | Primera visita sin elección: **banner visible** y **cero cookies GA** (`_ga`, `_gid`, `_gat_*`) | E2E checks 1-2 (Task 6) | ⬜ |
| V3 | Aceptar → `localStorage['cookie-consent']='granted'` + cookies GA creadas (`_ga`...) | E2E checks 3-4 (Task 6) | ⬜ |
| V4 | Rechazar → `localStorage['cookie-consent']='denied'` + **cero cookies GA** | E2E checks 6-7 (Task 6) | ⬜ |
| V5 | Visita de retorno con elección guardada → **sin banner** (aceptó y rechazó) | E2E checks 5 y 8 (Task 6) | ⬜ |
| V6 | `pnpm build` sin errores y `pnpm test` verde (incluye contract test nuevo) | Tasks 4-5 | ⬜ |
| V7 | `/cookies` y `/es/cookies` responden 200 y contienen la tabla con `_ga`, `_gid`, `_gat` | `curl -s -o /dev/null -w "%{http_code}"` sobre el build (Task 7) | ⬜ |
| V8 | Footer enlaza "Cookies" → `/cookies` (EN) y `/es/cookies` (ES) | grep en `src/components/Footer.astro` + HTML build | ⬜ |
| V9 | Las señales `ad_storage`, `ad_user_data`, `ad_personalization` permanecen `denied` incluso tras aceptar (solo se actualiza `analytics_storage`) | Contract test (asserts de default denied) + revisión del código del banner (update solo con `analytics_storage`) | ⬜ |
| V10 | Ninguna dependencia nueva añadida | `git diff package.json pnpm-lock.yaml` vacío | ⬜ |

## Plantilla de verificación final

> Rellenar tras la Task 7. Solo se considera la feature **completa** cuando el usuario acepta en Gate UA, no cuando esta tabla está verde.

| Criterio | Resultado | Evidencia |
|----------|-----------|-----------|
| V1 | ⬜ | |
| V2 | ⬜ | |
| V3 | ⬜ | |
| V4 | ⬜ | |
| V5 | ⬜ | |
| V6 | ⬜ | |
| V7 | ⬜ | |
| V8 | ⬜ | |
| V9 | ⬜ | |
| V10 | ⬜ | |

**Gate UA (INQUEBRANTABLE):** la feature no está completa hasta que el usuario pruebe en producción y responda `accept` (o equivalente). Respuestas tipo "iterate"/"bug" → `specai-iteration`. NO mergear, hacer PR ni archivar antes del `accept` explícito.

---

## Notas de verificación específicas

- **Por qué E2E y no TagAssistant:** Partytown ejecuta gtag.js en un web worker; el main thread no ve los updates de consentimiento (one-way proxying). La señal real de que el consent mode funciona es el **comportamiento de cookies/red**: si el default no llegara al worker, gtag crearía `_ga` incluso sin clic (detectable por el check 2). Si el update no llegara, aceptar no crearía `_ga` (detectable por el check 4).
- **GA4 panel:** verificación complementaria manual: en GA4 → Real-time, tras aceptar debe aparecer actividad; la sección de consentimiento del DebugView mostrará los estados. No bloquea la aceptación de la feature (la suite E2E es la evidencia principal).
- **Entorno de E2E:** `BASE_URL` apunta a `pnpm preview` local (build estático). Las cookies de GA se crean contra `googletagmanager.com` real (requiere red).
