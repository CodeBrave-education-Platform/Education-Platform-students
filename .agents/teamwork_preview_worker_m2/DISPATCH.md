# Dispatch: Milestone 2 — Admin Test Portal & Question Paper PDF Repository

## Objective
Overhaul the Admin Dashboard navigation and `/admin/test-series` into a Classplus-grade Test Portal with a 2-Tab interface (`All Tests` and `PDF Question Papers`) and a drag-and-drop PDF uploader to Supabase Storage.

## References & Inputs
- Authoritative User Request: `d:\education portal\ORIGINAL_REQUEST.md` (## 2026-09-04T10:35:58Z § R2)
- Project Architecture & Interfaces: `d:\education portal\PROJECT.md`
- Admin Survey Report: `d:\education portal\.agents\explorer_survey_admin_portal\analysis.md`
- Admin Survey Handoff: `d:\education portal\.agents\explorer_survey_admin_portal\handoff.md`
- Milestone 1 Migration: `d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql`

## Files You Own Exclusively
- `d:\admin dashboard\src\components\AdminLayoutShell.jsx`
- `d:\admin dashboard\src\components\CommandPalette.jsx`
- `d:\admin dashboard\src\app\admin\test-series\page.js`
- `d:\admin dashboard\src\components\test-series\TestPortalTabs.jsx`
- `d:\admin dashboard\src\components\test-series\AllTestsTable.jsx`
- `d:\admin dashboard\src\components\test-series\PdfQuestionPaperGrid.jsx`
- `d:\admin dashboard\src\components\test-series\PdfUploader.jsx`

## Implementation Requirements
1. **Navigation Overhaul (`AdminLayoutShell.jsx` & `CommandPalette.jsx`)**:
   - In `AdminLayoutShell.jsx`, update the navigation item from `'Test Packages'` to `'Test Portal'` (`href: '/admin/test-series'`, `icon: Layers`).
   - Confirm zero occurrences of `"Free Material"` in any admin navigation or menu.
   - Update `CommandPalette.jsx` item from `'Test Series Catalog'` to `'Test Portal'`.

2. **2-Tab Test Portal (`/admin/test-series/page.js`)**:
   - Refactor page to fetch all `test_exams` (ordered by `created_at DESC`), `question_paper_documents` (ordered by `created_at DESC`), `test_attempts`, and statistics.
   - Render a unified header: "Test Portal" with subtitle "Manage standalone exams, multi-format blueprints, and PDF question paper repository".
   - Top action buttons: "+ New Exam" (links to `/admin/test-series/compiler`) and "Upload Question Paper PDF" (opens PDF upload modal).
   - Render a high-visibility 2-Tab switcher:
     - **Tab 1: `All Tests` (Compiled Exams)**: Displays direct table of all compiled exams.
     - **Tab 2: `PDF Question Papers` (Question Paper Repository)**: Displays grid of uploaded PDF documents.

3. **Tab 1: All Tests Table (`AllTestsTable.jsx`)**:
   - Display each test with: Title, Blueprint badge (`JEE Main`, `JEE Advanced`, `NEET`, `Custom`), Subjects/Sections, Question count, Duration (mins), Status (`Published` / `Draft`), Student attempts tally, and Action buttons:
     - `[Edit in Compiler]` -> navigates to `/admin/test-series/compiler?examId=...`
     - `[Printable PDF]` -> triggers printable booklet view / export
     - `[Delete]` -> deletes exam with confirmation
   - Provide search filter and blueprint filter tabs (`All`, `JEE Main`, `JEE Advanced`, `NEET`, `Custom`).

4. **Tab 2: PDF Question Papers Grid (`PdfQuestionPaperGrid.jsx`)**:
   - Display uploaded PDFs with: Title, Subject badge, Target Exam, File size (formatted KB/MB), Upload date, Status badge (`Ready to Compile` in emerald vs `Compiled` in indigo vs `Processing` in amber).
   - Card actions:
     - `[Preview PDF]` -> opens modal with embedded PDF viewer iframe (`file_url`).
     - `[Compile into Exam]` -> 1-click action: navigates to `/admin/test-series/compiler?pdfDocId=...` pre-loading the document payload for instant compilation!
     - `[Delete]` -> removes document from database and storage.

5. **Drag-and-Drop PDF Uploader (`PdfUploader.jsx`)**:
   - Modern drag-and-drop zone with file type validation (`application/pdf`, max 50MB).
   - Metadata inputs: Title, Target Exam (`JEE Main`, `JEE Advanced`, `NEET`, `Custom`), Subject (`Full Syllabus`, `Physics`, `Chemistry`, `Mathematics`).
   - Upload progress bar.
   - Saves file directly to Supabase storage bucket `question-papers` (`question-papers/${Date.now()}_${file.name}`).
   - Inserts record into `public.question_paper_documents` via Supabase client with status `ready_to_compile`.
   - Dispatches success toast and refreshes grid.

6. **Build & Quality Assurance**:
   - Ensure clean Next.js compilation with zero React hydration errors, valid Tailwind classes, and responsive design.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your 5-component handoff report to `d:\education portal\.agents\teamwork_preview_worker_m2\handoff.md`.

## 2026-09-04T10:53:30Z
You are the Admin Test Portal Worker for Milestone 2.
Your working directory is: d:\education portal\.agents\teamwork_preview_worker_m2
Your detailed task assignment is in: d:\education portal\.agents\teamwork_preview_worker_m2\DISPATCH.md
The authoritative user request is in: d:\education portal\ORIGINAL_REQUEST.md (specifically ## 2026-09-04T10:35:58Z § R2).
The project architecture is in: d:\education portal\PROJECT.md.
The Admin Survey report is in: d:\education portal\.agents\explorer_survey_admin_portal\analysis.md and handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement:
1. AdminLayoutShell.jsx and CommandPalette.jsx updates: replace "Test Packages" with "Test Portal" (href: /admin/test-series, icon: Layers), verify zero references to "Free Material".
2. Refactor /admin/test-series/page.js into a clean 2-Tab interface: Tab 1 (All Tests direct table) and Tab 2 (PDF Question Papers repository with badges & preview).
3. Modern drag-and-drop PDF uploader saving to Supabase storage bucket `question-papers` and inserting into `public.question_paper_documents`.
4. 1-click "Compile into Exam" action on PDF cards.

Verify your changes, document build results, and write your report to d:\education portal\.agents\teamwork_preview_worker_m2\handoff.md.
When finished, send a message back with your findings and handoff path.
