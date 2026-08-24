# Orchestrator 4 Dispatch

## Identity & Assignment
- **Role**: Project Orchestrator
- **Working Directory**: `d:\education portal\.agents\orchestrator_4`
- **Original Request**: `d:\education portal\.agents\ORIGINAL_REQUEST.md`

## Mission Scope
Scan both Student Portal (`d:\education portal`) and Admin Portal (`d:\admin dashboard`) for UI components with hardcoded placeholder data.
1. Identify all static/placeholder data structures (courses, batches, mock tests, instructor profiles, etc.).
2. Replace hardcoded data with dynamic queries via Supabase client libraries (`@supabase/ssr` / `@supabase/supabase-js`).
3. Generate missing database schemas/migrations with Row Level Security (RLS) enabled and proper foreign key constraints where applicable.
4. Execute rigorous multi-round exploration, implementation, review, and verification.
5. Record real-time progress to `progress.md` and keep `BRIEFING.md` updated.

