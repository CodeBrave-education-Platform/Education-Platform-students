import fs from 'fs'
import path from 'path'

function validateMigration16() {
  console.log('=== VALIDATING MIGRATION 16 & DYNAMIC DATA SYNC ===\n')

  const studentMigPath = path.resolve('supabase/migrations/16_dynamic_data_and_schema_sync.sql')
  const adminMigPath = path.resolve('../admin dashboard/supabase/migrations/16_dynamic_data_and_schema_sync.sql')

  if (!fs.existsSync(studentMigPath)) {
    throw new Error(`Student migration file not found at ${studentMigPath}`)
  }
  if (!fs.existsSync(adminMigPath)) {
    throw new Error(`Admin migration file not found at ${adminMigPath}`)
  }

  const studentContent = fs.readFileSync(studentMigPath, 'utf8')
  const adminContent = fs.readFileSync(adminMigPath, 'utf8')

  console.log(`[PASS] Student migration found: ${studentContent.length} chars`)
  console.log(`[PASS] Admin migration found: ${adminContent.length} chars`)

  // Check 1: 100% Content Parity
  if (studentContent !== adminContent) {
    throw new Error('Parity mismatch between Student Portal and Admin Dashboard migration 16 files!')
  }
  console.log('[PASS] 100% Identical Parity between Student & Admin migration files')

  // Check 2: Batches Columns Added
  const requiredBatchCols = [
    'faculty', 'faculty_role', 'instructor_name', 'instructor_role',
    'target_year', 'schedule', 'seats_left', 'students_enrolled',
    'original_price', 'rating', 'badge', 'checklist',
    'book_kit', 'curriculum', 'is_featured', 'is_active'
  ]
  requiredBatchCols.forEach(col => {
    if (!studentContent.includes(col)) {
      throw new Error(`Missing batch column requirement: ${col}`)
    }
    console.log(`[PASS] Batches column: ${col}`)
  })

  // Check 3: Books Columns Added
  const requiredBookCols = [
    'subject', 'category', 'rating', 'reviews_count',
    'format', 'cover_image_url', 'stock'
  ]
  requiredBookCols.forEach(col => {
    if (!studentContent.includes(col)) {
      throw new Error(`Missing book column requirement: ${col}`)
    }
    console.log(`[PASS] Books column: ${col}`)
  })

  // Check 4: Announcements Table & RLS
  if (!studentContent.includes('CREATE TABLE IF NOT EXISTS public.announcements')) {
    throw new Error('Missing announcements table creation')
  }
  if (!studentContent.includes('ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;')) {
    throw new Error('Announcements RLS not enabled')
  }
  if (!studentContent.includes('"Public can view announcements"') || !studentContent.includes('"Admins and teachers manage announcements"')) {
    throw new Error('Announcements RLS policies missing')
  }
  console.log('[PASS] Announcements table & RLS policies verified')

  // Check 5: Student Bookmarks Table & RLS
  if (!studentContent.includes('CREATE TABLE IF NOT EXISTS public.student_bookmarks')) {
    throw new Error('Missing student_bookmarks table creation')
  }
  if (!studentContent.includes('ALTER TABLE public.student_bookmarks ENABLE ROW LEVEL SECURITY;')) {
    throw new Error('Student bookmarks RLS not enabled')
  }
  if (!studentContent.includes('uq_student_bookmark UNIQUE (user_id, item_type, item_id)')) {
    throw new Error('Missing unique constraint on student_bookmarks')
  }
  console.log('[PASS] Student bookmarks table & RLS policies verified')

  // Check 6: Instructors View
  if (!studentContent.includes('CREATE OR REPLACE VIEW public.instructors') || !studentContent.includes('security_invoker = true')) {
    throw new Error('Missing security_invoker instructors view')
  }
  console.log('[PASS] Instructors security_invoker view verified')

  // Check 7: Seed Data
  const requiredSeeds = [
    'INSERT INTO public.courses',
    'INSERT INTO public.batches',
    'INSERT INTO public.books',
    'INSERT INTO public.test_packages',
    'INSERT INTO public.test_exams',
    'INSERT INTO public.question_bank',
    'INSERT INTO public.exam_questions',
    'INSERT INTO public.announcements'
  ]
  requiredSeeds.forEach(seed => {
    if (!studentContent.includes(seed)) {
      throw new Error(`Missing seed block: ${seed}`)
    }
    console.log(`[PASS] Seed block present: ${seed}`)
  })

  // Check 8: No deprecated auth.role()
  const deprecatedAuthMatches = studentContent.match(/auth\.role\(\)/g)
  if (deprecatedAuthMatches && deprecatedAuthMatches.length > 0) {
    throw new Error('Found deprecated auth.role() usage in migration 16')
  }
  console.log('[PASS] Zero deprecated auth.role() calls')

  // Check 9: Extract and validate JSON literals accurately by scanning backwards from '::jsonb
  const jsonbMarkers = []
  let pos = 0
  while ((pos = studentContent.indexOf("'::jsonb", pos)) !== -1) {
    // Scan backwards from pos to find opening single quote
    let openQuotePos = -1
    let inEscape = false
    for (let i = pos - 1; i >= 0; i--) {
      if (studentContent[i] === "'" && studentContent[i - 1] !== "\\") {
        openQuotePos = i
        break
      }
    }
    if (openQuotePos !== -1) {
      const rawJson = studentContent.slice(openQuotePos + 1, pos).trim()
      jsonbMarkers.push(rawJson)
    }
    pos += 8
  }

  let jsonCount = 0
  for (const rawJson of jsonbMarkers) {
    try {
      JSON.parse(rawJson)
      jsonCount++
    } catch (e) {
      throw new Error(`Malformed JSON in migration 16: ${e.message}\nJSON content:\n${rawJson}`)
    }
  }
  console.log(`[PASS] Verified ${jsonCount} JSONB literals with valid JSON syntax`)

  console.log('\n>>> ALL 9 VALIDATION CHECKS PASSED PERFECTLY! <<<')
}

validateMigration16()
