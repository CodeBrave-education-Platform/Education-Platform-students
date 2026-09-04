# Handoff Report: DB, Storage & AI Backend Survey
**Agent**: DB, Storage & AI Backend Survey Explorer  
**Working Directory**: `d:\education portal\.agents\explorer_survey_db_storage`  
**Date**: 2026-09-04  
**Type**: Hard Handoff (Task Complete)

---

## 1. Observation

1. **Migration State (`d:\education portal\supabase\migrations` & `d:\admin dashboard\supabase\migrations`)**:
   - In `d:\education portal\supabase\migrations\14_test_series.sql:16-27`, `test_exams` was created with `package_id UUID REFERENCES public.test_packages(id) ON DELETE CASCADE`.
   - In `d:\education portal\supabase\migrations\15_question_bank_and_junction_tables.sql:26-54`, `public.question_bank` was created as canonical storage.
   - In `15_question_bank_and_junction_tables.sql:59-70`, `public.exam_questions` junction table was created linking `test_exams(id)` and `question_bank(id)`.
   - In `15_question_bank_and_junction_tables.sql:192-238`, procedure `sync_exam_questions_json_for_exam(target_exam_id UUID)` compiles junction rows into `test_exams.questions` JSONB array.
   - In `16_dynamic_data_and_schema_sync.sql:104-108`, `is_live_ranking`, `activation_timestamp`, and `questions` were added to `test_exams`.
   - In `d:\admin dashboard\supabase\migrations`, only `01_production_rls_security.sql`, `15_question_bank_and_junction_tables.sql`, and `16_dynamic_data_and_schema_sync.sql` exist. Neither repo currently has `sections_config`, `blueprint_type`, or `question_paper_documents`.

2. **Storage Bucket State**:
   - Neither repo's migrations currently define the `question-papers` Supabase storage bucket or its RLS policies on `storage.objects`.
   - `01_production_rls_security.sql:5-56` only hardens table-level RLS (`test_packages`, `test_exams`, `courses`, `batches`, `invoices`), not storage buckets.

3. **Student Test Discovery (`d:\education portal\src\app\test-series\page.js` & `TestSeriesHubClient.jsx`)**:
   - `page.js:52-66` queries `test_exams` dynamically.
   - `TestSeriesHubClient.jsx:594` filters exams strictly by package: `const pkgExams = exams.filter(e => e.package_id === pkg.id)`. Any exam with `package_id: null` is hidden inside the accordion and unreachable without standalone exam decoupling.
   - In `d:\education portal\src\app\test-series\engine\[examId]\page.js:40`, `const isPremium = exam.test_packages?.price_ledger?.status === 'premium'` safely evaluates to `false` when `package_id` is `null`.

4. **AI PDF Parser Architecture (`d:\admin dashboard\src\app\api\admin\ai`)**:
   - Dependencies in `d:\admin dashboard\package.json:13-28`: `@google/genai: ^2.17.1`, `pdfjs-dist: ^3.11.174`, `pdf-parse: ^2.4.5`, `katex: ^0.18.1`.
   - In `parse-pdf/route.js:733-762`, Gemini models are queried in sequence: `['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash']`.
   - In `parse-pdf/route.js:46` and `parse-pdf-page/route.js:41`, `diagram_url: ""` is hardcoded as an empty string. No diagram bounding boxes are extracted or saved to Supabase storage.
   - In `parse-pdf/route.js:319-330`, answer keys are only parsed if printed directly within the individual question block (e.g. `Ans: B`). End-of-PDF answer key matrices on final pages are completely disconnected from earlier questions.
   - In `UniversalPdfImporterModal.jsx:134-165`, the client renders pages one-by-one to an HTML5 `<canvas>` (scale 1.5) and calls `/api/admin/ai/parse-pdf-page`.

---

## 2. Logic Chain

1. **Decoupling Standalone Tests**:
   - *Observation*: `test_exams.package_id` currently has an `ON DELETE CASCADE` foreign key reference to `test_packages(id)`. In `TestSeriesHubClient.jsx:594`, exams are rendered only within package accordions.
   - *Inference*: To make exams first-class standalone entities, `test_exams.package_id` must be made `NULLABLE`, and its FK constraint must be changed to `ON DELETE SET NULL`. This ensures exams are never deleted if a package is removed, and can be discovered independently by students at `/test-series`.

2. **Blueprint & Marking Scheme Parity**:
   - *Observation*: JEE Main and Advanced tests have per-section marking schemes (e.g. +4/-1 for MCQs, +4/0 for Section B Integers, partial marks for MSQs) and optional attempt rules (attempt any 5 of 10 in Section B).
   - *Inference*: Adding `sections_config JSONB NOT NULL DEFAULT '[]'::jsonb` and `blueprint_type TEXT NOT NULL DEFAULT 'custom'` to `test_exams` provides the data contract needed for both the Visual Compiler (`TestCompiler.jsx`), the CBT exam engine (`CbtEngineClient.jsx`), and the server-side grading route (`/api/test-series/grade`).

3. **PDF Document Repository & Storage Tracking**:
   - *Observation*: Requirement R1 and R2 specify uploading raw PDFs to Supabase Storage and managing them in a dedicated repository tab.
   - *Inference*: Creating `public.question_paper_documents` with columns (`id`, `title`, `file_url`, `file_name`, `file_size_bytes`, `subject`, `target_exam`, `status`, `compiled_exam_id`, `created_at`, `updated_at`) and creating the Supabase Storage bucket `question-papers` with RLS policies allows seamless PDF uploads, status tracking ("Ready to Compile" vs "Compiled"), and linking to compiled `test_exams`.

4. **Multi-Subject, Diagram & Answer Key Matrix Extraction (R3)**:
   - *Observation*: `UniversalPdfImporterModal.jsx` already renders each page onto an HTML5 `<canvas>`.
   - *Inference*: Rather than adding heavy server-side image processing libraries, client-side canvas cropping using Gemini bounding box coordinates (`[ymin, xmin, ymax, xmax]`) is lightweight, fast, and zero-risk. Cropped diagram images can be uploaded directly to `question-papers/diagrams/...` in Supabase Storage, and their public URLs embedded into question payloads.
   - *Inference*: An end-of-PDF answer key matrix on the final page can be parsed into a lookup map `{ [qNum]: key }` in a two-pass post-processing step that automatically updates `correct_option_index` and `correct_answer` across all previously extracted questions.

---

## 3. Caveats

1. **Local Database vs Remote Supabase**: This investigation surveyed the migration scripts and source code statically. Applying SQL migrations (`execute_sql` / `supabase db query`) should be verified against the active Supabase instance during execution.
2. **Gemini Rate Limits**: The PDF parser uses `@google/genai` with fallback to multiple models (`gemini-3.7-flash` down to `gemini-2.5-flash`). For multi-page PDFs (e.g., 20+ pages), per-page requests should incorporate slight throttling or concurrency limits to avoid 429 quota exhaustion.
3. **No Direct Project Code Changes**: In accordance with the Explorer archetype rules, no production source code has been modified; all findings, schemas, and recommendations are documented in `analysis.md` and this handoff.

---

## 4. Conclusion

1. Migration `17_test_portal_and_question_paper_documents.sql` is fully designed and ready to be created in both repos. It makes `test_exams.package_id` nullable (`ON DELETE SET NULL`), adds `sections_config` and `blueprint_type`, creates `public.question_paper_documents` with RLS, and sets up bucket `question-papers` with public read and authenticated write/update policies.
2. R3 requirements can be cleanly satisfied without heavy backend dependencies: client-side canvas sub-cropping provides diagram extraction to Supabase storage, a two-pass post-processing function binds end-of-PDF answer key matrices, and question sequence windowing enforces contiguous multi-subject boundaries (Physics Q1–30, Chemistry Q31–60, Mathematics Q61–90).

---

## 5. Verification Method

1. **Schema & Migration Verification**:
   - Inspect `d:\education portal\.agents\explorer_survey_db_storage\analysis.md` Section 2.1 for the complete migration script.
   - Verify SQL syntax against Supabase Postgres best practices (`RLS enabled`, `security_invoker = true` for views, `DROP NOT NULL`, `ON DELETE SET NULL`).
2. **AI Endpoint Verification**:
   - Check `d:\admin dashboard\src\app\api\admin\ai\parse-pdf\route.js` and `parse-pdf-page\route.js` against Section 3.1 & 3.3 in `analysis.md`.
3. **Client Ingestion Verification**:
   - Inspect `d:\admin dashboard\src\components\UniversalPdfImporterModal.jsx` to verify the page-by-page canvas rendering pipeline and how the proposed diagram crop & answer key binding functions integrate.
