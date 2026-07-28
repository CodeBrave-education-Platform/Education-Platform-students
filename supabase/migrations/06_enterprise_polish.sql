-- 1. The Revocation RPC
create or replace function public.execute_enrollment_revocation(
  _payment_id text
) returns boolean as $$
declare
  _target_user_id uuid;
  _target_course_id uuid;
begin
  -- Find the user and course tied to the refunded payment
  select user_id, course_id into _target_user_id, _target_course_id 
  from public.invoices where razorpay_payment_id = _payment_id limit 1;

  if not found then return false; end if;

  -- Update ledger and revoke access
  update public.invoices set status = 'refunded' where razorpay_payment_id = _payment_id;
  update public.enrollments set status = 'revoked' where user_id = _target_user_id and course_id = _target_course_id;
  
  -- Note: We do not automatically downgrade the profile role to 'student' here just in case they have paid for OTHER courses.
  
  return true;
end;
$$ language plpgsql security definer;

-- 2. Enable pg_cron (if available) and schedule cleanup of abandoned orders older than 24 hours
create extension if not exists pg_cron;
select cron.schedule(
  'cleanup_abandoned_invoices', 
  '0 3 * * *', -- Run every day at 3:00 AM
  $$delete from public.invoices where status = 'pending' and created_at < now() - interval '24 hours';$$
);
