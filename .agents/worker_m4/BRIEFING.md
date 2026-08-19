# BRIEFING — 2026-08-20T00:22:00Z

## Mission
Milestone 4: Cross-Portal Navigation Polish & Hydration Fixes. Complete genuine fixes for Navbar guest/auth support, bottom navigation mobile spacing, SSR hydration safety in DashboardClient & elsewhere, and verify with full build and test suites.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: D:\education portal\.agents\worker_m4
- Original parent: 956a3c37-e5af-4b34-8164-7d6aee236e08
- Milestone: Milestone 4 - Cross-Portal Navigation Polish & Hydration Fixes

## 🔒 Key Constraints
- Genuine implementations only: no cheating, no facade implementations, no hardcoding test results.
- Zero build errors (`npm run build`).
- All unit tests pass (`npm run test:unit`).
- Detailed 5-component handoff report.

## Current Parent
- Conversation ID: 956a3c37-e5af-4b34-8164-7d6aee236e08
- Updated: 2026-08-20T00:22:00Z

## Task Summary
- **What to build**:
  1. Fix `src/components/Navbar.jsx` to render top nav for both guest and authenticated users (showing public links & sign in if guest, avatar/menu if logged in, resolving Supabase session if prop missing).
  2. Ensure bottom spacing on mobile pages (`courses`, `batches`, `books/my-orders`, `profile`, `DashboardClient`, etc.) with `pb-20 md:pb-0` or `pb-24` so content is not obscured by `MobileBottomNav`.
  3. Remediate SSR hydration issues in `src/app/dashboard/DashboardClient.jsx` (e.g. `localStorage.getItem` during render, un-guarded `window`/`navigator`, client date formatting mismatches).
  4. Ensure zero build errors and clean unit test run.
- **Success criteria**:
  - `npm run build` succeeds cleanly.
  - `npm run test:unit` passes completely.
  - Handoff report generated.
- **Interface contracts**: D:\education portal\PROJECT.md
- **Code layout**: D:\education portal\PROJECT.md

## Change Tracker
- **Files modified**: [TBD]
- **Build status**: [TBD]
- **Pending issues**: None

## Quality Status
- **Build/test result**: [TBD]
- **Lint status**: [TBD]
- **Tests added/modified**: [TBD]

## Loaded Skills
- **Source**: d:\education portal\.agents\skills\supabase\SKILL.md
- **Local copy**: d:\education portal\.agents\worker_m4\skills\supabase\SKILL.md
- **Core methodology**: Supabase auth, client sessions, SSR integrations and client state handling.

## Key Decisions Made
- [TBD]

## Artifact Index
- D:\education portal\.agents\worker_m4\DISPATCH.md — Assignment instructions
- D:\education portal\.agents\worker_m4\BRIEFING.md — Situational awareness
- D:\education portal\.agents\worker_m4\progress.md — Liveness & progress tracking
- D:\education portal\.agents\worker_m4\handoff.md — Final 5-component handoff report
