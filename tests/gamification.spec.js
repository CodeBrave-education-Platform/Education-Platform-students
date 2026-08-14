import { test, expect } from '@playwright/test';

test.describe('Gamification and Telemetry Flows', () => {
  // We'll mock the Supabase auth and profile data using Playwright's route interception
  // to ensure consistent testing without relying on the live DB.

  test.beforeEach(async ({ page }) => {
    // Mock the Supabase API calls
    await page.route('**/rest/v1/profiles*', async route => {
      const json = {
        id: 'mock-user-123',
        full_name: 'E2E Test Student',
        role: 'student',
        xp: 1500,
        level: 2,
        streak: 5
      };
      // Handle array response for select or single object for single()
      await route.fulfill({ json: route.request().url().includes('limit') ? [json] : json });
    });

    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({ json: { user: { id: 'mock-user-123' } } });
    });
  });

  test('Gamification HUD displays correct XP and Streak on Dashboard', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard?tab=learning');

    // Check if the Gamification HUD is visible
    await expect(page.locator('text=Level 2 Ranker')).toBeVisible();
    await expect(page.locator('text=1500 / 2000 XP')).toBeVisible();
    await expect(page.locator('text=5 Day')).toBeVisible();
    await expect(page.locator('text=Study Streak')).toBeVisible();
  });

  test('Global Leaderboard displays top rankers', async ({ page }) => {
    await page.goto('/dashboard?tab=learning');

    // Wait for the leaderboard to render
    await expect(page.locator('text=Global Rankings')).toBeVisible();
    
    // Check if the mocked user is in the leaderboard
    await expect(page.locator('text=E2E Test Student')).toBeVisible();
    await expect(page.locator('text=1,500')).toBeVisible(); // XP
  });

  test('Gamified Pricing applies 10% Ranker Discount for >1000 XP', async ({ page }) => {
    // Mock course data
    await page.route('**/rest/v1/courses*', async route => {
      await route.fulfill({
        json: [{
          id: 'test-course',
          title: 'Test Physics Course',
          price: 5000,
          originalPrice: 10000,
          includedBookKit: { value: 1000 }
        }]
      });
    });

    await page.goto('/courses');

    // Wait for courses to load
    await expect(page.locator('text=Test Physics Course')).toBeVisible();

    // Since XP is 1500 (>1000), basePrice should be 90% of 5000 = 4500
    await expect(page.locator('text=10% Ranker Discount')).toBeVisible();
    await expect(page.locator('text=₹4,500')).toBeVisible(); // Expect discounted price
  });

  test('AI Study Mentor widget opens and responds', async ({ page }) => {
    await page.goto('/dashboard?tab=learning');

    // Open AI widget
    const aiButton = page.locator('.fixed.bottom-6.right-6 button');
    await aiButton.click();

    // Check header
    await expect(page.locator('text=AI Mentor')).toBeVisible();
    
    // Type a message
    const input = page.locator('input[placeholder="Ask a doubt..."]');
    await input.fill('What are Newtons Laws?');
    await input.press('Enter');

    // Check if user message appears
    await expect(page.locator('text=What are Newtons Laws?')).toBeVisible();

    // Wait for the simulated AI response
    await expect(page.locator('text=Based on the faculty\'s notes')).toBeVisible({ timeout: 5000 });
  });
});
