# Admin Portal & Visual Exam Compiler Survey Analysis

**Date**: 2026-09-04  
**Explorer**: Admin Portal & Visual Exam Compiler Survey Explorer  
**Target Codebase**: `d:\admin dashboard` (with references to `d:\education portal`)  
**Scope**: Requirements R2 (Admin Test Portal & Question Paper PDF Repository) & R4 (Overhauled Visual Exam Compiler & In-Place Editor) from `ORIGINAL_REQUEST.md`.

---

## 1. Executive Summary

This survey provides an exhaustive structural audit and blueprint for transforming the current fragmented, package-dependent test series administration in `d:\admin dashboard` into a unified, Classplus-grade **Test Portal**.

Currently:
1. **Navigation is package-centric**: `AdminLayoutShell.jsx` exposes "Test Packages", forcing the paradigm that exams must belong to a purchasable package.
2. **`/admin/test-series` lacks direct exam visibility**: The page strictly lists `test_packages` in a bento grid. Standalone exams (`package_id = null`) are invisible. There is no consolidated view of all compiled mock tests and no question paper PDF repository.
3. **`TestCompiler.jsx` is split and rigid**: It features an authoring sidebar and a plain flat list of questions on the right. It lacks exam blueprint templates (JEE Main, JEE Advanced, Custom), Subject tabs (Physics, Chemistry, Maths), Section sub-pills (Section A MCQs vs Section B Numerical), in-place card expansion/editing, format-specific input components (Integer keypad/numerical, 4x4 matrix match, MSQ multi-select), and printable PDF booklet export.

The following sections define the precise observations, architectural changes, and implementation specifications needed to fulfill R2 and R4.

---

## 2. Investigation 1: Navigation & Layout Shell (`AdminLayoutShell.jsx`)

### 2.1 Current File State & Observations
- **File**: `d:\admin dashboard\src\components\AdminLayoutShell.jsx`
- **Lines 33–37**:
  ```javascript
  const testingSection = [
    { label: 'Test Packages', href: '/admin/test-series', icon: Package },
    { label: 'Question Bank', href: '/admin/questions', icon: HelpCircle }
  ];
  ```
- **Line 92**:
  ```javascript
  {renderNavGroup('Exams', testingSection)}
  ```
- **Associated Command Palette**: `d:\admin dashboard\src\components\CommandPalette.jsx`
  - Line 78–79:
    ```javascript
    <Command.Item onSelect={() => runCommand(() => router.push('/admin/test-series'))} ...>
      <Activity className="w-4 h-4 text-rose-500" />
      <span>Test Series Catalog</span>
    </Command.Item>
    ```

### 2.2 Audit for "Free Material"
- A full-text audit across `d:\admin dashboard\src\` confirms **zero existing instances of "Free Material"** in the navigation links or sidebar.
- Historically, coaching LMS portals (like Classplus) contain a "Free Material" tab for unmonetized study documents.
- In accordance with the user directive, no "Free Material" menu item or tab should exist in the navigation. Standalone mock tests and PDF question papers must live cleanly inside the unified **Test Portal**.

### 2.3 Proposed Navigation Changes
1. **`AdminLayoutShell.jsx`**:
   - Replace `{ label: 'Test Packages', href: '/admin/test-series', icon: Package }` with:
     ```javascript
     { label: 'Test Portal', href: '/admin/test-series', icon: Layers }
     ```
     *(Import `Layers` from `lucide-react`)*.
2. **`CommandPalette.jsx`**:
   - Update `<span>Test Series Catalog</span>` to `<span>Test Portal & Question Papers</span>`.
3. **Page Header Titles**:
   - In `d:\admin dashboard\src\app\admin\test-series\page.js`:
     - Update `title` from `"Test Series & CBT Assessment Studio"` to `"Test Portal & Question Paper Repository"`.
     - Update `subtitle` to `"Manage Standalone CBT Mock Exams, PDF Question Papers, and AI Vision Auto-Compilation"`.

---

## 3. Investigation 2: `/admin/test-series` 2-Tab Architecture & PDF Repository

### 3.1 Current Page Architecture & Limitations
- **Current Entry**: `d:\admin dashboard\src\app\admin\test-series\page.js`
- **Current Child Components**:
  - `TestSeriesStatsHeader.jsx`: Shows packages, exams, candidate attempts, premium count, and average score.
  - `TestSeriesGrid.jsx`: 732 lines of bento cards displaying `test_packages`. Only packages are clickable.
  - `TestSeriesEditorDrawer.jsx`: Slide-out drawer containing `PackageOverviewTab`, `PackageExamsTab`, `ExamCompilerTab`, `LiveTelemetryTab`, and `SubmissionsTab`.
- **Systemic Flaws**:
  - **No Standalone Exam Visibility**: If an exam has `package_id = null` (as enabled by R1), it cannot be seen or managed on the main dashboard.
  - **No PDF Repository**: Raw question paper PDFs uploaded by teachers cannot be tracked, organized, or reviewed prior to compilation.
  - **Compiler Hidden in Drawer**: The compiler is buried 3 clicks deep inside a package drawer rather than being a top-level workspace.

### 3.2 Refactored 2-Tab Layout Specification

The `/admin/test-series/page.js` view will be refactored into a tabbed command center:

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ Test Portal & Question Paper Repository                                                   │
│ [ Total Exams: 24 ]  [ PDF Papers: 12 ]  [ Ready to Compile: 4 ]  [ Student Attempts: 342 ]│
├───────────────────────────────────────────────────────────────────────────────────────────┤
│  [ 📋 All Tests (24) ]    [ 📁 PDF Question Papers (12) ]          [ + Compile New Exam ]  │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│  TAB 1: ALL TESTS                                                                         │
│  [ Search tests... ]  [ Blueprint: All | JEE Main | JEE Adv | Custom ]  [ Status: Live... ]│
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Title & Blueprint │ Subjects/Sections │ Questions & Duration │ Attempts │ Actions   │  │
│  ├───────────────────┼───────────────────┼──────────────────────┼──────────┼───────────┤  │
│  │ JEE Main Mock #01 │ Physics, Chem, M  │ 90 Qs • 180 Mins     │ 84 Att.  │ [Edit]    │  │
│  │ (JEE Main)        │ Sec A (60), B(30) │ 300 Max Marks        │ Avg: 142 │ [Monitor] │  │
│  │                   │                   │                      │          │ [PDF] [x] │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                           │
│  TAB 2: PDF QUESTION PAPERS                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⬆ Drag and drop Question Paper PDF here (.pdf)                                     │  │
│  │ Title: [ JEE Advanced 2025 Paper 1 ]  Subject: [ PCM ]  Target: [ JEE Advanced ]   │  │
│  │ [ Progress: 100% - Ready ]                                                          │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ [PDF Icon] JEE Advanced 2025 Paper 1.pdf  | 4.2 MB | 2026-09-04                     │  │
│  │ Badge: [ Ready to Compile ]               | Subject: All-in-One PCM                 │  │
│  │ Actions: [ ⚡ 1-Click Compile into Exam ]  [ 👁 Preview PDF ]  [ 🗑 Delete ]          │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Tab 1: "All Tests" (Compiled Standalone Exams Table)
- **Data Source**: Direct query to `public.test_exams` ordered by `created_at DESC` joined with `test_attempts(count)` and optional `test_packages(title)`.
- **Features**:
  - Consolidated table of all exams regardless of whether `package_id` is null or set.
  - Search omnibar for filtering by title or tags.
  - Blueprint type badges (`JEE Main`, `JEE Advanced`, `Custom`).
  - Question count, duration (mins), and total marks.
  - Attempt tally and class average score.
  - **Row Action Dock**:
    - **"Edit in Compiler"**: Routes to `/admin/test-series/compiler?examId=<id>`.
    - **"Proctoring Telemetry"**: Routes to `/admin/test-series/monitor/<id>`.
    - **"Export Printable PDF"**: Generates instant printable 2-column booklet.
    - **"Delete Exam"**: Opens confirmation dialog with cascade cleanup.
  - **Top Action**: "Compile New Exam" button navigating directly to `/admin/test-series/compiler`.

#### Tab 2: "PDF Question Papers" (Question Paper PDF Repository)
- **Data Source**: `public.question_paper_documents` table:
  - Columns: `id`, `title`, `file_url`, `file_name`, `file_size_bytes`, `subject`, `target_exam`, `status`, `compiled_exam_id`, `created_at`.
- **Drag-and-Drop PDF Uploader**:
  - Drag-and-drop dropzone with file input accepting `.pdf`.
  - Configurable metadata inputs:
    - `Title`: Auto-populated from file name (editable).
    - `Subject`: `All-in-One (Physics, Chemistry, Maths)`, `Physics`, `Chemistry`, `Mathematics`, `Biology`, `General`.
    - `Target Exam`: `JEE Main`, `JEE Advanced`, `NEET`, `Custom`.
  - Upload Progress: 0-100% progress bar.
  - Storage Destination: Supabase Storage bucket `question-papers` under `uploads/${Date.now()}_${file.name}`.
  - Database Insertion: Inserts row in `public.question_paper_documents` with status `'ready'`.
- **Repository List / Grid**:
  - Displays uploaded documents with upload date, formatted file size (`X.X MB`), subject tag, and status badge.
  - Status Badges:
    - `"Ready to Compile"`: Amber badge indicating raw PDF is in repository awaiting compilation.
    - `"Compiled"`: Emerald badge indicating exam has been extracted and created, with link to exam.
  - **Primary Action: "1-Click Compile into Exam"**:
    - Invokes backend AI Vision pipeline (`/api/admin/ai/parse-pdf` / multimodal parser).
    - Automatically opens `TestCompiler` with extracted questions separated into Subject Tabs and bound with Answer Key.

---

## 4. Investigation 3: Overhauled Visual Exam Compiler (`TestCompiler.jsx`)

### 4.1 Current Compiler Deficiencies
- Current implementations exist in:
  1. `d:\admin dashboard\src\components\TestCompiler.jsx`
  2. `d:\admin dashboard\src\app\admin\test-series\compiler\CompilerClient.jsx` (duplicated code)
  3. `d:\admin dashboard\src\components\test-series\tabs\ExamCompilerTab.jsx`
- **Critical Gaps**:
  1. **No Blueprint Presets**: No one-click selector for `[JEE Main]`, `[JEE Advanced]`, or `[Custom]`.
  2. **No Subject Separation**: All questions appear in an unorganized flat list `#1, #2...`. There are no top tabs for `Physics`, `Chemistry`, and `Mathematics`.
  3. **No Section Sub-Pills**: No support for JEE Main `Section A (MCQs, +4/-1)` and `Section B (Numerical, +4/0, attempt max 5 of 10)`.
  4. **No In-Place Expansion**: The right-side question list only allows deletion. To edit a question, the user must re-author it from scratch in the left panel.
  5. **No Format-Specific Editors**: Numerical inputs don't have direct integer/decimal fields; Matrix Match has no interactive row/column grid; MSQs lack multi-checkbox answer keys.
  6. **No Offline Printable Booklet Export**: Teachers cannot print offline 2-column question papers with answer keys for classroom mock tests.

### 4.2 Overhauled Visual Exam Compiler Specification

#### A. Workspace Header & Blueprint Selector
- **Blueprint Presets**:
  - **`[JEE Main]` Blueprint**:
    - Automatically configures 3 Subjects: `Physics`, `Chemistry`, `Mathematics`.
    - Each subject configures 2 Sections:
      - **Section A**: 20 Single-Choice MCQs, +4 positive, -1 negative, max attempt 20.
      - **Section B**: 10 Numerical/Integer questions, +4 positive, 0 negative, **attempt any 5 of 10** (max attempt 5).
    - Exam Totals: 90 Questions (student attempts 75), 300 Marks, 180 Minutes.
  - **`[JEE Advanced]` Blueprint**:
    - 3 Subjects: `Physics`, `Chemistry`, `Mathematics`.
    - 3 Sections per subject (Paper 1 / Paper 2 pattern):
      - **Section 1**: Multi-Select MCQs (MSQ), 6 Qs, +4 full, partial marking (+3, +2, +1), -2 negative.
      - **Section 2**: Numerical / Non-negative Integer, 6 Qs, +4 positive, 0 negative.
      - **Section 3**: Matrix Matching (4x4), 4 Qs, +3 positive, -1 negative.
    - Exam Totals: 48-54 Questions, 180-198 Marks, 180 Minutes.
  - **`[Custom]` Blueprint**:
    - Freeform builder allowing arbitrary subjects, sections, scoring weights, and attempt caps.
- **Top Actions**:
  - `[ Export Printable PDF ]`: Generates offline 2-column test booklet.
  - `[ AI PDF Question Ingestion ]`: Opens multimodal extractor.
  - `[ Save & Publish Exam ]`: Saves to `test_exams` and updates junction table `exam_questions`.

#### B. Subject Tabs & Section Sub-Pills
- **Subject Tabs**:
  - Top tab bar: `[ ⚛️ Physics (25/30) ]` | `[ 🧪 Chemistry (30/30) ]` | `[ 📐 Mathematics (20/30) ]`
  - Active tab highlights in primary theme, displaying live question tally.
- **Section Sub-Pills**:
  - Displayed immediately under the active Subject tab:
    - E.g. Under Physics:
      - Pill 1: `[ Section A: MCQs (20 Qs, +4/-1) ]`
      - Pill 2: `[ Section B: Numerical (10 Qs, +4/0, Max 5 Attempts) ]`
  - Switching pills filters the workspace questions to that section.
  - Sub-pill displays total questions added, target count, scoring rules, and attempt constraint.

#### C. In-Place Interactive Question Cards
Instead of an external form, each question in the active section renders as an expandable card:
1. **Collapsed State**:
   - Section question index (e.g. `Q1`, `Q2` ... `Q20`).
   - Format badge: `Single MCQ`, `Multiple Choice (MSQ)`, `Numerical / Integer`, `Matrix Match`.
   - Scoring pill: `+4 / -1` or `+4 / 0`.
   - Formula preview: LaTeX rendered inline via `KatexRenderer`.
   - Diagram thumbnail indicator if diagram image exists.
   - Quick Controls: Move Up, Move Down, Move to Section dropdown, Delete, Expand/Collapse chevron.
2. **Expanded In-Place State**:
   - **Content Editor**: Textarea with KaTeX math formula preview rendered in real time directly below.
   - **Diagram Asset**: Input for diagram URL with live thumbnail and delete/upload options.
   - **Format-Specific Input Blocks**:
     - **Numerical / Integer**:
       - Single clean numerical input box for integer/decimal answers (e.g. `42`, `-3.14`).
       - Decimal tolerance range input (e.g. `± 0.05`).
     - **Single Choice (SCQ)**:
       - 4 option text inputs (A, B, C, D).
       - Radio buttons to mark the single correct option.
       - KaTeX preview per option.
     - **Multiple Choice (MSQ)**:
       - 4 option text inputs (A, B, C, D).
       - Checkboxes to select one or more correct options (e.g. A, C, D).
       - Visual badge explaining partial marking (+4 full, +1 per correct option with no incorrect option, -2 if incorrect).
     - **Matrix Match**:
       - 4 Left Rows (Column I: A, B, C, D) and 4 Right Rows (Column II: P, Q, R, S).
       - Interactive 4x4 matrix matching grid allowing teachers to check/uncheck mappings (e.g. A -> P, S; B -> Q; C -> R; D -> P).
   - **Explanation / Solution**:
     - Solution derivation textarea with live KaTeX preview.
   - **Per-Question Scoring Override**:
     - Custom positive and negative marks if differing from section defaults.
   - **Save / Done Button**: Closes card and commits changes to state.

#### D. Printable PDF Export Feature
- **Target Layout**: NTA / JEE classroom offline question paper booklet.
- **Styling Architecture**:
  - Dedicated print-optimized modal or printable window with CSS `@media print` rules.
  - `columns: 2; column-gap: 2.5rem; column-rule: 1px solid #cbd5e1;` for authentic competitive booklet layout.
- **Booklet Structure**:
  1. **Official Header**:
     - Institute Name: "ASENTRA EDUCATION - NATIONAL ASSESSMENT PRACTICE"
     - Exam Title, Subject, Date, Duration (180 Minutes), Total Marks (300 Marks).
  2. **Candidate Information Block**:
     - Grid with: Candidate Name, Roll Number, Exam Center, Candidate Signature, Invigilator Signature.
  3. **General Instructions**:
     - Standard competitive rules: Sec A 20 MCQs (+4/-1); Sec B 10 Numerical (Attempt any 5, +4/0).
  4. **Subject & Section Blocks**:
     - Clean section headings: `PART I - PHYSICS: SECTION A (MULTIPLE CHOICE QUESTIONS)`.
     - Question stems with vector LaTeX rendered via KaTeX.
     - Extracted diagrams embedded directly beneath questions at proportional print scaling.
     - Options printed inline or 2x2 grid `(A) ... (B) ... (C) ... (D) ...`.
  5. **Rough Work Footer**:
     - Bordered "SPACE FOR ROUGH WORK" area at the bottom of pages.
  6. **End-of-Exam Answer Key & Scoring Matrix**:
     - Formatted table at the end of the booklet listing Question #, Subject, Section, and Correct Key/Value (`1: B, 2: D, 3: 42...`).

---

## 5. Database Schema & API Integration Mapping

### 5.1 Tables & Schema Updates
| Table | Column Changes / Structure | Purpose |
|---|---|---|
| `public.test_exams` | `package_id DROP NOT NULL` | Decouple exams so standalone tests exist without packages |
| `public.test_exams` | `ADD COLUMN sections_config JSONB` | Store section structure, scoring rules (+4/-1, +4/0), attempt caps (any 5 of 10) |
| `public.test_exams` | `ADD COLUMN blueprint_type TEXT` | Store blueprint preset (`jee_main`, `jee_advanced`, `custom`) |
| `public.question_paper_documents` | `id, title, file_url, file_name, file_size_bytes, subject, target_exam, status, compiled_exam_id, created_at` | Track raw uploaded question paper PDFs in repository |
| Storage bucket: `question-papers` | Public read, authenticated insert/delete | Host uploaded raw PDF files |
| `public.exam_questions` | `exam_id, question_id, order_index, section, marks_positive, marks_negative` | Junction table linking central `question_bank` to compiled exams |

### 5.2 API Routes
- `/api/admin/ai/parse-pdf`: Ingests PDF/raw text, invokes Gemini multimodal model, returns structured questions with answer keys.
- `/api/admin/ai/parse-pdf-page`: Parses single page images rendered via PDF.js.

---

## 6. Implementation Roadmap for Builders

### Step 1: Navigation Alignment (`AdminLayoutShell.jsx` & `CommandPalette.jsx`)
- Replace `'Test Packages'` navigation item with `'Test Portal'` (`icon: Layers`, `href: '/admin/test-series'`).
- Update `CommandPalette.jsx` item from `'Test Series Catalog'` to `'Test Portal'`.
- Verify no "Free Material" tab exists anywhere.

### Step 2: Refactor `/admin/test-series` to 2-Tab Interface
- Create `TestPortalHeader.jsx` with real-time metric cards (Total Exams, PDF Question Papers, Ready to Compile, Total Attempts).
- Implement Tab Switcher (`All Tests` vs `PDF Question Papers`).
- Build **Tab 1 (`AllTestsTab.jsx`)**:
  - Table of all compiled exams (`test_exams`) with search omnibar and blueprint filters.
  - Action buttons: Edit/Compiler, Telemetry Monitor, Export Printable PDF, Delete.
- Build **Tab 2 (`PdfRepositoryTab.jsx`)**:
  - Drag-and-drop PDF uploader with progress tracking to Supabase storage bucket `question-papers`.
  - Grid/list of `question_paper_documents` with "Ready to Compile" vs "Compiled" status.
  - 1-click "Compile into Exam" action button.

### Step 3: Overhaul `TestCompiler.jsx` Workspace
- Unify `TestCompiler.jsx` and `app/admin/test-series/compiler/CompilerClient.jsx` into a single, high-performance visual compiler.
- Add **Blueprint Selector**: One-click configuration of `[JEE Main]`, `[JEE Advanced]`, and `[Custom]`.
- Add **Subject Tabs**: `Physics`, `Chemistry`, `Mathematics`.
- Add **Section Sub-Pills**: `Section A (MCQs, +4/-1)` and `Section B (Numerical, +4/0, max 5)`.
- Add **In-Place Question Cards**:
  - Collapsed card with KaTeX preview snippet and reorder/delete controls.
  - In-place expansion with live formula editor, diagram preview, format-specific inputs (Integer numerical box, 4x4 matrix match grid, MSQ checkboxes, SCQ radio buttons).
- Add **"Export Printable PDF"**:
  - 2-column NTA booklet layout with header, candidate info, KaTeX formulas, diagrams, and end-of-paper answer key table.
- Wire `/admin/test-series/compiler/page.js` to accept `?examId=...` and `?documentId=...` for 1-click compilation.

---
