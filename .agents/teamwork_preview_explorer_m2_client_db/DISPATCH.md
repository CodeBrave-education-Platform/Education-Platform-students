## 2026-08-18T14:50:54Z
You are an Explorer subagent for Milestone 2 (Client & Server Page DB Queries Scope).
Your working directory is: d:\education portal\.agents\teamwork_preview_explorer_m2_client_db\
Your parent is orchestrator_1 (conv ID: 4bca80a4-c508-4a4c-a304-15b7f630e524).

Read:
1. ORIGINAL_REQUEST.md at: d:\education portal\.agents\ORIGINAL_REQUEST.md
2. PROJECT.md at: d:\education portal\PROJECT.md
3. DB Survey report at: d:\education portal\.agents\teamwork_preview_explorer_survey_db\handoff.md

Your Task:
Audit and prepare exact code fixes for client and server page queries:
1. `src/app/courses/page.jsx`:
   - Remove unauthorized direct client-side DB inserts into `enrollments` / `invoices` on Razorpay success; route payment verification through `/api/razorpay/verify` or ensure safe server handling.
2. `src/app/batches/page.jsx`:
   - Fix batch enrollment verification and payment handling (avoid calling RPC with missing secret token from client, use `/api/razorpay/verify`).
3. `src/app/dashboard/page.jsx` & `src/app/dashboard/DashboardClient.jsx`:
   - Fix PostgREST foreign key joins: `.from('courses').select('*, profiles(full_name)')`, `.from('invoices').select('*, courses(title), batches(title)')`.
4. `src/app/test-series/engine/[examId]/page.js`:
   - Fix query column names (`user_id` on attempts lookup, question JSON parsing).
5. Write your exact code patch blueprints and handoff report to: `d:\education portal\.agents\teamwork_preview_explorer_m2_client_db\handoff.md`.

Communicate back to parent with send_message when complete.
