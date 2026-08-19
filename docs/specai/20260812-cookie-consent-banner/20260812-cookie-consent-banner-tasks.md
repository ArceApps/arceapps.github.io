# Consentimiento de cookies (Consent Mode v2) — Task List

> **For agentic workers:** Read this file once, then dispatch one implementer per task with minimal context.
> Tasks are atomic (2-5 min). Do not bundle tasks. Do not skip the order.

**Nota de estado (opción A aprobada por el usuario):** la implementación ya está escrita y sin commitear en `main` (6 archivos). Las Tasks 1-3 formalizan esos cambios en commits; las Tasks 4-6 son la verificación pendiente (contract test, build, E2E); la Task 7 cierra el flujo.

---

## Task 1: Commit de los documentos specai (en `main`, antes de crear la rama)

**Files:**
- Add: `docs/specai/20260812-cookie-consent-banner/` (5 archivos: prd, designs, plan, tasks, verify)

**Control Metadata:**
- Complexity: 1
- Risk: Low
- Checkpoint: No

**Spec context (minimal):** Los documentos specai se crean sin rama (Gate P2 del flujo); la rama solo se crea tras la aprobación del PRD/plan.

**Acceptance for this task:**
- [ ] Los 5 documentos están commiteados en `main`

**Steps:**

- [ ] **Step 1: Verificar que no hay basura**

Run: `git status --short`
Expected: solo los 6 archivos de implementación (M/??) + la carpeta `docs/specai/20260812-cookie-consent-banner/` (??)

- [ ] **Step 2: Commit de los documentos**

```bash
git add docs/specai/20260812-cookie-consent-banner/
git commit -m "docs(specai): plan consentimiento de cookies (Consent Mode v2)"
```

- [ ] **Step 3: Verificar**

Run: `git log --oneline -1`
Expected: el commit de docs aparece y `git status --short` ya no lista la carpeta specai.

---

## Task 2: Commit de la implementación core (Layout + Banner + i18n)

**Files:**
- Modify: `src/layouts/Layout.astro` (import CookieBanner, script consent default en `<head>`, render `<CookieBanner />`)
- Create: `src/components/CookieBanner.astro`
- Modify: `src/i18n/ui.ts` (claves `cookie.*` + `footer.cookies`, EN y ES)

**Control Metadata:**
- Complexity: 2
- Risk: Medium
- Checkpoint: No

**Spec context (minimal):** RF-1 a RF-8, RNF-1, RNF-4, RNF-5. El consent default (`gtag('consent','default',{...denied...})`) va en script inline del `<head>` **antes** del bloque partytown de gtag; el stub usa `dataLayer.push(arguments)` sin `Array.from`; el banner persiste en `localStorage['cookie-consent']` y solo otorga `analytics_storage`.

**Acceptance for this task:**
- [ ] `Layout.astro` contiene el default con las 4 señales `denied` (y `functionality_storage`/`security_storage` granted) en el `<head>`, antes del script partytown
- [ ] `CookieBanner.astro` existe con `id="cookie-banner"`, botones `[data-cookie-action="accept"|"reject"]`, lectura de `localStorage`, `gtag('consent','update',{analytics_storage})` y listener `astro:before-swap`
- [ ] `ui.ts` tiene las claves `cookie.*` y `footer.cookies` en EN y ES

**Steps:**

- [ ] **Step 1: Auto-revisión del código ya escrito** (revisar que coincide con el diseño D1-D11 de `-designs.md`; corregir si algo difiere)

Run: `git diff src/layouts/Layout.astro src/i18n/ui.ts` y `read src/components/CookieBanner.astro`

- [ ] **Step 2: Commit**

```bash
git add src/layouts/Layout.astro src/components/CookieBanner.astro src/i18n/ui.ts
git commit -m "feat(cookies): banner de consentimiento + Google Consent Mode v2 (default denied)"
```

- [ ] **Step 3: Verificar**

Run: `git log --oneline -1`
Expected: commit presente; `git status --short` ya no lista esos 3 archivos.

---

## Task 3: Commit de la política de cookies + enlace en footer

**Files:**
- Create: `src/pages/cookies.astro`
- Create: `src/pages/es/cookies.astro`
- Modify: `src/components/Footer.astro` (enlace "Cookies" en sección Legal)

**Control Metadata:**
- Complexity: 1
- Risk: Low
- Checkpoint: No

**Spec context (minimal):** RF-9 (tabla AEPD: `_ga`, `_ga_<container-id>`, `_gid`, `_gat_*` con finalidad/duración/proveedor + explicación de consentimiento y retirada) y RF-10 (enlace footer bilingüe).

**Acceptance for this task:**
- [ ] `src/pages/cookies.astro` y `src/pages/es/cookies.astro` existen con la tabla de 4 cookies
- [ ] `Footer.astro` enlaza a `/cookies` (EN) y `/es/cookies` (ES) con `t('footer.cookies')`

**Steps:**

- [ ] **Step 1: Commit**

```bash
git add src/pages/cookies.astro src/pages/es/cookies.astro src/components/Footer.astro
git commit -m "feat(cookies): política de cookies bilingüe + enlace en footer"
```

- [ ] **Step 2: Verificar**

Run: `git log --oneline -1`
Expected: commit presente; `git status --short` limpio (solo dist/ u otros artefactos no trackeados que ya existieran).

---

## Task 4: Contract test del banner (Vitest)

**Files:**
- Create: `src/components/cookie-banner-contract.test.ts`

**Control Metadata:**
- Complexity: 2
- Risk: Low
- Checkpoint: No

**Spec context (minimal):** Patrón de los contract tests existentes (`card-contract.test.ts`): lectura del source `.astro` + asserts con strings/regex. RF-1, RF-2, RF-5, RF-6, RNF-4.

**Acceptance for this task:**
- [ ] `pnpm test` pasa con el nuevo test verde

**Steps:**

- [ ] **Step 1: Escribir el test** (crear `src/components/cookie-banner-contract.test.ts`)

```ts
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(__dirname, '../..');
const bannerPath = path.join(ROOT_DIR, 'src/components/CookieBanner.astro');
const layoutPath = path.join(ROOT_DIR, 'src/layouts/Layout.astro');
const uiPath = path.join(ROOT_DIR, 'src/i18n/ui.ts');

const banner = fs.existsSync(bannerPath) ? fs.readFileSync(bannerPath, 'utf8') : '';
const layout = fs.existsSync(layoutPath) ? fs.readFileSync(layoutPath, 'utf8') : '';
const ui = fs.existsSync(uiPath) ? fs.readFileSync(uiPath, 'utf8') : '';

describe('contrato del banner de consentimiento de cookies', () => {
  it('existe CookieBanner.astro con la estructura del banner', () => {
    expect(banner).toContain('id="cookie-banner"');
    expect(banner).toContain('data-cookie-action="accept"');
    expect(banner).toContain('data-cookie-action="reject"');
    expect(banner).toContain('role="dialog"');
    expect(banner).toMatch(/cookie-consent/);
    expect(banner).toMatch(/gtag\("consent", "update", \{ analytics_storage: value \}\)/);
    expect(banner).toContain('astro:before-swap');
  });

  it('Layout.astro declara el consent default ANTES del bloque partytown de gtag', () => {
    const consentIdx = layout.indexOf('gtag("consent", "default"');
    const gtagSrcIdx = layout.indexOf('googletagmanager.com/gtag/js');
    expect(consentIdx, 'falta el consent default').toBeGreaterThan(-1);
    expect(gtagSrcIdx, 'falta el script gtag partytown').toBeGreaterThan(-1);
    expect(consentIdx).toBeLessThan(gtagSrcIdx);
    expect(layout).toMatch(/ad_storage: "denied"/);
    expect(layout).toMatch(/ad_user_data: "denied"/);
    expect(layout).toMatch(/ad_personalization: "denied"/);
    expect(layout).toMatch(/analytics_storage: "denied"/);
    expect(layout).toContain('CookieBanner');
  });

  it('ui.ts contiene las claves i18n del banner en EN y ES', () => {
    ['cookie.aria', 'cookie.accept', 'cookie.reject', 'cookie.more_info', 'footer.cookies'].forEach((k) => {
      const count = (ui.match(new RegExp(`'${k}'`, 'g')) || []).length;
      expect(count, `clave ${k} debe existir en EN y ES`).toBe(2);
    });
  });
});
```

- [ ] **Step 2: Ejecutar el test**

Run: `pnpm test 2>&1 | tail -20`
Expected: `cookie-banner-contract` suite PASS (puede fallar si algún assert del orden falla → corregir el código o el test según corresponda, nunca debilitar el assert del orden).

- [ ] **Step 3: Commit**

```bash
git add src/components/cookie-banner-contract.test.ts
git commit -m "test(cookies): contract test del banner y del orden del consent default"
```

---

## Task 5: Build de producción + verificación del HTML generado

**Files:**
- (sin cambios de fuente; solo verificación)

**Control Metadata:**
- Complexity: 2
- Risk: Medium
- Checkpoint: No

**Spec context (minimal):** RNF-1, RF-7. El `dist/` generado debe reflejar el orden correcto (consent default antes de gtag) y contener el banner y las páginas de política.

**Acceptance for this task:**
- [ ] `pnpm build` termina sin errores
- [ ] En `dist/index.html`: el consent default aparece antes del script partytown de gtag; el banner está presente
- [ ] `dist/cookies.html` y `dist/es/cookies.html` existen

**Steps:**

- [ ] **Step 1: Build**

Run: `pnpm build`
Expected: exit 0, sin errores (el prebuild regenera OG images — NO commitearlas).

- [ ] **Step 2: Verificar orden y presencia en el HTML**

```bash
python3 - <<'EOF'
import re
html = open('dist/index.html', encoding='utf-8').read()
consent = html.find('gtag("consent", "default"')
gtag = html.find('googletagmanager.com/gtag/js')
print('consent default idx:', consent)
print('gtag partytown idx:', gtag)
print('ORDEN OK' if consent != -1 and gtag != -1 and consent < gtag else 'ORDEN ROTO')
print('banner presente:', 'cookie-banner' in html)
EOF
ls dist/cookies.html dist/es/cookies.html
```

Expected: `ORDEN OK`, `banner presente: True`, ambos archivos listados.

- [ ] **Step 3: Verificar que git no tiene basura nueva**

Run: `git status --short`
Expected: sin archivos nuevos de fuente; si el prebuild tocó `public/images/` (OG images), NO se commitean (decisión: `git checkout -- public/images/` solo si estaban limpias antes y el usuario lo aprueba).

---

## Task 6: Suite E2E Playwright (verificación por red/cookies reales)

**Files:**
- Create: `scripts/e2e-cookie-consent.mjs`

**Control Metadata:**
- Complexity: 3
- Risk: Medium
- Checkpoint: No

**Spec context (minimal):** RNF-7 (la verificación es empírica: Partytown ejecuta gtag en un worker; TagAssistant y `window.dataLayer` en main thread NO ven los updates — one-way proxying). Criterios V1-V4 de `-verify.md`.

**Acceptance for this task:**
- [ ] El script pasa los 6 checks: banner visible, cero cookies pre-consent, accept→`_ga`+localStorage, retorno sin banner, reject→sin cookies, retorno sin banner

**Steps:**

- [ ] **Step 1: Asegurar navegador de Playwright** (solo si falta)

Run: `ls ~/.cache/ms-playwright/ 2>/dev/null | head -3 || npx playwright install chromium`
Expected: directorio de chromium presente (la descarga ~150 MB solo la primera vez).

- [ ] **Step 2: Escribir el script** (crear `scripts/e2e-cookie-consent.mjs`)

```js
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' | ' + detail : ''}`);
};
const hasGaCookie = (cookies) =>
  cookies.some((c) => /^_ga/.test(c.name) || /^_gid/.test(c.name) || /^_gat/.test(c.name));

const browser = await chromium.launch();

// --- Escenario 1: primera visita (sin elección) ---
const ctx1 = await browser.newContext();
const p1 = await ctx1.newPage();
await p1.goto(BASE, { waitUntil: 'load' });
await p1.waitForTimeout(1000);
check('1. banner visible sin elección previa', await p1.locator('#cookie-banner').isVisible());
await p1.waitForTimeout(5000); // margen para que gtag (worker) intentara cargar si algo está roto
const c1 = await ctx1.cookies();
check('2. cero cookies GA antes de decidir', !hasGaCookie(c1), c1.map((c) => c.name).join(','));

// --- Escenario 2: aceptar ---
await p1.click('[data-cookie-action="accept"]');
const ls1 = await p1.evaluate(() => localStorage.getItem('cookie-consent'));
check('3. localStorage=granted al aceptar', ls1 === 'granted', String(ls1));
await p1.waitForTimeout(5000); // tiempo para que gtag cree _ga en el worker
const c2 = await ctx1.cookies();
check('4. cookies GA creadas al aceptar', hasGaCookie(c2), c2.map((c) => c.name).join(','));
await p1.reload({ waitUntil: 'load' });
await p1.waitForTimeout(800);
check('5. sin banner en retorno (aceptó)', !(await p1.locator('#cookie-banner').isVisible().catch(() => false)));
await ctx1.close();

// --- Escenario 3: rechazar ---
const ctx2 = await browser.newContext();
const p2 = await ctx2.newPage();
await p2.goto(BASE, { waitUntil: 'load' });
await p2.waitForTimeout(1000);
await p2.click('[data-cookie-action="reject"]');
const ls2 = await p2.evaluate(() => localStorage.getItem('cookie-consent'));
check('6. localStorage=denied al rechazar', ls2 === 'denied', String(ls2));
await p2.waitForTimeout(5000);
const c3 = await ctx2.cookies();
check('7. cero cookies GA al rechazar', !hasGaCookie(c3), c3.map((c) => c.name).join(','));
await p2.reload({ waitUntil: 'load' });
await p2.waitForTimeout(800);
check('8. sin banner en retorno (rechazó)', !(await p2.locator('#cookie-banner').isVisible().catch(() => false)));
await ctx2.close();

await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks PASS`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 3: Servir el build y ejecutar**

```bash
pnpm preview --port 4321 &
sleep 4
node scripts/e2e-cookie-consent.mjs
# detener preview al terminar (kill del proceso pnpm preview)
```

Expected: `8/8 checks PASS`. Si falla el check 2 (cookies antes de decidir) → el consent default no llega al worker (bug real, volver a Task 2). Si falla el 4 (no aparece `_ga` tras aceptar) → el update no llega al worker (revisar `forward` de partytown).

- [ ] **Step 4: Commit**

```bash
git add scripts/e2e-cookie-consent.mjs
git commit -m "test(cookies): suite E2E de consentimiento (banner, cero cookies pre-consent, accept/reject)"
```

---

## Task 7: Verificación final, living docs y bitácora

**Files:**
- Modify: `docs/specai/20260812-cookie-consent-banner/*-plan.md` (execution log + Status ✅)
- Modify: `docs/specai/20260812-cookie-consent-banner/*-tasks.md` (estados completed)
- Create: `agents/bitácora/bitacora_specai.md` (si no existe)

**Control Metadata:**
- Complexity: 1
- Risk: Low
- Checkpoint: No

**Spec context (minimal):** Regla AGENTS.md n.º 3 (bitácoras) y flujo specai (living documents + Execution Log).

**Acceptance for this task:**
- [ ] Todos los criterios de `-verify.md` están marcados como verificados
- [ ] Execution Log del plan refleja las 7 tasks con su resultado
- [ ] Entrada de bitácora creada

**Steps:**

- [ ] **Step 1: Pasar la checklist de verificación**

Run: leer `docs/specai/20260812-cookie-consent-banner/20260812-cookie-consent-banner-verify.md` y ejecutar cada criterio (build, vitest, E2E, curl de /cookies).

- [ ] **Step 2: Actualizar living docs** (execution log en `-plan.md` con las 7 tasks; estados `completed` en `-tasks.md`; `Status: ✅ DONE` en el plan; verificación en `-verify.md`)

- [ ] **Step 3: Bitácora**

```bash
mkdir -p agents/bitácora
# crear/append agents/bitácora/bitacora_specai.md con: fecha, feature, archivos, resultado
```

- [ ] **Step 4: Commit**

```bash
git add docs/specai/20260812-cookie-consent-banner/ agents/bitácora/bitacora_specai.md
git commit -m "docs(specai): cierre de 20260812-cookie-consent-banner"
```

- [ ] **Step 5: Presentar al usuario para Gate UA** (usuario prueba en producción y responde `accept` o iteración; NO mergear antes)
