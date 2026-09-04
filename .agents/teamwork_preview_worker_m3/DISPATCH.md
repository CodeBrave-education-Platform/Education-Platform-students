# Dispatch: Milestone 3 — AI Vision Parser: End-of-PDF Answer Key Scanning & Diagram Extraction

## Objective
Upgrade the backend AI vision parser pipeline in `d:\admin dashboard` to support multi-subject boundary auto-detection, end-of-PDF answer key matrix scanning, and diagram bounding-box extraction with Supabase Storage upload.

## References & Inputs
- Authoritative User Request: `d:\education portal\ORIGINAL_REQUEST.md` (## 2026-09-04T10:35:58Z § R3)
- Project Architecture & Interfaces: `d:\education portal\PROJECT.md`
- DB & AI Survey Analysis: `d:\education portal\.agents\explorer_survey_db_storage\analysis.md`
- Storage Bucket: `question-papers` configured in `17_test_portal_and_question_paper_documents.sql`

## Files You Own Exclusively
- `d:\admin dashboard\src\app\api\admin\ai\parse-pdf\route.js`
- `d:\admin dashboard\src\app\api\admin\ai\parse-pdf-page\route.js`
- `d:\admin dashboard\src\lib\pdf-vision-parser.js`
- `d:\admin dashboard\src\lib\diagram-cropper.js` (or server/client utilities)

## Implementation Requirements
1. **Multi-Subject Boundary Auto-Detection**:
   - Parse section/subject headers in question papers (e.g. "SECTION 1 - PHYSICS", "PART II - CHEMISTRY", "MATHEMATICS").
   - Automatically identify question ranges (e.g. Q1–30 Physics, Q31–60 Chemistry, Q61–90 Mathematics).
   - If headers are absent, infer subject via question stem context and standard NTA question counts (e.g. 30 questions per subject in JEE Main).
   - Assign each extracted question a valid `subject` (`Physics`, `Chemistry`, `Mathematics`) and section (`Section A`, `Section B`).

2. **End-of-PDF Answer Key Matrix Scanning & Binding**:
   - Support two-pass scanning:
     - Pass 1: Extract all question stems, options, and question types across the document.
     - Pass 2: Detect Answer Key Matrices / tables located on the final pages (e.g. `1: B, 2: D, 3: 45...` or tabular grids `Q.No | Ans | Q.No | Ans`).
   - Parse answer keys for all question types:
     - Single MCQ: option index or letter ('A' -> 0, 'B' -> 1, 'C' -> 2, 'D' -> 3).
     - Multiple MSQ: array of option letters / indices (e.g. "A, C, D" -> `[0, 2, 3]`).
     - Numerical/Integer: numeric values (e.g. "45", "3.5", "-12").
     - Matrix Matching: row-to-column mappings (e.g. "A->P,R; B->Q; C->S; D->P").
   - Re-bind parsed answer keys to their respective questions, updating `correctOptionIdx`, `correctOptions`, `integerAnswer`, `matrixMatchAnswer`.

3. **Diagram Bounding Box Extraction & Storage Integration**:
   - In the multimodal vision prompt (`@google/genai`), instruct Gemini to return diagram bounding boxes `[ymin, xmin, ymax, xmax]` (normalized 0-1000 scale) for questions with diagrams, circuits, geometry, or chemical structures.
   - Implement diagram extraction: crop diagram regions and upload them to Supabase Storage bucket `question-papers` under `diagrams/${Date.now()}_q${qIdx}.png` or upload data URL.
   - Embed the storage `diagram_url` or `image_url` directly in the question payload.

4. **Multi-Format Question Type Classification**:
   - Accurately classify questions into:
     - `single_mcq` (Single correct option)
     - `multi_mcq` (One or more correct options)
     - `numerical` (Integer or decimal answer)
     - `matrix_match` (Column I to Column II matching)

5. **Robustness & Fallback Pipeline**:
   - Ensure the parser handles text-based PDFs via deterministic regex as a fallback when Gemini API keys are absent or rate-limited.
   - Return cleanly formatted payload conforming to the `TestCompiler` input schema:
     ```json
     {
       "title": "...",
       "blueprint_type": "jee_main",
       "subjects": {
         "Physics": [ ...questions ],
         "Chemistry": [ ...questions ],
         "Mathematics": [ ...questions ]
       },
       "total_questions": 90,
       "diagrams_extracted": 12,
       "answer_keys_bound": 90
     }
     ```

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write your 5-component handoff report to `d:\education portal\.agents\teamwork_preview_worker_m3\handoff.md`.

## 2026-09-04T10:53:30Z
You are the AI Vision Parser Worker for Milestone 3.
Your working directory is: d:\education portal\.agents\teamwork_preview_worker_m3
Your detailed task assignment is in: d:\education portal\.agents\teamwork_preview_worker_m3\DISPATCH.md
The authoritative user request is in: d:\education portal\ORIGINAL_REQUEST.md (specifically ## 2026-09-04T10:35:58Z § R3).
The project architecture is in: d:\education portal\PROJECT.md.
The DB & AI Survey analysis is in: d:\education portal\.agents\explorer_survey_db_storage\analysis.md and handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement:
1. Multi-subject boundary auto-detection in /api/admin/ai/parse-pdf pipeline: recognize Physics, Chemistry, Mathematics ranges and assign subject tabs.
2. End-of-PDF Answer Key Matrix parsing: scan final pages, parse answer matrix (single MCQ, multi MSQ, numerical, matrix match), and bind correct keys/options to questions.
3. Diagram bounding box extraction: detect diagram bounding boxes [ymin, xmin, ymax, xmax], crop images, upload to Supabase storage bucket `question-papers`, and bind diagram URLs.
4. Robust fallback handling with deterministic regex when AI keys are unavailable.

Verify your changes, document build results, and write your report to d:\education portal\.agents\teamwork_preview_worker_m3\handoff.md.
When finished, send a message back with your findings and handoff path.
