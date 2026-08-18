-- ============================================================================
-- Migration: 14_schema_integrity_and_qa_patch.sql
-- Title: Database Schema Integrity, Foreign Keys, Gamification & RLS QA Patch
-- Description: Comprehensive production-grade migration establishing foreign key
--              integrity, missing tables, performance indexes, RLS policies,
--              and unified atomic onboarding RPCs across courses, batches, packages, and books.
-- ============================================================================

-- Ensure required cryptographic and UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: CORE TABLE EXTENSIONS & FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- 1.1 Extend public.profiles with Gamification & Activity telemetry
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rank_badge VARCHAR(50) DEFAULT 'Cadet',
  ADD COLUMN IF NOT EXISTS last_active_date TIMESTAMPTZ DEFAULT now();

-- 1.2 Extend public.courses with instructor relation, catalog metadata, and soft-delete
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS instructor_id UUID,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.9,
  ADD COLUMN IF NOT EXISTS students_count INTEGER DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS lessons_count INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS badge VARCHAR(50),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add foreign key from courses to profiles
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;
ALTER TABLE public.courses
  ADD CONSTRAINT courses_instructor_id_fkey
  FOREIGN KEY (instructor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure courses level check constraint
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_level_check;
ALTER TABLE public.courses
  ADD CONSTRAINT courses_level_check
  CHECK (level IS NULL OR level IN ('foundation', 'mains', 'advanced'));

-- 1.3 Extend public.invoices with cross-product relationships, order ID, and profile compatibility
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS profile_id UUID,
  ADD COLUMN IF NOT EXISTS batch_id UUID,
  ADD COLUMN IF NOT EXISTS package_id UUID,
  ADD COLUMN IF NOT EXISTS book_id UUID,
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;

-- Add foreign keys for invoices
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_user_id_fkey;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_profile_id_fkey;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_course_id_fkey;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_course_id_fkey
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_batch_id_fkey;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE SET NULL;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_package_id_fkey;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_package_id_fkey
  FOREIGN KEY (package_id) REFERENCES public.test_packages(id) ON DELETE SET NULL;

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_book_id_fkey;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_book_id_fkey
  FOREIGN KEY (book_id) REFERENCES public.books(id) ON DELETE SET NULL;

-- 1.4 Extend public.assessments for cohort batch support and time window gating
ALTER TABLE public.assessments
  ALTER COLUMN course_id DROP NOT NULL;

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS batch_id UUID,
  ADD COLUMN IF NOT EXISTS start_window TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_window TIMESTAMPTZ;

ALTER TABLE public.assessments DROP CONSTRAINT IF EXISTS assessments_batch_id_fkey;
ALTER TABLE public.assessments
  ADD CONSTRAINT assessments_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;

-- 1.5 Extend public.live_sessions for cohort batch support
ALTER TABLE public.live_sessions
  ALTER COLUMN course_id DROP NOT NULL;

ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS batch_id UUID;

ALTER TABLE public.live_sessions DROP CONSTRAINT IF EXISTS live_sessions_batch_id_fkey;
ALTER TABLE public.live_sessions
  ADD CONSTRAINT live_sessions_batch_id_fkey
  FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE;

-- 1.6 Extend public.test_packages with display metadata
ALTER TABLE public.test_packages
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS campus_branch TEXT DEFAULT 'Hyderabad Main';

-- ============================================================================
-- SECTION 2: MISSING TABLES CREATION
-- ============================================================================

-- 2.1 Course and Batch Downloadable Study Assets (course_files)
CREATE TABLE IF NOT EXISTS public.course_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT DEFAULT 0,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Coursera Catalog Demo Management (coursera_courses)
CREATE TABLE IF NOT EXISTS public.coursera_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  provider TEXT DEFAULT 'Coursera Partner',
  rating NUMERIC DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 1500,
  level TEXT DEFAULT 'Beginner',
  duration TEXT DEFAULT 'Approx. 3 months',
  skills JSONB DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECTION 3: INVOICE COMPATIBILITY & TRIGGER SYNCHRONIZATION
-- ============================================================================

-- Bi-directional synchronization trigger between user_id and profile_id on invoices
CREATE OR REPLACE FUNCTION public.sync_invoices_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.profile_id := NEW.user_id;
  ELSIF NEW.user_id IS NULL AND NEW.profile_id IS NOT NULL THEN
    NEW.user_id := NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_invoices_user_profile ON public.invoices;
CREATE TRIGGER trigger_sync_invoices_user_profile
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_invoices_user_profile();

-- Backfill profile_id from user_id for existing invoice rows
UPDATE public.invoices
SET profile_id = user_id
WHERE profile_id IS NULL AND user_id IS NOT NULL;

-- ============================================================================
-- SECTION 4: PERFORMANCE INDEXES (FOREIGN KEYS & CRITICAL QUERIES)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_deleted_at ON public.courses(deleted_at);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_profile_id ON public.invoices(profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_course_id ON public.invoices(course_id);
CREATE INDEX IF NOT EXISTS idx_invoices_batch_id ON public.invoices(batch_id);
CREATE INDEX IF NOT EXISTS idx_invoices_package_id ON public.invoices(package_id);
CREATE INDEX IF NOT EXISTS idx_invoices_book_id ON public.invoices(book_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON public.invoices(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

CREATE INDEX IF NOT EXISTS idx_batch_enrollments_user_id ON public.batch_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_batch_id ON public.batch_enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_status ON public.batch_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON public.assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessments_batch_id ON public.assessments(batch_id);
CREATE INDEX IF NOT EXISTS idx_assessments_windows ON public.assessments(start_window, end_window);

CREATE INDEX IF NOT EXISTS idx_live_sessions_course_id ON public.live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_batch_id ON public.live_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_start ON public.live_sessions(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_course_files_course_id ON public.course_files(course_id);
CREATE INDEX IF NOT EXISTS idx_course_files_batch_id ON public.course_files(batch_id);
CREATE INDEX IF NOT EXISTS idx_course_files_lesson_id ON public.course_files(lesson_id);

CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON public.test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_exam_id ON public.test_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_score ON public.test_attempts(score DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_xp ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================================================
-- SECTION 5: COMPLETE ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 5.1 Invoices Table RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invoices private" ON public.invoices;
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users view own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins and teachers view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;

CREATE POLICY "Users view own invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id OR (select auth.uid()) = profile_id);

CREATE POLICY "Admins and teachers view all invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

CREATE POLICY "Users can insert own invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id OR (select auth.uid()) = profile_id);

-- 5.2 Test Attempts Table RLS
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students select their own attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Students insert their own attempts" ON public.test_attempts;
DROP POLICY IF EXISTS "Admins and teachers manage all attempts" ON public.test_attempts;

CREATE POLICY "Students select their own attempts"
  ON public.test_attempts FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id OR
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

CREATE POLICY "Students insert their own attempts"
  ON public.test_attempts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins and teachers manage all attempts"
  ON public.test_attempts FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

-- 5.3 Enrollments Table RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrollments private" ON public.enrollments;
DROP POLICY IF EXISTS "Enrolled students view enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Instructors view course enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins manage all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users insert own enrollments" ON public.enrollments;

CREATE POLICY "Enrolled students view enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Instructors view course enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = enrollments.course_id
        AND courses.instructor_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins manage all enrollments"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

CREATE POLICY "Users insert own enrollments"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- 5.4 Courses Table RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Courses public" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors view and manage own courses" ON public.courses;
DROP POLICY IF EXISTS "Admins manage all courses" ON public.courses;

CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);

CREATE POLICY "Instructors view and manage own courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (instructor_id = (select auth.uid()));

CREATE POLICY "Admins manage all courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) = 'admin'
  );

-- 5.5 Profiles Table RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self edit" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self insert" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;

CREATE POLICY "Profiles public read"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Profiles self edit"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Profiles self insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Admins manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) = 'admin'
  );

-- 5.6 Course Files Table RLS
ALTER TABLE public.course_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled students view course files" ON public.course_files;
DROP POLICY IF EXISTS "Enrolled batch students view batch files" ON public.course_files;
DROP POLICY IF EXISTS "Admins and teachers manage course files" ON public.course_files;

CREATE POLICY "Enrolled students view course files"
  ON public.course_files FOR SELECT
  TO authenticated
  USING (
    course_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.user_id = (select auth.uid())
        AND enrollments.course_id = course_files.course_id
        AND enrollments.status = 'active'
    )
  );

CREATE POLICY "Enrolled batch students view batch files"
  ON public.course_files FOR SELECT
  TO authenticated
  USING (
    batch_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.batch_enrollments
      WHERE batch_enrollments.user_id = (select auth.uid())
        AND batch_enrollments.batch_id = course_files.batch_id
        AND batch_enrollments.status = 'active'
    )
  );

CREATE POLICY "Admins and teachers manage course files"
  ON public.course_files FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

-- 5.7 Test Packages & Exams Table RLS
ALTER TABLE public.test_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view test packages" ON public.test_packages;
DROP POLICY IF EXISTS "Allow select for all authenticated users" ON public.test_packages;
DROP POLICY IF EXISTS "Admins and teachers manage packages" ON public.test_packages;

CREATE POLICY "Public view test packages"
  ON public.test_packages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins and teachers manage packages"
  ON public.test_packages FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "Public view test exams" ON public.test_exams;
DROP POLICY IF EXISTS "Allow select exams for all authenticated users" ON public.test_exams;
DROP POLICY IF EXISTS "Admins and teachers manage exams" ON public.test_exams;

CREATE POLICY "Public view test exams"
  ON public.test_exams FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins and teachers manage exams"
  ON public.test_exams FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

-- 5.8 Batches & Batch Enrollments Table RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published batches" ON public.batches;
DROP POLICY IF EXISTS "Admins and teachers manage all batches" ON public.batches;

CREATE POLICY "Anyone can view published batches"
  ON public.batches FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND deleted_at IS NULL);

CREATE POLICY "Admins and teachers manage all batches"
  ON public.batches FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "Users view own batch enrollments" ON public.batch_enrollments;
DROP POLICY IF EXISTS "Users insert own batch enrollments" ON public.batch_enrollments;
DROP POLICY IF EXISTS "Admins and teachers manage all batch enrollments" ON public.batch_enrollments;

CREATE POLICY "Users view own batch enrollments"
  ON public.batch_enrollments FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users insert own batch enrollments"
  ON public.batch_enrollments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins and teachers manage all batch enrollments"
  ON public.batch_enrollments FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

-- 5.9 Coursera Courses Table RLS
ALTER TABLE public.coursera_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view coursera courses" ON public.coursera_courses;
DROP POLICY IF EXISTS "Admins manage coursera courses" ON public.coursera_courses;

CREATE POLICY "Public view coursera courses"
  ON public.coursera_courses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage coursera courses"
  ON public.coursera_courses FOR ALL
  TO authenticated
  USING (
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

-- 5.10 Assessments and Live Sessions Polymorphic Access Policies
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled students view assessments" ON public.assessments;
CREATE POLICY "Enrolled students view assessments"
  ON public.assessments FOR SELECT
  TO authenticated
  USING (
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.user_id = (select auth.uid())
        AND enrollments.course_id = assessments.course_id
        AND enrollments.status = 'active'
    )) OR
    (batch_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.batch_enrollments
      WHERE batch_enrollments.user_id = (select auth.uid())
        AND batch_enrollments.batch_id = assessments.batch_id
        AND batch_enrollments.status = 'active'
    )) OR
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "Enrolled students view live sessions" ON public.live_sessions;
CREATE POLICY "Enrolled students view live sessions"
  ON public.live_sessions FOR SELECT
  TO authenticated
  USING (
    (course_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.user_id = (select auth.uid())
        AND enrollments.course_id = live_sessions.course_id
        AND enrollments.status = 'active'
    )) OR
    (batch_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.batch_enrollments
      WHERE batch_enrollments.user_id = (select auth.uid())
        AND batch_enrollments.batch_id = live_sessions.batch_id
        AND batch_enrollments.status = 'active'
    )) OR
    COALESCE(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    ) IN ('admin', 'teacher')
  );

-- ============================================================================
-- SECTION 6: STORED PROCEDURES & ATOMIC ONBOARDING RPCS
-- ============================================================================

-- 6.1 Unified Master Onboarding RPC: onboard_user_after_payment
CREATE OR REPLACE FUNCTION public.onboard_user_after_payment(
  _user_id UUID,
  _item_type TEXT, -- 'course', 'batch', 'package', 'test_package', 'book'
  _item_id UUID,
  _payment_id TEXT,
  _order_id TEXT DEFAULT NULL,
  _amount NUMERIC DEFAULT 0,
  _secret_token TEXT DEFAULT NULL,
  _shipping_address JSONB DEFAULT NULL,
  _shipping_fee NUMERIC DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
  v_expected_token TEXT;
  v_invoice_id UUID;
  v_stock INTEGER;
BEGIN
  -- Validate Secret Token if configured in secure_config
  SELECT value INTO v_expected_token FROM public.secure_config WHERE key = 'onboarding_secret_token';
  IF _secret_token IS NOT NULL AND v_expected_token IS NOT NULL AND _secret_token <> v_expected_token THEN
    RAISE EXCEPTION 'Unauthorized database access: Invalid secret token';
  END IF;

  -- Idempotency Check: return success immediately if payment already registered
  SELECT id INTO v_invoice_id FROM public.invoices WHERE razorpay_payment_id = _payment_id LIMIT 1;
  IF v_invoice_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Payment already processed (idempotent)',
      'invoice_id', v_invoice_id,
      'item_type', _item_type,
      'item_id', _item_id
    );
  END IF;

  -- Dispatch onboarding by item type
  IF _item_type = 'course' THEN
    IF NOT EXISTS (SELECT 1 FROM public.courses WHERE id = _item_id) THEN
      RAISE EXCEPTION 'Course not found with id: %', _item_id;
    END IF;

    INSERT INTO public.invoices (user_id, profile_id, course_id, razorpay_payment_id, razorpay_order_id, amount_paid, status)
    VALUES (_user_id, _user_id, _item_id, _payment_id, _order_id, _amount, 'captured')
    RETURNING id INTO v_invoice_id;

    INSERT INTO public.enrollments (user_id, course_id, status)
    VALUES (_user_id, _item_id, 'active')
    ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'active';

  ELSIF _item_type = 'batch' THEN
    IF NOT EXISTS (SELECT 1 FROM public.batches WHERE id = _item_id) THEN
      RAISE EXCEPTION 'Batch not found with id: %', _item_id;
    END IF;

    INSERT INTO public.invoices (user_id, profile_id, batch_id, razorpay_payment_id, razorpay_order_id, amount_paid, status)
    VALUES (_user_id, _user_id, _item_id, _payment_id, _order_id, _amount, 'captured')
    RETURNING id INTO v_invoice_id;

    INSERT INTO public.batch_enrollments (user_id, batch_id, status)
    VALUES (_user_id, _item_id, 'active')
    ON CONFLICT (user_id, batch_id) DO UPDATE SET status = 'active';

  ELSIF _item_type IN ('package', 'test_package') THEN
    IF NOT EXISTS (SELECT 1 FROM public.test_packages WHERE id = _item_id) THEN
      RAISE EXCEPTION 'Test package not found with id: %', _item_id;
    END IF;

    INSERT INTO public.invoices (user_id, profile_id, package_id, razorpay_payment_id, razorpay_order_id, amount_paid, status)
    VALUES (_user_id, _user_id, _item_id, _payment_id, _order_id, _amount, 'captured')
    RETURNING id INTO v_invoice_id;

  ELSIF _item_type = 'book' THEN
    SELECT stock_quantity INTO v_stock FROM public.books WHERE id = _item_id;
    IF v_stock IS NULL THEN
      RAISE EXCEPTION 'Book not found with id: %', _item_id;
    END IF;
    IF v_stock < 1 THEN
      RAISE EXCEPTION 'Book is out of stock';
    END IF;

    UPDATE public.books SET stock_quantity = stock_quantity - 1 WHERE id = _item_id;

    INSERT INTO public.invoices (user_id, profile_id, book_id, razorpay_payment_id, razorpay_order_id, amount_paid, status)
    VALUES (_user_id, _user_id, _item_id, _payment_id, _order_id, _amount, 'captured')
    RETURNING id INTO v_invoice_id;

    IF _shipping_address IS NOT NULL THEN
      INSERT INTO public.book_orders (user_id, book_id, shipping_address, amount_paid, shipping_fee, status)
      VALUES (_user_id, _item_id, _shipping_address, _amount, _shipping_fee, 'placed');
    END IF;

  ELSE
    RAISE EXCEPTION 'Unsupported item type: %', _item_type;
  END IF;

  -- Upgrade role from 'student' to 'paid_student'
  UPDATE public.profiles
  SET role = 'paid_student'
  WHERE id = _user_id AND role = 'student';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Onboarding completed successfully',
    'invoice_id', v_invoice_id,
    'item_type', _item_type,
    'item_id', _item_id
  );
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Transaction aborted due to state error: %', sqlerrm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.2 Atomic Student Course Onboarding RPC (with optional order_id)
CREATE OR REPLACE FUNCTION public.execute_atomic_student_onboarding(
  _user_id UUID,
  _course_id UUID,
  _payment_id TEXT,
  _amount NUMERIC,
  _secret_token TEXT DEFAULT NULL,
  _order_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_expected_token TEXT;
BEGIN
  SELECT value INTO v_expected_token FROM public.secure_config WHERE key = 'onboarding_secret_token';
  IF _secret_token IS NOT NULL AND v_expected_token IS NOT NULL AND _secret_token <> v_expected_token THEN
    RAISE EXCEPTION 'Unauthorized database access: Invalid secret token';
  END IF;

  IF EXISTS (SELECT 1 FROM public.invoices WHERE razorpay_payment_id = _payment_id) THEN
    RETURN true;
  END IF;

  INSERT INTO public.invoices (user_id, profile_id, course_id, razorpay_payment_id, razorpay_order_id, amount_paid, status)
  VALUES (_user_id, _user_id, _course_id, _payment_id, _order_id, _amount, 'captured');

  INSERT INTO public.enrollments (user_id, course_id, status)
  VALUES (_user_id, _course_id, 'active')
  ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'active';

  UPDATE public.profiles SET role = 'paid_student' WHERE id = _user_id AND role = 'student';

  RETURN true;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Transaction aborted due to state error: %', sqlerrm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Atomic Batch Onboarding RPC (with optional order_id)
CREATE OR REPLACE FUNCTION public.execute_atomic_batch_onboarding(
  _user_id UUID,
  _batch_id UUID,
  _payment_id TEXT,
  _amount NUMERIC,
  _secret_token TEXT DEFAULT NULL,
  _order_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_expected_token TEXT;
BEGIN
  SELECT value INTO v_expected_token FROM public.secure_config WHERE key = 'onboarding_secret_token';
  IF _secret_token IS NOT NULL AND v_expected_token IS NOT NULL AND _secret_token <> v_expected_token THEN
    RAISE EXCEPTION 'Unauthorized database access: Invalid secret token';
  END IF;

  IF EXISTS (SELECT 1 FROM public.invoices WHERE razorpay_payment_id = _payment_id) THEN
    RETURN true;
  END IF;

  INSERT INTO public.invoices (user_id, profile_id, batch_id, razorpay_payment_id, razorpay_order_id, amount_paid, status)
  VALUES (_user_id, _user_id, _batch_id, _payment_id, _order_id, _amount, 'captured');

  INSERT INTO public.batch_enrollments (user_id, batch_id, status)
  VALUES (_user_id, _batch_id, 'active')
  ON CONFLICT (user_id, batch_id) DO UPDATE SET status = 'active';

  UPDATE public.profiles SET role = 'paid_student' WHERE id = _user_id AND role = 'student';

  RETURN true;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Transaction aborted due to state error: %', sqlerrm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.4 Atomic Package Onboarding RPC (with optional order_id)
CREATE OR REPLACE FUNCTION public.execute_atomic_package_onboarding(
  _user_id UUID,
  _package_id UUID,
  _payment_id TEXT,
  _amount NUMERIC,
  _secret_token TEXT DEFAULT NULL,
  _order_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_expected_token TEXT;
BEGIN
  SELECT value INTO v_expected_token FROM public.secure_config WHERE key = 'onboarding_secret_token';
  IF _secret_token IS NOT NULL AND v_expected_token IS NOT NULL AND _secret_token <> v_expected_token THEN
    RAISE EXCEPTION 'Unauthorized database access: Invalid secret token';
  END IF;

  IF EXISTS (SELECT 1 FROM public.invoices WHERE razorpay_payment_id = _payment_id) THEN
    RETURN true;
  END IF;

  INSERT INTO public.invoices (user_id, profile_id, package_id, razorpay_payment_id, razorpay_order_id, amount_paid, status)
  VALUES (_user_id, _user_id, _package_id, _payment_id, _order_id, _amount, 'captured');

  UPDATE public.profiles SET role = 'paid_student' WHERE id = _user_id AND role = 'student';

  RETURN true;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Transaction aborted due to state error: %', sqlerrm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5 Atomic Physical Book Order RPC
CREATE OR REPLACE FUNCTION public.execute_atomic_book_order(
  _user_id UUID,
  _book_id UUID,
  _shipping_address JSONB,
  _payment_id TEXT,
  _amount NUMERIC,
  _shipping_fee NUMERIC,
  _secret_token TEXT DEFAULT NULL,
  _order_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_expected_token TEXT;
  v_current_stock INTEGER;
BEGIN
  SELECT value INTO v_expected_token FROM public.secure_config WHERE key = 'onboarding_secret_token';
  IF _secret_token IS NOT NULL AND v_expected_token IS NOT NULL AND _secret_token <> v_expected_token THEN
    RAISE EXCEPTION 'Unauthorized database access: Invalid secret token';
  END IF;

  IF EXISTS (SELECT 1 FROM public.invoices WHERE razorpay_payment_id = _payment_id) THEN
    RETURN true;
  END IF;

  SELECT stock_quantity INTO v_current_stock FROM public.books WHERE id = _book_id;
  IF v_current_stock IS NULL OR v_current_stock < 1 THEN
    RAISE EXCEPTION 'Book is out of stock';
  END IF;

  UPDATE public.books 
  SET stock_quantity = stock_quantity - 1 
  WHERE id = _book_id;

  INSERT INTO public.invoices (user_id, profile_id, book_id, razorpay_payment_id, razorpay_order_id, amount_paid, status)
  VALUES (_user_id, _user_id, _book_id, _payment_id, _order_id, _amount, 'captured');

  INSERT INTO public.book_orders (user_id, book_id, shipping_address, amount_paid, shipping_fee, status)
  VALUES (_user_id, _book_id, _shipping_address, _amount, _shipping_fee, 'placed');

  UPDATE public.profiles SET role = 'paid_student' WHERE id = _user_id AND role = 'student';

  RETURN true;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Transaction aborted due to state error: %', sqlerrm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.6 Atomic Enrollment Revocation RPC
CREATE OR REPLACE FUNCTION public.execute_enrollment_revocation(
  _payment_id TEXT,
  _secret_token TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_expected_token TEXT;
  _target_user_id UUID;
  _target_course_id UUID;
  _target_batch_id UUID;
BEGIN
  SELECT value INTO v_expected_token FROM public.secure_config WHERE key = 'onboarding_secret_token';
  IF _secret_token IS NOT NULL AND v_expected_token IS NOT NULL AND _secret_token <> v_expected_token THEN
    RAISE EXCEPTION 'Unauthorized database access: Invalid secret token';
  END IF;

  SELECT user_id, course_id, batch_id INTO _target_user_id, _target_course_id, _target_batch_id 
  FROM public.invoices WHERE razorpay_payment_id = _payment_id LIMIT 1;

  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE public.invoices SET status = 'refunded' WHERE razorpay_payment_id = _payment_id;
  
  IF _target_course_id IS NOT NULL THEN
    UPDATE public.enrollments SET status = 'revoked' WHERE user_id = _target_user_id AND course_id = _target_course_id;
  END IF;

  IF _target_batch_id IS NOT NULL THEN
    UPDATE public.batch_enrollments SET status = 'revoked' WHERE user_id = _target_user_id AND batch_id = _target_batch_id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 7: SEED & VERIFICATION BASELINE
-- ============================================================================

-- Ensure sample Coursera courses exist for catalog display
INSERT INTO public.coursera_courses (id, title, provider, rating, reviews_count, level, duration, skills, thumbnail_url)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Advanced Mathematical Physics for Competitive Exams', 'Indian Institute of Science Partner', 4.9, 2400, 'Advanced', '3 Months', '["Calculus", "Vectors", "Wave Mechanics"]'::jsonb, 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'),
  ('c1000000-0000-0000-0000-000000000002', 'Organic Synthesis & Reaction Mechanisms Masterclass', 'TopScore Chemistry Faculty', 4.8, 1850, 'Intermediate', '2 Months', '["Reaction Mechanisms", "Stereochemistry", "Spectroscopy"]'::jsonb, 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80')
ON CONFLICT (id) DO NOTHING;

-- Ensure sample course_files exist for cohort batch view
INSERT INTO public.course_files (id, course_id, batch_id, file_name, file_path, file_size_bytes, file_type)
VALUES
  ('f1000000-0000-0000-0000-000000000001', NULL, NULL, 'JEE_Advanced_Formula_Handbook_2026.pdf', 'secure-assets/handbooks/JEE_Advanced_Formula_Handbook_2026.pdf', 5242880, 'application/pdf'),
  ('f1000000-0000-0000-0000-000000000002', NULL, NULL, 'Calculus_High_Yield_PYQ_Solutions.pdf', 'secure-assets/worksheets/Calculus_High_Yield_PYQ_Solutions.pdf', 3145728, 'application/pdf')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 8: EXPLICIT GRANTS & PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
