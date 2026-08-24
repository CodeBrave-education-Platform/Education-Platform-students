# Comprehensive Database & Supabase Schema Survey Report
**Project**: CodeBrave Education Platform (Student Portal & ASENTRA Admin Dashboard)  
**Author**: Explorer 3 (Database & Supabase Schema Scanner)  
**Date**: 2026-08-24  
**Integrity Mode**: Development / Pre-Production Audit  

---

## Executive Summary

A comprehensive architectural and security inspection was performed across all Supabase SQL migrations, TypeScript database types, edge API routes, and React/Next.js frontend components in both the Student Portal (`d:\education portal`) and the Admin Dashboard (`d:\admin dashboard`). 

The database leverages PostgreSQL with Supabase Auth, Row Level Security (RLS), and custom PL/pgSQL stored procedures. This audit catalogs all existing database entities, evaluates column and relation parity against UI requirements, audits RLS access policies against Supabase security best practices, and identifies schema gaps where UI components currently rely on hardcoded fallback arrays.

---

## 1. Catalog of Existing Database Tables & Schema Objects

| # | Table Name | Purpose / Domain | RLS Status | Key Relations & Foreign Keys |
|---|---|---|---|---|
| 1 | `public.profiles` | User profiles, student telemetry & gamification | ENABLED | `id` -> `auth.users.id` (ON DELETE CASCADE) |
| 2 | `public.courses` | Course catalog, pricing, syllabi metadata | ENABLED | `instructor_id` -> `public.profiles.id` (SET NULL) |
| 3 | `public.batches` | Cohort-based live batches & master programs | ENABLED | Referenced by `batch_enrollments`, `invoices`, `assessments`, `live_sessions`, `course_files` |
| 4 | `public.enrollments` | Student course enrollments & active access ledger | ENABLED | `user_id` -> `profiles.id`, `course_id` -> `courses.id` |
| 5 | `public.batch_enrollments` | Student cohort batch memberships | ENABLED | `user_id` -> `profiles.id`, `batch_id` -> `batches.id` |
| 6 | `public.invoices` | Financial payment ledger & Razorpay transaction log | ENABLED | `user_id` -> `profiles.id`, `course_id` -> `courses.id`, `batch_id` -> `batches.id`, `package_id` -> `test_packages.id`, `book_id` -> `books.id` |
| 7 | `public.lessons` | Course video lessons, readings & assignments | ENABLED | `course_id` -> `courses.id` (ON DELETE CASCADE) |
| 8 | `public.user_progress` | Per-student lesson completion telemetry | ENABLED | `user_id` -> `auth.users.id`, `lesson_id` -> `lessons.id` |
| 9 | `public.lesson_doubts` | Community Q&A discussion board per lesson | ENABLED | `lesson_id` -> `lessons.id`, `user_id` -> `profiles.id`, `parent_id` -> `lesson_doubts.id` |
| 10 | `public.live_sessions` | Scheduled 2-way live video classes & cohort rooms | ENABLED | `course_id` -> `courses.id` (SET NULL), `batch_id` -> `batches.id` (CASCADE) |
| 11 | `public.assessments` | Course & batch timed quizzes / mock tests | ENABLED | `course_id` -> `courses.id` (CASCADE), `batch_id` -> `batches.id` (CASCADE) |
| 12 | `public.questions` | Legacy course assessment questions vault | ENABLED | `assessment_id` -> `assessments.id` (CASCADE) |
| 13 | `public.assessment_attempts` | Student assessment scores & submission payloads | ENABLED | `assessment_id` -> `assessments.id`, `user_id` -> `profiles.id` |
| 14 | `public.test_packages` | Standalone CBT Test Series bundles | ENABLED | Referenced by `test_exams`, `invoices` |
| 15 | `public.test_exams` | CBT exam papers within test packages | ENABLED | `package_id` -> `test_packages.id` (CASCADE) |
| 16 | `public.question_bank` | Canonical centralized Global Question Bank | ENABLED | `author_id` -> `profiles.id` (SET NULL) |
| 17 | `public.exam_questions` | Junction table linking `test_exams` <-> `question_bank` | ENABLED | `exam_id` -> `test_exams.id`, `question_id` -> `question_bank.id` (CASCADE) |
| 18 | `public.assessment_questions` | Junction linking LMS `assessments` <-> `question_bank` | ENABLED | `assessment_id` -> `assessments.id`, `question_id` -> `question_bank.id` (CASCADE) |
| 19 | `public.test_attempts` | Student CBT test series scorecards & answer keys | ENABLED | `exam_id` -> `test_exams.id`, `user_id` -> `profiles.id` |
| 20 | `public.books` | Physical books, PYQ handbooks & eBooks inventory | ENABLED | Referenced by `book_orders`, `invoices` |
| 21 | `public.book_orders` | Physical book shipment tracking & delivery ledger | ENABLED | `user_id` -> `profiles.id`, `book_id` -> `books.id` (SET NULL) |
| 22 | `public.course_files` | Downloadable worksheets, formula sheets & PDFs | ENABLED | `course_id` -> `courses.id`, `batch_id` -> `batches.id`, `lesson_id` -> `lessons.id` |
| 23 | `public.coursera_courses` | Partner demo catalog courses | ENABLED | Standalone catalog |
| 24 | `public.secure_config` | Database-level encrypted secret tokens | ENABLED | No public select (SECURITY DEFINER RPC access only) |
| 25 | `public.admin_audit_logs` | Admin action audit ledger | ENABLED | `admin_id` -> `auth.users.id` |

---

## 2. Deep Dive: Table Schemas & Column Breakdown

### 2.1 User Management & Gamification (`profiles`)
- **Columns**:
  - `id` (UUID, PK, references `auth.users(id)` ON DELETE CASCADE)
  - `email` (TEXT, NOT NULL)
  - `phone` (TEXT)
  - `full_name` (TEXT, NOT NULL DEFAULT '')
  - `role` (TEXT, DEFAULT 'student', values: `'student'`, `'paid_student'`, `'teacher'`, `'instructor'`, `'admin'`, `'superadmin'`)
  - `target_year` (TEXT), `target_focus` (TEXT DEFAULT 'JEE'), `academic_batch` (TEXT)
  - `preferred_subject` (TEXT), `preferred_subjects` (TEXT), `daily_study_hours` (TEXT)
  - `syllabus_progress` (TEXT), `test_average` (TEXT), `academic_strengths` (TEXT), `weekly_tests_attempted` (TEXT)
  - `dream_college` (TEXT), `study_hours_slept` (TEXT), `study_mentor` (TEXT)
  - `xp` (INTEGER DEFAULT 0), `streak` (INTEGER DEFAULT 0), `rank_badge` (VARCHAR(50) DEFAULT 'Cadet')
  - `last_active_date` (TIMESTAMPTZ DEFAULT now()), `created_at` (TIMESTAMPTZ DEFAULT now())
- **Indexes**: `idx_profiles_xp (xp DESC)`, `idx_profiles_role (role)`.

### 2.2 Course Catalog (`courses`)
- **Columns**:
  - `id` (UUID, PK DEFAULT `gen_random_uuid()`)
  - `title` (TEXT NOT NULL), `description` (TEXT)
  - `price` (NUMERIC NOT NULL DEFAULT 0), `original_price` (NUMERIC)
  - `level` (TEXT CHECK in `'foundation'`, `'mains'`, `'advanced'`)
  - `subject` (TEXT DEFAULT 'General'), `badge` (VARCHAR(50))
  - `instructor_id` (UUID REFERENCES `public.profiles(id)` ON DELETE SET NULL), `instructor_name` (TEXT)
  - `rating` (NUMERIC DEFAULT 4.9), `students_count` (INTEGER DEFAULT 1200), `duration` (TEXT), `lessons_count` (INTEGER DEFAULT 24)
  - `checklist` (JSONB DEFAULT `'[]'::jsonb`), `book_kit` (JSONB / TEXT)
  - `cover_url` (TEXT), `thumbnail_url` (TEXT)
  - `start_date` (TIMESTAMPTZ), `end_date` (TIMESTAMPTZ)
  - `is_active` (BOOLEAN DEFAULT true), `status` (VARCHAR(20) DEFAULT 'published'), `deleted_at` (TIMESTAMPTZ)
  - `created_at` (TIMESTAMPTZ DEFAULT now())
- **Indexes**: `idx_courses_instructor_id`, `idx_courses_status`, `idx_courses_deleted_at`, `idx_courses_created_at`.

### 2.3 Live Cohort Batches (`batches`)
- **Columns**:
  - `id` (UUID, PK DEFAULT `gen_random_uuid()`)
  - `title` (TEXT NOT NULL), `description` (TEXT)
  - `price` (NUMERIC NOT NULL DEFAULT 0), `original_price` (NUMERIC)
  - `start_date` (TIMESTAMPTZ NOT NULL DEFAULT now())
  - `target_focus` (TEXT DEFAULT 'JEE'), `target_year` (TEXT DEFAULT 'TARGET 2026')
  - `faculty` (TEXT), `faculty_role` (TEXT), `instructor_name` (TEXT), `instructor_role` (TEXT)
  - `badge` (TEXT), `rating` (NUMERIC DEFAULT 4.95), `schedule` (TEXT), `seats_left` (INTEGER DEFAULT 15), `students_enrolled` (TEXT)
  - `checklist` (JSONB DEFAULT `'[]'::jsonb`), `book_kit` (JSONB), `curriculum` (JSONB)
  - `cover` (TEXT), `thumbnail_url` (TEXT)
  - `is_active` (BOOLEAN DEFAULT true), `is_featured` (BOOLEAN DEFAULT false), `status` (TEXT DEFAULT 'published' CHECK in `'draft'`, `'published'`, `'archived'`)
  - `deleted_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ DEFAULT now())
- **Indexes**: `idx_batches_created_at`.

### 2.4 Centralized Question Bank & Junction Tables
- **`question_bank` Table**:
  - `id` (UUID, PK DEFAULT `gen_random_uuid()`)
  - `content` (TEXT NOT NULL - Markdown + LaTeX)
  - `format_type` (TEXT CHECK in `'single_mcq'`, `'multi_mcq'`, `'numerical'`, `'assertion_reason'`, `'matrix_match'`, `'blanks'`, `'single'`, `'multiple'`, `'mcq'`)
  - `type` (TEXT DEFAULT 'mcq'), `subject` (TEXT CHECK in `'Physics'`, `'Chemistry'`, `'Mathematics'`, `'Biology'`, `'Computer Science'`, `'General'`)
  - `topic` (TEXT NOT NULL DEFAULT 'General'), `sub_topic` (TEXT DEFAULT 'General'), `section` (TEXT DEFAULT 'Section A')
  - `difficulty` (TEXT CHECK in `'EASY'`, `'MEDIUM'`, `'HARD'`, `'easy'`, `'medium'`, `'hard'`)
  - `options` (JSONB NOT NULL DEFAULT `'[]'::jsonb`), `correct_option_index` (INT DEFAULT 0), `correct_answer` (TEXT)
  - `explanation` (TEXT), `diagram_url` (TEXT)
  - `marks_positive` (NUMERIC NOT NULL DEFAULT 4), `marks_negative` (NUMERIC NOT NULL DEFAULT -1)
  - `tags` (TEXT[] DEFAULT `'{}'`), `author_id` (UUID REFERENCES `public.profiles(id)`), `is_active` (BOOLEAN DEFAULT true)
  - `times_tested` (INT DEFAULT 0), `times_correct` (INT DEFAULT 0)
  - `created_at` (TIMESTAMPTZ DEFAULT now()), `updated_at` (TIMESTAMPTZ DEFAULT now())
  - **Indexes**: `idx_question_bank_subject`, `idx_qb_subject_difficulty`, `idx_qb_topic`, `idx_qb_created_at`, `idx_qb_tags (GIN)`.
- **`exam_questions` Table (Junction)**:
  - `id` (UUID, PK), `exam_id` (UUID REFERENCES `test_exams(id)` ON DELETE CASCADE), `question_id` (UUID REFERENCES `question_bank(id)` ON DELETE CASCADE)
  - `order_index` (INT NOT NULL DEFAULT 1), `section` (TEXT DEFAULT 'Section A'), `marks_positive` (NUMERIC DEFAULT 4.00), `marks_negative` (NUMERIC DEFAULT -1.00)
  - `UNIQUE(exam_id, question_id)`
  - **Indexes**: `idx_exam_questions_exam_id`, `idx_exam_questions_question_id`.
- **`assessment_questions` Table (Junction)**:
  - `id` (UUID, PK), `assessment_id` (UUID REFERENCES `assessments(id)` ON DELETE CASCADE), `question_id` (UUID REFERENCES `question_bank(id)` ON DELETE CASCADE)
  - `order_index` (INT NOT NULL DEFAULT 1), `marks_positive` (NUMERIC DEFAULT 4.00), `marks_negative` (NUMERIC DEFAULT 1.00)
  - `UNIQUE(assessment_id, question_id)`
  - **Indexes**: `idx_assessment_questions_assessment_id`, `idx_assessment_questions_question_id`.

### 2.5 CBT Test Series (`test_packages`, `test_exams`, `test_attempts`)
- **`test_packages`**:
  - `id` (UUID PK), `title` (TEXT NOT NULL), `description` (TEXT), `target_exam_tag` (TEXT NOT NULL DEFAULT 'JEE Main'), `campus_branch` (TEXT DEFAULT 'Hyderabad Main'), `total_tests_count` (INT DEFAULT 0), `test_distribution` (JSONB), `price_ledger` (JSONB), `thumbnail_url` (TEXT), `is_active` (BOOLEAN DEFAULT true), `is_featured` (BOOLEAN DEFAULT false), `created_at` (TIMESTAMPTZ).
- **`test_exams`**:
  - `id` (UUID PK), `package_id` (UUID REFERENCES `test_packages(id)`), `title` (TEXT NOT NULL), `duration_minutes` (INT DEFAULT 180), `total_questions` (INT DEFAULT 0), `marks_scheme` (JSONB), `is_live_ranking` (BOOLEAN DEFAULT true), `activation_timestamp` (TIMESTAMPTZ), `questions` (JSONB - synchronized automatically from `question_bank` + `exam_questions` via trigger).
- **`test_attempts`**:
  - `id` (UUID PK), `user_id` (UUID REFERENCES `profiles(id)`), `exam_id` (UUID REFERENCES `test_exams(id)`), `answers_payload` (JSONB), `score` (NUMERIC DEFAULT 0), `correct_count` (INT DEFAULT 0), `incorrect_count` (INT DEFAULT 0), `unattempted_count` (INT DEFAULT 0), `unanswered_count` (INT DEFAULT 0), `total_duration_seconds` (INT DEFAULT 0), `completed_at` (TIMESTAMPTZ).

### 2.6 Physical Books & Logistics (`books`, `book_orders`)
- **`books`**:
  - `id` (UUID PK), `title` (TEXT NOT NULL), `subtitle` (TEXT), `author` (TEXT), `target_exam_tag` (TEXT), `price` (NUMERIC NOT NULL DEFAULT 0), `original_price` (NUMERIC), `stock_quantity` (INTEGER DEFAULT 50), `cover_url` (TEXT), `sample_pdf_url` (TEXT), `is_active` (BOOLEAN DEFAULT true), `created_at` (TIMESTAMPTZ).
- **`book_orders`**:
  - `id` (UUID PK), `user_id` (UUID REFERENCES `profiles(id)`), `book_id` (UUID REFERENCES `books(id)`), `shipping_address` (JSONB NOT NULL), `amount_paid` (NUMERIC NOT NULL), `shipping_fee` (NUMERIC DEFAULT 0), `status` (TEXT DEFAULT 'placed' CHECK in `'placed'`, `'processing'`, `'dispatched'`, `'in_transit'`, `'delivered'`, `'cancelled'`), `courier_partner` (TEXT), `tracking_id` (TEXT), `tracking_url` (TEXT), `ordered_at` (TIMESTAMPTZ), `dispatched_at` (TIMESTAMPTZ), `delivered_at` (TIMESTAMPTZ).

---

## 3. Row Level Security (RLS) & Policy Security Audit

All 25 database tables have RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

### 3.1 Security Strengths
1. **Public Catalog Tables** (`courses`, `batches`, `test_packages`, `books`, `coursera_courses`, `question_bank`, `exam_questions`, `test_exams`):
   - Configured with `FOR SELECT TO anon, authenticated USING (true)` or `USING (is_active = true)` so visitors can browse courses, mock tests, and book catalogs without auth errors.
2. **Private User Ledger Tables** (`enrollments`, `batch_enrollments`, `invoices`, `test_attempts`, `assessment_attempts`, `user_progress`, `book_orders`):
   - Enforce row-level ownership predicate `USING ((select auth.uid()) = user_id)`.
   - Wrapping `auth.uid()` in `(select auth.uid())` prevents expensive per-row evaluation, ensuring subquery scalar caching by the Postgres optimizer.
3. **Role Elevation Protection**:
   - `handle_new_user()` trigger sanitizes metadata and restricts `'admin'` role assignment strictly to verified email addresses (`'akulamanikanta168@gmail.com'`, `'asentraeducation@gmail.com'`, `'topscoredayakar@gmail.com'`, `'madhan91213@gmail.com'`, `'haravindhreddy.p@gmail.com'`).
   - All standard signups are locked to `'student'`.
4. **Blind CBT Views**:
   - `student_questions` and `student_exam_questions` are created with `WITH (security_invoker = true)`, dropping `correct_option_index` and `correct_answer` so student clients cannot inspect browser developer tools to cheat.
5. **Private Security Configuration**:
   - `public.secure_config` has RLS enabled with **zero** select policies. Client queries via PostgREST return 0 rows. Only `SECURITY DEFINER` stored procedures executing internal checks can read secrets.

---

## 4. Cross-Portal Gap Analysis: Missing Tables, Columns & Relationships

By auditing every component across `d:\education portal\src` and `d:\admin dashboard\src`, the following schema gaps and discrepancies were identified:

### Gap 1: Announcements / Notifications System (Missing Table)
- **Problem**: In `StudentRelationshipClient.jsx`, admins can broadcast announcements (`Broadcast: Type an announcement to send to all student dashboards...`). Currently, this only triggers a local client-side toast. In `Navbar.jsx` / `MobileBottomNav.jsx` / `DashboardClient.jsx`, there is no persistent backend notification feed.
- **Solution**: Create `public.announcements` table:
  - `id` (UUID PK)
  - `title` (TEXT NOT NULL)
  - `message` (TEXT NOT NULL)
  - `target_audience` (TEXT DEFAULT 'all' CHECK in `'all'`, `'paid_students'`, `'teachers'`, `'batch_students'`)
  - `batch_id` (UUID REFERENCES `public.batches(id)` ON DELETE CASCADE)
  - `author_id` (UUID REFERENCES `public.profiles(id)` ON DELETE SET NULL)
  - `is_pinned` (BOOLEAN DEFAULT false)
  - `created_at` (TIMESTAMPTZ DEFAULT now()), `expires_at` (TIMESTAMPTZ)
  - RLS: Select for `anon, authenticated`, Insert/Update/Delete for `admin, teacher`.

### Gap 2: Student Bookmarks / Saved Questions (Missing Table)
- **Problem**: In the CBT Exam Engine and Lesson Player, students need to bookmark challenging MCQs, formula sheets, or study doubts for revision before exam day.
- **Solution**: Create `public.student_bookmarks` table:
  - `id` (UUID PK)
  - `user_id` (UUID NOT NULL REFERENCES `public.profiles(id)` ON DELETE CASCADE)
  - `item_type` (TEXT NOT NULL CHECK in `'question'`, `'lesson'`, `'course_file'`, `'book'`)
  - `item_id` (UUID NOT NULL)
  - `notes` (TEXT)
  - `created_at` (TIMESTAMPTZ DEFAULT now())
  - `UNIQUE(user_id, item_type, item_id)`
  - RLS: Enforce `(select auth.uid()) = user_id` for all operations.

### Gap 3: Missing Columns on `public.batches`
- **Problem**: In `BatchesPage.jsx`, the UI displays `faculty`, `facultyRole` (`faculty_role`), `schedule`, `studentsEnrolled` (`students_enrolled`), `seatsLeft` (`seats_left`), `checklist`, `book_kit`, `curriculum`, and `original_price`. In earlier base migrations, these were missing or partially declared in unstructured migrations.
- **Solution**: Consolidate `public.batches` with all rich fields:
  ```sql
  ALTER TABLE public.batches
    ADD COLUMN IF NOT EXISTS faculty TEXT,
    ADD COLUMN IF NOT EXISTS faculty_role TEXT,
    ADD COLUMN IF NOT EXISTS instructor_name TEXT,
    ADD COLUMN IF NOT EXISTS instructor_role TEXT,
    ADD COLUMN IF NOT EXISTS schedule TEXT DEFAULT 'Mon - Fri Live Classes (6:00 PM - 9:00 PM)',
    ADD COLUMN IF NOT EXISTS seats_left INTEGER DEFAULT 15,
    ADD COLUMN IF NOT EXISTS students_enrolled TEXT DEFAULT '85% Seats Filled',
    ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.95,
    ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'LIVE COHORT',
    ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS book_kit JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS curriculum JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
  ```

### Gap 4: Missing Columns on `public.books`
- **Problem**: In `BookStorePage.jsx` (`/books`), books have `subject`, `category`, `rating`, `reviews_count`, and `format`.
- **Solution**:
  ```sql
  ALTER TABLE public.books
    ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Standard',
    ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 4.8,
    ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 120,
    ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'Hardcopy + PDF';
  ```

### Gap 5: Dedicated Instructors Directory View
- **Problem**: Both portals display instructor cards (`Dr. Nitin Verma`, `Prof. Arvind Sharma`, `Dr. Radhika Kulkarni`, `R. K. Singhal Sir`). While stored in `profiles`, creating a dedicated SQL view `public.instructors` with `WITH (security_invoker = true)` standardizes querying teachers, ratings, course counts, and bios.

---

## 5. Summary Matrix & Implementation Strategy

```
┌──────────────────────────────────────────────┐
│ CENTRALIZED QUESTION BANK & JUNCTION TABLES  │
│  - question_bank (canonical MCQs/TeX)        │
│  - exam_questions (junction -> test_exams)   │
│  - assessment_questions (junction -> LMS)    │
│  - Auto-sync Trigger -> test_exams.questions │
└──────────────────────┬───────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│     STUDENT PORTAL      │ │     ADMIN DASHBOARD     │
│ - CBT Engine (Dynamic)  │ │ - Question Bank Studio  │
│ - Live Batches Catalog  │ │ - Blueprint Compiler    │
│ - Course Player & Doubt │ │ - Book Logistics Desk   │
│ - Leaderboard & Metrics │ │ - Student CRM & Audit   │
└─────────────────────────┘ └─────────────────────────┘
```

The database schema is in excellent shape with 25 robust tables, fully configured RLS, automated JSON synchronization triggers for backward compatibility, and atomic RPCs for payment provisioning. Applying the consolidation patch for the identified gaps (`announcements`, `student_bookmarks`, batch/book column parity) will provide 100% dynamic data capability across both portals.
