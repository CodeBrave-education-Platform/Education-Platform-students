# Comprehensive Cross-Portal Architecture & Mobile UI/UX Investigation Report

**Target Repositories**:
- Admin Dashboard: `D:\admin dashboard`
- Student Portal: `D:\education portal`

**Date**: 2026-08-20
**Explorer**: Admin Dashboard & Cross-Portal Layout Explorer

---

## Executive Summary

This investigation conducted an exhaustive architectural and layout audit across both the **Admin Dashboard** and **Student Portal** codebases. Key areas investigated include the Central Question Bank & Test Package workflows, mobile responsiveness of navigation/sidebars and data grids, non-CBT Student Portal pages, CBT Exam Engine mobile UX, and cross-portal database/hydration/state synchronization.

### Critical Systemic Findings:
1. **Decoupling Disconnect & Schema Schism**:
   - Admin Question Bank (`/admin/questions`) inserts questions into `public.questions`, whereas the Exam Compiler (`/admin/test-series`) queries `public.test_questions` and serializes questions as a static JSONB blob into `test_exams.questions`.
   - Modifying a question in the bank **never** updates existing exams.
   - Answer format mismatch: `correct_option_index` (integer) in `test_questions`/CBT engine vs. `correct_answer` (string/array) in `questions`/Question Bank studio.
2. **CBT Exam Engine Mobile Usability Crisis**:
   - The question palette is rendered as a fixed-width `w-80` sidebar side-by-side with the question panel without a collapsible drawer or bottom sheet on mobile, squeezing the question content into <100px width on smartphones.
3. **Student Portal Navigation Disappearance**:
   - `Navbar.jsx` contains `if (!user) return null`. Multiple pages (`/batches`, `/courses`, `/books`, `/books/my-orders`, `/books/checkout`) render `<Navbar />` without passing `user`/`profile` props, causing the navigation header to completely disappear.
4. **Data Grid & Table Mobile Responsiveness**:
   - Tables across Admin (`StudentRelationshipClient`, `InvoiceAuditClient`, `OrderFulfillmentClient`) rely on wide horizontal scroll containers without responsive card/stacked views, and search toolbars lack `flex-col` breakpoints on small screens.
5. **Next.js SSR Hydration Flaws**:
   - Direct `localStorage.getItem` evaluation during render (e.g. `DashboardClient.jsx:1511`) and un-guarded `toLocaleDateString()` / `toLocaleString()` calls produce SSR vs. client mismatches.

---

## Part 1: Admin Dashboard UI/UX & Workflow Audit

### 1.1 Navigation Shell, Sidebar & Topbar Responsiveness
- **Layout Component**: `D:\admin dashboard\src\components\AdminLayoutShell.jsx`
- **Observations**:
  - Desktop sidebar (`w-64` collapsible to `w-20`) functions well with CSS transition and icon collapsing.
  - Mobile drawer: Uses fixed overlay with `sidebarOpen` state.
  - **Defect**: Clicking navigation links inside `SidebarNav` does **not** call `setSidebarOpen(false)`. On mobile viewports (<1024px), after navigating to a new route, the sidebar stays open over the viewport until the user manually taps the small close button or backdrop.
  - **Theme Inconsistency**: Main shell container has hardcoded light gradients (`bg-[radial-gradient(...)] from-indigo-50 via-white to-emerald-50 text-slate-900`) while individual child views (e.g. `InvoiceAuditClient.jsx`) use hardcoded dark themes (`bg-slate-950 text-slate-100`), creating jarring visual contrast.

### 1.2 Question Bank & Test Package Workflows

#### A. Question Bank Studio (`/admin/questions`)
- **File**: `D:\admin dashboard\src\app\admin\questions\QuestionBankClient.jsx`
- **Features Observed**:
  - Supports 5 NTA question formats: Single MCQ (`single_mcq`), Multi-Select MCQ (`multi_mcq`), Numerical (`numerical`), Assertion & Reasoning (`assertion_reason`), Matrix Match (`matrix_match`).
  - KaTeX live math rendering via `KatexRenderer.jsx`.
  - Subject filtering (`Physics`, `Chemistry`, `Mathematics`, `Biology`), keyword search, difficulty badges (`EASY`, `MEDIUM`, `HARD`), topic and sub-topic tagging.
  - AI PDF Question Parsing via `UniversalPdfImporterModal.jsx`.
- **Architectural Gaps**:
  - Interacts exclusively with Supabase table `questions`.
  - Has no UI or API connection to link authored questions to `test_packages` or `test_exams`.
  - Correct answer format is authored as free-form string or array (`formCorrectAnswer`), whereas the CBT engine expects `correct_option_index` integer (`0, 1, 2, 3`).

#### B. Test Package & CBT Exam Compiler Studio (`/admin/test-series`)
- **Files**:
  - `D:\admin dashboard\src\app\admin\test-series\page.js`
  - `D:\admin dashboard\src\components\test-series\TestSeriesEditorDrawer.jsx`
  - `D:\admin dashboard\src\components\test-series\tabs\ExamCompilerTab.jsx`
  - `D:\admin dashboard\src\components\TestCompiler.jsx`
- **Workflow Traced**:
  1. Admin creates a Test Package blueprint (`test_packages` table).
  2. In `TestSeriesEditorDrawer.jsx`, admin navigates to `ExamCompilerTab.jsx`.
  3. `ExamCompilerTab.jsx` fetches questions from `public.test_questions` (table #2) rather than `public.questions` (table #1).
  4. When admin clicks "Compile & Publish Exam", questions are packaged as a JSON array and written directly into `test_exams.questions` (JSONB column).
- **Critical Flaw**:
  - No relational junction table (`exam_questions`) exists.
  - Questions are stored as frozen static JSON copies. If an instructor corrects an errata in a question in the Question Bank, the exam continues to serve the outdated/incorrect question.

---

### 1.3 Data Grids & Table Mobile Responsiveness

| Screen / Component | File Location | Desktop Behavior | Mobile / Tablet Behavior | Flaws & UX Degradation |
|---|---|---|---|---|
| **Student Manager** | `app/admin/students/StudentRelationshipClient.jsx` | TanStack data grid with omnibar search & sorting | Horizontal scroll `overflow-x-auto min-h-[400px]` | Search input (`w-80`) and pagination buttons wrap awkwardly without `flex-col`; 6 table columns require extreme horizontal panning on mobile phones. |
| **Course Studio** | `components/courses/CourseGrid.jsx` | Bento cards + TanStack table toggle | Cards stack to 1 col; table scrolls horizontally | Card view degrades nicely; table view has fixed widths and overflows mobile screens. |
| **Batch Studio** | `components/batches/BatchGrid.jsx` | Bento cards + stats header | Cards stack to 1 col | Drawer editor takes 100% width on mobile; nested roster table requires card transformation. |
| **Tax Invoices & Ledger** | `app/admin/invoices/InvoiceAuditClient.jsx` | 6-column dark table with KPI metrics | Horizontal scroll table | Un-responsive table on mobile screens (<640px); dark theme clashes with shell; un-localized date formatting. |
| **Book Inventory** | `app/admin/books/BookInventoryClient.jsx` | Bento textbook cards | Stacks to 1 col | Modal forms need scrollable mobile containers (`max-h-[90vh] overflow-y-auto`). |
| **Book Orders Fulfillment** | `app/admin/books/orders/OrderFulfillmentClient.jsx` | Table with address chips & tracking links | Horizontal scroll table | Address column (`max-w-xs`) and action buttons break layout on small phones. |
| **Gradebook** | `app/gradebook/page.js` | Course selector + telemetry scorecard | Table with horizontal overflow | Nested student attempts list requires card-based layout on mobile viewports. |

---

## Part 2: Student Portal UI/UX across Non-CBT Pages

### 2.1 Navigation Architecture & Mobile Bottom Bar
- **Header Component**: `D:\education portal\src\components\Navbar.jsx`
- **Mobile Bottom Navigation**: `D:\education portal\src\components\navigation\MobileBottomNav.jsx`
- **Sidebar**: `D:\education portal\src\components\navigation\Sidebar.jsx` (Placeholder; sidebars are inlined in `DashboardClient.jsx` and `ProfileClient.jsx` with `hidden md:flex`).

#### Major Navigation Bugs Identified:
1. **Silent Navbar Drop Bug**:
   ```javascript
   // Navbar.jsx (lines 42-44)
   if (!user) {
     return null
   }
   ```
   When pages render `<Navbar />` without passing the `user` object, `Navbar` returns `null`.
   **Affected Pages**:
   - `/batches` (`src/app/batches/page.jsx:351`)
   - `/courses` (`src/app/courses/page.jsx:326`)
   - `/books` (`src/app/books/page.jsx:135`)
   - `/books/my-orders` (`src/app/books/my-orders/page.jsx:55`)
   - `/books/checkout` (`src/app/books/checkout/page.jsx:108`)
   - `/policies/[slug]` (`src/app/policies/[slug]/page.jsx:127`)
   *Result*: Students navigating to these pages lose the top navigation bar completely.
2. **Mobile Bottom Bar Occlusion (Z-Index / Padding Conflict)**:
   - `MobileBottomNav.jsx` is `fixed bottom-0 left-0 w-full h-16 z-50`.
   - Pages like `/courses`, `/batches`, `/books/my-orders`, and `/profile` lack `pb-20 md:pb-0` bottom padding. Consequently, footer links, sticky action buttons, and bottom cards are hidden behind the bottom navigation bar on mobile phones.
3. **Profile Page Asymmetric Mobile Padding**:
   - `ProfileClient.jsx:110` has `div className="... px-0 pr-4 md:pr-6"`. On mobile viewports (<768px), this results in 0px padding on the left edge and 16px padding on the right edge, causing an unaligned, skewed layout.

---

### 2.2 CBT Exam Engine Mobile Layout Breakdown (R2 Context)
- **File**: `D:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx`
- **Critical Flaws**:
  1. **Dual Column Split on Mobile**:
     - Line 403 & 526: Question Workspace (`flex-1`) and Question Palette (`w-80 bg-slate-50 shrink-0`) are rendered side-by-side without a responsive breakpoint (`hidden lg:flex` or drawer).
     - On an iPhone/Android screen (375px width), the palette occupies 320px, leaving only 55px for the question text and options!
  2. **Header Element Crowding**:
     - Line 332: Header packs Exam Title, Online/Offline badge, Calculator button, Scratchpad button, Reset button, Countdown Timer, and Submit button horizontally in a single flex row.
     - On mobile screens, elements overlap and overflow horizontally off-screen.
  3. **Lack of Bottom Sheet Question Navigation**:
     - No mobile drawer or bottom sheet exists for fast question-jumping. Students must horizontally pan or struggle with crushed touch targets.

---

## Part 3: Hydration Mismatches, DB Constraints & State Management

### 3.1 Database Schema Mismatches & Decoupling Strategy

#### Current DB Schema Disconnect:
1. `public.questions` (from `07_jee_pipeline.sql`):
   - Has constraint `assessment_id uuid references public.assessments(id) NOT NULL`.
   - Used by Course LMS assessments and Admin Question Bank studio.
2. `public.test_questions` (from `14_test_series.sql`):
   - Standalone question table used by Test Series Exam Compiler.
3. `public.test_exams.questions` (JSONB column):
   - Stores serialized questions as snapshot data.

#### Required Unified Architecture (R1):
```
┌─────────────────────────────────────────────────────────────┐
│                 Global Question Bank                        │
│                 (public.questions)                          │
│  - id: UUID (PK)                                            │
│  - subject: TEXT                                            │
│  - topic: TEXT                                              │
│  - sub_topic: TEXT                                          │
│  - difficulty: TEXT (easy/medium/hard)                      │
│  - format_type: TEXT (single_mcq, multi_mcq, numerical...)  │
│  - content: TEXT (Markdown + LaTeX)                         │
│  - diagram_url: TEXT                                        │
│  - options: JSONB (Array of choices)                        │
│  - correct_option_index: INT / correct_answer: TEXT/JSONB   │
│  - marks_positive: INT / marks_negative: INT                │
│  - explanation: TEXT                                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                1:N via junction table
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 public.exam_questions                       │
│  - id: UUID (PK)                                            │
│  - exam_id: UUID (FK -> test_exams.id ON DELETE CASCADE)    │
│  - question_id: UUID (FK -> questions.id ON DELETE CASCADE) │
│  - section: TEXT DEFAULT 'Section A'                        │
│  - sort_order: INT DEFAULT 0                                │
│  - marks_positive_override: INT (NULLABLE)                  │
│  - marks_negative_override: INT (NULLABLE)                  │
│  - UNIQUE(exam_id, question_id)                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ N:1
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 public.test_exams                           │
│  - id: UUID (PK)                                            │
│  - package_id: UUID (FK -> test_packages.id)                │
│  - title: TEXT                                              │
│  - duration_minutes: INT                                    │
│  - marks_scheme: JSONB                                      │
│  - is_live_ranking: BOOLEAN                                 │
│  - activation_timestamp: TIMESTAMPTZ                        │
└─────────────────────────────────────────────────────────────┘
```

#### SQL Migration Requirements:
- Step 1: Normalize `public.questions` table so `assessment_id` is nullable or removed, and ensure columns (`subject`, `topic`, `sub_topic`, `format_type`, `difficulty`, `content`, `diagram_url`, `options`, `correct_option_index`, `correct_answer`, `explanation`, `marks_positive`, `marks_negative`) exist.
- Step 2: Create junction table `public.exam_questions`.
- Step 3: Run safe ETL migration:
  - Extract all JSON objects inside `test_exams.questions` (JSONB) and `test_questions`.
  - Insert unique questions into `public.questions`.
  - Populate `public.exam_questions` linking each `test_exams.id` to its corresponding `questions.id`.
  - Maintain zero data loss.
- Step 4: Update CBT Engine and `/api/test-series/grade` to query `exam_questions JOIN questions` (with blind views/queries for students).

---

### 3.2 Next.js SSR Hydration Vulnerabilities Detected

| File & Line | Hydration Vulnerability | Root Cause | Impact | Recommended Fix |
|---|---|---|---|---|
| `DashboardClient.jsx:1511` | `typeof window !== 'undefined' && JSON.parse(localStorage.getItem(...))` | `localStorage` evaluated during SSR render cycle | HTML tree mismatch between SSR (un-enrolled button) and client (enrolled button) | Move `localStorage` reading to `useEffect` or state initialized after mount (`mounted === true`). |
| `CbtEngineClient.jsx:97` | `useState(typeof window !== 'undefined' ? navigator.onLine : true)` | `typeof window` check in initial `useState` | SSR renders `true`, client during offline renders `false` | Initialize to `true` and update via `useEffect` event listener. |
| `StudentRelationshipClient.jsx:52,72` | `new Date(p.created_at).toLocaleDateString()` | Locale & Timezone differences between Node.js server and client browser | Dates format differently (e.g. "8/20/2026" vs "20/8/2026") | Use fixed format utility `formatDateSafe()` or `suppressHydrationWarning`. |
| `InvoiceAuditClient.jsx:180` | `new Date(inv.date).toLocaleDateString()` | Unformatted locale date in SSR | Client/Server date string mismatch | Use consistent date formatter utility with ISO/locale standard. |
| `ExamClient.jsx:516,546` | `new Date(assessment.start_window).toLocaleString()` | `toLocaleString()` rendered directly in JSX | Server timezone mismatch | Format on client after mount or use standard date helper. |
| `coursera/page.js:137-147` | Multiple `localStorage.getItem` reads inside component body | Uncontrolled direct client storage access | Hydration errors and SSR crash | Move into `useEffect` hook. |

---

### 3.3 State Management & Invalidation Consistency
- **Cache Invalidation**:
  - Admin calls `invalidateCache('catalog', packageId)` when creating/updating packages.
  - When questions in the global bank are updated, cache invalidation must propagate to Redis keys for linked exams: `asentra:exam:${examId}` and `asentra:catalog:${packageId}`.
- **Grading & Scoring Algorithm Consistency**:
  - The grading engine in `/api/test-series/grade/route.js` currently evaluates `submittedOption === Number(q.correct_option_index)`.
  - For multi-format questions (Multi-MCQ array, Numerical float, Assertion-Reason), the grading engine must support normalized answer comparisons (`selected_option` integer, array of indices, or numerical tolerance).

---

## Actionable Recommendations & Implementation Roadmap

1. **Database & API Migration**:
   - Write and apply SQL migration to create `public.exam_questions` junction table and normalize `public.questions`.
   - Implement data migration function to extract all legacy JSONB questions from `test_exams` into `public.questions` and link via `exam_questions`.
   - Update `/api/test-series/grade` and Admin compiler endpoints to use `exam_questions`.
2. **Admin Dashboard UI/UX Fixes**:
   - In `AdminLayoutShell.jsx`, bind nav link clicks to close the mobile sidebar on small screens.
   - In `StudentRelationshipClient.jsx`, `InvoiceAuditClient.jsx`, and `OrderFulfillmentClient.jsx`, add responsive card layouts (`block sm:hidden` card view + `hidden sm:table` data table view) and fix search bar flex wrapping.
   - Link `QuestionBankClient.jsx` to select/link test packages.
3. **Student Portal UI/UX Fixes**:
   - Fix `Navbar.jsx` to gracefully fetch session user if `user` prop is omitted, or pass `user` and `profile` from all parent pages.
   - Add `pb-20 md:pb-0` to all page layouts to prevent `MobileBottomNav` overlap.
   - Correct asymmetric padding in `ProfileClient.jsx`.
4. **CBT Exam Engine Mobile Overhaul**:
   - Transform Question Palette on mobile (<1024px) from a static side panel to an ergonomic **Bottom Sheet / Collapsible Drawer**.
   - Make header controls compact with modal trigger icons.
   - Enforce full viewport height without horizontal scroll.
5. **Hydration Cleansing**:
   - Replace raw `toLocaleDateString()` and `localStorage.getItem()` in renders with `formatDateSafe()` and `mounted` state guards.
