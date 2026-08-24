# Comprehensive Survey Report: Admin Dashboard UI Components & Hardcoded Data Audit

**Audited Codebase**: `d:\admin dashboard\src`  
**Date**: August 2026  
**Auditor**: Explorer 2 (Admin Portal UI & Components Scanner)  
**Status**: Complete Investigation & Architecture Audit  

---

## Executive Summary

A comprehensive scan of the Admin Dashboard codebase (`d:\admin dashboard\src`) was conducted across all pages (`src/app`), UI components (`src/components`), utilities (`src/utils`), and API endpoints (`src/app/api`). 

While the admin portal contains robust foundational Supabase integrations for Course blue-printing, Batch creation, Question Bank management, and Book Orders, several critical UI screens and interaction workflows currently rely on **hardcoded mock arrays, fake fallback constants, dummy KPI metrics, client-side only state mutations (missing Supabase RPCs/mutations), and duplicate legacy codebases**.

This report cataloges every instance of hardcoded placeholder data, identifies missing backend database operations, and specifies the exact dynamic schema mappings and Supabase query/mutation methods required for 100% production dynamic data parity.

---

## 1. Summary of Discovered Inventory & Findings

| Module / Domain | Affected File(s) | Primary Issue | Severity |
|---|---|---|---|
| **Dashboard Overview** | `src/components/AdminDashboardClient.jsx` | Hardcoded `+8.2%` KPI growth, proxy live classes count, unrendered student table logic | High |
| **Student CRM & Directory** | `src/app/admin/students/StudentRelationshipClient.jsx` | Fake course grant (`c-granted-${Date.now()}`), client-only course revocation, mock broadcast announcements, non-existent `enrolled_courses` column | Critical |
| **Student Telemetry Modal** | `src/components/batches/StudentTelemetryModal.jsx` | 6 hardcoded student telemetry fallbacks (`daily_study_hours`, `test_average`, `study_mentor`, etc.) | Medium |
| **Test Compiler & CBT Studio** | `src/components/TestCompiler.jsx`, `src/app/admin/test-series/compiler/CompilerClient.jsx` | Simulated AI parser (`setTimeout` with static questions), hardcoded fallback question pool (`q-101`, `q-102`, `q-103`) | High |
| **Course Exam Compiler Tab** | `src/components/courses/CourseExamCompilerTab.jsx`, `src/components/test-series/tabs/ExamCompilerTab.jsx` | Hardcoded fallback sample questions (`sample-qb-101`, `sample-qb-102`) when table is empty | Medium |
| **Course Studio & Blueprints** | `src/app/courses/page.js` vs `src/app/admin/courses/CourseStudioClient.jsx`, `src/components/CourseManageClient.jsx` | Duplicate page implementations, 3,427-line legacy monolithic client file, lack of instructor selector dropdown | High |
| **Invoices & Financial Audit** | `src/app/admin/invoices/InvoiceAuditClient.jsx` | Hardcoded fallback Razorpay payment ID (`pay_Nsh721Hhs812`), hardcoded fallback invoice ID `1001` | Low |
| **Book Store & Inventory** | `src/app/admin/books/BookInventoryClient.jsx`, `src/app/admin/books/orders/OrderFulfillmentClient.jsx` | Hardcoded author, stock, and default courier partner strings in modal templates | Low |
| **Admin Layout Shell** | `src/components/AdminLayoutShell.jsx` | Hardcoded fallback session user `admin@asentra.edu.in` | Medium |

---

## 2. Detailed Component-by-Component Audit

---

### Component 1: Admin Dashboard Overview Client
- **Relative Path**: `src/components/AdminDashboardClient.jsx`
- **Absolute Path**: `d:\admin dashboard\src\components\AdminDashboardClient.jsx`
- **Line Numbers**: Lines 138–140, 148, 184, 200, 98–115, 127–136

#### Observed Issues & Hardcoded Data:
1. **Hardcoded Metric Badges**:
   - Line 184: `<span ...>+8.2% this month</span>` — Static hardcoded growth badge.
   - Line 200: `<span ...>+{batchEnrollments.length} New Enrollments</span>` — Does not compute time-bounded delta (e.g. past 30 days).
2. **Simplified Proxy Counters**:
   - Line 140: `const liveClassesCount = courses.length; // Simplified proxy for live classes` — Uses `courses.length` instead of querying active `live_sessions` or `batches`.
3. **Dead / Unrendered Code**:
   - Lines 98–115: `handleUpdateUserRole` is fully declared but nowhere rendered in the UI.
   - Lines 127–136: `filteredStudents` search & role filter logic is defined but the table was removed from the JSX layout.

#### Proposed Dynamic Data Model:
- **Supabase Tables**:
  - `profiles`: Query total counts where `role = 'student'`.
  - `live_sessions`: Query `SELECT count(*) FROM live_sessions WHERE scheduled_start >= now() OR is_live = true`.
  - `enrollments` & `batch_enrollments`: Query enrollments created within the current calendar month for true month-over-month growth calculations.
  - `invoices`: Query `SELECT sum(amount_paid) FROM invoices WHERE status = 'captured'` for top-level financial KPI.

#### Recommended Query / Mutation Method:
```javascript
// Dynamic Dashboard Stats aggregation query
const [studentsCountRes, liveSessionsCountRes, revenueRes, monthlyEnrollmentsRes] = await Promise.all([
  supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
  supabase.from('live_sessions').select('id', { count: 'exact', head: true }).gte('scheduled_start', new Date().toISOString()),
  supabase.from('invoices').select('amount_paid').eq('status', 'captured'),
  supabase.from('enrollments').select('created_at').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
]);
```

---

### Component 2: Student Relationship Management Client
- **Relative Path**: `src/app/admin/students/StudentRelationshipClient.jsx`
- **Absolute Path**: `d:\admin dashboard\src\app\admin\students\StudentRelationshipClient.jsx`
- **Parent Server Page**: `src/app/admin/students/page.js`
- **Line Numbers**: Lines 28–32 (`page.js`), Lines 70, 72, 137–149, 151–165, 167–172 (`StudentRelationshipClient.jsx`)

#### Observed Issues & Hardcoded Data:
1. **Mock Course Granting**:
   - Lines 151–165 (`handleGrantNewCourse`): Prompts admin via `window.prompt()`, creates a dummy object `{ id: 'c-granted-' + Date.now(), title: courseTitle, accessDate: ... }` and only updates local React state. **No record is inserted into the Supabase `enrollments` table.**
2. **Client-Only Course Revocation**:
   - Lines 137–149 (`handleRevokeCourse`): Confirms via `window.confirm()` and filters out the course in local React state. **No `DELETE` query is sent to Supabase `enrollments`.**
3. **Simulated Notification Broadcast**:
   - Lines 167–172 (`handleBroadcastAnnouncement`): Simply triggers a local UI toast notification. **No notification row is written to any database table.**
4. **Incorrect Relation Assumption**:
   - Line 70: `enrolledCourses: Array.isArray(p.enrolled_courses) ? p.enrolled_courses : []` — Assumes `profiles` has an `enrolled_courses` column rather than joining relational table `enrollments`.
   - Line 72: `bookOrdersCount: 0` — Static 0 count.
   - `src/app/admin/students/page.js` (lines 28–32): `enrolledCourses: []` is passed empty from server component.

#### Proposed Dynamic Data Model:
- **Supabase Tables**:
  - `enrollments` (`id`, `user_id`, `course_id`, `created_at`, `status`, `expires_at`)
  - `courses` (`id`, `title`, `thumbnail_url`, `price`)
  - `book_orders` (`id`, `user_id`, `status`, `ordered_at`)
  - `notifications` or `system_announcements` (`id`, `sender_id`, `target_role`, `title`, `message`, `created_at`)

#### Recommended Query / Mutation Method:
```javascript
// 1. Fetch Students with Enrolled Courses and Book Orders Join
const { data: studentsData, error } = await supabase
  .from('profiles')
  .select(`
    *,
    enrollments (
      id,
      created_at,
      status,
      courses (id, title)
    ),
    book_orders (id),
    assessment_attempts (id)
  `)
  .order('created_at', { ascending: false });

// 2. Grant Course Access Mutation
const grantCourse = async (userId, courseId) => {
  const { data, error } = await supabase
    .from('enrollments')
    .insert([{ user_id: userId, course_id: courseId, status: 'active' }])
    .select('*, courses(id, title)')
    .single();
  if (error) throw error;
  return data;
};

// 3. Revoke Course Access Mutation
const revokeCourse = async (enrollmentId) => {
  const { error } = await supabase
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId);
  if (error) throw error;
};

// 4. Broadcast Announcement Mutation
const broadcastAnnouncement = async (adminId, message) => {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      sender_id: adminId,
      recipient_id: null, // null for platform-wide broadcast
      title: 'Platform Announcement',
      body: message,
      type: 'broadcast'
    }]);
  if (error) throw error;
};
```

---

### Component 3: Student Telemetry Modal
- **Relative Path**: `src/components/batches/StudentTelemetryModal.jsx`
- **Absolute Path**: `d:\admin dashboard\src\components\batches\StudentTelemetryModal.jsx`
- **Line Numbers**: Lines 97, 107, 117, 127, 156, 164

#### Observed Issues & Hardcoded Data:
When inspecting a student from the Cohort Batches Drawer, several student academic KPIs fall back to static strings:
- Line 97: `student.preferred_subjects || student.preferred_subject || (isNeet ? 'PCB (Physics, Chem, Bio)' : 'PCM (Physics, Chem, Math)')`
- Line 107: `student.daily_study_hours || '8 Hours / Day'`
- Line 117: `student.test_average || '214 / 300'`
- Line 127: `student.syllabus_progress || '68% Completed'`
- Line 156: `student.dream_college || (isNeet ? 'AIIMS New Delhi' : 'IIT Bombay (Computer Science)')`
- Line 164: `student.study_mentor || 'Dr. Sarah Jenkins'`

#### Proposed Dynamic Data Model:
- **Supabase Tables / Columns**:
  - `profiles.target_exam`: Exam target (JEE / NEET / Foundation).
  - `profiles.target_college`: Dream college text.
  - `profiles.assigned_mentor_id` -> references `profiles.id` (where role is `teacher` or `instructor`).
  - Dynamic Aggregation on `test_attempts`: Calculate real average score (`AVG(score)`).
  - Dynamic Aggregation on `lesson_progress`: Calculate completed lessons vs total lessons in enrolled course/batch (`COUNT(completed) / COUNT(total) * 100`).

#### Recommended Query / Mutation Method:
```javascript
// Fetch detailed student telemetry dynamically
const fetchStudentTelemetry = async (studentId, batchId) => {
  const [profileRes, attemptsRes, progressRes] = await Promise.all([
    supabase.from('profiles').select('*, mentor:assigned_mentor_id(full_name)').eq('id', studentId).single(),
    supabase.from('test_attempts').select('score').eq('user_id', studentId),
    supabase.from('lesson_progress').select('lesson_id, is_completed').eq('user_id', studentId)
  ]);
  
  const attempts = attemptsRes.data || [];
  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((a, b) => a + (b.score || 0), 0) / attempts.length) : 'N/A';
  
  return {
    profile: profileRes.data,
    avgScore,
    completedLessonsCount: (progressRes.data || []).filter(p => p.is_completed).length
  };
};
```

---

### Component 4: Test Series Exam Compiler & Question Pool
- **Relative Paths**:
  - `src/components/TestCompiler.jsx`
  - `src/app/admin/test-series/compiler/CompilerClient.jsx`
  - `src/components/courses/CourseExamCompilerTab.jsx`
  - `src/components/test-series/tabs/ExamCompilerTab.jsx`
- **Absolute Paths**:
  - `d:\admin dashboard\src\components\TestCompiler.jsx`
  - `d:\admin dashboard\src\app\admin\test-series\compiler\CompilerClient.jsx`
  - `d:\admin dashboard\src\components\courses\CourseExamCompilerTab.jsx`
  - `d:\admin dashboard\src\components\test-series\tabs\ExamCompilerTab.jsx`
- **Line Numbers**:
  - `TestCompiler.jsx`: Lines 86–115 (`handleRunAiParser` mock `setTimeout`)
  - `CompilerClient.jsx`: Lines 83–115 (`setPoolQuestions` hardcoded fallback questions `q-101`, `q-102`, `q-103`)
  - `CourseExamCompilerTab.jsx`: Lines 138–163 (`sample-qb-101`, `sample-qb-102`)
  - `ExamCompilerTab.jsx`: Lines 176–200 (`sample-qb-101`, `sample-qb-102`)

#### Observed Issues & Hardcoded Data:
1. **Mock AI PDF Parser in `TestCompiler.jsx`**:
   - Lines 86–115: `handleRunAiParser` does not invoke the Gemini AI route `/api/admin/ai/parse-pdf`. Instead, it uses `setTimeout` and loads 2 static questions (Electrostatics and Coordination Compounds).
2. **Fallback Sample Questions**:
   - In all three compiler components, if `question_bank` or `test_questions` is empty or query errors, hardcoded sample questions are seeded into the local list.

#### Proposed Dynamic Data Model:
- **Canonical Supabase Table**: `question_bank`
  - Fields: `id (uuid)`, `subject (text)`, `topic (text)`, `sub_topic (text)`, `difficulty (text: EASY/MEDIUM/HARD)`, `format_type (text: single_mcq, multi_mcq, numerical, assertion_reason, matrix_match)`, `content (text)`, `diagram_url (text)`, `options (jsonb)`, `correct_option_index (int)`, `correct_answer (text)`, `explanation (text)`, `marks_positive (numeric)`, `marks_negative (numeric)`, `tags (text[])`, `created_at (timestamptz)`
- **Assessment Questions Link Table**: `exam_questions` or `test_exam_questions`
  - Fields: `id (uuid)`, `exam_id (uuid)`, `question_id (uuid -> question_bank.id)`, `order_index (int)`, `section (text)`, `marks_positive (numeric)`, `marks_negative (numeric)`

#### Recommended Query / Mutation Method:
- In `TestCompiler.jsx`, replace the mock `handleRunAiParser` with the multimodal AI parsing flow already built in `UniversalPdfImporterModal.jsx` which calls `/api/admin/ai/parse-pdf-page` and `/api/admin/ai/parse-pdf`.
- Save compiled exams by writing exam metadata to `test_exams` and batch-inserting junction rows to `exam_questions`.

---

### Component 5: Courses Management & Legacy Code Duplication
- **Relative Paths**:
  - `src/app/courses/page.js`
  - `src/app/admin/courses/page.js`
  - `src/app/admin/courses/CourseStudioClient.jsx`
  - `src/components/CourseManageClient.jsx`
  - `src/components/courses/CourseCreateModal.jsx`
- **Absolute Paths**:
  - `d:\admin dashboard\src\app\courses\page.js`
  - `d:\admin dashboard\src\app\admin\courses\page.js`
  - `d:\admin dashboard\src\app\admin\courses\CourseStudioClient.jsx`
  - `d:\admin dashboard\src\components\CourseManageClient.jsx`
  - `d:\admin dashboard\src\components\courses\CourseCreateModal.jsx`
- **Line Numbers**:
  - `CourseCreateModal.jsx`: Lines 57–72 (instructor ID default)
  - `CourseManageClient.jsx`: Lines 1–3427 (entire legacy file)

#### Observed Issues & Hardcoded Data:
1. **Duplicate Routes**:
   - `/courses` (`src/app/courses/page.js`) and `/admin/courses` (`src/app/admin/courses/page.js` + `CourseStudioClient.jsx`) render identical Course Catalog & Blueprint UIs.
2. **3,427-Line Legacy Monolith**:
   - `src/components/CourseManageClient.jsx` is an obsolete monolithic component containing hardcoded formula snippets (lines 127–137), an inline PDF parser, and redundant tabs superseded by `src/components/courses/*` modular components (`CourseGrid`, `CourseEditorDrawer`, `CourseFilesManager`, `SyllabusTreeEditor`, `CourseExamCompilerTab`).
3. **Missing Instructor Assignment**:
   - `CourseCreateModal.jsx` (line 58) assigns `instructor_id: user?.id || null` (the currently logged-in administrator). It lacks an instructor dropdown selector to assign a specific teacher/instructor profile from `profiles WHERE role IN ('teacher', 'instructor')`.

#### Recommended Solution:
- Consolidate `/courses` and `/admin/courses` into a single canonical route.
- Deprecate/remove `CourseManageClient.jsx`.
- In `CourseCreateModal.jsx` and `CourseEditorDrawer.jsx`, query instructors `supabase.from('profiles').select('id, full_name, email').in('role', ['teacher', 'instructor'])` and provide a dynamic instructor selection dropdown.

---

### Component 6: Invoices & Financial Audit Ledger
- **Relative Paths**:
  - `src/app/admin/invoices/page.js`
  - `src/app/admin/invoices/InvoiceAuditClient.jsx`
  - `src/components/InvoiceModal.jsx`
- **Absolute Paths**:
  - `d:\admin dashboard\src\app\admin\invoices\page.js`
  - `d:\admin dashboard\src\app\admin\invoices\InvoiceAuditClient.jsx`
  - `d:\admin dashboard\src\components\InvoiceModal.jsx`
- **Line Numbers**:
  - `InvoiceAuditClient.jsx`: Lines 54, 61, 76
  - `InvoiceModal.jsx`: Lines 11–13, 16–27, 34–36

#### Observed Issues & Hardcoded Data:
1. **Placeholder Fallbacks**:
   - Line 61 (`InvoiceAuditClient.jsx`): `razorpayId: inv.razorpay_payment_id || 'pay_Nsh721Hhs812'` — Uses a hardcoded mock Razorpay payment ID string if missing.
   - Line 54 (`InvoiceAuditClient.jsx`): `id: inv.id ? inv.id.slice(0, 8).toUpperCase() : '1001'` — Fallback invoice ID `1001`.
2. **Hardcoded GST & HSN Rules**:
   - Line 76: `const totalGst = Math.round(totalRevenue * (18 / 118))` — Hardcoded 18% GST calculation formula across all items.
   - `InvoiceModal.jsx` (lines 17–27): Hardcoded static HSN codes (`999293` for courses/batches, `490110` for books, `999294` for test series).

#### Proposed Dynamic Data Model:
- **Supabase Table**: `invoices`
  - Fields: `id (uuid)`, `invoice_number (text)`, `user_id (uuid -> profiles.id)`, `course_id (uuid -> courses.id)`, `batch_id (uuid -> batches.id)`, `package_id (uuid -> test_packages.id)`, `book_id (uuid -> books.id)`, `amount_paid (numeric)`, `tax_amount (numeric)`, `hsn_code (text)`, `razorpay_payment_id (text)`, `razorpay_order_id (text)`, `status (text: captured, pending, refunded)`, `invoice_date (timestamptz)`, `billing_address (jsonb)`

---

### Component 7: Book Inventory & Orders Fulfillment
- **Relative Paths**:
  - `src/app/admin/books/page.js`
  - `src/app/admin/books/BookInventoryClient.jsx`
  - `src/app/admin/books/orders/page.js`
  - `src/app/admin/books/orders/OrderFulfillmentClient.jsx`
- **Absolute Paths**:
  - `d:\admin dashboard\src\app\admin\books\page.js`
  - `d:\admin dashboard\src\app\admin\books\BookInventoryClient.jsx`
  - `d:\admin dashboard\src\app\admin\books\orders\page.js`
  - `d:\admin dashboard\src\app\admin\books\orders\OrderFulfillmentClient.jsx`
- **Line Numbers**:
  - `BookInventoryClient.jsx`: Lines 50–55 (`author: 'Asentra Academic Board'`, `price: '549'`, `original_price: '799'`, `stock_quantity: '50'`)
  - `OrderFulfillmentClient.jsx`: Lines 41, 50 (`courier_partner: 'BlueDart Express'`)

#### Observed Issues & Hardcoded Data:
1. **Creation Templates**: Default hardcoded form state values for new book creations and dispatch courier partners.
2. **Dynamic Operations**: The actual queries and updates to `books` and `book_orders` tables are properly connected to Supabase (`insert`, `update`, `delete`).

---

### Component 8: Admin Layout Shell & Command Palette
- **Relative Paths**:
  - `src/components/AdminLayoutShell.jsx`
  - `src/components/CommandPalette.jsx`
- **Absolute Paths**:
  - `d:\admin dashboard\src\components\AdminLayoutShell.jsx`
  - `d:\admin dashboard\src\components\CommandPalette.jsx`
- **Line Numbers**:
  - `AdminLayoutShell.jsx`: Line 200 (`setAdminUser(user || { email: 'admin@asentra.edu.in' })`)
  - `AdminLayoutShell.jsx`: Line 195 (`document.cookie.includes('admin_session=true')`)

#### Observed Issues:
- Line 200 fallback user `{ email: 'admin@asentra.edu.in' }` when session check fails but cookie is present.
- Should enforce strict Supabase SSR token validation and redirect unauthorized sessions.

---

## 3. Supabase Integration Audit Matrix

The following table summarizes current Supabase database tables utilized vs missing query/mutation hooks across the admin portal:

| Table Name | Used In | Operations Supported | Missing Operations / Deficiencies |
|---|---|---|---|
| `profiles` | All pages, dashboard, students | `SELECT`, `UPDATE` | Student CRM does not join `enrollments` or `batch_enrollments`; role update not rendered on dashboard |
| `courses` | `/courses`, `/dashboard`, sidebar | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Missing dynamic instructor assignment dropdown |
| `lessons` | `SyllabusTreeEditor.jsx` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | None (fully dynamic) |
| `course_files` | `CourseFilesManager.jsx` | `SELECT`, `INSERT`, `DELETE` | Storage fallback uses hardcoded path if bucket upload fails |
| `batches` | `/batches`, sidebar | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | Missing mentor assignment selector |
| `batch_enrollments` | `BatchEditorDrawer.jsx`, `BatchesManagementPage` | `SELECT`, `INSERT`, `DELETE` | None (properly dynamic) |
| `enrollments` | `/dashboard`, `src/app/admin/students` | `SELECT` | Missing `INSERT` (grant course) and `DELETE` (revoke course) mutations in Student CRM |
| `test_packages` | `/admin/test-series` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | None (properly dynamic) |
| `test_exams` | `/admin/test-series`, `/admin/test-series/compiler` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | None (properly dynamic) |
| `question_bank` | `/admin/questions`, `CourseExamCompilerTab`, `ExamCompilerTab` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | `TestCompiler.jsx` uses mock AI parser instead of live endpoint |
| `test_attempts` | `MonitorClient.jsx`, `LiveTelemetryTab.jsx`, `SubmissionsTab.jsx` | `SELECT` | Telemetry polling uses Upstash Redis + Supabase queries |
| `assessments` | `CourseEditorDrawer.jsx`, `gradebook/page.js` | `SELECT`, `INSERT`, `DELETE` | None (properly dynamic) |
| `books` | `/admin/books` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | None (properly dynamic) |
| `book_orders` | `/admin/books/orders` | `SELECT`, `UPDATE` | Not queried in student profile view |
| `invoices` | `/admin/invoices`, `/admin/test-series` | `SELECT` | Placeholder Razorpay ID fallback in client presentation |
| `notifications` | Missing | None | No table integration for admin broadcast announcements |

---

## 4. Prioritized Recommendations & Action Items

### High Priority (Critical for Data Integrity)
1. **Fix Student Relationship Manager (`src/app/admin/students/StudentRelationshipClient.jsx`)**:
   - Replace fake `c-granted-${Date.now()}` with a real course picker modal querying `courses` and performing `supabase.from('enrollments').insert()`.
   - Implement real `supabase.from('enrollments').delete().eq('id', enrollmentId)` in `handleRevokeCourse`.
   - Create and connect a `notifications` table for `handleBroadcastAnnouncement`.
   - Update `profiles` query in `src/app/admin/students/page.js` to join `enrollments(id, created_at, status, courses(id, title))` and `book_orders(id)`.

2. **Clean Up Legacy Code & Route Duplication**:
   - Deprecate and remove obsolete 3,427-line `src/components/CourseManageClient.jsx`.
   - Consolidate `/courses` and `/admin/courses` to use single canonical modern components from `src/components/courses/`.
   - In `TestCompiler.jsx`, remove the mock `handleRunAiParser` and wire up the real multimodal PDF parser.

### Medium Priority (UI & Metric Accuracy)
3. **Dynamic Dashboard Overview Metrics (`src/components/AdminDashboardClient.jsx`)**:
   - Calculate month-over-month growth dynamically instead of static `+8.2%`.
   - Query live sessions count from `live_sessions` instead of proxying with `courses.length`.
   - Add revenue summary KPI from `invoices`.

4. **Dynamic Student Telemetry Modal (`src/components/batches/StudentTelemetryModal.jsx`)**:
   - Calculate test averages and syllabus progress dynamically from `test_attempts` and `lesson_progress`.
   - Remove hardcoded fallbacks like `'Dr. Sarah Jenkins'`, `'214 / 300'`, and `'8 Hours / Day'`.

5. **Instructor Assignment in Blueprints**:
   - Add instructor selector dropdown in `CourseCreateModal.jsx` and `BatchCreateModal.jsx` querying `profiles WHERE role IN ('teacher', 'instructor')`.

---

## 5. Verification Checklist

- [x] All `.js` and `.jsx` files in `src/app`, `src/components`, `src/utils`, `src/app/api` scanned.
- [x] Line numbers and variable names documented for every hardcoded data instance.
- [x] Schema mappings and Supabase table names identified.
- [x] Missing CRUD queries and mutations documented.
- [x] Clean separation of concerns between client components, server components, and API routes verified.
