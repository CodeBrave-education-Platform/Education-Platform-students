# Original User Request

## 2026-08-19T18:28:14Z

Architect a global, independent Question Bank system that integrates seamlessly into Test Packages via robust SQL migrations (ensuring zero data loss of existing questions). Furthermore, perform a massive mobile UI/UX optimization pass across both the Admin and Student portals, completely redesigning the CBT Exam Engine's mobile experience. Resolve any systemic flaws discovered during this architectural shift.

Working directories:
- D:\education portal (Student Portal)
- D:\admin dashboard (Admin Dashboard)

Integrity mode: development

## Requirements

### R1. Global Question Bank & Database Migration
Decouple questions from individual exams. Implement a central  Question Bank in the Admin Dashboard where questions can be created, tagged, and managed independently. 
- Write strict Supabase SQL migrations to create junction tables (e.g., exam_questions).
- **CRITICAL:** Existing hardcoded questions must be cleanly migrated into the new global bank without losing data. 
- Updates to a question in the global bank must instantly reflect in all linked exams.

### R2. CBT Exam Engine Mobile Overhaul (Critical)
Completely redesign the mobile UI/UX of the Student Portal's CBT (Computer Based Testing) Exam Engine. 
- Implement ergonomic, mobile-first paradigms (e.g., a bottom sheet or highly accessible collapsible menu for jumping between questions).
- Ensure highly tap-friendly option buttons, persistent visible timers, and perfectly responsive math/image rendering. Horizontal scrolling is strictly prohibited unless inside a specific math formula block.

### R3. Cross-Portal Mobile Optimization & Flaw Resolution
Audit and optimize both the Admin Dashboard and the Student Portal for mobile viewports (phones and tablets). 
- Navigation sidebars and data grids must degrade gracefully into mobile-friendly menus and cards.
- Actively hunt for and resolve any database logic flaws, constraint errors, or Next.js hydration issues caused by the Question Bank architectural shift.

## Acceptance Criteria

### Functionality & Architecture
- [ ] Running the SQL migration cleanly extracts existing questions into the new global bank and links them via a junction table.
- [ ] Modifying a question in the bank updates it everywhere it is referenced.
- [ ] Adding a new question to the bank and linking it to a test package renders perfectly in the student portal.

### Mobile UI/UX Verification
- [ ] E2E or visual inspection confirms the CBT Exam Engine is flawless on mobile viewports (iPhone/Android dimensions) with ergonomic navigation.
- [ ] Navigation components across both portals function cleanly on small screens without layout breakage.
