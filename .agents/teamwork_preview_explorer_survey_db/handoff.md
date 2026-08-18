# Database & API Scope Survey Report (Step 0)

**Date**: 2026-08-18  
**Author**: Explorer Subagent (Database & API Scope)  
**Target Working Directory**: `d:\education portal\.agents\teamwork_preview_explorer_survey_db\`  
**Milestone**: Step 0 (Survey & QA Audit)

---

## 1. Observation

Direct code and schema audit observations across all database connections, API routes, server actions, client components, and migration files:

### 1.1 Supabase Client Architecture
- **Browser Client (`src/utils/supabase/client.js:1-42`)**:
  - Uses `@supabase/ssr` `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)` with custom cookie options and wrapped `auth.getUser` error handling.
  - Used in 11+ client components including `courses/page.jsx`, `CourseDetailsClient.jsx`, `LessonPlayerClient.jsx`, `DashboardClient.jsx`, `ProfileClient.jsx`, `TestSeriesHubClient.jsx`, `books/page.jsx`, `batches/page.jsx`, `coursera/page.js`.
- **Server Client (`src/utils/supabase/server.js:1-35`)**:
  - Uses `@supabase/ssr` `createServerClient` with `cookies()` and `headers()` from `next/headers`.
  - Used across Server Components (`page.js`, `dashboard/page.jsx`, `courses/[id]/page.jsx`, `test-series/page.js`, `test-series/engine/[examId]/page.js`, `test-series/analytics/[attemptId]/page.js`, `learn/[courseId]/page.jsx`, `learn/[courseId]/exams/[assessmentId]/page.jsx`, `leaderboard/page.jsx`, `profile/page.jsx`) and Server Actions (`actions.js`).
- **Middleware Client (`src/utils/supabase/middleware.js:1-104` / `src/middleware.js`)**:
  - Intercepts requests, refreshes Supabase session tokens, syncs cookies to headers, and guards `/dashboard`, `/learn`, `/books`, `/test-series`, `/checkout`.
- **Admin / Service Role Client (`src/app/api/razorpay/webhook/route.js:39-44`)**:
  - Uses `@supabase/supabase-js` `createClient(url, SUPABASE_SERVICE_ROLE_KEY || ANON_KEY)` to perform asynchronous fulfillment bypassing RLS.

### 1.2 Next.js API Routes & Server Actions
- `POST /api/razorpay/order` (`src/app/api/razorpay/order/route.js:1-57`): Order creation for courses, batches, packages, and books.
- `POST /api/razorpay/verify` (`src/app/api/razorpay/verify/route.js:1-112`): Cryptographic HMAC verification and onboarding dispatcher.
- `POST /api/razorpay/webhook` (`src/app/api/razorpay/webhook/route.js:1-74`): Webhook fallback enrollment ingestion.
- `POST /api/test-series/grade` (`src/app/api/test-series/grade/route.js:1-125`): CBT server-authoritative grading, attempts storage, and XP/streak gamification update.
- `POST /api/test-series/heartbeat` (`src/app/api/test-series/heartbeat/route.js:1-31`): Redis session heartbeat with 20s TTL.
- `GET /api/downloads` (`src/app/api/downloads/route.js:1-169`): Upstash rate-limited signed asset download redirector.
- `GET/POST /api/live/classroom` (`src/app/api/live/classroom/route.js:1-321`): Synchronous cohort poll and doubt submission (`lesson_doubts`).
- `POST /api/live/token` (`src/app/api/live/token/route.js:1-62`): LiveKit WebRTC access token issuer with role-based publish/subscribe permissions.
- `POST /api/video/token` (`src/app/api/video/token/route.js:1-86`): Signed video playback tokens with 15m expiration.
- `POST /api/cache/invalidate` (`src/app/api/cache/invalidate/route.js:1-89`): Cache-aside Redis purger for courses, assessments, and batches.
- `GET /api/debug-courses` (`src/app/api/debug-courses/route.js:1-33`): Diagnostic join route between `courses` and `profiles`.
- `POST /api/notifications/dispatch-invoice` (`src/app/api/notifications/dispatch-invoice/route.js:1-42`): Receipt dispatch formatter.
- `POST /api/telemetry` (`src/app/api/telemetry/route.js:1-18`): Error ingest sink.
- `GET /auth/callback` (`src/app/auth/callback/route.js:1-27`): OAuth code-for-session exchange.
- Server Actions in `src/app/learn/[courseId]/exams/[assessmentId]/actions.js`:
  - `startAssessmentAttemptAction`: Checks time windows and initializes attempt.
  - `gradeAssessmentAction`: Server-side blind grading against `questions` table and auto-close timer enforcement.

### 1.3 Table Schema & Foreign Key Discrepancies
- **Missing `instructor_id` & `status` on `courses`**:
  - `02_monetization.sql:1` created `courses (id, title, description, price, level, created_at)`.
  - `05_lms_schema.sql:60` policy references `courses.instructor_id`.
  - `09_ops_security_patch.sql:7-8` policy references `courses.status = 'published'`.
  - `dashboard/page.jsx:122` and `debug-courses/route.js:14` execute `.from('courses').select('*, profiles(full_name)')`. Without `courses.instructor_id REFERENCES public.profiles(id)`, PostgREST relation joins fail with `Could not find a relationship between 'courses' and 'profiles'`.
- **Missing `batch_id` & `razorpay_order_id` on `invoices`**:
  - `02_monetization.sql:3` created `invoices (id, user_id, course_id, razorpay_payment_id, amount_paid, currency, status, invoice_date)`.
  - `13_secure_onboarding_and_trigger.sql:139` inserts `(user_id, batch_id, ...)`.
  - `dashboard/page.jsx:168` selects `*, courses(title), batches(title)` which fails without FK `invoices.batch_id REFERENCES batches(id)`.
  - `api/razorpay/verify/route.js:61` attempts to insert `razorpay_order_id` (column absent).
  - `api/razorpay/verify/route.js:58`, `courses/page.jsx:109`, and `test-series/engine/[examId]/page.js:62` use `profile_id` instead of `user_id`.
- **Missing Gamification Columns on `profiles`**:
  - `00_profiles.sql:4-22` defines `profiles` without `xp`, `streak`, `rank_badge`, `last_active_date`.
  - `api/test-series/grade/route.js:95-111` updates `xp, streak, rank_badge, last_active_date`.
  - `leaderboard/page.jsx:18` selects `xp, streak, rank_badge` and orders by `xp DESC`.
  - `courses/page.jsx:56` selects `xp`.
- **Missing Columns on `assessments` & `live_sessions`**:
  - `07_jee_pipeline.sql:13-21` defines `assessments` with `course_id NOT NULL` and columns `scheduled_start, scheduled_end`.
  - `DashboardClient.jsx:212` and `learn/.../page.jsx:51` filter `assessments` by `batch_id`.
  - `DashboardClient.jsx:213,260` and `learn/.../actions.js:48,209` select and order by `start_window, end_window`.
  - `07_jee_pipeline.sql:2-10` defines `live_sessions` with `course_id NOT NULL` and lacks `batch_id`. `DashboardClient.jsx:207` filters `live_sessions` by `batch_id`.
- **Missing Table `course_files`**:
  - Never created in any migration DDL (only mentioned via `ALTER TABLE IF EXISTS` in `05_lms_schema.sql`).
  - `DashboardClient.jsx:215` queries `.from('course_files').select('*').eq('batch_id', selectedCohortBatch.id)`.
- **Missing Columns on `test_packages`**:
  - `14_test_series.sql:5-13` defines `test_packages` with `id, title, target_exam_tag, total_tests_count, test_distribution, price_ledger, created_at`.
  - `TestSeriesHubClient.jsx:271,283,308` expects `thumbnail_url, campus_branch, description`.
- **Missing Table `coursera_courses`**:
  - Referenced in `src/app/coursera/page.js:150` for demo catalog management.

### 1.4 Broken Queries & Vulnerabilities
1. **`DashboardClient.jsx:560` Direct RPC Call without Secret Token**:
   - `DashboardClient.jsx` calls `supabase.rpc('execute_atomic_batch_onboarding', { _user_id: user.id, _batch_id: batch.id, _payment_id: paymentId, _amount: 0 })`.
   - Migration 13 requires 5 arguments including `_secret_token` matching `secure_config.onboarding_secret_token`. This causes a Postgres signature mismatch or unhandled exception.
2. **`api/razorpay/verify/route.js:57-73` Package Payment Insert**:
   - Uses `profile_id: user.id` (wrong column name) and `razorpay_order_id` (non-existent column) in a direct `invoices.insert(...)` call which is blocked by RLS policies on `invoices`.
   - Migration 15 defined `execute_atomic_package_onboarding(_user_id, _package_id, _payment_id, _amount, _secret_token)` which should be called instead.
3. **`test-series/engine/[examId]/page.js:62` CBT Engine Authorization Check**:
   - Queries `supabase.from('invoices').select('id').eq('profile_id', authenticatedUser.id).eq('package_id', exam.package_id)` — fails because `profile_id` does not exist on `invoices`.
4. **`courses/page.jsx:100-117` Direct Client Enrollment Bypass**:
   - Directly executes `supabase.from('enrollments').insert(...)` and `supabase.from('invoices').insert({ profile_id: ... })` from the browser rather than routing through `/api/razorpay/verify`.
5. **Status Enum Casing Inconsistency**:
   - `api/downloads/route.js:90` and `api/video/token/route.js:32` check `.eq('status', 'active')` (lowercase).
   - `api/razorpay/webhook/route.js:50` inserts `status: 'ACTIVE'` (uppercase). This breaks streaming and downloads for webhook-enrolled students.
6. **Hardcoded Non-UUID `bookId` in Book Checkout**:
   - `books/checkout/page.jsx:30,64` passes `bookId: 'book-cart-001'` instead of a valid UUID, throwing a Postgres type casting error during order placement.

---

## 2. Logic Chain

1. **Premise**: PostgREST constructs queries by introspecting Postgres schema foreign key relationships and table definitions.
2. **Step 1 (Schema Constraints)**: When `dashboard/page.jsx` or `debug-courses/route.js` requests `.select('*, profiles(full_name)')` on `courses`, PostgREST inspects foreign key constraints from `courses` to `profiles`. Because `courses` lacks an `instructor_id` foreign key referencing `profiles(id)`, the query throws a relation lookup error.
3. **Step 2 (Column Existence)**: When `invoices` is queried with `.eq('profile_id', ...)` or inserted with `profile_id` and `razorpay_order_id`, Postgres rejects the query with undefined column errors because `invoices` only contains `user_id`.
4. **Step 3 (RLS Enforcement)**: `invoices` table has RLS enabled with SELECT policy for `auth.uid() = user_id`, but has NO insert policy for regular authenticated users (only admin or SECURITY DEFINER functions). Direct client-side `invoices.insert(...)` calls fail under RLS unless routed through designated SECURITY DEFINER RPCs (`execute_atomic_student_onboarding`, `execute_atomic_batch_onboarding`, `execute_atomic_package_onboarding`, `execute_atomic_book_order`).
5. **Step 4 (RPC Token Validation)**: Migration 13 hardened all onboarding RPCs to require `_secret_token` checked against `secure_config`. Direct browser calls from `DashboardClient.jsx` without the token fail validation.
6. **Step 5 (Case Sensitivity in SQL)**: Postgres text comparisons (`status = 'active'`) are strictly case-sensitive. Inserting `'ACTIVE'` in webhooks prevents `'active'` checks in downloads and video token generation from matching.

---

## 3. Caveats

- **External Services**: Razorpay credentials, Upstash Redis endpoints, and LiveKit credentials in `.env.local` depend on valid external API configurations. If keys are missing or invalid in local environments, mock fallbacks are in place in parts of the code.
- **pg_net & pg_cron Extensions**: Migration 06 references `pg_cron` and Migration 10 references `pg_net`. In local Supabase CLI or Postgres docker environments, these extensions may require explicit enablement or mock triggers if running outside cloud Supabase.
- **Bento Grid UI Redesign**: Redesigning Test Packages and Courses grids (Mission Item 1) requires coordinating with the Frontend Explorer/Implementer to ensure responsive card layouts, thumbnail aspect ratios, and no hydration mismatches.

---

## 4. Conclusion

The database schema and API integration have high architectural integrity, but contain localized schema mismatches, missing columns, foreign key join gaps, and field naming discrepancies that will cause runtime 500 errors and broken flows if not migrated and patched.

### Required SQL Migration (`20260530170000_17_comprehensive_schema_fix.sql`):
1. **`courses`**:
   - `ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;`
   - `ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';`
   - `ADD COLUMN IF NOT EXISTS cover_url TEXT;`
   - `ADD COLUMN IF NOT EXISTS subject TEXT;`
   - `ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.9;`
   - `ADD COLUMN IF NOT EXISTS students_count INTEGER DEFAULT 1200;`
   - `ADD COLUMN IF NOT EXISTS duration TEXT;`
   - `ADD COLUMN IF NOT EXISTS lessons_count INTEGER DEFAULT 24;`
   - `ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;`
2. **`invoices`**:
   - `ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;`
   - `ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;`
   - `ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;` (or create a generated/synced column to guarantee backward compatibility with both `user_id` and `profile_id`).
3. **`profiles`**:
   - `ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;`
   - `ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;`
   - `ADD COLUMN IF NOT EXISTS rank_badge TEXT DEFAULT 'Bronze';`
   - `ADD COLUMN IF NOT EXISTS last_active_date TIMESTAMPTZ DEFAULT now();`
4. **`assessments`**:
   - `ALTER COLUMN course_id DROP NOT NULL;`
   - `ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE;`
   - `ADD COLUMN IF NOT EXISTS start_window TIMESTAMPTZ;`
   - `ADD COLUMN IF NOT EXISTS end_window TIMESTAMPTZ;`
5. **`live_sessions`**:
   - `ALTER COLUMN course_id DROP NOT NULL;`
   - `ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE;`
6. **`course_files`**:
   - Create table `public.course_files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE, batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE, lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE, file_name TEXT NOT NULL, file_path TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());`
   - Enable RLS and add policies.
7. **`test_packages`**:
   - `ADD COLUMN IF NOT EXISTS description TEXT;`
   - `ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;`
   - `ADD COLUMN IF NOT EXISTS campus_branch TEXT DEFAULT 'Hyderabad Main';`
   - Ensure RLS SELECT is open for both `anon` and `authenticated` roles.
8. **`coursera_courses`**:
   - Create table `public.coursera_courses` with RLS.
9. **`invoices` RLS & `execute_atomic_package_onboarding`**:
   - Grant execute permissions on RPC functions to authenticated users.

### Required Code Fixes:
1. `src/app/api/razorpay/verify/route.js`:
   - Replace direct `invoices.insert` for `packageId` with `supabase.rpc('execute_atomic_package_onboarding', { _user_id: user.id, _package_id: packageId, _payment_id: razorpay_payment_id, _amount: amountPaid, _secret_token: secret })`.
2. `src/app/test-series/engine/[examId]/page.js`:
   - Fix line 62 from `.eq('profile_id', ...)` to `.eq('user_id', ...)`.
3. `src/app/courses/page.jsx`:
   - Route post-payment handler through `POST /api/razorpay/verify` instead of direct client-side DB inserts.
4. `src/app/api/razorpay/webhook/route.js`:
   - Normalize enrollment status to lowercase `'active'`.
5. `src/app/books/checkout/page.jsx`:
   - Pass a valid seeded Book UUID (`b1000000-0000-0000-0000-000000000001`).
6. `src/app/dashboard/DashboardClient.jsx`:
   - Route batch enrollment through `/api/razorpay/verify` or a server action to securely supply `_secret_token`.

---

## 5. Verification Method

To independently verify all database connections and queries:

1. **Static Analysis & Type Checking**:
   - Run Next.js lint / build:
     ```powershell
     npm run lint
     ```
2. **Database Schema & Migration Validation**:
   - Check that all foreign keys and columns exist by querying PostgREST endpoints or testing migration scripts against local Postgres/Supabase instance.
3. **Simulated Test Taking & Grading Verification**:
   - Execute a POST request to `/api/test-series/grade` with valid `examId` and question payload:
     ```json
     {
       "examId": "00000000-0000-0000-0000-000000000001",
       "answers": { "q-1": { "selected_option": 1, "seconds_spent": 45 } },
       "secondsRemaining": 10500,
       "durationMinutes": 180
     }
     ```
   - Verify that `test_attempts` record is inserted with correct `user_id` and `score`, and that `profiles.xp` is incremented.
4. **Course & Package Enrollment Verification**:
   - Execute a POST request to `/api/razorpay/verify` with mock signature, `courseId`, `batchId`, or `packageId`, and verify atomic transaction execution without Postgres constraint violations.
5. **Invalidation Conditions**:
   - The findings are invalidated if `invoices` table column names are changed elsewhere or if custom PostgreSQL schemas other than `public` are used.
