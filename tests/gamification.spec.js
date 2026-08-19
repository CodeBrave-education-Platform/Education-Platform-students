import { test, expect } from '@playwright/test';

test.describe('Gamification and Telemetry Flows', () => {

  test('Global Leaderboard displays top rankers and Season 4 badge on /leaderboard', async ({ page }) => {
    await page.goto('/leaderboard', { waitUntil: 'domcontentloaded' });

    // Wait for the leaderboard to render
    await expect(page.locator('text=Global Leaderboard')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Season 4 Active')).toBeVisible();
    await expect(page.locator('text=Global Rankings')).toBeVisible();
  });

  test('Leaderboard podium displays rank badges and XP telemetry', async ({ page }) => {
    await page.goto('/leaderboard', { waitUntil: 'domcontentloaded' });

    // Verify podium ranks
    await expect(page.locator('text=#1')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=#2')).toBeVisible();
    await expect(page.locator('text=#3')).toBeVisible();
  });

  test('Courses Catalog displays pricing with discount calculations', async ({ page }) => {
    await page.goto('/courses', { waitUntil: 'domcontentloaded' });
    await page.locator('h1').filter({ hasText: /Comprehensive Courses/i }).first().waitFor({ timeout: 15000 });

    // Verify courses render pricing with original price and discounts
    const coursePrice = page.locator('text=/₹[0-9,]+/').first();
    await expect(coursePrice).toBeVisible();
    
    const saveDiscount = page.locator('text=/Save [0-9]+%/').first();
    await expect(saveDiscount).toBeVisible();
  });

  test('AI Study Mentor widget opens and responds', async ({ page }) => {
    await page.goto('/courses', { waitUntil: 'domcontentloaded' });

    // Open AI widget
    const aiButton = page.locator('.fixed.bottom-6.right-6 button').first();
    if (await aiButton.isVisible()) {
      await aiButton.click();

      // Check header
      await expect(page.locator('text=AI Mentor')).toBeVisible({ timeout: 5000 });
      
      // Type a message
      const input = page.locator('input[placeholder*="doubt"], input[placeholder*="Ask"]').first();
      if (await input.isVisible()) {
        await input.fill('What are Newtons Laws?');
        await input.press('Enter');

        // Check if user message appears
        await expect(page.locator('text=What are Newtons Laws?')).toBeVisible();

        // Wait for the simulated AI response
        await expect(page.locator('text=Based on the faculty')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
