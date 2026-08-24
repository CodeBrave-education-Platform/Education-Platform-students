# Comprehensive Survey Report: Student Portal UI Components & Hardcoded Data Scan

**Target Workspace**: `d:\education portal`  
**Explorer**: Explorer 1 (Student Portal UI & Components Scanner)  
**Date**: 2026-08-24  
**Integrity Mode**: Development / Read-Only Audit  

---

## Executive Summary

A comprehensive architectural scan of the Student Portal (`src/app`, `src/components`, `src/utils`, `src/hooks`) was executed to identify every UI component, page, and API endpoint that currently relies on hardcoded placeholder arrays, fallback objects, simulated local state, or missing backend queries.

### Key Observations & Scope
- **Total Components/Pages Audited**: 41 JSX/JS routes and 25 core UI components.
- **Identified Hardcoded Areas**: 20 distinct files contain static mock datasets, fallback arrays, or `localStorage`-only workflows.
- **Supabase Client Usage**: 
  - Standard SSR server client: `@/utils/supabase/server` (using `@supabase/ssr` with Next.js cookies/headers).
  - Standard browser client: `@/utils/supabase/client` (using `@supabase/ssr`).
  - Outliers: `src/app/analytics/page.jsx` uses direct `@supabase/supabase-js` without SSR cookie passing.
- **Primary Transition Requirement**: Replace fallback objects (`DEFAULT_COURSES`, `DEFAULT_BATCHES`, `DEFAULT_FALLBACK_PACKAGES`, `DEFAULT_FALLBACK_EXAMS`, `sampleBooks`, `defaultOrders`, hardcoded profile defaults) with robust Supabase relational queries backed by complete SQL migrations with Row Level Security (RLS).

---

## Exhaustive Component & Page Inventory

Below is the complete catalog of all identified components and pages with hardcoded placeholder data, line numbers, variable names, data structures, proposed Supabase schemas, and recommended query paradigms.

---

### 1. Batches & Cohorts Catalog (`src/app/batches/page.jsx`)
- **File Path**: `d:\education portal\src\app\batches\page.jsx`
- **Line Numbers**: Lines 16–153 (`DEFAULT_BATCHES`), Lines 181–201 (Fallback field mappings), Lines 205, 209 (Fallback catch assignment), Lines 235–240 (`localStorage` joined batches).
- **Hardcoded Data Fields**:
  - `DEFAULT_BATCHES` array with 3 complete cohort objects (`batch-jee-apex-2026`, `batch-neet-aiims-2026`, `batch-foundation-class10`).
  - Fields: `title`, `faculty`, `facultyRole`, `cover`, `badge`, `rating`, `targetYear`, `schedule`, `studentsEnrolled`, `seatsLeft`, `price`, `originalPrice`, `checklist` (5-item array), `includedBookBox` (`{ title, booksCount, value }`), `curriculum` (hierarchical array of modules and lessons with durations and PDF download links).
  - Fallback checklist and book kit objects injected when Supabase returns null attributes.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.batches`
    - `id` (text / uuid, primary key)
    - `title` (text, not null)
    - `instructor_name` / `faculty` (text)
    - `instructor_role` (text)
    - `thumbnail_url` (text)
    - `badge` (text)
    - `rating` (numeric, default 4.9)
    - `target_year` / `level` (text)
    - `schedule` (text)
    - `students_enrolled` (integer, default 0)
    - `seats_left` (integer, default 50)
    - `price` (numeric, not null)
    - `original_price` (numeric)
    - `checklist` (jsonb / text[], e.g., `["300+ Live Interactive...", ...]`)
    - `book_kit` (jsonb, e.g., `{"title": "...", "books_count": 6, "value": 3999}`)
    - `curriculum` (jsonb, array of module/chapter objects with lessons)
    - `status` (text, default 'published')
  - **Table**: `public.batch_enrollments`
    - `id` (uuid, primary key)
    - `user_id` (uuid, fk to auth.users / profiles)
    - `batch_id` (text / uuid, fk to batches)
    - `status` (text, 'active' | 'expired')
    - `enrolled_at` (timestamptz)
- **Recommended Query Method**:
  - **Server Component** (`src/app/batches/page.jsx` as Server Component or client fetching from `@/utils/supabase/server`) with parallel batch & enrollment queries.

---

### 2. Courses Catalog (`src/app/courses/page.jsx`)
- **File Path**: `d:\education portal\src\app\courses\page.jsx`
- **Line Numbers**: Lines 14–147 (`DEFAULT_COURSES`), Lines 176–187 (Fallback field mappings), Lines 190, 194 (Fallback assignment).
- **Hardcoded Data Fields**:
  - `DEFAULT_COURSES` array containing 5 full flagship courses (`course-jee-flagship-2026`, `course-physics-mechanics-pro`, `course-chem-organic-inorganic`, `course-math-calculus-algebra`, `course-neet-biology-physiology`).
  - Fields: `title`, `subject`, `instructor`, `instructorRole`, `cover`, `badge`, `rating`, `studentsCount`, `duration`, `lessonsCount`, `price`, `originalPrice`, `checklist`, `includedBookKit`.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.courses`
    - Ensure existing `courses` table includes: `subject`, `instructor_name`, `instructor_role`, `thumbnail_url`, `badge`, `rating`, `students_count`, `duration`, `lessons_count`, `price`, `original_price`, `checklist` (jsonb / text[]), `book_kit` (jsonb), `is_featured` (boolean).
  - **Table**: `public.enrollments`
    - `id`, `user_id`, `course_id`, `status` ('active'), `enrolled_at`.
- **Recommended Query Method**:
  - Convert `src/app/courses/page.jsx` to an async Server Component querying Supabase via `@/utils/supabase/server`, passing data down to an interactive client catalog component.

---

### 3. Course Details Client (`src/app/courses/[id]/CourseDetailsClient.jsx`)
- **File Path**: `d:\education portal\src\app\courses\[id]\CourseDetailsClient.jsx`
- **Line Numbers**: Lines 15–22 (`getDefaultThumbnail`), Lines 175–197 (localStorage book order mock creation with fallback string `${course.title} Printed Textbook Set`), Lines 287, 296 (Hardcoded `'IIT-JEE Aspirants'`, `'Starts 1 Jun, 2026'`).
- **Hardcoded Data Fields**:
  - Static level thumbnails (`foundation`, `mains`, `advanced`).
  - Simulated `localStorage` order injection (`Asentra_book_orders`) upon Razorpay checkout instead of writing to a database `book_orders` table.
  - Fallback strings for audience and timeline.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.courses` (`aspirant_info`, `batch_info`, `book_kit_title`, `thumbnail_url`).
  - **Table**: `public.book_orders` / `public.orders` (created via `/api/razorpay/verify` backend handler).
- **Recommended Query Method**:
  - Server Component in `src/app/courses/[id]/page.jsx` already fetches `courses`, `lessons`, and `enrollments`. Extend to ensure all fields are dynamically populated and remove client-side `localStorage` order mock provisioning.

---

### 4. Book Store Catalog (`src/app/books/page.jsx`)
- **File Path**: `d:\education portal\src\app\books\page.jsx`
- **Line Numbers**: Lines 21–82 (`sampleBooks`), Line 103 (`setBooks([...sampleBooks, ...formatted])`).
- **Hardcoded Data Fields**:
  - `sampleBooks` array with 4 static books (`b1` Physics Mastery, `b2` Organic Chemistry PYQs, `b3` NEET Biology MCQ Bank, `b4` Vector Calculus Handbook).
  - Merged directly with DB books, causing hardcoded records to permanently appear.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.books`
    - `id` (text / uuid, primary key)
    - `title` (text, not null)
    - `author` (text)
    - `category` (text, e.g., 'JEE Main', 'JEE Advanced', 'NEET UG', 'Foundation')
    - `subject` (text, e.g., 'Physics', 'Chemistry', 'Mathematics', 'Biology')
    - `price` (numeric, not null)
    - `original_price` (numeric)
    - `rating` (numeric, default 4.8)
    - `reviews_count` (integer, default 0)
    - `stock` (integer, default 50)
    - `format` (text, e.g., 'Hardcopy + Digital PDF', 'Instant Digital PDF')
    - `isbn` (text)
    - `pages` (integer)
    - `thumbnail_url` (text)
    - `sample_pdf_url` (text)
    - `description` (text)
    - `table_of_contents` (jsonb / text[])
    - `created_at` (timestamptz)
- **Recommended Query Method**:
  - Query `public.books` exclusively from Supabase, completely removing `sampleBooks` from client state.

---

### 5. Book Details Page (`src/app/books/[id]/page.jsx`)
- **File Path**: `d:\education portal\src\app\books\[id]\page.jsx`
- **Line Numbers**: Lines 13–36 (Static `book` object declaration).
- **Hardcoded Data Fields**:
  - The entire page renders a single static book `b1` regardless of `params.id`. No database fetch is attempted.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.books`
- **Recommended Query Method**:
  - Transform `src/app/books/[id]/page.jsx` into an async Server Component using `createClient()` from `@/utils/supabase/server`:
    ```javascript
    const { data: book } = await supabase.from('books').select('*').eq('id', params.id).single()
    if (!book) notFound()
    ```

---

### 6. Book Checkout & Orders System (`src/app/books/checkout/page.jsx` & `src/app/books/my-orders/page.jsx`)
- **File Path**: 
  - `d:\education portal\src\app\books\checkout\page.jsx`
  - `d:\education portal\src\app\books\my-orders\page.jsx`
- **Line Numbers**: 
  - `checkout/page.jsx`: Lines 30–31, 64, 212 (Hardcoded `book-cart-001`, price `699`).
  - `my-orders/page.jsx`: Lines 10–37 (`defaultOrders`), Lines 43–47 (`localStorage` merge), Line 129 (Hardcoded fallback address).
- **Hardcoded Data Fields**:
  - Hardcoded item identifier `'book-cart-001'` and price `699`.
  - `defaultOrders` array with 2 mock dispatch records (`ORD-2026-9041`, `ORD-2026-8812`) and static Bluedart/DTDC tracking numbers.
  - Hardcoded address fallback: `'Asentra Student Campus Registry • Flat 402, Block A, Jubilee Hills, Hyderabad...'`.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.book_orders`
    - `id` (uuid / text, primary key, e.g. 'ORD-2026-XXXX')
    - `user_id` (uuid, fk to auth.users / profiles)
    - `source` (text, 'Direct Purchase' | 'Course Enrollment' | 'Batch Bundle')
    - `order_date` (timestamptz, default now())
    - `total_amount` (numeric, default 0)
    - `status` (text, 'Processing' | 'Dispatched' | 'In Transit' | 'Delivered')
    - `courier` (text, e.g. 'Bluedart Express', 'DTDC')
    - `tracking_number` (text)
    - `tracking_link` (text)
    - `shipping_address` (jsonb: `{ name, phone, street, city, state, pincode }`)
    - `created_at` (timestamptz)
  - **Table**: `public.book_order_items`
    - `id` (uuid, primary key)
    - `order_id` (uuid, fk to book_orders)
    - `book_id` (text / uuid, fk to books)
    - `title` (text)
    - `format` (text)
    - `download_url` (text)
    - `quantity` (integer, default 1)
    - `unit_price` (numeric)
- **Recommended Query Method**:
  - Server Component in `src/app/books/my-orders/page.jsx` querying `book_orders` with relational joined `book_order_items`.

---

### 7. Test Series Hub (`src/app/test-series/page.js`)
- **File Path**: `d:\education portal\src\app\test-series\page.js`
- **Line Numbers**: Lines 8–69 (`DEFAULT_FALLBACK_PACKAGES`), Lines 71–153 (`DEFAULT_FALLBACK_EXAMS`), Lines 182–187, 202–207 (Fallback merge threshold check).
- **Hardcoded Data Fields**:
  - `DEFAULT_FALLBACK_PACKAGES` containing 5 mock test series bundles (`pkg-hero-all-india-mock-2026`, `pkg-physics-mechanics-sprint`, `pkg-neet-biology-rapid-fire`, `pkg-math-calculus-algebra-sprint`, `pkg-chem-organic-inorganic-marathon`).
  - `DEFAULT_FALLBACK_EXAMS` containing 9 mock exam items.
  - Array concatenation injecting mock items if DB returns fewer than 2 items.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.test_packages`
    - `id` (text / uuid, primary key)
    - `title` (text, not null)
    - `target_exam_tag` (text, 'JEE Main' | 'JEE Advanced' | 'NEET' | 'Foundation')
    - `campus_branch` (text)
    - `is_featured` (boolean, default false)
    - `total_tests_count` (integer)
    - `description` (text)
    - `thumbnail_url` (text)
    - `test_distribution` (jsonb: `{ chapter_drills: int, full_mocks: int, live_papers: int }`)
    - `price_ledger` (jsonb: `{ status: 'free' | 'premium', price: int, original_price: int }`)
  - **Table**: `public.test_exams`
    - `id` (uuid, primary key)
    - `package_id` (text / uuid, fk to test_packages)
    - `title` (text, not null)
    - `duration_minutes` (integer, default 180)
    - `total_questions` (integer, default 75)
    - `is_live_ranking` (boolean, default false)
    - `activation_timestamp` (timestamptz)
    - `marks_scheme` (jsonb: `{ positive_marks: 4, negative_marks: -1 }`)
- **Recommended Query Method**:
  - Direct async Server Component fetch via `@/utils/supabase/server` without fallback mock injection once seed migration is run.

---

### 8. CBT Exam Engine Fallback Paper (`src/app/test-series/engine/[examId]/page.js`)
- **File Path**: `d:\education portal\src\app\test-series\engine\[examId]/page.js`
- **Line Numbers**: Lines 92–167 (Static fallback exam object with 6 hardcoded questions `q-1` to `q-6`).
- **Hardcoded Data Fields**:
  - Complete 6-question hardcoded CBT exam paper with hardcoded formulas, options, and explanations.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.exam_questions` (junction table)
  - **Table**: `public.question_bank` (Global Question Bank table)
- **Recommended Query Method**:
  - Server Component querying `exam_questions` joined with `question_bank` (or fallback `test_exams.questions` jsonb column). If no questions exist, return a dedicated empty-exam message rather than synthetic mock questions.

---

### 9. Student Profile & Dashboard Analytics Defaults (`DashboardClient.jsx` & `ProfileClient.jsx`)
- **File Path**: 
  - `d:\education portal\src\app\dashboard\DashboardClient.jsx`
  - `d:\education portal\src\app\profile\ProfileClient.jsx`
- **Line Numbers**: 
  - `DashboardClient.jsx`: Lines 330–331
  - `ProfileClient.jsx`: Lines 28–37
- **Hardcoded Data Fields**:
  - Fallback defaults for student academic statistics:
    - `dailyStudyHours`: `'8 Hours'`
    - `syllabusProgress`: `'45%'`
    - `testAverage`: `'82%'`
    - `academicStrengths`: `'Physics & Calculus'`
    - `weeklyTestsAttempted`: `'3 tests/week'`
    - `dreamCollege`: `'IIT Bombay (Computer Science)'`
    - `studyHoursSlept`: `'7 Hours'`
    - `studyMentor`: `'Dr. R. V. Sharma (IIT Delhi Alumnus)'`
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.profiles`
    - Columns: `daily_study_hours`, `syllabus_progress`, `test_average`, `academic_strengths`, `weekly_tests_attempted`, `dream_college`, `study_hours_slept`, `study_mentor`.
  - **RPC**: `public.get_student_analytics(student_id uuid)`
    - Dynamically calculates real syllabus completion % from `user_progress` and real test averages from `assessment_attempts` / `test_attempts`.
- **Recommended Query Method**:
  - Fetch aggregated analytics on the server in `src/app/dashboard/page.jsx` and `src/app/profile/page.jsx` via `supabase.rpc('get_student_analytics', { student_id })`.

---

### 10. Analytics Page Diagnostics (`src/app/analytics/page.jsx`)
- **File Path**: `d:\education portal\src\app\analytics\page.jsx`
- **Line Numbers**: Lines 7–9 (Direct `@supabase/supabase-js` instantiation), Lines 28–31 (Queries legacy `test_attempts` and `test_exams(questions, marks_scheme)`).
- **Hardcoded / Outdated Patterns**:
  - Uses hardcoded Supabase URL string fallback (`'https://uggatacexipoidzhcjhx.supabase.co'`).
  - Ignores question bank junction tables and new CBT attempt models.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.test_attempts` / `public.assessment_attempts`
  - **Table**: `public.exam_questions` + `public.question_bank`
- **Recommended Query Method**:
  - Refactor to use `@/utils/supabase/client` (or Server Component) and link to Global Question Bank subtopics for real AI heuristic generation.

---

### 11. Live Telemetry Ticker (`src/components/landing/LiveTicker.jsx`)
- **File Path**: `d:\education portal\src\components\landing\LiveTicker.jsx`
- **Line Numbers**: Line 7 (`tickerText`).
- **Hardcoded Data Fields**:
  - `"SYSTEM ONLINE • 1,402 ACTIVE STUDENTS • 24 LIVE COHORTS • 45,890 JEE MOCK EXAMS GRADED • ZERO DOWNTIME"`
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **RPC / Table**: `public.platform_stats` or dynamic query:
    - Count of `profiles` with role 'student'
    - Count of `batches` with status 'published'
    - Count of `test_attempts` + `assessment_attempts`
- **Recommended Query Method**:
  - Server Component in `src/app/page.js` fetching cached metrics from Redis/Supabase and passing down as props to `LiveTicker`.

---

### 12. Navbar Explore Mega-Menu (`src/components/Navbar.jsx`)
- **File Path**: `d:\education portal\src\components\Navbar.jsx`
- **Line Numbers**: Lines 145–148 (Subject links), Lines 159–162 (Featured batches: "JEE Rankers Batch 2026", "JEE Advanced Focus Batch", etc.).
- **Hardcoded Data Fields**:
  - Hardcoded subject and featured batch titles inside mega-menu.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.batches` (`is_featured = true`)
- **Recommended Query Method**:
  - Fetch featured batch titles in server layout/navbar or client query hook.

---

### 13. AI Assistant Mockup (`src/components/AIAssistant.jsx`)
- **File Path**: `d:\education portal\src\components\AIAssistant.jsx`
- **Line Numbers**: Lines 10–12, 35–37 (Simulated greeting and timeout response).
- **Hardcoded Data Fields**:
  - Hardcoded assistant greeting and fake timeout response text.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.ai_mentor_chats` (`id`, `user_id`, `created_at`), `public.ai_mentor_messages` (`id`, `chat_id`, `role`, `content`, `citations`, `created_at`).
  - **API Route**: `/api/ai/mentor` with streaming LLM and Supabase pgvector retrieval over PDF notes.
- **Recommended Query Method**:
  - Client Component with interactive chat state submitting to `/api/ai/mentor`.

---

### 14. Live Classroom API Poll Pool (`src/app/api/live/classroom/route.js`)
- **File Path**: `d:\education portal\src\app\api\live\classroom\route.js`
- **Line Numbers**: Lines 77–93 (`pollPool`), Lines 99–105 (Randomized initial votes).
- **Hardcoded Data Fields**:
  - Static 3-question poll pool rotated periodically.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.live_polls` (`id`, `batch_id`, `course_id`, `question`, `options`, `expires_at`, `created_at`), `public.live_poll_votes` (`id`, `poll_id`, `user_id`, `option_index`).
- **Recommended Query Method**:
  - Query active poll from `live_polls` table with Redis caching.

---

### 15. Coursera Showcase Page (`src/app/coursera/page.js`)
- **File Path**: `d:\education portal\src\app\coursera\page.js`
- **Line Numbers**: Lines 35–92 (`DEFAULT_COURSES`).
- **Hardcoded Data Fields**:
  - 4 static Coursera course cards with simulated admin CRUD via `localStorage`.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - **Table**: `public.coursera_courses` / `public.courses`
- **Recommended Query Method**:
  - Fetch from `public.courses` (or dedicated `coursera_courses` table).

---

### 16. Static Policies (`src/app/policies/[slug]/page.jsx` & `Footer.jsx`)
- **File Path**: `d:\education portal\src\app\policies\[slug]\page.jsx`, `src/components/Footer.jsx`
- **Line Numbers**: Lines 18–115 (`policyContent`), `Footer.jsx` Lines 84, 90, 96.
- **Hardcoded Data Fields**:
  - Organization contact emails, phone numbers, corporate address.
- **Proposed Dynamic Data Model & Supabase Tables**:
  - Optional `public.site_settings` table (`support_email`, `support_phone`, `address`, `privacy_policy_html`, `terms_html`).
- **Recommended Query Method**:
  - Server Component with static fallback.

---

## Complete Database Schema Migration Proposal

To support all dynamic data across the Student Portal, the following SQL tables and schema enhancements are recommended:

```sql
-- ================================================================
-- 1. Batches Table Enhancement
-- ================================================================
CREATE TABLE IF NOT EXISTS public.batches (
    id TEXT PRIMARY KEY DEFAULT ('batch-' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    instructor_name TEXT,
    instructor_role TEXT,
    thumbnail_url TEXT,
    badge TEXT,
    rating NUMERIC DEFAULT 4.9,
    target_year TEXT DEFAULT 'TARGET 2026',
    schedule TEXT,
    students_enrolled INTEGER DEFAULT 0,
    seats_left INTEGER DEFAULT 25,
    price NUMERIC NOT NULL DEFAULT 0,
    original_price NUMERIC DEFAULT 0,
    checklist JSONB DEFAULT '[]'::jsonb,
    book_kit JSONB DEFAULT '{}'::jsonb,
    curriculum JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'published',
    is_featured BOOLEAN DEFAULT false,
    start_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read batches" ON public.batches
    FOR SELECT TO public USING (true);

-- ================================================================
-- 2. Books and Physical Store Catalog
-- ================================================================
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY DEFAULT ('book-' || substr(md5(random()::text), 1, 8)),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT DEFAULT 'JEE Main',
    subject TEXT DEFAULT 'Physics',
    price NUMERIC NOT NULL DEFAULT 0,
    original_price NUMERIC DEFAULT 0,
    rating NUMERIC DEFAULT 4.8,
    reviews_count INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 50,
    format TEXT DEFAULT 'Hardcopy + PDF',
    isbn TEXT,
    pages INTEGER DEFAULT 350,
    thumbnail_url TEXT,
    sample_pdf_url TEXT,
    description TEXT,
    table_of_contents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read books" ON public.books
    FOR SELECT TO public USING (true);

-- ================================================================
-- 3. Book Orders & Dispatch Tracking
-- ================================================================
CREATE TABLE IF NOT EXISTS public.book_orders (
    id TEXT PRIMARY KEY DEFAULT ('ORD-' || to_char(now(), 'YYYY') || '-' || lpad(floor(random()*9000+1000)::text, 4, '0')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT DEFAULT 'Direct Purchase',
    order_date TIMESTAMPTZ DEFAULT now(),
    total_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Processing',
    courier TEXT DEFAULT 'Bluedart Express',
    tracking_number TEXT,
    tracking_link TEXT,
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.book_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own book orders" ON public.book_orders
    FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.book_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT REFERENCES public.book_orders(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES public.books(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    format TEXT,
    download_url TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.book_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own order items" ON public.book_order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.book_orders 
            WHERE book_orders.id = book_order_items.order_id 
            AND book_orders.user_id = (select auth.uid())
        )
    );

-- ================================================================
-- 4. Test Packages & Test Exams Seeding / Schema
-- ================================================================
CREATE TABLE IF NOT EXISTS public.test_packages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    target_exam_tag TEXT DEFAULT 'JEE Main',
    campus_branch TEXT,
    is_featured BOOLEAN DEFAULT false,
    total_tests_count INTEGER DEFAULT 10,
    description TEXT,
    thumbnail_url TEXT,
    test_distribution JSONB DEFAULT '{"chapter_drills": 0, "full_mocks": 0, "live_papers": 0}'::jsonb,
    price_ledger JSONB DEFAULT '{"status": "free", "price": 0, "original_price": 0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.test_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read test packages" ON public.test_packages
    FOR SELECT TO public USING (true);
```

---

## Architectural Recommendations

1. **Eliminate All Client-Side `localStorage` Order/Batch Mock Provisions**:
   - Replace `localStorage.getItem('Asentra_joined_batches')` and `Asentra_book_orders` with true database writes in `/api/razorpay/verify` so orders and enrollments persist in Postgres and are immediately accessible across devices.
2. **Standardize on Next.js Server Components**:
   - Routes like `src/app/courses/page.jsx`, `src/app/batches/page.jsx`, `src/app/books/page.jsx`, `src/app/books/[id]/page.jsx`, and `src/app/books/my-orders/page.jsx` should perform initial data fetches on the server using `createClient()` from `@/utils/supabase/server`. This ensures zero layout shift, ultra-fast initial loads, and SEO indexing.
3. **Question Bank Integration for Test Series**:
   - Ensure the CBT exam engine and grading route (`/api/test-series/grade`) query questions through the junction table `exam_questions` linked to `question_bank`.
4. **Unified Profile & Analytics RPC**:
   - Use `get_student_analytics(student_id)` to compute real stats (accuracy %, total exams taken, recent score trends) rather than static fallback strings.
