# Handoff Report: Student Portal CBT Engine & Discovery Survey

**Working Directory**: `d:\education portal\.agents\explorer_survey_student_cbt`  
**Target Milestone**: Classplus-Grade Test Portal & NTA CBT Engine Overhaul  
**Timestamp**: 2026-09-04T10:45:00Z  
**Handoff Type**: Hard (Investigation complete, full findings documented)  

---

## 1. Observation

Direct observations from inspection of codebase files:

### 1.1 Discovery View (`/test-series/page.js` & `TestSeriesHubClient.jsx`)
- In `d:\education portal\src\app\test-series\page.js`:
  - **Lines 52–56**: Query for exams only selects `id, package_id, title, duration_minutes, total_questions, is_live_ranking, activation_timestamp, marks_scheme`. It does NOT select `blueprint_type` or `sections_config`.
  - **Lines 68–84**: Invoices check filters by `package_id`.
- In `d:\education portal\src\app\test-series\TestSeriesHubClient.jsx`:
  - **Lines 147–158**: State `filteredPackages` only filters `packages`.
  - **Lines 254–660**: UI maps exclusively over `filteredPackages`. Exams are rendered strictly inside an accordion under each package card via `const pkgExams = exams.filter(e => e.package_id === pkg.id)`. Any exam with `package_id = null` is orphaned and completely invisible.
  - **Lines 362–376 & 614–623**: If a package is premium, exams inside it are disabled and locked behind Razorpay checkout. There is no standalone mock test discovery.

### 1.2 Student Engine Server Loader (`engine/[examId]/page.js`)
- **Lines 40–59**: Premium authorization check redirects to `/test-series` if `exam.test_packages?.price_ledger?.status === 'premium'` and user has no invoice for `exam.package_id`.
- **Lines 80–84 & 117–121**: Question format sanitization:
  ```javascript
  let rawFormat = (q.format_type || q.type || 'MCQ').toUpperCase()
  if (rawFormat.includes('SINGLE') || rawFormat.includes('MCQ')) rawFormat = 'MCQ'
  else if (rawFormat.includes('MULTIPLE') || rawFormat.includes('MSQ')) rawFormat = 'MSQ'
  else if (rawFormat.includes('NUM')) rawFormat = 'NUMERICAL'
  ```
  `rawFormat.includes('MULTIPLE')` returns `false` for `'multi_mcq'`.
  Matrix match (`matrix_match`) is completely unhandled.
- **Lines 141–150**: Exam sanitization omits `blueprint_type` and `sections_config`.

### 1.3 CBT Engine Workspace (`CbtEngineClient.jsx`)
- **Lines 41–47**: `subjectsList` is computed, but Subject tabs are only rendered in the Desktop Sidebar (lines 926–942) and Mobile Bottom Sheet (lines 1116–1132). There are NO Subject Tabs in the main exam workspace.
- **Lines 597–731**: Header contains test title and question number `Q X/Y`, but NO Subject Tabs and NO Section Pills.
- **Lines 349–361**: Only checks `isNumerical` and `isMsq`. There is ZERO code for Matrix Matching (`matrix_match`).
- **Lines 773–782**: Dedicated diagram container uses `next/image` with `fill`, but lacks any click-to-zoom / lightbox magnification. In the Question Paper modal (lines 1354–1376), diagrams are completely omitted.
- **Section B Rules**: Grep search for `Section B` or attempt limits returns zero results. There is no counter, no max 5 limit, and no over-attempt warning.

### 1.4 Grading Route (`/api/test-series/grade/route.js`)
- **Lines 92–211**: Grading branches exist only for Numerical, MSQ, and Single MCQ. Matrix Matching evaluation logic is completely missing.
- **Lines 213–223**: Scores all questions without enforcing Section B attempt caps.

---

## 2. Logic Chain

1. **Standalone Exam Invisibility**: Because `TestSeriesHubClient.jsx` only iterates over `packages` and groups exams via `pkgExams = exams.filter(e => e.package_id === pkg.id)` (Obs 1.1), any exam where `package_id` is null (such as standalone mock tests compiled from PDFs or created directly) is completely excluded from the rendered DOM. Students cannot discover or launch standalone mock tests without decoupling the discovery view from packages.
2. **Navigation Disconnect**: In competitive exams like JEE Main/Advanced, candidates jump between subjects (Physics, Chemistry, Maths) and sections (Section A MCQ, Section B Numerical). Because `CbtEngineClient.jsx` only shows subjects inside the palette dropdowns (Obs 1.3) and omits section pills entirely, the student has no direct way to view their subject/section context or switch sections without opening the question palette.
3. **Question Type Failure**: Because `engine/[examId]/page.js` normalizes formats using `includes('MULTIPLE')` (Obs 1.2), database questions with `format_type = 'multi_mcq'` fail this check and remain `'MULTI_MCQ'`. In `CbtEngineClient.jsx`, `isMsq` checks `format === 'MSQ'`. Consequently, MSQs degrade to single-choice radio buttons. Similarly, `matrix_match` is completely unhandled and falls back to single-choice MCQs. Furthermore, the grading API (Obs 1.4) cannot evaluate matrix match answers.
4. **JEE Attempt Limit Violation**: The JEE Main blueprint specifies that Section B contains 10 questions of which students may attempt at most 5. Because neither the client (Obs 1.3) nor server (Obs 1.4) tracks or caps Section B attempts, students can answer all 10 questions without warning, invalidating NTA test fidelity.
5. **Diagram Usability Limitation**: Diagrams in STEM exams (circuit diagrams, organic synthesis, geometry) require high resolution. The static 200px box without magnification (Obs 1.3) prevents students from inspecting small notations.

---

## 3. Caveats

- **Network / Command Execution Constraint**: Terminal commands requiring interactive elevation (e.g. `npm run lint`) timed out on user prompt; however, static code analysis was conducted directly on the source files using `view_file`, `grep_search`, and `find_by_name`.
- **Database Schema Dependency**: The migration `test_exams.package_id` nullable and `sections_config` / `blueprint_type` column addition (R1) is being handled in parallel by the database worker. The student portal implementation must gracefully fallback if `sections_config` is temporarily undefined or null.
- **Matrix Matching Option Structure**: The parser may emit matrix options as `{ rows: [...], cols: [...] }` or as array pairs. The UI matrix grid must support both structures robustly.

---

## 4. Conclusion

1. **Discovery Decoupling**: `/test-series/page.js` and `TestSeriesHubClient.jsx` must be refactored to prominently present a **Standalone Mock Test Catalog** with Blueprint (`JEE Main`, `JEE Advanced`, `NEET`), Subject (`Physics`, `Chemistry`, `Maths`), and Status filters. Tests must launch directly via `/test-series/engine/${exam.id}` with no mandatory package paywall.
2. **Engine Navigation Strip**: `CbtEngineClient.jsx` must render top-level **Subject Tabs** (`[Physics]`, `[Chemistry]`, `[Mathematics]`) and sub-level **Section Pills** (`[Section A: MCQs]`, `[Section B: Numerical]`) in the main workspace.
3. **Format-Specific Inputs**:
   - Numerical: On-screen virtual keypad (0-9, `.`, `+/-`, `Backspace`, `Clear`).
   - Matrix Matching: Interactive 4x4 clickable matrix grid with Row/Col toggles, clear row buttons, and server-side grading.
   - MSQs: Multi-select square checkboxes with partial marking indicator.
4. **Section B Rule Enforcement**: Calculate answered questions in Section B of the active subject. When count reaches 5, display `"Section B: 5 / 5 answered (Limit Reached)"` and prevent attempting additional Section B questions with an informative warning modal.
5. **Diagram Lightbox**: Implement click-to-zoom magnification modal for question diagrams and render diagrams in the Question Paper view.

---

## 5. Verification Method

To independently verify the survey findings and subsequent implementation:

1. **Inspect Discovery decoupling**:
   - Check `d:\education portal\src\app\test-series\page.js` lines 49–66 and `TestSeriesHubClient.jsx` lines 254–276.
   - Confirm standalone tests (with `package_id = null`) render on `/test-series` and their "Launch CBT" button directly navigates to `/test-series/engine/[examId]`.
2. **Inspect Subject Tabs & Section Pills**:
   - Open `/test-series/engine/[examId]` in browser.
   - Verify top navigation strip shows `[Physics]`, `[Chemistry]`, `[Mathematics]` tabs and `[Section A]`, `[Section B]` pills. Clicking switches questions immediately.
3. **Inspect Format-Specific Inputs**:
   - Verify numerical question renders digital display with on-screen numpad.
   - Verify `matrix_match` renders interactive 4x4 bubble grid.
   - Verify `multi_mcq` renders square checkboxes and allows multi-selection.
4. **Inspect Section B Limit**:
   - Answer 5 questions in Section B. Verify badge reads `Section B: 5 / 5 answered`.
   - Attempt to answer 6th question. Verify input is blocked and warning modal appears.
5. **Inspect Diagram Lightbox**:
   - Click a question diagram. Verify full-screen zoom modal opens.
