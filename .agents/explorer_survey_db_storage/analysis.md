# Technical Survey & Architecture Analysis: DB, Storage & AI Vision Backend
**Target Projects**: `d:\education portal` (Student Portal) & `d:\admin dashboard` (Admin Dashboard)  
**Date**: 2026-09-04  
**Explorer Archetype**: DB, Storage & AI Backend Survey Explorer  
**Artifact Path**: `d:\education portal\.agents\explorer_survey_db_storage\analysis.md`

---

## Executive Summary

This survey analyzes the current database schema, Supabase migration state, storage bucket architecture, and AI PDF parsing pipeline across both the Student Portal (`d:\education portal`) and the Admin Dashboard (`d:\admin dashboard`). 

Key findings:
1. **Migration & Schema Baseline**: The database currently relies on `14_test_series.sql`, `15_question_bank_and_junction_tables.sql`, and `16_dynamic_data_and_schema_sync.sql`. `test_exams.package_id` currently references `test_packages(id) ON DELETE CASCADE`. Standalone tests require making `package_id` nullable and updating the constraint to `ON DELETE SET NULL`.
2. **Missing Assessment Columns & Entities**: `public.test_exams` lacks `sections_config` (JSONB) and `blueprint_type` (TEXT). The table `public.question_paper_documents` does not yet exist. The Supabase Storage bucket `question-papers` is not yet created in the SQL migrations.
3. **Current AI PDF Pipeline**: `d:\admin dashboard\src\app\api\admin\ai\parse-pdf\route.js` and `parse-pdf-page\route.js` implement `@google/genai` (v2.17.1) multimodal vision and a 5-stage deterministic regex fallback. However, they only extract inline answer keys printed under questions, hardcode `diagram_url: ""` without cropping or storage uploads, and rely on naive keyword counts for single questions rather than document-level multi-subject boundary detection.
4. **Actionable Roadmap**: Clear specifications for migration `17_test_portal_and_question_paper_documents.sql`, client-side canvas diagram cropping with Supabase storage upload, and a two-pass end-of-PDF answer key matrix parsing engine are detailed below.

---

## 1. Supabase Migrations & Existing Schema Audit

### 1.1 Migration History & Current State

| Migration File | Location(s) | Key Entities & Functions |
|---|---|---|
| `14_test_series.sql` | `d:\education portal\supabase\migrations` | Created `public.test_packages`, `public.test_exams`, `public.test_questions`, `public.test_attempts`. |
| `15_question_bank_and_junction_tables.sql` | Both repos | Created `public.question_bank`, `public.exam_questions`, `public.assessment_questions`, `public.student_exam_questions` view. Added auto-sync trigger `trg_sync_exam_questions` and function `sync_exam_questions_json_for_exam(target_exam_id UUID)`. Backfilled legacy questions into canonical bank. |
| `16_dynamic_data_and_schema_sync.sql` | Both repos | Added metadata columns to `test_packages` (`is_active`, `is_featured`, `campus_branch`, `thumbnail_url`, `description`) and `test_exams` (`is_live_ranking`, `activation_timestamp`, `questions`). |

### 1.2 Current Table Schemas

#### A. `public.test_exams`
```sql
CREATE TABLE public.test_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES public.test_packages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 180,
    total_questions INT NOT NULL DEFAULT 90,
    marks_scheme JSONB NOT NULL DEFAULT '{"positive_marks": 4, "negative_marks": -1}'::jsonb,
    is_live_ranking BOOLEAN NOT NULL DEFAULT false,
    activation_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
*Current limitations*:
- `package_id` has `ON DELETE CASCADE` to `test_packages(id)`. If a package is deleted or missing, exams cannot exist safely as independent entities.
- No `blueprint_type` column (e.g. `'jee_main'`, `'jee_advanced'`, `'neet'`, `'custom'`).
- No `sections_config` column to define section-level rules (e.g., Section A MCQ +4/-1, Section B Numerical +4/0 max 5 attempts out of 10).

#### B. `public.test_packages`
Contains `id`, `title`, `target_exam_tag`, `total_tests_count`, `test_distribution`, `price_ledger`, `is_active`, `is_featured`, `campus_branch`, `thumbnail_url`, `description`, `created_at`.

#### C. `public.question_bank`
Stores canonical question entries. Contains `id`, `content`, `format_type`, `type`, `subject`, `topic`, `sub_topic`, `difficulty`, `section`, `options`, `correct_option_index`, `correct_answer`, `explanation`, `diagram_url`, `marks_positive`, `marks_negative`, `tags`, `author_id`, `is_active`, `times_tested`, `times_correct`, timestamps.

#### D. `public.exam_questions`
Junction table linking `test_exams(id)` and `question_bank(id)`:
```sql
CREATE TABLE public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.test_exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 1,
    section TEXT DEFAULT 'Section A',
    marks_positive NUMERIC DEFAULT 4.00,
    marks_negative NUMERIC DEFAULT -1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exam_question UNIQUE (exam_id, question_id)
);
```
The automated trigger `trg_sync_exam_questions` compiles questions into `test_exams.questions` (JSONB) whenever rows in `exam_questions` are inserted, updated, or deleted.

---

## 2. R1 Schema Specifications & Migration Design

To fulfill requirement R1 ("Database Migration & Standalone Exam Decoupling"), migration `17_test_portal_and_question_paper_documents.sql` must be applied in both repositories:
- `d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql`
- `d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql`

### 2.1 Complete SQL Migration Script (`17_test_portal_and_question_paper_documents.sql`)

```sql
-- ============================================================================
-- ASENTRA EDUCATION PLATFORM - TEST PORTAL & QUESTION PAPER REPOSITORY MIGRATION
-- Migration: 17_test_portal_and_question_paper_documents.sql
-- Requirements: R1 Standalone Exam Decoupling & PDF Repository Tracking
-- ============================================================================

-- Ensure required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DECOUPLE TEST_EXAMS FROM TEST_PACKAGES & ENHANCE BLUEPRINT SCHEMAS
-- ─────────────────────────────────────────────────────────────────────────────

-- Make package_id nullable
ALTER TABLE public.test_exams 
  ALTER COLUMN package_id DROP NOT NULL;

-- Update foreign key constraint to ON DELETE SET NULL instead of CASCADE
ALTER TABLE public.test_exams 
  DROP CONSTRAINT IF EXISTS test_exams_package_id_fkey;

ALTER TABLE public.test_exams
  ADD CONSTRAINT test_exams_package_id_fkey
  FOREIGN KEY (package_id) REFERENCES public.test_packages(id) ON DELETE SET NULL;

-- Add sections_config (JSONB) and blueprint_type (TEXT)
ALTER TABLE public.test_exams
  ADD COLUMN IF NOT EXISTS sections_config JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS blueprint_type TEXT NOT NULL DEFAULT 'custom';

-- Performance index for standalone test queries
CREATE INDEX IF NOT EXISTS idx_test_exams_package_id ON public.test_exams(package_id);
CREATE INDEX IF NOT EXISTS idx_test_exams_blueprint_type ON public.test_exams(blueprint_type);
CREATE INDEX IF NOT EXISTS idx_test_exams_activation ON public.test_exams(activation_timestamp DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CREATE PUBLIC.QUESTION_PAPER_DOCUMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.question_paper_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    subject TEXT NOT NULL DEFAULT 'General',
    target_exam TEXT NOT NULL DEFAULT 'JEE Main',
    status TEXT NOT NULL DEFAULT 'ready_to_compile'
        CHECK (status IN ('uploading', 'ready_to_compile', 'parsing', 'parsed', 'compiled', 'error')),
    compiled_exam_id UUID REFERENCES public.test_exams(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    parsed_payload JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for repository search, filtering, and compiling
CREATE INDEX IF NOT EXISTS idx_qpd_status ON public.question_paper_documents(status);
CREATE INDEX IF NOT EXISTS idx_qpd_target_exam ON public.question_paper_documents(target_exam);
CREATE INDEX IF NOT EXISTS idx_qpd_subject ON public.question_paper_documents(subject);
CREATE INDEX IF NOT EXISTS idx_qpd_compiled_exam_id ON public.question_paper_documents(compiled_exam_id);
CREATE INDEX IF NOT EXISTS idx_qpd_created_at ON public.question_paper_documents(created_at DESC);

-- Attach updated_at trigger if function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS trg_qpd_updated_at ON public.question_paper_documents;
    CREATE TRIGGER trg_qpd_updated_at
      BEFORE UPDATE ON public.question_paper_documents
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ENABLE RLS & DEFINE POLICIES ON QUESTION_PAPER_DOCUMENTS
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.question_paper_documents ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users (admins, teachers, students)
DROP POLICY IF EXISTS "Authenticated users view question paper documents" ON public.question_paper_documents;
CREATE POLICY "Authenticated users view question paper documents"
    ON public.question_paper_documents FOR SELECT
    TO authenticated
    USING (true);

-- Allow full management for admins and teachers
DROP POLICY IF EXISTS "Staff manage question paper documents" ON public.question_paper_documents;
CREATE POLICY "Staff manage question paper documents"
    ON public.question_paper_documents FOR ALL
    TO authenticated
    USING (
      COALESCE(
        ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
        (SELECT role FROM public.profiles WHERE id = auth.uid())
      ) IN ('admin', 'teacher', 'instructor', 'superadmin')
    )
    WITH CHECK (
      COALESCE(
        ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text),
        (SELECT role FROM public.profiles WHERE id = auth.uid())
      ) IN ('admin', 'teacher', 'instructor', 'superadmin')
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CONFIGURE STORAGE BUCKET: QUESTION-PAPERS & RLS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Create or update bucket configuration in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-papers',
  'question-papers',
  true,
  52428800, -- 50 MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS on storage.objects:
-- 4.1 SELECT: Public download and viewing of PDF documents and extracted diagrams
DROP POLICY IF EXISTS "Public view question-papers bucket" ON storage.objects;
CREATE POLICY "Public view question-papers bucket"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'question-papers');

-- 4.2 INSERT: Authenticated users (admin/teacher staff) can upload PDFs and diagrams
DROP POLICY IF EXISTS "Authenticated upload to question-papers bucket" ON storage.objects;
CREATE POLICY "Authenticated upload to question-papers bucket"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'question-papers');

-- 4.3 UPDATE: Authenticated users can update/upsert files
DROP POLICY IF EXISTS "Authenticated update in question-papers bucket" ON storage.objects;
CREATE POLICY "Authenticated update in question-papers bucket"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'question-papers')
    WITH CHECK (bucket_id = 'question-papers');

-- 4.4 DELETE: Authenticated users can delete files
DROP POLICY IF EXISTS "Authenticated delete in question-papers bucket" ON storage.objects;
CREATE POLICY "Authenticated delete in question-papers bucket"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'question-papers');
```

### 2.2 `sections_config` JSONB Schema Specification

To support multi-format JEE Main, JEE Advanced, and custom section grading rules, `test_exams.sections_config` follows a validated array schema:

```json
[
  {
    "id": "phy_sec_a",
    "subject": "Physics",
    "section_name": "Section A",
    "question_type": "single_mcq",
    "description": "20 Multiple Choice Questions with single correct option",
    "total_questions": 20,
    "max_attempts": 20,
    "marks_positive": 4,
    "marks_negative": -1,
    "allow_partial_marking": false
  },
  {
    "id": "phy_sec_b",
    "subject": "Physics",
    "section_name": "Section B",
    "question_type": "numerical",
    "description": "10 Numerical Value Questions (Attempt any 5)",
    "total_questions": 10,
    "max_attempts": 5,
    "marks_positive": 4,
    "marks_negative": 0,
    "allow_partial_marking": false
  },
  {
    "id": "chem_sec_a",
    "subject": "Chemistry",
    "section_name": "Section A",
    "question_type": "single_mcq",
    "total_questions": 20,
    "max_attempts": 20,
    "marks_positive": 4,
    "marks_negative": -1,
    "allow_partial_marking": false
  },
  {
    "id": "chem_sec_b",
    "subject": "Chemistry",
    "section_name": "Section B",
    "question_type": "numerical",
    "total_questions": 10,
    "max_attempts": 5,
    "marks_positive": 4,
    "marks_negative": 0,
    "allow_partial_marking": false
  },
  {
    "id": "math_sec_a",
    "subject": "Mathematics",
    "section_name": "Section A",
    "question_type": "single_mcq",
    "total_questions": 20,
    "max_attempts": 20,
    "marks_positive": 4,
    "marks_negative": -1,
    "allow_partial_marking": false
  },
  {
    "id": "math_sec_b",
    "subject": "Mathematics",
    "section_name": "Section B",
    "question_type": "numerical",
    "total_questions": 10,
    "max_attempts": 5,
    "marks_positive": 4,
    "marks_negative": 0,
    "allow_partial_marking": false
  }
]
```

### 2.3 `blueprint_type` Standard Enums

| Blueprint Tag | Duration | Subjects | Sections per Subject | Total Qs / Attempted Qs | Max Marks |
|---|---|---|---|---|---|
| `jee_main` | 180 min | Physics, Chemistry, Mathematics | Sec A (20 MCQ, +4/-1), Sec B (10 Num, +4/0, max 5) | 90 total / 75 max | 300 |
| `jee_advanced` | 180 min | Physics, Chemistry, Mathematics | Sec 1 (MCQ, +3/-1), Sec 2 (MSQ, +4/-2, partial), Sec 3 (Num, +4/0) | Dynamic (approx 54 total) | Dynamic |
| `neet` | 200 min | Physics, Chemistry, Botany, Zoology | Sec A (35 MCQ, +4/-1), Sec B (15 MCQ, attempt 10, +4/-1) | 200 total / 180 max | 720 |
| `custom` | Flexible | User Defined | Custom sections and marking | Custom | Custom |

---

## 3. Current AI PDF Parsing Pipeline Audit (`d:\admin dashboard`)

### 3.1 Endpoint Architecture & Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   UniversalPdfImporterModal.jsx                          │
│                                                                          │
│ 1. User drops PDF file.                                                  │
│ 2. Client loads PDF.js (v3.11.174) via browser CDN.                      │
│ 3. For pageNum = 1 to totalPages:                                        │
│    - Renders page onto HTML5 <canvas> (scale: 1.5).                      │
│    - Exports canvas.toDataURL('image/jpeg', 0.9).                        │
│    - Calls POST /api/admin/ai/parse-pdf-page (imageBase64).              │
│ 4. Receives extracted question JSON objects from each page.              │
│ 5. Review modal displays questions with KaTeX math formula rendering.     │
│ 6. Ingests into Question Bank or Test Compiler.                          │
└─────────────────────┬───────────────────────────────┬────────────────────┘
                      │                               │
                      ▼                               ▼
       POST /api/admin/ai/parse-pdf-page   POST /api/admin/ai/parse-pdf
       (Single-page JPEG vision)           (Full PDF base64 or Raw Text)
                      │                               │
                      ├───────────────────────────────┤
                      ▼                               ▼
      GoogleGenAI (@google/genai v2.17.1)     Deterministic 5-Stage Regex
      Fallback sequence:                      1. cleanExtractedText
      - gemini-3.7-flash                      2. parseExtractedText (boundaries)
      - gemini-3.6-flash                      3. parseQuestionBlock (options A-D)
      - gemini-3.5-flash                      4. parseAnswerKey & explanation
      - gemini-flash-latest                   5. detectSubject (keyword scoring)
      - gemini-2.5-flash
```

### 3.2 Key Dependencies

- `@google/genai: ^2.17.1` (Google's Gen AI SDK for Node.js).
- `pdfjs-dist: ^3.11.174` (Client-side page rendering to canvas).
- `pdf-parse: ^2.4.5` (Server-side text extraction).
- `katex: ^0.18.1` (Math/formula preview).

### 3.3 Critical Gaps in Current Implementation vs R3

1. **End-of-PDF Answer Key Disconnection**:
   - In competitive exams (JEE, NEET, coaching mocks), questions are on pages 1–15, and the **Answer Key Matrix** is on page 16 (e.g. `Q1: B, Q2: D, Q3: 45...`).
   - Because `UniversalPdfImporterModal` parses page-by-page, questions on pages 1–15 have no answer key printed on their page, so `correct_option_index` defaults to 0. When page 16 is reached, it sees only a table of numbers and letters without question stems, which gets discarded or parsed as corrupted questions.
2. **Missing Diagram Extraction & Storage Upload**:
   - `diagram_url` is hardcoded to `""` in both `parse-pdf/route.js` and `parse-pdf-page/route.js`.
   - Diagrams (geometry, circuits, graphs, organic chemistry structures) are completely ignored. No bounding boxes are extracted, no canvas crops are made, and no files are uploaded to Supabase Storage.
3. **Naive Single-Question Subject Classification**:
   - Currently, subject classification is done via isolated keyword matching on individual questions (`scores[subj] += 2`). If a physics question mentions "matrix" or doesn't match any keyword, it gets tagged as Mathematics.
   - It ignores structural exam headers like `PART I: PHYSICS`, `SECTION 2: CHEMISTRY`, or standard JEE contiguous question ranges (Q1–30, Q31–60, Q61–90).

---

## 4. Technical Recommendations for R3 Implementation

### 4.1 End-of-PDF Answer Key Matrix Parser & Auto-Binding Engine

To solve the end-of-PDF answer key limitation, the pipeline must implement a **Two-Pass Ingestion Strategy**:

```
Pass 1: Parse all pages -> Collect Question Stems (Pages 1..N-1) + Detect Answer Key Pages (e.g. Page N)
Pass 2: Parse Answer Key Matrix into Map -> Post-Process Auto-Binding (Match Q# -> Key/Value)
```

#### Step 1: Detect Answer Key Page
When processing pages in `UniversalPdfImporterModal`:
- Check if page text or vision matches key signatures:
  `/(?:ANSWER\s*KEY|KEY\s*SHEET|ANSWERS|CORRECT\s*OPTIONS|HINTS\s*&\s*SOLUTIONS)/i`
- If an Answer Key signature is found, route that page image/text to a specialized Answer Key Matrix parser.

#### Step 2: Answer Key Matrix Parser Logic
Prompt Gemini or use a high-precision table regex parser to return a normalized key-value map:
```json
{
  "1": "B",
  "2": "D",
  "3": "45",
  "4": "A,C",
  "5": "2.75",
  "6": "A->R; B->P; C->S; D->Q"
}
```

#### Step 3: Binding Algorithm
After all pages have been parsed:
```javascript
export function bindAnswerKeysToQuestions(questions, answerKeyMap) {
  return questions.map((q, idx) => {
    const qNum = q.question_number || (idx + 1);
    const keyEntry = answerKeyMap[String(qNum)] || answerKeyMap[qNum];
    if (!keyEntry) return q;

    const trimmedKey = String(keyEntry).trim();
    const upperKey = trimmedKey.toUpperCase();

    // 1. Single MCQ (A, B, C, D or 1, 2, 3, 4)
    if (/^[A-D]$/.test(upperKey)) {
      const optIdx = upperKey.charCodeAt(0) - 65;
      return {
        ...q,
        formatType: 'single_mcq',
        correct_option_index: optIdx,
        correct_answer: q.options?.[optIdx] || trimmedKey
      };
    } else if (/^[1-4]$/.test(trimmedKey)) {
      const optIdx = parseInt(trimmedKey, 10) - 1;
      return {
        ...q,
        formatType: 'single_mcq',
        correct_option_index: optIdx,
        correct_answer: q.options?.[optIdx] || trimmedKey
      };
    }

    // 2. Multi MSQ (e.g., "A, B", "ACD", "1, 3, 4")
    if (/[,\s]/.test(trimmedKey) || (upperKey.length > 1 && /^[A-D]+$/.test(upperKey))) {
      return {
        ...q,
        formatType: 'multi_mcq',
        correct_answer: trimmedKey
      };
    }

    // 3. Numerical / Integer (e.g., "45", "-12", "3.14")
    if (/^-?\d+(?:\.\d+)?$/.test(trimmedKey)) {
      return {
        ...q,
        formatType: 'numerical',
        options: [],
        correct_answer: trimmedKey
      };
    }

    // 4. Matrix Match
    if (/->|;|\|/.test(trimmedKey)) {
      return {
        ...q,
        formatType: 'matrix_match',
        correct_answer: trimmedKey
      };
    }

    return { ...q, correct_answer: trimmedKey };
  });
}
```

### 4.2 Diagram Bounding Box Extraction & Supabase Storage Pipeline

#### Architecture: Client-Side Canvas Cropping (Zero Server Latency & High Fidelity)

Because `UniversalPdfImporterModal.jsx` already renders each page onto an HTML5 `<canvas>` at 1.5x resolution, the client already has the rasterized high-resolution page in memory.

#### Step 1: Request Diagram Bounding Boxes from Gemini
Update the Gemini prompt schema in `parse-pdf-page/route.js`:
```json
{
  "id": "pdf-q-1",
  "content": "...",
  "has_diagram": true,
  "diagram_box_2d": [ymin, xmin, ymax, xmax], // Normalized 0-1000 coordinates
  "diagram_caption": "Circuit diagram with capacitor C and resistor R"
}
```

#### Step 2: Client-Side Canvas Cropping & Storage Upload
When a question has `has_diagram === true` and `diagram_box_2d`:
```javascript
async function cropAndUploadDiagram(canvas, box2d, docId, qNum, supabase) {
  const [ymin, xmin, ymax, xmax] = box2d; // 0-1000 scale
  const width = canvas.width;
  const height = canvas.height;

  const sx = Math.max(0, Math.floor((xmin / 1000) * width));
  const sy = Math.max(0, Math.floor((ymin / 1000) * height));
  const sWidth = Math.min(width - sx, Math.ceil(((xmax - xmin) / 1000) * width));
  const sHeight = Math.min(height - sy, Math.ceil(((ymax - ymin) / 1000) * height));

  if (sWidth < 20 || sHeight < 20) return '';

  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = sWidth;
  cropCanvas.height = sHeight;
  const ctx = cropCanvas.getContext('2d');
  ctx.drawImage(canvas, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

  // Convert to Blob
  const blob = await new Promise(resolve => cropCanvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) return '';

  const filePath = `diagrams/${docId || 'extracted'}/q_${qNum}_${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('question-papers')
    .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

  if (error) {
    console.warn('[Diagram Upload Error]:', error.message);
    return '';
  }

  const { data: { publicUrl } } = supabase.storage
    .from('question-papers')
    .getPublicUrl(filePath);

  return publicUrl;
}
```

### 4.3 Multi-Subject Boundary Detection

Instead of naive per-question keyword frequency, implement **Contiguous Subject Segmentation**:

1. **Detect Section Headers**:
   Match headers in PDF text or Gemini output:
   - `PART A / SECTION 1 / SUBJECT: PHYSICS` -> Sets current subject to `Physics`.
   - `PART B / SECTION 2 / SUBJECT: CHEMISTRY` -> Sets current subject to `Chemistry`.
   - `PART C / SECTION 3 / SUBJECT: MATHEMATICS` -> Sets current subject to `Mathematics`.
2. **Enforce Contiguous Range Rules**:
   - For JEE Main papers (90 questions):
     - Q1 to Q30 = Physics (Q1-20 Section A MCQ, Q21-30 Section B Numerical)
     - Q31 to Q60 = Chemistry (Q31-50 Section A MCQ, Q51-60 Section B Numerical)
     - Q61 to Q90 = Mathematics (Q61-80 Section A MCQ, Q81-90 Section B Numerical)
   - If an individual question has ambiguous keywords (e.g. a Physics question with a calculus integral), its position inside the Q1–30 block strictly binds it to the **Physics** subject tab.

---

## 5. Integration Plan for R1, R2, R3, R4 & R5

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Database (R1): 17_test_portal_and_question_paper_documents.sql           │
│    - test_exams.package_id NULLABLE (ON DELETE SET NULL)                    │
│    - test_exams.sections_config (JSONB), blueprint_type (TEXT)              │
│    - public.question_paper_documents table + RLS                            │
│    - storage bucket 'question-papers' + RLS for PDF & diagram hosting       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         ▼                                                           ▼
┌─────────────────────────────────────────┐ ┌─────────────────────────────────┐
│ 2. Admin Test Portal (R2 & R4)          │ │ 3. Student CBT Engine (R5)      │
│ - AdminLayoutShell: "Test Portal" nav   │ │ - Standalone test discovery     │
│ - Tab 1: All Tests (direct standalone)  │ │   at /test-series without       │
│ - Tab 2: PDF Question Papers repository │ │   mandatory package purchase    │
│ - Drag & drop PDF uploader to storage   │ │ - Section B attempt enforcement │
│ - AI Parser (R3): End-of-PDF key matrix │ │   (max 5 of 10 answered)        │
│   matching + diagram bounding boxes     │ │ - Virtual keypad for integers   │
│ - TestCompiler: In-place KaTeX cards,   │ │ - Formula/diagram KaTeX display │
│   blueprint selector, printable export  │ │                                 │
└─────────────────────────────────────────┘ └─────────────────────────────────┘
```

This analysis provides the complete architectural foundation for implementing R1 and R3.
