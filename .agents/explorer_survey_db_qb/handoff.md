# Handoff Report: Database & Question Bank Schema Architecture

**Handoff Type**: Hard (Investigation Complete)  
**Author**: Database & Question Bank Schema Explorer  
**Working Directory**: `D:\education portal\.agents\explorer_survey_db_qb`  
**Artifacts Generated**:
- `D:\education portal\.agents\explorer_survey_db_qb\analysis.md` (Full Investigation & Architectural Analysis)
- `D:\education portal\.agents\explorer_survey_db_qb\proposed_migration.sql` (Production-Ready Idempotent SQL Migration)

---

## 1. Observation

1. **Storage Discrepancies**:
   - `D:\education portal\supabase\migrations\14_test_series.sql:25`: `test_exams` table contains `questions JSONB NOT NULL DEFAULT '[]'::jsonb`.
   - `D:\education portal\supabase\migrations\14_test_series.sql:30`: `test_questions` table created as a standalone table.
   - `D:\admin dashboard\supabase_schema_migration.sql:330`: `questions` table has `assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE`.
   - Live Supabase audit via `@supabase/supabase-js` (`https://uggatacexipoidzhcjhx.supabase.co`) confirmed:
     - `test_exams`: 2 rows, each containing an array of serialized MCQ objects in `questions` JSONB.
     - `test_questions`: 3 rows.
     - `test_attempts`: 66 completed student attempts. `answers_payload` is a JSON object mapping specific UUID strings (e.g. `"b0000000-0000-0000-0000-000000000001"`, `"6498384f-5ab2-4a92-9858-18e4eb133fbe"`) to selected options.
     - `exam_questions`: Table does not exist (`PGRST205: Could not find the table 'public.exam_questions' in the schema cache`).

2. **Frontend & API Touchpoints**:
   - `D:\admin dashboard\src\app\admin\questions\QuestionBankClient.jsx:27`: Queries `supabase.from('questions')`.
   - `D:\admin dashboard\src\components\test-series\tabs\ExamCompilerTab.jsx:95`: Queries `supabase.from('test_questions')` for pool, but serializes selected questions into `test_exams.questions` at line 300.
   - `D:\education portal\src\app\test-series\engine\[examId]\page.js:29`: Reads `test_exams.questions`, sanitizes it by deleting answer keys, and passes to `CbtEngineClient`.
   - `D:\education portal\src\app\api\test-series\grade\route.js:24`: Server-authoritative blind grading queries `test_exams.questions` and writes scorecard to `test_attempts`.
   - `D:\education portal\src\app\test-series\analytics\[attemptId]\page.js:28`: Reads `test_attempts` joined with `test_exams` to render questions and explanations.

---

## 2. Logic Chain

1. **Step 1 (Root Cause of Desynchronization)**: Because `test_exams` stores questions as an embedded JSON snapshot (`test_exams.questions`), updating a question in either `test_questions` or `questions` does not propagate to existing exams.
2. **Step 2 (Data Loss Vulnerability)**: 66 existing student attempts in `test_attempts` rely on `answers_payload` keys that match the exact UUIDs inside `test_exams.questions`. Generating new random UUIDs during migration would break historical scorecard lookups.
3. **Step 3 (Schema Solution)**: Creating a canonical `public.question_bank` table and a junction table `public.exam_questions(exam_id, question_id, order_index, section, marks_positive, marks_negative)` provides a normalized, single source of truth.
4. **Step 4 (Zero-Downtime / Zero-Breaking Sync Trigger)**: By attaching an `AFTER INSERT OR UPDATE OR DELETE` PostgreSQL trigger on `exam_questions` and `question_bank` that automatically reconstructs the `test_exams.questions` JSON column, existing Next.js frontend pages and grading routes continue functioning without breaking while transitioning to direct relational joins.
5. **Step 5 (Historical Attempt Isolation)**: Attempt scores in `test_attempts` are permanently persisted at submission time. Displaying updated solutions from `question_bank` in the analytics view improves explanation clarity without corrupting historical scores.

---

## 3. Caveats

1. **Local Test Environment vs Production Supabase**: Both local `.env.local` files point to remote Supabase project `uggatacexipoidzhcjhx`. The migration script `proposed_migration.sql` is strictly idempotent (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE`), but executing it on production should follow standard backup precautions.
2. **Multi-Format Scoring Rules**: For `multi_mcq` and `matrix_match` questions, grading logic in `/api/test-series/grade/route.js` must handle array comparison in addition to integer index comparisons.

---

## 4. Conclusion

The Question Bank must be restructured into:
1. `public.question_bank`: Master repository for all MCQs across Test Series & LMS Courses.
2. `public.exam_questions`: Many-to-many junction linking test exams to question bank items.
3. `public.assessment_questions`: Many-to-many junction linking LMS course assessments to question bank items.
4. Migration script `proposed_migration.sql` extracts all 7 existing unique questions from `test_exams` and `test_questions` into `question_bank` while preserving all original UUIDs, ensuring zero data loss across all 66 student attempts.

---

## 5. Verification Method

To independently verify the schema and data migration:

1. **Dry-Run & Verification Node Script**:
   Run the verification script to inspect table counts before and after migration:
   ```bash
   node "D:\education portal\.agents\explorer_survey_db_qb\check_db_tables.js"
   ```
2. **Supabase Schema Verification**:
   Verify that `question_bank` and `exam_questions` tables exist and return rows:
   ```sql
   SELECT count(*) FROM public.question_bank;
   SELECT eq.exam_id, qb.subject, qb.content 
   FROM public.exam_questions eq 
   JOIN public.question_bank qb ON qb.id = eq.question_id;
   ```
3. **End-to-End Grade API Test**:
   POST to `http://localhost:3000/api/test-series/grade` with a valid `examId` and `answers` payload; verify that `test_attempts` records are created and scores match expected values.
