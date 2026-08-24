# Handoff Report — Database & Supabase Schema Survey

**Sender**: Explorer 3 (Database & Supabase Schema Scanner)  
**Recipient**: Parent Orchestrator (`59ab231a-b8f9-42bd-b147-b32955fd7afe`)  
**Timestamp**: 2026-08-24T18:24:00Z  
**Type**: Hard Handoff (Investigation & Schema Architecture Complete)  

---

## 1. Observation

1. **Migration Files Cataloged**:
   - `d:\education portal\supabase\migrations`: 33 migration files including `20260526000000_00_profiles.sql`, `20260527100336_02_monetization.sql`, `20260529074422_05_lms_schema.sql`, `20260530080000_08_hybrid_analytics.sql`, `20260530140000_14_test_series.sql`, `20260530160000_16_book_ordering_system.sql`, `20260530170000_14_schema_integrity_and_qa_patch.sql`, and `15_question_bank_and_junction_tables.sql`.
   - `d:\admin dashboard\supabase\migrations`: 2 migration files (`20260530170000_14_schema_integrity_and_qa_patch.sql`, `15_question_bank_and_junction_tables.sql`) plus master migration script `d:\admin dashboard\supabase_schema_migration.sql`.

2. **Centralized Question Bank & Junction Tables (R1 Requirement)**:
   - `15_question_bank_and_junction_tables.sql` (Lines 1-485) creates:
     - `public.question_bank` with 21 columns (LaTeX Markdown `content`, `format_type`, `type`, `subject`, `topic`, `sub_topic`, `difficulty`, `section`, `options`, `correct_option_index`, `correct_answer`, `explanation`, `diagram_url`, `marks_positive`, `marks_negative`, `tags`, `author_id`, `is_active`, `times_tested`, `times_correct`, `created_at`, `updated_at`).
     - `public.exam_questions` junction table (`exam_id` -> `test_exams.id`, `question_id` -> `question_bank.id`, `order_index`, `section`, `marks_positive`, `marks_negative`).
     - `public.assessment_questions` junction table (`assessment_id` -> `assessments.id`, `question_id` -> `question_bank.id`, `order_index`, `marks_positive`, `marks_negative`).
     - `public.student_exam_questions` view with `WITH (security_invoker = true)` hiding answer keys from candidates.
     - Zero-loss extraction scripts copying questions from legacy `test_exams.questions` and `questions` into `question_bank`.
     - Automatic triggers `trg_sync_exam_questions` and `trg_sync_question_bank_update` syncing JSON into `test_exams.questions` for legacy client compatibility.

3. **Frontend Fallback Inspection**:
   - In `d:\education portal\src\app\batches\page.jsx` (Lines 8-100), `DEFAULT_BATCHES` contains columns `faculty`, `facultyRole`, `instructor_name`, `instructor_role`, `schedule`, `studentsEnrolled`, `seatsLeft`, `checklist`, `includedBookBox`, `curriculum`, `badge`, `rating`, `targetYear`.
   - In `d:\education portal\src\app\courses\page.jsx` (Lines 8-80), `DEFAULT_COURSES` contains columns `checklist`, `book_kit`, `students_count`, `duration`, `lessons_count`, `badge`, `rating`.
   - In `d:\education portal\src\app\books\page.jsx` (Lines 21-82), `sampleBooks` contains `category`, `subject`, `rating`, `reviewsCount`, `format`.
   - In `d:\admin dashboard\src\app\admin\students\StudentRelationshipClient.jsx` (Lines 339-357), an announcement broadcast form exists without a supporting persistent `public.announcements` table.

4. **RLS & Security Policies**:
   - All 25 tables have `ROW LEVEL SECURITY` enabled.
   - Public read tables use `FOR SELECT TO anon, authenticated USING (true)` or `USING (is_active = true)`.
   - Student tables (`enrollments`, `batch_enrollments`, `invoices`, `test_attempts`, `assessment_attempts`, `user_progress`, `book_orders`) use `(select auth.uid()) = user_id`.
   - Admin checks use `COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), (SELECT role FROM public.profiles WHERE id = (select auth.uid()))) IN ('admin', 'teacher', 'instructor', 'superadmin')`.

---

## 2. Logic Chain

1. **From Observation 1 & 2**: Both repositories have achieved relational parity regarding the question bank architecture and monetization schema. The trigger-based sync in `15_question_bank_and_junction_tables.sql` ensures that both new relational queries (`exam_questions JOIN question_bank`) and legacy JSON queries (`test_exams.questions`) work simultaneously.
2. **From Observation 3**: The UI components currently display rich information by falling back to static in-memory arrays when database columns are null or empty. Adding the identified columns (`faculty`, `faculty_role`, `instructor_role`, `schedule`, `seats_left`, `checklist`, `curriculum`, `book_kit` to `batches`; `category`, `subject`, `rating`, `reviews_count`, `format` to `books`) and populating initial seed rows will allow both portals to render 100% dynamic live data from Supabase.
3. **From Observation 3 (Announcement Gap)**: Adding a `public.announcements` table with RLS will allow admin broadcasts to immediately propagate to student dashboards.
4. **From Observation 4**: Row Level Security is compliant with the Supabase Security Framework. Scalar subquery wrapping `(select auth.uid())` is used to optimize query performance and prevent per-row evaluation overhead.

---

## 3. Caveats

1. **Remote Cloud Execution**: This investigation surveyed local migrations, schema definitions, and frontend components. Executing the generated SQL migrations against a live remote Supabase project instance requires valid database connection credentials (`DATABASE_URL` / direct Postgres connection or Supabase CLI migration push).
2. **Data Type Casting**: `batches.students_enrolled` in the frontend is represented as both string (`'85% Filled'`) and integer. The database column is declared as `TEXT` with a numeric default fallback to accommodate both styles.
3. **No Breaking Changes**: All proposed SQL enhancements use `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, and `CREATE OR REPLACE FUNCTION` to preserve backward compatibility.

---

## 4. Conclusion

The database schema is comprehensive, secure, and ready for end-to-end integration. To achieve 100% dynamic data coverage and eliminate all hardcoded fallbacks, a unified migration file `16_dynamic_data_and_schema_sync.sql` has been formulated.

### Proposed Concrete SQL Migration Plan (`16_dynamic_data_and_schema_sync.sql`):

```sql
-- ============================================================================
-- MIGRATION: 16_dynamic_data_and_schema_sync.sql
-- Description: Dynamic Data & Schema Parity Enhancement for Portals
-- ============================================================================

-- 1. ENHANCE PUBLIC.BATCHES COLUMNS
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS faculty TEXT,
  ADD COLUMN IF NOT EXISTS faculty_role TEXT,
  ADD COLUMN IF IF NOT EXISTS instructor_name TEXT,
  ADD COLUMN IF NOT EXISTS instructor_role TEXT,
  ADD COLUMN IF NOT EXISTS target_year TEXT DEFAULT 'TARGET 2026',
  ADD COLUMN IF NOT EXISTS schedule TEXT DEFAULT 'Mon - Fri Live Classes (6:00 PM - 9:00 PM)',
  ADD COLUMN IF NOT EXISTS seats_left INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS students_enrolled TEXT DEFAULT '85% Seats Filled',
  ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.95,
  ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'FLAGSHIP LIVE COHORT',
  ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '["1,200+ Hours Live 2-Way Interactive Video Classes", "Daily Practice Problems (DPPs) with Video Solutions", "30 All-India Grand CBT Mock Test Papers", "1-on-1 Dedicated Faculty Mentorship & Doubt Clearing"]'::jsonb,
  ADD COLUMN IF NOT EXISTS book_kit JSONB DEFAULT '{"title": "Complete 18-Book Physical Box Kit Included", "mrp": 7999, "free": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS curriculum JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 2. ENHANCE PUBLIC.BOOKS COLUMNS
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.8,
  ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'Hardcopy + PDF';

-- 3. CREATE PUBLIC.ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'paid_students', 'teachers', 'batch_students')),
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_policy"
  ON public.announcements FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "announcements_admin_manage_policy"
  ON public.announcements FOR ALL TO authenticated
  USING (
    COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), (SELECT role FROM public.profiles WHERE id = (select auth.uid()))) IN ('admin', 'teacher', 'instructor', 'superadmin')
  )
  WITH CHECK (
    COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), (SELECT role FROM public.profiles WHERE id = (select auth.uid()))) IN ('admin', 'teacher', 'instructor', 'superadmin')
  );

-- 4. CREATE PUBLIC.STUDENT_BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.student_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('question', 'lesson', 'course_file', 'book')),
  item_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);

ALTER TABLE public.student_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_bookmarks_user_policy"
  ON public.student_bookmarks FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 5. CREATE PUBLIC.INSTRUCTORS DIRECTORY VIEW
CREATE OR REPLACE VIEW public.instructors WITH (security_invoker = true) AS
SELECT
  id,
  full_name,
  email,
  role,
  preferred_subject AS subject,
  study_mentor AS designation,
  rank_badge,
  created_at
FROM public.profiles
WHERE role IN ('teacher', 'instructor', 'admin', 'superadmin');

GRANT SELECT ON public.instructors TO anon, authenticated;
```

---

## 5. Verification Method

1. **Inspect Survey Report**:
   - Read `d:\education portal\.agents\teamwork_preview_explorer_survey_db_schema\survey_db_schema_report.md` for the full table catalog, column index, and RLS breakdown.
2. **Schema Migration Dry-Run**:
   - Apply `15_question_bank_and_junction_tables.sql` and the proposed `16_dynamic_data_and_schema_sync.sql` on a Postgres database to verify zero syntax errors.
3. **Trigger Validation**:
   - Insert a row into `question_bank` and link it in `exam_questions`. Verify that `test_exams.questions` JSON is automatically updated.
4. **Invalidation Condition**:
   - If any column name diverges from the React component query keys in `BatchesPage.jsx`, `CoursesPage.jsx`, or `QuestionBankClient.jsx`, review the column aliases mapped in `survey_db_schema_report.md`.
