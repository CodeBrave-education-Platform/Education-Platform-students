# Project: Supabase Dynamic Data Integration & Schema Parity

## Architecture
- **Frameworks**:
  - Student Portal: Next.js 16 (React 19, App Router) with Tailwind CSS (`d:\education portal`)
  - Admin Dashboard: Next.js 15/16 (React 19, App Router) with Tailwind CSS (`d:\admin dashboard`)
- **Database & Auth**: Supabase PostgreSQL, `@supabase/ssr`, `@supabase/supabase-js`, Row Level Security (RLS), Postgres Views & Triggers
- **Key Modules**:
  - Supabase Schema & Sync Migration (`16_dynamic_data_and_schema_sync.sql`)
  - Student Batches, Courses & Book Store Dynamic Data Fetching
  - Student CBT Test Series & Dynamic Question Bank Data Integration
  - Admin Student CRM Real-Time Enrollment CRUD & Announcements Broadcast
  - Admin Dashboard Real-Time Statistics & Dynamic Instructor Assignment
  - Admin Invoices & Test Compiler Dynamic Data Integration

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Supabase Migration `16_dynamic_data_and_schema_sync.sql` | Adds metadata columns to `batches` and `books`, creates `announcements` & `student_bookmarks` with RLS, creates `instructors` view | M1 | Survey DB |
| 2 | Database Seed & Parity Fixtures | Insert comprehensive, realistic dynamic seed rows for `courses`, `batches`, `test_packages`, `test_exams`, and `books` | M1 | Survey DB |
| 3 | Student Batches Dynamic Integration | Remove `DEFAULT_BATCHES` in `src/app/batches/page.jsx`, query `public.batches` via SSR, eliminate local fallback arrays | M2 | Survey Student |
| 4 | Student Courses & Detail Integration | Remove `DEFAULT_COURSES` in `src/app/courses/page.jsx` & `CourseDetailsClient.jsx`, wire real enrollment creation on checkout | M2 | Survey Student |
| 5 | Student Books & Orders Dynamic Integration | Remove `sampleBooks` and `defaultOrders` in `src/app/books/**`, query `public.books` and `public.book_orders`, insert real orders | M2 | Survey Student |
| 6 | Student Test Series Dynamic Integration | Remove `DEFAULT_FALLBACK_PACKAGES` and `DEFAULT_FALLBACK_EXAMS` in `test-series/page.js` and `engine/[examId]/page.js`, query Supabase | M2 | Survey Student |
| 7 | Student Dashboard & Profile Dynamic Telemetry | Replace hardcoded placeholder strings in `DashboardClient.jsx` and `ProfileClient.jsx` with dynamic user progress & attempt queries | M2 | Survey Student |
| 8 | Admin Student CRM Real Enrollment CRUD | Wire real `INSERT` and `DELETE` on `public.enrollments` in `StudentRelationshipClient.jsx`, join `enrollments` table for enrolled courses | M3 | Survey Admin |
| 9 | Admin Announcement Broadcast Integration | Persist admin broadcast announcements to `public.announcements` table with RLS | M3 | Survey Admin |
| 10 | Admin Dashboard KPI Metrics & Instructor Assignment | Dynamic calculation of growth metrics in `AdminDashboardClient.jsx`, add dynamic instructor dropdown in `CourseCreateModal.jsx` | M3 | Survey Admin |
| 11 | Admin Invoices & Test Compiler Cleanup | Remove hardcoded fallback IDs in `InvoiceAuditClient.jsx`, eliminate dummy fallback questions in `TestCompiler.jsx` | M3 | Survey Admin |
| 12 | Cross-Portal Verification & Forensic Integrity Audit | Multi-agent build verification (`npm run build` on both portals), adversarial testing, RLS audit, and agent-as-judge verification | M4 | Survey QA |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Supabase Database Schema & Migrations | Migration `16_dynamic_data_and_schema_sync.sql`, tables (`announcements`, `student_bookmarks`), view (`instructors`), batch/book columns, RLS policies & foreign keys, rich database seeds | none | DONE |
| M2 | Student Portal Dynamic Data Integration | Batches, courses, books, book orders, test series, dashboard & profile dynamic Supabase fetching, eliminating all `DEFAULT_*` arrays | M1 | DONE |
| M3 | Admin Dashboard Dynamic Data Integration | Student CRM real enrollment CRUD, announcement persistence, dynamic KPI calculations, instructor dropdown, invoice dynamic rendering | M1 | DONE |
| M4 | Cross-Portal Build Verification & Forensic Integrity Audit | Dual Next.js build validation, reviewer verification, challenger stress tests, and forensic auditor integrity verification | M1, M2, M3 | DONE |


## Interface Contracts
### `public.batches`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `name` TEXT NOT NULL
- `description` TEXT
- `faculty` TEXT
- `faculty_role` TEXT
- `instructor_name` TEXT
- `instructor_role` TEXT
- `target_year` TEXT DEFAULT 'TARGET 2026'
- `schedule` TEXT
- `seats_left` INTEGER DEFAULT 15
- `students_enrolled` TEXT
- `price` NUMERIC NOT NULL DEFAULT 0
- `original_price` NUMERIC DEFAULT 0
- `rating` NUMERIC DEFAULT 4.95
- `badge` TEXT DEFAULT 'FLAGSHIP LIVE COHORT'
- `checklist` JSONB DEFAULT '[]'::jsonb
- `book_kit` JSONB DEFAULT '{}'::jsonb
- `curriculum` JSONB DEFAULT '[]'::jsonb
- `is_featured` BOOLEAN DEFAULT false
- `is_active` BOOLEAN DEFAULT true

### `public.books`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `title` TEXT NOT NULL
- `author` TEXT NOT NULL
- `subject` TEXT DEFAULT 'General'
- `category` TEXT DEFAULT 'Standard'
- `price` NUMERIC NOT NULL DEFAULT 0
- `original_price` NUMERIC DEFAULT 0
- `rating` NUMERIC DEFAULT 4.8
- `reviews_count` INTEGER DEFAULT 120
- `format` TEXT DEFAULT 'Hardcopy + PDF'
- `cover_image_url` TEXT
- `stock` INTEGER DEFAULT 50

### `public.announcements`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `title` TEXT NOT NULL
- `message` TEXT NOT NULL
- `target_audience` TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'paid_students', 'teachers', 'batch_students'))
- `batch_id` UUID REFERENCES public.batches(id) ON DELETE CASCADE
- `author_id` UUID REFERENCES public.profiles(id) ON DELETE SET NULL
- `is_pinned` BOOLEAN NOT NULL DEFAULT false
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### `public.student_bookmarks`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `user_id` UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
- `item_type` TEXT NOT NULL CHECK (item_type IN ('question', 'lesson', 'course_file', 'book'))
- `item_id` UUID NOT NULL
- `notes` TEXT
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- UNIQUE (user_id, item_type, item_id)

## Code Layout
- `d:\education portal\supabase\migrations\16_dynamic_data_and_schema_sync.sql`: Dynamic schema enhancements, tables, views, RLS policies, and seed data
- `d:\admin dashboard\supabase\migrations\16_dynamic_data_and_schema_sync.sql`: Admin portal migration mirror
- `d:\education portal\src\app\batches\page.jsx`: Student Batches catalog (100% dynamic SSR)
- `d:\education portal\src\app\courses\page.jsx`: Student Courses catalog (100% dynamic SSR)
- `d:\education portal\src\app\courses\[id]\CourseDetailsClient.jsx`: Dynamic course details & real enrollment checkout
- `d:\education portal\src\app\books\page.jsx`: Student Book Store (100% dynamic SSR)
- `d:\education portal\src\app\books\[id]\page.jsx`: Dynamic book details SSR
- `d:\education portal\src\app\books\my-orders\page.jsx`: Dynamic student book orders SSR
- `d:\education portal\src\app\test-series\page.js`: Dynamic Test Series & Exam catalog
- `d:\admin dashboard\src\app\admin\students\StudentRelationshipClient.jsx`: Admin Student CRM with real `enrollments` CRUD
- `d:\admin dashboard\src\components\AdminDashboardClient.jsx`: Admin Dashboard with dynamic growth & live session telemetry
- `d:\admin dashboard\src\components\courses\CourseCreateModal.jsx`: Dynamic instructor assignment dropdown
- `d:\admin dashboard\src\app\admin\invoices\InvoiceAuditClient.jsx`: Dynamic invoice audit data grid


