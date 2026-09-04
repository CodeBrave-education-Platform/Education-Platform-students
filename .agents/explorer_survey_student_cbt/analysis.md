# Comprehensive Survey & Architectural Analysis: Student Portal CBT Engine & Discovery

**Workspace Directory**: `d:\education portal`  
**Subagent**: `explorer_survey_student_cbt`  
**Target Milestone**: Classplus-grade Assessment Suite & Standalone NTA CBT Engine  
**Date**: 2026-09-04  

---

## Executive Summary

This survey provides an exhaustive technical investigation of the Student Portal test series discovery (`/test-series/page.js`, `TestSeriesHubClient.jsx`) and the student computer-based testing (CBT) engine (`/test-series/engine/[examId]/page.js`, `CbtEngineClient.jsx`, `/api/test-series/grade/route.js`).

### Critical Architectural Flaws Identified in Existing Codebase
1. **Coupled Package Gatekeeping**: All mock exams in `TestSeriesHubClient.jsx` are hard-bound inside accordion items under `test_packages`. Standalone exams with `package_id = null` (mandated by R1) are completely invisible to students.
2. **Missing Subject Tabs & Section Pills in CBT Workspace**: In `CbtEngineClient.jsx`, Subject tabs exist solely inside the Question Palette sidebar/bottom-sheet. The main testing viewport lacks top-level Subject Tabs (`[Physics]`, `[Chemistry]`, `[Mathematics]`) and Sub-Section Pills (`[Section A: MCQs]`, `[Section B: Numerical]`).
3. **Zero Support for Matrix Matching (`matrix_match`)**: The student engine has no matrix grid component. Matrix matching questions either crash or degrade into single-choice radio buttons. The grading engine (`/api/test-series/grade/route.js`) completely lacks matrix evaluation logic.
4. **MSQ Detection Bug**: In `engine/[examId]/page.js`, the check `rawFormat.includes('MULTIPLE')` fails for standard `multi_mcq` formats from the Question Bank (`'multi_mcq'.toUpperCase().includes('MULTIPLE') === false`), causing multi-select questions to revert to single-choice MCQs.
5. **Absence of Section B Attempt Rules**: Neither `CbtEngineClient.jsx` nor `grade/route.js` enforces the JEE Main Section B limit (attempt any 5 of 10). Students can answer all 10 questions without warning or restriction.
6. **Diagrams Missing in Question Paper View & Lightbox**: While basic diagrams render inline on question cards, they lack click-to-zoom (crucial for circuit diagrams, coordinate geometry, and organic mechanisms) and are completely omitted from the "Question Paper" view modal.

---

## Part 1: Student Portal Discovery (`/test-series/page.js` & `TestSeriesHubClient.jsx`)

### 1.1 Current Implementation Analysis

#### `d:\education portal\src\app\test-series\page.js`
- **Lines 28–47**: Fetches packages from `public.test_packages` where `is_active = true`.
- **Lines 49–66**: Fetches exams from `public.test_exams` selecting only:
  ```javascript
  .select('id, package_id, title, duration_minutes, total_questions, is_live_ranking, activation_timestamp, marks_scheme')
  ```
  **Gaps**:
  - Does NOT select `blueprint_type` or `sections_config` (columns created in R1 migration).
  - Does NOT select `is_active` or subject tags.
- **Lines 68–84**: Queries invoices for package purchases.
- **Lines 86–99**: Queries student's previous `test_attempts`.

#### `d:\education portal\src\app\test-series\TestSeriesHubClient.jsx`
- **Lines 147–158**: Filters `packages` based on `activeTag` and `searchQuery`.
- **Lines 254–660**: The render loop operates exclusively on `filteredPackages.map(pkg => ...)`:
  ```javascript
  const pkgExams = exams.filter(e => e.package_id === pkg.id)
  ```
  Inside each package card, exams are hidden inside an accordion trigger:
  `Exam Blueprint Roster (${pkgExams.length} Multi-Format Papers)`.

### 1.2 Identified Flaws & Incompatibilities
1. **Orphaned Standalone Exams**: If `exam.package_id` is `null` (as created by the new compiler or PDF compiler), `exams.filter(e => e.package_id === pkg.id)` never evaluates to true. The test cannot be found or attempted anywhere in the portal.
2. **Hidden Behind Accordion Clicks**: Even for package-linked tests, students must click to expand an accordion row to find the "Launch CBT" button.
3. **"Free Material" & Package Paywalls**: If a package has `price_ledger.status === 'premium'`, exams inside it show `[Locked]` unless purchased via Razorpay, directly violating R5's requirement:
   > *"Update `/test-series/page.js` to list all active standalone mock tests directly with subject/exam filters, letting students click 'Attempt Test' without navigating through packages with zero 'Free Material' and no mandatory 'Test Packages'."*

### 1.3 Recommended Architectural Overhaul for Discovery

#### Step A: Upgrade Server Query in `page.js`
Update `test_exams` query to select all required blueprint fields and include standalone mock tests:
```javascript
const { data: dbExams } = await supabase
  .from('test_exams')
  .select(`
    id,
    package_id,
    title,
    duration_minutes,
    total_questions,
    is_live_ranking,
    activation_timestamp,
    marks_scheme,
    blueprint_type,
    sections_config,
    created_at
  `)
  .order('activation_timestamp', { ascending: false })
```

#### Step B: Standalone Mock Tests Catalog UI in `TestSeriesHubClient.jsx`
Replace the package-gated view with a **Dual-Mode or Primary Test Catalog Grid**:
1. **Filter Toolbar**:
   - **Exam Blueprint Filter**: `[All Tests]` | `[JEE Main]` | `[JEE Advanced]` | `[NEET]` | `[Chapter Drills]`
   - **Subject Filter**: `[All Subjects]` | `[Physics]` | `[Chemistry]` | `[Mathematics]` | `[Biology]`
   - **Status Filter**: `[All]` | `[Unattempted]` | `[Completed]`
   - **Instant Search Input**: Matches test titles, blueprint types, or topics.
2. **Standalone Test Cards**:
   - **Header Badges**: Blueprint Pill (`JEE MAIN 2026`), Live Ranking Pill (`LIVE RANKING`), Subject Tags (`PCM Mock`).
   - **Title**: Clean typography (`font-black text-slate-900`).
   - **Exam Spec Chips**: Duration (`180 Mins`), Questions (`75 Questions`), Max Marks (`300 Marks`).
   - **Structure Preview**: `Sec A: 20 MCQs (+4/-1) • Sec B: 10 NAT (+4/0, Max 5)`.
   - **Direct Actions**:
     - **Not Attempted**: Direct green/teal `[Launch CBT Exam]` button -> Navigates to `/test-series/engine/${exam.id}` with NO package purchase required.
     - **Attempted**: `[View Scorecard]` -> Navigates to `/test-series/analytics/${attempt.id}`, plus `[Retake]` button -> `/test-series/engine/${exam.id}?reset=true`.

---

## Part 2: Student CBT Exam Taking Engine (`/engine/[examId]`)

### 2.1 Current File Survey

#### `d:\education portal\src\app\test-series\engine\[examId]\page.js`
- **Lines 40–59**: Premium Authorization Guard:
  ```javascript
  const isPremium = exam.test_packages?.price_ledger?.status === 'premium'
  if (isPremium && !exam.is_live_ranking) { ... redirect('/test-series') }
  ```
  *Flaw*: If `exam.package_id` is null, `exam.test_packages` is null, which avoids the redirect, but if a test is linked to a package, it blocks students. Standalone tests must be accessible immediately.
- **Lines 80–84 & 117–121**: Question Format Normalization:
  ```javascript
  let rawFormat = (q.format_type || q.type || 'MCQ').toUpperCase()
  if (rawFormat.includes('SINGLE') || rawFormat.includes('MCQ')) rawFormat = 'MCQ'
  else if (rawFormat.includes('MULTIPLE') || rawFormat.includes('MSQ')) rawFormat = 'MSQ'
  else if (rawFormat.includes('NUM')) rawFormat = 'NUMERICAL'
  ```
  *Bugs*:
  1. If `q.format_type` is `'multi_mcq'`, `rawFormat` is `'MULTI_MCQ'`. `'MULTI_MCQ'.includes('MULTIPLE')` is `false`! It does not get mapped to `'MSQ'`.
  2. Matrix match questions (`format_type = 'matrix_match'`) are not handled at all and stay `'MATRIX_MATCH'`, which fallback to single MCQ in `CbtEngineClient.jsx`.
- **Lines 141–150**: Exam payload sanitization:
  ```javascript
  const sanitizedExam = {
    id: exam.id,
    package_id: exam.package_id,
    title: exam.title,
    duration_minutes: Number(exam.duration_minutes) || 180,
    total_questions: Number(exam.total_questions) || (questions.length || 75),
    marks_scheme: exam.marks_scheme || { positive_marks: 4, negative_marks: -1 },
    is_live_ranking: !!exam.is_live_ranking,
    questions: questions
  }
  ```
  *Omission*: Does NOT include `blueprint_type` or `sections_config`!

#### `d:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx`
- **Lines 41–47**: `subjectsList = ['All', ...subs]`.
- **Lines 349–361**:
  ```javascript
  const isNumerical = currentQuestion?.format === 'NUMERICAL' || ...
  const isMsq = currentQuestion?.format === 'MSQ' || ...
  ```
  *Omission*: Zero detection for Matrix Matching.
- **Lines 597–731**: Header contains test title, question index `Q X/Y`, countdown timer, sync status, and tools menu.
  *Omission*: No Subject Tabs or Section Pills in this header or the workspace below.
- **Lines 734–911**: Question viewport:
  - Top info bar has `Question X of Y • Subject` and format badge.
  - Question text rendered with `<KatexRenderer content={questionPrompt} />`.
  - Diagram rendered via `next/image` with `fill` in `h-56 sm:h-72` box.
  - Option render branch:
    - Numerical: Input field + 14-button on-screen keypad.
    - MSQ: Checkbox list.
    - Single MCQ: Radio button list.
- **Lines 914–1002**: Desktop NTA Palette Sidebar (only visible on `>= 1024px` displays).
- **Lines 1007–1063**: Sticky bottom action bar (Review, Clear, Previous, Next).
- **Lines 1066–1214**: Mobile Swipeable Bottom Sheet Palette (on `< 1024px`).
- **Lines 1217–1388**: Modals: Scientific Calculator, Scratchpad, Question Paper.

---

## Part 3: Detailed Implementation Architecture for New Features

### 3.1 Subject Tabs & Section Pills Matching Exam Blueprint

#### Architectural Layout
Below the sticky top header, render an **Exam Navigation Strip**:
```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Physics (18/25)]           [Chemistry (12/25)]             [Mathematics (5/25)]            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  ● Section A: MCQs (15/20)    │    ● Section B: Numerical (3/5 answered) [Max 5 Attempts]  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### State & Logic Specifications
1. **Deriving Active Subjects**:
   ```javascript
   const subjects = useMemo(() => {
     const set = new Set()
     questions.forEach(q => { if (q.subject) set.add(q.subject) })
     return set.size > 0 ? Array.from(set) : ['Physics', 'Chemistry', 'Mathematics']
   }, [questions])
   ```
2. **Deriving Active Sections for Current Subject**:
   ```javascript
   const currentSubject = currentQuestion?.subject || subjects[0]
   const currentSection = currentQuestion?.section || 'Section A'

   const sectionsInSubject = useMemo(() => {
     const secs = new Set()
     questions.filter(q => q.subject === currentSubject).forEach(q => {
       secs.add(q.section || 'Section A')
     })
     return Array.from(secs)
   }, [questions, currentSubject])
   ```
3. **Tab Switching Handlers**:
   - **Click Subject Tab**: Find the first question index where `q.subject === clickedSubject` (or first question in Section A of that subject), and update `setCurrentIdx(foundIdx)`.
   - **Click Section Pill**: Find the first question index where `q.subject === currentSubject && q.section === clickedSection`, and update `setCurrentIdx(foundIdx)`.
4. **Subject Answer Progress Counters**:
   For each subject tab, compute `answeredCount / totalQuestionsInSubject`.

---

### 3.2 Format-Specific Inputs

#### 1. Integer / Numerical Input (`format === 'NUMERICAL'`)
- **Visual Display**: Monospace digital readout box showing current integer/decimal value.
- **Virtual On-Screen Numpad**:
  Layout:
  ```
  [ 7 ] [ 8 ] [ 9 ] [ ⌫ Backspace ]
  [ 4 ] [ 5 ] [ 6 ] [ +/- Sign     ]
  [ 1 ] [ 2 ] [ 3 ] [ . Decimal    ]
  [   0   ] [ Clear Input ]
  ```
- **Constraint Enforcement**: Direct check against Section B attempt limit before applying any keystroke (see Section 3.3).
- **Physical Keyboard Sync**: Filter out non-numeric characters on `onKeyDown` (allow digits 0-9, minus `-`, dot `.`, backspace, delete).

#### 2. Clickable Matrix Grid (`format === 'MATRIX_MATCH'`)
Matrix matching questions in JEE Advanced match Column I (`A, B, C, D`) with Column II (`P, Q, R, S` or `P, Q, R, S, T`).

- **Data Representation**:
  ```javascript
  // Question definition
  {
    format: 'MATRIX_MATCH',
    format_type: 'matrix_match',
    content: "Match List I with List II: ...",
    matrix_rows: ['(A) Simple Harmonic Motion', '(B) Uniform Circular Motion', '(C) Damped Oscillation', '(D) Resonance'],
    matrix_cols: ['(P) Constant Energy', '(Q) Decreasing Amplitude', '(R) Frequency Matching', '(S) Periodic Motion']
  }
  ```
  *(Note: If `matrix_rows` / `matrix_cols` are passed via `options`, e.g. `options = { rows: [...], cols: [...] }` or parsed from markdown, handle both structures gracefully).*

- **Student Answer State**:
  ```javascript
  answers[questionId] = {
    format: 'MATRIX_MATCH',
    matrix: {
      'A': ['P', 'S'],
      'B': ['P', 'S'],
      'C': ['Q', 'S'],
      'D': ['R']
    },
    seconds_spent: 120
  }
  ```

- **Interactive UI Matrix Grid**:
  Render a clean, touch-friendly grid:
  ```
  Row \ Col    (P)      (Q)      (R)      (S)     Action
     A         [○]      [●]      [○]      [●]     [Clear A]
     B         [●]      [○]      [○]      [●]     [Clear B]
     C         [○]      [●]      [○]      [○]     [Clear C]
     D         [○]      [○]      [●]      [○]     [Clear D]
  ```
  - Clicking any bubble `(rowKey, colKey)` toggles that specific match.
  - Active bubbles are styled with `bg-teal-600 text-white shadow-sm ring-2 ring-teal-600`.
  - Provide individual "Clear Row" buttons and an overall "Clear All Matches" button.

#### 3. Checkboxes for MSQs (`format === 'MSQ'`)
- **Visual Distinction**:
  - Explicit square checkboxes with `<CheckSquare />` (checked) and `<Square />` (unchecked).
  - Prominent banner:
    ```
    ┌────────────────────────────────────────────────────────────────────────┐
    │ ℹ️ Multiple Correct Options: One or more options may be correct.        │
    │ Full Marks: +4 | Partial Marks apply | Negative Marks: -2              │
    └────────────────────────────────────────────────────────────────────────┘
    ```
- **Toggle Handler**:
  ```javascript
  const handleMsqToggle = (optIdx) => {
    // Check Section B attempt rules if applicable
    if (isOverAttemptBlocked()) return

    setAnswers(prev => {
      const prevAns = prev[currentQuestion.id]
      let cur = Array.isArray(prevAns?.selected_options) ? [...prevAns.selected_options] : []
      let next = cur.includes(optIdx) ? cur.filter(i => i !== optIdx) : [...cur, optIdx].sort((a,b)=>a-b)
      
      const updated = { ...prev }
      if (next.length === 0) {
        delete updated[currentQuestion.id]
      } else {
        updated[currentQuestion.id] = {
          selected_options: next,
          format: 'MSQ',
          seconds_spent: (prevAns?.seconds_spent || 0) + 5
        }
      }
      return updated
    })
  }
  ```

---

### 3.3 Section B Attempt Rules (Max 5 of 10)

#### Rule Specifications
In JEE Main:
- Each subject's Section B has 10 numerical questions.
- A student is strictly permitted to attempt a **maximum of 5 questions** per subject in Section B.
- If a candidate has answered 5 questions and attempts to input a response in a 6th question:
  1. The input must be blocked.
  2. A friendly modal/banner must inform the student:
     > *"You have already answered 5 out of 5 questions in Section B of [Subject]. To answer this question, you must first clear your response on one of the previously answered questions in Section B."*
  3. A live attempt counter must be displayed: `"Section B: X / 5 answered"`.

#### Algorithmic Implementation in `CbtEngineClient.jsx`
```javascript
// 1. Calculate Section B answered count for the current subject
const sectionBMetrics = useMemo(() => {
  const isCurrentSecB = (currentQuestion?.section || '').toLowerCase().includes('section b')
  const subjectSecBQuestions = questions.filter(q => 
    q.subject === currentQuestion?.subject && 
    (q.section || '').toLowerCase().includes('section b')
  )
  
  const totalInSecB = subjectSecBQuestions.length
  const maxAllowed = exam.sections_config?.[currentQuestion?.subject]?.['Section B']?.max_attempts ?? 5

  let answeredCount = 0
  subjectSecBQuestions.forEach(q => {
    const ans = answers[q.id]
    const hasAnswer = ans && (
      (ans.selected_option !== undefined && ans.selected_option !== null && ans.selected_option !== '') ||
      (Array.isArray(ans.selected_options) && ans.selected_options.length > 0) ||
      (ans.numerical_value !== undefined && ans.numerical_value !== null && String(ans.numerical_value).trim() !== '') ||
      (ans.matrix && Object.keys(ans.matrix).length > 0)
    )
    if (hasAnswer) answeredCount++
  })

  const isCurrentAnswered = Boolean(answers[currentQuestion?.id])
  const canAttemptMore = answeredCount < maxAllowed || isCurrentAnswered

  return {
    isCurrentSecB,
    totalInSecB,
    answeredCount,
    maxAllowed,
    isCurrentAnswered,
    canAttemptMore
  }
}, [questions, answers, currentQuestion, exam.sections_config])

// 2. Intercept before saving input
const checkSectionBLimit = () => {
  if (sectionBMetrics.isCurrentSecB && !sectionBMetrics.canAttemptMore) {
    setShowSectionBWarningModal(true)
    return false // Block action
  }
  return true
}
```

#### UI Indicators
- **Section Pill Banner**:
  `Section B: 4 / 5 answered` (Badge: emerald/teal when `< 5`, amber/indigo when `== 5`).
- **Over-Attempt Warning Modal**:
  - Modal title: `Section B Attempt Limit Reached (5/5)`
  - Body: *"According to the JEE Main exam blueprint, you may only submit answers for up to 5 questions in Section B. Please clear an existing response if you wish to answer Question [X]."*
  - Actions: `[Got It / Stay Here]` and `[Go to Answered Section B Questions]`.

---

### 3.4 Diagram Rendering & Click-to-Zoom Lightbox

#### Existing Implementation Check
In `CbtEngineClient.jsx` (lines 773–782):
```javascript
{(currentQuestion?.diagram_url || currentQuestion?.diagramUrl) && (
  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl max-w-xl mx-auto relative h-56 sm:h-72 w-full overflow-hidden">
    <Image 
      src={currentQuestion.diagram_url || currentQuestion.diagramUrl} 
      alt="Question Diagram" 
      fill
      className="object-contain rounded-xl max-w-full h-auto" 
    />
  </div>
)}
```

#### Deficiencies & Improvements
1. **Lack of Zoom/Magnification**: Diagrams of electrical circuits, organic reaction schemes, and geometry often have fine details illegible in a 200px container on mobile.
2. **Missing in Question Paper Modal**: When students open the "Question Paper View", diagrams are omitted.
3. **Markdown Embedded Images**: Questions that embed diagrams via markdown `![Diagram](url)` are handled by `KatexRenderer.jsx`, but standalone `diagram_url` properties need consistent visual styling and zoom support.
4. **Implementation Plan**:
   - Add a clickable zoom button (`<Maximize2 />`) on the diagram.
   - Clicking opens a fullscreen **Diagram Lightbox Modal** with pan/zoom (100%, 150%, 200%) and close button (`<X />`).
   - Add diagram rendering to the Question Paper Modal (`showQuestionPaper`).

---

### 3.5 Server-Side Grading Engine Updates (`/api/test-series/grade/route.js`)

To ensure full compliance, the grading API route must evaluate Matrix Matching and enforce Section B limits:

#### 1. Matrix Match Evaluation Logic
```javascript
if (q.format === 'MATRIX_MATCH' || q.format_type === 'matrix_match') {
  const submittedMatrix = ans.matrix || {}
  // correct_answer can be stored as JSON object: { "A": ["P", "R"], "B": ["Q"], ... }
  let targetMatrix = {}
  try {
    targetMatrix = typeof q.correct_answer === 'string' ? JSON.parse(q.correct_answer) : (q.correct_answer || {})
  } catch {
    targetMatrix = {}
  }

  let rowMatches = 0
  const rows = ['A', 'B', 'C', 'D']
  rows.forEach(r => {
    const subRow = (submittedMatrix[r] || []).map(String).sort()
    const targetRow = (targetMatrix[r] || []).map(String).sort()
    if (subRow.length > 0 && subRow.length === targetRow.length && subRow.every((val, i) => val === targetRow[i])) {
      rowMatches++
    }
  })

  if (rowMatches === rows.length) {
    correct++
    rawScore += qPosMarks
  } else if (rowMatches > 0) {
    // Partial marking: +1 per correct row
    rawScore += rowMatches * 1
  } else {
    incorrect++
    rawScore += qNegMarks
  }
}
```

#### 2. Section B Cap Enforcement in Grading
If an edge-case client submission contains more than 5 answers in Section B of a subject, the grading engine must evaluate strictly the first 5 answered questions (ordered by `order_index`), marking any subsequent answers as uncounted/unattempted.

---

## Part 4: Step-by-Step Implementation Roadmap

| Step | Target File | Core Modifications |
|---|---|---|
| **1** | `src/app/test-series/page.js` | Update `test_exams` query to select `blueprint_type`, `sections_config`, and support standalone mock tests (`package_id IS NULL`). Remove invoice blockers for standalone tests. |
| **2** | `src/app/test-series/TestSeriesHubClient.jsx` | Overhaul the discovery hub with a dedicated **Standalone Mock Test Catalog**. Add Blueprint, Subject, and Status filters. Render prominent Test Cards with 1-click `[Launch CBT Exam]` buttons. Remove "Free Material" tags and package purchase requirements. |
| **3** | `src/app/test-series/engine/[examId]/page.js` | Allow direct access for standalone exams. Fix question format normalization (ensure `multi_mcq` -> `MSQ`, `matrix_match` -> `MATRIX_MATCH`). Forward `blueprint_type` and `sections_config` in `sanitizedExam`. |
| **4** | `src/app/test-series/engine/[examId]/CbtEngineClient.jsx` | 1. Implement top Subject Tabs (`Physics`, `Chemistry`, `Maths`) and Sub-Section Pills (`Section A`, `Section B`) in the main workspace.<br>2. Add interactive 4x4 Matrix Grid for `MATRIX_MATCH` questions.<br>3. Add Section B attempt limit logic with live `"Section B: X / 5 answered"` counter and over-attempt prevention modal.<br>4. Add Diagram Lightbox zoom and integrate diagrams into Question Paper Modal. |
| **5** | `src/app/api/test-series/grade/route.js` | Add server-side Matrix Match evaluation and enforce Section B attempt rules during score calculation. |

---

## Part 5: Independent Verification Protocol

1. **Standalone Test Discovery Verification**:
   - Inspect `/test-series` in the browser.
   - Verify that standalone tests with `package_id = null` appear directly in the grid without needing to expand any package.
   - Verify that clicking "Launch CBT" opens the exam immediately without any payment or login loop.
2. **Subject Tabs & Section Pills Verification**:
   - Launch an exam with multi-subject questions (PCM).
   - Confirm Subject Tabs switch subjects immediately and highlight active subject with progress count.
   - Confirm Section Pills reflect Section A vs Section B.
3. **Format-Specific Input Verification**:
   - **Numerical**: Test virtual numpad keys (`7, 8, 9, +/-, Backspace, Clear`). Confirm numbers update seamlessly.
   - **Matrix Match**: Verify 4x4 interactive grid toggles bubbles `(A->P, A->S)`.
   - **MSQ**: Verify multi-select checkboxes allow toggling multiple options.
4. **Section B Rule Verification**:
   - Navigate to Section B questions.
   - Answer 5 questions. Verify counter reads `"Section B: 5 / 5 answered"`.
   - Attempt to answer the 6th question. Verify input is blocked and friendly alert modal is triggered.
   - Clear one answer; verify answering is unblocked and counter reverts to `4 / 5`.
5. **Diagram Lightbox Verification**:
   - Open a question with a diagram. Click the diagram or zoom icon; confirm fullscreen high-res lightbox opens.
