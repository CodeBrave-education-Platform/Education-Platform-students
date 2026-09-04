# Handoff Report: Admin Portal & Visual Exam Compiler Survey

**Agent**: Admin Portal & Visual Exam Compiler Survey Explorer  
**Working Directory**: `d:\education portal\.agents\explorer_survey_admin_portal`  
**Milestone**: Survey & Architectural Design for Requirements R2 & R4  
**Date**: 2026-09-04  

---

## 1. Observation

Direct observations from the inspected codebase files in `d:\admin dashboard` and `d:\education portal`:

1. **Navigation & Sidebar (`AdminLayoutShell.jsx`)**:
   - File path: `d:\admin dashboard\src\components\AdminLayoutShell.jsx`, lines 33–37:
     ```javascript
     const testingSection = [
       { label: 'Test Packages', href: '/admin/test-series', icon: Package },
       { label: 'Question Bank', href: '/admin/questions', icon: HelpCircle }
     ];
     ```
   - Rendered at line 92: `{renderNavGroup('Exams', testingSection)}`.
   - Command palette reference at `d:\admin dashboard\src\components\CommandPalette.jsx`, line 78–79:
     ```javascript
     <Command.Item onSelect={() => runCommand(() => router.push('/admin/test-series'))} ...>
       <Activity className="w-4 h-4 text-rose-500" />
       <span>Test Series Catalog</span>
     </Command.Item>
     ```
   - Full-text audit of `d:\admin dashboard\src` reveals **zero** occurrences of `"Free Material"` in any navigation component, sidebar, or tab.

2. **Current `/admin/test-series` Route & Child Components**:
   - File path: `d:\admin dashboard\src\app\admin\test-series\page.js`, lines 37–42:
     ```javascript
     const [packagesRes, examsRes, attemptsRes, invoicesRes] = await Promise.all([
       supabase.from('test_packages').select('*, test_exams(*)').order('created_at', { ascending: false }),
       supabase.from('test_exams').select('*').order('created_at', { ascending: false }),
       supabase.from('test_attempts').select('*, profiles(full_name, email), test_exams(title)').order('completed_at', { ascending: false }),
       supabase.from('invoices').select('package_id').not('package_id', 'is', null)
     ]);
     ```
   - Main page layout (lines 182–207) renders `TestSeriesStatsHeader` and `TestSeriesGrid` (a bento card grid of `packages`).
   - `TestSeriesGrid.jsx` (732 lines) only maps and filters `packages` (`test_packages`). Standalone exams (`test_exams` where `package_id IS NULL`) are not rendered anywhere on this grid.
   - Exams can only be managed by clicking a package, opening `TestSeriesEditorDrawer.jsx`, and navigating to `PackageExamsTab.jsx`.
   - There is no list or grid of uploaded raw PDF documents (`question_paper_documents`), and no drag-and-drop PDF uploader on `/admin/test-series`.

3. **Compiler Components (`TestCompiler.jsx` & `CompilerClient.jsx`)**:
   - Files:
     - `d:\admin dashboard\src\components\TestCompiler.jsx` (902 lines)
     - `d:\admin dashboard\src\app\admin\test-series\compiler\CompilerClient.jsx` (649 lines, duplicate copy of `TestCompiler.jsx` missing `exam` edit prop)
     - `d:\admin dashboard\src\app\admin\test-series\compiler\page.js` (server route wrapper)
   - State in `TestCompiler.jsx` (lines 33–71):
     - Contains single-question authoring state (`subject`, `subTopic`, `difficulty`, `section`, `questionType`, `content`, `options`, `correctOptionIdx`, `integerAnswer`, `matrixMatch`) saving to `question_bank`.
     - Right column contains exam blueprint state: `examTitle`, `targetPackageId`, `examDuration`, `positiveMarks`, `negativeMarks`, `isLiveRanking`, `activationTimestamp`, and a flat list of `selectedQuestions`.
   - Selected questions list (lines 841–859) renders only `#idx + 1`, a truncated string of `q.content`, and a delete button `<Trash2 />`.
   - There are no blueprint presets (`[JEE Main]`, `[JEE Advanced]`, `[Custom]`).
   - There are no Subject tabs (`Physics`, `Chemistry`, `Mathematics`).
   - There are no Section sub-pills (`Section A: MCQs` vs `Section B: Numerical`).
   - Clicking a question card does not expand it; there is no in-place editor.
   - Format-specific inputs (e.g. numeric integer field, 4x4 matrix matching grid, MSQ multi-select checkboxes) exist only in the single-question authoring form, not in the compiled question list.
   - There is no "Export Printable PDF" booklet generator.

4. **KaTeX & Document Dependencies**:
   - `package.json` in `d:\admin dashboard` verifies:
     - `katex`: `^0.18.1` installed and working via `d:\admin dashboard\src\components\KatexRenderer.jsx`.
     - `@hello-pangea/dnd`: `^18.0.1` installed for smooth drag-and-drop reordering.
     - `framer-motion`: `^12.40.0` installed.
     - `@google/genai`: `^2.17.1` installed for AI Vision PDF parsing.

---

## 2. Logic Chain

1. **Premise**: Requirement R2 mandates replacing "Test Packages" with a unified "Test Portal" navigation item, removing all references to "Free Material", and refactoring `/admin/test-series` into a 2-Tab interface: Tab 1 ("All Tests") and Tab 2 ("PDF Question Papers") with a drag-and-drop PDF uploader.
   - **Step 1.1**: Direct observation shows `AdminLayoutShell.jsx` line 34 specifies `{ label: 'Test Packages', href: '/admin/test-series', icon: Package }`. Updating this label to `'Test Portal'` and using `icon: Layers` cleanly completes the navigation transition while maintaining the established `/admin/test-series` route.
   - **Step 1.2**: Observation shows `CommandPalette.jsx` has `Test Series Catalog`, which should be updated to `Test Portal` to maintain search palette consistency.
   - **Step 1.3**: Observation shows `/admin/test-series/page.js` only renders `test_packages` in `TestSeriesGrid`. With standalone tests decoupling (from R1 migration where `package_id` is nullable), standalone exams would be invisible without an "All Tests" table.
   - **Step 1.4**: Structuring `/admin/test-series` into a 2-Tab interface directly solves this:
     - Tab 1 ("All Tests") fetches all `test_exams` directly, displaying title, blueprint type, questions, duration, attempts, and action buttons (`Edit in Compiler`, `Proctoring Telemetry`, `Printable PDF`, `Delete`).
     - Tab 2 ("PDF Question Papers") queries `public.question_paper_documents`, displaying raw PDFs with "Ready to Compile" vs "Compiled" status, preview action, and 1-click "Compile into Exam" action.
   - **Step 1.5**: Adding a drag-and-drop PDF uploader to Tab 2 that saves to Supabase storage bucket `question-papers` and inserts a metadata row into `question_paper_documents` allows teachers to upload exams as PDFs before compilation.

2. **Premise**: Requirement R4 mandates redesigning `TestCompiler.jsx` into a clean visual workspace with a Blueprint selector (`[JEE Main]`, `[JEE Advanced]`, `[Custom]`), Subject tabs (`[Physics]`, `[Chemistry]`, `[Mathematics]`), Section sub-pills (e.g. `[Section A: MCQs (20 Qs, +4/-1)]` | `[Section B: Numerical (10 Qs, +4/0, max 5)]`), in-place question card expansion, KaTeX preview, format-specific inputs (Integer numerical, Matrix match, MCQ/MSQ), and Printable PDF export.
   - **Step 2.1**: Observation shows `TestCompiler.jsx` and `CompilerClient.jsx` currently use a 2-column split (authoring form on left, flat list on right). In-place editing is impossible because the right list only shows `q.content` with a delete button.
   - **Step 2.2**: By overhauling `TestCompiler.jsx` into a tabbed workspace:
     - Selecting `[JEE Main]` initializes 3 subjects (Physics, Chemistry, Maths), each with Section A (20 MCQs, +4/-1) and Section B (10 Numerical, +4/0, max attempt 5), totaling 90 questions / 300 marks.
     - Top tabs switch between `Physics`, `Chemistry`, and `Mathematics`, showing question counts (e.g. `Physics 25/30`).
     - Sub-pills switch between `Section A` and `Section B`.
   - **Step 2.3**: Rendering questions in the active section as expandable cards enables in-place editing: clicking a card expands it to reveal the question statement textarea, live `KatexRenderer` preview, diagram asset manager, format-specific inputs (numeric integer field, 4x4 matrix grid, MSQ checkboxes, SCQ radio buttons), and solution derivation.
   - **Step 2.4**: Observation shows `KatexRenderer.jsx` is available in `components/KatexRenderer.jsx`. Integrating it into the in-place card editor provides real-time LaTeX rendering as teachers type equations.
   - **Step 2.5**: Implementing "Export Printable PDF" via print CSS (`@media print`, 2-column multi-column layout) renders an authentic NTA-standard question booklet with official headers, candidate info, KaTeX formulas, diagram images, rough work area, and an end-of-exam Answer Key table.

---

## 3. Caveats

1. **Database Schema Dependency on R1**:
   - Tab 2 (`PDF Question Papers`) depends on the creation of `public.question_paper_documents` and the Supabase Storage bucket `question-papers` from Requirement R1.
   - The standalone exam capability depends on making `test_exams.package_id` nullable and adding `sections_config` (JSONB) and `blueprint_type` (TEXT) from R1.
2. **AI Vision Pipeline Integration**:
   - The 1-click "Compile into Exam" action on Tab 2 relies on backend endpoint `/api/admin/ai/parse-pdf`. If the PDF is heavily scanned, multimodal extraction requires a valid `GEMINI_API_KEY`. The deterministic regex parser serves as a fallback.
3. **No Code Modification Performed**:
   - In accordance with the Explorer persona and strict read-only investigation rules, no application source code was modified. All designs and code specifications are documented in `analysis.md` and this handoff report.

---

## 4. Conclusion

1. **Navigation**: `AdminLayoutShell.jsx` (line 34) and `CommandPalette.jsx` (line 79) should be updated from "Test Packages" / "Test Series Catalog" to "Test Portal" (`icon: Layers`). No "Free Material" links exist; none should be added.
2. **`/admin/test-series`**: Refactor into a 2-Tab interface:
   - **Tab 1: All Tests**: Consolidated table of all compiled exams with titles, subject tags, question count, duration, student attempt tally, and action buttons.
   - **Tab 2: PDF Question Papers**: PDF repository grid with status badges ("Ready to Compile" vs "Compiled"), 1-click "Compile into Exam", and a drag-and-drop PDF uploader with progress tracking to Supabase storage.
3. **`TestCompiler.jsx`**: Redesign into an in-place visual compiler with one-click Blueprints (`[JEE Main]`, `[JEE Advanced]`, `[Custom]`), top Subject tabs (`[Physics]`, `[Chemistry]`, `[Mathematics]`), Section sub-pills (`Section A: MCQs` | `Section B: Numerical`), in-place expandable question cards with live KaTeX preview and format-specific inputs (Integer, Matrix Match, MSQ, SCQ), and a 2-column Printable PDF booklet exporter.

---

## 5. Verification Method

Independent builders and review agents can verify the findings through the following steps:

1. **Inspect Navigation Files**:
   - Open `d:\admin dashboard\src\components\AdminLayoutShell.jsx` at line 34 to confirm the presence of `{ label: 'Test Packages', href: '/admin/test-series', icon: Package }`.
   - Open `d:\admin dashboard\src\components\CommandPalette.jsx` at line 79 to confirm `<span>Test Series Catalog</span>`.
   - Search for `"Free Material"` in `d:\admin dashboard\src` to confirm zero existing references.

2. **Inspect Current Test Series Page**:
   - Open `d:\admin dashboard\src\app\admin\test-series\page.js` and `d:\admin dashboard\src\components\test-series\TestSeriesGrid.jsx` to verify that only `packages` are rendered, and standalone exams cannot be viewed directly.

3. **Inspect Compiler Architecture**:
   - Open `d:\admin dashboard\src\components\TestCompiler.jsx` and `d:\admin dashboard\src\app\admin\test-series\compiler\CompilerClient.jsx` to confirm the absence of blueprint presets, subject tabs, section sub-pills, in-place question expansion, and printable PDF export.

4. **Verify Implementation Readiness**:
   - Refer to `d:\education portal\.agents\explorer_survey_admin_portal\analysis.md` for complete UI mockups, state schemas, and implementation steps.
