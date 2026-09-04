# Dispatch: Admin Test Portal & Visual Exam Compiler Survey

## Objective
Survey the current state of Admin Dashboard navigation (`AdminLayoutShell.jsx`), `/admin/test-series` pages and components, and `TestCompiler.jsx`.

## Scope & Instructions
1. Read `d:\education portal\ORIGINAL_REQUEST.md` (specifically ## 2026-09-04T10:35:58Z).
2. Inspect `d:\admin dashboard\src\components\AdminLayoutShell.jsx` (and any other layout components) for references to "Test Packages" and "Free Material".
3. Inspect `d:\admin dashboard\src\app\admin\test-series` and related files: current tab structure, package listing vs standalone tests, PDF upload mechanisms.
4. Inspect `TestCompiler.jsx` and related compiler components: current blueprint handling, subject/section separation, question card expansion, KaTeX preview, and export capabilities.
5. Identify exact changes required for R2 (Admin Test Portal & Question Paper PDF Repository) and R4 (Overhauled Visual Exam Compiler & In-Place Editor).
6. Write your final report to `d:\education portal\.agents\explorer_survey_admin_portal\analysis.md` and your handoff to `d:\education portal\.agents\explorer_survey_admin_portal\handoff.md`.

## 2026-09-04T10:38:53Z
You are the Admin Portal & Visual Exam Compiler Survey Explorer.
Your working directory is: d:\education portal\.agents\explorer_survey_admin_portal
Your task instructions are detailed in: d:\education portal\.agents\explorer_survey_admin_portal\DISPATCH.md
The authoritative user request is in: d:\education portal\ORIGINAL_REQUEST.md (under ## 2026-09-04T10:35:58Z).

Investigate the codebase in d:\admin dashboard regarding:
1. AdminLayoutShell.jsx and any navigation components: find all references to "Test Packages" and "Free Material", determine how to replace with "Test Portal".
2. /admin/test-series page and child components: analyze the current layout, how tests and packages are listed, how to refactor into a 2-Tab interface: Tab 1 ("All Tests") and Tab 2 ("PDF Question Papers") with drag-and-drop PDF uploader.
3. TestCompiler.jsx and exam creation/editing components: analyze blueprint options (JEE Main, Advanced, Custom), Subject tabs (Physics, Chemistry, Maths), Section sub-pills, in-place question card expansion, KaTeX preview, format-specific inputs (Integer, Matrix match, MCQ/MSQ), and Printable PDF export.

Write your findings to d:\education portal\.agents\explorer_survey_admin_portal\analysis.md and write your handoff to d:\education portal\.agents\explorer_survey_admin_portal\handoff.md.
When finished, send a message back with your findings and report path.
