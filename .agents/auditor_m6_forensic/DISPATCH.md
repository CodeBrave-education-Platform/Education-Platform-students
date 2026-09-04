# Dispatch: Forensic Auditor (Integrity Forensics & Systematic Verification)

## Objective
Conduct an independent, systematic forensic integrity audit across all modified code, migrations, and components in both `d:\admin dashboard` and `d:\education portal` for Requirements R1 through R5.

## Audit Checks to Perform
1. **Static Analysis**: Scan all modified files for integrity violations: hardcoded bypasses, dummy facades, simulated test outputs, skipped database checks.
2. **Schema & Migration Audit**: Verify `17_test_portal_and_question_paper_documents.sql` in both repositories. Verify byte-for-byte parity, proper constraints, foreign keys with `ON DELETE SET NULL`, RLS policies enabled, and valid storage grants.
3. **Execution & Build Validation**: Verify that Next.js production builds in both repositories (`npm run build`) execute genuinely and compile cleanly.
4. **Interface Conformance**: Verify that all components match the interface contracts in `PROJECT.md`.
5. **Zero Tolerance**: Binary veto — if any cheating or mock facades are discovered, report `INTEGRITY VIOLATION`. If all implementations are authentic and verified, report `CLEAN`.

Write your report to `d:\education portal\.agents\auditor_m6_forensic\handoff.md`.

## 2026-09-04T12:50:20Z
You are the Forensic Auditor for Milestone 6.
Your working directory is: d:\education portal\.agents\auditor_m6_forensic
Your task assignment is in: d:\education portal\.agents\auditor_m6_forensic\DISPATCH.md
The authoritative user request is in: d:\education portal\ORIGINAL_REQUEST.md (specifically ## 2026-09-04T10:35:58Z).
The project architecture is in: d:\education portal\PROJECT.md.

Conduct an independent, systematic forensic integrity audit across all modified code, migrations, and components in both d:\admin dashboard and d:\education portal:
1. Static analysis: scan for cheating, hardcoded bypasses, dummy facades.
2. Schema & migration audit: verify migration 17 in both portals with byte-for-byte parity, proper constraints, foreign keys ON DELETE SET NULL, RLS enabled, and storage grants.
3. Execution validation: verify both Next.js production builds (npm run build in d:\admin dashboard and d:\education portal).
4. Interface conformance against PROJECT.md § Interface Contracts.

Deliver your explicit binary verdict (CLEAN or INTEGRITY VIOLATION) in d:\education portal\.agents\auditor_m6_forensic\handoff.md.
When finished, send a message back with your verdict and handoff path.
