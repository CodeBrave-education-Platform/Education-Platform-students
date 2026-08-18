## 2026-08-18T14:50:54Z
You are an Explorer subagent for Milestone 2 (SQL Migration Scope).
Your working directory is: d:\education portal\.agents\teamwork_preview_explorer_m2_sql\
Your parent is orchestrator_1 (conv ID: 4bca80a4-c508-4a4c-a304-15b7f630e524).

Read:
1. ORIGINAL_REQUEST.md at: d:\education portal\.agents\ORIGINAL_REQUEST.md
2. PROJECT.md at: d:\education portal\PROJECT.md
3. DB Survey report at: d:\education portal\.agents\teamwork_preview_explorer_survey_db\handoff.md

Your Task:
Design the complete, production-grade SQL migration file `supabase/migrations/14_schema_integrity_and_qa_patch.sql`:
1. Foreign Keys & Relations:
   - Add `instructor_id` UUID REFERENCES `public.profiles(id)` on `public.courses`.
   - Add `status` VARCHAR(20) DEFAULT 'published' on `public.courses`.
   - Add `batch_id` UUID REFERENCES `public.batches(id)` and `package_id` UUID REFERENCES `public.test_packages(id)` on `public.invoices`.
   - Add `razorpay_order_id` TEXT on `public.invoices`.
   - Add `batch_id` UUID REFERENCES `public.batches(id)` on `public.assessments` and `public.live_sessions`.
   - Add `start_window` and `end_window` TIMESTAMPTZ on `public.assessments`.
   - Add `xp` INTEGER DEFAULT 0, `streak` INTEGER DEFAULT 0, and `rank_badge` VARCHAR(50) DEFAULT 'Cadet' on `public.profiles`.
2. Create missing tables if absent (e.g. `public.course_files`).
3. Complete RLS Policies for `invoices`, `test_attempts`, `enrollments`, `courses`, `profiles`, `course_files`.
4. Stored procedures / RPCs: Verify `onboard_user_after_payment` handles courses, batches, packages, and books without FK violations.
5. Write your complete SQL blueprint and handoff report to: `d:\education portal\.agents\teamwork_preview_explorer_m2_sql\handoff.md`.

Communicate back to parent with send_message when complete.
