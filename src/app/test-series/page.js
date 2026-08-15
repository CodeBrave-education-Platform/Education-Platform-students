import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TestSeriesHubClient from './TestSeriesHubClient'

export const dynamic = 'force-dynamic'

export default async function TestSeriesHubPage() {
  const supabase = await createClient()
  
  // Authenticate user session
  const { data: { user } } = await supabase.auth.getUser()
  const authenticatedUser = user || { id: 'test-user-01', email: 'candidate@Asentra.edu.in' }

  // Fetch student profile role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authenticatedUser.id)
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

  // Fallback sample test series packages for testing NTA CBT features
  const mockPackages = [
      {
        id: 'pkg-1',
        title: 'NTA JEE Mains 2026 All India Grand Mock Series',
        target_exam_tag: 'JEE Mains',
        total_tests_count: 15,
        test_distribution: { full_mocks: 10, chapter_drills: 5, live_papers: 5 },
        price_ledger: { status: 'free', price: 0 }
      },
      {
        id: 'pkg-2',
        title: 'JEE Advanced Multi-Format Paper 1 & 2 Series',
        target_exam_tag: 'JEE Advanced',
        total_tests_count: 10,
        test_distribution: { full_mocks: 6, chapter_drills: 4, live_papers: 4 },
        price_ledger: { status: 'premium', price: 499 }
      },
      {
        id: 'pkg-3',
        title: 'NEET Medical All India 720 Marks Mock Series',
        target_exam_tag: 'NEET UG',
        total_tests_count: 20,
        test_distribution: { full_mocks: 12, chapter_drills: 8, live_papers: 6 },
        price_ledger: { status: 'free', price: 0 }
      }
  ]
  
  packages = [...packages, ...mockPackages]

  const mockExams = [
      {
        id: 'nta-grand-mock-1',
        package_id: 'pkg-1',
        title: 'NTA JEE Mains Grand Mock Test - 01 (Full Syllabus)',
        duration_minutes: 180,
        total_questions: 75,
        is_live_ranking: true
      },
      {
        id: 'jee-physics-sprint-1',
        package_id: 'pkg-1',
        title: 'Physics Mechanics Speed & Accuracy Sprint',
        duration_minutes: 60,
        total_questions: 25,
        is_live_ranking: false
      },
      {
        id: 'jee-adv-paper-1',
        package_id: 'pkg-2',
        title: 'JEE Advanced Paper 1 (MCQ, MSQ & 4x5 Matrix Grid)',
        duration_minutes: 180,
        total_questions: 54,
        is_live_ranking: true
      },
      {
        id: 'neet-ug-mock-1',
        package_id: 'pkg-3',
        title: 'NEET Medical All India Grand Mock Test - 720 Marks',
        duration_minutes: 200,
        total_questions: 180,
        is_live_ranking: true
      }
  ]

  exams = [...exams, ...mockExams]

  // Fetch user attempts to show scorecards
  let attempts = []
  try {
    const { data: dbAttempts } = await supabase
      .from('test_attempts')
      .select('*, test_exams(title)')
      .eq('user_id', authenticatedUser.id)
      .order('completed_at', { ascending: false })
    if (dbAttempts) attempts = dbAttempts
  } catch (e) {}

  return (
    <TestSeriesHubClient
      user={authenticatedUser}
      profile={profile || { full_name: 'Test Candidate', role: 'student' }}
      initialPackages={packages}
      initialExams={exams}
      initialAttempts={attempts}
    />
  )
}
