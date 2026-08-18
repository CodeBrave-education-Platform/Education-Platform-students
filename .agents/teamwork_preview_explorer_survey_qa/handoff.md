# QA & Testing Harness Survey Report

**Author**: Explorer Subagent (Testing & QA Scope)  
**Date**: 2026-08-18  
**Working Directory**: `d:\education portal\.agents\teamwork_preview_explorer_survey_qa\`  
**Target Recipient**: Orchestrator (`4bca80a4-c508-4a4c-a304-15b7f630e524`)  

---

## 1. Observation

Direct code observations from workspace survey:

### A. Package Configuration & Test Scripts
- **File**: `package.json` (`lines 5-10`, `lines 41-45`)
  ```json
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "next start",
    "lint": "next lint"
  },
  "devDependencies": {
    "@playwright/test": "^1.62.1",
    "eslint": "^9",
    "eslint-config-next": "16.2.6"
  }
  ```
  - **Finding**: `@playwright/test` is installed (`^1.62.1`), but `package.json` has **no `"test"` or `"test:e2e"` script**.
  - **Finding**: No unit test runner (Jest, Vitest) is installed.
  - **Finding**: Next.js is version `16.2.6` (React `19.2.4`), requiring async header/cookie APIs (`cookies()`, `headers()`, `params`, `searchParams`).

### B. Existing Playwright Harness
- **File**: `playwright.config.js` (`lines 1-44`)
  - Configures `testDir: './tests'`, `reporter: 'html'`, `baseURL: 'http://localhost:3000'`.
  - Configures `webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI }`.
  - Configures browser projects: `chromium`, `firefox`, `webkit`, `Mobile Chrome`, `Mobile Safari`.
- **Existing Test Files**:
  1. `tests/exam-engine.spec.js` (`lines 1-35`):
     - Contains an incomplete stub where core assertions are commented out (`lines 9-24`, `lines 30-33`).
  2. `tests/gamification.spec.js` (`lines 1-95`):
     - Demonstrates route mocking pattern via `page.route('**/rest/v1/profiles*', ...)` and `page.route('**/auth/v1/user', ...)`.
     - Tests gamification HUD, global leaderboard, ranker discounts, and AI study mentor widget.

### C. Database & API Routes Inspection
- **13 Next.js API Routes Audited**:
  1. `src/app/api/test-series/grade/route.js` (`lines 1-125`):
     - Receives `{ examId, answers, secondsRemaining, durationMinutes }`.
     - Authenticates via `supabase.auth.getUser()`.
     - Queries `test_exams` for `questions` and `marks_scheme`.
     - Calculates score (`+4` correct, `-1` incorrect).
     - Inserts into `test_attempts` with `user_id: user.id`.
     - Updates `profiles.xp`, `profiles.streak`, `profiles.rank_badge`.
  2. `src/app/api/razorpay/order/route.js` (`lines 1-57`):
     - Creates order using `Razorpay` SDK with `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
  3. `src/app/api/razorpay/verify/route.js` (`lines 1-112`):
     - Verifies HMAC signature using `verifyWebhookSignature(order_id + '|' + payment_id, razorpay_signature, secret)`.
     - For `packageId` (lines 56-73):
       ```javascript
       const { error: pkgError } = await supabase.from('invoices').insert([{
         profile_id: user.id, // BUG: Column in DB is user_id, NOT profile_id
         package_id: packageId,
         razorpay_payment_id: razorpay_payment_id,
         razorpay_order_id: razorpay_order_id, // BUG: Column razorpay_order_id does not exist in schema
         amount_paid: amountPaid,
         status: 'captured',
         invoice_date: new Date().toISOString()
       }]);
       ```
     - For `batchId` / `courseId` (lines 76-106): Calls RPC `execute_atomic_batch_onboarding` / `execute_atomic_student_onboarding`.
  4. `src/app/api/razorpay/webhook/route.js` (`lines 1-74`):
     - Validates `x-razorpay-signature` if `RAZORPAY_WEBHOOK_SECRET` exists.
     - On `payment.captured` / `order.paid`, inserts into `enrollments` with `status: 'ACTIVE'` (inconsistent uppercase vs `'active'`), without idempotency / `ON CONFLICT` handling.
  5. `src/app/api/downloads/route.js` (`lines 1-169`):
     - Verifies session, rate-limits via Upstash Redis (5/min), checks active enrollment in `enrollments` or `batch_enrollments`, generates signed URL from Supabase Storage `secure-assets`.
  6. `src/app/api/cache/invalidate/route.js` (`lines 1-89`):
     - Verifies secret bearer token or admin cookie, purges keys in Redis asynchronously.
  7. `src/app/api/live/classroom/route.js` (`lines 1-321`):
     - Authenticates user, manages dynamic polling via Redis or memory.
  8. `src/app/api/live/token/route.js` (`lines 1-62`):
     - Generates LiveKit JWT access token based on profile role.
  9. `src/app/api/video/token/route.js` (`lines 1-86`):
     - Checks course enrollment, signs HMAC SHA256 token for video streaming.
  10. `src/app/api/test-series/heartbeat/route.js` (`lines 1-31`):
      - Sets 20s TTL heartbeat key in Redis.
  11. `src/app/api/notifications/dispatch-invoice/route.js` (`lines 1-42`):
      - Dispatches simulated invoice payload via Email & WhatsApp.
  12. `src/app/api/telemetry/route.js` (`lines 1-18`):
      - Logs production exceptions safely.
  13. `src/app/api/debug-courses/route.js` (`lines 1-33`):
      - Diagnostic route returning session, courses, and profiles.

### D. UI Component Grid Layouts
- **Courses Page**: `src/app/courses/page.jsx` (`lines 212-328`):
  - Currently a basic 2-column grid (`grid grid-cols-1 md:grid-cols-2 gap-8`).
  - Fixed banner height `h-56` with standard image tag (`<img src={course.cover} ... className="w-full h-full object-cover" />`).
  - Client-side enrollment directly executes `supabase.from('enrollments').insert(...)` and `supabase.from('invoices').insert(...)` from browser.
- **Test Series Hub**: `src/app/test-series/TestSeriesHubClient.jsx` (`lines 250-300`):
  - Currently a 3-column grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`).
  - Package header uses fixed height `h-40` with `<Image fill className="object-cover" />`.
  - Accordion expansion expands in-place without Bento asymmetrical layout.

---

## 2. Logic Chain

1. **Test Infrastructure Readiness**:
   - `playwright` is present in `node_modules` and `devDependencies`.
   - `playwright.config.js` is already configured to automatically boot `npm run dev` at `http://localhost:3000`.
   - Adding `"test": "playwright test"` and `"test:e2e": "playwright test"` to `package.json` gives immediate CLI execution capability.

2. **Deterministic Verification Methodology**:
   - **For UI & Client-Side Flows**: Playwright route interception (`page.route()`) allows completely deterministic mocking of Supabase Auth, Profiles, Courses, Test Packages, and Razorpay modal responses. This guarantees tests pass independently of live network/cloud availability.
   - **For API & Database Integrity**:
     - Direct API route tests using Playwright's `request` context can execute HTTP requests against the local Next.js server.
     - Testing server-side Supabase calls deterministically requires valid test fixtures and seeds that respect foreign keys.

3. **Critical Database Bugs & Constraint Vulnerabilities Identified**:
   - **Bug 1 (`invoices` table column drift)**:
     - `supabase/migrations/02_monetization.sql` defines `invoices.user_id` (NOT `profile_id`).
     - `src/app/api/razorpay/verify/route.js` (`line 58`) inserts `profile_id: user.id` and `razorpay_order_id`.
     - In PostgreSQL, inserting non-existent columns throws `42703 (undefined_column)`.
     - Fix: Update `src/app/api/razorpay/verify/route.js` to call the designated RPC `execute_atomic_package_onboarding` (defined in `supabase/migrations/20260530150000_15_test_series_payments.sql`) or align columns with `user_id`.
   - **Bug 2 (`fk_test_attempts_user_profiles` constraint)**:
     - `supabase/migrations/20260530140000_14_test_series.sql` defines `fk_test_attempts_user_profiles` referencing `public.profiles(id)`.
     - Submitting a test via `/api/test-series/grade` without a corresponding row in `public.profiles` throws FK violation code `23503`.
     - Fix: Ensure user profile creation is guaranteed before test submission and test seeds create `profiles` records.
   - **Bug 3 (`assessments` table column mismatch in course exams)**:
     - `src/app/learn/[courseId]/exams/[assessmentId]/actions.js` (`lines 48, 209`) selects `end_window` and `start_window`.
     - In `supabase/migrations/20260529083527_07_jee_pipeline.sql`, columns are named `scheduled_start` and `scheduled_end`.
     - Fix: Align `actions.js` to select `scheduled_start` and `scheduled_end`.
   - **Bug 4 (`status` casing & idempotency in Webhook)**:
     - `src/app/api/razorpay/webhook/route.js` (`line 50`) inserts `status: 'ACTIVE'`, whereas database schema defaults and RPCs use lowercase `'active'`.
     - Duplicate webhook invocations will fail due to `unique(user_id, course_id)`.
     - Fix: Use `status: 'active'` and implement upsert or `execute_atomic_student_onboarding`.

4. **Bento Grid Redesign Requirements**:
   - Both `Courses` and `Test Packages` must be transformed from uniform equal-height cards into asymmetrical Bento Grids.
   - **Visual structure**:
     - Featured "Hero" Card (spans 2 columns or 2 rows on desktop): Highlights top-tier flagship batch / all-India mock series with live participant count badge, prominent 16:9 thumbnail, key syllabus highlights, and direct action.
     - Secondary Cards (standard 1-column): Compact feature badges, price chip, ranker discount indicator, clear aspect ratio thumbnail (`aspect-[16/10]` or `aspect-[4/3]`), hover micro-elevation (`translate-y-1`, subtle ring glow).
     - Accent Cards: Quick diagnostic test card or free starter drill.
   - **Zero Hydration Errors**: Guard dynamic values (`toLocaleDateString()`, `Date.now()`, `Math.random()`) behind `isMounted` state or deterministic props.
   - **Zero Mapping Key Warnings**: Use unique database UUIDs (`course.id`, `pkg.id`) as React keys.

---

## 3. Caveats

1. **Active Database Instance**: Live Supabase DB requires valid `.env.local` credentials. For offline / isolated CI runs, network route interception in Playwright (`page.route()`) provides full test determinism.
2. **Payment Gateway in Test**: Razorpay checkout in E2E tests should be tested in mock mode without triggering live banking APIs.
3. **Upstash Redis in Test**: Rate limiting and heartbeat gracefully fallback when Redis is unreachable.

---

## 4. Conclusion & Proposed Test Harness Architecture

### Proposed E2E Test Suite Matrix

| Test Suite File | Scope | Deterministic Mocking / Execution Strategy |
| :--- | :--- | :--- |
| `tests/e2e/test-packages-bento.spec.js` | Bento Grid UI for Test Packages (`/test-series`) | Mock `/rest/v1/test_packages*`, `/rest/v1/test_exams*`, `/rest/v1/invoices*`. Verify asymmetrical grid, thumbnail visibility, hover animations, filter tags, search, and responsive layout. |
| `tests/e2e/courses-bento.spec.js` | Bento Grid UI for Courses (`/courses`) | Mock `/rest/v1/courses*`, `/rest/v1/profiles*`. Verify Bento layout, ranker XP discount calculation (10% off for >1000 XP), subject filters, thumbnail aspect ratios, and zero hydration mismatches. |
| `tests/e2e/simulated-test-submission.spec.js` | CBT Exam Engine & Grading Flow | Mock `/rest/v1/test_exams*` and intercept `/api/test-series/grade`. Verify answer selection, question navigation, submit payload, score calculation (+4/-1), XP award, and redirect to scorecard. |
| `tests/e2e/course-enrollment-api.spec.js` | Payment & Enrollment API Endpoints | Direct API tests against `/api/razorpay/order`, `/api/razorpay/verify`, `/api/razorpay/webhook`, and `/api/notifications/dispatch-invoice`. Verify atomic RPC calls, HMAC signature verification, and invoice dispatch. |
| `tests/e2e/database-health-audit.spec.js` | System-Wide Database & Route Audit | Automated health audit across all 13 API endpoints, validating error handling, status codes (200, 400, 401, 403, 404, 429), and zero 500 unhandled exceptions. |

---

## 5. Verification Method

### Concrete Verification Commands

1. **Install / Update Test Scripts**:
   Add to `package.json`:
   ```json
   "scripts": {
     "test": "playwright test",
     "test:e2e": "playwright test",
     "test:report": "playwright show-report"
   }
   ```

2. **Execute Full Test Suite**:
   ```bash
   npx playwright test
   ```

3. **Execute Specific Bento Grid & QA Tests**:
   ```bash
   npx playwright test tests/e2e/test-packages-bento.spec.js
   npx playwright test tests/e2e/courses-bento.spec.js
   npx playwright test tests/e2e/simulated-test-submission.spec.js
   npx playwright test tests/e2e/course-enrollment-api.spec.js
   npx playwright test tests/e2e/database-health-audit.spec.js
   ```

4. **Lint & Build Verification**:
   ```bash
   npm run lint
   npm run build
   ```

### Invalidation Conditions
- Any hydration error (`Text content did not match server-rendered HTML`) in the browser console.
- Any React unique `key` warning in console.
- Any 500 error or foreign key violation (`23503`, `42703`) when submitting test attempts or verifying enrollments.
- Images rendering distorted, cropped awkwardly, or failing to load.

---

## 6. Actionable Implementation Plan for Subagents

1. **Step 1 (Fix Database Queries & Column Mismatches)**:
   - Fix `src/app/api/razorpay/verify/route.js`: use RPC `execute_atomic_package_onboarding` or correct column `user_id`.
   - Fix `src/app/learn/[courseId]/exams/[assessmentId]/actions.js`: align column names to `scheduled_start` and `scheduled_end`.
   - Fix `src/app/api/razorpay/webhook/route.js`: normalize `status: 'active'`.

2. **Step 2 (Redesign Bento Grids)**:
   - Refactor `src/app/courses/page.jsx` to modern Bento Grid layout (asymmetrical featured cards, responsive 1/2/3-column spans, clean typography, hover transitions, prominent thumbnails with `aspect-video` / `object-cover`).
   - Refactor `src/app/test-series/TestSeriesHubClient.jsx` to modern Bento Grid layout.

3. **Step 3 (Implement Test Harness & Specs)**:
   - Add `"test": "playwright test"` to `package.json`.
   - Write the 5 comprehensive test spec files in `tests/e2e/`.

4. **Step 4 (End-to-End Verification & Health Audit)**:
   - Run the full test suite and verify 100% pass rate with zero console warnings and zero hydration errors.
