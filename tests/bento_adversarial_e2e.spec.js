const { test, expect } = require('@playwright/test');

test.describe('Milestone 3: Bento UI Adversarial Stress & Extreme Viewports Suite', () => {

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
          text.includes('Minified React error') ||
          text.includes('Warning: Each child in a list')
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

  // =========================================================================
  // 1. EXTREME VIEWPORTS & ZERO HORIZONTAL OVERFLOW ACROSS ALL 7 BREAKPOINTS
  // =========================================================================
  const extremeViewports = [
    { name: 'Ultra-Narrow Mobile (320px)', width: 320, height: 568 },
    { name: 'Standard Mobile (375px)', width: 375, height: 667 },
    { name: 'Tablet Portrait (768px)', width: 768, height: 1024 },
    { name: 'Tablet Landscape (1024px)', width: 1024, height: 768 },
    { name: 'Desktop Standard (1280px)', width: 1280, height: 800 },
    { name: 'Full HD Desktop (1920px)', width: 1920, height: 1080 },
    { name: '2K / Ultrawide Display (2560px)', width: 2560, height: 1440 }
  ];

  const targetRoutes = ['/courses', '/test-series', '/batches', '/dashboard', '/leaderboard'];

  for (const vp of extremeViewports) {
    test(`Verify layout integrity and zero horizontal scroll on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const consoleErrors = [];
      attachConsoleGuards(page, consoleErrors);

      for (const route of targetRoutes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        const overflowCheck = await page.evaluate(() => {
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          const bodyScrollWidth = document.body.scrollWidth;
          const bodyClientWidth = document.body.clientWidth;

          // Find any overflowing elements
          const elements = Array.from(document.querySelectorAll('*'));
          const overflowing = [];
          for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.right > clientWidth + 2) {
              const tag = el.tagName.toLowerCase();
              const cls = typeof el.className === 'string' ? el.className.slice(0, 50) : '';
              overflowing.push(`${tag}.${cls} (right: ${rect.right.toFixed(1)}px vs width: ${clientWidth}px)`);
            }
          }

          return {
            scrollWidth,
            clientWidth,
            bodyScrollWidth,
            bodyClientWidth,
            hasOverflow: scrollWidth > clientWidth + 1 || bodyScrollWidth > bodyClientWidth + 1,
            overflowing: overflowing.slice(0, 3)
          };
        });

        expect(
          overflowCheck.hasOverflow,
          `Horizontal overflow detected on ${route} at ${vp.name}: doc=${overflowCheck.scrollWidth}px vs ${overflowCheck.clientWidth}px. Culprits: ${overflowCheck.overflowing.join('; ')}`
        ).toBeFalsy();
      }

      expect(consoleErrors).toEqual([]);
    });
  }

  // =========================================================================
  // 2. THUMBNAIL RENDERING UNDER BROKEN / FAILED IMAGE NETWORK LOADS
  // =========================================================================
  test('Bento cards maintain layout geometry & aspect ratio when image network fails (404/Abort)', async ({ page }) => {
    const consoleErrors = [];
    attachConsoleGuards(page, consoleErrors);

    // Intercept image requests and abort them to simulate broken / missing CDNs
    await page.route('**/*.{png,jpg,jpeg,webp,svg}', route => {
      if (route.request().url().includes('unsplash') || route.request().url().includes('images')) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto('/courses', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Verify Bento cards are present and retain their dimensions
    const cards = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3 > div');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify card containers do not collapse (height > 200px)
    for (let i = 0; i < count; i++) {
      const box = await cards.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box.height).toBeGreaterThan(200);
      expect(box.width).toBeGreaterThan(150);
    }

    // Verify ambient blur and object-contain image tags remain rendered in DOM structure
    const containImages = page.locator('img.object-contain');
    expect(await containImages.count()).toBeGreaterThanOrEqual(3);

    const blurImages = page.locator('img.blur-xl');
    expect(await blurImages.count()).toBeGreaterThanOrEqual(3);

    expect(consoleErrors).toEqual([]);
  });

  // =========================================================================
  // 3. HYDRATION DETERMINISM UNDER VARYING TIMEZONES & LOCALES
  // =========================================================================
  const timezoneScenarios = [
    { tz: 'Asia/Kolkata', locale: 'en-IN' },
    { tz: 'America/New_York', locale: 'en-US' },
    { tz: 'Pacific/Auckland', locale: 'en-NZ' },
    { tz: 'Asia/Tokyo', locale: 'ja-JP' },
    { tz: 'Europe/Berlin', locale: 'de-DE' }
  ];

  for (const { tz, locale } of timezoneScenarios) {
    test(`Zero hydration mismatch with TZ=${tz} and Locale=${locale}`, async ({ browser }) => {
      const context = await browser.newContext({
        timezoneId: tz,
        locale: locale
      });
      const page = await context.newPage();
      const consoleErrors = [];
      attachConsoleGuards(page, consoleErrors);

      const routes = ['/courses', '/test-series', '/batches', '/dashboard', '/leaderboard'];

      for (const route of routes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(400);
      }

      expect(
        consoleErrors,
        `Hydration errors detected under TZ=${tz} Locale=${locale}: ` + consoleErrors.join('; ')
      ).toEqual([]);

      await context.close();
    });
  }

  // =========================================================================
  // 4. DYNAMIC INTERACTIVITY & FILTER STRESS TEST
  // =========================================================================
  test('Fast interactive subject filtering and search input without unhandled state crashes', async ({ page }) => {
    const consoleErrors = [];
    attachConsoleGuards(page, consoleErrors);

    await page.goto('/courses', { waitUntil: 'domcontentloaded' });
    await page.locator('img.object-contain').first().waitFor({ timeout: 15000 });

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Rapid search input cycles
    const queries = ['Physics', 'Chemistry', 'Math', 'NEET', 'NonExistentXYZ123', ''];
    for (const q of queries) {
      await searchInput.fill(q);
      await page.waitForTimeout(100);
    }

    // Toggle subjects rapidly
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'All'];
    for (const subj of subjects) {
      const btn = page.locator('button').filter({ hasText: new RegExp(`^${subj}$`, 'i') }).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(100);
      }
    }

    expect(consoleErrors).toEqual([]);
  });

});
