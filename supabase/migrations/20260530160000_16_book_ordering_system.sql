-- 20260530160000_16_book_ordering_system.sql
-- Create Physical Book Ordering & Delivery System Schema

-- 1. Create books table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT,
  target_exam_tag TEXT DEFAULT 'JEE Mains',
  cover_url TEXT,
  sample_pdf_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add book_id column to invoices table
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES public.books(id) ON DELETE SET NULL;

-- 3. Create book_orders table
CREATE TABLE IF NOT EXISTS public.book_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  shipping_address JSONB NOT NULL,
  amount_paid NUMERIC NOT NULL,
  shipping_fee NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'placed', -- 'placed', 'processing', 'dispatched', 'in_transit', 'delivered', 'cancelled'
  courier_partner TEXT,
  tracking_id TEXT,
  tracking_url TEXT,
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- 4. Enable RLS on books and book_orders
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_orders ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for books
DROP POLICY IF EXISTS "Public can view active books" ON public.books;
CREATE POLICY "Public can view active books" 
  ON public.books FOR SELECT 
  USING (is_active = true OR COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), (SELECT role FROM public.profiles WHERE id = auth.uid())) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Admins and teachers manage books" ON public.books;
CREATE POLICY "Admins and teachers manage books" 
  ON public.books FOR ALL 
  USING (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), (SELECT role FROM public.profiles WHERE id = auth.uid())) IN ('admin', 'teacher'));

-- 6. RLS Policies for book_orders
DROP POLICY IF EXISTS "Students view own book orders" ON public.book_orders;
CREATE POLICY "Students view own book orders" 
  ON public.book_orders FOR SELECT 
  USING (auth.uid() = user_id OR COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), (SELECT role FROM public.profiles WHERE id = auth.uid())) IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Admins manage all book orders" ON public.book_orders;
CREATE POLICY "Admins manage all book orders" 
  ON public.book_orders FOR ALL 
  USING (COALESCE(((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text), (SELECT role FROM public.profiles WHERE id = auth.uid())) IN ('admin', 'teacher'));

-- 7. Define execute_atomic_book_order RPC
CREATE OR REPLACE FUNCTION public.execute_atomic_book_order(
  _user_id uuid,
  _book_id uuid,
  _shipping_address jsonb,
  _payment_id text,
  _amount numeric,
  _shipping_fee numeric,
  _secret_token text
) RETURNS boolean AS $$
DECLARE
  v_expected_token text;
  v_current_stock integer;
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

  -- Verify stock availability
  SELECT stock_quantity INTO v_current_stock FROM public.books WHERE id = _book_id;
  IF v_current_stock IS NULL OR v_current_stock < 1 THEN
    RAISE EXCEPTION 'Book is out of stock';
  END IF;

  -- 1. Decrement stock
  UPDATE public.books 
  SET stock_quantity = stock_quantity - 1 
  WHERE id = _book_id;

  -- 2. Write the financial ledger invoice
  INSERT INTO public.invoices (user_id, book_id, razorpay_payment_id, amount_paid, status)
  VALUES (_user_id, _book_id, _payment_id, _amount, 'captured');

  -- 3. Create the physical shipment order
  INSERT INTO public.book_orders (user_id, book_id, shipping_address, amount_paid, shipping_fee, status)
  VALUES (_user_id, _book_id, _shipping_address, _amount, _shipping_fee, 'placed');

  -- 4. Ensure user role upgraded if necessary
  UPDATE public.profiles SET role = 'paid_student' WHERE id = _user_id AND role = 'student';

  RETURN true;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Transaction aborted due to state error: %', sqlerrm;
END;
$$ language plpgsql security definer;

-- 8. Seed sample books for immediate preview
INSERT INTO public.books (id, title, subtitle, author, target_exam_tag, cover_url, sample_pdf_url, price, original_price, stock_quantity, is_active)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'JEE Advanced Mechanics Blueprint Vol. 1', 'Comprehensive Theory & 1500+ Solved Numerical Problems', 'Dr. Sarah Jenkins', 'JEE ADVANCED', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 699, 999, 45, true),
  ('b1000000-0000-0000-0000-000000000002', 'IIT-JEE Physical & Organic Chemistry Master Guide', 'Short Tricks, Reaction Mechanisms & 10-Year Chapterwise PYQs', 'Prof. David Miller', 'JEE MAINS', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 549, 799, 60, true),
  ('b1000000-0000-0000-0000-000000000003', 'Foundations of Higher Mathematics & Calculus', 'Comprehensive Workbook for Class 11 & 12 Foundation Aspirants', 'ASENTRA Academic Board', 'FOUNDATION', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 449, 599, 30, true)
ON CONFLICT (id) DO NOTHING;
