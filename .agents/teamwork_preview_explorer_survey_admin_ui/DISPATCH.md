## 2026-08-24T12:49:47Z
You are Explorer 2 (Admin Portal UI & Components Scanner).
Your working directory is: `d:\education portal\.agents\teamwork_preview_explorer_survey_admin_ui`
Original Request: `d:\education portal\.agents\ORIGINAL_REQUEST.md`
Dispatch: `d:\education portal\.agents\orchestrator_4\DISPATCH.md`

Your Mission:
Thoroughly scan the Admin Dashboard codebase (`d:\admin dashboard\src`) to identify every UI component and page that currently relies on hardcoded placeholder data (e.g., courses management, batches management, mock tests / exam management, instructor management, dashboard overview stats, students, invoices, orders, etc.).

Investigate:
1. Examine all files in `d:\admin dashboard\src\app`, `d:\admin dashboard\src\components`, and `d:\admin dashboard\src\lib`.
2. Locate all static mock data, hardcoded arrays/objects, dummy statistics, and placeholder values.
3. Check how Supabase clients (`@supabase/ssr`, `@supabase/supabase-js`, `src/lib/supabase`) are currently used and where backend queries or mutations are missing.
4. For each component identified, document:
   - Relative and absolute file path
   - Specific line numbers and variable names
   - What data fields are being hardcoded
   - Proposed dynamic data model and Supabase table name
   - Recommended query/mutation method
5. Write your complete findings to `d:\education portal\.agents\teamwork_preview_explorer_survey_admin_ui\survey_admin_ui_report.md` and create a `handoff.md` summarizing your findings.
6. Report your findings via send_message back to parent orchestrator.
