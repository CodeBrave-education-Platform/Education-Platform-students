# Dispatch: Milestone 1 — Database Migration, Storage Bucket & Decoupling

## Objective
Implement and verify Supabase SQL migration `17_test_portal_and_question_paper_documents.sql` across both `d:\education portal` and `d:\admin dashboard`.

## References & Input
- Authoritative User Request: `d:\education portal\ORIGINAL_REQUEST.md` (## 2026-09-04T10:35:58Z)
- Project Architecture & Interfaces: `d:\education portal\PROJECT.md`
- DB Survey Analysis & SQL drafts: `d:\education portal\.agents\explorer_survey_db_storage\analysis.md`
- Skills to apply:
  - `d:\education portal\.agents\skills\supabase\SKILL.md`
  - `d:\education portal\.agents\skills\supabase-postgres-best-practices\SKILL.md`

## Required Actions & Files Owned
You exclusively own:
- `d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql`
- `d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql`

## Requirements to Implement
1. **`test_exams` Decoupling & Schema Additions**:
   - Make `package_id` nullable (`ALTER TABLE public.test_exams ALTER COLUMN package_id DROP NOT NULL;`).
   - Drop old constraint and re-create foreign key with `ON DELETE SET NULL` (e.g. `fk_test_exams_package`).
   - Add `sections_config JSONB NOT NULL DEFAULT '[]'::jsonb;`
   - Add `blueprint_type TEXT NOT NULL DEFAULT 'custom' CHECK (blueprint_type IN ('jee_main', 'jee_advanced', 'neet', 'custom'));`
   - Add index on `package_id` (`CREATE INDEX IF NOT EXISTS idx_test_exams_package_id ON public.test_exams(package_id);`).

2. **`public.question_paper_documents` Table**:
   - Create table with columns:
     - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
     - `title TEXT NOT NULL`
     - `file_url TEXT NOT NULL`
     - `file_name TEXT NOT NULL`
     - `file_size_bytes BIGINT NOT NULL DEFAULT 0`
     - `subject TEXT DEFAULT 'Full Syllabus'`
     - `target_exam TEXT DEFAULT 'JEE Main'`
     - `status TEXT NOT NULL DEFAULT 'ready_to_compile' CHECK (status IN ('uploading', 'ready_to_compile', 'compiled', 'failed'))`
     - `compiled_exam_id UUID REFERENCES public.test_exams(id) ON DELETE SET NULL`
     - `uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL`
     - `parsed_payload JSONB DEFAULT '{}'::jsonb`
     - `metadata JSONB DEFAULT '{}'::jsonb`
     - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
     - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - Add indexes on `status`, `target_exam`, `subject`, `compiled_exam_id`.
   - Enable Row Level Security (`ALTER TABLE public.question_paper_documents ENABLE ROW LEVEL SECURITY;`).
   - Add RLS policies:
     - Allow read for all authenticated users and anon students.
     - Allow insert, update, delete for authenticated users (admins/teachers).

3. **Storage Bucket `question-papers`**:
   - Insert into `storage.buckets` (`id`, `name`, `public`, `file_size_limit`, `allowed_mime_types`) with `public = true`, `52428800` bytes (50MB), allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`.
   - Configure RLS policies on `storage.objects`:
     - Public SELECT access for `bucket_id = 'question-papers'`
     - Authenticated INSERT/UPDATE/DELETE access for `bucket_id = 'question-papers'`

4. **Dynamic Seeds & Test Data**:
   - Insert standalone JEE Main mock tests (with `package_id = NULL`, valid `blueprint_type = 'jee_main'`, and comprehensive `sections_config` with Section A MCQs and Section B Numerical).
   - Insert realistic seed rows into `public.question_paper_documents` (e.g. sample JEE Main question papers with status 'ready_to_compile' and 'compiled').

5. **Verification**:
   - Ensure identical migration files exist in both `d:\education portal\supabase\migrations` and `d:\admin dashboard\supabase\migrations`.
   - Verify SQL syntax and execution using available project tools or test scripts.
   - Run tests if applicable.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Report back with your results and write your handoff to `d:\education portal\.agents\teamwork_preview_worker_m1\handoff.md`.

## 2026-09-04T10:46:55Z
You are the Database Migration Worker for Milestone 1.
Your working directory is: d:\education portal\.agents\teamwork_preview_worker_m1
Your detailed task assignment is in: d:\education portal\.agents\teamwork_preview_worker_m1\DISPATCH.md
The authoritative user request is in: d:\education portal\ORIGINAL_REQUEST.md (specifically ## 2026-09-04T10:35:58Z).
The project architecture is in: d:\education portal\PROJECT.md.
The DB survey analysis and SQL drafts are in: d:\education portal\.agents\explorer_survey_db_storage\analysis.md.

Write identical migrations to:
- d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql
- d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql

Verify your SQL, document your verification commands and results, and write your report to d:\education portal\.agents\teamwork_preview_worker_m1\handoff.md.
When finished, send a message back with your findings and handoff path.

