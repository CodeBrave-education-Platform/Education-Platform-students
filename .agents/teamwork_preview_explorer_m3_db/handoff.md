# Milestone 3 Database Health & API E2E Testing Specification Handoff Report

## 1. Observation

Direct code examination of the education platform API endpoints, database schemas, and migration patches revealed the following architecture and exact contracts:

### 1.1 CBT Exam Grading Engine (`/api/test-series/grade/route.js`)
- **Route Handler**: `POST /api/test-series/grade` (lines 6-182).
- **Authentication**: Line 15 invokes `supabase.auth.getUser()`. If unauthenticated or token expired, returns HTTP 401 (`{ error: 'Unauthorized user session' }`).
- **Input Validation**: Lines 8-12 validate `examId` and `answers` payload. Missing fields return HTTP 400 (`{ error: 'Missing examId or answers payload' }`).
- **Exam Query**: Lines 22-30 query `test_exams` for `id, title, duration_minutes, questions, marks_scheme`. Missing exams return HTTP 404.
- **Questions Normalization**: Lines 33-42 handle both stringified JSON (`JSON.parse`) and native JSON arrays, with fallback to empty array on corruption.
- **Marking Scheme**: Lines 45-47 extract `positiveMarks = Number(examData.marks_scheme?.positive_marks ?? 4)` and `negativeMarks = -Math.abs(Number(examData.marks_scheme?.negative_marks ?? 1))`.
- **Blind Grading Evaluation**: Lines 54-72 evaluate submitted answers:
  - Unattempted (missing, null, empty string, or undefined `selected_option`): increments `unanswered`, no score penalty.
  - Correct answer (`Number(submittedOption) === Number(correctOption)`): increments `correct`, adds `+positiveMarks` to `rawScore`.
  - Incorrect answer: increments `incorrect`, adds `-negativeMarks` to `rawScore`.
- **Metric Calculations**: Lines 74-84:
  - `totalQuestions = questions.length`
  - `totalMarks = totalQuestions * positiveMarks`
  - `attemptedCount = correct + incorrect`
  - `score = Math.round(rawScore)`
  - `percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0`
  - `accuracy = attemptedCount > 0 ? Number(((correct / attemptedCount) * 100).toFixed(2)) : 0` (zero division guard).
  - `durationSeconds = Math.max(0, Math.min(totalDuration, totalDuration - remaining))`.
- **Database Persistence**: Lines 86-108 insert into `test_attempts` table (`user_id, exam_id, answers_payload, score, correct_count, incorrect_count, unanswered_count, total_duration_seconds, completed_at`).
- **Gamification Engine**: Lines 111-156:
  - Base XP: `earnedXp = correct * 10`.
  - High-Accuracy Bonus: `if (accuracy >= 80) earnedXp = Math.floor(earnedXp * 1.5)` (50% bonus).
  - Minimum XP floor: `if (earnedXp === 0 && correct > 0) earnedXp = 10`.
  - Daily Streak Logic:
    - Same calendar day: preserves `streak`.
    - Consecutive day (yesterday): increments `streak + 1`.
    - Lapsed (>1 day ago or null): resets `streak = 1`.
  - Rank Badge Tiering:
    - `newXp >= 10000` -> **Platinum**
    - `newXp >= 5000` -> **Gold**
    - `newXp >= 1000` -> **Silver**
    - `< 1000` -> **Bronze**
  - Database Update: Persists `xp, streak, rank_badge, last_active_date` into `public.profiles`.
- **Output Contract**: Lines 162-176 return HTTP 200 with complete results payload (`score, totalMarks, percentage, correctCount, incorrectCount, unattemptedCount, accuracy, attemptId, earnedXp, newXp, newStreak, rankBadge`).

---

### 1.2 Razorpay Payment Verification & Polymorphic Onboarding (`/api/razorpay/verify/route.js`)
- **Route Handler**: `POST /api/razorpay/verify` (lines 7-246).
- **Authentication**: Line 27 invokes `supabase.auth.getUser()`. Unauthorized sessions return HTTP 401.
- **Input Validation**: Lines 32-34 require `razorpay_order_id, razorpay_signature, razorpay_payment_id`. Missing fields return HTTP 400.
- **Cryptographic Signature Verification**: Lines 38-50:
  - Free-tier bypass: `if (razorpay_signature === 'free_tier_bypass' && (amount === 0 || !amount))` -> passes verification.
  - Free-tier boundary guard: If an attacker submits `free_tier_bypass` on a paid course (`amount > 0`), condition is false and HMAC verification fails -> HTTP 400 (`{ error: 'Signature verification failed' }`).
  - Standard HMAC check: Computes SHA256 HMAC of `orderId + '|' + paymentId` using secret `process.env.RAZORPAY_KEY_SECRET` via constant-time string comparison.
- **Polymorphic Onboarding & Database Integrity**: Lines 56-232:
  - **Courses** (`courseId` or `item_type === 'course'`): Executes atomic RPC `execute_atomic_student_onboarding` or fallback inserting into `invoices(user_id, profile_id, course_id, ...)`, upserting `enrollments(user_id, course_id, status: 'active')`, and updating `profiles.role = 'paid_student'`.
  - **Live Cohort Batches** (`batchId` or `item_type === 'batch'`): Executes atomic RPC `execute_atomic_batch_onboarding` or fallback inserting into `invoices(user_id, profile_id, batch_id, ...)`, upserting `batch_enrollments(user_id, batch_id, status: 'active')`, and updating `profiles.role = 'paid_student'`.
  - **Test Packages** (`packageId` or `item_type === 'package'`): Executes atomic RPC `execute_atomic_package_onboarding` or fallback inserting into `invoices(user_id, profile_id, package_id, ...)`, and updating `profiles.role = 'paid_student'`.
  - **Physical Books** (`bookId` or `item_type === 'book'`): Executes atomic RPC `execute_atomic_book_order` or fallback inserting into `book_orders(user_id, book_id, shipping_address, ...)` and `invoices(user_id, profile_id, book_id, ...)`.
- **Invoice Compatibility**: The route writes both `user_id` and `profile_id` to the `invoices` table to prevent foreign key errors and support migration 14 bi-directional sync trigger `trigger_sync_invoices_user_profile`.

---

### 1.3 Secure Downloads Access Control (`/api/downloads/route.js`)
- **Route Handler**: `GET /api/downloads` (lines 28-167).
- **Parameters**: Requires `file` and either `lessonId` or `batchId` as query params. Missing params return HTTP 400.
- **Authentication**: Line 45 checks `supabase.auth.getUser()`. Unauthorized sessions return HTTP 401.
- **Rate Limiting**: Lines 53-66 enforce Upstash Redis sliding window (10 downloads/60s).
- **Staff Role Bypass**: Lines 69-76 query `profiles.role`. Roles `admin`, `teacher`, and `instructor` bypass student enrollment checks completely.
- **Student Authorization Gates**: Lines 78-120:
  - Lesson Downloads: Resolves `course_id` from `lessons` table (404 if missing), then queries `enrollments` with case-insensitive check: `.eq('user_id', user.id).eq('course_id', lesson.course_id).in('status', ['active', 'ACTIVE'])`. Missing active enrollment returns HTTP 403 (`{ error: 'Forbidden: Active enrollment required' }`).
  - Batch Downloads: Queries `batch_enrollments` with case-insensitive check: `.eq('user_id', user.id).eq('batch_id', batchId).in('status', ['active', 'ACTIVE'])`. Missing active batch enrollment returns HTTP 403 (`{ error: 'Forbidden: Active batch enrollment required' }`).
- **Secure Signed URL Resolution**: Lines 123-162 generate a 60-second signed URL via `supabase.storage.from('secure-assets').createSignedUrl(filePath, 60)` and redirect with HTTP 307.

---

### 1.4 Database Schema Integrity & Migration 14 (`supabase/migrations/14_schema_integrity_and_qa_patch.sql`)
- **Profiles Table**: Added columns `xp` (INT, default 0), `streak` (INT, default 0), `rank_badge` (VARCHAR 50, default 'Cadet'), `last_active_date` (TIMESTAMPTZ).
- **Courses Table**: Added `instructor_id` (UUID FK -> `profiles(id)`), `status` ('published'|'draft'|'archived'), `badge`, `deleted_at`.
- **Invoices Table**: Added `profile_id` (FK -> `profiles(id)`), `batch_id` (FK -> `batches(id)`), `package_id` (FK -> `test_packages(id)`), `book_id` (FK -> `books(id)`), `razorpay_order_id` (TEXT).
- **Sync Trigger**: `trigger_sync_invoices_user_profile` automatically synchronizes `user_id` <-> `profile_id` on insert/update.
- **Assessments & Live Sessions**: `course_id` made nullable, `batch_id` (FK -> `batches(id)`) added for cohort live session and test gating.
- **Course Files Table**: `public.course_files` created with cascading FKs to `courses`, `batches`, and `lessons`.
- **Coursera Courses Table**: `public.coursera_courses` created for catalog demonstrations.
- **Row Level Security (RLS)**: Strict RLS policies enabled for all tables (`invoices, test_attempts, enrollments, courses, profiles, course_files, test_packages, test_exams, batches, batch_enrollments, coursera_courses, assessments, live_sessions`).

---

## 2. Logic Chain

1. **CBT Exam Engine Logic**:
   - The test submission loop requires verification of three distinct answer states: Correct (+4), Incorrect (-1), and Unattempted (+0).
   - In real-world submissions, answers may contain option indices formatted as strings (e.g. '0') or numbers (e.g. 0). The API coerces `Number(ans.selected_option)` and `Number(q.correct_option_index)`, ensuring type mismatches do not cause false negative grading.
   - When accuracy is >= 80%, the 50% XP multiplier must activate. When accuracy is < 80%, standard 10 * correct applies.
   - Streak updates depend on temporal distance: same-day activity maintains the streak count, yesterday activity increments it by 1, and lapsed activity resets it to 1.
   - Rank badges transition deterministically at 1,000 XP (Silver), 5,000 XP (Gold), and 10,000 XP (Platinum).

2. **Payment Verification & Security Boundary Logic**:
   - Razorpay HMAC verification concatenates `orderId + '|' + paymentId` and computes SHA256 HMAC using the server secret key.
   - The free-tier bypass must be guarded: `razorpay_signature === 'free_tier_bypass'` is strictly only valid when `amount === 0` or is falsy. If an attacker submits a paid item with `free_tier_bypass`, the route rejects the signature and aborts onboarding.
   - Polymorphic entity onboarding routes across 4 distinct entity types: `course`, `batch`, `package`, and `book`.
   - In all onboarding flows, the invoice record requires both `user_id` and `profile_id` to satisfy relational constraints without foreign key violations.

3. **Downloads Access Control Logic**:
   - Staff roles (`admin`, `teacher`, `instructor`) must bypass enrollment checks so educators can preview and download study material.
   - Student authorization requires checking both lowercase `'active'` and uppercase `'ACTIVE'` enrollment statuses in the database.
   - Non-enrolled students and students with revoked enrollments must be rejected with HTTP 403.
   - Download links are signed with a 60-second TTL to prevent URL sharing and hotlinking.

4. **Integration into Playwright E2E Suite**:
   - Playwright\'s `request` fixture enables direct API integration testing against Next.js route handlers.
   - Playwright\'s `page.route` allows end-to-end UI testing with deterministic mock database states.

---

## 3. Caveats

- **Network / Redis Rate Limiting**: The Upstash Redis rate limiter in `/api/downloads` gracefully catches connection exceptions and falls back to allowing requests if Redis environment variables are unconfigured in local test environments.
- **Third-Party Razorpay API**: The Razorpay order generation route (`/api/razorpay/order`) calls the Razorpay SDK. In automated CI/E2E environments without live internet credentials, the Razorpay order creation and webhook calls are verified via local HMAC calculation and mocked route handlers.
- **Database Environment**: All foreign key relations and atomic RPCs are specified in `14_schema_integrity_and_qa_patch.sql`. Verification tests support both live Supabase databases and simulated test fixtures.

---

## 4. Conclusion & Recommended Test Specifications for `tests/database-health.spec.js`

The Playwright test suite for database health and API integrity must be implemented in `tests/database-health.spec.js` covering the following 4 structured test suites and 16 granular test cases:

### Suite A: CBT Exam Grading API & Gamification Engine (`/api/test-series/grade`)
1. **Test A1 (Perfect Score & 80% Accuracy Bonus)**:
   - Submit all correct answers (including string '0' and number 0 option indices).
   - Assert: HTTP 200, `score === totalMarks`, `accuracy === 100`, `earnedXp` receives 50% bonus (correct * 10 * 1.5), `attemptId` returned.
2. **Test A2 (Negative Marking & Unattempted Questions)**:
   - Submit 2 correct, 2 incorrect, 1 unattempted question.
   - Assert: HTTP 200, `correctCount === 2`, `incorrectCount === 2`, `unattemptedCount === 1`, `score === (2*4 - 2*1) === 6`, `accuracy === 50%`, `earnedXp === 20` (no bonus).
3. **Test A3 (Streak Progression Mechanics)**:
   - Case A: User with `last_active_date` yesterday -> streak increments from 3 to 4.
   - Case B: User with `last_active_date` today -> streak stays 4.
   - Case C: User with lapsed `last_active_date` (>48h ago) -> streak resets to 1.
4. **Test A4 (Rank Badge Tier Escalation)**:
   - Simulate XP threshold crossings:
     - XP < 1000: 'Bronze'
     - XP 1000 - 4999: 'Silver'
     - XP 5000 - 9999: 'Gold'
     - XP >= 10000: 'Platinum'
5. **Test A5 (Unauthorized & Validation Error Contracts)**:
   - Unauthenticated request -> HTTP 401 (`Unauthorized user session`).
   - Missing `examId` or `answers` -> HTTP 400.
   - Non-existent `examId` -> HTTP 404 (`Exam not found`).

---

### Suite B: Razorpay Verification & Polymorphic Entity Onboarding (`/api/razorpay/verify`)
6. **Test B1 (Valid Cryptographic HMAC Verification)**:
   - Generate SHA256 HMAC of `orderId + '|' + paymentId` with server secret.
   - Assert: HTTP 200, `success === true`, invoice generated, student role upgraded.
7. **Test B2 (Tampered Signature / Order ID Rejection)**:
   - Tamper with payment ID or signature string.
   - Assert: HTTP 400 (`Signature verification failed`).
8. **Test B3 (Free-Tier Bypass Security Boundary)**:
   - Case A: `razorpay_signature === 'free_tier_bypass'` with `amount === 0` -> HTTP 200 (access granted).
   - Case B (Adversarial attack): `razorpay_signature === 'free_tier_bypass'` with `amount === 499900` (paid course) -> HTTP 400 (rejected!).
9. **Test B4 (Polymorphic Entity Onboarding - Course, Batch, Package, Book)**:
   - Onboard course -> verifies `invoices(course_id)` + `enrollments(status: 'active')`.
   - Onboard batch -> verifies `invoices(batch_id)` + `batch_enrollments(status: 'active')`.
   - Onboard test package -> verifies `invoices(package_id)` + `profiles(role: 'paid_student')`.
   - Onboard book -> verifies `invoices(book_id)` + `book_orders(shipping_address)`.
10. **Test B5 (Dual Foreign Key Integrity `user_id` / `profile_id`)**:
    - Verify invoice creation writes both `user_id` and `profile_id` matching authenticated student ID without database FK exceptions.

---

### Suite C: Secure Downloads Access Control (`/api/downloads`)
11. **Test C1 (Missing Parameters & Unauthenticated Access)**:
    - No query params -> HTTP 400.
    - No session token -> HTTP 401.
12. **Test C2 (Staff Role Bypass for Admin / Teacher / Instructor)**:
    - Admin/Instructor accesses lesson/batch file without enrollment -> HTTP 307 redirect with signed URL.
13. **Test C3 (Student Active Enrollment Verification - Case Insensitive)**:
    - Student with `status === 'active'` -> HTTP 307.
    - Student with `status === 'ACTIVE'` -> HTTP 307.
14. **Test C4 (Student Forbidden on Revoked or Missing Enrollment)**:
    - Student with `status === 'revoked'` -> HTTP 403 (`Forbidden: Active enrollment required`).
    - Student with no enrollment record -> HTTP 403.
15. **Test C5 (Non-Existent Lesson 404 Guard)**:
    - Request invalid `lessonId` -> HTTP 404 (`Lesson not found`).

---

### Suite D: Database Connection & Schema Health Checks
16. **Test D1 (Schema Integrity & Column Parity)**:
    - Verify all critical columns exist: `profiles.xp, profiles.streak, profiles.rank_badge, invoices.batch_id, invoices.package_id, invoices.book_id, assessments.batch_id, course_files, coursera_courses`.

---

## 5. Verification Method

To independently verify all database health, cryptographic, and API contract specifications:

1. **Run Unit & Empirical Stress Test Suite**:
   ```bash
   node tests/challenge_m2_apis.js
   node tests/empirical_m2_verification.mjs
   ```
   *Expected Outcome*: 23/23 tests pass with 0 failures across grading calculations, HMAC signatures, free tier bypass, and downloads access control.

2. **Run Playwright E2E Test Suite**:
   ```bash
   npx playwright test tests/database-health.spec.js --project=chromium
   ```
   *Expected Outcome*: All test cases in `tests/database-health.spec.js` pass cleanly without timeout, unhandled promise rejection, or 500 errors.

3. **Files to Inspect**:
   - `d:/education portal/src/app/api/test-series/grade/route.js`
   - `d:/education portal/src/app/api/razorpay/verify/route.js`
   - `d:/education portal/src/app/api/downloads/route.js`
   - `d:/education portal/supabase/migrations/14_schema_integrity_and_qa_patch.sql`
   - `d:/education portal/tests/database-health.spec.js`