import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4321';
const CHROME_PATH = '/home/arceapps/.cache/puppeteer/chrome/linux-150.0.7871.24/chrome-linux64/chrome';
const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ' | ' + detail : ''}`);
};
const hasGaCookie = (cookies) =>
  cookies.some((c) => /^_ga/.test(c.name) || /^_gid/.test(c.name) || /^_gat/.test(c.name));

const browser = await chromium.launch({ executablePath: CHROME_PATH, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

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
