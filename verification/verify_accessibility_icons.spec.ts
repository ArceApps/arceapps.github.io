import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:4321' });

test('Verify accessibility attributes on decorative icons', async ({ page }) => {
  // Go to About Me page
  await page.goto('/about-me');

  // 1. Check Tech Stack Category Icons (Material Icons)
  // The structure is: <span class="material-icons text-3xl">{category.icon}</span>
  // We expect them to have aria-hidden="true"
  const categoryIcons = page.locator('.material-icons.text-3xl');
  const count = await categoryIcons.count();
  console.log(`Found ${count} category icons`);

  // We only check if we found some, otherwise the loop won't run
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    await expect(categoryIcons.nth(i)).toHaveAttribute('aria-hidden', 'true');
  }

  // 2. Check Skill Icons (Images)
  // Structure: <img src="..." alt="..." ... class="... dark:invert" />
  // We expect alt=""
  // Use a more specific locator to avoid catching the header logo
  // Skill chips have 'rounded-full' and 'bg-surface-variant/50' (or similar)
  // We can just target the image inside the specific container structure
  const skillIcons = page.locator('.flex.items-center.gap-2.rounded-full > img');
  const skillCount = await skillIcons.count();
  console.log(`Found ${skillCount} skill icons`);
  expect(skillCount).toBeGreaterThan(0);

  for (let i = 0; i < skillCount; i++) {
    await expect(skillIcons.nth(i)).toHaveAttribute('alt', '');
  }

  // 3. Check Mission Rocket Icon
  // Structure: <span class="material-icons text-primary text-4xl">rocket_launch</span>
  const rocketIcon = page.locator('.material-icons.text-primary.text-4xl', { hasText: 'rocket_launch' });
  await expect(rocketIcon).toHaveAttribute('aria-hidden', 'true');

  // 4. Check Check Circle Icons
  // Structure: <span class="material-icons text-green-500">check_circle</span>
  const checkIcons = page.locator('span.material-icons.text-green-500', { hasText: 'check_circle' });
  const checkCount = await checkIcons.count();
  expect(checkCount).toBeGreaterThan(0);
  for (let i = 0; i < checkCount; i++) {
      await expect(checkIcons.nth(i)).toHaveAttribute('aria-hidden', 'true');
  }

  // 5. Check Contact Email Icon
  // Structure: <span class="material-icons text-primary">email</span>
  const contactHeaderIcon = page.locator('h3 .material-icons', { hasText: 'email' });
  await expect(contactHeaderIcon).toHaveAttribute('aria-hidden', 'true');

  // Take a screenshot
  await page.screenshot({ path: 'verification/accessibility_check_about_me.png', fullPage: true });
});

test('Verify accessibility attributes on Hero and Home', async ({ page }) => {
    await page.goto('/');

    // Hero buttons
    const appsIcon = page.locator('a[href="#apps"] .material-icons', { hasText: 'apps' });
    await expect(appsIcon).toHaveAttribute('aria-hidden', 'true');

    const devlogIcon = page.locator('a[href="/devlog"] .material-icons', { hasText: 'article' });
    await expect(devlogIcon).toHaveAttribute('aria-hidden', 'true');

    // Check GitHub and Play Store buttons in CTA (Footer area usually or bottom CTA)
    const codeIcon = page.locator('a[href*="github.com"] .material-icons', { hasText: 'code' });
    if (await codeIcon.count() > 0) {
        await expect(codeIcon.first()).toHaveAttribute('aria-hidden', 'true');
    }

    const shopIcon = page.locator('a[href*="play.google.com"] .material-icons', { hasText: 'shop' });
    if (await shopIcon.count() > 0) {
        await expect(shopIcon.first()).toHaveAttribute('aria-hidden', 'true');
    }

    await page.screenshot({ path: 'verification/accessibility_check_home.png', fullPage: true });
});
