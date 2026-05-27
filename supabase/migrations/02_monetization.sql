create table public.courses (id uuid default gen_random_uuid() primary key, title text not null, description text, price numeric not null default 0, level text check (level in ('foundation', 'mains', 'advanced')), created_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table public.enrollments (id uuid default gen_random_uuid() primary key, user_id uuid references public.profiles(id) on delete cascade not null, course_id uuid references public.courses(id) on delete cascade not null, status text default 'active', enrolled_at timestamp with time zone default timezone('utc'::text, now()) not null, unique(user_id, course_id));
create table public.invoices (id uuid default gen_random_uuid() primary key, user_id uuid references public.profiles(id) on delete cascade not null, course_id uuid references public.courses(id) on delete cascade, razorpay_payment_id text unique not null, amount_paid numeric not null, currency text default 'INR', status text default 'paid', invoice_date timestamp with time zone default timezone('utc'::text, now()) not null);
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.invoices enable row level security;
create policy "Courses public" on public.courses for select using (true);
create policy "Enrollments private" on public.enrollments for select using (auth.uid() = user_id);
create policy "Invoices private" on public.invoices for select using (auth.uid() = user_id);
