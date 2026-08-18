# BRIEFING — 2026-08-18T14:22:30Z

## Mission
Survey the entire database architecture, Supabase client initialization, Next.js API routes & server actions, schema/foreign keys/RLS policies, test submission & course enrollment flows, and document findings in handoff.md.

## 🔒 My Identity
- Archetype: explorer
- Roles: database investigation, API routes audit, Supabase & Postgres flow analysis
- Working directory: d:\education portal\.agents\teamwork_preview_explorer_survey_db\
- Original parent: 4bca80a4-c508-4a4c-a304-15b7f630e524
- Milestone: Step 0 (Survey)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Produce comprehensive handoff.md following 5-Component protocol

## Current Parent
- Conversation ID: 4bca80a4-c508-4a4c-a304-15b7f630e524
- Updated: 2026-08-18T14:22:30Z

## Investigation State
- **Explored paths**: `src/utils/supabase/`, `src/app/api/`, `src/app/learn/`, `src/app/courses/`, `src/app/dashboard/`, `src/app/test-series/`, `src/app/books/`, `src/app/leaderboard/`, `supabase/migrations/`
- **Key findings**:
  1. Identified 4 Supabase client instantiation types (browser, server, middleware, admin).
  2. Audited 14 Next.js API routes and 3 server actions.
  3. Discovered missing schema columns & FK relations (`courses.instructor_id`, `invoices.batch_id`, `profiles.xp/streak/rank_badge`, `assessments.batch_id/start_window/end_window`, `live_sessions.batch_id`, `course_files` table).
  4. Identified broken query patterns (`profile_id` vs `user_id` on `invoices`, missing secret token in client-side batch onboarding, casing mismatch 'active' vs 'ACTIVE').
  5. Analyzed dual test taking engines (Course LMS assessments & Standalone CBT test series hub) and multi-product payment verification flows.
- **Unexplored areas**: None within database survey scope.

## Key Decisions Made
- Outlined exact SQL migration (`20260530170000_17_comprehensive_schema_fix.sql`) and 6 code-level query patches needed during implementation step.

## Artifact Index
- d:\education portal\.agents\teamwork_preview_explorer_survey_db\DISPATCH.md — Initial task dispatch
- d:\education portal\.agents\teamwork_preview_explorer_survey_db\progress.md — Progress heartbeat
- d:\education portal\.agents\teamwork_preview_explorer_survey_db\handoff.md — Final 5-Component survey handoff report
