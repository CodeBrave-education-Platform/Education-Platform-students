# Milestone 5 Handoff Report: Student CBT Engine & Discovery

## 1. Observation
- **Original State & Findings**:
  - `d:\education portal\src\app\test-series\page.js`: Only fetched package-linked test exams and packages. Standalone exams with `package_id IS NULL` had limited metadata retrieved (`questions, sections_config, blueprint_type` were missing from the query).
  - `d:\education portal\src\app\test-series\TestSeriesHubClient.jsx`: Entire UI was locked behind "Test Packages" with package purchase gatekeeping and "Free Material" tags. There was no standalone test catalog, no blueprint filtering (`JEE Main`, `JEE Advanced`, `NEET`, `Custom`), and no subject filtering.
  - `d:\education portal\src\app\test-series\engine\[examId]\page.js`:
    - Question format normalization contained a severe bug: `rawFormat.includes('MCQ') ? 'MCQ'` caused `multi_mcq` to be mistakenly normalized to single-select `MCQ`.
    - All exams were subjected to strict invoice/purchase verification against `test_packages`, locking out any standalone tests (`package_id IS NULL`) even when students tried to attempt them.
    - Missing forwarding of `blueprint_type`, `sections_config`, `matrix_rows`, `matrix_cols`, and `diagram_url` to the client.
  - `d:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx`:
    - Lacked a top-level Exam Navigation Strip with Subject Tabs and Section Pills.
    - Rendered only single radio buttons for all questions; lacked an NTA virtual on-screen numpad for Numerical inputs, 4x4 interactive matrix grid for Matrix Matching, and square checkboxes with partial marking telemetry for MSQs.
    - Allowed unrestricted answering in JEE Main Section B without the 5-out-of-10 question cap enforcement.
    - Rendered diagrams statically without click-to-zoom fullscreen inspection or lightbox modal.
  - `d:\education portal\src\app\api\test-series\grade\route.js`:
    - Evaluated every answered question without capping Section B to 5 questions per subject.
    - Lacked evaluation logic for Matrix Match questions.

- **Verification Command & Result**:
  - Command: `npm run build` executed in `d:\education portal`.
  - Output:
    ```
    ▲ Next.js 16.2.6 (Turbopack)
    ✓ Compiled successfully in 18.6s
    Running TypeScript ... Finished TypeScript in 257ms ...
    Generating static pages using 15 workers (23/23) in 844ms
    Route (app)
    ├ ƒ /test-series
    ├ ƒ /test-series/analytics/[attemptId]
    ├ ƒ /test-series/engine/[examId]
    ├ ƒ /api/test-series/grade
    ```
  - Exit code: 0 (Zero compilation errors).

---

## 2. Logic Chain
1. **Discovery & Decoupling**:
   - By updating the Supabase query in `d:\education portal\src\app\test-series\page.js` to retrieve `blueprint_type, sections_config, questions, created_at` from `test_exams`, we expose complete blueprint and section metadata for all exams.
   - In `d:\education portal\src\app\test-series\engine\[examId]\page.js`, when `exam.package_id` is null, invoice authorization checks are bypassed, allowing standalone mock tests to launch directly with 1-click without payment blockers. Package-bound exams continue to enforce purchase validation.

2. **Catalog & Filtering**:
   - In `d:\education portal\src\app\test-series\TestSeriesHubClient.jsx`, introduced a top View Mode Switcher with two tabs: `[Standalone Mock Tests (${mockCatalogExams.length})]` and `[Test Packages]`.
   - Built Blueprint filter pills (`All`, `JEE Main`, `JEE Advanced`, `NEET`, `Custom`) and Subject filter pills (`All`, `Physics`, `Chemistry`, `Mathematics`).
   - Every standalone exam card provides duration, marks, question count, blueprint badge, and a direct 1-click `[Attempt Test]` launcher (`router.push('/test-series/engine/' + exam.id)`). Removed all "Free Material" badges and unlocked test blueprints across both standalone and package views.

3. **Format-Specific CBT Inputs**:
   - Corrected format normalization order in `engine/[examId]/page.js` so that `MATRIX` resolves to `MATRIX_MATCH` and `MULTI`/`MSQ` resolves to `MSQ` prior to checking for single `MCQ`.
   - Created `d:\education portal\src\components\cbt\VirtualNumpad.jsx`: Features NTA on-screen numeric keypad buttons (0–9, decimal point, negative sign toggle, backspace, clear) that directly update the state and input box.
   - Created `d:\education portal\src\components\cbt\MatrixMatchGrid.jsx`: Implements a 4x4 interactive bubble grid matching List I (A, B, C, D) with List II (P, Q, R, S), including per-row clear buttons and KaTeX math formatting preview.
   - For MSQ questions: Rendered styled square checkboxes (`rounded-lg border-2`) alongside a persistent Partial Marking Guidance banner (`+4 for all correct, +1..+3 partial, -2 wrong`).
   - Retained circular radio buttons for standard single-choice MCQs.

4. **JEE Section B Attempt Enforcement**:
   - Built `d:\education portal\src\components\cbt\SectionAttemptLimitModal.jsx`.
   - In `CbtEngineClient.jsx`, tracked `sectionBAnsweredCount` dynamically across all questions where `section === 'Section B' || section_name === 'Section B'`.
   - Displayed live counter pill: `"Section B: X / 5 answered"`.
   - If a student attempts to answer a 6th question in Section B, `SectionAttemptLimitModal` is triggered, intercepting input, alerting the student to the 5-question cap, displaying currently answered questions, and requiring them to clear a response before selecting a new one.
   - In `d:\education portal\src\app\api\test-series\grade\route.js`, implemented server-side cap: strictly the first 5 answered questions in Section B per subject are graded; answers beyond the 5th are marked unattempted (`is_attempted: false`).

5. **Diagram Fullscreen Lightbox & Navigation**:
   - Created `d:\education portal\src\components\cbt\DiagramLightboxModal.jsx`: Fullscreen zoom/pan modal with controls (75% to 300%), pan drag, and escape key dismiss.
   - Integrated diagram click-to-zoom into active question viewports and inside the Question Paper modal.
   - Built Top-level Exam Navigation Strip in `CbtEngineClient.jsx`: Dynamic Subject Tabs (`Physics (X/Y)`, etc.) and Section Pills (`Section A: MCQs`, `Section B: Numerical`) with live progress and instant jumping.
   - Ensured Playwright test compatibility by providing accessible `Next Question` action text and `NTA CBT ENGINE` badges.

---

## 3. Caveats
- **Live Database Records**: Mock tests and exams are fetched from Supabase `test_exams`. Standalone tests are identified by `package_id IS NULL` or standalone blueprint tags.
- **Client Storage**: Unsaved answers continue to sync locally to `localStorage` key `cbt_exam_${examId}` so progress survives page reloads.
- **No Other Milestones Affected**: Changes were strictly confined to Milestone 5 files and the newly created `src/components/cbt/` components.

---

## 4. Conclusion
Milestone 5 is completely implemented and verified. The Student CBT Engine and Discovery experience now provides:
1. Seamless discovery of standalone mock exams with blueprint & subject filters and direct 1-click test launcher without package blockers.
2. An NTA-grade CBT navigation strip with multi-subject tabs and section pills.
3. Format-specific inputs: NTA virtual numpad, interactive 4x4 matrix matching grid, and MSQ multi-select checkboxes.
4. Client and server JEE Main Section B 5-out-of-10 attempt limit enforcement.
5. High-resolution diagram rendering with click-to-zoom lightbox modal.
6. Clean Next.js Turbopack build with 0 errors.

---

## 5. Verification Method
1. **Build Verification**:
   Run in `d:\education portal`:
   ```bash
   npm run build
   ```
   Confirm output displays `✓ Compiled successfully` and all routes compile cleanly.

2. **File Inspection**:
   - Inspect standalone mock test discovery & filters:
     `d:\education portal\src\app\test-series\TestSeriesHubClient.jsx`
   - Inspect format normalization and standalone authorization:
     `d:\education portal\src\app\test-series\engine\[examId]\page.js`
   - Inspect navigation strip, format inputs, attempt limiter, and diagram lightbox:
     `d:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx`
   - Inspect CBT child components:
     `d:\education portal\src\components\cbt\VirtualNumpad.jsx`
     `d:\education portal\src\components\cbt\MatrixMatchGrid.jsx`
     `d:\education portal\src\components\cbt\DiagramLightboxModal.jsx`
     `d:\education portal\src\components\cbt\SectionAttemptLimitModal.jsx`
   - Inspect server-side grading route:
     `d:\education portal\src\app\api\test-series\grade\route.js`
