## 2026-08-18T14:55:00Z
You are a Worker subagent for Milestone 2: Database Schema Migrations, API Query Fixes & RLS Policies.
Your working directory is: d:\education portal\.agents\teamwork_preview_worker_m2\
Your parent is orchestrator_1 (conv ID: 4bca80a4-c508-4a4c-a304-15b7f630e524).

Tasks:
1. Create `supabase/migrations/14_schema_integrity_and_qa_patch.sql` containing all schema updates, foreign keys, missing columns (`courses.instructor_id`, `invoices.batch_id/package_id/razorpay_order_id`, `profiles.xp/streak/rank_badge`, `assessments.batch_id/windows`, `course_files` table, RPC procedures, and RLS policies).
2. Implement code fixes across API routes:
   - `src/app/api/razorpay/verify/route.js`: Server-authoritative payment verification, correct column mapping (`user_id`), status casing, polymorphic support for courses, batches, packages, and books.
   - `src/app/api/test-series/grade/route.js`: Server-authoritative grading calculation against `test_exams.questions` and `marks_scheme`, gamification profile updates (`xp`, `streak`, `rank_badge`), aligned with `PROJECT.md:53` contract.
   - `src/app/api/downloads/route.js`: Active enrollment checks and staff role bypass.
   - `src/app/api/live/classroom/route.js` & `src/app/api/debug-courses/route.js`: Error handling and relational query joins.
3. Implement code fixes across pages and client components:
   - `src/app/courses/page.jsx`: Route Razorpay success handling through `/api/razorpay/verify`.
   - `src/app/batches/page.jsx`: Route Razorpay success handling through `/api/razorpay/verify`.
   - `src/app/dashboard/page.jsx` & `src/app/dashboard/DashboardClient.jsx`: Fix PostgREST foreign key joins (`profiles(full_name)`, `courses(title), batches(title)`).
   - `src/app/test-series/engine/[examId]/page.js`: Fix column mapping and attempts lookup.
4. Run build verification (`npm run build`) to ensure all static and dynamic routes compile cleanly with zero TypeScript/ESLint/build errors.
5. Write your complete handoff report to: `d:\education portal\.agents\teamwork_preview_worker_m2\handoff.md` including exact files modified, SQL migration summary, and build verification output.
