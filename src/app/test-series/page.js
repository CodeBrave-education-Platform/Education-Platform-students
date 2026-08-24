import { createClient } from '@/utils/supabase/server'
import TestSeriesHubClient from './TestSeriesHubClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'All-India NTA CBT Mock Test Series Hub | Asentra Education Platform',
  description: 'Proctored All-India CBT simulations, chapterwise speed drills, live ranking leaderboards, and AI diagnostics for JEE Main, Advanced, and NEET.'
}

export default async function TestSeriesHubPage() {
  const supabase = await createClient()
  
  // 1. Authenticate user session
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Fetch student profile if authenticated
  let profile = null
  if (user) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    profile = userProfile
  }

  // 3. Fetch test packages dynamically from public.test_packages
  let packages = []
  try {
    const { data: dbPackages, error: pkgError } = await supabase
      .from('test_packages')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (pkgError) {
      console.error('[TEST SERIES PAGE] Error fetching packages:', pkgError)
    }

    if (dbPackages && dbPackages.length > 0) {
      packages = dbPackages
    }
  } catch (e) {
    console.error('[TEST SERIES PAGE] Package fetch error:', e)
  }

  // 4. Fetch test exams dynamically from public.test_exams
  let exams = []
  try {
    const { data: dbExams, error: examsError } = await supabase
      .from('test_exams')
      .select('id, package_id, title, duration_minutes, total_questions, is_live_ranking, activation_timestamp, marks_scheme')
      .order('activation_timestamp', { ascending: true })

    if (examsError) {
      console.error('[TEST SERIES PAGE] Error fetching test exams:', examsError)
    }

    if (dbExams && dbExams.length > 0) {
      exams = dbExams
    }
  } catch (e) {
    console.error('[TEST SERIES PAGE] Exam fetch error:', e)
  }

  // 5. Fetch user's purchased test packages from invoices
  let purchasedPackageIds = []
  if (user) {
    try {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('package_id')
        .eq('user_id', user.id)
        .not('package_id', 'is', null)
        
      if (invoices) {
        purchasedPackageIds = invoices.map(inv => inv.package_id)
      }
    } catch (e) {
      console.error('[TEST SERIES PAGE] Error fetching package invoices:', e)
    }
  }

  // 6. Fetch user attempts to show scorecards
  let attempts = []
  if (user) {
    try {
      const { data: dbAttempts } = await supabase
        .from('test_attempts')
        .select('*, test_exams(title)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
      if (dbAttempts) attempts = dbAttempts
    } catch (e) {
      console.error('[TEST SERIES PAGE] Error fetching test attempts:', e)
    }
  }

  return (
    <TestSeriesHubClient
      user={user}
      profile={profile || (user ? { full_name: user.email?.split('@')[0] || 'Candidate', role: 'student' } : null)}
      initialPackages={packages}
      initialExams={exams}
      initialAttempts={attempts}
      purchasedPackageIds={purchasedPackageIds}
    />
  )
}
