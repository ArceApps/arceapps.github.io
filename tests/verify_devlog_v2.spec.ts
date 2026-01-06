
import { test, expect } from '@playwright/test';

test('verify devlog redirects and images', async ({ page }) => {
  // 1. Verify Redirect for specific article
  // We navigate to the old URL
  await page.goto('http://localhost:4321/mi-historia/refinando-la-experiencia');

  // Expect to land on the new URL
  await expect(page).toHaveURL(/\/devlog\/refinando-la-experiencia/);
  await expect(page).toHaveTitle(/Refinando la Experiencia/);

  // 2. Verify Image Loading on Detail Page
  // Check if the hero image is visible and not broken
  const heroImage = page.locator('article img').first();
  await expect(heroImage).toBeVisible();

  // Check natural width via JS to ensure it actually loaded (not just present in DOM)
  const isImageLoaded = await heroImage.evaluate((img) => {
    return (img as HTMLImageElement).naturalWidth > 0;
  });
  expect(isImageLoaded).toBeTruthy();

  // 3. Verify Image on Index Page
  await page.goto('http://localhost:4321/devlog');
  const cardImage = page.locator('img[alt^="Portada de Refinando"]').first();
  await expect(cardImage).toBeVisible();
  const isCardImageLoaded = await cardImage.evaluate((img) => {
    return (img as HTMLImageElement).naturalWidth > 0;
  });
  expect(isCardImageLoaded).toBeTruthy();

  // Screenshot
  await page.screenshot({ path: 'devlog-final-verification.png', fullPage: true });
});
