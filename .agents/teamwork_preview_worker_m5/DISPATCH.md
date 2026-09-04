# Dispatch: Milestone 5 — Student Portal CBT Engine & Discovery

## Objective
Transform the Student Portal's test discovery into a standalone mock test catalog and overhaul the CBT Exam Engine (`CbtEngineClient.jsx`) with multi-subject navigation, format-specific inputs (virtual numpad, matrix grid, MSQ checkboxes), and JEE Section B attempt enforcement.

## References & Inputs
- Authoritative User Request: `d:\education portal\ORIGINAL_REQUEST.md` (## 2026-09-04T10:35:58Z § R5)
- Project Architecture & Interfaces: `d:\education portal\PROJECT.md`
- Student Survey Report: `d:\education portal\.agents\explorer_survey_student_cbt\analysis.md`
- Student Survey Handoff: `d:\education portal\.agents\explorer_survey_student_cbt\handoff.md`
- Database Migration: `d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql`

## Files You Own Exclusively
- `d:\education portal\src\app\test-series\page.js`
- `d:\education portal\src\app\test-series\TestSeriesHubClient.jsx`
- `d:\education portal\src\app\test-series\engine\[examId]\page.js`
- `d:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx`
- `d:\education portal\src\app\api\test-series\grade\route.js`
- Any new child components in `d:\education portal\src\components\cbt\`

## Implementation Requirements
1. **Standalone Test Discovery (`/test-series/page.js` & `TestSeriesHubClient.jsx`)**:
   - In `page.js`, query all active `test_exams` including standalone mock tests (`package_id IS NULL`), selecting `blueprint_type`, `sections_config`, `duration_minutes`, `total_marks`, `questions`.
   - In `TestSeriesHubClient.jsx`, decouple exams from mandatory packages:
     - Render a top-level **Standalone Mock Test Catalog**.
     - Blueprint filters: `[All Exams]`, `[JEE Main]`, `[JEE Advanced]`, `[NEET]`, `[Custom]`.
     - Subject filters: `[All Subjects]`, `[Physics]`, `[Chemistry]`, `[Mathematics]`.
     - Display each test card with Title, Blueprint badge, Duration, Marks, Question tally, and a 1-click **"Attempt Test"** button navigating directly to `/test-series/engine/${exam.id}` with ZERO package or payment blockers!

2. **Exam Engine Navigation Strip (Subject Tabs & Section Pills)**:
   - In `CbtEngineClient.jsx`, render a prominent top-level navigation bar:
     - Top Subject Tabs: `[Physics]`, `[Chemistry]`, `[Mathematics]` showing live answered counts (e.g. `Physics (18/25)`).
     - Sub-level Section Pills matching the active subject's blueprint:
       - e.g. `[Section A: MCQs (20 Qs, +4/-1)]`
       - `[Section B: Numerical (10 Qs, +4/0, Max 5 Attempts)]`
     - Instant section jumping that filters question palette to the active section.

3. **Format-Specific Inputs & Type Normalization**:
   - In `engine/[examId]/page.js`, fix format normalization bug: ensure `multi_mcq` questions are accurately mapped as multi-select rather than single MCQ.
   - Support format-specific inputs in `CbtEngineClient.jsx`:
     - **Integer / Numerical**: Render an on-screen virtual numpad (0-9, backspace, clear, minus, decimal point) for NTA-standard touch/mouse integer input, alongside direct text entry.
     - **Matrix Match**: Render an interactive clickable Matrix Grid (Rows A, B, C, D vs Columns P, Q, R, S, T) where students click bubbles to link pairs, with per-row clear buttons.
     - **Multi-Correct MSQ**: Render square checkboxes with partial marking indicators (+4 for all correct, +3/+2/+1 for partials, -2 for incorrect).
     - **Single MCQ**: Standard circular radio buttons.

4. **JEE Section B Attempt Limit Rules (Max 5 of 10)**:
   - Calculate live answered questions in Section B of the active subject.
   - Display a live telemetry pill: `"Section B: X / 5 answered"`.
   - When 5 questions have been answered in Section B, attempting a 6th question is prevented:
     - Show a friendly warning modal/alert: `"You have reached the maximum limit of 5 answered questions for Section B. Please clear your response on another question in this section if you wish to answer this one."`
     - Provide an option in the modal to review or clear previous answers in that section.
   - Update server-side grading route `/api/test-series/grade/route.js` to enforce the max attempt cap: if more than 5 answers are submitted for Section B, grade only the first 5 attempted questions.

5. **Diagram Rendering & Question Lightbox**:
   - Ensure questions with `diagram_url` or `image_url` render diagrams crisply.
   - Add click-to-expand lightbox zoom for detailed schematics, circuits, and organic chemistry structures.
   - Render diagrams in the Question Paper overview modal.

6. **Build & Quality Assurance**:
   - Verify `npm run build` in `d:\education portal` succeeds with zero errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your 5-component handoff report to `d:\education portal\.agents\teamwork_preview_worker_m5\handoff.md`.
