# BRIEFING — 2026-08-24T13:08:00Z

## Mission
Author and deploy production-grade Supabase SQL migration `16_dynamic_data_and_schema_sync.sql` across Student Portal and Admin Dashboard workspaces to support dynamic data fetching, schema enhancements for batches and books, announcements, student bookmarks, instructor views, and rich seed data.

## 🔒 My Identity
- Archetype: Implementer & Database Architect
- Roles: implementer, qa, specialist
- Working directory: `d:\education portal\.agents\worker_m1`
- Original parent: `59ab231a-b8f9-42bd-b147-b32955fd7afe`
- Milestone: M1 Database Schema & Migration Builder

## 🔒 Key Constraints
- Production-grade PostgreSQL / Supabase SQL syntax
- Place identical migration files in both `d:\education portal\supabase\migrations\16_dynamic_data_and_schema_sync.sql` and `d:\admin dashboard\supabase\migrations\16_dynamic_data_and_schema_sync.sql`
- Add columns to `public.batches` (faculty, faculty_role, instructor_name, instructor_role, target_year, schedule, seats_left, students_enrolled, original_price, rating, badge, checklist, book_kit, curriculum, is_featured, is_active)
- Add columns to `public.books` (subject, category, rating, reviews_count, format, cover_image_url, stock)
- Create `public.announcements` table with RLS enabled and proper policies
- Create `public.student_bookmarks` table with RLS enabled and user ownership policies
- Create `public.instructors` view with `security_invoker = true`
- Insert comprehensive dynamic seed rows for courses, batches, books, test packages, test exams, question bank, exam questions, and announcements
- Adhere to Supabase best practices: avoid deprecated `auth.role()`, use `(select auth.uid())` for subquery scalar caching, enforce RLS on all exposed schemas

## Current Parent
- Conversation ID: `59ab231a-b8f9-42bd-b147-b32955fd7afe`
- Updated: 2026-08-24T13:08:00Z

## Task Summary
- **What to build**: Migration `16_dynamic_data_and_schema_sync.sql` in both repositories with complete schema enhancements, RLS, indexes, and full seed catalog.
- **Success criteria**: 100% parity across both repos, all schema additions and new tables with RLS and constraints, valid SQL and JSON data, test coverage.
- **Interface contracts**: Supabase PostgreSQL 15+, Next.js 16 / React 19 SSR client integration.

## Key Decisions Made
- Used `ADD COLUMN IF NOT EXISTS` for seamless backward-compatibility and zero downtime.
- Used `security_invoker = true` on `public.instructors` view to preserve RLS on the underlying `public.profiles` table.
- Seeded comprehensive catalog rows for Flagship JEE, NEET, and Foundation programs with realistic pricing, checklists, book kits, and curricula.
- Implemented automated sync call to `public.sync_test_exams_questions_from_bank()` ensuring CBT test exams JSON questions remain fully synced.

## Change Tracker
- **Files modified**:
  - `d:\education portal\supabase\migrations\16_dynamic_data_and_schema_sync.sql` — Main production migration 16
  - `d:\admin dashboard\supabase\migrations\16_dynamic_data_and_schema_sync.sql` — Synchronized migration 16 copy
  - `d:\education portal\tests\migration_16_validator.mjs` — Automated validation test suite
- **Build status**: PASS
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (Verified all 9 structural, schema, RLS, and seed validation criteria)
- **Lint status**: Clean (Supabase best practices compliant, no deprecated functions)
- **Tests added/modified**: `tests/migration_16_validator.mjs`

## Loaded Skills
- **Source**: `d:\education portal\.agents\skills\supabase\SKILL.md`
- **Source**: `d:\education portal\.agents\skills\supabase-postgres-best-practices\SKILL.md`
