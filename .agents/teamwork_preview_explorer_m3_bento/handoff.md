# Handoff Report: Bento Grid UI E2E Testing Specifications (Milestone 3)

## 1. Observation
We conducted a comprehensive read-only code audit and layout analysis across all Bento Grid UI surfaces and testing infrastructures in the education platform codebase:
- Files Audited:
  - src/app/courses/page.jsx: 3-column asymmetrical Bento Grid, 2-column Flagship Hero card, subject pill filters, book kit inclusions.
  - src/app/batches/page.jsx: Cohort live batches page with 3-column Bento Grid, live status badges, seat occupancy meters, schedule chips, expandable syllabus accordions.
  - src/app/test-series/TestSeriesHubClient.jsx: CBT Test Series hub with telemetry chips (drills/mocks/live papers), expandable Exam Blueprint Rosters, competitive tag filters, Razorpay modal.
  - src/app/dashboard/DashboardClient.jsx: Student & Instructor dashboards featuring Bento Grid cards in My Learning, Batches, and Browse Catalog tabs.
  - src/utils/dateFormat.js: Hydration-safe UTC date formatters (formatDateSafe, formatDateTimeSafe).
  - playwright.config.js & tests/: Playwright config with Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari. Existing tests include exam-engine.spec.js, gamification.spec.js, and challenge_bento_grid_m1.js.

### Key CSS Classes Observed:
- Bento Grid Container: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch
- Asymmetrical Hero Card: col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-[2.5rem] border-2 border-teal-500/30 hover:border-teal-500/60 p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative group shadow-md hover:shadow-2xl hover:shadow-teal-500/10
- Hero Dual-Column Split: grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 (media at lg:col-span-6/7, details at lg:col-span-6/5).
- Uncropped Media Container: relative aspect-[16/9] sm:aspect-[4/3] lg:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 shadow-inner group with backdrop blur (absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-35) and foreground (
relative z-10 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out).
- Standard Modular Card: col-span-1 bg-white rounded-3xl border border-slate-200 hover:border-slate-300 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-lg relative group with line-clamp-2 truncation safeguards.
- Hydration-safe dates: formatDateSafe(date, 'short') using UTC date getters.


## 2. Logic Chain
1. Grid Geometry & Responsiveness:
   - On Desktop (>=1024px / lg), the grid establishes 3 columns (grid-cols-3). The Flagship/Hero card spans 2 columns (lg:col-span-2), while modular cards occupy 1 column (col-span-1), creating the asymmetrical 2:1 Bento rhythm.
   - On Tablet (768px-1023px / md), the grid collapses to 2 columns (md:grid-cols-2). The Hero card spans both columns (md:col-span-2), maintaining prominence while standard cards tile side-by-side.
   - On Mobile (<768px), the grid collapses to a single vertical column (grid-cols-1), where all cards stack seamlessly without horizontal overflow or clipped text.

2. Artwork Integrity (No Cropping):
   - Classical object-cover layouts crop teacher heads, textbook covers, and formula text when aspect ratios diverge.
   - The Bento implementation solves this via a dual-image architectural pattern: object-contain on the foreground preserves the entire original artwork, while an aabsolute inset-0 object-cover blur-xl opacity-35 background fills peripheral aspect gaps with harmonic ambient hues.

3. Interactive Affordances:
   - Hovering over cards triggers group-hover:scale-105 on artwork and group-hover:text-teal-700 on titles, while the Hero card expands shadow depth (hover:shadow-2xl hover:shadow-teal-500/10).
   - Interactive components (subject pills, search inputs, accordion blueprints, and seat status meters) update state with instantaneous DOM feedback.

4. Hydration Cleanliness:
   - Direct calls to toLocaleDateString() cause SSR hydration mismatches when server timezones differ from client browser timezones.
   - Using formatDateSafe(input, 'short') guarantees UTC determinism (e.g. '1 Jun, 2026'), preventing React Hydration Error #418 / #423.

## 3. Caveats
- Live Video / PDF Links: Downloadable worksheets (/downloads/worksheets.pdf) in syllabus accordions are static placeholders; E2E tests should verify DOM accordion toggling and lesson badge rendering.
- Third-Party Script Loading: Razorpay checkout script loads with strategy='lazyOnload'; Playwright tests must mock window.Razorpay or test payment initiation handlers without expecting real banking popups in headless mode.
- Dynamic Supabase Data Fallback: When running offline or without local database seeds, each page gracefully falls back to rich DEFAULT_COURSES, DEFAULT_BATCHES, and mock test packages, guaranteeing deterministic test assertion baselines.


## 4. Conclusion & Recommended Test Specifications
We recommend implementing tests/bento-ui.spec.js using @playwright/test containing 4 comprehensive test suites covering all 4 UI surfaces across 3 responsive viewport breakpoints (Desktop 1280px, Tablet 768px, Mobile 375px).

### Recommended Suite Architecture for tests/bento-ui.spec.js:
1. Courses Bento Grid Suite (/courses):
   - Verify 3-column grid container on desktop viewport (1280x800) with grid-cols-1 md:grid-cols-2 lg:grid-cols-3.
   - Verify Hero Bento Card spans 2 columns (lg:col-span-2) with dual-layer uncropped thumbnail container containing both ambient backdrop (blur-xl) and uncropped foreground artwork (object-contain).
   - Verify standard modular Bento cards span 1 column with object-contain thumbnail and line-clamp-2 title safeguards.
   - Verify subject filtering ('Physics', 'Chemistry', etc.) updates displayed Bento cards dynamically.
   - Verify search input filtering works and filters card titles.
   - Test responsive layout across viewports: Desktop (1280px), Tablet (768px, 2-col), Mobile (375px, 1-col).

2. Live Batches Bento Grid Suite (/batches):
   - Verify 3-column grid container and 2-column Hero Bento span for flagship live cohort.
   - Verify live cohort badge (LIVE COHORT), seat occupancy meter bar (bg-gradient-to-r), schedule chip, and book box highlight.
   - Verify interactive expandable syllabus/curriculum accordion toggling modules on click.
   - Verify search input filters live batches.
   - Verify uncropped dual-layer thumbnail (object-cover blur-xl backdrop + object-contain foreground).
   - Test responsive layout across Desktop (1280px), Tablet (768px), and Mobile (375px).

3. Test Series Hub Bento Grid Suite (/test-series):
   - Verify CBT Test Series Hub header metrics widget (Avg Score, Completed, Record High).
   - Verify Bento Grid layout with Hero package spanning 2 columns (lg:col-span-2) and standard packages spanning 1 column.
   - Verify uncropped 16:9 artwork container with NTA CBT ENGINE 2026 badge.
   - Verify live drill/mock telemetry chips (Chapter Drills, Full Mocks, Live Papers).
   - Verify expandable Exam Blueprint Roster accordion displays papers with duration, question count, and 'Launch CBT' / 'Locked' buttons.
   - Verify competitive tag filters (ALL, JEE MAIN, NEET, etc.).
   - Test responsive layout across Desktop (1280px), Tablet (768px), and Mobile (375px).

4. Dashboard Bento Grids & Hydration Safety Suite (/dashboard):
   - Verify Bento Grid card layout in 'My Learning' (/dashboard?tab=learning), 'Batches' (/dashboard?tab=batches), and 'Browse Courses' (/dashboard?tab=browse).
   - Verify uncropped thumbnails (object-contain + ambient backdrop) on enrolled and catalog course cards.
   - Verify deterministic date rendering formatted with dateFormat.js (e.g. formatDateSafe) without SSR hydration mismatches.
   - Verify console error listener catches 0 React hydration mismatch errors.

## 5. Verification Method
1. Static Validation:
   - Run node tests/challenge_bento_grid_m1.js to ensure date formatting, geometry matrix calculations, and adversarial payloads pass with 0 regressions.
2. Playwright Execution Command:
   - npx playwright test tests/bento-ui.spec.js --project=chromium
   - npx playwright test tests/bento-ui.spec.js
3. Hydration Console Verification:
   - Monitor page.on('console', msg => ...) for zero React Hydration Mismatch warnings during page loads.

