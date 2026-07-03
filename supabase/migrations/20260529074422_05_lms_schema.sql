-- Re-create user_progress and lessons tables clean
drop table if exists public.user_progress cascade;
drop table if exists public.progress cascade;

-- Remove foreign key constraint from course_files if it exists
alter table if exists public.course_files drop constraint if exists course_files_lesson_id_fkey;

drop table if exists public.lessons cascade;

-- Re-create public.lessons with required schema
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  description text,
  video_url text not null,
  order_index integer not null,
  duration_minutes integer default 0
);

-- Re-create public.user_progress with required schema
create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  completed_at timestamp with time zone default now(),
  unique(user_id, lesson_id)
);

alter table public.lessons enable row level security;
alter table public.user_progress enable row level security;

-- High-Performance EXISTS Lock
create policy "Enrolled students can view lessons"
  on public.lessons for select
  using (
    exists (
      select 1 from public.enrollments
      where enrollments.user_id = (select auth.uid())
      and enrollments.course_id = lessons.course_id
      and enrollments.status = 'active'
    )
  );

create policy "Lessons admin manage"
  on public.lessons for all
  using (
    coalesce(
      ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
      (select role from public.profiles where id = (select auth.uid()))
    ) = 'admin'
  );

create policy "Lessons instructor manage"
  on public.lessons for all
  using (
    exists (
      select 1 from public.courses
      where courses.id = lessons.course_id
      and courses.instructor_id = (select auth.uid())
    )
  );

create policy "Users manage own progress"
  on public.user_progress for all
  using ((select auth.uid()) = user_id);

-- Re-add the course_files reference to lessons
alter table if exists public.course_files
  add constraint course_files_lesson_id_fkey
  foreign key (lesson_id) references public.lessons(id) on delete cascade;
