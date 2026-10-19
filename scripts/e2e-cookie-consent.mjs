import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const CHROME_PATH = '/home/arceapps/.cache/puppeteer/chrome/linux-150.0.7871.24/chrome-linux64/chrome';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' | ' + detail : ''}`);
};

const browser = await chromium.launch({ executablePath: CHROME_PATH, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

// --- Escenario 1: primera visita (sin elección) ---
const ctx1 = await browser.newContext();
const p1 = await ctx1.newPage();
await p1.goto(BASE, { waitUntil: 'load' });
await p1.waitForTimeout(500);
check('1. banner visible sin elección previa', await p1.locator('#cookie-banner').isVisible());

// Click en dismiss
const t0 = Date.now();
await p1.click('[data-cookie-action]');
await p1.waitForTimeout(50);
const bannerStillVisible = await p1.locator('#cookie-banner').isVisible().catch(() => false);
const t1 = Date.now();
check('2. banner desaparece al hacer click (sin reload)', !bannerStillVisible, `t=${t1 - t0}ms`);
check('3. localStorage=cookie-consent=dismissed', await p1.evaluate(() => localStorage.getItem('cookie-consent')) === 'dismissed');

// Verificar cero requests a Google
const requests = [];
p1.on('request', (req) => requests.push(req.url()));
await p1.reload({ waitUntil: 'load' });
await p1.waitForTimeout(500);
const googleReqs = requests.filter((u) => /google-analytics|googletagmanager|gtag/.test(u));
check('4. cero requests a Google Analytics/gtag', googleReqs.length === 0, googleReqs.join(','));
check('5. sin banner en retorno', !(await p1.locator('#cookie-banner').isVisible().catch(() => false)));
await ctx1.close();

// --- Escenario 2: click en otro contexto ---
const ctx2 = await browser.newContext();
const p2 = await ctx2.newPage();
await p2.goto(BASE, { waitUntil: 'load' });
await p2.waitForTimeout(500);
await p2.click('[data-cookie-action]');
await p2.waitForTimeout(50);
check('6. segundo contexto: banner dismissa', !(await p2.locator('#cookie-banner').isVisible().catch(() => false)));
check('7. segundo contexto: localStorage=cookie-consent=dismissed', await p2.evaluate(() => localStorage.getItem('cookie-consent')) === 'dismissed');
await p2.reload({ waitUntil: 'load' });
await p2.waitForTimeout(500);
check('8. segundo contexto: sin banner en retorno', !(await p2.locator('#cookie-banner').isVisible().catch(() => false)));
await ctx2.close();

await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks PASS`);
process.exit(failed ? 1 : 0);
