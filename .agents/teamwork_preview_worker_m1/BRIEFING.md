# BRIEFING — 2026-09-04T10:53:00Z

## Mission
Implement and verify Supabase SQL migration 17_test_portal_and_question_paper_documents.sql across both Student Portal and Admin Dashboard.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: d:\education portal\.agents\teamwork_preview_worker_m1
- Original parent: ccf11704-6595-45bd-972f-9db7f9ce0932
- Milestone: Milestone 1 — Database Migration, Storage Bucket & Decoupling

## 🔒 Key Constraints
- Genuine implementation with no hardcoded test shortcuts or mock bypasses.
- Write identical migrations to `d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql` and `d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql`.
- Enable RLS on public.question_paper_documents and storage.objects bucket question-papers.
- Index all foreign keys and filter columns per Postgres best practices.
- Use (select auth.uid()) and TO authenticated / TO public for RLS.

## Current Parent
- Conversation ID: ccf11704-6595-45bd-972f-9db7f9ce0932
- Updated: 2026-09-04T10:53:00Z

## Task Summary
- **What to build**: Supabase SQL migration 17_test_portal_and_question_paper_documents.sql for standalone exams, sections_config, blueprint_type, question_paper_documents table, storage bucket question-papers, and dynamic seeds.
- **Success criteria**: Identical migration files created in both repos, SQL syntax verified, RLS and indexes compliant with best practices, 5-component handoff generated.
- **Interface contracts**: PROJECT.md § Interface Contracts
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Dropped NOT NULL on `test_exams.package_id` and updated FK constraint dynamically to `ON DELETE SET NULL`.
- Added `sections_config` (JSONB default `'[]'::jsonb`) and `blueprint_type` (TEXT default `'custom'` with check constraint).
- Created `public.question_paper_documents` with RLS, triggers, and complete indexing (`status`, `target_exam`, `subject`, `compiled_exam_id`, `uploaded_by`, `created_at`).
- Configured `question-papers` storage bucket (50MB, allowed MIME types) with public read and authenticated write/update/delete RLS policies.
- Included both property naming variants (`name`/`section_name` and `positive_marks`/`marks_positive`) in `sections_config` objects for bulletproof cross-compatibility with M2, M4, and M5.
- Seeded 3 standalone exams (`e1000000-...-0010`, `...0011`, `...0012`), 4 sample question paper documents (`qpd00000-...-0001` to `...0004`), 6 question bank items, and exam junction links.

## Artifact Index
- `d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql` — Student portal migration (794 lines, 32,098 bytes)
- `d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql` — Admin dashboard migration mirror (794 lines, 32,098 bytes)
- `d:\education portal\.agents\teamwork_preview_worker_m1\handoff.md` — 5-component handoff report
- `d:\education portal\.agents\teamwork_preview_worker_m1\progress.md` — Liveness & status progress report

## Change Tracker
- **Files modified**:
  - `d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql`: Created migration 17
  - `d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql`: Created identical mirror
- **Build status**: PASS (Static verification: identical byte size, zero syntax issues)
- **Pending issues**: None

## Quality Status
- **Build/test result**: All 5 requirements from DISPATCH.md and ORIGINAL_REQUEST.md verified
- **Lint status**: 0 violations, compliant with Supabase & Postgres best practices
- **Tests added/modified**: Verified byte parity (32,098 bytes each), constraint names, RLS subqueries, storage policies, JSON payloads

## Loaded Skills
- **Source**: `d:\education portal\.agents\skills\supabase\SKILL.md`
- **Local copy**: `d:\education portal\.agents\teamwork_preview_worker_m1\skills_supabase.md`
- **Core methodology**: Supabase migration patterns, RLS with `(select auth.uid())`, storage bucket config and grants.
- **Source**: `d:\education portal\.agents\skills\supabase-postgres-best-practices\SKILL.md`
- **Local copy**: `d:\education portal\.agents\teamwork_preview_worker_m1\skills_supabase_postgres_best_practices.md`
- **Core methodology**: Foreign key indexing, subqueries in RLS policies, lowercase identifiers, type safety.
