# Consentimiento de cookies (Consent Mode v2) — Diseños y decisiones

**Feature ID:** 20260812-cookie-consent-banner
**Fecha:** 2026-08-12

---

## 1. Alternativas exploradas

### A — Banner propio + GA solo tras aceptar
- **Cómo:** componente Astro custom, elección en localStorage; gtag.js solo se inyecta si acepta.
- **Pros:** sin dependencias; cumplimiento claro; sin tráfico a Google si no acepta.
- **Contras:** los que deniegan/ignoran desaparecen por completo de los datos (0 datos, ni estimados); sin modelado.
- **Veredicto:** descartada por el usuario (pierde demasiados datos).

### B — Consent Mode v2 (ELEGIDA ✅)
- **Cómo:** gtag.js siempre cargado (en worker, Partytown), pero `consent default` = `denied`; el banner actualiza a `granted` solo para `analytics_storage` si acepta. Google recibe pings sin cookies de los que deniegan y aplica *behavioral modeling*.
- **Pros:** conserva GA; datos estimados de los denegantes; obligatorio para etiquetas Google en EEE desde marzo 2024; el usuario ya tiene gtag montado (cambio mínimo).
- **Contras:** el modelado es estimación (no datos exactos); la AEPD (informe 2024) pide configurarlo bien; requiere banner sí o sí.
- **Veredicto:** ✅ elegida.

### C — Analytics sin cookies (Plausible/Umami/GoatCounter)
- **Cómo:** sustituir GA por un analytics cookieless; **sin banner** (no hay cookies no esenciales); ~100% de visitantes medidos legalmente (la Guía AEPD 2023 reconoce esta configuración).
- **Pros:** máximos datos legales; cero fricción; alineado con el espíritu indie.
- **Contras:** pérdida del ecosistema GA (Search Console, embudos, eventos); migración de datos históricos.
- **Veredicto:** descartada por el usuario (prefiere conservar GA y su histórico).

### D — No hacer nada
- **Pros:** cero trabajo.
- **Contras:** exposición legal activa (denuncia AEPD → aviso/multa); contradicción con la privacy policy.
- **Veredicto:** descartada.

## 2. Decisiones técnicas registradas

| ID | Decisión | Justificación |
|----|----------|---------------|
| D1 | `consent default` = `denied` para `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` **para todos los visitantes** (sin geolocalización por regiones) | Conservador y simple; sin listas de regiones que mantener; el banner se muestra a todos. |
| D2 | Al aceptar solo se otorga `analytics_storage: 'granted'`; las 3 señales `ad_*` **permanecen `denied` para siempre** | La web no tiene publicidad; el copy del banner ("no recopilamos para publicidad") debe ser cierto en el código. |
| D3 | `functionality_storage` y `security_storage` = `granted` | Señales estándar de Consent Mode v2 que no aplican a GA pero quedan listas para futuros tags. |
| D4 | El consent default va en un **script inline del hilo principal en `<head>`**, ANTES del bloque partytown de gtag | Requisito de Google: el default debe registrarse antes de que cargue gtag.js; partytown reenvía las órdenes del dataLayer main→worker (`forward: ["dataLayer.push"]` ya configurado). |
| D5 | Stub de gtag: `function gtag(){ dataLayer.push(arguments); }` — **sin `Array.from(arguments)`** | Trampa verificada (guía real Astro+GTM+Partytown, problema 6.8): `Array.from` hace que la Consent API de Google **ignore** el comando; el consent mode queda silenciosamente desactivado. |
| D6 | Elección persistida en **`localStorage['cookie-consent']`** (`'granted'` \| `'denied'`) | No es cookie (no requiere consentimiento); sobrevive a navegación; leíble por el script de retorno. |
| D7 | Manejo de **View Transitions**: listener `astro:before-swap` que elimina el banner del documento entrante si ya hay elección | Evita parpadeo del banner al navegar con `<ClientRouter />` (mismo patrón que el script de tema existente). |
| D8 | **Verificación por red/estado**, no por TagAssistant | Partytown ejecuta gtag en un worker; el one-way proxying impide que TagAssistant (y los tests que leen `window.dataLayer`) vean los updates. La prueba real: cookies creadas y peticiones `/collect` tras aceptar. |
| D9 | Página **Política de Cookies** nueva y bilingüe (`/cookies`, `/es/cookies`) con tabla AEPD | La AEPD exige información concreta (nombre, finalidad, duración, proveedor); la sección de cookies de la privacy policy actual es boilerplate de app móvil. Decisión (a) del usuario. |
| D10 | Enlace "Cookies" en el footer (sección Legal), bilingüe | Buenas prácticas; acceso permanente a la política. |
| D11 | Sin cambios en `astro.config.mjs` (partytown `forward` intacto) ni en la CSP | La CSP ya permite `googletagmanager.com` y `google-analytics.com`; `script-src 'unsafe-inline'` permite el script inline del consent default. |

## 3. Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Consent default llega tarde al worker y GA recopila sin consentimiento | Baja | Script en hilo principal antes del bloque partytown; verificación E2E de "cero cookies pre-consent" |
| Update del banner no llega al worker (one-way proxying) | Baja | `window.gtag()` en main thread → `dataLayer.push` → `forward` → worker (patrón verificado); E2E comprueba que al aceptar aparece `_ga` |
| Banner parpadea en navegación (View Transitions) | Media | `astro:before-swap` elimina el banner del documento entrante |
| Tasa de aceptación baja | Media | Copy transparente aprobado por el usuario; botón Aceptar primario; una sola finalidad |
