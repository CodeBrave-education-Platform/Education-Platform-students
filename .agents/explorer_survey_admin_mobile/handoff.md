# Handoff Report: Admin Dashboard & Cross-Portal Layout Investigation

**Working Directory**: `D:\education portal\.agents\explorer_survey_admin_mobile`  
**Target Repositories**: `D:\admin dashboard` (Admin Dashboard) and `D:\education portal` (Student Portal)  
**Date**: 2026-08-20  
**Handoff Type**: Hard (Investigation & Survey Complete)

---

## 1. Observation

Direct observations from codebase inspection across both repositories:

1. **Question Storage & Decoupling Disconnect**:
   - `D:\admin dashboard\src\app\admin\questions\QuestionBankClient.jsx:27, 140, 150` performs CRUD operations directly on the Supabase `questions` table without any association to `test_packages` or `test_exams`.
   - `D:\admin dashboard\src\components\test-series\tabs\ExamCompilerTab.jsx:95, 213, 300` queries a separate table `test_questions` and serializes compiled exam questions into a static JSONB column `test_exams.questions` (`questions: selectedQuestions`).
   - `D:\education portal\src\app\api\test-series\grade\route.js:24, 34-42` grades student submissions by reading from `test_exams.questions` (JSONB) rather than querying a relational junction table.
   - Modifying a question in the central Question Bank does not propagate updates to existing compiled exams in `test_exams`.

2. **CBT Engine Mobile Layout Degradation**:
   - `D:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx:403, 526` renders the main question panel (`flex-1`) alongside a fixed-width `w-80` Question Palette sidebar without responsive hiding (`hidden lg:flex` or collapsible drawer).
   - On a 375px mobile viewport, the palette claims 320px, crushing the question area to ~55px width.
   - Header at line 332 packs Title, Status Badge, Calculator, Scratchpad, Reset Button, Timer, and Submit button in a single non-wrapping flex row.

3. **Student Portal Navigation Disappearance**:
   - `D:\education portal\src\components\Navbar.jsx:42-44` enforces:
     ```javascript
     if (!user) {
       return null
     }
     ```
   - Six non-CBT pages render `<Navbar />` without passing `user` or `profile` props:
     - `src/app/batches/page.jsx:351`
     - `src/app/courses/page.jsx:326`
     - `src/app/books/page.jsx:135`
     - `src/app/books/my-orders/page.jsx:55`
     - `src/app/books/checkout/page.jsx:108`
     - `src/app/policies/[slug]/page.jsx:127`
   - On these pages, the top navigation header returns `null` and is completely missing for all visitors.

4. **Mobile Navigation Overlay & Padding Clipping**:
   - `D:\education portal\src\components\navigation\MobileBottomNav.jsx:77` is a `fixed bottom-0 left-0 w-full h-16 z-50` bar.
   - Multiple pages (`courses/page.jsx`, `batches/page.jsx`, `books/my-orders/page.jsx`, `profile/page.jsx`) lack `pb-20` or `pb-24` bottom padding, causing page content and footers to be hidden beneath the bottom nav bar.
   - `D:\admin dashboard\src\components\AdminLayoutShell.jsx:63-75` does not close the mobile sidebar drawer upon clicking navigation links.

5. **Data Grids & Table Mobile Overflow**:
   - `D:\admin dashboard\src\app\admin\students\StudentRelationshipClient.jsx:346, 380`: Omnibar search (`w-80`) and table header wrap poorly on small screens; table requires wide horizontal panning without responsive card stacking.
   - `D:\admin dashboard\src\app\admin\invoices\InvoiceAuditClient.jsx:73, 156`: Uses hardcoded dark theme (`bg-slate-950 text-slate-100`) clashing with the light dashboard shell, and 6 wide columns overflow on mobile screens.
   - `D:\admin dashboard\src\app\admin\books\orders\OrderFulfillmentClient.jsx:167`: Physical shipping address column overflows on mobile viewports.

6. **Hydration Mismatches**:
   - `D:\education portal\src\app\dashboard\DashboardClient.jsx:1511` evaluates `typeof window !== 'undefined' && JSON.parse(localStorage.getItem('Asentra_joined_batches') || '[]')` directly during render.
   - `D:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx:97` initializes state with `typeof window !== 'undefined' ? navigator.onLine : true`.
   - `StudentRelationshipClient.jsx:52,72`, `InvoiceAuditClient.jsx:180`, `OrderFulfillmentClient.jsx:193`, and `ExamClient.jsx:516,546` render un-guarded `toLocaleDateString()` and `toLocaleString()` calls during SSR.

---

## 2. Logic Chain

1. **Question Bank Decoupling**:
   - Because `test_exams.questions` is stored as JSONB and `test_questions` is isolated from `questions`, edits in the Question Bank do not update exam instances (Obs 1).
   - *Therefore*, a relational junction table `exam_questions` (linking `exam_id` to `question_id` with `sort_order`, `section`, and marks overrides) is required.
   - *Therefore*, an ETL SQL migration is required to extract all existing questions from `test_exams.questions` JSONB and insert them into `public.questions` with links in `public.exam_questions` to ensure 100% data preservation and instantaneous updates.

2. **Mobile UX Remediation**:
   - Because the CBT exam engine question palette is a static `w-80` sidebar and header elements are un-collapsed (Obs 2), mobile screen real estate is destroyed.
   - *Therefore*, the mobile CBT engine must adopt a mobile-first paradigm: an accessible bottom sheet / collapsible drawer for jumping between questions, tap-friendly option cards, and persistent visible timers.
   - Because `Navbar.jsx` drops when `user` is omitted (Obs 3), and pages lack bottom padding against `MobileBottomNav` (Obs 4), student portal layouts fail on non-CBT pages.
   - *Therefore*, `Navbar.jsx` must either resolve user sessions internally or receive props consistently from all routes, and bottom padding (`pb-20 md:pb-0`) must be applied across all pages.

3. **Data Grid & Table Responsiveness**:
   - Because wide tabular grids break on mobile viewports (Obs 5), all data tables must provide dual rendering: a responsive card/stacked layout on mobile (<640px) and a full table layout on desktop (>=640px).

4. **Hydration Integrity**:
   - Because `localStorage` and client date formatting differ between Node.js SSR and client browsers (Obs 6), client-only data must be deferred to `useEffect` / `mounted` state guards, and date formatting must use standardized utilities.

---

## 3. Caveats

1. **Existing Database State in Production**:
   - Existing production Supabase DB may have rows in `test_exams` with varying JSONB structure. The migration script must defensively handle both JSON strings and JSONB objects with missing fields.
2. **Offline Mode IndexedDB Cache**:
   - If students have existing un-submitted exam states in IndexedDB using the legacy JSON structure, the client engine must defensively map legacy question objects to avoid breaking in-progress attempts.
3. **Third-Party Styling Dependencies**:
   - KaTeX math formula rendering must be wrapped in `overflow-x-auto` to prevent formulas from expanding the container width on narrow mobile viewports.

---

## 4. Conclusion

The investigation confirms that achieving the project goals requires:
1. **Database Migration**: Normalizing `public.questions`, creating `public.exam_questions`, and running a data extraction script to migrate existing JSONB questions.
2. **Admin Studio Upgrade**: Refactoring `QuestionBankClient.jsx` and `ExamCompilerTab.jsx` to manage, tag, search, and link questions via the new junction table.
3. **CBT Engine Redesign**: Rebuilding the mobile experience in `CbtEngineClient.jsx` with a bottom sheet question palette, ergonomic options, compact header, and zero horizontal scroll.
4. **Layout & Hydration Pass**: Resolving `Navbar.jsx` user prop handling, adjusting mobile bottom padding, making data grids responsive on mobile, and eliminating SSR hydration mismatches.

---

## 5. Verification Method

To independently verify these findings:

1. **Inspect Question Bank & Compiler Disconnect**:
   - Open `D:\admin dashboard\src\app\admin\questions\QuestionBankClient.jsx` lines 27 & 150 (inserts into `questions`).
   - Open `D:\admin dashboard\src\components\test-series\tabs\ExamCompilerTab.jsx` lines 95 & 300 (inserts into `test_questions` and `test_exams.questions` JSONB).

2. **Inspect Mobile CBT Engine Layout Breaking**:
   - Open `D:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx` lines 403 & 526 (static side-by-side `w-80` panel without breakpoint).

3. **Inspect Navbar Disappearance on Non-CBT Pages**:
   - Open `D:\education portal\src\components\Navbar.jsx` lines 42-44 (`if (!user) return null`).
   - Open `D:\education portal\src\app\batches\page.jsx` line 351 (`<Navbar />` called without `user` prop).

4. **Verify Table Layout on Mobile**:
   - Open `D:\admin dashboard\src\app\admin\students\StudentRelationshipClient.jsx` lines 346 & 380 (`overflow-x-auto` without mobile card fallback).

5. **Comprehensive Analysis Report**:
   - Full details documented at `D:\education portal\.agents\explorer_survey_admin_mobile\analysis.md`.
