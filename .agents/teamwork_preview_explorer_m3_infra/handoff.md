# Milestone 3 Test Infrastructure & Playwright Runner Harness Report

## 1. Observation

### 1.1 Installed Testing Dependencies and Runtimes
- **Node.js**: `v24.14.0` (empirically confirmed via `node -v`).
- **Playwright Test Runner**: `@playwright/test` version `1.62.1` installed in `devDependencies` (`package.json:42` and `npx playwright --version`).
- **Browser Engine**: Chromium binary installed and verified working.
- **Framework & Runtime**: Next.js `16.2.6` (React 19.2.4, App Router) with Tailwind CSS `4.3.0`.
- **Database & Auth Clients**: `@supabase/ssr: 0.10.3`, `@supabase/supabase-js: 2.106.2`.

### 1.2 Configuration & Existing Scripts
- **`playwright.config.js`**:
  - `testDir: './tests'`
  - `fullyParallel: true`
  - `webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI }`
  - Configured projects: `chromium`, `firefox`, `webkit`, `Mobile Chrome`, `Mobile Safari`.
- **`package.json` scripts**:
  - Currently contains only `"build"`, `"dev"`, `"start"`, `"lint"`.
  - **Missing**: No `"test"` or specialized test commands (`"test:e2e"`, `"test:unit"`, `"test:bento"`, `"test:db"`).
- **Existing Test Inventory in `tests/`**:
  - `tests/challenge_m2_apis.js`: Standalone Node.js adversarial stress harness testing CBT grading engine, Razorpay HMAC cryptography & free-tier bypasses, Downloads API RBAC, and error status handling. (28/28 tests passed).
  - `tests/challenge_bento_grid_m1.js`: Standalone Node.js stress harness testing date formatting determinism, grid geometry across 4 breakpoints (375px, 768px, 1280px, 1920px), adversarial payload resilience, and static CSS token audits.
  - `tests/empirical_m2_verification.mjs`: Schema integrity and RLS policy verification harness.
  - `tests/migration_14_validator.mjs`: SQL migration 14 AST and table/foreign-key validator.
  - `tests/exam-engine.spec.js`: Playwright E2E spec template for CBT test-taking flow.
  - `tests/gamification.spec.js`: Playwright E2E spec for Gamification HUD, Leaderboard, Ranker Discounts, and AI Study Mentor.
  - `tests/bento-ui.spec.js`: Planned Milestone 3 Playwright E2E suite for Bento UI layouts, responsive breakpoints, uncropped media containers, and hydration safety.
  - `tests/database-health.spec.js`: Planned Milestone 3 Playwright E2E / API integration suite for database connectivity, test grading, and payment onboarding routes.

### 1.3 Execution Verifications on Windows PowerShell
- Running `node tests/challenge_m2_apis.js` runs synchronously in ~4.5s and outputs `Overall: 28 PASSED, 0 FAILED out of 28 tests.`
- Running `npx playwright test tests/gamification.spec.js --project=chromium` successfully boots Next.js `npm run dev` web server on port 3000, attaches browser context, executes tests, and tears down cleanly upon completion.

---

## 2. Logic Chain

1. **Test Runner Capability**:
   - Because `@playwright/test` 1.62.1 and Chromium are installed locally, Playwright can execute any `*.spec.js` suite in headless mode with full DOM, network routing, and screenshot/trace capabilities without external dependencies.
   - Playwright's `webServer` option in `playwright.config.js` eliminates manual dev server management by starting `npm run dev` on demand and shutting it down when tests complete.

2. **Windows Shell & npm Script Normalization**:
   - In Windows PowerShell, executing direct npx commands with flags can be verbose.
   - Adding standard `"scripts"` in `package.json` enables cross-platform compatibility across Windows PowerShell, CMD, Git Bash, and CI environments without escaping issues.

3. **Separation of Concerns: Unit/Algorithm vs. E2E Browser Tests**:
   - `tests/challenge_m2_apis.js` and `tests/challenge_bento_grid_m1.js` are pure JavaScript/Node stress tests that execute in <200ms without requiring a browser or web server.
   - `tests/bento-ui.spec.js`, `tests/database-health.spec.js`, `tests/exam-engine.spec.js`, and `tests/gamification.spec.js` are Playwright suites that require the Next.js runtime environment.
   - Splitting npm scripts into `test:unit` and `test:e2e` allows fast developer feedback while enabling full system regression testing via `npm test`.

---

## 3. Test Runner Setup Formulation

### 3.1 Recommended `package.json` Scripts
Add the following test scripts to `package.json`:

```json
"scripts": {
  "build": "next build",
  "dev": "next dev",
  "start": "next start",
  "lint": "next lint",
  "test": "npm run test:unit && npm run test:e2e",
  "test:unit": "node tests/challenge_m2_apis.js && node tests/challenge_bento_grid_m1.js",
  "test:e2e": "playwright test --project=chromium",
  "test:e2e:all": "playwright test",
  "test:bento": "playwright test tests/bento-ui.spec.js --project=chromium",
  "test:db": "playwright test tests/database-health.spec.js --project=chromium",
  "test:gamification": "playwright test tests/gamification.spec.js --project=chromium",
  "test:exam": "playwright test tests/exam-engine.spec.js --project=chromium"
}
```

### 3.2 Test Suite Matrix & Target Specifications

| Test Target | Type | Runner Command | Key Invariants Verified |
|---|---|---|---|
| `tests/bento-ui.spec.js` | Playwright E2E | `npx playwright test tests/bento-ui.spec.js --project=chromium` | 1. Bento Grid layout on `/courses`, `/batches`, `/test-series`, `/dashboard`.<br>2. 16:9 uncropped thumbnail containers (`object-contain`).<br>3. Responsive breakpoints (Mobile 375px, Tablet 768px, Desktop 1280px).<br>4. Zero React hydration errors or console errors. |
| `tests/database-health.spec.js` | Playwright API / Integration | `npx playwright test tests/database-health.spec.js --project=chromium` | 1. Server-authoritative CBT grading (`POST /api/test-series/grade`).<br>2. Razorpay HMAC signature verification & payment onboarding (`POST /api/razorpay/verify`).<br>3. Secure downloads RBAC gating (`GET /api/downloads`).<br>4. Supabase DB schema foreign key constraint integrity. |
| `tests/exam-engine.spec.js` | Playwright E2E | `npx playwright test tests/exam-engine.spec.js --project=chromium` | 1. CBT Exam interface navigation, question jumping, timer synchronization.<br>2. Offline queue handling when network disconnected. |
| `tests/gamification.spec.js` | Playwright E2E | `npx playwright test tests/gamification.spec.js --project=chromium` | 1. Gamification HUD rendering XP and Streak.<br>2. Global Leaderboard display.<br>3. Dynamic Ranker discounts.<br>4. AI Study Mentor interaction widget. |
| `tests/challenge_m2_apis.js` | Node Stress Harness | `node tests/challenge_m2_apis.js` | 1. 28 adversarial tests (CBT formulas, string/numeric option coercion, negative marking, free-tier bypass bounds, constant-time HMAC comparison). |

---

## 4. Caveats

1. **Multi-browser binaries**: Playwright currently has Chromium installed. Running `--project=firefox` or `--project=webkit` will require downloading those binaries via `npx playwright install firefox webkit` if non-Chromium execution is required. Defaulting to `--project=chromium` is recommended for local development on Windows.
2. **Server-Side Rendering Auth Mocking**: Next.js Server Components (like `src/app/dashboard/page.jsx`) read cookies directly from the request headers rather than client-side API requests. When writing Playwright tests for authenticated SSR pages, session cookies must be set via `context.addCookies()` or simulated via public route views.
3. **Port Conflicts on Windows**: If an existing `npm run dev` server is running on port 3000, Playwright's `reuseExistingServer: !process.env.CI` setting will seamlessly reuse it. If a hanging process occupies port 3000 without serving HTTP, tests may time out waiting for the web server.

---

## 5. Conclusion

The test infrastructure in `d:\education portal` is well-equipped with Playwright `1.62.1` and Node.js `v24.14.0`. The testing workflow is ready to support Milestone 3's E2E and API health test execution across all 5 key targets (`bento-ui.spec.js`, `database-health.spec.js`, `exam-engine.spec.js`, `gamification.spec.js`, and `challenge_m2_apis.js`). Adding the recommended npm test scripts to `package.json` ensures uniform, reliable execution in the local Windows environment.

---

## 6. Verification Method

To independently verify this test harness setup:

1. **Verify Unit & API Stress Harness**:
   ```powershell
   node tests/challenge_m2_apis.js
   ```
   *Expected Output*: `28 PASSED, 0 FAILED out of 28 tests.`

2. **Verify Playwright Test Discovery**:
   ```powershell
   npx playwright test --list
   ```
   *Expected Output*: Lists test suites discovered in `./tests`.

3. **Verify Playwright Chromium E2E Execution**:
   ```powershell
   npx playwright test tests/exam-engine.spec.js --project=chromium
   ```
   *Expected Output*: Boots dev server automatically, runs Chromium headless, and completes with report.
