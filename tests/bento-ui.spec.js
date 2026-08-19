const { test, expect } = require('@playwright/test');

test.describe('Milestone 3: Bento Grid UI Redesign & Clean Hydration Suite', () => {

  const attachConsoleGuards = (page, collectedErrors) => {
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        if (
          text.includes('Hydration failed') ||
          text.includes('did not match') ||
          text.includes('hydration mismatch') ||
          text.includes('unique "key" prop') ||
          text.includes('Minified React error')
        ) {
          collectedErrors.push(`[${type}] ${text}`);
        }
      }
    });

    page.on('pageerror', err => {
      if (
        !err.message.includes('Internal Next.js error') &&
        !err.message.includes('Router action dispatched before initialization')
      ) {
        collectedErrors.push(`[Page Error] ${err.message}`);
      }
    });
  };

  // 1. Bento Grid Asymmetrical Layout & Hero Card Assertions
  test('Bento Grid layout across /courses, /test-series, and /batches', async ({ page }) => {
    const consoleErrors = [];
    attachConsoleGuards(page, consoleErrors);

    // 1.1 /courses Bento Grid
    await page.goto('/courses', { waitUntil: 'domcontentloaded' });
    await page.locator('img.object-contain').first().waitFor({ timeout: 15000 });
    const courseCards = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 > div');
    expect(await courseCards.count()).toBeGreaterThanOrEqual(3);

    // 1.2 /test-series Bento Grid
    await page.goto('/test-series', { waitUntil: 'domcontentloaded' });
    const testH1 = page.locator('h1').filter({ hasText: /Test Series/i }).first();
    await expect(testH1).toBeVisible({ timeout: 15000 });
    const testCards = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 > div');
    expect(await testCards.count()).toBeGreaterThanOrEqual(3);

    // 1.3 /batches Bento Grid
    await page.goto('/batches', { waitUntil: 'domcontentloaded' });
    await page.locator('img.object-contain').first().waitFor({ timeout: 15000 });
    const batchCards = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 > div');
    expect(await batchCards.count()).toBeGreaterThanOrEqual(2);

    expect(consoleErrors).toHaveLength(0);
  });

  // 2. Uncropped Media Thumbnails with Ambient Backdrop Blur + object-contain
  test('Uncropped media containers render ambient blur and foreground object-contain', async ({ page }) => {
    const consoleErrors = [];
    attachConsoleGuards(page, consoleErrors);

    await page.goto('/courses', { waitUntil: 'domcontentloaded' });
    await page.locator('img.object-contain').first().waitFor({ timeout: 15000 });

    const containImages = page.locator('img.object-contain');
    const containCount = await containImages.count();
    expect(containCount).toBeGreaterThanOrEqual(3);

    const blurImages = page.locator('img.blur-xl');
    const blurCount = await blurImages.count();
    expect(blurCount).toBeGreaterThanOrEqual(3);

    await page.goto('/batches', { waitUntil: 'domcontentloaded' });
    await page.locator('img.object-contain').first().waitFor({ timeout: 15000 });
    const batchContainImages = page.locator('img.object-contain');
    expect(await batchContainImages.count()).toBeGreaterThanOrEqual(2);

    expect(consoleErrors).toHaveLength(0);
  });

  // 3. Multi-Viewport Scaling & Zero Horizontal Overflow
  const testViewports = [
    { name: 'Mobile (375px)', width: 375, height: 667 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Desktop (1280px)', width: 1280, height: 800 },
    { name: 'Wide Desktop (1536px)', width: 1536, height: 900 }
  ];

  for (const vp of testViewports) {
    test(`Responsive layout and zero horizontal overflow on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const targets = ['/courses', '/test-series', '/batches'];

      for (const route of targets) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        const overflow = await page.evaluate(() => {
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          return {
            scrollWidth,
            clientWidth,
            hasOverflow: scrollWidth > clientWidth + 1
          };
        });

        expect(
          overflow.hasOverflow,
          `Horizontal overflow detected on ${route} at ${vp.name}: scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`
        ).toBeFalsy();
      }
    });
  }

  // 4. Interactive Subject Filters, Search Input, and Accordion Toggles
  test('Interactive filters and search functionality on /courses', async ({ page }) => {
    await page.goto('/courses', { waitUntil: 'domcontentloaded' });
    await page.locator('img.object-contain').first().waitFor({ timeout: 15000 });

    const physicsBtn = page.locator('button').filter({ hasText: /^PHYSICS$/i }).first();
    if (await physicsBtn.isVisible()) {
      await physicsBtn.click();
      await page.waitForTimeout(300);
      const cards = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 > div');
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }

    const allBtn = page.locator('button').filter({ hasText: /^ALL$/i }).first();
    await allBtn.click();
    await page.waitForTimeout(300);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    const firstTitle = (await page.locator('.grid h2, .grid h3, .grid h4').first().innerText().catch(() => 'Physics')).trim().split(' ')[0];
    await searchInput.fill(firstTitle || 'Physics');
    await page.waitForTimeout(300);

    const searchResults = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 > div');
    const searchCount = await searchResults.count();
    expect(searchCount).toBeGreaterThanOrEqual(1);

    await searchInput.fill('');
    await page.waitForTimeout(300);
  });

  test('Interactive filters and test roster accordions on /test-series', async ({ page }) => {
    await page.goto('/test-series', { waitUntil: 'domcontentloaded' });
    const testH1 = page.locator('h1').filter({ hasText: /Test Series/i }).first();
    await expect(testH1).toBeVisible({ timeout: 15000 });

    const jeeAdvPill = page.locator('button').filter({ hasText: /JEE ADVANCED/i }).first();
    if (await jeeAdvPill.isVisible()) {
      await jeeAdvPill.click();
      await page.waitForTimeout(300);
    }

    const allPill = page.locator('button').filter({ hasText: /^ALL$/i }).first();
    if (await allPill.isVisible()) {
      await allPill.click();
      await page.waitForTimeout(300);
    }

    const rosterToggle = page.locator('button').filter({ hasText: /Exam Blueprint Roster|Roster/i }).first();
    if (await rosterToggle.isVisible()) {
      await rosterToggle.click();
      await page.waitForTimeout(300);
      const examItem = page.locator('button, div, span').filter({ hasText: /Mins|Questions|Drill/i }).first();
      await expect(examItem).toBeVisible();
    }
  });

  test('Interactive syllabus accordions on /batches', async ({ page }) => {
    await page.goto('/batches', { waitUntil: 'domcontentloaded' });
    await page.locator('img.object-contain').first().waitFor({ timeout: 15000 });

    const syllabusToggle = page.locator('button').filter({ hasText: /Curriculum|Syllabus/i }).first();
    if (await syllabusToggle.isVisible()) {
      await syllabusToggle.click();
      await page.waitForTimeout(300);

      const moduleHeader = page.locator('text=Module 1').first();
      await expect(moduleHeader).toBeVisible();
    }
  });

  // 5. Clean Console Hydration Verification Across All Bento Pages
  test('Zero React hydration mismatch errors or missing key warnings across catalog pages', async ({ page }) => {
    const errorLogs = [];
    attachConsoleGuards(page, errorLogs);

    const routes = ['/courses', '/test-series', '/batches', '/leaderboard'];

    for (const r of routes) {
      await page.goto(r, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
    }

    expect(errorLogs, 'Detected hydration or runtime errors: ' + errorLogs.join('; ')).toEqual([]);
  });

});
