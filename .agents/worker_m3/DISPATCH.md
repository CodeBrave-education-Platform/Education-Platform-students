## 2026-08-20T00:15:00Z
You are Worker M3 for Milestone 3: Student Portal CBT Exam Engine Mobile Overhaul.
Your working directory is: D:\education portal\.agents\worker_m3
Project scope document: D:\education portal\PROJECT.md
Original user request is at: D:\education portal\.agents\ORIGINAL_REQUEST.md
CBT Explorer Survey: D:\education portal\.agents\explorer_survey_cbt_mobile\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope Repository: D:\education portal
You have exclusive write ownership of:
- D:\education portal\src\app\test-series\engine\[examId]\CbtEngineClient.jsx
- D:\education portal\src\components\navigation\MobileBottomNav.jsx
- D:\education portal\src\components\AIAssistant.jsx
- D:\education portal\src\components\KatexRenderer.jsx
- D:\education portal\src\app\api\test-series\grade\route.js

Tasks:
1. Complete Mobile CBT Exam Engine Redesign (src/app/test-series/engine/[examId]/CbtEngineClient.jsx):
   - Layout & Palette: Hide the 320px static sidebar palette on mobile viewports (`hidden lg:flex`). Implement an ergonomic, animated Framer Motion swipeable Bottom Sheet palette for question jumping on screens <1024px with section tabs, status filter pills (All, Answered, Unanswered, Marked for Review), and quick tap question grid.
   - Compact Sticky Header: 56px sticky top bar with exam title, persistent timer badge (with warning color in final 5 minutes), question counter pill, and a clean dropdown menu for utilities (Calculator, Scratchpad, Clear Response, Question Paper view).
   - Ergonomic Option Buttons: Minimum 48px touch target height, bold letter badges (A, B, C, D), tactile tap animation, distinct active and selected states.
   - Multi-Format Support: Single Choice MCQ (radio behavior), Multi-Select MSQ (checkbox behavior), and Numerical Input (with on-screen numeric keypad or input).
   - Touch Scratchpad: Support HTML5 canvas touch events (`onTouchStart`, `onTouchMove`, `onTouchEnd`) with high-DPI scaling so drawing is smooth on mobile touchscreens.
   - Responsive Calculator: Position calculator modal inside viewport bounds on all screen sizes.
   - IndexedDB Persistence: Call `saveExamState` on answer selection and timer updates so test attempts survive page reloads and tab switches.
   - Action Bar: Fixed bottom bar with Previous, Next, Mark for Review, and Submit buttons with safe-area spacing.

2. Overlay Suppression:
   - Update `MobileBottomNav.jsx` and `AIAssistant.jsx` to explicitly exclude `/test-series/engine/` so they never render over CBT test buttons.

3. Responsive Math & Image Rendering (src/components/KatexRenderer.jsx):
   - Wrap LaTeX formulas with `max-w-full overflow-x-auto` to strictly prevent horizontal page expansion past 100vw.
   - Ensure all question images scale responsively (`max-w-full h-auto rounded-lg object-contain`).

4. Server-Authoritative Grading (src/app/api/test-series/grade/route.js):
   - Support grading from both relational `exam_questions` + `question_bank` joins and fallback to `test_exams.questions` JSON.
   - Support Single MCQ, MSQ multi-select, and Numerical comparisons.

5. Verification:
   - Run `npm run build` or Next.js build check in `D:\education portal` to ensure 0 build errors.
   - Write comprehensive 5-component handoff report to `D:\education portal\.agents\worker_m3\handoff.md`. Report back with send_message.
