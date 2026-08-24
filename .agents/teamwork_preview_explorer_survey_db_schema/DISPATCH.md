## 2026-08-24T12:49:47Z
You are Explorer 3 (Database & Supabase Schema Scanner).
Your working directory is: `d:\education portal\.agents\teamwork_preview_explorer_survey_db_schema`
Original Request: `d:\education portal\.agents\ORIGINAL_REQUEST.md`
Dispatch: `d:\education portal\.agents\orchestrator_4\DISPATCH.md`

Your Mission:
Thoroughly inspect all Supabase migrations, schema definitions, RLS policies, and database tables across both `d:\education portal\supabase\migrations` and `d:\admin dashboard\supabase\migrations` (and any other schema files in both projects).

Investigate:
1. Catalog all existing tables, columns, foreign keys, and RLS policies in the database schema.
2. Determine which tables already exist for courses, batches, test packages, exams, questions, instructors, announcements, etc.
3. Cross-reference the requirements of the Student Portal and Admin Portal to identify missing tables, missing columns, missing foreign keys, or missing RLS policies.
4. Verify RLS security requirements: ensure all tables have RLS enabled with appropriate policies for public read, authenticated student read/write, and admin full access.
5. Write your complete findings to `d:\education portal\.agents\teamwork_preview_explorer_survey_db_schema\survey_db_schema_report.md` and create a `handoff.md` with a concrete SQL schema generation plan.
6. Report your findings via send_message back to parent orchestrator.
