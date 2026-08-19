const { test, expect } = require('@playwright/test');

test.describe('CBT Exam Engine Core Loop & Question Telemetry', () => {

  const targetExamUrl = '/test-series/engine/00000000-0000-0000-0000-000000000001';

  const setupPageAndLaunch = async (page) => {
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.goto(targetExamUrl, { waitUntil: 'domcontentloaded' });
    
    // Wait for and click the CBT launcher button
    const launchBtn = page.getByRole('button', { name: /Acknowledge & Launch|Launch Test Engine/i });
    try {
      await launchBtn.waitFor({ state: 'visible', timeout: 10000 });
      await launchBtn.click();
    } catch (e) {
      // Launcher already bypassed or not shown
    }
  };

  test('should load CBT exam engine blueprint, questions, and palette', async ({ page }) => {
    await setupPageAndLaunch(page);

    // Verify CBT Exam Interface loads
    const engineBadge = page.locator('span').filter({ hasText: 'NTA CBT ENGINE' }).first();
    await expect(engineBadge).toBeVisible({ timeout: 15000 });

    // Question header should be visible
    const questionHeader = page.locator('span').filter({ hasText: /Question 1 of/i }).first();
    await expect(questionHeader).toBeVisible({ timeout: 10000 });

    // Katex math wrapper / question prompt should be visible
    const katexWrapper = page.locator('.katex-wrapper').first();
    await expect(katexWrapper).toBeVisible({ timeout: 10000 });

    // Question palette header
    const paletteHeader = page.locator('h4').filter({ hasText: /NTA Question Palette/i }).first();
    await expect(paletteHeader).toBeVisible();
  });

  test('should allow student option selection and question navigation', async ({ page }) => {
    await setupPageAndLaunch(page);

    // Wait for exam interface
    const questionHeader = page.locator('span').filter({ hasText: /Question 1 of/i }).first();
    await expect(questionHeader).toBeVisible({ timeout: 15000 });

    // Option selection
    const firstOption = page.locator('.space-y-3 button').first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    await firstOption.click();
    await page.waitForTimeout(300);

    // Next Question button
    const nextBtn = page.getByRole('button', { name: /Next Question/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(300);

    // Verify question moved to Question 2
    const question2Header = page.locator('span').filter({ hasText: /Question 2 of/i }).first();
    await expect(question2Header).toBeVisible({ timeout: 5000 });
  });

  test('offline mode resilience verification', async ({ page, context }) => {
    await setupPageAndLaunch(page);

    // Verify CBT Engine loaded
    const engineBadge = page.locator('span').filter({ hasText: 'NTA CBT ENGINE' }).first();
    await expect(engineBadge).toBeVisible({ timeout: 15000 });

    // Simulate network disconnection
    await context.setOffline(true);
    await page.waitForTimeout(500);

    // Verify engine remains rendered without crashing
    await expect(engineBadge).toBeVisible();

    // Verify offline badge indicator
    const offlineBadge = page.locator('text=/IndexedDB Offline Mode|Offline/i').first();
    await expect(offlineBadge).toBeVisible({ timeout: 5000 });

    // Restore network
    await context.setOffline(false);
  });
});


