# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gamification.spec.js >> Gamification and Telemetry Flows >> Global Leaderboard displays top rankers
- Location: tests\gamification.spec.js:38:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Global Rankings')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Global Rankings')

```

```yaml
- main:
  - link "ASENTRA Logo":
    - /url: /
    - img "ASENTRA Logo"
  - text: IIT JEE MAINS • ADVANCED • FOUNDATIONS
  - heading "Sign In to Portal" [level=2]
  - paragraph: Access high-fidelity mock environments & metrics
  - button "Sign In"
  - button "Register"
  - text: Email Address
  - textbox "name@student.in"
  - text: Password
  - button "Show"
  - textbox "••••••"
  - link "Forgot Password?":
    - /url: /forgot-password
  - checkbox "I agree to the Terms & Conditions and Privacy Policy ."
  - text: I agree to the
  - button "Terms & Conditions"
  - text: and
  - button "Privacy Policy"
  - text: .
  - button "Sign In to Portal"
  - text: OR
  - paragraph: ✨ Sign in with Google option is best
  - button "Continue with Google":
    - img
    - text: Continue with Google
  - text: "GRID REF: AS-2569 LATENCY: 0ms (LOCAL HOST) CAD Blueprint Vector Plot MOVE CURSOR HERE"
  - img
  - text: y x θ = 42.8° (40, 37) f(x) = ∫₀^∞ e^-x² dx = √π / 2
  - heading "Engineering the Future." [level=1]
  - paragraph: Access India's most advanced high-fidelity IIT-JEE curriculum, live telemetry, and zero-latency mock exams.
- button
- alert: ASENTRA | Authentication
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Gamification and Telemetry Flows', () => {
  4  |   // We'll mock the Supabase auth and profile data using Playwright's route interception
  5  |   // to ensure consistent testing without relying on the live DB.
  6  | 
  7  |   test.beforeEach(async ({ page }) => {
  8  |     // Mock the Supabase API calls
  9  |     await page.route('**/rest/v1/profiles*', async route => {
  10 |       const json = {
  11 |         id: 'mock-user-123',
  12 |         full_name: 'E2E Test Student',
  13 |         role: 'student',
  14 |         xp: 1500,
  15 |         level: 2,
  16 |         streak: 5
  17 |       };
  18 |       // Handle array response for select or single object for single()
  19 |       await route.fulfill({ json: route.request().url().includes('limit') ? [json] : json });
  20 |     });
  21 | 
  22 |     await page.route('**/auth/v1/user', async route => {
  23 |       await route.fulfill({ json: { user: { id: 'mock-user-123' } } });
  24 |     });
  25 |   });
  26 | 
  27 |   test('Gamification HUD displays correct XP and Streak on Dashboard', async ({ page }) => {
  28 |     // Navigate to dashboard
  29 |     await page.goto('/dashboard?tab=learning');
  30 | 
  31 |     // Check if the Gamification HUD is visible
  32 |     await expect(page.locator('text=Level 2 Ranker')).toBeVisible();
  33 |     await expect(page.locator('text=1500 / 2000 XP')).toBeVisible();
  34 |     await expect(page.locator('text=5 Day')).toBeVisible();
  35 |     await expect(page.locator('text=Study Streak')).toBeVisible();
  36 |   });
  37 | 
  38 |   test('Global Leaderboard displays top rankers', async ({ page }) => {
  39 |     await page.goto('/dashboard?tab=learning');
  40 | 
  41 |     // Wait for the leaderboard to render
> 42 |     await expect(page.locator('text=Global Rankings')).toBeVisible();
     |                                                        ^ Error: expect(locator).toBeVisible() failed
  43 |     
  44 |     // Check if the mocked user is in the leaderboard
  45 |     await expect(page.locator('text=E2E Test Student')).toBeVisible();
  46 |     await expect(page.locator('text=1,500')).toBeVisible(); // XP
  47 |   });
  48 | 
  49 |   test('Gamified Pricing applies 10% Ranker Discount for >1000 XP', async ({ page }) => {
  50 |     // Mock course data
  51 |     await page.route('**/rest/v1/courses*', async route => {
  52 |       await route.fulfill({
  53 |         json: [{
  54 |           id: 'test-course',
  55 |           title: 'Test Physics Course',
  56 |           price: 5000,
  57 |           originalPrice: 10000,
  58 |           includedBookKit: { value: 1000 }
  59 |         }]
  60 |       });
  61 |     });
  62 | 
  63 |     await page.goto('/courses');
  64 | 
  65 |     // Wait for courses to load
  66 |     await expect(page.locator('text=Test Physics Course')).toBeVisible();
  67 | 
  68 |     // Since XP is 1500 (>1000), basePrice should be 90% of 5000 = 4500
  69 |     await expect(page.locator('text=10% Ranker Discount')).toBeVisible();
  70 |     await expect(page.locator('text=₹4,500')).toBeVisible(); // Expect discounted price
  71 |   });
  72 | 
  73 |   test('AI Study Mentor widget opens and responds', async ({ page }) => {
  74 |     await page.goto('/dashboard?tab=learning');
  75 | 
  76 |     // Open AI widget
  77 |     const aiButton = page.locator('.fixed.bottom-6.right-6 button');
  78 |     await aiButton.click();
  79 | 
  80 |     // Check header
  81 |     await expect(page.locator('text=AI Mentor')).toBeVisible();
  82 |     
  83 |     // Type a message
  84 |     const input = page.locator('input[placeholder="Ask a doubt..."]');
  85 |     await input.fill('What are Newtons Laws?');
  86 |     await input.press('Enter');
  87 | 
  88 |     // Check if user message appears
  89 |     await expect(page.locator('text=What are Newtons Laws?')).toBeVisible();
  90 | 
  91 |     // Wait for the simulated AI response
  92 |     await expect(page.locator('text=Based on the faculty\'s notes')).toBeVisible({ timeout: 5000 });
  93 |   });
  94 | });
  95 | 
```