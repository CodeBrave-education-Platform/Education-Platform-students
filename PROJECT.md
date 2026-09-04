# Project: Classplus-Grade Test Portal & AI Assessment Engine

## Architecture
- **Frameworks**:
  - Student Portal: Next.js 16 (React 19, App Router) with Tailwind CSS (`d:\education portal`)
  - Admin Dashboard: Next.js 15/16 (React 19, App Router) with Tailwind CSS (`d:\admin dashboard`)
- **Database & Storage**:
  - Supabase PostgreSQL with Row Level Security (RLS)
  - Supabase Storage Bucket: `question-papers` (public read, authenticated write)
  - Migration: `17_test_portal_and_question_paper_documents.sql` synced across both portals
- **AI Vision Pipeline**:
  - Multimodal Gemini Vision (`@google/genai`) with fallback chain
  - Canvas bounding-box diagram crop & upload to Supabase Storage
  - End-of-PDF Answer Key Matrix parser (two-pass matching)
  - Multi-subject boundary detection (Physics, Chemistry, Maths)
- **Key Modules**:
  1. Standalone Exam Decoupling (`package_id` nullable, `sections_config`, `blueprint_type`)
  2. Question Paper Documents Repository & Storage Bucket
  3. Admin Test Portal 2-Tab Navigation (`All Tests` & `PDF Question Papers`)
  4. AI Vision Parser with Answer Key & Diagram Extraction
  5. Overhauled Visual Exam Compiler with JEE Blueprints & In-Place KaTeX Editor
  6. Student Standalone CBT Engine & Discovery with Section B Attempt Enforcement

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Supabase Migration `17_test_portal_and_question_paper_documents.sql` | Drop NOT NULL on `test_exams.package_id`, add `sections_config` (JSONB) and `blueprint_type` (TEXT) | M1 | Survey DB |
| 2 | Table `public.question_paper_documents` | Create document management table with metadata, RLS, indexes, and compilation status | M1 | Survey DB |
| 3 | Storage Bucket `question-papers` | Create Supabase storage bucket with public read & authenticated write RLS policies | M1 | Survey DB |
| 4 | Rich Standalone Seeds | Dynamic seed rows for standalone JEE tests and sample question paper documents | M1 | Survey DB |
| 5 | Admin Navigation Overhaul | Update `AdminLayoutShell.jsx` & `CommandPalette.jsx` from "Test Packages" to "Test Portal", eliminate "Free Material" | M2 | Survey Admin |
| 6 | Admin `/admin/test-series` 2-Tab Interface | Tab 1 "All Tests" direct table, Tab 2 "PDF Question Papers" repository with badges & preview | M2 | Survey Admin |
| 7 | Drag-and-Drop PDF Uploader | Direct PDF upload to `question-papers` bucket with progress bar and document record creation | M2 | Survey Admin |
| 8 | AI Vision Multi-Subject Boundary Detection | Auto-segment questions into Physics, Chemistry, and Mathematics based on headers and numbering | M3 | Survey DB |
| 9 | AI Vision End-of-PDF Answer Key Matrix Parsing | Scan final pages, parse answer matrix, and bind correct keys/options to extracted questions | M3 | Survey DB |
| 10 | AI Vision Diagram Extraction & Storage Upload | Extract bounding boxes `[ymin, xmin, ymax, xmax]`, crop images, upload to storage, bind URLs | M3 | Survey DB |
| 11 | Visual Exam Compiler Blueprints & Subject Tabs | One-click JEE Main/Advanced/Custom blueprints, Physics/Chemistry/Maths tabs, Section pills | M4 | Survey Admin |
| 12 | In-Place Question Card Editor with KaTeX | Expandable question cards with format-specific inputs (Integer, Matrix Match, MSQ) and live KaTeX | M4 | Survey Admin |
| 13 | Export Printable PDF Booklet | Clean 2-column offline question paper booklet with instructions and answer key sheet | M4 | Survey Admin |
| 14 | Student Standalone Test Discovery | Decouple `/test-series` from packages; direct mock test catalog with blueprint/subject filters | M5 | Survey Student |
| 15 | Student CBT Engine Navigation Strip | Top-level Subject tabs and Section pills with live answered counters in `CbtEngineClient.jsx` | M5 | Survey Student |
| 16 | Format-Specific CBT Inputs | On-screen virtual numpad for integers, clickable 4x4 matrix grid, and square checkboxes for MSQ | M5 | Survey Student |
| 17 | JEE Section B Attempt Enforcement | Live counter `"Section B: X / 5 answered"`, attempt cap modal blocker, and server grading support | M5 | Survey Student |
| 18 | Dual Portal Build & Forensic Verification | `npm run build` zero-error build in both portals, multi-agent review, challenger stress tests, clean audit | M6 | Survey QA |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Migration, Storage Bucket & Decoupling | Migration `17_test_portal_and_question_paper_documents.sql`, table `question_paper_documents`, bucket `question-papers`, nullable `package_id`, `sections_config`, `blueprint_type`, seeds | none | DONE |
| M2 | Admin Test Portal & Question Paper PDF Repository | `AdminLayoutShell` navigation ("Test Portal"), `/admin/test-series` 2-Tab interface, drag-and-drop PDF uploader, 1-click compile trigger | M1 | DONE |
| M3 | AI Vision Parser: Answer Keys & Diagram Extraction | Upgrade `/api/admin/ai/parse-pdf` & `/api/admin/ai/parse-pdf-page` with end-of-PDF answer key matrix scanning, diagram bounding box crop to storage, multi-subject boundaries | M1 | DONE |
| M4 | Visual Exam Compiler & In-Place Editor | `TestCompiler.jsx` overhaul: JEE Main/Advanced blueprints, Subject tabs, Section pills, in-place expandable question cards with KaTeX preview, format inputs, printable PDF | M1, M2 | DONE |
| M5 | Student Portal CBT Engine & Discovery | Standalone test discovery on `/test-series`, `CbtEngineClient` Subject tabs & Section pills, virtual numpad, matrix grid, Section B attempt limits, grading route | M1, M4 | DONE |
| M6 | Dual Portal Build & Forensic Verification | Dual portal Next.js builds (`npm run build` on both portals), Reviewer consensus, Challenger empirical stress tests, Forensic Auditor CLEAN verdict | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts
### `public.test_exams` Schema Additions
- `package_id` UUID NULLABLE REFERENCES public.test_packages(id) ON DELETE SET NULL
- `blueprint_type` TEXT NOT NULL DEFAULT 'custom' CHECK (blueprint_type IN ('jee_main', 'jee_advanced', 'neet', 'custom'))
- `sections_config` JSONB NOT NULL DEFAULT '[]'::jsonb
  - Example:
    ```json
    [
      {
        "id": "sec_phy_a",
        "subject": "Physics",
        "name": "Section A",
        "question_type": "single_mcq",
        "total_questions": 20,
        "max_attempts": 20,
        "positive_marks": 4,
        "negative_marks": -1
      },
      {
        "id": "sec_phy_b",
        "subject": "Physics",
        "name": "Section B",
        "question_type": "numerical",
        "total_questions": 10,
        "max_attempts": 5,
        "positive_marks": 4,
        "negative_marks": 0
      }
    ]
    ```

### `public.question_paper_documents` Table
- `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
- `title` TEXT NOT NULL
- `file_url` TEXT NOT NULL
- `file_name` TEXT NOT NULL
- `file_size_bytes` BIGINT NOT NULL DEFAULT 0
- `subject` TEXT DEFAULT 'Full Syllabus'
- `target_exam` TEXT DEFAULT 'JEE Main'
- `status` TEXT NOT NULL DEFAULT 'ready_to_compile' CHECK (status IN ('uploading', 'ready_to_compile', 'compiled', 'failed'))
- `compiled_exam_id` UUID REFERENCES public.test_exams(id) ON DELETE SET NULL
- `uploaded_by` UUID REFERENCES public.profiles(id) ON DELETE SET NULL
- `parsed_payload` JSONB DEFAULT '{}'::jsonb
- `metadata` JSONB DEFAULT '{}'::jsonb
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### Supabase Storage Bucket: `question-papers`
- Public access: enabled for direct CDN image and PDF delivery
- Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`
- Maximum file size: 50MB (52428800 bytes)

## Code Layout
- `d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql`: Primary Supabase migration
- `d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql`: Admin portal migration mirror
- `d:\admin dashboard\src\components\AdminLayoutShell.jsx`: Admin navigation bar with "Test Portal"
- `d:\admin dashboard\src\app\admin\test-series\page.js`: 2-Tab Test Portal root page
- `d:\admin dashboard\src\components\test-series\TestPortalTabs.jsx`: 2-Tab container (All Tests vs PDF Question Papers)
- `d:\admin dashboard\src\components\test-series\PdfQuestionPaperGrid.jsx`: PDF repository & drag-and-drop uploader
- `d:\admin dashboard\src\components\test-series\AllTestsTable.jsx`: Standalone exams data table
- `d:\admin dashboard\src\components\TestCompiler.jsx`: Visual Exam Compiler & in-place question card editor
- `d:\admin dashboard\src\app\api\admin\ai\parse-pdf\route.js`: Multimodal PDF parsing route with diagram & answer key extraction
- `d:\education portal\src\app\test-series\page.js`: Student standalone mock test discovery catalog
- `d:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx`: Student CBT exam taking engine
- `d:\education portal\src\app\api\test-series\grade\route.js`: Server-side CBT test scoring engine
