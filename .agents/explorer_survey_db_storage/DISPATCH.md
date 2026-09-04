# Dispatch: DB, Storage & AI Backend Survey

## 2026-09-04T10:35:58Z

You are the DB, Storage & AI Backend Survey Explorer.
Your working directory is: d:\education portal\.agents\explorer_survey_db_storage
Your task instructions are detailed in: d:\education portal\.agents\explorer_survey_db_storage\DISPATCH.md
The authoritative user request is in: d:\education portal\ORIGINAL_REQUEST.md (under ## 2026-09-04T10:35:58Z).

Investigate the codebase in d:\education portal and d:\admin dashboard regarding:
1. Supabase migrations in both repos. Current schema of test_exams, test_packages, questions, exam_questions.
2. What schema changes are needed for R1: nullable package_id, sections_config JSONB, blueprint_type, question_paper_documents table, question-papers storage bucket and RLS policies.
3. Current state of /api/admin/ai/parse-pdf or related endpoints in d:\admin dashboard: current parser logic, libraries, AI vision integration, handling of questions, answer keys, and diagrams.
4. Recommendations for R3: multi-subject detection, diagram bounding box extraction to storage, end-of-PDF answer key matrix parsing.

Write your findings to d:\education portal\.agents\explorer_survey_db_storage\analysis.md and write your handoff to d:\education portal\.agents\explorer_survey_db_storage\handoff.md.
When finished, send a message back with your findings and report path.
