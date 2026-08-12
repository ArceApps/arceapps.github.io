# Consentimiento de cookies (Consent Mode v2) — PRD

**Feature ID:** 20260812-cookie-consent-banner
**Fecha:** 2026-08-12
**Estado:** 🟢 BACKLOG (pendiente de aprobación del PRD y plan)
**Autor:** Agente Hermes (flujo specai)
**Prioridad:** Alta (incumplimiento legal activo)

---

## 1. Problema

La web cargaba **Google Analytics (gtag.js, `G-CZLNYSWY76`) de forma incondicional** en todas las páginas (`src/layouts/Layout.astro`), vía Partytown, **sin ningún mecanismo de consentimiento**:

- No existía banner ni lógica de consentimiento (cero referencias a "consent"/"cookie" en la UI).
- Google Analytics instala cookies no esenciales (`_ga`, `_gid`, `_gat_*`) → en la UE/EEE esto exige **consentimiento previo** (ePrivacy art. 5.3; RGPD art. 6; Guía AEPD de cookies, actualización julio 2023).
- La página `privacy-policy.astro` afirmaba que el usuario "puede aceptar o rechazar estas cookies" — pero **no existía ningún mecanismo para rechazarlas**.
- Desde marzo de 2024, Google exige Consent Mode v2 para etiquetas de Google en el EEE; la AEPD (informe 2024) advierte que el modelado no exime de configurar el consentimiento correctamente.

**Riesgo:** sanción de la AEPD (denuncia) y contradicción legal documentada en la propia política de privacidad.

## 2. Objetivos

1. Implementar **Google Consent Mode v2** con estado por defecto `denied` (cero recopilación pre-consentimiento).
2. Añadir un **banner de consentimiento bilingüe (EN/ES)** con Aceptar/Rechazar del mismo peso visual (exigencia AEPD).
3. Conservar datos de analytics: los que aceptan → datos reales; los que rechazan/ignoran → pings sin cookies + **datos modelados por Google** (decisión del usuario: opción B, no C).
4. Publicar una **Política de Cookies bilingüe** con tabla de cookies conforme a la Guía AEPD.
5. **Nunca** activar señales publicitarias (`ad_storage`, `ad_user_data`, `ad_personalization` permanecen `denied` siempre — la web no tiene publicidad).

## 3. No objetivos

- ❌ Migrar a analytics sin cookies (Plausible/Umami/GoatCounter) — opción C explorada y **descartada por el usuario**.
- ❌ Banner multi-finalidad con toggles (una sola finalidad: analytics).
- ❌ Cookie wall (bloquear navegación si no decide) — prohibido.
- ❌ Aceptación pre-marcada o implícita (dark pattern, prohibido por AEPD/TJUE).
- ❌ Añadir publicidad ni recopilar datos de marketing.
- ❌ Modificar `privacy-policy.astro` (queda como está; el nuevo banner y la nueva página resuelven la contradicción).

## 4. Requisitos funcionales

| ID | Requisito |
|----|-----------|
| RF-1 | Banner visible en **todas las páginas** (layout global) hasta que el usuario decida; no bloquea la navegación. |
| RF-2 | Botones **Aceptar estadísticas** (primario, color de marca) y **Rechazar** (secundario), ambos visibles y accesibles por teclado. |
| RF-3 | Texto bilingüe según idioma de la página (EN/ES) usando el sistema i18n (`src/i18n/ui.ts`). |
| RF-4 | Enlace **Más información** → `/cookies` (EN) o `/es/cookies` (ES). |
| RF-5 | Al aceptar: `localStorage['cookie-consent'] = 'granted'` + `gtag('consent','update',{analytics_storage:'granted'})`. `ad_storage`, `ad_user_data`, `ad_personalization` **permanecen `denied`**. |
| RF-6 | Al rechazar: `localStorage['cookie-consent'] = 'denied'` + update explícito con `analytics_storage:'denied'`. |
| RF-7 | **Consent Mode v2**: `gtag('consent','default',{...denied...})` ejecutado en un script inline del `<head>` (hilo principal) **antes** de que cargue gtag.js (Partytown). `functionality_storage` y `security_storage` = `granted`. |
| RF-8 | Visitante de retorno con elección guardada: no se muestra el banner y la elección se aplica inmediatamente (update tras el default). |
| RF-9 | Página **Política de Cookies** bilingüe con tabla AEPD: `_ga`, `_ga_<container-id>`, `_gid`, `_gat_*` (finalidad, duración, proveedor) + explicación de consentimiento, Consent Mode y retirada. |
| RF-10 | Enlace **Cookies** en el footer (sección Legal), bilingüe. |
| RF-11 | gtag.js sigue cargándose vía **Partytown**; la config `forward: ["dataLayer.push"]` de `astro.config.mjs` **no cambia**. |

## 5. Requisitos no funcionales

| ID | Requisito |
|----|-----------|
| RNF-1 | **Cero cookies** (y cero recopilación identificable) antes de la decisión del usuario. |
| RNF-2 | Compatible con **View Transitions** (`<ClientRouter />`): sin parpadeo del banner al navegar (`astro:before-swap`). |
| RNF-3 | **CSP existente sin cambios** (`script-src 'unsafe-inline'` + `googletagmanager.com` ya presentes). |
| RNF-4 | El stub de gtag usa `dataLayer.push(arguments)` con el objeto `arguments` **sin `Array.from`** (trampa conocida: Google ignora el consentimiento si se serializa con `Array.from`). |
| RNF-5 | Accesibilidad: `role="dialog"`, `aria-label`, botones focusables, contraste AA. |
| RNF-6 | **Sin dependencias nuevas** (testing solo con Vitest/Playwright ya instalados). |
| RNF-7 | Verificación de funcionamiento por **red/estado real** (TagAssistant NO funciona con Partytown: one-way proxying worker↔main). |

## 6. Copia aprobada del banner (texto exacto)

**ES:**
> Este sitio es **gratuito y sin publicidad.** Solo usamos cookies de estadísticas (Google Analytics) para saber qué secciones se visitan y mejorar la web. **No recopilamos datos para publicidad, no vendemos ni compartimos tus datos y no recogemos datos sensibles.**
> [Más información] · **Aceptar estadísticas** · Rechazar

**EN:**
> This site is **free and ad-free.** We only use analytics cookies (Google Analytics) to see which sections are visited and to improve the site. **We don't collect data for advertising, we don't sell or share your data, and we don't collect sensitive data.**
> [Learn more] · **Accept statistics** · Reject

## 7. Decisiones de producto ya tomadas (con el usuario)

- **Opción B** (Consent Mode v2) sobre A/C/D — el usuario prefiere conservar GA y tener al menos datos estimados de los que deniegan.
- El banner comunica transparencia total ("gratis, sin publicidad, sin venta de datos") para maximizar la aceptación.
- "Aceptar por defecto" NO puede ser automático/pre-marcado (ilegal); se implementa como botón primario + etiqueta transparente, con estado técnico `denied` por defecto.

## 8. Criterios de éxito

Viven **solo** en `20260812-cookie-consent-banner-verify.md` (fuente única de verdad). Resumen: build limpio, zero cookies pre-consent, accept→`_ga`, reject→nada, retorno sin banner, orden consent-default < gtag en el HTML, páginas /cookies 200, vitest+E2E verdes.
