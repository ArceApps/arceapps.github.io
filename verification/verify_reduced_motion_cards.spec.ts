import { test, expect } from '@playwright/test';

test.describe('Reduced Motion - Cards', () => {
  test.use({ colorScheme: 'light' });

  test('ProjectCard should not scale or animate on hover when reduced motion is enabled', async ({ page }) => {
    // 1. Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // 2. Go to Apps page
    await page.goto('/apps');
    // Wait for content to load
    await page.waitForSelector('a[href^="/apps/"]');

    // 3. Locate a project card
    const card = page.locator('a[href^="/apps/"]').first();
    await expect(card).toBeVisible();

    // 4. Initial state check (transform should be none)
    await expect(card).toHaveCSS('transform', 'none');

    // 5. Hover
    await card.hover();

    // 6. Check that transform remains none (no scale)
    await expect(card).toHaveCSS('transform', 'none');

    // 7. Check image inside the card
    const img = card.locator('img').first();
    if (await img.count() > 0) {
        await expect(img).toBeVisible();
        await expect(img).toHaveCSS('transform', 'none');
    }

    // 8. Check text arrow translation
    const detailsText = card.locator('span:has-text("Ver Detalles")').first();
    await expect(detailsText).toHaveCSS('transform', 'none');
  });

  test('BlogCard should not scale or animate on hover when reduced motion is enabled', async ({ page }) => {
    // 1. Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // 2. Go to Blog page
    await page.goto('/blog');
    // Wait for content to load
    await page.waitForSelector('article.material-card');

    // 3. Locate a blog card
    const card = page.locator('article.material-card').first();
    await expect(card).toBeVisible();

    // 4. Initial state check
    await expect(card).toHaveCSS('transform', 'none');

    // 5. Hover
    await card.hover();

    // 6. Check transform remains none
    await expect(card).toHaveCSS('transform', 'none');

    // 7. Check image
    const img = card.locator('img').first();
    if (await img.count() > 0) {
        await expect(img).toHaveCSS('transform', 'none');
    }

    // 8. Check arrow inside "Leer artículo"
    // The arrow is inside a div with text "Leer artículo"
    const arrow = card.locator('.material-icons', { hasText: 'arrow_forward' }).first();
    await expect(arrow).toHaveCSS('transform', 'none');
  });
});
