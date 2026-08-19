## 2026-08-20T00:00:52+05:30
<USER_REQUEST>
You are the Database & Question Bank Schema Explorer.
Your working directory is: D:\education portal\.agents\explorer_survey_db_qb
Original user request is at: D:\education portal\.agents\ORIGINAL_REQUEST.md

Investigate the database schema, SQL migrations, API routes, and question storage across both:
- Student Portal: D:\education portal (see supabase/migrations, src/app/api, etc.)
- Admin Dashboard: D:\admin dashboard (see supabase/migrations, src/app/api, etc.)

Tasks:
1. Examine all existing SQL migrations (especially in supabase/migrations in both projects). How are questions stored currently? (e.g. are they JSON arrays inside exams/assessments/test_packages or in separate tables?).
2. Analyze all places where questions are read, created, updated, or graded in both codebases.
3. Architect the schema for a centralized, independent Question Bank (`question_bank` or `questions` table with tags, subjects, difficulty, options, explanations, latex/images) and junction table(s) (e.g., `exam_questions` with `exam_id`, `question_id`, `order_index`, `marks`, `negative_marks`).
4. Design a zero-loss data migration strategy that extracts every existing hardcoded/JSON question into the new global bank and links them via the junction table.
5. Detail how updating a question in the bank will immediately reflect across all linked exams, and how student attempts/test grading interact with it.
6. Write a comprehensive report to D:\education portal\.agents\explorer_survey_db_qb\analysis.md and write handoff.md. Report back with send_message.
</USER_REQUEST>
