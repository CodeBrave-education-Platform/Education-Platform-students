-- Migration 13: Secure Onboarding, Trigger and Config Table Setup

-- 1. Drop old unsecured onboarding and revocation functions
DROP FUNCTION IF EXISTS public.execute_atomic_student_onboarding(uuid, uuid, text, numeric);
DROP FUNCTION IF EXISTS public.execute_atomic_batch_onboarding(uuid, uuid, text, numeric);
DROP FUNCTION IF EXISTS public.execute_enrollment_revocation(text);

-- 2. Create secure config table for database-level secrets
CREATE TABLE IF NOT EXISTS public.secure_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- Enable RLS to prevent direct browser/client reading
ALTER TABLE public.secure_config ENABLE ROW LEVEL SECURITY;
-- By NOT creating any select policies, PostgREST / Supabase client queries will return 0 rows.
-- Only database functions running with SECURITY DEFINER will be able to read this table.

-- Insert the onboarding secret token (matches RAZORPAY_KEY_SECRET in .env.local)
INSERT INTO public.secure_config (key, value)
VALUES ('onboarding_secret_token', 'P0YIbV3ZGKgDkloeyVk7meXl')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Redefine trigger handle_new_user to block role escalation (only whitelisted admin emails get admin, everyone else restricted to student/paid_student)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role text;
BEGIN
  assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  
  -- Explicitly allow these specific emails to be admin
  IF new.email IN (
    'akulamanikanta168@gmail.com', 
    'asentraeducation@gmail.com', 
    'topscoredayakar@gmail.com',
    'madhan91213@gmail.com',
    'haravindhreddy.p@gmail.com'
  ) THEN
    assigned_role := 'admin';
  -- Strict verification: If the role requested is not a standard student role, force it to 'student'
  ELSIF assigned_role NOT IN ('student', 'paid_student') THEN
    assigned_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, phone, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.phone, new.raw_user_meta_data->>'phone_number'),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      phone = COALESCE(profiles.phone, EXCLUDED.phone),
      full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
      role = EXCLUDED.role;

  -- Synchronize auth metadata with role claims securely
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(assigned_role)
  )
  WHERE id = new.id;

  RETURN new;
END;
$$ language plpgsql security definer;

-- 4. Redefine execute_atomic_student_onboarding with token check
CREATE OR REPLACE FUNCTION public.execute_atomic_student_onboarding(
  _user_id uuid,
  _course_id uuid,
  _payment_id text,
  _amount numeric,
  _secret_token text
) RETURNS boolean AS $$
DECLARE
  v_expected_token text;
BEGIN
  SELECT value INTO v_expected_token FROM public.secure_config WHERE key = 'onboarding_secret_token';
  IF _secret_token IS NULL OR _secret_token <> v_expected_token THEN
    RAISE EXCEPTION 'Unauthorized database access: Invalid secret token';
  END IF;

  -- Idempotency Check: if payment is already processed, return success immediately
  IF EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE razorpay_payment_id = _payment_id
  ) THEN
    RETURN true;
  END IF;

  -- 1. Write the financial ledger
  INSERT INTO public.invoices (user_id, course_id, razorpay_payment_id, amount_paid, status)
  VALUES (_user_id, _course_id, _payment_id, _amount, 'captured');

  -- 2. Grant access
  INSERT INTO public.enrollments (user_id, course_id, status)
  VALUES (_user_id, _course_id, 'active');

  -- 3. Upgrade permissions
  UPDATE public.profiles SET role = 'paid_student' WHERE id = _user_id;

  RETURN true;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Transaction aborted due to state error: %', sqlerrm;
END;
$$ language plpgsql security definer;

-- 5. Redefine execute_atomic_batch_onboarding with token check
CREATE OR REPLACE FUNCTION public.execute_atomic_batch_onboarding(
  _user_id uuid,
  _batch_id uuid,
  _payment_id text,
  _amount numeric,
  _secret_token text
) RETURNS boolean AS $$
DECLARE
  v_expected_token text;
BEGIN
  SELECT value INTO v_expected_token FROM public.secure_config WHERE key = 'onboarding_secret_token';
  IF _secret_token IS NULL OR _secret_token <> v_expected_token THEN
    RAISE EXCEPTION 'Unauthorized database access: Invalid secret token';
  END IF;

  -- Idempotency Check: if payment is already processed, return success immediately
  IF EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE razorpay_payment_id = _payment_id
  ) THEN
    RETURN true;
  END IF;

  -- 1. Write the financial ledger
  INSERT INTO public.invoices (user_id, batch_id, razorpay_payment_id, amount_paid, status)
  VALUES (_user_id, _batch_id, _payment_id, _amount, 'captured');

  -- 2. Grant access
  INSERT INTO public.batch_enrollments (user_id, batch_id, status)
  VALUES (_user_id, _batch_id, 'active')
  ON CONFLICT (user_id, batch_id) DO UPDATE SET status = 'active';

  -- 3. Upgrade permissions
  UPDATE public.profiles SET role = 'paid_student' WHERE id = _user_id;

  RETURN true;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Transaction aborted due to state error: %', sqlerrm;
END;
$$ language plpgsql security definer;

-- 6. Redefine execute_enrollment_revocation with token check
CREATE OR REPLACE FUNCTION public.execute_enrollment_revocation(
  _payment_id text,
  _secret_token text
) RETURNS boolean AS $$
DECLARE
  v_expected_token text;
  _target_user_id uuid;
  _target_course_id uuid;
  _target_batch_id uuid;
BEGIN
  SELECT value INTO v_expected_token FROM public.secure_config WHERE key = 'onboarding_secret_token';
  IF _secret_token IS NULL OR _secret_token <> v_expected_token THEN
    RAISE EXCEPTION 'Unauthorized database access: Invalid secret token';
  END IF;

  -- Find the user and course/batch tied to the refunded payment
  SELECT user_id, course_id, batch_id INTO _target_user_id, _target_course_id, _target_batch_id 
  FROM public.invoices WHERE razorpay_payment_id = _payment_id LIMIT 1;

  IF NOT FOUND THEN RETURN false; END IF;

  -- Update ledger and revoke access
  UPDATE public.invoices SET status = 'refunded' WHERE razorpay_payment_id = _payment_id;
  
  IF _target_course_id IS NOT NULL THEN
    UPDATE public.enrollments SET status = 'revoked' WHERE user_id = _target_user_id and course_id = _target_course_id;
  END IF;

  IF _target_batch_id IS NOT NULL THEN
    UPDATE public.batch_enrollments SET status = 'revoked' WHERE user_id = _target_user_id and batch_id = _target_batch_id;
  END IF;
  
  RETURN true;
END;
$$ language plpgsql security definer;
