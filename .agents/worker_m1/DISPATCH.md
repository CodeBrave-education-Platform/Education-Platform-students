## 2026-08-20T00:08:35Z
You are Worker M1 for Milestone 1: Global Question Bank Schema & Zero-Data-Loss Migration.
Your working directory is: D:\education portal\.agents\worker_m1
Project scope document: D:\education portal\PROJECT.md
Original user request is at: D:\education portal\.agents\ORIGINAL_REQUEST.md
Database explorer analysis and proposed SQL migration are at:
- D:\education portal\.agents\explorer_survey_db_qb\analysis.md
- D:\education portal\.agents\explorer_survey_db_qb\proposed_migration.sql

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Tasks:
1. Write the production SQL migration file at `D:\education portal\supabase\migrations\15_question_bank_and_junction_tables.sql` (and copy to `D:\admin dashboard\supabase\migrations\15_question_bank_and_junction_tables.sql` if directory exists).
2. The migration must:
   - Create `public.question_bank` table with all fields (id, subject, tags, difficulty, type, content, diagram_url, options jsonb, correct_answer, explanation, created_at, updated_at).
   - Create `public.exam_questions` junction table (id, exam_id, question_id, order_index, section, marks_positive, marks_negative, UNIQUE(exam_id, question_id)).
   - Create `public.assessment_questions` junction table (id, assessment_id, question_id, order_index, marks_positive, marks_negative, UNIQUE(assessment_id, question_id)).
   - Implement PostgreSQL trigger function `sync_test_exams_questions_from_bank()` and triggers on `question_bank` and `exam_questions` so any update in `question_bank` or `exam_questions` automatically synchronizes the backward-compatible `test_exams.questions` JSON column.
   - Execute the zero-loss data extraction: extract all questions from `test_exams.questions` JSON and `test_questions` table into `question_bank` preserving their exact original UUIDs (so the 66 existing student test attempts remain 100% valid).
   - Populate `exam_questions` junction links for all existing `test_exams`.
   - Set up RLS policies and performance indexes (`idx_question_bank_subject`, `idx_exam_questions_exam_id`, `idx_exam_questions_question_id`).
3. Execute the migration against the Supabase database using a verified Node.js script using `@supabase/supabase-js` or postgres client.
4. Verify table creation, data integrity, row counts, trigger execution, and junction links empirically.
5. Write your complete handoff report to `D:\education portal\.agents\worker_m1\handoff.md` and report back with send_message.
