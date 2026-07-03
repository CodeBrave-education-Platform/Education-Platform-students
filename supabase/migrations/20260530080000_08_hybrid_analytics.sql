-- 1. Batches (Cohort-based learning)
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_date timestamp with time zone not null,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  price numeric not null
);

-- 2. Batch Enrollments
create table if not exists public.batch_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  batch_id uuid references public.batches(id) on delete cascade not null,
  status text default 'active',
  unique(user_id, batch_id)
);

-- 3. Enable Row Level Security
alter table public.batches enable row level security;
alter table public.batch_enrollments enable row level security;

-- 4. RLS Policies
create policy "Anyone can view published batches" 
  on public.batches for select 
  using (status = 'published');

create policy "Users view own batch enrollments" 
  on public.batch_enrollments for select 
  using ((select auth.uid()) = user_id);

-- 5. The Analytics Aggregation RPC (Zero-Trust Performance)
create or replace function public.get_student_analytics(student_id uuid)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'total_exams', count(id),
    'average_score', coalesce(avg(score), 0),
    'recent_scores', (
      select json_agg(json_build_object('date', submitted_at::date, 'score', score))
      from (
        select submitted_at, score 
        from public.assessment_attempts 
        where user_id = student_id 
          and submitted_at is not null 
        order by submitted_at desc 
        limit 5
      ) sub
    )
  ) into result
  from public.assessment_attempts
  where user_id = student_id 
    and submitted_at is not null;
  
  return result;
end;
$$ language plpgsql security definer;
