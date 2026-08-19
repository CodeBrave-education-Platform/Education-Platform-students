# CBT Exam Engine & Student Mobile UI/UX Comprehensive Survey & Architectural Specification

**Author**: CBT Exam Engine & Student Mobile UX Explorer  
**Date**: 2026-08-20  
**Target Repository**: `D:\education portal` (Student Portal)  
**Corpus**: `CodeBrave-education-Platform/Education-Platform-students`  
**Status**: Comprehensive Survey Complete — Ready for Implementation  

---

## 1. Executive Summary

This report delivers an exhaustive audit of the Computer-Based Testing (CBT) Exam Engine, student test player routes, question navigation systems, math/LaTeX rendering pipelines, and mobile viewports (320px to 768px) within the Student Portal (`D:\education portal`). 

The current CBT exam engine (`/test-series/engine/[examId]`) is desktop-centric and exhibits severe layout breakages, touch-target deficiencies, and viewport overflow errors when accessed on mobile devices. Crucially, global layout components (e.g., `MobileBottomNav`, `AIAssistant`, `ScrollToTop`, `CookieBanner`) actively overlap and obstruct the exam player controls on small screens. Furthermore, the Question Palette lacks mobile responsiveness (occupying a rigid 320px sidebar that squeezes question text into unreadable 0–55px slivers), the LaTeX/KaTeX renderer causes horizontal container overflows, and offline state updates in IndexedDB are disconnected.

This document identifies all affected files with exact line numbers, details every systemic failure mode across 320px–768px viewports, and defines a complete, production-ready architectural specification for a mobile-first redesign.

---

## 2. File & Component Catalog

The following table catalogs all files directly responsible for or impacting the CBT Exam Engine and mobile test-taking experience:

| File Path | Role / Purpose | Key Responsibilities & Logic |
| :--- | :--- | :--- |
| `src/app/test-series/engine/[examId]/CbtEngineClient.jsx` | **Primary CBT Engine Client** | Full-screen proctor launcher, countdown timer, question presentation, option selection, bookmarking, scratchpad canvas, calculator modal, question palette, exam submission, and IndexedDB cache hydration. |
| `src/app/test-series/engine/[examId]/page.js` | **CBT Engine Server Page** | Session authentication, role authorization check against `invoices` and `profiles`, blind question sanitization (stripping answer keys/solutions), and fallback mock generator. |
| `src/components/KatexRenderer.jsx` | **Math & Formula KaTeX Engine** | Client-side LaTeX parser using `katex.renderToString`. Converts plain text mathematical notation into formatted formulas. |
| `src/app/test-series/TestSeriesHubClient.jsx` | **Test Series Catalog Hub** | Package directory, tag filtering (`JEE Main`, `NEET`, `All`), package expansion accordions, user performance metrics, and Razorpay modal integration. |
| `src/app/test-series/page.js` | **Test Series Hub Server Page** | Server-side query orchestrator for `test_packages`, `test_exams`, `test_attempts`, and user invoice entitlements. |
| `src/app/test-series/analytics/[attemptId]/AnalyticsTerminalClient.jsx` | **Post-Exam Analytics Terminal** | Candidate scorecard, accuracy stats, Recharts scatter-plot time-drain analysis, subject benchmark bar charts, AI All-India Rank (AIR) predictor, and diagnostic revision roadmap. |
| `src/app/test-series/analytics/[attemptId]/page.js` | **Analytics Server Page** | Server-side data loader for exam blueprint, attempt payloads, and peer topper accuracy benchmarks. |
| `src/app/api/test-series/grade/route.js` | **Authoritative Blind Grading API** | Server-authoritative evaluation of answers against stored test blueprints, calculating positive/negative marks, duration, XP, daily streak, and rank badges. |
| `src/app/api/test-series/heartbeat/route.js` | **Telemetry Heartbeat API** | Redis-backed session heartbeat tracking candidate liveness during active exam attempts (20s TTL). |
| `src/utils/indexeddb.js` | **Offline IndexedDB Storage** | Client-side persistent cache (`asentra-offline-db`) for storing and restoring exam state during network interruptions. |
| `src/app/learn/[courseId]/exams/[assessmentId]/ExamClient.jsx` | **Course Assessment Exam Player** | Alternative course-based quiz player featuring zero-trust monotonic server clock sync, CAD grading animations, and question palette. |
| `src/components/navigation/MobileBottomNav.jsx` | **Global Student Bottom Navigation** | Fixed mobile navigation bar (`z-50`, height 64px) rendered across the student portal. |
| `src/components/AIAssistant.jsx` | **Global AI Mentor Widget** | Floating bottom-right AI mentor modal (`z-50`) rendered across all portal pages. |
| `src/components/navigation/ScrollToTop.jsx` | **Global Scroll-To-Top Button** | Floating scroll button (`z-40`) triggered upon scrolling > 300px. |
| `src/components/CookieBanner.jsx` | **Global Cookie Banner** | Bottom-anchored consent banner (`z-50`). |
| `src/app/globals.css` | **Global Stylesheet & CSS Theme** | Tailwind v4 import, theme colors (`--color-teal-*`), font variables, and utility classes. |
| `tests/exam-engine.spec.js` | **E2E Playwright Test Suite** | Automated verification of CBT engine launch, question headers, KaTeX wrappers, option selection, and offline mode. |

---

## 3. Deep-Dive Failure Mode Analysis (320px – 768px Viewports)

### 3.1. Question Navigation Palette Failure on Mobile
- **Location**: `src/app/test-series/engine/[examId]/CbtEngineClient.jsx`, lines 403–569.
- **Root Cause**:
  ```jsx
  <div className="flex-1 flex overflow-hidden relative">
    {/* Question Panel */}
    <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 md:p-8 space-y-6 bg-white">
      ...
    </div>

    {/* NTA Question Palette Sidebar */}
    <div className="w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col justify-between shrink-0">
      ...
    </div>
  </div>
  ```
- **Observed Behavior**:
  - The palette sidebar has a fixed width `w-80` (320px) with `shrink-0`. There are **no responsive hiding classes** (`hidden md:flex` or `lg:block`).
  - On a **320px viewport** (e.g., iPhone SE 1st gen, Galaxy Z Fold cover screen), the sidebar consumes 100% of the available width, squashing the question panel to 0px or pushing it completely off-screen.
  - On a **375px viewport** (iPhone 12/13/Mini), the question panel is allotted exactly 55px (375px - 320px), causing extreme word truncation, vertical text stacking, and completely unusable rendering.
  - On **768px viewports** (iPad portrait), the question panel gets only 448px, leading to cramped options and diagram clipping.
- **Deficiency**: There is zero mobile support for a Question Navigation Drawer, Bottom Sheet, or Modal Quick-Jumper.

---

### 3.2. Option Button Ergonomics, Touch Targets & Format Inflexibility
- **Location**: `src/app/test-series/engine/[examId]/CbtEngineClient.jsx`, lines 444–468.
- **Root Cause**:
  ```jsx
  {currentQuestion?.options?.map((opt, optIdx) => {
    const isSelected = currentAnswer?.selected_option === optIdx
    return (
      <button
        key={optIdx}
        onClick={() => {
          setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: { selected_option: optIdx, seconds_spent: 10 }
          }))
        }}
        className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
          isSelected 
            ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs' 
            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
        }`}
      >
        <span className="text-xs font-bold leading-relaxed">
          <KatexRenderer content={opt} />
        </span>
        {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />}
      </button>
    )
  })}
  ```
- **Observed Behavior & Ergonomic Flaws**:
  1. **Missing Letter Badges**: Options have no `(A)`, `(B)`, `(C)`, `(D)` visual pills. In competitive exams (JEE/NEET), students rely heavily on standard letter designations to match their rough-sheet calculations with the interface.
  2. **Touch Feedback**: Missing active press transform (`tactile-press` / `active:scale-[0.98]`), making button clicks feel unresponsive on mobile capacitive touch screens.
  3. **Small Typography**: `text-xs` (12px) is too small on mobile displays for formulas, subscripts, and chemical equations.
  4. **Single-Choice MCQ Only**:
     - In competitive exams, questions can be **Single-Choice (MCQ)**, **Multiple-Choice / Multi-Select (MSQ)**, or **Numerical (Integer/Decimal Value)**.
     - In `CbtEngineClient.jsx`, multi-selection is impossible because selecting an option unconditionally overwrites `selected_option`.
     - In numerical questions where `options` is empty (`[]`), the engine renders **no input field whatsoever**, completely locking the student out of submitting numerical answers!

---

### 3.3. Header & Timer Viewport Squeeze & Collision
- **Location**: `src/app/test-series/engine/[examId]/CbtEngineClient.jsx`, lines 332–400.
- **Root Cause**:
  ```jsx
  <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
    <div className="flex items-center gap-4">
      <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg">NTA CBT ENGINE</span>
      <h2 className="text-sm font-black text-slate-900 truncate max-w-[200px] md:max-w-sm">{exam.title}</h2>
      <span className="...">Cloud Synced</span>
    </div>
    <div className="flex items-center gap-2">
      <button onClick={() => setShowCalculator(!showCalculator)}>Calculator</button>
      <button onClick={() => setShowScratchpad(!showScratchpad)}>Scratchpad</button>
      <button onClick={handleResetExam}>Reset Test</button>
      <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-xl ml-2">
        <Clock className="w-4 h-4 text-teal-600" />
        <span className="text-sm font-black font-mono text-slate-900 leading-none">{formatTime(secondsRemaining)}</span>
      </div>
      <button onClick={handleSubmitExam} className="px-4 py-2 bg-emerald-600 ...">Submit Test</button>
    </div>
  </header>
  ```
- **Observed Behavior**:
  - The header contains 8 distinct horizontal UI blocks totaling an intrinsic minimum width of **~750px**.
  - On viewports < 768px, items either get clipped off the screen, wrap onto multiple unstyled lines, or completely cover the question area below.
  - The "Submit Test" button sits directly next to tools without confirmation spacing, making accidental taps highly probable with thumb navigation.
  - No `safe-area-inset-top` padding is provided, causing content to overlap the iOS notch / Dynamic Island and Android status bars.

---

### 3.4. Math / LaTeX Rendering & Image Scaling Horizontal Overflow
- **Location**: `src/components/KatexRenderer.jsx`, lines 11–92, and `CbtEngineClient.jsx`, lines 428–440.
- **Root Cause in `KatexRenderer.jsx`**:
  - Delimiter matching:
    ```javascript
    const parts = formattedContent.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\(.*?\\\)|\\\[.*?\\\])/g);
    ```
  - Fallback check (line 66):
    ```javascript
    if (part.includes('\\lim') || part.includes('\\frac') || part.includes('\\int') || part.includes('\\vec')) { ... }
    ```
  - Inline Math Render (line 58, 77):
    ```jsx
    className="inline-block px-1"
    ```
- **Root Cause in Diagram Container**:
  ```jsx
  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg relative h-56 w-full">
    <Image src={currentQuestion.diagram_url} alt="Question Diagram" fill className="object-contain rounded-xl" />
  </div>
  ```
- **Observed Behavior**:
  1. **Inline Math Container Overflow**: When formulas like $k = \frac{1}{t} \ln \left[\frac{2P_0}{3P_0 - P_t}\right]$ or long matrix notations are rendered inline (`inline-block`), they cannot wrap across lines. Because they lack `max-w-full overflow-x-auto`, they force the entire parent card and window body to expand beyond 100vw, introducing horizontal scrolling across the test screen.
  2. **Unparsed LaTeX Tokens**: If question text contains raw LaTeX like `\sqrt{4ax}`, `\alpha`, `\beta`, `\theta`, `\lambda`, `\Delta`, `\sum` without explicit dollar sign delimiters, KaTeX is bypassed entirely, displaying messy unformatted raw LaTeX strings to students.
  3. **Fixed Diagram Height**: `h-56` (224px) fixed height causes wide circuit diagrams, ray optics figures, and reaction charts to scale down drastically to fit the height, rendering labels unreadable without zoom capability.

---

### 3.5. Global Overlay Interference & UI Collisions
- **Location**: `src/app/layout.js`, `src/components/navigation/MobileBottomNav.jsx`, `src/components/AIAssistant.jsx`, `src/components/navigation/ScrollToTop.jsx`, `src/components/CookieBanner.jsx`.
- **Root Cause in `MobileBottomNav.jsx`**:
  ```javascript
  const hideOnPaths = ['/', '/login', '/auth']
  const isHidden = 
    hideOnPaths.includes(pathname) || 
    pathname.includes('/exams/') ||
    pathname.startsWith('/auth/')
  ```
- **Observed Behavior**:
  - The CBT Exam Engine route is `/test-series/engine/[examId]`.
  - Because `/test-series/engine/` does NOT contain `/exams/`, `isHidden` evaluates to **`false`**.
  - As a result, the student mobile bottom bar (Home, My Batches, Test Series, Performance, Profile) renders at `position: fixed, bottom: 0, height: 64px, z-index: 50`.
  - **Critical Collision**: This bottom navigation bar directly covers and disables the exam action bar buttons ("Mark for Review", "Clear Response", "Previous", "Next Question") on all mobile devices!
  - `AIAssistant` (`fixed bottom-6 right-6 z-50`), `ScrollToTop` (`fixed bottom-[90px] right-6 z-40`), and `CookieBanner` (`z-50`) also render on top of the CBT engine without route suppression.

---

### 3.6. Scratchpad & Calculator Inoperability on Touch Screens
- **Location**: `src/app/test-series/engine/[examId]/CbtEngineClient.jsx`, lines 571–620.
- **Root Cause**:
  - Calculator position:
    ```jsx
    <div className="absolute top-16 right-80 w-64 bg-slate-900 ...">
    ```
    On a 375px wide screen, `right: 320px` places the 256px wide calculator at `left = 375 - 320 - 256 = -201px` (**completely off-screen to the left**).
  - Scratchpad Canvas:
    ```jsx
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      className="w-full h-full bg-slate-50 ..."
    />
    ```
    - The canvas has fixed `800x400` pixel dimensions and only listens to **mouse events** (`onMouseDown`, `onMouseMove`, `onMouseUp`).
    - It completely lacks touch event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`) and `touch-action: none`. Mobile students touching or dragging a finger simply scroll the page instead of drawing.

---

### 3.7. Disconnected IndexedDB State Persistence
- **Location**: `src/app/test-series/engine/[examId]/CbtEngineClient.jsx`, line 8.
- **Root Cause**:
  - `saveExamState` is imported from `@/utils/indexeddb`, but **never called anywhere in `CbtEngineClient.jsx`**.
- **Observed Behavior**:
  - `getExamState` is called on mount, but because `saveExamState` is never invoked on answer selection or timer countdown, nothing is ever written to IndexedDB.
  - If a mobile browser tab refreshes or the operating system suspends the browser while answering a call, the student's exam state is permanently lost.

---

## 4. Mobile Redesign Specifications & Architecture

To achieve an authentic, flawless, NTA/JEE-grade mobile CBT exam experience across all screen sizes (320px–768px+), we specify the following modular architecture:

```
src/app/test-series/engine/[examId]/
├── CbtEngineClient.jsx              # Main state orchestrator & provider
├── components/
│   ├── CbtHeader.jsx                # Responsive header with compact timer & tool dropdown
│   ├── CbtQuestionView.jsx          # Question content, KaTeX formula container, pinch-zoom diagram
│   ├── CbtOptionList.jsx            # Ergonomic touch-target options with letter badges (A, B, C, D)
│   ├── CbtNumericalKeypad.jsx       # Integrated on-screen keypad for numerical questions
│   ├── CbtPaletteBottomSheet.jsx    # Mobile swipeable bottom sheet question palette
│   ├── CbtPaletteSidebar.jsx        # Desktop collapsible sidebar question palette
│   ├── CbtBottomActionBar.jsx       # Fixed thumb-zone bottom navigation bar
│   ├── CbtCalculatorModal.jsx       # Responsive mobile modal calculator
│   ├── CbtScratchpadModal.jsx       # Responsive touch-enabled HTML5 canvas scratchpad
│   └── CbtSubmitModal.jsx           # Safe double-confirmation submission sheet with breakdown stats
```

---

### 4.1. CbtHeader Specification (Mobile-First)
- **Dimensions**: Fixed height `h-14` (56px) with `pt-[env(safe-area-inset-top)]`.
- **Layout**:
  - **Left**: Compact question counter pill: `Q {currentIdx + 1}/{total}` and subject indicator badge (e.g. `PHY`, `CHEM`, `MATH`).
  - **Center**: Prominent monospaced Countdown Timer (`MM:SS` or `HH:MM:SS`):
    - Default (> 15m): `bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white`
    - Caution (5m – 15m): `bg-amber-50 text-amber-700 border-amber-300`
    - Warning (< 5m): `bg-rose-50 text-rose-700 border-rose-300 animate-pulse`
  - **Right**:
    - Mobile Tools Icon Dropdown (Calculator + Scratchpad + Reset).
    - Compact "Submit" button (`px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs`).

---

### 4.2. CbtPaletteBottomSheet Specification (Mobile Viewports < 1024px)
- **Trigger**: Tap on the persistent "Palette" button or question counter pill in the bottom action bar.
- **Component Design**:
  - Framer Motion slide-up bottom sheet with touch drag-handle (`drag="y"`, `dragConstraints={{ top: 0 }}`, `onDragEnd` threshold).
  - Maximum height: `85vh` with smooth internal scrolling (`overflow-y-auto`).
  - **Header**: Sheet title ("Question Palette"), subject filter tabs (`All`, `Physics`, `Chemistry`, `Mathematics`), and close icon.
  - **Stats Summary Row**: Answered (Emerald), Marked for Review (Purple), Unanswered (Slate/Amber), Not Visited.
  - **Grid**: 5-column or 6-column grid of 44x44px touch targets.
  - **Interaction**: Direct tap on any question number immediately updates `currentIdx` and closes the bottom sheet.
  - **Secondary Submit Action**: Full-width "Submit Test" button at bottom of drawer.

---

### 4.3. CbtOptionList & Question View Specification
- **Question Container**:
  - Container padding: `p-4 sm:p-6 pb-28 md:pb-8`. The `pb-28` provides bottom clearance so content never sits beneath the sticky action bar.
  - KaTeX equations: Contained in `max-w-full overflow-x-auto py-1 scrollbar-thin` with `-webkit-overflow-scrolling: touch`.
  - Diagrams: Contained in responsive aspect ratio container with tap-to-expand / pinch-zoom modal.
- **Option Button Touch Ergonomics**:
  - Minimum height: `54px`.
  - Layout: `flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all select-none active:scale-[0.98] tactile-press`.
  - **Letter Pill**: 32x32px circular badge on left with `A`, `B`, `C`, `D`.
    - Unselected: `bg-slate-100 text-slate-600 border border-slate-200`.
    - Selected: `bg-teal-600 text-white font-black shadow-sm`.
  - **Multi-Format Support**:
    - **MCQ (Single Select)**: Radio behavior with checkmark indicator.
    - **MSQ (Multi Select)**: Checkbox toggle behavior (`selected_options: [0, 2]`).
    - **NUMERICAL**: Dedicated numerical keypad input displaying decimal values and sign toggles (`+/-`).

---

### 4.4. CbtBottomActionBar Specification
- **Fixed Positioning**: `fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]`.
- **Thumb Zone Layout**:
  - **Left Section**:
    - "Mark Review" button (Purple bookmark icon + label).
    - "Clear" button (Rose trash icon).
  - **Center Section**:
    - "Palette" button (Grid icon + answered count badge) triggering Bottom Sheet.
  - **Right Section**:
    - "Previous" button (`px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold`).
    - "Save & Next" / "Next" button (`px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black shadow-md`).

---

### 4.5. Touch-Enabled Scratchpad Canvas Specification
- **Canvas Sizing**: Dynamically observe bounding container dimensions (`ResizeObserver`) multiplied by `window.devicePixelRatio` for retina clarity.
- **Touch Event Handlers**:
  - `onTouchStart`, `onTouchMove`, `onTouchEnd` with `e.preventDefault()` and `touch-action: none`.
  - Accurate touch coordinate calculation: `e.touches[0].clientX - rect.left`.
- **Tools**: Pen size slider, Eraser, Clear Board, and Undo stack.

---

### 4.6. Route Exclusion for Global Layout Elements
In `src/components/navigation/MobileBottomNav.jsx`, `src/components/AIAssistant.jsx`, `src/components/navigation/ScrollToTop.jsx`, and `src/components/CookieBanner.jsx`:
```javascript
// Add route suppression for all exam routes:
if (
  pathname.startsWith('/test-series/engine') ||
  pathname.includes('/exams/') ||
  pathname.startsWith('/auth/')
) {
  return null;
}
```

---

### 4.7. Auto-Saving IndexedDB State Engine
In `CbtEngineClient.jsx`:
- Debounced write-behind effect (500ms):
  ```javascript
  useEffect(() => {
    if (loading || !exam?.id) return;
    const timer = setTimeout(() => {
      saveExamState(exam.id, {
        answers,
        markedReview: Array.from(markedReview),
        secondsRemaining,
        currentIdx,
        updatedAt: Date.now()
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [answers, markedReview, secondsRemaining, currentIdx, exam?.id, loading]);
  ```

---

## 5. Comprehensive Verification Plan

To independently verify the implementation, the following tests and inspection procedures are required:

1. **Playwright Mobile Viewport Test Matrix**:
   - Device configurations:
     - `iPhone SE` (320px x 568px)
     - `iPhone 14 / Pixel 7` (390px x 844px)
     - `iPad Mini` (768px x 1024px)
   - Assertions:
     - Zero horizontal scrollbar on body (`document.documentElement.scrollWidth === window.innerWidth`).
     - Bottom sheet opens smoothly upon tapping "Palette" and closes on question selection.
     - `MobileBottomNav` and `AIAssistant` are strictly hidden.
     - Option tap activates `active:scale` tactile feedback and selects letter badge.
     - Timer remains persistent and fully legible in the top header.
     - KaTeX equations scale within container without overflowing viewport.
2. **Offline Mode Recovery**:
   - Disconnect network (`context.setOffline(true)`), select 3 answers, reload page, reconnect network.
   - Verify all 3 answers and remaining time are preserved from IndexedDB.
3. **Multi-Format Question Rendering**:
   - Load questions with MCQ, MSQ, and NUMERICAL formats; verify input fields and grading calculations.

---

## 6. Summary of Architectural Deliverables

This survey provides the complete blueprint for the implementation phase:
- All 17 related files identified and cataloged.
- 7 systemic mobile failure modes diagnosed with exact line numbers.
- Detailed component breakdowns for `CbtHeader`, `CbtPaletteBottomSheet`, `CbtOptionList`, `CbtBottomActionBar`, and `CbtScratchpadModal`.
- Formula KaTeX and diagram containment rules defined.
- State persistence and global overlay suppression codified.
