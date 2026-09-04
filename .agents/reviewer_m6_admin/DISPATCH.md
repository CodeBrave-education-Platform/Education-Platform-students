# Dispatch: Reviewer 1 (Admin Portal & Compiler Review)

## Objective
Independently review, test, and verify all Admin Dashboard deliverables for Requirements R1, R2, R3, and R4.

## Scope & Verification Invariants
1. Run `npm run build` in `d:\admin dashboard` and verify 0 type or lint errors.
2. Inspect `d:\admin dashboard\src\components\AdminLayoutShell.jsx` & `CommandPalette.jsx`: confirm "Test Portal" navigation item (`href: /admin/test-series`, `icon: Layers`) and verify ZERO references to "Free Material".
3. Inspect `/admin/test-series/page.js`, `TestPortalTabs.jsx`, `AllTestsTable.jsx`, `PdfQuestionPaperGrid.jsx`: verify 2-Tab interface, standalone exam listing, drag-and-drop PDF uploader, and 1-click compile action.
4. Inspect `/api/admin/ai/parse-pdf`: verify multi-subject boundary auto-detection, end-of-PDF answer key matrix scanning, and diagram bounding box cropping to Supabase storage.
5. Inspect `TestCompiler.jsx`, `QuestionCardInPlaceEditor.jsx`, `PrintableExamBookletModal.jsx`: verify JEE Main/Advanced/Custom blueprints, subject tabs, section sub-pills, in-place expandable question cards with KaTeX preview, format-specific inputs (Integer, Matrix Match, MSQ), and 2-column Printable PDF booklet exporter.

Deliver an explicit verdict in your handoff report: `APPROVE` or `REQUEST_CHANGES`.
Write your report to `d:\education portal\.agents\reviewer_m6_admin\handoff.md`.
