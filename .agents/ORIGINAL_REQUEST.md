# Original User Request

## 2026-08-19T18:28:14Z

Architect a global, independent Question Bank system that integrates seamlessly into Test Packages via robust SQL migrations (ensuring zero data loss of existing questions). Furthermore, perform a massive mobile UI/UX optimization pass across both the Admin and Student portals, completely redesigning the CBT Exam Engine's mobile experience. Resolve any systemic flaws discovered during this architectural shift.

Working directories:
- D:\education portal (Student Portal)
- D:\admin dashboard (Admin Dashboard)

Integrity mode: development

## Requirements

### R1. Global Question Bank & Database Migration
Decouple questions from individual exams. Implement a central  Question Bank in the Admin Dashboard where questions can be created, tagged, and managed independently. 
- Write strict Supabase SQL migrations to create junction tables (e.g., exam_questions).
- **CRITICAL:** Existing hardcoded questions must be cleanly migrated into the new global bank without losing data. 
- Updates to a question in the global bank must instantly reflect in all linked exams.

### R2. CBT Exam Engine Mobile Overhaul (Critical)
Completely redesign the mobile UI/UX of the Student Portal's CBT (Computer Based Testing) Exam Engine. 
- Implement ergonomic, mobile-first paradigms (e.g., a bottom sheet or highly accessible collapsible menu for jumping between questions).
- Ensure highly tap-friendly option buttons, persistent visible timers, and perfectly responsive math/image rendering. Horizontal scrolling is strictly prohibited unless inside a specific math formula block.

### R3. Cross-Portal Mobile Optimization & Flaw Resolution
Audit and optimize both the Admin Dashboard and the Student Portal for mobile viewports (phones and tablets). 
- Navigation sidebars and data grids must degrade gracefully into mobile-friendly menus and cards.
- Actively hunt for and resolve any database logic flaws, constraint errors, or Next.js hydration issues caused by the Question Bank architectural shift.

## Acceptance Criteria

### Functionality & Architecture
- [ ] Running the SQL migration cleanly extracts existing questions into the new global bank and links them via a junction table.
- [ ] Modifying a question in the bank updates it everywhere it is referenced.
- [ ] Adding a new question to the bank and linking it to a test package renders perfectly in the student portal.

### Mobile UI/UX Verification
- [ ] E2E or visual inspection confirms the CBT Exam Engine is flawless on mobile viewports (iPhone/Android dimensions) with ergonomic navigation.
- [ ] Navigation components across both portals function cleanly on small screens without layout breakage.

## 2026-08-24T12:45:01Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Full team

Scan both the Student Portal and Admin Portal to identify UI components that currently use hardcoded placeholder data (e.g., courses, batches, mock tests, and instructor details). Replace these hardcoded elements with dynamic data fetched from the Supabase database. 

Working directories: `d:\education portal` and `d:\admin dashboard`
Integrity mode: development

## Requirements

### R1. Dynamic Data Integration
Identify and replace hardcoded UI placeholder data with dynamic data fetched from the Supabase database across both the Student and Admin portals.

### R2. Schema Generation
If a UI component (like the course catalog or batch listings) lacks an underlying Supabase table or schema for its data, create the necessary migrations and tables to support it.

## Acceptance Criteria

### Verification (Agent-as-Judge)
- [ ] An independent agent reviews the modified React components and confirms that the data mapping relies on a backend fetch (e.g., via `@supabase/ssr` or `@supabase/supabase-js`) rather than static arrays or objects.
- [ ] An independent agent confirms that any newly created Supabase tables have Row Level Security (RLS) enabled and proper foreign key constraints where applicable.

## 2026-09-04T10:35:58Z

# Teamwork Project Prompt

Working directory: d:\admin dashboard and d:\education portal
Integrity mode: development

Transform the Education Platform's assessment suite into an intuitive, Classplus-grade Test Portal with a dedicated Question Paper PDF Repository, automated end-of-PDF answer-key matching, diagram extraction, multi-format JEE Main/Advanced exam blueprints, and an NTA-standard student CBT engine with zero "Free Material" and no mandatory "Test Packages".

## Requirements

### R1. Database Migration & Standalone Exam Decoupling
- Execute Supabase migration to make `test_exams.package_id` nullable, allowing tests to exist as independent standalone entities.
- Add `sections_config` (JSONB) and `blueprint_type` columns to `public.test_exams` to store section-level marking (+4/-1 for MCQs, +4/0 for Integers, partial marking for MSQs) and optional attempt rules (e.g. attempt any 5 of 10).
- Create `public.question_paper_documents` table to track uploaded PDFs with metadata (`title`, `file_url`, `file_name`, `file_size_bytes`, `subject`, `target_exam`, `status`, `compiled_exam_id`, `created_at`).
- Ensure Supabase Storage bucket `question-papers` is configured with appropriate RLS policies for file upload and retrieval.

### R2. Admin Test Portal & Question Paper PDF Repository
- In `d:\admin dashboard`, update `AdminLayoutShell.jsx` to replace "Test Packages" with a unified "Test Portal" navigation item, removing all references to "Free Material".
- Refactor `/admin/test-series` into a clean 2-Tab interface:
  - **Tab 1 (`All Tests`)**: Direct table of all compiled exams with titles, subject tags, question count, duration, student attempt tally, and action buttons.
  - **Tab 2 (`PDF Question Papers`)**: Grid/list of uploaded PDF question papers with upload date, size, status badges ("Ready to Compile" vs "Compiled"), PDF preview, and a 1-click **"Compile into Exam"** action.
- Include a drag-and-drop PDF uploader with progress tracking that saves raw PDFs to Supabase storage.

### R3. AI Vision Parser: End-of-PDF Answer Key Scanning & Diagram Extraction
- Upgrade the backend AI parser (`/api/admin/ai/parse-pdf` / multimodal pipeline) to:
  1. Scan all question pages for questions, options, and question types (Single MCQ, Multi MSQ, Integer/Numerical, Matrix Matching).
  2. Detect and parse the **Answer Key Matrix** typically located on the final pages (e.g., `1: B, 2: D, 3: 45...`) and automatically bind correct keys/values to their respective questions.
  3. Extract diagram bounding boxes (geometry, circuits, organic chemistry) as image assets, save them to storage, and embed diagram URLs into question payloads.
  4. Auto-detect multi-subject boundaries (Maths Q1-30, Physics Q31-60, Chemistry Q61-90) and assign questions to corresponding Subject Tabs.

### R4. Overhauled Visual Exam Compiler & In-Place Editor
- Redesign `TestCompiler.jsx` into a clean, intuitive workspace:
  - **Header**: One-click Blueprint selector (`[JEE Main]` | `[JEE Advanced]` | `[Custom]`).
  - **Subject Tabs**: Top tabs for `[Physics]`, `[Chemistry]`, `[Mathematics]`.
  - **Section Sub-Pills**: Clear pills (e.g. Physics -> `[Section A: MCQs (20 Qs, +4/-1)]` | `[Section B: Numerical (10 Qs, +4/0, max 5)]`).
  - **In-Place Question Cards**: Click any question in the list to expand and edit in-place with format-specific inputs (direct number for Integer, 4x4 matching rows for Matrix, radio/checkbox for MCQ/MSQ) and live KaTeX math formula preview.
  - Quick action to "Move to Section", reorder, or delete questions.
  - Add an **"Export Printable PDF"** feature generating a clean 2-column offline question paper booklet for classroom mock tests.

### R5. Student Portal CBT Engine & Discovery
- Update `d:\education portal\src\app\test-series\page.js` to list all active standalone mock tests directly with subject/exam filters, letting students click "Attempt Test" without navigating through packages.
- Update `CbtEngineClient.jsx` in the student exam taking engine:
  - Render Subject Tabs and Section Pills matching the exam blueprint.
  - Support format-specific inputs: virtual on-screen number pad for Integers, clickable matrix grid for Matrix Matching, and checkboxes for MSQs.
  - Enforce JEE Section B rule: display live counter `"Section B: 4 / 5 answered"`, and prevent answering more than the section's maximum allowed questions (with friendly prompt to clear an earlier response if desired).

## Acceptance Criteria

### Compilation & Parsing Integrity
- [ ] Uploading a sample JEE PDF extracts questions, detects the answer key on the last page, binds correct options, and separates subjects into Physics, Chemistry, and Mathematics tabs.
- [ ] Extracted diagram images are hosted on Supabase storage and render visibly in both compiler preview and student CBT engine.

### Admin Usability & Editing
- [ ] No "Free Material" tab or confusing "Test Package" requirement appears anywhere in the admin portal.
- [ ] Clicking any question card in the compiler expands it in-place; editing text, options, or integer values updates the KaTeX preview and persists on save.
- [ ] Sections correctly reflect independent scoring (+4/-1 for Sec A; +4/0 for Sec B Integers).
- [ ] "Export Printable PDF" generates a clean, printable exam paper.

### Student Exam Engine Compliance
- [ ] Students can discover and launch compiled exams directly from `/test-series`.
- [ ] On-screen virtual keypad inputs integer numbers seamlessly.
- [ ] Attempting more than 5 questions in Section B triggers the warning and prevents over-attempting.
- [ ] Dual portal builds (`npm run build` in both `d:\admin dashboard` and `d:\education portal`) succeed with zero type or lint errors.

