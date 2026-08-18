import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TestSeriesHubClient from './TestSeriesHubClient'

export const dynamic = 'force-dynamic'

// High-fidelity fallback test packages for resilient zero-state rendering
const DEFAULT_FALLBACK_PACKAGES = [
  {
    id: 'pkg-hero-all-india-mock-2026',
    title: 'All-India NTA JEE Main Grand Mock Test Series 2026',
    target_exam_tag: 'JEE Main',
    campus_branch: 'Kota & Hyderabad Apex',
    is_featured: true,
    total_tests_count: 24,
    description: 'Flagship national simulation engine featuring full-length 3-hour NTA CBT replica papers, real-time live percentile prediction, national leaderboard ranking, and deep AI diagnostic reports.',
    thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    test_distribution: { chapter_drills: 12, full_mocks: 8, live_papers: 4 },
    price_ledger: { status: 'premium', price: 799, original_price: 2499 }
  },
  {
    id: 'pkg-physics-mechanics-sprint',
    title: 'Physics Mechanics & Electrodynamics Speed Sprint',
    target_exam_tag: 'JEE Advanced',
    campus_branch: 'National CBT Drill',
    is_featured: false,
    total_tests_count: 15,
    description: 'High-velocity problem-solving drills covering Rotational Motion, Gravitation, Gauss Law, and Electromagnetic Induction with instant step-by-step video solutions.',
    thumbnail_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80',
    test_distribution: { chapter_drills: 10, full_mocks: 3, live_papers: 2 },
    price_ledger: { status: 'free', price: 0, original_price: 999 }
  },
  {
    id: 'pkg-neet-biology-rapid-fire',
    title: 'NEET Biology & Human Physiology Rapid-Fire Series',
    target_exam_tag: 'NEET',
    campus_branch: 'Bangalore Medical Wing',
    is_featured: false,
    total_tests_count: 20,
    description: 'NCERT line-by-line diagrammatic assertion-reasoning drills, pedigree analysis, and full-length Botany & Zoology speed tests matching official NTA NEET blueprint.',
    thumbnail_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    test_distribution: { chapter_drills: 14, full_mocks: 4, live_papers: 2 },
    price_ledger: { status: 'premium', price: 499, original_price: 1499 }
  },
  {
    id: 'pkg-math-calculus-algebra-sprint',
    title: 'Calculus & Coordinate Geometry Problem-Solving Intensive',
    target_exam_tag: 'JEE Advanced',
    campus_branch: 'Delhi Super-30',
    is_featured: false,
    total_tests_count: 12,
    description: 'Curated multi-concept problems in Definite Integrals, Differential Equations, Vectors, 3D Geometry, and Probability with detailed step-by-step marking rubrics.',
    thumbnail_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    test_distribution: { chapter_drills: 8, full_mocks: 2, live_papers: 2 },
    price_ledger: { status: 'premium', price: 399, original_price: 1199 }
  },
  {
    id: 'pkg-chem-organic-inorganic-marathon',
    title: 'Organic & Inorganic Chemistry Memory & Speed Marathon',
    target_exam_tag: 'JEE Main',
    campus_branch: 'Hyderabad Main',
    is_featured: false,
    total_tests_count: 16,
    description: 'Named reaction mechanisms, reagent mapping, coordination compounds, and periodic trend drills with zero-error practice.',
    thumbnail_url: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80',
    test_distribution: { chapter_drills: 10, full_mocks: 4, live_papers: 2 },
    price_ledger: { status: 'free', price: 0, original_price: 799 }
  }
]

const DEFAULT_FALLBACK_EXAMS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    package_id: 'pkg-hero-all-india-mock-2026',
    title: 'NTA JEE Mains All India Grand Mock Test 01 (Live Ranking)',
    duration_minutes: 180,
    total_questions: 75,
    is_live_ranking: true,
    activation_timestamp: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    package_id: 'pkg-hero-all-india-mock-2026',
    title: 'NTA JEE Mains All India Grand Mock Test 02 (Proctored Simulation)',
    duration_minutes: 180,
    total_questions: 75,
    is_live_ranking: true,
    activation_timestamp: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    package_id: 'pkg-hero-all-india-mock-2026',
    title: 'PCM High-Yield Comprehensive Mock Drill 01',
    duration_minutes: 180,
    total_questions: 75,
    is_live_ranking: false,
    activation_timestamp: new Date().toISOString()
  },
  {
    id: 'jee-physics-sprint-1',
    package_id: 'pkg-physics-mechanics-sprint',
    title: 'JEE Physics Mechanics Speed Sprint 01',
    duration_minutes: 60,
    total_questions: 25,
    is_live_ranking: false,
    activation_timestamp: new Date().toISOString()
  },
  {
    id: 'jee-physics-sprint-2',
    package_id: 'pkg-physics-mechanics-sprint',
    title: 'Electrodynamics & Magnetism Advanced Drill',
    duration_minutes: 90,
    total_questions: 30,
    is_live_ranking: true,
    activation_timestamp: new Date().toISOString()
  },
  {
    id: 'neet-bio-sprint-1',
    package_id: 'pkg-neet-biology-rapid-fire',
    title: 'Human Physiology NCERT Mastery Sprint',
    duration_minutes: 45,
    total_questions: 50,
    is_live_ranking: false,
    activation_timestamp: new Date().toISOString()
  },
  {
    id: 'neet-bio-sprint-2',
    package_id: 'pkg-neet-biology-rapid-fire',
    title: 'Genetics & Molecular Biology Rapid Test',
    duration_minutes: 60,
    total_questions: 50,
    is_live_ranking: true,
    activation_timestamp: new Date().toISOString()
  },
  {
    id: 'math-calc-sprint-1',
    package_id: 'pkg-math-calculus-algebra-sprint',
    title: 'Integral Calculus & Differential Equations Sprint',
    duration_minutes: 60,
    total_questions: 25,
    is_live_ranking: false,
    activation_timestamp: new Date().toISOString()
  },
  {
    id: 'chem-org-sprint-1',
    package_id: 'pkg-chem-organic-inorganic-marathon',
    title: 'Organic Chemistry Reaction Mechanisms Drill',
    duration_minutes: 45,
    total_questions: 30,
    is_live_ranking: false,
    activation_timestamp: new Date().toISOString()
  }
]

export default async function TestSeriesHubPage() {
  const supabase = await createClient()
  
  // Authenticate user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch student profile
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
    if (dbPackages && dbPackages.length > 0) {
      packages = dbPackages
    } else {
      packages = DEFAULT_FALLBACK_PACKAGES
    }
  } catch (e) {
    packages = DEFAULT_FALLBACK_PACKAGES
  }

  // Fetch exams from database
  let exams = []
  try {
    const { data: dbExams } = await supabase
      .from('test_exams')
      .select('id, package_id, title, duration_minutes, total_questions, is_live_ranking, activation_timestamp')
      .order('activation_timestamp', { ascending: true })
    if (dbExams && dbExams.length > 0) {
      exams = dbExams
    } else {
      exams = DEFAULT_FALLBACK_EXAMS
    }
  } catch (e) {
    exams = DEFAULT_FALLBACK_EXAMS
  }

  // Fetch user's purchased test packages from invoices
  let purchasedPackageIds = []
  try {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('package_id')
      .eq('user_id', user.id)
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
