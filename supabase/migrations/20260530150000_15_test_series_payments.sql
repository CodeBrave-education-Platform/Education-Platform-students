-- 20260530150000_15_test_series_payments.sql
-- Enable Razorpay payments and atomic provisioning for premium Test Series packages

-- 1. Add package_id to invoices
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.test_packages(id) ON DELETE SET NULL;

-- 2. Define execute_atomic_package_onboarding
CREATE OR REPLACE FUNCTION public.execute_atomic_package_onboarding(
  _user_id uuid,
  _package_id uuid,
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
  INSERT INTO public.invoices (user_id, package_id, razorpay_payment_id, amount_paid, status)
  VALUES (_user_id, _package_id, _payment_id, _amount, 'captured');

  -- 2. Upgrade permissions
  UPDATE public.profiles SET role = 'paid_student' WHERE id = _user_id;

  RETURN true;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Transaction aborted due to state error: %', sqlerrm;
END;
$$ language plpgsql security definer;
