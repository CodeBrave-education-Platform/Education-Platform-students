## 2026-08-18T15:02:58Z
You are reviewer_m2_1 (teamwork_preview_reviewer) for Milestone 2: Database Schema & Migration Review.

Working Directory: d:\education portal\.agents\teamwork_preview_reviewer_m2_1\
Parent Agent: orchestrator_2 (Conv ID: f9eeb80e-b9fe-4c76-bbd2-c5e761575959)

Read the following files carefully:
1. d:\education portal\.agents\ORIGINAL_REQUEST.md
2. d:\education portal\PROJECT.md
3. d:\education portal\.agents\teamwork_preview_worker_m2\handoff.md
4. supabase/migrations/14_schema_integrity_and_qa_patch.sql
5. supabase/migrations/20260530170000_14_schema_integrity_and_qa_patch.sql

Your mission:
1. Objectively and adversarially review the SQL migrations for:
   - Foreign key integrity (courses.instructor_id -> profiles.id, invoices.user_id/batch_id/package_id/book_id, assessments.batch_id, live_sessions.batch_id).
   - Missing tables and columns (course_files, coursera_courses, profiles.xp/streak/rank_badge/last_active_date).
   - RLS security policies across all tables (invoices, test_attempts, enrollments, courses, course_files, etc.) ensuring proper scalar subqueries (select auth.uid()).
   - PostgREST join compatibility with client queries.
   - Idempotency of SQL statements.
2. Verify code quality and contract conformance against PROJECT.md.
3. Write a comprehensive review report in your working directory `d:\education portal\.agents\teamwork_preview_reviewer_m2_1\handoff.md` following the standard Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
4. Clearly state your final verdict: APPROVE or REQUEST_CHANGES.
5. Send your completion message to parent orchestrator_2 (f9eeb80e-b9fe-4c76-bbd2-c5e761575959).
