# Dispatch: Milestone 4 — Overhauled Visual Exam Compiler & In-Place Editor

## Objective
Redesign `TestCompiler.jsx` in `d:\admin dashboard` into an intuitive visual exam compilation workspace with multi-format JEE Main/Advanced blueprints, Subject tabs, Section sub-pills, in-place expandable question cards with KaTeX preview, format-specific inputs (Integer, 4x4 Matrix Match, MSQ, SCQ), and a 2-column Printable PDF booklet exporter.

## References & Inputs
- Authoritative User Request: `d:\education portal\ORIGINAL_REQUEST.md` (## 2026-09-04T10:35:58Z § R4)
- Project Architecture & Interfaces: `d:\education portal\PROJECT.md`
- Admin Survey Report: `d:\education portal\.agents\explorer_survey_admin_portal\analysis.md`
- Admin Survey Handoff: `d:\education portal\.agents\explorer_survey_admin_portal\handoff.md`

## Files You Own Exclusively
- `d:\admin dashboard\src\components\TestCompiler.jsx`
- `d:\admin dashboard\src\app\admin\test-series\compiler\CompilerClient.jsx`
- `d:\admin dashboard\src\components\test-series\QuestionCardInPlaceEditor.jsx`
- `d:\admin dashboard\src\components\test-series\PrintableExamBookletModal.jsx`

## Implementation Requirements
1. **Header & Blueprint Selector**:
   - One-click Blueprint selector: `[JEE Main]` | `[JEE Advanced]` | `[Custom]`.
   - Selecting `[JEE Main]` automatically configures:
     - 3 Subjects: `Physics`, `Chemistry`, `Mathematics`.
     - In each Subject:
       - `Section A`: Single Correct MCQs (20 Questions, +4 positive, -1 negative marking).
       - `Section B`: Numerical/Integer (10 Questions, +4 positive, 0 negative marking, maximum 5 attempts allowed).
     - Total: 90 Questions (300 Marks, 180 Minutes).
   - Selecting `[JEE Advanced]` configures:
     - Section 1 (Single Choice, +3/-1), Section 2 (Multi-Correct MSQ with partial marking +4/+3/+2/+1/-2), Section 3 (Numerical, +4/0), Section 4 (Matrix Matching, +3/-1).
   - `[Custom]` allows arbitrary subjects, sections, and marking schemes.
   - Pre-populate exam from URL parameters `?examId=...` (edit existing exam) or `?pdfDocId=...` (pre-fill from uploaded PDF parsed payload).

2. **Top Subject Tabs & Section Sub-Pills**:
   - Prominent Subject navigation tabs: `[Physics]` (with count e.g. 25/30), `[Chemistry]` (e.g. 30/30), `[Mathematics]` (e.g. 30/30).
   - Section sub-pills for the active subject:
     - e.g. `[Section A: MCQs (20 Qs, +4/-1)]`
     - `[Section B: Numerical (10 Qs, +4/0, max 5)]`
   - Quick button: "+ Add Question to Section".

3. **In-Place Expandable Question Cards with KaTeX Math Preview**:
   - Instead of a disconnected side-form, render questions as an interactive card list in the active section.
   - Collapsed view shows: Question Number, Question type badge, truncated statement with KaTeX math rendering, marks indicator (+4/-1), and expand button.
   - Clicking any question card expands it in-place into a full visual editor:
     - Question statement textarea with live `KatexRenderer` preview underneath as the teacher types LaTeX formulas.
     - Diagram attachment URL or file upload preview.
     - **Format-Specific Inputs**:
       - **Single MCQ (`single_mcq`)**: 4 option input fields (A, B, C, D) with KaTeX preview and radio button to select the correct answer.
       - **Multi MSQ (`multi_mcq`)**: 4 option input fields with KaTeX preview and checkboxes allowing multiple correct options.
       - **Numerical/Integer (`numerical`)**: Direct numeric input field for single integer or decimal answer (e.g. `45`, `3.14`).
       - **Matrix Match (`matrix_match`)**: 4 Column I items (A, B, C, D) and 4/5 Column II items (P, Q, R, S, T) with interactive 4x4 matrix matching checkbox grid.
     - Solution explanation textarea with KaTeX preview.
   - Question actions: "Move to Section" dropdown, reorder up/down buttons, delete question button.

4. **Export Printable PDF Feature**:
   - Add an **"Export Printable PDF"** button in the compiler header.
   - Generates an authentic, clean 2-column offline question paper booklet:
     - Official exam header (Test Title, Target Exam, Duration, Max Marks, Roll Number box).
     - Candidate instructions block (marking schemes, Section B attempt limits).
     - Clean 2-column layout (`@media print` and preview modal) with KaTeX-rendered equations, diagram images, and rough work sections.
     - Optional detachable Answer Key sheet at the end.
     - Direct browser print dialog trigger (`window.print()`).

5. **Save & Publication**:
   - Save exam to `public.test_exams` with `package_id` (null if standalone), `blueprint_type`, `sections_config`, duration, total marks, and `questions` JSONB array / junction links.
   - If `pdfDocId` was provided, update `public.question_paper_documents` status to `'compiled'` and set `compiled_exam_id`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your 5-component handoff report to `d:\education portal\.agents\teamwork_preview_worker_m4\handoff.md`.

## 2026-09-04T11:02:35Z
You are the Visual Exam Compiler Worker for Milestone 4.
Your working directory is: d:\education portal\.agents\teamwork_preview_worker_m4
Your detailed task assignment is in: d:\education portal\.agents\teamwork_preview_worker_m4\DISPATCH.md
The authoritative user request is in: d:\education portal\ORIGINAL_REQUEST.md (specifically ## 2026-09-04T10:35:58Z § R4).
The project architecture is in: d:\education portal\PROJECT.md.
The Admin Survey report is in: d:\education portal\.agents\explorer_survey_admin_portal\analysis.md and handoff.md.

Implement:
1. Redesign TestCompiler.jsx with one-click Blueprints: [JEE Main], [JEE Advanced], [Custom].
2. Top Subject tabs: [Physics], [Chemistry], [Mathematics] with counts.
3. Section sub-pills: [Section A: MCQs (20 Qs, +4/-1)] | [Section B: Numerical (10 Qs, +4/0, max 5)].
4. In-place expandable question cards with live KaTeX preview, format-specific inputs (Integer, 4x4 Matrix Match, MSQ/SCQ), and Move to Section/reorder actions.
5. "Export Printable PDF" feature generating a clean 2-column offline question paper booklet.
