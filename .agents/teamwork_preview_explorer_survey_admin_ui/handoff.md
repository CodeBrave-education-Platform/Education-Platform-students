# Handoff Report: Explorer 2 (Admin Portal UI & Components Scanner)

## 1. Observation
A complete audit of `d:\admin dashboard\src` was conducted across 62 application files, 35 component files, 3 utility modules, and 4 API routes. Specific observations include:

1. **Student CRM Mock Operations**:
   - In `d:\admin dashboard\src\app\admin\students\StudentRelationshipClient.jsx` (lines 151–165), `handleGrantNewCourse` uses `prompt()` to generate a fake course ID (`c-granted-${Date.now()}`) and updates only local React state without inserting into the Supabase `enrollments` table.
   - In lines 137–149, `handleRevokeCourse` only mutates local state without issuing a `DELETE` query to Supabase `enrollments`.
   - In lines 167–172, `handleBroadcastAnnouncement` triggers a toast without inserting into a `notifications` table.
   - In `d:\admin dashboard\src\app\admin\students\page.js` (lines 28–32) and `StudentRelationshipClient.jsx` (line 70), `enrolledCourses` is queried via `p.enrolled_courses` (a non-existent profile column) instead of joining the relational `enrollments` table.

2. **Dashboard Overview Metrics**:
   - In `d:\admin dashboard\src\components\AdminDashboardClient.jsx` (line 184), the metric card contains a hardcoded string `+8.2% this month`.
   - In line 140, `liveClassesCount` is computed as `courses.length` (a proxy) instead of querying active `live_sessions`.
   - In lines 98–115 and 127–136, `handleUpdateUserRole` and `filteredStudents` are defined but omitted from the rendered JSX.

3. **Student Telemetry Modal Hardcoded Fallbacks**:
   - In `d:\admin dashboard\src\components\batches\StudentTelemetryModal.jsx` (lines 97, 107, 117, 127, 156, 164), fallback strings include:
     - `preferred_subjects`: `'PCB (Physics, Chem, Bio)'` / `'PCM (Physics, Chem, Math)'`
     - `daily_study_hours`: `'8 Hours / Day'`
     - `test_average`: `'214 / 300'`
     - `syllabus_progress`: `'68% Completed'`
     - `dream_college`: `'AIIMS New Delhi'` / `'IIT Bombay (Computer Science)'`
     - `study_mentor`: `'Dr. Sarah Jenkins'`

4. **Test Compiler Mocking & Fallback Questions**:
   - In `d:\admin dashboard\src\components\TestCompiler.jsx` (lines 89–105), `handleRunAiParser` simulates AI extraction using `setTimeout` with static question objects (`q-ai-1-...`, `q-ai-2-...`).
   - In `d:\admin dashboard\src\app\admin\test-series\compiler\CompilerClient.jsx` (lines 83–115), `CourseExamCompilerTab.jsx` (lines 138–163), and `ExamCompilerTab.jsx` (lines 176–200), hardcoded fallback sample questions (`q-101`, `q-102`, `sample-qb-101`, `sample-qb-102`) are embedded for when queries fail.

5. **Legacy Monolith & Route Duplication**:
   - `d:\admin dashboard\src\components\CourseManageClient.jsx` is an obsolete 3,427-line monolithic file superseded by modular components in `src/components/courses/`.
   - `src/app/courses/page.js` and `src/app/admin/courses/page.js` contain duplicated course studio views.
   - `d:\admin dashboard\src\components\courses\CourseCreateModal.jsx` (line 58) defaults `instructor_id` to the logged-in admin user without offering an instructor selection dropdown.

6. **Invoice & Financial Audits**:
   - In `d:\admin dashboard\src\app\admin\invoices\InvoiceAuditClient.jsx` (line 61), `razorpayId` falls back to `'pay_Nsh721Hhs812'`.
   - Line 54 falls back to ID `'1001'`.
   - Line 76 applies a static `18 / 118` GST calculation.

---

## 2. Logic Chain
1. *From Observation 1*: Since Student CRM lacks real `INSERT` and `DELETE` queries on `enrollments` and relies on `prompt()` and in-memory IDs, any course access granted or revoked in the admin portal is lost on page reload and is never synced to the student dashboard.
2. *From Observation 2*: Since `AdminDashboardClient.jsx` uses static strings (`+8.2%`) and `courses.length` for live classes, admin users do not see real-time student growth or real-time classroom statistics.
3. *From Observation 3*: Since `StudentTelemetryModal.jsx` relies on fallback literals for test averages, daily study hours, and study mentors, inspecting student candidates shows identical placeholder data whenever those optional profile fields are unpopulated.
4. *From Observation 4*: Since `TestCompiler.jsx` contains a simulated `setTimeout` mock instead of calling the live `/api/admin/ai/parse-pdf` route, admins using this compiler interface receive static sample questions rather than real PDF extracts.
5. *From Observation 5*: Since `CourseManageClient.jsx` is a 3,427-line legacy artifact, maintaining it introduces confusion alongside the active modular components in `src/components/courses/`. Furthermore, lack of an instructor selector in `CourseCreateModal.jsx` prevents assigning specific teachers to courses.

---

## 3. Caveats
- Storage uploads in `CourseFilesManager.jsx` and `UniversalPdfImporterModal.jsx` depend on the active Supabase storage bucket `course-materials` being provisioned with public read permissions.
- Telemetry real-time stats in `LiveTelemetryTab.jsx` and `MonitorClient.jsx` require Upstash Redis environment variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) for live concurrency polling; when unavailable, they fall back to querying completed attempts from Supabase `test_attempts`.

---

## 4. Conclusion
The Admin Dashboard possesses a solid modern architecture (Next.js 16, Supabase SSR, Tailwind CSS 4, TanStack Table, Recharts, Framer Motion), but needs targeted backend query/mutation fixes to eliminate mock data:
1. Implement real `enrollments` CRUD and notification broadcasting in Student CRM (`StudentRelationshipClient.jsx`).
2. Remove fallback mock questions and connect `TestCompiler.jsx` to `/api/admin/ai/parse-pdf`.
3. Compute dynamic growth and live class counts in `AdminDashboardClient.jsx`.
4. Add dynamic instructor dropdown in `CourseCreateModal.jsx` / `CourseEditorDrawer.jsx`.
5. Remove obsolete 3,427-line `CourseManageClient.jsx` and consolidate duplicate `/courses` routes.

---

## 5. Verification Method
1. **Source Inspection**: Inspect reported files using `view_file` at documented line numbers.
2. **Report Verification**: Read complete detailed findings in `d:\education portal\.agents\teamwork_preview_explorer_survey_admin_ui\survey_admin_ui_report.md`.
3. **Build & Type Check**:
   - `cd "d:\admin dashboard"`
   - `npm run build` or `next lint` to verify build targets and linting across all modified files during subsequent implementation phases.
