## 2026-08-24T13:08:18Z

You are Worker M3 (Admin Dashboard Dynamic Data Integration Builder).
Working directory: `d:\education portal\.agents\worker_m3`
Original Request: `d:\education portal\.agents\ORIGINAL_REQUEST.md`
Project Scope: `d:\education portal\PROJECT.md`
Admin Survey Report: `d:\education portal\.agents\teamwork_preview_explorer_survey_admin_ui\survey_admin_ui_report.md`
DB Migration: `d:\education portal\supabase\migrations\16_dynamic_data_and_schema_sync.sql`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks in `d:\admin dashboard`:
1. `src/app/admin/students/StudentRelationshipClient.jsx` & `src/app/admin/students/page.js`:
   - In `handleGrantNewCourse`: Replace `prompt()` and in-memory mock IDs (`c-granted-...`) with genuine Supabase `INSERT` into `public.enrollments` (`user_id`, `course_id`, `status: 'active'`).
   - In `handleRevokeCourse`: Replace local state deletion with genuine Supabase `DELETE` / `UPDATE status = 'cancelled'` on `public.enrollments`.
   - In `handleBroadcastAnnouncement`: Replace toast-only handler with genuine Supabase `INSERT` into `public.announcements` (`title`, `message`, `target_audience`, `author_id`).
   - In `src/app/admin/students/page.js` and `StudentRelationshipClient.jsx`: Query enrolled courses by joining the relational `public.enrollments` and `public.courses` tables rather than querying the non-existent `profiles.enrolled_courses`.
2. `src/components/AdminDashboardClient.jsx`:
   - Replace hardcoded `+8.2% this month` and static growth metrics with dynamic calculations.
   - Replace `courses.length` proxy with dynamic query on `public.live_sessions` (or `public.batches`).
3. `src/components/batches/StudentTelemetryModal.jsx`:
   - Fetch real telemetry metrics from `public.user_progress` and `public.test_attempts` and render empty states gracefully when student has no attempts, without hardcoded fallback strings.
4. `src/components/courses/CourseCreateModal.jsx` & `src/components/courses/CourseEditorDrawer.jsx`:
   - Add dynamic instructor selection dropdown querying `public.instructors` / `public.profiles` (`role IN ('teacher', 'instructor', 'admin')`).
5. `src/app/admin/invoices/InvoiceAuditClient.jsx`:
   - Remove hardcoded fallback payment IDs (`pay_Nsh721Hhs812`, `'1001'`) and render dynamic invoice rows from `public.invoices`.
6. `src/components/TestCompiler.jsx`, `src/app/admin/test-series/compiler/CompilerClient.jsx`, `src/components/test-series/tabs/ExamCompilerTab.jsx`, `src/components/test-series/tabs/CourseExamCompilerTab.jsx`:
   - Remove fallback dummy questions (`q-101`, `q-102`, `sample-qb-101`, `sample-qb-102`) and query `public.question_bank` dynamically.
7. Verification:
   - Run `npm run build` or Next.js build / typecheck in `d:\admin dashboard` to verify zero syntax errors or build failures.
8. Write `handoff.md` in your working directory and report back.
