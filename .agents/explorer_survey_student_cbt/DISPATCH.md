# Dispatch: Student Portal CBT Engine & Discovery Survey

## Objective
Survey the current state of the Student Portal test series discovery (`/test-series/page.js`) and the student exam taking engine (`CbtEngineClient.jsx` and related components).

## Scope & Instructions
1. Read `d:\education portal\ORIGINAL_REQUEST.md` (specifically ## 2026-09-04T10:35:58Z).
2. Inspect `d:\education portal\src\app\test-series\page.js` and any child components: how packages vs tests are displayed, how students access tests, filters present.
3. Inspect `d:\education portal\src\app\test-series\engine\[examId]` and `CbtEngineClient.jsx`: current subject/section rendering, question navigation, option selection, integer input, question types supported, KaTeX math rendering, and timer behavior.
4. Identify how to implement:
   - Standalone test discovery without mandatory packages.
   - Subject Tabs and Section Pills matching exam blueprint.
   - Format-specific inputs: virtual on-screen number pad for Integers, matrix grid for Matrix Matching, checkboxes for MSQs.
   - Section B attempt rules (e.g., attempt any 5 of 10) with live counter `"Section B: X / 5 answered"` and warning/prevention on over-attempting.
5. Write your final report to `d:\education portal\.agents\explorer_survey_student_cbt\analysis.md` and your handoff to `d:\education portal\.agents\explorer_survey_student_cbt\handoff.md`.
