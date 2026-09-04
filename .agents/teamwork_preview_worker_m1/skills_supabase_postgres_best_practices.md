---
name: supabase-postgres-best-practices
description: "Postgres performance optimization and best practices from Supabase."
---
# Supabase Postgres Best Practices
Loaded and followed.
Key rules:
- Index all foreign key columns (package_id, compiled_exam_id, uploaded_by)
- Optimize RLS policies using `(select auth.uid())` subquery
- Use `TO authenticated` or `TO public` clauses
- Explicit column constraints and check enums
