-- 14_test_series.sql
-- Standalone CBT Test Series Hub Database Schema Migration

-- 1. Create test_packages table
CREATE TABLE IF NOT EXISTS public.test_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    target_exam_tag TEXT NOT NULL, -- e.g., 'JEE Main', 'JEE Advanced', 'NEET'
    total_tests_count INT NOT NULL DEFAULT 0,
    test_distribution JSONB NOT NULL DEFAULT '{"chapter_drills": 0, "full_mocks": 0, "live_papers": 0}'::jsonb,
    price_ledger JSONB NOT NULL DEFAULT '{"status": "free", "price": 0}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create test_exams table
CREATE TABLE IF NOT EXISTS public.test_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES public.test_packages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 180,
    total_questions INT NOT NULL DEFAULT 90,
    marks_scheme JSONB NOT NULL DEFAULT '{"positive_marks": 4, "negative_marks": -1}'::jsonb,
    is_live_ranking BOOLEAN NOT NULL DEFAULT false,
    activation_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of serialized MCQs
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create test_questions table (Global Question Bank)
CREATE TABLE IF NOT EXISTS public.test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL, -- e.g., 'Physics', 'Chemistry', 'Mathematics'
    sub_topic TEXT NOT NULL, -- e.g., 'Kinematics', 'Organic Chemistry'
    difficulty TEXT NOT NULL, -- 'easy', 'medium', 'hard'
    content TEXT NOT NULL, -- Markdown + LaTeX representation
    options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of 4 options
    correct_option_index INT NOT NULL, -- 0, 1, 2, or 3
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create test_attempts table
CREATE TABLE IF NOT EXISTS public.test_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id UUID REFERENCES public.test_exams(id) ON DELETE CASCADE,
    answers_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- tracks { question_id: { selected_option: X, seconds_spent: Y } }
    score INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    incorrect_count INT NOT NULL DEFAULT 0,
    unanswered_count INT NOT NULL DEFAULT 0,
    total_duration_seconds INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Foreign Key from test_attempts to profiles for Postgrest joins
ALTER TABLE public.test_attempts DROP CONSTRAINT IF EXISTS fk_test_attempts_user_profiles;
ALTER TABLE public.test_attempts
  ADD CONSTRAINT fk_test_attempts_user_profiles
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.test_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies for test_packages
DROP POLICY IF EXISTS "Allow select for all authenticated users" ON public.test_packages;
CREATE POLICY "Allow select for all authenticated users"
    ON public.test_packages FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins and teachers manage packages" ON public.test_packages;
CREATE POLICY "Admins and teachers manage packages"
    ON public.test_packages FOR ALL
    TO authenticated
    USING (
      COALESCE(
        ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
        (SELECT role FROM public.profiles WHERE id = auth.uid())
      ) IN ('admin', 'teacher')
    );

-- 8. Define RLS Policies for test_exams
DROP POLICY IF EXISTS "Allow select exams for all authenticated users" ON public.test_exams;
CREATE POLICY "Allow select exams for all authenticated users"
    ON public.test_exams FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins and teachers manage exams" ON public.test_exams;
CREATE POLICY "Admins and teachers manage exams"
    ON public.test_exams FOR ALL
    TO authenticated
    USING (
      COALESCE(
        ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
        (SELECT role FROM public.profiles WHERE id = auth.uid())
      ) IN ('admin', 'teacher')
    );

-- 9. Define RLS Policies for test_questions
DROP POLICY IF EXISTS "Admins and teachers manage questions" ON public.test_questions;
CREATE POLICY "Admins and teachers manage questions"
    ON public.test_questions FOR ALL
    TO authenticated
    USING (
      COALESCE(
        ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
        (SELECT role FROM public.profiles WHERE id = auth.uid())
      ) IN ('admin', 'teacher')
    );

-- 10. Define RLS Policies for test_attempts
DROP POLICY IF EXISTS "Students select their own attempts" ON public.test_attempts;
CREATE POLICY "Students select their own attempts"
    ON public.test_attempts FOR SELECT
    TO authenticated
    USING (
      auth.uid() = user_id OR
      COALESCE(
        ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
        (SELECT role FROM public.profiles WHERE id = auth.uid())
      ) IN ('admin', 'teacher')
    );

DROP POLICY IF EXISTS "Students insert their own attempts" ON public.test_attempts;
CREATE POLICY "Students insert their own attempts"
    ON public.test_attempts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and teachers manage all attempts" ON public.test_attempts;
CREATE POLICY "Admins and teachers manage all attempts"
    ON public.test_attempts FOR ALL
    TO authenticated
    USING (
      COALESCE(
        ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
        (SELECT role FROM public.profiles WHERE id = auth.uid())
      ) IN ('admin', 'teacher')
    );
