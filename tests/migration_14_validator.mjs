import fs from 'fs'
import path from 'path'

function validateMigrations() {
  console.log('=== VALIDATING MIGRATION 14 & REFS ===\n')

  const mig14Path = path.resolve('supabase/migrations/14_schema_integrity_and_qa_patch.sql')
  const mig14TimestampedPath = path.resolve('supabase/migrations/20260530170000_14_schema_integrity_and_qa_patch.sql')

  const mig14Content = fs.readFileSync(mig14Path, 'utf8')
  const mig14TimestampedContent = fs.readFileSync(mig14TimestampedPath, 'utf8')

  console.log(`Migration 14 length: ${mig14Content.length} chars`)
  console.log(`Migration 14 (Timestamped) length: ${mig14TimestampedContent.length} chars`)

  // Check 1: Key tables referenced exist
  const requiredTables = [
    'public.profiles',
    'public.courses',
    'public.invoices',
    'public.assessments',
    'public.live_sessions',
    'public.test_packages',
    'public.course_files',
    'public.coursera_courses',
    'public.batches',
    'public.batch_enrollments',
    'public.enrollments',
    'public.test_attempts'
  ]

  requiredTables.forEach(tbl => {
    const present = mig14Content.includes(tbl)
    console.log(`[CHECK] Table ${tbl} referenced in migration 14: ${present}`)
  })

  // Check 2: Foreign keys added
  const requiredFKs = [
    'courses_instructor_id_fkey',
    'invoices_user_id_fkey',
    'invoices_profile_id_fkey',
    'invoices_course_id_fkey',
    'invoices_batch_id_fkey',
    'invoices_package_id_fkey',
    'invoices_book_id_fkey',
    'assessments_batch_id_fkey',
    'live_sessions_batch_id_fkey'
  ]

  requiredFKs.forEach(fk => {
    const present = mig14Content.includes(fk)
    console.log(`[CHECK] Foreign key ${fk}: ${present}`)
  })

  // Check 3: Check constraints
  const requiredChecks = [
    'courses_level_check',
    'invoices_status_check'
  ]
  requiredChecks.forEach(chk => {
    const present = mig14Content.includes(chk)
    console.log(`[CHECK] Check constraint ${chk}: ${present}`)
  })

  // Check 4: Deprecated auth.role() usage check
  const deprecatedRoleMatch = mig14Content.match(/auth\.role\(\)/g)
  console.log(`[CHECK] Deprecated auth.role() occurrences: ${deprecatedRoleMatch ? deprecatedRoleMatch.length : 0} (Should be 0)`)

  // Check 5: RPC Functions created/replaced
  const requiredRPCs = [
    'onboard_user_after_payment',
    'execute_atomic_student_onboarding',
    'execute_atomic_batch_onboarding',
    'execute_atomic_package_onboarding',
    'execute_atomic_book_order',
    'execute_enrollment_revocation'
  ]
  requiredRPCs.forEach(rpc => {
    const present = mig14Content.includes(`FUNCTION public.${rpc}`)
    console.log(`[CHECK] RPC ${rpc}: ${present}`)
  })

  // Check 6: Policy count
  const policyMatches = mig14Content.match(/CREATE POLICY/g)
  console.log(`[CHECK] Total RLS policies defined: ${policyMatches ? policyMatches.length : 0}`)

  // Check 7: Compare content parity (ignoring comments/header)
  const stripHeader = (txt) => txt.replace(/^--.*$/gm, '').replace(/\s+/g, ' ').trim()
  const parity = stripHeader(mig14Content) === stripHeader(mig14TimestampedContent)
  console.log(`[CHECK] Content parity between migration 14 and timestamped copy: ${parity}`)
}

validateMigrations()
