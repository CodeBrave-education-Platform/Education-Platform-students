-- 1. Extend lessons table to support reading materials and assignments
alter table public.lessons 
  add column if not exists reading_material text,
  add column if not exists assignment_title text,
  add column if not exists assignment_description text,
  add column if not exists assignment_url text;

-- 2. Create lesson_doubts table for community discussion threads
create table if not exists public.lesson_doubts (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.lesson_doubts(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.lesson_doubts enable row level security;

-- High-Performance RLS Policies using scalar subqueries
create policy "Enrolled students can view doubts"
  on public.lesson_doubts for select
  using (
    exists (
      select 1 from public.lessons
      join public.enrollments on enrollments.course_id = lessons.course_id
      where lessons.id = lesson_doubts.lesson_id
      and enrollments.user_id = (select auth.uid())
      and enrollments.status = 'active'
    )
  );

create policy "Users manage own doubts"
  on public.lesson_doubts for all
  using ((select auth.uid()) = user_id);

-- 3. Populate existing seeded lessons with rich content
upd
  assignment_title = 'Linear Equation Balance Challenges',
  assignment_description = 'Solve the balance exercises. Find the value of x for the given systems and verify your answers. Show each isolation step in your notes.',
  assignment_url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
where order_index = 2;

update public.lessons 
set 
  reading_material = '<h3>3. Quadratic Equations Theory</h3><p>A quadratic equation is a second-order polynomial equation in a single variable x with a non-zero leading coefficient: ax² + bx + c = 0.</p><h4>The Quadratic Formula:</h4><p>The roots can be found using the formula: <b>x = [-b ± √(b² - 4ac)] / 2a</b></p><h4>The Discriminant (D = b² - 4ac):</h4><ul><li><b>D > 0:</b> Two distinct real roots.</li><li><b>D = 0:</b> One repeated real root (perfect square).</li><li><b>D < 0:</b> Two complex conjugate roots.</li></ul>',
  assignment_title = 'Discriminant Analysis & Roots Proofs',
  assignment_description = 'Determine the nature of roots for the 8 quadratic equations provided in the handout, and calculate their real or complex roots. Write down the complete step-by-step discriminant proof.',
  assignment_url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
where order_index = 3;
