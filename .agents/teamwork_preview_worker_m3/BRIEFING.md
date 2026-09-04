# BRIEFING — 2026-09-04T10:55:00Z

## Mission
Upgrade the backend AI vision parser pipeline in `d:\admin dashboard` to support multi-subject boundary auto-detection, end-of-PDF answer key matrix scanning and binding, and diagram bounding-box extraction with Supabase Storage upload, plus deterministic regex fallbacks.

## 🔒 My Identity
- Archetype: teamwork_preview_worker_m3
- Roles: implementer, qa, specialist
- Working directory: d:\education portal\.agents\teamwork_preview_worker_m3\
- Original parent: ccf11704-6595-45bd-972f-9db7f9ce0932
- Milestone: M3 (AI Vision Parser: End-of-PDF Answer Key Scanning & Diagram Extraction)

## 🔒 Key Constraints
- Genuine implementation with no hardcoding or facade testing.
- Multi-subject boundary auto-detection in /api/admin/ai/parse-pdf pipeline: recognize Physics, Chemistry, Mathematics ranges and assign subject tabs.
- End-of-PDF Answer Key Matrix parsing: scan final pages, parse answer matrix (single MCQ, multi MSQ, numerical, matrix match), and bind correct keys/options to questions.
- Diagram bounding box extraction: detect diagram bounding boxes [ymin, xmin, ymax, xmax], crop images, upload to Supabase storage bucket `question-papers`, and bind diagram URLs.
- Robust fallback handling with deterministic regex when AI keys are unavailable.
- Build must pass in both portals (`npm run build`).

## Current Parent
- Conversation ID: ccf11704-6595-45bd-972f-9db7f9ce0932
- Updated: 2026-09-04T10:55:00Z

## Task Summary
- **What to build**: 
  1. Multi-subject boundary auto-detection in `d:\admin dashboard\src\app\api\admin\ai\parse-pdf\route.js` and `parse-pdf-page\route.js` and supporting utilities.
  2. End-of-PDF Answer Key Matrix parsing and auto-binding (two-pass scanning, support single_mcq, multi_mcq, numerical, matrix_match).
  3. Diagram bounding box extraction and storage upload (Gemini prompt with [ymin, xmin, ymax, xmax], canvas/image crop, upload to Supabase storage `question-papers`, bind `diagram_url`).
  4. Deterministic regex fallback parsing handling multi-subject, matrix match, numericals, and answer keys when Gemini API key is missing.
- **Success criteria**: 
  - Complete two-pass AI vision & regex parsing pipeline with end-of-PDF answer key extraction and binding.
  - Diagram bounding box extraction with storage upload logic and diagram URL binding.
  - Multi-subject contiguous segmentation (Physics, Chemistry, Mathematics) with Section A/B detection.
  - Full test suite passing and Next.js build clean.
- **Interface contracts**: `PROJECT.md` & `d:\education portal\.agents\explorer_survey_db_storage\analysis.md`
- **Code layout**: 
  - `d:\admin dashboard\src\app\api\admin\ai\parse-pdf\route.js`
  - `d:\admin dashboard\src\app\api\admin\ai\parse-pdf-page\route.js`
  - `d:\admin dashboard\src\lib\pdf-vision-parser.js`
  - `d:\admin dashboard\src\lib\diagram-cropper.js`
  - `d:\admin dashboard\src\components\UniversalPdfImporterModal.jsx`

## Change Tracker
- **Files modified**: TBD
- **Build status**: Pending
- **Pending issues**: Investigation of existing implementation

## Quality Status
- **Build/test result**: Pending
- **Lint status**: Pending
- **Tests added/modified**: Pending

## Loaded Skills
- **Source**: `d:\education portal\.agents\skills\supabase\SKILL.md`
- **Local copy**: `d:\education portal\.agents\skills\supabase\SKILL.md`
- **Core methodology**: Storage bucket management, RLS policies, Supabase client initialization in Next.js

## Key Decisions Made
- Implement two-pass parsing architecture: Pass 1 questions extraction, Pass 2 answer key matrix extraction & binding.
- Server-side and client-side diagram cropping & upload support for Supabase Storage bucket `question-papers`.

## Artifact Index
- `d:\education portal\.agents\teamwork_preview_worker_m3\DISPATCH.md`
- `d:\education portal\.agents\teamwork_preview_worker_m3\progress.md`
- `d:\education portal\.agents\teamwork_preview_worker_m3\handoff.md`
