-- 20260526000000_00_profiles.sql
-- Base table DDL for public.profiles

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    phone TEXT,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT now(),
    target_year TEXT,
    academic_batch TEXT,
    preferred_subject TEXT,
    daily_study_hours TEXT,
    syllabus_progress TEXT,
    test_average TEXT,
    academic_strengths TEXT,
    weekly_tests_attempted TEXT,
    dream_college TEXT,
    study_hours_slept TEXT,
    study_mentor TEXT
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow select for all authenticated users
DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;
CREATE POLICY "Profiles public read" ON public.profiles
    FOR SELECT TO authenticated USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Profiles self edit" ON public.profiles;
CREATE POLICY "Profiles self edit" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);
