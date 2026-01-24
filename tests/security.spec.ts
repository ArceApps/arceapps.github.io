import { test, expect } from '@playwright/test';
import http from 'http';
import type { AddressInfo } from 'net';

let server: http.Server;
let maliciousPort: number;

test.beforeAll(async () => {
  // Start a local server to serve the malicious iframe
  server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    // The iframe points to our running Astro preview
    res.end(`
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Malicious Site</h1>
          <iframe src="http://localhost:4321"></iframe>
        </body>
      </html>
    `);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address() as AddressInfo;
      maliciousPort = address.port;
      console.log(`Malicious server running on port ${maliciousPort}`);
      resolve();
    });
  });
});

test.afterAll(async () => {
  if (server) {
    server.close();
  }
});

test.describe('Security & Usability Checks', () => {

  test('User can navigate the site and body is visible', async ({ page }) => {
    // 1. Visit Home
    await page.goto('http://localhost:4321/');
    await expect(page).toHaveTitle(/ArceApps/);

    // Check body visibility
    const isBodyVisible = async () => {
      return await page.evaluate(() => {
        const body = document.body;
        const style = window.getComputedStyle(body);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
    };

    expect(await isBodyVisible()).toBe(true);

    // 2. Navigate to Blog
    await page.locator('a[href="/blog"]').first().click();
    await expect(page).toHaveURL(/.*\/blog/);

    await page.waitForTimeout(500);

    expect(await isBodyVisible()).toBe(true);

    // 3. Navigate to a Post (if available)
    const firstPostLink = page.locator('article a').first();
    if (await firstPostLink.isVisible()) {
        await firstPostLink.click();
        await page.waitForTimeout(500);
        expect(await isBodyVisible()).toBe(true);
    }
  });

  test('Anti-Clickjacking protection works (Frame Busting or Hidden)', async ({ page }) => {
    // Navigate to the malicious iframe page on our ephemeral server
    const maliciousUrl = `http://localhost:${maliciousPort}`;
    console.log(`Navigating to ${maliciousUrl}`);
    await page.goto(maliciousUrl);

    // We expect EITHER:
    // 1. A redirect to localhost:4321 (Frame Busting success)
    // 2. The content inside the iframe to be hidden (Fallback success)

    // Wait a bit for potential redirect
    await page.waitForTimeout(2000);

    const currentUrl = page.url();

    if (currentUrl.includes('localhost:4321') && !currentUrl.includes(String(maliciousPort))) {
        console.log("Frame busting successful: Redirected to top.");
        return;
    }

    console.log("Frame busting redirect did not happen. Verifying content remains hidden...");

    // Re-acquire frame safely
    const frameElementHandle = await page.$('iframe');
    const safeFrame = await frameElementHandle?.contentFrame();

    if (!safeFrame) throw new Error("Iframe context not found");

    const isHidden = await safeFrame.evaluate(() => {
        const body = document.body;
        const style = window.getComputedStyle(body);
        console.log(`Iframe Body Display: ${style.display}`);
        return style.display === 'none';
    });

    expect(isHidden).toBe(true);
  });

});
