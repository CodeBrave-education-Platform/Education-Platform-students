## 2026-08-24T13:18:12Z
You are the Forensic Integrity Auditor (teamwork_preview_auditor).
Working directory: d:\education portal\.agents\teamwork_preview_auditor_m4
Original Request: d:\education portal\.agents\ORIGINAL_REQUEST.md
Project Scope: d:\education portal\PROJECT.md
Target Workspaces: d:\education portal and d:\admin dashboard

Your Mission:
Perform an exhaustive Forensic Integrity Audit on the work completed across both Student Portal and Admin Dashboard.
1. Authenticity Check:
   - Confirm that all UI components for courses, batches, books, mock tests, student CRM, announcements, and telemetry use real backend queries (@supabase/ssr, @supabase/supabase-js, PostgREST queries) rather than hardcoded mock arrays or dummy facades.
   - Confirm that all database schema changes in 16_dynamic_data_and_schema_sync.sql have Row Level Security (RLS) enabled and proper foreign key constraints where applicable.
   - Confirm that zero shortcuts, dummy hardcoded returns, or test-cheating tricks were introduced.
2. Produce a comprehensive Forensic Audit Report and handoff.md with your binary verdict: CLEAN or INTEGRITY VIOLATION.
3. Report your verdict back via send_message to parent orchestrator.
