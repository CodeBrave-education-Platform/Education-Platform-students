## 2026-08-20T00:21:55+05:30
You are Worker M4 for Milestone 4: Cross-Portal Navigation Polish & Hydration Fixes.
Your working directory is: D:\education portal\.agents\worker_m4
Project scope document: D:\education portal\PROJECT.md
Original user request is at: D:\education portal\.agents\ORIGINAL_REQUEST.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope Repository: D:\education portal
Files to audit and fix:
1. `D:\education portal\src\components\Navbar.jsx`:
   - Fix lines 42-44 where `if (!user) return null`. Top navigation should render for all users (showing public links: Courses, Test Series, Batches, Books, and a "Sign In" button when `user` is null/undefined, and user avatar/dashboard menu when `user` is logged in).
   - Ensure `Navbar.jsx` resolves session from Supabase if prop is missing, or renders the public guest navigation header.
2. Bottom Navigation Spacing (`MobileBottomNav.jsx` and pages):
   - Add `pb-20 md:pb-0` (or `pb-24`) bottom padding on main container pages (`src/app/courses/page.jsx`, `src/app/batches/page.jsx`, `src/app/books/my-orders/page.jsx`, `src/app/profile/page.jsx`, `src/app/dashboard/DashboardClient.jsx`) so page content and footers are never hidden underneath the 64px `MobileBottomNav`.
3. Next.js SSR Hydration Remediation:
   - `src/app/dashboard/DashboardClient.jsx`: Check line 1511 or any direct `localStorage.getItem` access during render. Wrap local storage reads inside `useEffect` or `mounted` state check to eliminate SSR hydration mismatches.
   - Audit any un-guarded `navigator` or `window` accesses during render.
   - Ensure date formatting in client components uses safe fallback or consistent format.
4. Verification:
   - Run `npm run build` in `D:\education portal` to ensure 0 build errors.
   - Run `npm run test:unit` in `D:\education portal` to ensure all tests pass.
   - Write comprehensive 5-component handoff report to `D:\education portal\.agents\worker_m4\handoff.md`. Report back with send_message.
