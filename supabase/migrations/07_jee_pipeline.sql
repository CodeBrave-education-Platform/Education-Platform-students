-- 1. Live Sessions DDL
create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  meeting_url text not null,
  scheduled_start timestamp with time zone not null,
  duration_minutes integer not null,
  status text default 'scheduled' check (status in ('scheduled', 'live', 'ended'))
);

-- 2. Assessments (Exams & Quizzes) DDL
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  type text check (type in ('quiz', 'jee_mock')),
  duration_minutes integer not null,
  scheduled_start timestamp with time zone,
  scheduled_end timestamp with time zone
);

-- 3. Questions (The secure vault) DDL
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete cascade not null,
  content text not null,
  options jsonb not null, -- e.g., ["Option A", "Option B", "Option C", "Option D"]
  correct_option_index integer not null, -- NEVER EXPOSE TO STUDENT CLIENT
  marks_positive integer default 4,
  marks_negative integer default 1
);

-- 4. Student Attempts DDL
create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_i
);

-- Enable Row Level Security
alter table public.live_sessions enable row level security;
alter table public.assessments enable row level security;
alter table public.questions enable row level security;
alter table public.assessment_attempts enable row level security;

-- High-Performance RLS Policies using scalar subqueries (avoiding table scans)
create policy "Enrolled students view live sessions"
  on public.live_sessions for select
  using (
    exists (
      select 1 from public.enrollments
      where enrollments.user_id = (select auth.uid())
      and enrollments.course_id = live_sessions.course_id
      and enrollments.status = 'active'
    )
  );

create policy "Enrolled students view assessments"
  on public.assessments for select
  using (
    exists (
      select 1 from public.enrollments
      where enrollments.user_id = (select auth.uid())
      and enrollments.course_id = assessments.course_id
      and enrollments.status = 'active'
    )
  );

create policy "Enrolled students view questions"
  on public.questions for select
  using (
    exists (
      select 1 from public.assessments
      join public.enrollments on enrollments.course_id = assessments.course_id
      where assessments.id = questions.assessment_id
      and enrollments.user_id = (select auth.uid())
      and enrollments.status = 'active'
    )
  );

create policy "Users manage own attempts"
  on public.assessment_attempts for all
  using ((select auth.uid()) = user_id);

-- 5. Secure Blind Grading View (Drops correct_option_index completely)
create or replace view public.student_questions 
with (security_invoker = true) as
  select id, assessment_id, content, options, marks_positive, marks_negative
  from public.questions;

