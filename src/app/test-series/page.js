import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TestSeriesHubClient from './TestSeriesHubClient'

export const dynamic = 'force-dynamic'

export default async function TestSeriesHubPage() {
  const supabase = await createClient()
  
  // Authenticate user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login?redirectTo=/test-series')
  }

  // Fetch student profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch all test packages
  const { data: packages, error: pkgError } = await supabase
    .from('test_packages')
    .select('*')
    .order('created_at', { ascending: false })

  if (pkgError) {
    console.error('[TEST_SERIES_HUB] Error fetching packages:', pkgError)
  }

  // Fetch all exams
  const { data: exams, error: examError } = await supabase
    .from('test_exams')
    .select('id, package_id, title, duration_minutes, total_questions, is_live_ranking, activation_timestamp')
    .order('activation_timestamp', { ascending: true })

  if (examError) {
    console.error('[TEST_SERIES_HUB] Error fetching exams:', examError)
  }

  // Fetch user attempts to show scorecards
  const { data: attempts, error: attemptError } = await supabase
    .from('test_attempts')
    .select('*, test_exams(title)')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  if (attemptError) {
    console.error('[TEST_SERIES_HUB] Error fetching attempts:', attemptError)
  }

  return (
    <TestSeriesHubClient
      user={user}
      profile={profile}
      initialPackages={packages || []}
      initialExams={exams || []}
      initialAttempts={attempts || []}
    />
  )
}
