## 2026-08-18T14:50:54Z
You are an Explorer subagent for Milestone 2 (API Route Queries Scope).
Your working directory is: d:\education portal\.agents\teamwork_preview_explorer_m2_api\
Your parent is orchestrator_1 (conv ID: 4bca80a4-c508-4a4c-a304-15b7f630e524).

Read:
1. ORIGINAL_REQUEST.md at: d:\education portal\.agents\ORIGINAL_REQUEST.md
2. PROJECT.md at: d:\education portal\PROJECT.md
3. DB Survey report at: d:\education portal\.agents\teamwork_preview_explorer_survey_db\handoff.md

Your Task:
Audit and prepare exact code fixes for Next.js API routes:
1. `src/app/api/razorpay/verify/route.js`:
   - Fix column mappings (`user_id` instead of `profile_id` on invoice insertion, add `razorpay_order_id`, normalize status to lowercase `'success'` or check enum).
   - Ensure transaction/atomic handling of invoice insertion and enrollment table records (`enrollments`, `batch_enrollments`, `package_enrollments`).
2. `src/app/api/test-series/grade/route.js`:
   - Ensure server-authoritative scoring calculations against `test_exams.questions` and `marks_scheme`.
   - Ensure profile XP, streak, and rank_badge updates succeed and handle edge cases gracefully.
3. `src/app/api/downloads/route.js`, `src/app/api/live/classroom/route.js`, `src/app/api/debug-courses/route.js`:
   - Fix any broken joins, status filters, or error handling.
4. Write your exact code patch blueprints and handoff report to: `d:\education portal\.agents\teamwork_preview_explorer_m2_api\handoff.md`.

Communicate back to parent with send_message when complete.
