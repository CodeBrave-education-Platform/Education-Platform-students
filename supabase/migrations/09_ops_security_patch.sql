-- 1. Implement Soft Deletes on core tables
alter table public.courses add column if not exists deleted_at timestamp with time zone;
alter table public.batches add column if not exists deleted_at timestamp with time zone;

-- Update RLS policies to only show active records (where deleted_at is null)
drop policy if exists "Anyone can view published courses" on public.courses;
create policy "Anyone can view published courses" on public.courses 
for select using (status = 'published' and deleted_at is null);

drop policy if exists "Anyone can view published batches" on public.batches;
create policy "Anyone can view published batches" on public.batches 
for select using (status = 'published' and deleted_at is null);

-- 2. The Admin Audit Ledger
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) not null,
  action_type text not null, -- e.g., 'UPDATE_COURSE_PRICE', 'SOFT_DELETE_COURSE'
  table_name text not null,
  record_id uuid not null,
  previous_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone default now()
);

alter table public.admin_audit_logs enable row level security;
drop policy if exists "Only admins can view logs" on public.admin_audit_logs;
create policy "Only admins can view logs" on public.admin_audit_logs 
for select using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- 3. Lock down Supabase storage buckets natively at the database level to prevent billing abuse
create or replace function storage.enforce_upload_size_limit()
returns trigger as $$
declare
  file_size bigint;
begin
  -- Get file size safely from dynamic metadata JSON mapping
  file_size := coalesce((new.metadata->>'size')::bigint, 0);
  
  if file_size > 10485760 then -- Strict native 10MB size restriction
    raise exception 'Upload exceeds the maximum allowed size of 10MB to prevent billing abuse.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_storage_upload_size on storage.objects;
create trigger enforce_storage_upload_size
  before insert or update on storage.objects
  for each row execute function storage.enforce_upload_size_limit();
