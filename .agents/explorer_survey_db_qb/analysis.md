# Centralized Question Bank & Database Migration Architecture Report
**Generated**: 2026-08-20  
**Author**: Database & Question Bank Schema Explorer  
**Target Systems**: Asentra Student Portal (`D:\education portal`) & Admin Dashboard (`D:\admin dashboard`)

---

## 1. Executive Summary

A comprehensive architectural audit was conducted across the database schema, Supabase SQL migrations, Next.js API routes, and UI components in both the Student Portal and Admin Dashboard.

### Core Problems Identified:
1. **Three-Way Question Storage Fragmentation**:
   - **`test_exams.questions` (JSONB)**: Test papers store their full MCQ list as a serialized JSON array inside the `test_exams` table.
   - **`test_questions` (SQL Table)**: Standalone table serving as a question pool for the Test Series Compiler, but disconnected from `test_exams` once compiled (no junction table).
   - **`questions` (SQL Table)**: Table originally designed for Course LMS Assessments (`assessments` table) and also queried directly by the Admin Question Bank UI (`/admin/questions`).
2. **Loss of Centralized Synchronization**:
   - Because `test_exams` stores a static JSON snapshot of questions at compilation time, updates made to a question in the bank do **NOT** propagate to existing exams referencing that question.
3. **Database Telemetry & Live Data State**:
   - Live Supabase instance audit confirmed:
     - `test_packages`: 1 package
     - `test_exams`: 2 exams containing embedded question JSON arrays
     - `test_questions`: 3 pool rows
     - `test_attempts`: 66 completed student attempts with answers keyed by UUIDs
     - `questions`: 0 rows
     - `assessments`: 1 assessment
     - `exam_questions`: Does **not** exist yet (`PGRST205`)
4. **Historical Attempt Integrity**:
   - All 66 existing student attempts in `test_attempts` store `answers_payload` mapping question IDs (`b0000000-...`, `6498384f-...`, `673439fb-...`) to student choices. A zero-loss migration **must preserve every existing question UUID** to prevent scorecard corruption.

---

## 2. Forensic Codebase Audit: Where Questions are Read, Created, Updated, and Graded

### 2.1 Database Tables & Migration History

| Migration File | Tables Created / Altered | How Questions are Stored |
|---|---|---|
| `07_jee_pipeline.sql` | `assessments`, `questions`, `assessment_attempts`, `student_questions` view | Stored in `public.questions` with `assessment_id UUID REFERENCES assessments(id)`. Blind view `student_questions` drops `correct_option_index`. |
| `14_test_series.sql` / `20260530140000_14_test_series.sql` | `test_packages`, `test_exams`, `test_questions`, `test_attempts` | `test_exams` creates column `questions JSONB NOT NULL DEFAULT '[]'::jsonb`. `test_questions` creates standalone pool table. |
| `14_schema_integrity_and_qa_patch.sql` / `supabase_schema_migration.sql` | `questions`, `test_questions`, `test_exams` | Made `questions.assessment_id` nullable, added format types, explanation, and diagram URLs. |

---

### 2.2 Question Operations in Admin Dashboard (`D:\admin dashboard`)

1. **Question Bank Authoring (`src/app/admin/questions/QuestionBankClient.jsx`)**:
   - **Read**: `supabase.from('questions').select('*').order('created_at', { ascending: false })`
   - **Create**: `supabase.from('questions').insert([payload])`
   - **Update**: `supabase.from('questions').update(newQ).eq('id', editingQuestion.id)`
   - **Delete**: `supabase.from('questions').delete().eq('id', id)`
   - **AI Bulk Ingest**: Ingests parsed questions into `questions` table.

2. **CBT Exam Compiler Studio (`src/components/test-series/tabs/ExamCompilerTab.jsx` & `CompilerClient.jsx`)**:
   - **Pool Read**: `supabase.from('test_questions').select('*')`
   - **New Question Insert**: `supabase.from('test_questions').insert([payload])`
   - **Exam Paper Compilation**: Injects `selectedQuestions` as a JSONB array into `test_exams.questions`.
   - **Flaw**: Once compiled, editing a question in `test_questions` does not update the exam because `test_exams.questions` is a static snapshot.

3. **LMS Course Assessment Authoring (`src/components/CourseManageClient.jsx`)**:
   - **Assessment Questions**: Inserted into `questions` with `assessment_id = assessment.id`.

4. **AI PDF Multimodal Parser (`src/app/api/admin/ai/parse-pdf/route.js` & `parse-pdf-page/route.js`)**:
   - Parses uploaded test PDF or pasted text via Gemini AI (`@google/genai`) or deterministic regex.
   - Extracts structured questions with KaTeX LaTeX math, diagrams, options, and explanation.

---

### 2.3 Question Operations in Student Portal (`D:\education portal`)

1. **CBT Engine Exam Loader (`src/app/test-series/engine/[examId]/page.js`)**:
   - Fetches `test_exams` row: `.from('test_exams').select('*, test_packages(price_ledger)').eq('id', examId).single()`
   - Parses `exam.questions` (JSONB).
   - **Security Strip**: Deletes `correct_option_index`, `correctAnswer`, and `solution_explanation` before sending to `CbtEngineClient`.

2. **CBT Exam Client UI (`src/app/test-series/engine/[examId]/CbtEngineClient.jsx`)**:
   - Renders current question with `KatexRenderer`, image diagram, options, palette navigation, and timer.
   - Supports offline exam state caching in IndexedDB.
   - On submission, POSTs answers to `/api/test-series/grade`.

3. **Server-Authoritative Blind Grading Engine (`src/app/api/test-series/grade/route.js`)**:
   - Re-fetches authoritative `test_exams.questions` and `marks_scheme` on the server.
   - Iterates through questions: compares `answers[q.id].selected_option === q.correct_option_index`.
   - Computes total marks, positive/negative penalty, XP, streaks, and inserts scorecard into `test_attempts`.

4. **Analytics & Solutions Review (`src/app/test-series/analytics/[attemptId]/page.js`)**:
   - Fetches `test_attempts` joined with `test_exams(*)`.
   - Compares `attempt.answers_payload[q.id]` with `exam.questions[q.id].correct_option_index`.
   - Renders step-by-step KaTeX explanations and subject-wise accuracy breakdown.

5. **LMS Course Assessment Engine (`src/app/learn/[courseId]/exams/[assessmentId]/actions.js` & `page.jsx`)**:
   - Renders questions via `student_questions` view.
   - Grades server-side against `public.questions` table.

---

## 3. Centralized Question Bank Architecture & Schema Design

To eliminate redundancy and guarantee immediate propagation, we unify all questions into a single canonical **`question_bank`** table and link them to exams and assessments via clean relational junction tables.

```
                  ┌─────────────────────────────────────┐
                  │        public.question_bank         │
                  │  (Single Source of Truth for MCQs)  │
                  └──────────────────┬──────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌───────────────────────────┐           ┌───────────────────────────┐
    │   public.exam_questions   │           │public.assessment_questions│
    │      (Junction Table)     │           │      (Junction Table)     │
    └────────────┬──────────────┘           └────────────┬──────────────┘
                 ▼                                       ▼
    ┌───────────────────────────┐           ┌───────────────────────────┐
    │     public.test_exams     │           │    public.assessments     │
    │   (CBT Test Series Paper) │           │  (LMS Course Assessment)  │
    └───────────────────────────┘           └───────────────────────────┘
```

---

### 3.1 DDL Schema Specification

```sql
-- ============================================================================
-- 1. CANONICAL QUESTION BANK TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,                          -- Markdown + KaTeX LaTeX ($...$, $$...$$)
    format_type TEXT NOT NULL DEFAULT 'single_mcq'  -- single_mcq, multi_mcq, numerical, assertion_reason, matrix_match, blanks
        CHECK (format_type IN ('single_mcq', 'multi_mcq', 'numerical', 'assertion_reason', 'matrix_match', 'blanks')),
    subject TEXT NOT NULL                           -- Physics, Chemistry, Mathematics, Biology, Computer Science, General
        CHECK (subject IN ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'General')),
    topic TEXT NOT NULL DEFAULT 'General',          -- Main chapter/module
    sub_topic TEXT DEFAULT 'General',               -- Specific micro-concept
    difficulty TEXT NOT NULL DEFAULT 'MEDIUM'       -- EASY, MEDIUM, HARD
        CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'easy', 'medium', 'hard')),
    section TEXT DEFAULT 'Section A',               -- Section A, Section B
    options JSONB NOT NULL DEFAULT '[]'::jsonb,     -- ["Option A", "Option B", "Option C", "Option D"]
    correct_option_index INT DEFAULT 0,             -- 0-based index for single choice
    correct_answer TEXT,                            -- Exact answer string or numerical value
    explanation TEXT,                               -- Step-by-step KaTeX derivation/solution
    diagram_url TEXT,                               -- URL of diagram/image attachment
    marks_positive NUMERIC NOT NULL DEFAULT 4,      -- Standard positive marks
    marks_negative NUMERIC NOT NULL DEFAULT -1,     -- Negative penalty marks
    tags TEXT[] DEFAULT '{}',                       -- e.g. ARRAY['JEE Main', '2025', 'PYQ', 'NTA']
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    times_tested INT NOT NULL DEFAULT 0,
    times_correct INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. TEST EXAM QUESTION JUNCTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.test_exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 1,
    section TEXT DEFAULT 'Section A',
    marks_positive NUMERIC,                         -- Nullable override per exam
    marks_negative NUMERIC,                         -- Nullable override per exam
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exam_question UNIQUE (exam_id, question_id)
);

-- ============================================================================
-- 3. LMS COURSE ASSESSMENT QUESTION JUNCTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 1,
    marks_positive NUMERIC DEFAULT 4,
    marks_negative NUMERIC DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_assessment_question UNIQUE (assessment_id, question_id)
);

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_qb_subject_difficulty ON public.question_bank(subject, difficulty);
CREATE INDEX IF NOT EXISTS idx_qb_topic ON public.question_bank(topic, sub_topic);
CREATE INDEX IF NOT EXISTS idx_qb_created_at ON public.question_bank(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qb_tags ON public.question_bank USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON public.exam_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON public.assessment_questions(assessment_id, order_index);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_question_id ON public.assessment_questions(question_id);
```

---

## 4. Zero-Loss Data Migration Strategy

To guarantee that **not a single existing question or attempt record is lost**, the migration executes in strict dependency order:

```sql
-- ============================================================================
-- ZERO-LOSS EXTRACTION & UPSERT SCRIPT
-- ============================================================================

-- Step A: Ingest all standalone test_questions into question_bank
INSERT INTO public.question_bank (
    id, content, format_type, subject, topic, sub_topic, difficulty,
    section, options, correct_option_index, correct_answer, explanation,
    diagram_url, marks_positive, marks_negative, created_at
)
SELECT 
    tq.id,
    COALESCE(tq.content, 'Untitled Question'),
    COALESCE(tq.question_type, 'single_mcq'),
    COALESCE(tq.subject, 'Physics'),
    COALESCE(tq.sub_topic, 'General'),
    COALESCE(tq.sub_topic, 'General'),
    UPPER(COALESCE(tq.difficulty, 'MEDIUM')),
    COALESCE(tq.section, 'Section A'),
    COALESCE(tq.options, '[]'::jsonb),
    COALESCE(tq.correct_option_index, 0),
    CASE 
        WHEN jsonb_array_length(COALESCE(tq.options, '[]'::jsonb)) > COALESCE(tq.correct_option_index, 0)
        THEN tq.options->>COALESCE(tq.correct_option_index, 0)
        ELSE ''
    END,
    tq.explanation,
    tq.diagram_url,
    COALESCE(tq.marks_positive, 4),
    COALESCE(tq.marks_negative, -1),
    COALESCE(tq.created_at, now())
FROM public.test_questions tq
ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    options = EXCLUDED.options,
    correct_option_index = EXCLUDED.correct_option_index,
    explanation = EXCLUDED.explanation,
    diagram_url = EXCLUDED.diagram_url;

-- Step B: Ingest all legacy LMS questions into question_bank
INSERT INTO public.question_bank (
    id, content, format_type, subject, topic, sub_topic, difficulty,
    section, options, correct_option_index, correct_answer, explanation,
    diagram_url, marks_positive, marks_negative, created_at
)
SELECT 
    q.id,
    COALESCE(q.content, q.question_text, 'Untitled Question'),
    COALESCE(q.format_type, 'single_mcq'),
    COALESCE(q.subject, 'General'),
    COALESCE(q.topic, q.sub_topic, 'General'),
    COALESCE(q.sub_topic, q.topic, 'General'),
    UPPER(COALESCE(q.difficulty, 'MEDIUM')),
    'Section A',
    COALESCE(q.options, '[]'::jsonb),
    COALESCE(q.correct_option_index, 0),
    COALESCE(q.correct_answer, ''),
    q.explanation,
    COALESCE(q.diagram_url, ''),
    COALESCE(q.marks_positive, 4),
    COALESCE(q.marks_negative, -1),
    COALESCE(q.created_at, now())
FROM public.questions q
WHERE q.content IS NOT NULL OR q.question_text IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Step C: Extract embedded JSON questions from test_exams and link via exam_questions
DO $$
DECLARE
    r_exam RECORD;
    q_elem JSONB;
    q_idx INT;
    q_id UUID;
    q_content TEXT;
    q_subject TEXT;
    q_subtopic TEXT;
    q_diff TEXT;
    q_format TEXT;
    q_options JSONB;
    q_corr_idx INT;
    q_corr_ans TEXT;
    q_expl TEXT;
    q_diag TEXT;
    q_pos NUMERIC;
    q_neg NUMERIC;
    q_section TEXT;
BEGIN
    FOR r_exam IN SELECT id, questions, marks_scheme FROM public.test_exams WHERE questions IS NOT NULL AND jsonb_array_length(questions) > 0 LOOP
        q_idx := 1;
        FOR q_elem IN SELECT * FROM jsonb_array_elements(r_exam.questions) LOOP
            -- Safely extract or generate UUID
            BEGIN
                q_id := (q_elem->>'id')::uuid;
            EXCEPTION WHEN OTHERS THEN
                q_id := gen_random_uuid();
            END;

            q_content := COALESCE(q_elem->>'content', q_elem->>'questionText', q_elem->>'question_text', 'Question');
            q_subject := COALESCE(q_elem->>'subject', 'General');
            q_subtopic := COALESCE(q_elem->>'sub_topic', q_elem->>'topic', 'General');
            q_diff := UPPER(COALESCE(q_elem->>'difficulty', 'MEDIUM'));
            q_format := COALESCE(q_elem->>'formatType', q_elem->>'format_type', q_elem->>'question_type', 'single_mcq');
            q_options := COALESCE(q_elem->'options', '[]'::jsonb);
            q_corr_idx := COALESCE((q_elem->>'correct_option_index')::int, (q_elem->>'correctOptionIndex')::int, 0);
            q_corr_ans := COALESCE(q_elem->>'correct_answer', q_elem->>'correctAnswer', '');
            q_expl := COALESCE(q_elem->>'explanation', q_elem->>'solution_explanation', q_elem->>'solution', '');
            q_diag := COALESCE(q_elem->>'diagram_url', q_elem->>'diagramUrl', '');
            q_pos := COALESCE((q_elem->'marks'->>'positive')::numeric, (q_elem->>'marks_positive')::numeric, (r_exam.marks_scheme->>'positive_marks')::numeric, 4);
            q_neg := COALESCE((q_elem->'marks'->>'negative')::numeric, (q_elem->>'marks_negative')::numeric, (r_exam.marks_scheme->>'negative_marks')::numeric, -1);
            q_section := COALESCE(q_elem->>'section', 'Section A');

            -- Upsert into question_bank
            INSERT INTO public.question_bank (
                id, content, format_type, subject, topic, sub_topic, difficulty,
                section, options, correct_option_index, correct_answer, explanation,
                diagram_url, marks_positive, marks_negative, created_at
            ) VALUES (
                q_id, q_content, q_format, q_subject, q_subtopic, q_subtopic, q_diff,
                q_section, q_options, q_corr_idx, q_corr_ans, q_expl,
                q_diag, q_pos, q_neg, now()
            )
            ON CONFLICT (id) DO UPDATE SET
                content = EXCLUDED.content,
                options = EXCLUDED.options,
                correct_option_index = EXCLUDED.correct_option_index,
                explanation = COALESCE(EXCLUDED.explanation, question_bank.explanation),
                diagram_url = COALESCE(EXCLUDED.diagram_url, question_bank.diagram_url);

            -- Link into exam_questions junction
            INSERT INTO public.exam_questions (
                exam_id, question_id, order_index, section, marks_positive, marks_negative
            ) VALUES (
                r_exam.id, q_id, q_idx, q_section, q_pos, q_neg
            )
            ON CONFLICT (exam_id, question_id) DO UPDATE SET
                order_index = EXCLUDED.order_index,
                section = EXCLUDED.section,
                marks_positive = EXCLUDED.marks_positive,
                marks_negative = EXCLUDED.marks_negative;

            q_idx := q_idx + 1;
        END LOOP;
    END LOOP;
END;
$$;
```

---

## 5. Live Propagation, Student Attempts, and Backward Compatibility

### 5.1 Backward-Compatible Trigger Sync for Legacy Readers
To ensure that existing components reading `test_exams.questions` continue working without breaking before all UI components transition to relational queries, we add an automated trigger:

```sql
-- Function to automatically rebuild test_exams.questions JSON whenever exam_questions changes
CREATE OR REPLACE FUNCTION public.sync_exam_questions_json()
RETURNS TRIGGER AS $$
DECLARE
    target_exam_id UUID;
    compiled_json JSONB;
BEGIN
    target_exam_id := COALESCE(NEW.exam_id, OLD.exam_id);

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', qb.id,
            'content', qb.content,
            'question_text', qb.content,
            'subject', qb.subject,
            'topic', qb.topic,
            'sub_topic', qb.sub_topic,
            'difficulty', qb.difficulty,
            'format_type', qb.format_type,
            'formatType', qb.format_type,
            'section', eq.section,
            'options', qb.options,
            'correct_option_index', qb.correct_option_index,
            'correct_answer', qb.correct_answer,
            'correctAnswer', qb.correct_answer,
            'explanation', qb.explanation,
            'diagram_url', qb.diagram_url,
            'diagramUrl', qb.diagram_url,
            'marks_positive', COALESCE(eq.marks_positive, qb.marks_positive),
            'marks_negative', COALESCE(eq.marks_negative, qb.marks_negative)
        ) ORDER BY eq.order_index ASC
    )
    INTO compiled_json
    FROM public.exam_questions eq
    JOIN public.question_bank qb ON qb.id = eq.question_id
    WHERE eq.exam_id = target_exam_id;

    UPDATE public.test_exams
    SET 
        questions = COALESCE(compiled_json, '[]'::jsonb),
        total_questions = (SELECT count(*) FROM public.exam_questions WHERE exam_id = target_exam_id)
    WHERE id = target_exam_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_exam_questions ON public.exam_questions;
CREATE TRIGGER trg_sync_exam_questions
AFTER INSERT OR UPDATE OR DELETE ON public.exam_questions
FOR EACH ROW EXECUTE FUNCTION public.sync_exam_questions_json();

-- Function to sync question updates to all linked test_exams
CREATE OR REPLACE FUNCTION public.sync_question_bank_update_to_exams()
RETURNS TRIGGER AS $$
DECLARE
    r_linked RECORD;
BEGIN
    FOR r_linked IN SELECT DISTINCT exam_id FROM public.exam_questions WHERE question_id = NEW.id LOOP
        PERFORM public.sync_exam_questions_json_for_exam(r_linked.exam_id);
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5.2 Student Attempt Grading & Scorecard Integrity
1. **Submission Time vs Scorecard Lock**:
   - When a student completes an exam, `/api/test-series/grade` grades their answers against the authoritative `question_bank` via `exam_questions`.
   - The computed score (`score`, `correct_count`, `incorrect_count`, `unanswered_count`) is **permanently locked** into `test_attempts`.
2. **Review & Solutions**:
   - When viewing `/test-series/analytics/[attemptId]`, the scorecard displays the student's immutable score while pulling the latest, crystal-clear explanation and diagram directly from `question_bank`.
3. **Administrative Regrade Capability**:
   - If an exam question has an erratum (e.g. key changed from A to D) and an administrator wishes to re-evaluate candidate scores, an administrative stored procedure `regrade_exam_attempts(p_exam_id UUID)` re-scores all submissions for that specific exam without touching other exams.

---

## 6. Mobile UX/UI Flaws & Redesign Blueprint

### Flaws Identified in Current CBT Engine (`CbtEngineClient.jsx`):
1. **Palette Sidebar Grid Compression**:
   - Currently, a fixed `w-80` sidebar is rendered side-by-side with the question panel (`flex-1 flex overflow-hidden`).
   - On screens < 1024px, this either squashes the question stem or forces horizontal scrollbars.
2. **Top Header Button Clutter**:
   - 5 buttons (`Calculator`, `Scratchpad`, `Reset Test`, `Timer`, `Submit Test`) are placed inline. On mobile viewports (375px–430px), buttons wrap clumsily or clip.
3. **Math Formula Horizontal Overflow**:
   - KaTeX formulas without an explicit container width overflow into the sidebar.
4. **Touch Target Sizing**:
   - Option buttons must provide a minimum 48px touch height with clear visual states (`bg-teal-50 border-teal-600` on tap).

### Mobile Optimization Architecture:
- **Bottom-Sheet Question Palette**: Replace the fixed right sidebar on `< 1024px` viewports with an ergonomic bottom drawer / sliding sheet triggered by a compact floating pill (`Question 5/75 • Palette`).
- **Compact Floating Header**: Consolidate top tools into an icon menu; keep the countdown timer prominently visible.
- **Formula Safe Containers**: Wrap all `KatexRenderer` outputs with `overflow-x-auto max-w-full` and styled scrollbar rules.

---

## 7. Migration Execution Checklist for Implementation Phase

1. [ ] Apply SQL migration `20260820000000_centralized_question_bank.sql` (Creates `question_bank`, `exam_questions`, `assessment_questions`, indexes, and triggers).
2. [ ] Run data migration extraction script to upsert all existing questions into `question_bank` and populate `exam_questions`.
3. [ ] Update Admin Dashboard `QuestionBankClient.jsx` to query and mutate `public.question_bank`.
4. [ ] Update Admin Dashboard `ExamCompilerTab.jsx` and `CompilerClient.jsx` to query `question_bank` and insert into `exam_questions`.
5. [ ] Update Student Portal `/api/test-series/grade/route.js` and `test-series/engine/[examId]/page.js` to fetch questions via `exam_questions` -> `question_bank`.
6. [ ] Implement mobile-responsive bottom sheet and ergonomic UI in `CbtEngineClient.jsx`.
