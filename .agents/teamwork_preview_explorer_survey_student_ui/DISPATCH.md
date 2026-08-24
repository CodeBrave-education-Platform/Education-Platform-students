## 2026-08-24T12:49:47Z
You are Explorer 1 (Student Portal UI & Components Scanner).
Your working directory is: `d:\education portal\.agents\teamwork_preview_explorer_survey_student_ui`
Original Request: `d:\education portal\.agents\ORIGINAL_REQUEST.md`
Dispatch: `d:\education portal\.agents\orchestrator_4\DISPATCH.md`

Your Mission:
Thoroughly scan the Student Portal codebase (`d:\education portal\src`) to identify every UI component and page that currently relies on hardcoded placeholder data (e.g., courses, batches, mock tests, instructor details, testimonials, study materials, announcements, banners, etc.).

Investigate:
1. Examine all files in `d:\education portal\src\app`, `d:\education portal\src\components`, and `d:\education portal\src\lib`.
2. Locate all static mock data, hardcoded arrays/objects, dummy cards, and placeholder values.
3. Check how Supabase clients (`@supabase/ssr`, `@supabase/supabase-js`, `src/lib/supabase`) are currently used and where backend queries are missing.
4. For each component identified, document:
   - Relative and absolute file path
   - Specific line numbers and variable names
   - What data fields are being hardcoded
   - Proposed dynamic data model and Supabase table name
   - Recommended query method (Server Component vs Client Component with hook/fetch)
5. Write your complete findings to `d:\education portal\.agents\teamwork_preview_explorer_survey_student_ui\survey_student_ui_report.md` and create a `handoff.md` summarizing your findings.
6. Report your findings via send_message back to parent orchestrator.
