import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TestSeriesHubClient from './TestSeriesHubClient'

export const dynamic = 'force-dynamic'

export default async function TestSeriesHubPage() {
  const supabase = await createClient()
  
  // Authenticate user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch student profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch test packages from database
  let packages = []
  try {
    const { data: dbPackages } = await supabase
      .from('test_packages')
      .select('*')
      .order('created_at', { ascending: false })
    if (dbPackages && dbPackages.length > 0) packages = dbPackages
  } catch (e) {}

  // Fetch exams from database
  let exams = []
  try {
    const { data: dbExams } = await supabase
      .from('test_exams')
      .select('id, package_id, title, duration_minutes, total_questions, is_live_ranking, activation_timestamp')
      .order('activation_timestamp', { ascending: true })
    if (dbExams && dbExams.length > 0) exams = dbExams
  } catch (e) {}

  // Fetch user's purchased test packages from invoices
  let purchasedPackageIds = []
  try {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('package_id')
      .eq('user_id', user.id) // Corrected from profile_id and authenticatedUser
      .not('package_id', 'is', null)
      
    if (invoices) {
      purchasedPackageIds = invoices.map(inv => inv.package_id)
    }
  } catch (e) {}

  // Fetch user attempts to show scorecards
  let attempts = []
  try {
    const { data: dbAttempts } = await supabase
      .from('test_attempts')
      .select('*, test_exams(title)')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
    if (dbAttempts) attempts = dbAttempts
  } catch (e) {}

  return (
    <TestSeriesHubClient
      user={user}
      profile={profile || { full_name: user.email?.split('@')[0] || 'Candidate', role: 'student' }}
      initialPackages={packages}
      initialExams={exams}
      initialAttempts={attempts}
      purchasedPackageIds={purchasedPackageIds}
    />
  )
}
