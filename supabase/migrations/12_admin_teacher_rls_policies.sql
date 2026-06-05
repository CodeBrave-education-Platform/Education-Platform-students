-- Phase 9 Migration: Admin & Teacher RLS Policies Sync
-- This migration adds foreign keys and RLS policies enabling instructors, teachers, and admins to manage curriculum metadata, assessments, mock questions, live polling sessions, and review student scorecard telemetry.

-- 1. Add foreign key from lesson_doubts to profiles if not exists (for Postgrest joins)
ALTER TABLE public.lesson_doubts DROP CONSTRAINT IF EXISTS fk_lesson_doubts_user_profiles;
ALTER TABLE public.lesson_doubts
  ADD CONSTRAINT fk_lesson_doubts_user_profiles
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 1b. Add foreign key from assessment_attempts to profiles if not exists (for Postgrest joins)
ALTER TABLE public.assessment_attempts DROP CONSTRAINT IF EXISTS fk_assessment_attempts_user_profiles;
ALTER TABLE public.assessment_attempts
  ADD CONSTRAINT fk_assessment_attempts_user_profiles
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 1c. Add foreign key from batch_enrollments to profiles if not exists (for Postgrest joins)
ALTER TABLE public.batch_enrollments DROP CONSTRAINT IF EXISTS fk_batch_enrollments_user_profiles;
ALTER TABLE public.batch_enrollments
  ADD CONSTRAINT fk_batch_enrollments_user_profiles
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. doubt board thread access for admins and teachers
DROP POLICY IF EXISTS "Admins and teachers manage all doubts" ON public.lesson_doubts;
CREATE POLICY "Admins and teachers manage all doubts"
  ON public.lesson_doubts FOR ALL
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = auth.uid())
    ) IN ('admin', 'teacher')
  );

-- 3. lessons select override for teachers
DROP POLICY IF EXISTS "Teachers can select all lessons" ON public.lessons;
CREATE POLICY "Teachers can select all lessons"
  ON public.lessons FOR SELECT
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = auth.uid())
    ) = 'teacher'
  );

-- 4. assessments CRUD management policy
DROP POLICY IF EXISTS "Admins and teachers manage all assessments" ON public.assessments;
CREATE POLICY "Admins and teachers manage all assessments"
  ON public.assessments FOR ALL
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = auth.uid())
    ) IN ('admin', 'teacher')
  );

-- 5. assessment questions CRUD management policy
DROP POLICY IF EXISTS "Admins and teachers manage all questions" ON public.questions;
CREATE POLICY "Admins and teachers manage all questions"
  ON public.questions FOR ALL
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = auth.uid())
    ) IN ('admin', 'teacher')
  );

-- 6. live sessions CRUD management policy
DROP POLICY IF EXISTS "Admins and teachers manage all live sessions" ON public.live_sessions;
CREATE POLICY "Admins and teachers manage all live sessions"
  ON public.live_sessions FOR ALL
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = auth.uid())
    ) IN ('admin', 'teacher')
  );

-- 7. batches management policy
DROP POLICY IF EXISTS "Admins and teachers manage all batches" ON public.batches;
CREATE POLICY "Admins and teachers manage all batches"
  ON public.batches FOR ALL
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = auth.uid())
    ) IN ('admin', 'teacher')
  );

-- 8. batch enrollments management policy
DROP POLICY IF EXISTS "Admins and teachers manage all batch enrollments" ON public.batch_enrollments;
CREATE POLICY "Admins and teachers manage all batch enrollments"
  ON public.batch_enrollments FOR ALL
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = auth.uid())
    ) IN ('admin', 'teacher')
  );

-- 9. student assessment attempts select override for telemetry gradebook
DROP POLICY IF EXISTS "Admins and teachers select all attempts" ON public.assessment_attempts;
CREATE POLICY "Admins and teachers select all attempts"
  ON public.assessment_attempts FOR SELECT
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = auth.uid())
    ) IN ('admin', 'teacher')
  );
