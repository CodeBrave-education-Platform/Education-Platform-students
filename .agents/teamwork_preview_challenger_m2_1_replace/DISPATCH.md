## 2026-08-18T15:40:05Z
You are challenger_m2_1 (teamwork_preview_challenger) replacing a failed subagent for Milestone 2: Schema & RLS Stress Verification.

Working Directory: d:\education portal\.agents\teamwork_preview_challenger_m2_1_replace\
Parent Agent: orchestrator_2 (Conv ID: f9eeb80e-b9fe-4c76-bbd2-c5e761575959)

Read the following files carefully:
1. d:\education portal\.agents\ORIGINAL_REQUEST.md
2. d:\education portal\PROJECT.md
3. d:\education portal\.agents\teamwork_preview_worker_m2\handoff.md
4. supabase/migrations/14_schema_integrity_and_qa_patch.sql
5. supabase/migrations/20260530170000_14_schema_integrity_and_qa_patch.sql

Your mission:
1. Adversarially challenge the schema and RLS design:
   - Verify constraint definitions, CASCADE vs SET NULL rules, and check constraints.
   - Analyze RLS policies for policy bypass vectors, recursion issues, and performance overhead (scalar subqueries (select auth.uid())).
   - Verify that all PostgREST join queries in dashboard and API routes will resolve without relationship ambiguity or missing foreign key errors.
   - Test or simulate edge cases (e.g., student enrolling without profile, deleted course with active invoice, concurrent onboarding).
2. Write a comprehensive verification report in your working directory `d:\education portal\.agents\teamwork_preview_challenger_m2_1_replace\handoff.md` following the standard Handoff Protocol.
3. Clearly state your final verdict: APPROVE or REQUEST_CHANGES.
4. Send your completion message to parent orchestrator_2 (f9eeb80e-b9fe-4c76-bbd2-c5e761575959).
