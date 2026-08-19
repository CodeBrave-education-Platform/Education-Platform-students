# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: exam-engine.spec.js >> CBT Exam Engine Core Loop & Question Telemetry >> should allow student option selection and question navigation
- Location: tests\exam-engine.spec.js:44:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Next Question/i })
    - locator resolved to <button class="px-5 py-2.5 bg-teal-600 disabled:opacity-40 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm">Next Question</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 sm:p-6 max-w-4xl w-full pointer-events-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">…</div> from <div class="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none flex justify-center">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 sm:p-6 max-w-4xl w-full pointer-events-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">…</div> from <div class="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none flex justify-center">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    47 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 sm:p-6 max-w-4xl w-full pointer-events-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">…</div> from <div class="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none flex justify-center">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for "http://localhost:3000/test-series/engine/00000000-0000-0000-0000-000000000001" navigation to finish...
    - navigated to "http://localhost:3000/test-series/engine/00000000-0000-0000-0000-000000000001"
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - link "Skip to content" [ref=f2e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=f2e5]:
    - generic [ref=f2e8]:
      - heading "Official NTA CBT Launcher" [level=2] [ref=f2e9]
      - paragraph [ref=f2e10]: This NTA Computer-Based Test requires full-screen mode. Window resizing and tab switches will be logged.
    - button "Acknowledge & Launch Test Engine" [ref=f2e11] [cursor=pointer]
  - button [ref=f2e13]
  - generic [ref=f2e17]:
    - generic [ref=f2e21]:
      - heading "We value your privacy" [level=4] [ref=f2e22]
      - paragraph [ref=f2e23]: We use cookies and telemetry to improve your experience, personalize your AI Mentor interactions, and analyze traffic. By continuing, you consent to our use of cookies.
    - generic [ref=f2e24]:
      - button "Decline" [ref=f2e25]
      - button "Accept All" [ref=f2e26]
  - button "Open Next.js Dev Tools" [ref=f2e32] [cursor=pointer]
  - alert [ref=f2e36]
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.describe('CBT Exam Engine Core Loop & Question Telemetry', () => {
  4  | 
  5  |   const targetExamUrl = '/test-series/engine/00000000-0000-0000-0000-000000000001';
  6  | 
  7  |   const setupPageAndLaunch = async (page) => {
  8  |     page.on('dialog', async dialog => {
  9  |       await dialog.accept();
  10 |     });
  11 | 
  12 |     await page.goto(targetExamUrl, { waitUntil: 'domcontentloaded' });
  13 |     
  14 |     // Wait for and click the CBT launcher button
  15 |     const launchBtn = page.getByRole('button', { name: /Acknowledge & Launch|Launch Test Engine/i });
  16 |     try {
  17 |       await launchBtn.waitFor({ state: 'visible', timeout: 10000 });
  18 |       await launchBtn.click();
  19 |     } catch (e) {
  20 |       // Launcher already bypassed or not shown
  21 |     }
  22 |   };
  23 | 
  24 |   test('should load CBT exam engine blueprint, questions, and palette', async ({ page }) => {
  25 |     await setupPageAndLaunch(page);
  26 | 
  27 |     // Verify CBT Exam Interface loads
  28 |     const engineBadge = page.locator('span').filter({ hasText: 'NTA CBT ENGINE' }).first();
  29 |     await expect(engineBadge).toBeVisible({ timeout: 15000 });
  30 | 
  31 |     // Question header should be visible
  32 |     const questionHeader = page.locator('span').filter({ hasText: /Question 1 of/i }).first();
  33 |     await expect(questionHeader).toBeVisible({ timeout: 10000 });
  34 | 
  35 |     // Katex math wrapper / question prompt should be visible
  36 |     const katexWrapper = page.locator('.katex-wrapper').first();
  37 |     await expect(katexWrapper).toBeVisible({ timeout: 10000 });
  38 | 
  39 |     // Question palette header
  40 |     const paletteHeader = page.locator('h4').filter({ hasText: /NTA Question Palette/i }).first();
  41 |     await expect(paletteHeader).toBeVisible();
  42 |   });
  43 | 
  44 |   test('should allow student option selection and question navigation', async ({ page }) => {
  45 |     await setupPageAndLaunch(page);
  46 | 
  47 |     // Wait for exam interface
  48 |     const questionHeader = page.locator('span').filter({ hasText: /Question 1 of/i }).first();
  49 |     await expect(questionHeader).toBeVisible({ timeout: 15000 });
  50 | 
  51 |     // Option selection
  52 |     const firstOption = page.locator('.space-y-3 button').first();
  53 |     await expect(firstOption).toBeVisible({ timeout: 5000 });
  54 |     await firstOption.click();
  55 |     await page.waitForTimeout(300);
  56 | 
  57 |     // Next Question button
  58 |     const nextBtn = page.getByRole('button', { name: /Next Question/i });
  59 |     await expect(nextBtn).toBeVisible();
> 60 |     await nextBtn.click();
     |                   ^ Error: locator.click: Test timeout of 60000ms exceeded.
  61 |     await page.waitForTimeout(300);
  62 | 
  63 |     // Verify question moved to Question 2
  64 |     const question2Header = page.locator('span').filter({ hasText: /Question 2 of/i }).first();
  65 |     await expect(question2Header).toBeVisible({ timeout: 5000 });
  66 |   });
  67 | 
  68 |   test('offline mode resilience verification', async ({ page, context }) => {
  69 |     await setupPageAndLaunch(page);
  70 | 
  71 |     // Verify CBT Engine loaded
  72 |     const engineBadge = page.locator('span').filter({ hasText: 'NTA CBT ENGINE' }).first();
  73 |     await expect(engineBadge).toBeVisible({ timeout: 15000 });
  74 | 
  75 |     // Simulate network disconnection
  76 |     await context.setOffline(true);
  77 |     await page.waitForTimeout(500);
  78 | 
  79 |     // Verify engine remains rendered without crashing
  80 |     await expect(engineBadge).toBeVisible();
  81 | 
  82 |     // Verify offline badge indicator
  83 |     const offlineBadge = page.locator('text=/IndexedDB Offline Mode|Offline/i').first();
  84 |     await expect(offlineBadge).toBeVisible({ timeout: 5000 });
  85 | 
  86 |     // Restore network
  87 |     await context.setOffline(false);
  88 |   });
  89 | });
  90 | 
  91 | 
  92 | 
```