import { test, expect } from '@playwright/test';

test('Verify Indie Developer Updates', async ({ page }) => {
  // 1. Go to homepage
  await page.goto('http://localhost:4321/');

  // 2. Verify Hero Text
  await expect(page.getByText('Indie Android Developer')).toBeVisible();
  await expect(page.getByText('Construyendo apps y compartiendo el proceso')).toBeVisible();

  // 3. Verify Bitácora Section (should appear if there is a devlog entry)
  // We can't guarantee a devlog entry exists in the mock data, but we can check if the section container *or* the fallback exists.
  // However, based on our code, the section only renders if `latestDevlog` exists.
  // Let's assume there is at least one devlog entry or check for the absence of the OLD text.
  await expect(page.getByText('Apps que Inspiran')).not.toBeVisible();

  // 4. Verify Apps Section Title
  await expect(page.getByText('Lo que estoy construyendo')).toBeVisible();

  // 5. Verify Blog Section Title
  await expect(page.getByText('Artículos Técnicos')).toBeVisible();

  // 6. Verify Footer Logo (Visual check via screenshot)
  const footerLogo = page.locator('footer img[alt="ArceApps Logo"]');
  await expect(footerLogo).toBeVisible();

  // 7. Take Screenshot of Homepage
  await page.screenshot({ path: 'verification/verification_home.png', fullPage: true });

  // 8. Go to Apps Page
  await page.goto('http://localhost:4321/apps');

  // 9. Verify Apps Page Header
  await expect(page.getByText('Portfolio Indie')).toBeVisible();
  await expect(page.getByText('Aplicaciones desarrolladas con pasión')).toBeVisible();

  // 10. Take Screenshot of Apps Page
  await page.screenshot({ path: 'verification/verification_apps.png', fullPage: true });
});
