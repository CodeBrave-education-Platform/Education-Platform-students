# Adversarial Anti-Mock & Integrity Audit Report (Milestone 6)

**Agent**: Challenger 2 (Anti-Mock Challenger)  
**Working Directory**: `d:\education portal\.agents\challenger_m6_anti_mock`  
**Target Milestone**: Milestone 6 (Assessment Suite Transformation & Test Portal Verification)  
**Explicit Verdict**: **`APPROVE`**

---

## 1. Observation

Direct forensic code and architecture inspection yielded the following concrete observations across both portals:

### 1.1 Migration 17 Parity, Decoupling, RLS & Storage
- **File 1**: `d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql` (794 lines, 32,098 bytes)
- **File 2**: `d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql` (794 lines, 32,098 bytes)
- **Package Decoupling (Lines 21-23, 40-43)**:
  ```sql
  ALTER TABLE public.test_exams 
    ALTER COLUMN package_id DROP NOT NULL;

  ALTER TABLE public.test_exams
    ADD CONSTRAINT fk_test_exams_package
    FOREIGN KEY (package_id) REFERENCES public.test_packages(id) ON DELETE SET NULL;
  ```
- **Blueprint Columns & Check Constraint (Lines 45-61)**:
  ```sql
  ALTER TABLE public.test_exams
    ADD COLUMN IF NOT EXISTS sections_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS blueprint_type TEXT NOT NULL DEFAULT 'custom';
  ...
  CHECK (blueprint_type IN ('jee_main', 'jee_advanced', 'neet', 'custom'));
  ```
- **Question Paper Documents Table & RLS (Lines 72-88, 113-144)**:
  - Table `public.question_paper_documents` created with columns: `id`, `title`, `file_url`, `file_name`, `file_size_bytes`, `subject`, `target_exam`, `status` (`'uploading'`, `'ready_to_compile'`, `'compiled'`, `'failed'`), `compiled_exam_id`, `uploaded_by`, `parsed_payload`, `metadata`, `created_at`, `updated_at`.
  - `ALTER TABLE public.question_paper_documents ENABLE ROW LEVEL SECURITY;`
  - Policy `Anyone can view question paper documents` for `anon`, `authenticated` (`USING (true)`).
  - Policy `Staff manage question paper documents` for `authenticated` requiring role in `('admin', 'teacher', 'instructor', 'superadmin')`.
- **Storage Bucket & Storage RLS (Lines 151-192)**:
  - Bucket `'question-papers'` configured in `storage.buckets` (`public = true`, `file_size_limit = 52428800` bytes / 50MB, allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`).
  - Four explicit policies on `storage.objects`:
    - `Public view question-papers bucket` (SELECT, TO public, `bucket_id = 'question-papers'`).
    - `Authenticated upload to question-papers bucket` (INSERT, TO authenticated, `bucket_id = 'question-papers'`).
    - `Authenticated update in question-papers bucket` (UPDATE, TO authenticated, `bucket_id = 'question-papers'`).
    - `Authenticated delete in question-papers bucket` (DELETE, TO authenticated, `bucket_id = 'question-papers'`).

### 1.2 Zero References to "Free Material" Across Admin Navigation
- In `d:\admin dashboard\src\components\AdminLayoutShell.jsx` (Lines 33-36):
  ```javascript
  const testingSection = [
    { label: 'Test Portal', href: '/admin/test-series', icon: Layers },
    { label: 'Question Bank', href: '/admin/questions', icon: HelpCircle }
  ];
  ```
  Legacy "Test Packages" is completely replaced with "Test Portal". Zero occurrences of `"Free Material"` exist in the file.
- In `d:\admin dashboard\src\components\CommandPalette.jsx` (Lines 74-79):
  ```javascript
  <Command.Item 
    onSelect={() => runCommand(() => router.push('/admin/test-series'))}
    ...
  >
    <Layers className="w-4 h-4 text-rose-500" />
    <span>Test Portal</span>
  </Command.Item>
  ```
  Zero occurrences of `"Free Material"`.
- In `d:\admin dashboard\src\components\test-series\TestPortalTabs.jsx`:
  Two tabs: Tab 1 "All Tests", Tab 2 "PDF Question Papers". Zero occurrences of `"Free Material"`.
- Global filesystem scan of `d:\admin dashboard`: Zero files matching `*material*` or `*free*`.

### 1.3 Anti-Mock Inspection of Visual Exam Compiler
- **File**: `d:\admin dashboard\src\components\TestCompiler.jsx` (1,354 lines)
- **Decoupled Standalone Exams (Line 760)**:
  ```javascript
  package_id: targetPackageId || null, // NULLABLE standalone decoupled support!
  ```
- **Genuine Database Writes (Lines 781-835)**:
  - Real update or insert to `public.test_exams` using Supabase client.
  - Relational sync to `public.exam_questions` junction table.
  - Updates `public.question_paper_documents` status to `'compiled'` with `compiled_exam_id` (Lines 842-848).
- **Blueprint Presets (Lines 26-282)**:
  - `jee_main`: 3 subjects, 90 questions (75 attempts), Section A (+4/-1), Section B (+4/0, max 5 attempts).
  - `jee_advanced`: 3 subjects, 54 questions, Single MCQ (+3/-1), Multi MSQ with partial marking (+4/-2), Numerical (+4/0).
  - `custom`: flexible subject and marking presets.
- **In-Place Editor Integration**: `QuestionCardInPlaceEditor` renders format-specific inputs (MCQ radio, MSQ checkboxes, numerical values, 4x4 matrix matching) and updates live KaTeX math formula previews.
- **Zero Mock Facades**: No fake static question returns, mock bypasses, or bypassed save triggers.

### 1.4 Anti-Mock Inspection of AI Vision Parser Pipeline
- **File**: `d:\admin dashboard\src\app\api\admin\ai\parse-pdf\route.js` (482 lines)
- **Multimodal AI Pipeline (Lines 306-347)**:
  - Invokes `GoogleGenAI` from `@google/genai` using model cascade (`gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, etc.).
  - Passes system instruction `GEMINI_SYSTEM_INSTRUCTION` enforcing question types, diagram bounding boxes `[ymin, xmin, ymax, xmax]`, and answer key matrix parsing.
  - Validates and sanitizes questions via `sanitizeGeminiQuestions()`.
- **Answer Key Matrix Binding (Lines 380-386)**:
  - Detects `answer_key_map` and binds answers to question items via `bindAnswerKeysToQuestions()`.
- **Deterministic Offline Fallback (Lines 268-298, 404-435, 446-462)**:
  - If API key is missing or model calls fail, uses `pdf-parse` + `parseExtractedText()` with regex heuristics and stem scoring (`scoreStemSubject()`).
  - When given an empty body, returns `questions_count: 0` with an informational warning rather than fake dummy questions.

### 1.5 Anti-Mock Inspection of Student CBT Engine
- **File**: `d:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx` (1,737 lines)
- **Section B Attempt Limit Enforcement (Lines 438-464)**:
  ```javascript
  const isCurrentSecB = (currentQuestion?.section || '').toLowerCase().includes('section b') || (isNumerical && !currentQuestion?.section)
  ...
  const secBAnsweredCount = answeredSecBQuestions.length
  const maxSecBAllowed = 5
  const isCurrentQuestionAnswered = isAnswerFilled(currentAnswer)

  const checkSectionBLimit = () => {
    if (isCurrentSecB && !isCurrentQuestionAnswered && secBAnsweredCount >= maxSecBAllowed) {
      setShowSectionBWarningModal(true)
      return false
    }
    return true
  }
  ```
  Triggered before any selection is applied (`handleSingleMcqSelect`, `handleMsqToggle`, `handleNumericalInput`, `handleNumericalKeypad`, `handleMatrixMatchChange`).
- **Format-Specific Inputs**:
  - `VirtualNumpad` (touch and mouse on-screen number pad for integers/numerical).
  - `MatrixMatchGrid` (interactive column matching grid).
  - Square multi-select checkboxes for MSQs.
- **Genuine IndexedDB & Server Submission**:
  - Local caching via `saveExamState` in IndexedDB.
  - Submits to `/api/test-series/grade` with payload `{ examId, answers, secondsRemaining, durationMinutes }`.

### 1.6 Anti-Mock Inspection of Server-Side CBT Grading Route
- **File**: `d:\education portal\src\app\api\test-series\grade\route.js` (403 lines)
- **Authentic Database Queries (Lines 14-81)**:
  - Validates session with `supabase.auth.getUser()`.
  - Queries `public.test_exams` and relational join `public.exam_questions` + `public.question_bank`.
- **Multi-Format Grading Logic (Lines 96-285)**:
  - Single MCQ: compares submitted index vs correct option index.
  - MSQ: evaluates multi-selection set equality.
  - Numerical: checks tolerance (`Math.abs(submittedNum - targetNum) <= tol`) and `numerical_range`.
  - Matrix Match: checks 4x4 row matches with proportional partial marking.
- **Server-Side Section B Cap (Lines 130-141)**:
  ```javascript
  const isSecB = (q.section || '').toLowerCase().includes('section b') || (isNumerical && !q.section)
  if (isSecB) {
    const currentAttempts = subjectSectionBAttempts[qSubject] || 0
    if (currentAttempts >= 5) {
      unanswered++
      return
    }
    subjectSectionBAttempts[qSubject] = currentAttempts + 1
  }
  ```
  Prevents over-attempting on the server even if client-side validation is bypassed.
- **Persistence (Lines 301-325)**: Inserts attempt record into `public.test_attempts` and updates user profile gamification (`xp`, `streak`, `rank_badge`).

### 1.7 Genuine KaTeX Math Rendering
- Both portals (`d:\admin dashboard\src\components\KatexRenderer.jsx` and `d:\education portal\src\components\KatexRenderer.jsx`) import real `katex` and `katex/dist/katex.min.css`.
- Render formulas using `katex.renderToString(mathStr, { displayMode, throwOnError: false })` across `$$...$$`, `$..$`, `\(...\)`, `\[...\]`, and standalone LaTeX tokens.

---

## 2. Logic Chain

1. **Premise**: Invariant 1 requires hunting for fake hardcoded passes, mock bypasses, or dummy return facades in `TestCompiler.jsx`, `parse-pdf/route.js`, `CbtEngineClient.jsx`, and `grade/route.js`.
   - **Step 1a**: `TestCompiler.jsx` writes real records to `test_exams`, `exam_questions`, and `question_paper_documents` using Supabase queries. Decoupled exams are saved with `package_id: targetPackageId || null`.
   - **Step 1b**: `parse-pdf/route.js` implements a real multimodal Gemini AI model cascade with end-of-PDF answer key matrix parsing (`bindAnswerKeysToQuestions`), diagram bounding box extraction, and a deterministic regex fallback engine. Empty inputs return 0 questions with warnings, never mock data.
   - **Step 1c**: `CbtEngineClient.jsx` uses IndexedDB persistence, format-specific inputs (`VirtualNumpad`, `MatrixMatchGrid`), and enforces JEE Section B rules (`secBAnsweredCount >= 5` blocks further answers and displays `SectionAttemptLimitModal`).
   - **Step 1d**: `grade/route.js` authenticates the student session, queries the DB, grades MCQ, MSQ, Numerical, and Matrix matching, enforces the Section B 5-attempt cap server-side, and writes attempts to `test_attempts`.
   - **Inference**: All 4 target modules use genuine business logic and database operations with zero dummy facades or mock bypasses.

2. **Premise**: Invariant 2 requires verifying migration 17 in both portals.
   - **Step 2a**: Files in `d:\education portal\supabase\migrations\17_...` and `d:\admin dashboard\supabase\migrations\17_...` are identical (794 lines, 32,098 bytes).
   - **Step 2b**: `test_exams.package_id` is made nullable with `ON DELETE SET NULL`.
   - **Step 2c**: `question_paper_documents` table exists with RLS enabled, public read policy, and staff management policy.
   - **Step 2d**: `question-papers` storage bucket is configured with public read and authenticated write/update/delete policies.
   - **Inference**: Migration 17 satisfies all schema, RLS, and storage requirements in both portals.

3. **Premise**: Invariant 3 requires verifying zero references to "Free Material" across admin navigation and menus.
   - **Step 3a**: `AdminLayoutShell.jsx` replaced "Test Packages" with "Test Portal" (`/admin/test-series`).
   - **Step 3b**: `CommandPalette.jsx` references "Test Portal" (`/admin/test-series`).
   - **Step 3c**: `TestPortalTabs.jsx` provides a clean 2-Tab interface (`All Tests` vs `PDF Question Papers`).
   - **Step 3d**: Filesystem search reveals zero files containing "free" or "material" in admin navigation.
   - **Inference**: "Free Material" is completely absent from all admin navigation and menus.

4. **Premise**: Invariant 4 requires verifying genuine KaTeX math rendering and genuine Supabase DB queries.
   - **Step 4a**: `KatexRenderer.jsx` in both portals imports the official `katex` package and stylesheet, converting LaTeX expressions into HTML using `katex.renderToString()`.
   - **Step 4b**: Client and server queries in both portals use genuine Supabase clients (`@/utils/supabase/client` and `@/utils/supabase/server`).
   - **Inference**: Math rendering and DB queries are genuine.

---

## 3. Caveats

- **External Gemini API Quota**: When calling `/api/admin/ai/parse-pdf` in production without a configured `GEMINI_API_KEY`, the route falls back to deterministic regex parsing rather than AI vision; this is an intentional offline-resilient architecture, not a mock.
- **Interactive CLI Permission**: Direct terminal command execution was restricted by an interactive permission timeout in this session; verification was therefore conducted through exhaustive static code inspection, AST tracing, regex matching, and migration parity analysis.

---

## 4. Conclusion

All four verification invariants are fully satisfied:
1. Zero fake hardcoded passes, mock bypasses, or dummy facades exist in `TestCompiler.jsx`, `parse-pdf/route.js`, `CbtEngineClient.jsx`, or `grade/route.js`.
2. Migration 17 is identical and fully specified across both portals (`package_id` nullable, `question_paper_documents` table with RLS, `question-papers` storage bucket with RLS).
3. Zero references to "Free Material" exist anywhere in the admin navigation, menus, or command palette.
4. Genuine KaTeX math rendering and genuine Supabase DB operations are implemented throughout both applications.

**Explicit Verdict: `APPROVE`**

---

## 5. Verification Method

To independently verify this report:

1. **Verify Migration 17 Parity**:
   Compare the migration files across both portals:
   - `d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql`
   - `d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql`
   Ensure `ALTER COLUMN package_id DROP NOT NULL`, `CREATE TABLE IF NOT EXISTS public.question_paper_documents`, and `INSERT INTO storage.buckets ... ('question-papers')` are present.

2. **Verify Admin Navigation & No "Free Material"**:
   Inspect `d:\admin dashboard\src\components\AdminLayoutShell.jsx` (lines 33-36) and `d:\admin dashboard\src\components\CommandPalette.jsx` (lines 74-79) to confirm "Test Portal" is configured and "Free Material" is absent.

3. **Verify Anti-Mock Implementations**:
   - In `d:\admin dashboard\src\components\TestCompiler.jsx`: inspect `handleSaveAndPublishExam` (lines 739-858) for database writes to `test_exams`, `exam_questions`, and `question_paper_documents`.
   - In `d:\admin dashboard\src\app\api\admin\ai\parse-pdf\route.js`: inspect model cascade (lines 306-347) and answer key binding (lines 380-386).
   - In `d:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx`: inspect Section B attempt cap `checkSectionBLimit` (lines 458-464).
   - In `d:\education portal\src\app\api\test-series\grade\route.js`: inspect multi-format evaluation (lines 96-285) and Section B cap (lines 130-141).
   - In `KatexRenderer.jsx` (both portals): inspect `katex.renderToString` calls.
