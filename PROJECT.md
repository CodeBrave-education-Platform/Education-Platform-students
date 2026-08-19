# Project: Global Question Bank Architecture & Cross-Portal Mobile Overhaul

## Architecture
- **Frameworks**:
  - Student Portal: Next.js 16 (React 19, App Router) with Tailwind CSS (`D:\education portal`)
  - Admin Dashboard: Next.js 15/16 (React 19, App Router) with Tailwind CSS (`D:\admin dashboard`)
- **Database & Auth**: Supabase PostgreSQL with PostgREST, `@supabase/ssr`, RLS policies, PostgreSQL triggers, JSON sync backward compatibility
- **Testing**: Playwright test runner (`@playwright/test`)
- **Key Modules**:
  - Central Question Bank (`public.question_bank`)
  - Junction Tables (`public.exam_questions`, `public.assessment_questions`)
  - Student CBT Exam Taking Engine (`src/app/test-series/engine/[examId]`)
  - Admin Question Bank & Test Series Studio (`src/app/admin/questions`, `src/components/test-series/tabs/ExamCompilerTab.jsx`)
  - Responsive Cross-Portal Navigation & Grids (`Navbar.jsx`, `MobileBottomNav.jsx`, `AdminLayoutShell.jsx`, Admin data tables)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Centralized Question Bank Schema | `public.question_bank` table with content, options, correct answers, explanation, subject, tags, difficulty, format, latex/images | M1 | Survey DB |
| 2 | Relational Junction Tables | `public.exam_questions` and `public.assessment_questions` with marks, negative marks, sort order, and section tagging | M1 | Survey DB |
| 3 | Zero-Data-Loss Data Migration | Extract existing questions from `test_exams.questions` and `test_questions` into `question_bank` preserving all original UUIDs for 66 student attempts | M1 | Survey DB |
| 4 | Live Propagation Sync Trigger | PostgreSQL trigger `sync_test_exams_questions_from_bank()` ensuring changes in `question_bank` propagate live to all linked exams & maintain JSON backward compatibility | M1 | Survey DB |
| 5 | Admin Question Bank Studio | CRUD, filtering by subject/tag/difficulty, LaTeX live preview, and search interface in Admin Dashboard (`/admin/questions`) | M2 | Survey Admin |
| 6 | Admin Exam Compiler Junction Integration | Select, assemble, and order questions from `question_bank` into test packages via `exam_questions` junction table (`/admin/test-series`) | M2 | Survey Admin |
| 7 | Admin Data Grids Mobile Degradation | Responsive card layouts for wide tabular data grids (`StudentRelationshipClient`, `InvoiceAuditClient`, `OrderFulfillmentClient`) on mobile screens | M2 | Survey Admin |
| 8 | Admin Mobile Navigation Fixes | Auto-closing mobile sidebar drawer on navigation clicks and responsive toolbar layout in `AdminLayoutShell.jsx` | M2 | Survey Admin |
| 9 | Mobile Bottom Sheet Question Palette | Swipeable, filterable Framer Motion bottom sheet for question jumping on mobile viewports (<1024px) replacing rigid 320px desktop sidebar | M3 | Survey CBT |
| 10 | Ergonomic Option Selection & Multi-Format | Option cards with letter badges (A/B/C/D), tactile active press states, single MCQ, MSQ multi-select, and numerical on-screen keypads | M3 | Survey CBT |
| 11 | Sticky Header & Persistent Timer | 56px sticky top header with compact timer, question status badge, and dropdown menu for tools (calculator, scratchpad, clear) | M3 | Survey CBT |
| 12 | Responsive KaTeX & Image Scaling | Formula containment (`max-w-full overflow-x-auto`) and image scaling to guarantee zero illegal horizontal page scrolling | M3 | Survey CBT |
| 13 | Touch-Enabled HTML5 Scratchpad & Calculator | Canvas supporting touch events (`onTouchStart`, `onTouchMove`, `onTouchEnd`) with high-DPI scaling, and responsive calculator modal | M3 | Survey CBT |
| 14 | Overlay Suppression & Offline Persistence | Hide `MobileBottomNav` and `AIAssistant` on `/test-series/engine/` routes; debounced IndexedDB persistence for offline/reload survival | M3 | Survey CBT |
| 15 | Student Portal Top Navbar Reliability | Gracefully handle missing `user` prop in `Navbar.jsx` so top navigation renders on `/batches`, `/courses`, `/books`, `/policies` | M4 | Survey Admin |
| 16 | Bottom Navigation Spacing Pass | Add `pb-20 md:pb-0` bottom padding across Student Portal pages to prevent content occlusion under `MobileBottomNav` | M4 | Survey Admin |
| 17 | Next.js SSR Hydration Remediation | Guard `localStorage`, `window.navigator`, and localized date formatting against SSR/client mismatches | M4 | Survey Admin |
| 18 | Multi-Viewport E2E Testing & Forensic Audit | Playwright E2E verification across mobile viewports (320px–768px), Question Bank junction updates, build verification, and forensic audit | M5 | Survey QA |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Question Bank & Zero-Loss Migration | SQL migration (`15_question_bank_and_junction_tables.sql`), tables (`question_bank`, `exam_questions`, `assessment_questions`), data extraction of all existing questions with UUID preservation, sync trigger | none | IN_PROGRESS |
| M2 | Admin Dashboard Question Bank & Mobile Grids | Question Bank Studio (`/admin/questions`), Exam Compiler junction linking (`/admin/test-series`), mobile card degradation for student/invoice/order tables, mobile sidebar auto-close | M1 | PLANNED |
| M3 | Student Portal CBT Exam Engine Mobile Overhaul | Mobile bottom sheet question palette, ergonomic option cards with A/B/C/D badges, sticky timer header, touch scratchpad, responsive KaTeX formulas, overlay suppression, IndexedDB auto-save | M1 | PLANNED |
| M4 | Cross-Portal Navigation Polish & Hydration Fixes | `Navbar.jsx` fallback for missing user prop, `pb-20` bottom padding on student pages, SSR hydration mismatch fixes | M2, M3 | PLANNED |
| M5 | E2E Testing, Build Verification & Forensic Audit | Playwright E2E test suite (mobile viewports, Question Bank junction updates, navbar rendering), dual Next.js build verification, forensic audit | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### `public.question_bank`
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `subject` VARCHAR(50) NOT NULL
- `tags` TEXT[] DEFAULT '{}'
- `difficulty` VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard'))
- `type` VARCHAR(20) DEFAULT 'mcq' CHECK (type IN ('mcq', 'multi_mcq', 'numerical', 'matrix_match'))
- `content` TEXT NOT NULL
- `diagram_url` TEXT
- `options` JSONB NOT NULL DEFAULT '[]'::jsonb
- `correct_answer` TEXT NOT NULL
- `explanation` TEXT
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now()

### `public.exam_questions` (Junction Table)
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `exam_id` UUID NOT NULL REFERENCES public.test_exams(id) ON DELETE CASCADE
- `question_id` UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE
- `order_index` INTEGER NOT NULL DEFAULT 1
- `section` VARCHAR(50) DEFAULT 'General'
- `marks_positive` NUMERIC(4,2) DEFAULT 4.00
- `marks_negative` NUMERIC(4,2) DEFAULT 1.00
- UNIQUE(exam_id, question_id)

### `public.assessment_questions` (Junction Table)
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `assessment_id` UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE
- `question_id` UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE
- `order_index` INTEGER NOT NULL DEFAULT 1
- `marks_positive` NUMERIC(4,2) DEFAULT 1.00
- `marks_negative` NUMERIC(4,2) DEFAULT 0.00
- UNIQUE(assessment_id, question_id)

## Code Layout
- `D:\education portal\supabase\migrations\15_question_bank_and_junction_tables.sql`: Central Question Bank & junction SQL migration
- `D:\admin dashboard\src\app\admin\questions\QuestionBankClient.jsx`: Question Bank CRUD Studio
- `D:\admin dashboard\src\components\test-series\tabs\ExamCompilerTab.jsx`: Exam Compiler with junction linking
- `D:\admin dashboard\src\app\admin\students\StudentRelationshipClient.jsx`: Responsive student management with mobile card view
- `D:\admin dashboard\src\app\admin\invoices\InvoiceAuditClient.jsx`: Responsive invoice audit table with mobile card view
- `D:\admin dashboard\src\app\admin\books\orders\OrderFulfillmentClient.jsx`: Responsive order fulfillment table with mobile card view
- `D:\admin dashboard\src\components\AdminLayoutShell.jsx`: Responsive admin sidebar with auto-close on mobile
- `D:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx`: Redesigned mobile CBT Exam taking engine
- `D:\education portal\src\components\navigation\MobileBottomNav.jsx`: Mobile bottom nav with route exclusion on CBT engine
- `D:\education portal\src\components\AIAssistant.jsx`: AI Assistant widget with route exclusion on CBT engine
- `D:\education portal\src\components\KatexRenderer.jsx`: Responsive KaTeX formula wrapper
- `D:\education portal\src\components\Navbar.jsx`: Top navigation with fallback for unauthenticated/prop-less pages
- `D:\education portal\src\app\api\test-series\grade\route.js`: Server-authoritative grading with relational junction support
- `D:\education portal\tests\mobile-cbt-and-qb.spec.js`: Playwright E2E test suite for mobile CBT & Question Bank

