-- ============================================================================
-- ASENTRA EDUCATION PLATFORM - CENTRALIZED QUESTION BANK & JUNCTION TABLES MIGRATION
-- Migration: 20260820000000_centralized_question_bank.sql
-- Description: Unifies fragmented question storage across Student & Admin portals.
--              Establishes question_bank, exam_questions, assessment_questions,
--              automated trigger sync for legacy readers, and extracts existing questions.
-- ============================================================================

-- Ensure required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CENTRALIZED QUESTION BANK TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    format_type TEXT NOT NULL DEFAULT 'single_mcq'
        CHECK (format_type IN ('single_mcq', 'multi_mcq', 'numerical', 'assertion_reason', 'matrix_match', 'blanks')),
    subject TEXT NOT NULL
        CHECK (subject IN ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'General')),
    topic TEXT NOT NULL DEFAULT 'General',
    sub_topic TEXT DEFAULT 'General',
    difficulty TEXT NOT NULL DEFAULT 'MEDIUM'
        CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'easy', 'medium', 'hard')),
    section TEXT DEFAULT 'Section A',
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_option_index INT DEFAULT 0,
    correct_answer TEXT,
    explanation TEXT,
    diagram_url TEXT,
    marks_positive NUMERIC NOT NULL DEFAULT 4,
    marks_negative NUMERIC NOT NULL DEFAULT -1,
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    times_tested INT NOT NULL DEFAULT 0,
    times_correct INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. TEST EXAMS JUNCTION TABLE (exam_questions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.test_exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 1,
    section TEXT DEFAULT 'Section A',
    marks_positive NUMERIC,
    marks_negative NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exam_question UNIQUE (exam_id, question_id)
);

-- ============================================================================
-- 3. LMS COURSE ASSESSMENTS JUNCTION TABLE (assessment_questions)
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
-- 4. PERFORMANCE & LOOKUP INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_qb_subject_difficulty ON public.question_bank(subject, difficulty);
CREATE INDEX IF NOT EXISTS idx_qb_topic ON public.question_bank(topic, sub_topic);
CREATE INDEX IF NOT EXISTS idx_qb_created_at ON public.question_bank(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qb_tags ON public.question_bank USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON public.exam_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON public.assessment_questions(assessment_id, order_index);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_question_id ON public.assessment_questions(question_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;

-- Question Bank Policies
DROP POLICY IF EXISTS "Allow select question_bank for authenticated users" ON public.question_bank;
CREATE POLICY "Allow select question_bank for authenticated users"
    ON public.question_bank FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins and teachers manage question_bank" ON public.question_bank;
CREATE POLICY "Admins and teachers manage question_bank"
    ON public.question_bank FOR ALL
    TO authenticated
    USING (
      COALESCE(
        ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
        (SELECT role FROM public.profiles WHERE id = auth.uid())
      ) IN ('admin', 'teacher', 'instructor')
    );

-- Exam Questions Policies
DROP POLICY IF EXISTS "Allow select exam_questions for authenticated users" ON public.exam_questions;
CREATE POLICY "Allow select exam_questions for authenticated users"
    ON public.exam_questions FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins and teachers manage exam_questions" ON public.exam_questions;
CREATE POLICY "Admins and teachers manage exam_questions"
    ON public.exam_questions FOR ALL
    TO authenticated
    USING (
      COALESCE(
        ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
        (SELECT role FROM public.profiles WHERE id = auth.uid())
      ) IN ('admin', 'teacher', 'instructor')
    );

-- ============================================================================
-- 6. SECURE BLIND VIEWS (Drops correct answers for live student test engines)
-- ============================================================================
CREATE OR REPLACE VIEW public.student_exam_questions
WITH (security_invoker = true) AS
SELECT 
    eq.id AS junction_id,
    eq.exam_id,
    eq.order_index,
    eq.section,
    COALESCE(eq.marks_positive, qb.marks_positive) AS marks_positive,
    COALESCE(eq.marks_negative, qb.marks_negative) AS marks_negative,
    qb.id AS question_id,
    qb.content,
    qb.format_type,
    qb.subject,
    qb.topic,
    qb.sub_topic,
    qb.difficulty,
    qb.options,
    qb.diagram_url
FROM public.exam_questions eq
JOIN public.question_bank qb ON qb.id = eq.question_id
WHERE qb.is_active = true
ORDER BY eq.order_index ASC;

-- ============================================================================
-- 7. AUTOMATED SYNC TRIGGER FOR BACKWARD COMPATIBILITY
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_exam_questions_json_for_exam(target_exam_id UUID)
RETURNS VOID AS $$
DECLARE
    compiled_json JSONB;
    q_count INT;
BEGIN
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'id', qb.id,
                'content', qb.content,
                'question_text', qb.content,
                'questionText', qb.content,
                'subject', qb.subject,
                'topic', qb.topic,
                'sub_topic', qb.sub_topic,
                'difficulty', qb.difficulty,
                'format_type', qb.format_type,
                'formatType', qb.format_type,
                'section', eq.section,
                'options', qb.options,
                'correct_option_index', qb.correct_option_index,
                'correctOptionIndex', qb.correct_option_index,
                'correct_answer', qb.correct_answer,
                'correctAnswer', qb.correct_answer,
                'explanation', qb.explanation,
                'solution_explanation', qb.explanation,
                'diagram_url', qb.diagram_url,
                'diagramUrl', qb.diagram_url,
                'marks_positive', COALESCE(eq.marks_positive, qb.marks_positive),
                'marks_negative', COALESCE(eq.marks_negative, qb.marks_negative)
            ) ORDER BY eq.order_index ASC
        ),
        count(*)
    INTO compiled_json, q_count
    FROM public.exam_questions eq
    JOIN public.question_bank qb ON qb.id = eq.question_id
    WHERE eq.exam_id = target_exam_id;

    UPDATE public.test_exams
    SET 
        questions = COALESCE(compiled_json, '[]'::jsonb),
        total_questions = COALESCE(q_count, 0)
    WHERE id = target_exam_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_sync_exam_questions()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.sync_exam_questions_json_for_exam(COALESCE(NEW.exam_id, OLD.exam_id));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_exam_questions ON public.exam_questions;
CREATE TRIGGER trg_sync_exam_questions
AFTER INSERT OR UPDATE OR DELETE ON public.exam_questions
FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_exam_questions();

CREATE OR REPLACE FUNCTION public.trigger_sync_question_bank_to_linked_exams()
RETURNS TRIGGER AS $$
DECLARE
    r_exam RECORD;
BEGIN
    FOR r_exam IN SELECT DISTINCT exam_id FROM public.exam_questions WHERE question_id = NEW.id LOOP
        PERFORM public.sync_exam_questions_json_for_exam(r_exam.exam_id);
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_question_bank_update ON public.question_bank;
CREATE TRIGGER trg_sync_question_bank_update
AFTER UPDATE ON public.question_bank
FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_question_bank_to_linked_exams();

-- ============================================================================
-- 8. ZERO-LOSS DATA EXTRACTION & BACKFILL
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
    explanation = COALESCE(EXCLUDED.explanation, question_bank.explanation),
    diagram_url = COALESCE(EXCLUDED.diagram_url, question_bank.diagram_url);

-- Step B: Extract all embedded JSON questions from test_exams into question_bank and exam_questions
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
