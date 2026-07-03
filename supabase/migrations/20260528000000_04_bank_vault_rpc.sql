create or replace function public.execute_atomic_student_onboarding(
  _user_id uuid,
  _course_id uuid,
  _payment_id text,
  _amount numeric
) returns boolean as $$
begin
  -- Idempotency Check: if payment is already processed, return success immediately
  if exists (
    select 1 from public.invoices 
    where razorpay_payment_id = _payment_id
  ) then
    return true;
  end if;

  -- 1. Write the financial ledger
  insert into public.invoices (user_id, course_id, razorpay_payment_id, amount_paid, status)
  values (_user_id, _course_id, _payment_id, _amount, 'captured');

  -- 2. Grant access
  insert into public.enrollments (user_id, course_id, status)
  values (_user_id, _course_id, 'active');

  -- 3. Upgrade permissions
  update public.profiles set role = 'paid_student' where id = _user_id;

  return true;
exception when others then
  raise exception 'Transaction aborted due to state error: %', sqlerrm;
end;
$$ language plpgsql security definer;
