# CBT Exam Engine & Student Mobile UX Explorer Handoff Report

**Agent**: CBT Exam Engine & Student Mobile UX Explorer  
**Folder**: `D:\education portal\.agents\explorer_survey_cbt_mobile`  
**Date**: 2026-08-20  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

### 1.1. Affected File Paths & Line Locations
1. **`src/app/test-series/engine/[examId]/CbtEngineClient.jsx`**:
   - **Line 8**: `import { saveExamState, getExamState, clearExamState } from '@/utils/indexeddb'` — `saveExamState` is imported but never called anywhere in the component, resulting in state loss on mobile app switch or tab reload.
   - **Lines 332–400**: `<header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">` — Container houses 8 distinct elements (Title, Status, Calculator, Scratchpad, Reset, Timer, Submit) totaling ~750px intrinsic width, overflowing viewports below 768px.
   - **Lines 403–569**: `<div className="flex-1 flex overflow-hidden relative">` containing `<div className="w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col justify-between shrink-0">` — Palette sidebar has rigid `w-80 shrink-0` (320px) without `hidden md:flex`, taking 100% of 320px viewports and leaving 55px on 375px viewports.
   - **Lines 444–468**: Options mapped directly to buttons without option letters (`A`, `B`, `C`, `D`), missing `tactile-press` feedback, and omitting MSQ (multi-select) and NUMERICAL input formats.
   - **Lines 473–522**: Action bar buttons wrap awkwardly without fixed bottom thumb-zone placement or safe-area padding.
   - **Lines 573–594**: Calculator modal has `absolute top-16 right-80 w-64` — placing it offscreen (`x = -201px`) on 375px screens.
   - **Lines 597–620**: Scratchpad canvas has fixed `width={800} height={400}` and listens only to mouse events (`onMouseDown`, `onMouseMove`, `onMouseUp`), failing completely on touch devices.

2. **`src/components/navigation/MobileBottomNav.jsx`**:
   - **Lines 15–18**: 
     ```javascript
     const hideOnPaths = ['/', '/login', '/auth']
     const isHidden = 
       hideOnPaths.includes(pathname) || 
       pathname.includes('/exams/') ||
       pathname.startsWith('/auth/')
     ```
     `/test-series/engine/[examId]` is not excluded. The navigation bar (`position: fixed, bottom: 0, height: 64px, z-index: 50`) renders over the CBT exam action bar, disabling bottom buttons.

3. **`src/components/AIAssistant.jsx`**:
   - **Line 28**: `<div className="fixed bottom-6 right-6 z-50">` — Renders globally across all routes including the CBT exam engine, overlapping action buttons.

4. **`src/components/KatexRenderer.jsx`**:
   - **Lines 58, 77**: Inline math rendered as `<span className="inline-block px-1" dangerouslySetInnerHTML={{ __html: html }} />` without `max-w-full overflow-x-auto`, expanding parents past 100vw on long formulas.
   - **Line 66**: `if (part.includes('\\lim') || part.includes('\\frac') || part.includes('\\int') || part.includes('\\vec'))` — Ignores standard LaTeX tokens (`\sqrt`, `\alpha`, `\theta`, `\sum`, `\Delta`, etc.) without `$` delimiters.

---

## 2. Logic Chain

1. **Premise 1**: A CBT exam engine must be fully accessible and ergonomic on mobile viewports (320px to 768px) to support student test-taking on smartphones and tablets.
2. **Step 1 (Viewport Layout Breakage)**: From Observation 1.1 (lines 403–569), the sidebar palette is fixed at 320px without responsive breakpoints. On a 320px–375px mobile screen, this allocates 0–55px to the question body, rendering the exam unreadable.
3. **Step 2 (Palette Access)**: Because the sidebar cannot remain statically visible on mobile, a mobile-first paradigm (Framer Motion swipeable Bottom Sheet) is required to allow question jumping without sacrificing screen real estate.
4. **Step 3 (Global Overlays Collision)**: From Observation 1.2 and 1.3, `MobileBottomNav` (`z-50`) and `AIAssistant` (`z-50`) do not suppress rendering on `/test-series/engine/`, directly occluding the exam controls. Suppressing these components on exam routes is mandatory.
5. **Step 4 (Touch & Input Ergonomics)**: From Observation 1.1 (lines 444–468), lack of letter badges (A, B, C, D), missing active press animations, and lack of MSQ/Numerical keypad support prevents students from answering non-MCQ questions.
6. **Step 5 (Math & Canvas Responsiveness)**: From Observation 1.4 and 1.1 (lines 597–620), uncontained inline KaTeX creates horizontal scrollbars and mouse-only canvas events disable drawing on touchscreens.

---

## 3. Caveats

- **Network Mode**: The investigation was conducted in read-only mode.
- **Admin Dashboard Parity**: This survey focused primarily on the Student Portal (`D:\education portal`). The Admin Dashboard (`D:\admin dashboard`) Question Bank schema will need to supply normalized questions (`format`, `content`, `options`, `diagram_url`) compatible with the redesigned student engine.
- No other caveats.

---

## 4. Conclusion

The CBT Exam Engine requires a comprehensive mobile redesign focused on 6 core areas:
1. **Mobile Bottom Sheet Palette**: Replaces the desktop 320px sidebar with a swipeable, filterable bottom drawer on mobile screens.
2. **Fixed Thumb-Zone Action Bar & Header**: Reorganizes controls into a 56px sticky top header (compact timer + dropdown) and a fixed bottom navigation bar (`z-30`).
3. **Enhanced Option Ergonomics & Multi-Format Support**: Letter badges (A/B/C/D), tactile press, MSQ checkboxes, and on-screen numerical keypads.
4. **Global Layout Suppression**: Explicitly hides `MobileBottomNav`, `AIAssistant`, `ScrollToTop`, and `CookieBanner` on `/test-series/engine/`.
5. **Responsive KaTeX & Touch-Enabled Scratchpad**: Math formula overflow containment (`overflow-x-auto`) and retina HTML5 touch canvas.
6. **IndexedDB Auto-Persistence**: Debounced write-behind state sync for offline resilience and session survival.

Full technical details, component hierarchy, and design specifications are documented in `D:\education portal\.agents\explorer_survey_cbt_mobile\analysis.md`.

---

## 5. Verification Method

1. **File Inspection**:
   - Inspect `D:\education portal\.agents\explorer_survey_cbt_mobile\analysis.md` for complete architectural specifications.
   - Inspect `src/app/test-series/engine/[examId]/CbtEngineClient.jsx` (lines 8, 332–400, 403–569, 444–468, 573–620) to verify diagnosed failure points.
   - Inspect `src/components/navigation/MobileBottomNav.jsx` (lines 15–18) to verify route exclusion omissions.
2. **E2E Playwright Mobile Viewport Test**:
   - Run `npx playwright test tests/exam-engine.spec.js --project=chromium` on mobile viewport configurations (`320x568`, `375x667`, `390x844`, `768x1024`).
   - Validate that `scrollWidth === innerWidth` (no horizontal scrolling).
   - Validate bottom sheet trigger, option letter badges, timer visibility, and touch scratchpad events.
