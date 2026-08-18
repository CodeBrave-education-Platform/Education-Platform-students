# Milestone 2: SQL Migration Scope Analysis & Blueprint Report

**Date**: 2026-08-18  
**Author**: Explorer Subagent (Milestone 2: SQL Migration Scope)  
**Target Working Directory**: `d:\education portal\.agents\teamwork_preview_explorer_m2_sql\`  
**Target Migration**: `supabase/migrations/14_schema_integrity_and_qa_patch.sql` / `supabase/migrations/20260530170000_14_schema_integrity_and_qa_patch.sql`  
**Parent Agent**: `orchestrator_1` (Conv ID: `4bca80a4-c508-4a4c-a304-15b7f630e524`)

---

## 1. Observation

Direct code audit and database schema inspections revealed the following structural, relational, and RLS policy deficiencies:

### 1.1 `courses` Table Foreign Key and Column Gaps
- **Observation 1.1.1**: `02_monetization.sql:1` defined `courses` with columns `(id, title, description, price, level, created_at)`.
- **Observation 1.1.2**: `src/app/dashboard/page.jsx:122` and `src/app/api/debug-courses/route.js:14` execute:
  ```javascript
  const { data, error: coursesError } = await supabase
    .from('courses')
    .select('*, profiles(full_name)')
  ```
  In PostgreSQL/PostgREST, this join fails with `Could not find a relationship between 'courses' and 'profiles'` because `courses.instructor_id` does not reference `public.profiles(id)`.
- **Observation 1.1.3**: `09_ops_security_patch.sql:7-8` defines a policy referencing `courses.status = 'published'`, but `status` was never defined in early base DDL.
- **Observation 1.1.4**: Bento grid frontend components (`src/app/courses/page.jsx:170-195`) expect fields `cover_url`, `thumbnail_url`, `subject`, `rating`, `students_count`, `duration`, `lessons_count`, `checklist`, and `badge`.

### 1.2 `invoices` Table Multi-Entity Relations and Field Mismatches
- **Observation 1.2.1**: `02_monetization.sql:3` created `invoices` with `user_id` referencing `profiles(id)`.
- **Observation 1.2.2**: `src/app/dashboard/page.jsx:168` queries:
  ```javascript
  const { data: invoicesData } = await supabase
    .from('invoices')
    .select('*, courses(title), batches(title)')
  ```
  This query fails if `invoices.batch_id` is missing or lacks a foreign key constraint to `public.batches(id)`.
- **Observation 1.2.3**: `src/app/api/razorpay/verify/route.js:57-65` inserts `package_id`, `razorpay_order_id`, and uses `profile_id: user.id` instead of `user_id`. `src/app/test-series/engine/[examId]/page.js:62` queries `.eq('profile_id', authenticatedUser.id)`. Missing `profile_id` or `razorpay_order_id` columns cause uncaught PostgreSQL 500 errors.

### 1.3 `assessments` and `live_sessions` Cohort Batch Gaps
- **Observation 1.3.1**: `07_jee_pipeline.sql:13-21` created `assessments` with `course_id NOT NULL` and columns `scheduled_start, scheduled_end`.
- **Observation 1.3.2**: `src/app/dashboard/DashboardClient.jsx:216-219` and `src/app/learn/[courseId]/exams/[assessmentId]/actions.js:48,209` execute:
  ```javascript
  supabase.from('assessments').select('*').eq('batch_id', selectedCohortBatch.id).order('start_window', { ascending: true })
  ```
  `assessments` lacked `batch_id`, `start_window`, and `end_window`. Furthermore, cohort assessments require `course_id` to be nullable (`ALTER COLUMN course_id DROP NOT NULL`).
- **Observation 1.3.3**: `07_jee_pipeline.sql:2-10` created `live_sessions` with `course_id NOT NULL`. `DashboardClient.jsx:210-214` queries `.eq('batch_id', selectedCohortBatch.id)` which requires `live_sessions.batch_id REFERENCES batches(id)` and nullable `course_id`.

### 1.4 `profiles` Gamification & Activity Telemetry Gaps
- **Observation 1.4.1**: `00_profiles.sql:4-22` defines `profiles` without `xp`, `streak`, `rank_badge`, or `last_active_date`.
- **Observation 1.4.2**: `src/app/api/test-series/grade/route.js:95-111` updates:
  ```javascript
  await supabase.from('profiles').update({
    xp: newXp,
    streak: newStreak,
    rank_badge: badge,
    last_active_date: new Date().toISOString()
  }).eq('id', user.id)
  ```
- **Observation 1.4.3**: `src/app/courses/page.jsx:205` and `src/app/leaderboard/page.jsx:18` select `xp, streak, rank_badge` and order by `xp DESC`.

### 1.5 Missing Tables: `course_files` & `coursera_courses`
- **Observation 1.5.1**: `src/app/dashboard/DashboardClient.jsx:221-224` queries:
  ```javascript
  supabase.from('course_files').select('*').eq('batch_id', selectedCohortBatch.id).order('created_at', { ascending: true })
  ```
  The table `public.course_files` was never created in prior DDL (only referenced in `05_lms_schema.sql` via `ALTER TABLE IF EXISTS`).
- **Observation 1.5.2**: `src/app/coursera/page.js:150` queries `coursera_courses` which lacked base DDL and RLS policies.

### 1.6 Onboarding RPC & Security Definier Architecture
- **Observation 1.6.1**: `13_secure_onboarding_and_trigger.sql` defined `execute_atomic_student_onboarding` and `execute_atomic_batch_onboarding` with 5 arguments requiring `_secret_token`.
- **Observation 1.6.2**: `15_test_series_payments.sql` defined `execute_atomic_package_onboarding`.
- **Observation 1.6.3**: `16_book_ordering_system.sql` defined `execute_atomic_book_order`.
- **Observation 1.6.4**: A unified master onboarding dispatcher RPC `onboard_user_after_payment` was needed to handle courses, batches, packages, and books polymorphically in a single atomic transaction without FK violations.

---

## 2. Logic Chain

1. **Foreign Key Introspection**: PostgREST constructs embedded relational queries (e.g. `.select('*, profiles(full_name)')`) by inspecting foreign key constraints in `pg_constraint`. Without explicit foreign keys (`courses.instructor_id -> profiles.id`, `invoices.batch_id -> batches.id`, `invoices.package_id -> test_packages.id`), PostgREST throws schema resolution errors.
2. **Column Consistency & Graceful Aliasing**: Client and API routes alternate between `user_id` and `profile_id` on `invoices`. Adding `profile_id UUID REFERENCES profiles(id)` with a bidirectional trigger (`sync_invoices_user_profile`) guarantees that both insert and select queries succeed regardless of which key is used.
3. **Polymorphic Cohort Architecture**: Assessments, live sessions, and course files may belong either to an evergreen course or to a cohort batch. Dropping `NOT NULL` on `course_id` and adding `batch_id REFERENCES batches(id)` allows dual-mode operation without schema fragmentation.
4. **Performance & RLS Optimization**: Supabase best practices require:
   - Scalar subquery wrapping `(select auth.uid())` to prevent row-by-row re-evaluation.
   - Using `TO authenticated` and `TO anon` rather than deprecated `auth.role()`.
   - Indexing all foreign key columns to eliminate table scans on JOINs and CASCADE operations.
5. **Atomic Payment Fulfillment**: Payment verification routes require single-transaction atomicity: updating invoices, provisioning enrollments/orders, decrementing stock (for physical books), and upgrading student profile roles with cryptographic secret validation (`secure_config`).

---

## 3. Caveats

- **pg_net & pg_cron**: In local offline testing environments without Docker or pg_net, background webhooks in migration 10 may fail non-fatally. The new migration 14 does not introduce unverified external extensions.
- **Existing User Data**: If existing databases contain mock users without matching `auth.users` records, strict foreign keys to `auth.users` will reject orphaned inserts. All FK constraints in migration 14 reference `public.profiles(id)` which safely cascades.
- **No caveats** regarding schema compatibility: all DDL operations are idempotent (`IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`, `DROP POLICY IF EXISTS`, `CREATE OR REPLACE FUNCTION`).

---

## 4. Conclusion

The complete, production-grade SQL migration `supabase/migrations/14_schema_integrity_and_qa_patch.sql` has been generated and validated. It resolves all foreign key relations, missing columns, missing tables, performance indexes, RLS policies, and atomic onboarding RPCs.

### Summary of Schema Changes in Migration 14:
| Table | Changes |
|---|---|
| `profiles` | Added `xp`, `streak`, `rank_badge`, `last_active_date`, and indexes |
| `courses` | Added `instructor_id` (FK to `profiles`), `status`, `cover_url`, `thumbnail_url`, `subject`, `rating`, `students_count`, `duration`, `lessons_count`, `checklist`, `badge`, `deleted_at`, and RLS |
| `invoices` | Added `profile_id` (FK to `profiles`), `batch_id` (FK to `batches`), `package_id` (FK to `test_packages`), `book_id` (FK to `books`), `razorpay_order_id`, bidirectional sync trigger, and RLS |
| `assessments` | Made `course_id` nullable, added `batch_id` (FK to `batches`), `start_window`, `end_window`, dual-mode RLS |
| `live_sessions` | Made `course_id` nullable, added `batch_id` (FK to `batches`), dual-mode RLS |
| `test_packages` | Added `description`, `thumbnail_url`, `campus_branch`, public RLS |
| `course_files` | Created new table with FKs to `courses`, `batches`, `lessons`, and enrolled-student RLS |
| `coursera_courses` | Created new table with catalog display RLS |
| **RPC Functions** | Added unified `onboard_user_after_payment` + updated atomic onboarding functions (`execute_atomic_student_onboarding`, `execute_atomic_batch_onboarding`, `execute_atomic_package_onboarding`, `execute_atomic_book_order`, `execute_enrollment_revocation`) |

---

## 5. Verification Method

To independently verify the SQL migration and database health:

### 5.1 Static Verification
Inspect the migration file:
- File path: `d:\education portal\supabase\migrations/14_schema_integrity_and_qa_patch.sql`
- File path: `d:\education portal\supabase\migrations/20260530170000_14_schema_integrity_and_qa_patch.sql`

### 5.2 Database Health Verification
1. **Apply Migration**:
   ```powershell
   # If using Supabase CLI
   npx supabase db push
   # Or execute the SQL script in Supabase SQL Editor
   ```
2. **Verify Foreign Keys & Relations**:
   - Query `courses` with embedded `profiles(full_name)`
   - Query `invoices` with embedded `courses(title)` and `batches(title)`
   - Query `assessments` with `batch_id` filter and `start_window` ordering
3. **Verify Atomic RPC Execution**:
   - Test execute `onboard_user_after_payment` with mock parameters for course, batch, package, and book.
4. **Build & Lint**:
   ```powershell
   npm run lint
   npm run build
   ```
5. **Invalidation Conditions**:
   - Invalidated if table names in `public` schema are renamed or if column types deviate from PostgreSQL standard types.
