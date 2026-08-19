# Project: Education Platform UI Bento Grid Redesign & Database QA Audit

## Architecture
- **Framework**: Next.js 16 (React 19, App Router) with Tailwind CSS
- **Database & Auth**: Supabase PostgreSQL with PostgREST, `@supabase/ssr`, RLS policies, RPC stored procedures
- **Integrations**: Razorpay payment gateway (Server-authoritative HMAC verification), Redis/Upstash session tracking
- **Testing**: Playwright test runner (`@playwright/test`)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Bento Grid Courses Catalog | Modern asymmetrical card-based grid with uncropped 16:9/4:3 thumbnails, hover lift, subject filters, clean typography | M1 | Survey UI |
| 2 | Bento Grid Test Packages Hub | Asymmetrical Bento cards for CBT test series with drill/mock stats, prominent artwork without dark obscuring gradients, expandable exam rosters | M1 | Survey UI |
| 3 | Bento Grid Live Batches Catalog | High-impact cards with batch thumbnails, live badge, seat progress bar, schedule chips, syllabus accordion | M1 | Survey UI |
| 4 | Dashboard Bento & Hydration Fixes | Modern Bento cards in Student/Teacher Dashboard tabs, removal of `|| true` fake enrollment, SSR hydration date fixes | M1 | Survey UI |
| 5 | Tailwind Token Normalization | Fix all invalid Tailwind color tokens (`text-slate-905`, `bg-indigo-650`, `text-emerald-650`, etc.) across all components | M1 | Survey UI |
| 6 | Database Schema Integrity Migration | Create SQL migration fixing FK relations (`courses.instructor_id` -> `profiles`, `invoices.batch_id` -> `batches`), missing columns (`profiles.xp/streak/rank_badge`, `assessments.batch_id/windows`), and `course_files` table | M2 | Survey DB |
| 7 | Next.js API Routes QA Fixes | Align columns (`user_id`/`profile_id`), fix status casing ('ACTIVE' vs 'active'), server-authoritative grading, secure payment onboarding | M2 | Survey DB |
| 8 | Missing RLS Policies & Security | Ensure strict RLS policies on `invoices`, `test_attempts`, `enrollments`, `courses`, `course_files` with service-role webhook bypass | M2 | Survey DB |
| 9 | Simulated Test Submission Verification | Validate `/api/test-series/grade` and Server Action blind grading without FK constraint violations or 500 errors | M3 | Survey QA |
| 10 | Course & Batch Enrollment Verification | Validate `/api/razorpay/verify` and database insertion with invoice creation and profile access | M3 | Survey QA |
| 11 | Bento UI Responsiveness & Hydration E2E | Playwright E2E verification of Bento Grid layout, uncropped thumbnails, viewport breakpoints, and clean console | M3 | Survey QA |
| 12 | Comprehensive QA Bug Summary Documentation | Publish complete Markdown summary `DATABASE_QA_AND_UI_AUDIT_REPORT.md` documenting all audited components, root causes, SQL migrations, and verified fixes | M4 | ORIGINAL_REQUEST §5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Bento Grid UI Redesign | Courses, Test Packages, Batches, Dashboard Bento layout, thumbnail uncropping, Tailwind tokens & hydration fixes | none | DONE |
| M2 | Database Schema & API QA Fixes | SQL migration (14_schema_integrity_and_qa_patch.sql), API route column alignments, RLS policies, query bug fixes | none | DONE |
| M3 | Database Health & E2E Testing Suite | Playwright E2E suites for Bento UI, Test Submissions, Course Enrollments, and database connection health | M1, M2 | DONE |
| M4 | Comprehensive QA Audit Documentation | Full documentation of bugs found, root causes, migrations, code fixes, and empirical test outcomes | M3 | DONE |

## Interface Contracts
### `courses` Table ↔ `profiles` Table
- `courses.instructor_id` UUID REFERENCES `public.profiles(id)` ON DELETE SET NULL
- `courses.status` VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
- `courses.badge` VARCHAR(50)
- `courses.thumbnail_url` TEXT

### `invoices` Table ↔ `batches` & `test_packages`
- `invoices.user_id` UUID REFERENCES `public.profiles(id)` ON DELETE CASCADE
- `invoices.course_id` UUID REFERENCES `public.courses(id)` ON DELETE SET NULL
- `invoices.batch_id` UUID REFERENCES `public.batches(id)` ON DELETE SET NULL
- `invoices.package_id` UUID REFERENCES `public.test_packages(id)` ON DELETE SET NULL
- `invoices.razorpay_order_id` TEXT
- `invoices.razorpay_payment_id` TEXT NOT NULL
- `invoices.amount_paid` NUMERIC(10,2) NOT NULL
- `invoices.currency` VARCHAR(10) DEFAULT 'INR'
- `invoices.status` VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'pending', 'failed', 'refunded'))

### CBT Exam Grading API Contract (`POST /api/test-series/grade`)
- Request Body: `{ examId: string, answers: Record<string, any>, secondsRemaining: number, durationMinutes: number }`
- Output: `{ success: true, score: number, totalMarks: number, percentage: number, correctCount: number, incorrectCount: number, unattemptedCount: number, accuracy: number, attemptId: string, newStreak: number, newXp: number, rankBadge: string }`

### Payment Verification API Contract (`POST /api/razorpay/verify`)
- Request Body: `{ razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string, item_type: 'course'|'batch'|'package'|'book', item_id: string, amount: number, book_id?: string }`
- Output: `{ success: true, message: string, invoice_id: string, item_type: string, item_id: string }`

## Code Layout
- `src/app/courses/page.jsx`: Course catalog page with Bento Grid
- `src/app/test-series/TestSeriesHubClient.jsx`: Test series hub with Bento Grid
- `src/app/batches/page.jsx`: Cohort batches catalog with Bento Grid
- `src/app/dashboard/DashboardClient.jsx`: Student & Instructor dashboard with Bento Grids & hydration safety
- `src/app/api/test-series/grade/route.js`: Server-authoritative CBT grading
- `src/app/api/razorpay/verify/route.js`: Server-authoritative payment verification & onboarding
- `src/app/api/razorpay/order/route.js`: Razorpay order generation
- `supabase/migrations/14_schema_integrity_and_qa_patch.sql`: Schema integrity, FKs, gamification columns, and RLS policies
- `tests/bento-ui.spec.js`: Playwright E2E suite for Bento UI layouts and responsiveness
- `tests/database-health.spec.js`: Playwright E2E suite for Database health, test grading, and enrollments
