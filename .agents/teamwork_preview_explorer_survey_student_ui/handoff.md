# Handoff Report — Student Portal UI & Components Scanner

**Author**: Explorer 1 (`teamwork_preview_explorer_survey_student_ui`)  
**Parent Orchestrator ID**: `59ab231a-b8f9-42bd-b147-b32955fd7afe`  
**Date**: 2026-08-24T18:27:00+05:30  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

Direct code inspections across the Student Portal (`src/app`, `src/components`, `src/utils`, `src/hooks`, `src/app/api`) revealed multiple components and pages relying on static arrays, fallback mock structures, or `localStorage`-only data stores:

1. **`src/app/batches/page.jsx`**:
   - `Lines 16–153`: `DEFAULT_BATCHES` array containing 3 full hardcoded cohorts (`batch-jee-apex-2026`, `batch-neet-aiims-2026`, `batch-foundation-class10`) with hardcoded faculties, checklists, book boxes, and curriculum.
   - `Lines 181–201`: Fallback object mappings when Supabase columns are null.
   - `Lines 205, 209`: Fallbacks used when Supabase query fails or yields empty rows.
   - `Lines 235–240`: Reads joined batches from `localStorage` (`Asentra_joined_batches`).

2. **`src/app/courses/page.jsx`**:
   - `Lines 14–147`: `DEFAULT_COURSES` array containing 5 full hardcoded courses (`course-jee-flagship-2026`, `course-physics-mechanics-pro`, `course-chem-organic-inorganic`, `course-math-calculus-algebra`, `course-neet-biology-physiology`).
   - `Lines 176–187`: Fallback checklists and book kit injected if DB attributes are null.

3. **`src/app/courses/[id]/CourseDetailsClient.jsx`**:
   - `Lines 15–22`: Hardcoded thumbnail fallbacks by level (`foundation`, `mains`, `advanced`).
   - `Lines 175–197`: Auto-provisions mock hardcopy book kit order into browser `localStorage` (`Asentra_book_orders`) upon checkout.

4. **`src/app/books/page.jsx`**:
   - `Lines 21–82`: `sampleBooks` array with 4 hardcoded books.
   - `Line 103`: `setBooks([...sampleBooks, ...formatted])` concatenates static books with database books, ensuring mock books always display.

5. **`src/app/books/[id]/page.jsx`**:
   - `Lines 13–36`: Hardcoded static `book` object (`b1`, `IIT JEE Physics Mastery...`) rendered directly, ignoring `params.id` without querying Supabase.

6. **`src/app/books/checkout/page.jsx` & `src/app/books/my-orders/page.jsx`**:
   - `checkout/page.jsx Lines 30–31, 212`: Hardcoded `bookId: 'book-cart-001'`, price `699`.
   - `my-orders/page.jsx Lines 10–37`: Hardcoded `defaultOrders` array with mock tracking IDs (`ORD-2026-9041`, `ORD-2026-8812`).
   - `my-orders/page.jsx Lines 43–47`: Merges `localStorage` orders with `defaultOrders`.

7. **`src/app/test-series/page.js` & `engine/[examId]/page.js`**:
   - `test-series/page.js Lines 8–69`: `DEFAULT_FALLBACK_PACKAGES` (5 mock test packages).
   - `test-series/page.js Lines 71–153`: `DEFAULT_FALLBACK_EXAMS` (9 mock exams).
   - `test-series/page.js Lines 182–187, 202–207`: Merges fallback packages and exams if database returns < 2 items.
   - `engine/[examId]/page.js Lines 92–167`: Static 6-question fallback CBT paper.

8. **`src/app/dashboard/DashboardClient.jsx` & `src/app/profile/ProfileClient.jsx`**:
   - `ProfileClient.jsx Lines 28–37` / `DashboardClient.jsx`: Static placeholder fallbacks for academic metrics (`'8 Hours'`, `'45%'`, `'82%'`, `'Physics & Calculus'`, `'3 tests/week'`, `'IIT Bombay (Computer Science)'`).

9. **`src/components/landing/LiveTicker.jsx` & `HeroInteractive.jsx`**:
   - `LiveTicker.jsx Line 7`: Static string `"SYSTEM ONLINE • 1,402 ACTIVE STUDENTS • 24 LIVE COHORTS..."`.
   - `HeroInteractive.jsx Lines 12–34, 51–100`: Simulated mock question palette, teacher badge, and chat messages.

10. **`src/components/Navbar.jsx` & `Footer.jsx`**:
    - `Navbar.jsx Lines 145–162`: Hardcoded subjects and featured batch links.
    - `Footer.jsx Lines 84–98`: Hardcoded contact details and placeholder links.

11. **`src/app/api/live/classroom/route.js`**:
    - `Lines 77–93`: Hardcoded 3-question `pollPool` rotated periodically.

12. **`src/app/analytics/page.jsx`**:
    - `Lines 7–9`: Uses standalone `@supabase/supabase-js` without SSR cookie integration.

---

## 2. Logic Chain

1. **Dual-Layer Fallback Anti-Pattern**: Catalog pages (`batches/page.jsx`, `courses/page.jsx`, `test-series/page.js`, `books/page.jsx`) contain hardcoded fallback arrays designed to conceal missing database records or schema mismatches during early development.
2. **Persistence Gaps**: Orders generated on course checkout (`CourseDetailsClient.jsx`) or book store (`books/checkout/page.jsx`) are stored only in client `localStorage` (`Asentra_book_orders`) or rely on hardcoded mock payloads rather than inserting into `public.book_orders` and `public.enrollments`.
3. **Missing Detail Route Queries**: `src/app/books/[id]/page.jsx` does not query the database for the dynamic route parameter, displaying a single hardcoded textbook.
4. **Decoupling Requirement**: The codebase requires:
   - Full SQL seed migrations ensuring `courses`, `batches`, `test_packages`, `test_exams`, and `books` tables are populated.
   - Clean removal of `DEFAULT_*` fallback constants and array concatenation logic.
   - Transition of catalog and detail routes to Server Components using `@/utils/supabase/server`.
   - Wiring of checkout verification handlers (`/api/razorpay/verify`) to insert orders directly into `public.book_orders` and `public.enrollments`.

---

## 3. Caveats

- **Client vs Server Boundary**: Some interactive components (e.g., `CourseDetailsClient.jsx`, `CbtEngineClient.jsx`, `TestSeriesHubClient.jsx`) require client-side state for UI responsiveness (search filters, timer tickers, modal state), but initial data should be loaded via parent Server Components.
- **Hero/Landing Mockups**: Interactive landing mockups (`HeroInteractive.jsx`, `FeatureScroll.jsx`) are educational marketing demos; making them fully dynamic is optional, whereas catalog and learning routes are critical.
- **No Source Code Modified**: In adherence to Explorer read-only guidelines, no source code in `src/` was modified. All analysis is documented in `survey_student_ui_report.md`.

---

## 4. Conclusion

All hardcoded components, placeholder datasets, and missing query points across the Student Portal have been thoroughly mapped and documented with exact file paths, line numbers, schema proposals, and query strategies.

The complete survey report is stored at:  
`d:\education portal\.agents\teamwork_preview_explorer_survey_student_ui\survey_student_ui_report.md`

---

## 5. Verification Method

To verify the findings and file locations independently:
1. **Inspect Batches Fallback**: View `d:\education portal\src\app\batches\page.jsx` lines 16–153 and 181–209.
2. **Inspect Courses Fallback**: View `d:\education portal\src\app\courses\page.jsx` lines 14–147 and 176–194.
3. **Inspect Book Store Fallback**: View `d:\education portal\src\app\books\page.jsx` lines 21–82 and 103, and `d:\education portal\src\app\books\[id]\page.jsx` lines 13–36.
4. **Inspect Test Series Fallback**: View `d:\education portal\src\app\test-series\page.js` lines 8–153 and 182–207.
5. **Inspect Master Report**: View `d:\education portal\.agents\teamwork_preview_explorer_survey_student_ui\survey_student_ui_report.md`.
