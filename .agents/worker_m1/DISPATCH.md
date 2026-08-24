## 2026-08-24T12:58:48Z
You are Worker M1 (Supabase Database Schema & Migration Builder).
Working directory: `d:\education portal\.agents\worker_m1`
Original Request: `d:\education portal\.agents\ORIGINAL_REQUEST.md`
Project Scope: `d:\education portal\PROJECT.md`
DB Survey Report: `d:\education portal\.agents\teamwork_preview_explorer_survey_db_schema\survey_db_schema_report.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. Write the comprehensive, production-grade SQL migration `16_dynamic_data_and_schema_sync.sql` and place it in both:
   - `d:\education portal\supabase\migrations\16_dynamic_data_and_schema_sync.sql`
   - `d:\admin dashboard\supabase\migrations\16_dynamic_data_and_schema_sync.sql`
2. Migration Requirements:
   - Enhance `public.batches`: Add columns `faculty`, `faculty_role`, `instructor_name`, `instructor_role`, `target_year`, `schedule`, `seats_left`, `students_enrolled`, `original_price`, `rating`, `badge`, `checklist`, `book_kit`, `curriculum`, `is_featured`, `is_active` (using `ADD COLUMN IF NOT EXISTS`).
   - Enhance `public.books`: Add columns `subject`, `category`, `rating`, `reviews_count`, `format`, `cover_image_url`, `stock` (using `ADD COLUMN IF NOT EXISTS`).
   - Create `public.announcements` table with RLS enabled:
     - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `title TEXT NOT NULL`, `message TEXT NOT NULL`, `target_audience TEXT NOT NULL DEFAULT 'all'`, `batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE`, `author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL`, `is_pinned BOOLEAN NOT NULL DEFAULT false`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
     - RLS policy: SELECT for `anon, authenticated`, ALL (management) for admins/instructors.
   - Create `public.student_bookmarks` table with RLS enabled:
     - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`, `item_type TEXT NOT NULL`, `item_id UUID NOT NULL`, `notes TEXT`, `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, UNIQUE (user_id, item_type, item_id).
     - RLS policy: ALL for authenticated user where `(select auth.uid()) = user_id`.
   - Create `public.instructors` view with `security_invoker = true` querying `public.profiles` where `role IN ('teacher', 'instructor', 'admin', 'superadmin')`.
   - Insert comprehensive dynamic seed rows (using `ON CONFLICT DO NOTHING` or `DO UPDATE`) for:
     - `public.courses`: Full set of flagship JEE, NEET, and Foundation courses with rich descriptions, syllabus, badges, ratings, and pricing.
     - `public.batches`: Full set of live cohorts with faculty names, faculty roles, target years, schedules, seats left, enrollment metrics, checklists, book kits, and curricula.
     - `public.books`: Comprehensive inventory of physical textbooks with titles, authors, categories, prices, ratings, and cover URLs.
     - `public.test_packages` and `public.test_exams`: Rich test series packages and mock exams with subjects, time limits, total marks, and questions.
3. Write `handoff.md` detailing the implemented SQL statements, RLS policies, foreign keys, and seed data.
4. Report back via send_message to parent orchestrator.
