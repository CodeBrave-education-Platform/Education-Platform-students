# Dispatch: Generation 5 Orchestrator Launch

## 2026-09-04T10:37:19Z

Transform the Education Platform's assessment suite into an intuitive, Classplus-grade Test Portal with:
1. R1: Database Migration & Standalone Exam Decoupling (nullable package_id, sections_config JSONB, blueprint_type, question_paper_documents table, question-papers storage bucket).
2. R2: Admin Test Portal & Question Paper PDF Repository (AdminLayoutShell navigation, 2-Tab interface All Tests / PDF Question Papers, drag-and-drop PDF uploader to storage).
3. R3: AI Vision Parser: End-of-PDF Answer Key Scanning & Diagram Extraction (/api/admin/ai/parse-pdf pipeline scanning question pages, parsing answer key matrix on last page, extracting diagram bounding boxes to storage, auto-detecting multi-subject boundaries).
4. R4: Overhauled Visual Exam Compiler & In-Place Editor (JEE Main/Advanced/Custom blueprints, Subject tabs, Section sub-pills, in-place question card expansion with format-specific inputs and KaTeX preview, Export Printable PDF).
5. R5: Student Portal CBT Engine & Discovery (/test-series standalone discovery, CbtEngineClient rendering subject tabs and section pills, format-specific inputs including virtual numpad for integers, Section B attempt limits with live counter).
6. Dual portal builds (npm run build in both d:\admin dashboard and d:\education portal) must succeed.
