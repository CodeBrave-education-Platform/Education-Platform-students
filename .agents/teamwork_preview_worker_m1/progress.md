# Progress Report - Milestone 1: Database Migration, Storage Bucket & Decoupling

**Last visited**: 2026-09-04T10:53:00Z  
**Status**: COMPLETED  
**Worker**: Database Migration Worker (implementer, qa, specialist)  
**Assigned Milestone**: Milestone 1  

---

## Deliverables Completed

1. **Standalone Exam Decoupling & Schema Enhancements (`test_exams`)**:
   - Dropped `NOT NULL` on `public.test_exams.package_id` to allow tests to exist independently without mandatory test packages.
   - Re-created foreign key constraint with dynamic drop and `ON DELETE SET NULL` (`fk_test_exams_package`).
   - Added `sections_config JSONB NOT NULL DEFAULT '[]'::jsonb`.
   - Added `blueprint_type TEXT NOT NULL DEFAULT 'custom'` with check constraint `('jee_main', 'jee_advanced', 'neet', 'custom')`.
   - Created performance indexes: `idx_test_exams_package_id`, `idx_test_exams_blueprint_type`, and `idx_test_exams_activation`.

2. **Question Paper PDF Documents Table (`public.question_paper_documents`)**:
   - Created table with UUID primary key, title, file_url, file_name, file_size_bytes, subject, target_exam, status with CHECK constraint (`uploading`, `ready_to_compile`, `compiled`, `failed`), compiled_exam_id, uploaded_by, parsed_payload, metadata, and timestamps.
   - Created performance & foreign key indexes: `idx_qpd_status`, `idx_qpd_target_exam`, `idx_qpd_subject`, `idx_qpd_compiled_exam_id`, `idx_qpd_uploaded_by`, `idx_qpd_created_at`.
   - Attached `trg_qpd_updated_at` trigger for automatic timestamp tracking.
   - Enabled Row Level Security (RLS) with Data API grants.
   - Created RLS policies:
     - Public/authenticated read for all users (`Anyone can view question paper documents`).
     - Authenticated staff management for admin/teacher/instructor/superadmin with profile lookup and `(select auth.uid())` subquery optimization.

3. **Supabase Storage Bucket Configuration (`question-papers`)**:
   - Configured bucket `question-papers` in `storage.buckets` with `public = true`, 50MB file size limit (`52428800` bytes), and allowed MIME types (`application/pdf`, `image/png`, `image/jpeg`, `image/webp`).
   - Implemented full storage RLS policies on `storage.objects`:
     - SELECT: Public view (`bucket_id = 'question-papers'`).
     - INSERT: Authenticated upload (`bucket_id = 'question-papers'`).
     - UPDATE: Authenticated update (`bucket_id = 'question-papers'`).
     - DELETE: Authenticated delete (`bucket_id = 'question-papers'`).

4. **Dynamic Seeds & Test Data**:
   - Seeded standalone exams with `package_id = NULL`:
     - `e1000000-0000-0000-0000-000000000010`: NTA JEE Main 2026 Standalone Full Mock Exam 01 (90 Qs, 180 min, blueprint: `jee_main`).
     - `e1000000-0000-0000-0000-000000000011`: JEE Advanced 2026 Comprehensive Master Mock Paper 1 (54 Qs, 180 min, blueprint: `jee_advanced`).
     - `e1000000-0000-0000-0000-000000000012`: JEE Main 2026 Speed & Accuracy Diagnostic Drill (45 Qs, 90 min, blueprint: `jee_main`).
   - Populated standard `sections_config` schemas for Physics, Chemistry, and Mathematics (Section A: 20 MCQs, +4/-1; Section B: 10 Numerical, attempt any 5, +4/0).
   - Seeded sample PDF records in `public.question_paper_documents`:
     - `qpd00000-0000-0000-0000-000000000001`: JEE Main Official Model Paper (`ready_to_compile`).
     - `qpd00000-0000-0000-0000-000000000002`: JEE Main All-India Grand Mock Test 01 (`compiled`, linked to exam `...0010`).
     - `qpd00000-0000-0000-0000-000000000003`: JEE Advanced Physics Intensive Paper (`ready_to_compile`).
     - `qpd00000-0000-0000-0000-000000000004`: NEET Biology Rapid Sprint (`ready_to_compile`).
   - Seeded real test questions (`d1000000-...-0011` to `...0016`) into `public.question_bank` and linked them via `public.exam_questions` and pre-cached `test_exams.questions` JSON.

5. **Cross-Repo Migration Mirroring**:
   - Mirrored migration file byte-for-byte between:
     - `d:\education portal\supabase\migrations\17_test_portal_and_question_paper_documents.sql`
     - `d:\admin dashboard\supabase\migrations\17_test_portal_and_question_paper_documents.sql`
   - Both files verified at exactly 794 lines and 32,098 bytes.
