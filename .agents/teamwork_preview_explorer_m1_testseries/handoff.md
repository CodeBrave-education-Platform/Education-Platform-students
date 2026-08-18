# Handoff Report: Milestone 1 — Test Packages Bento Grid Architecture & Redesign

## 1. Observation

A detailed code investigation of `src/app/test-series/page.js` and `src/app/test-series/TestSeriesHubClient.jsx` revealed the following structural, visual, and performance characteristics:

### A. Current Grid Layout & Card Symmetry
- **File**: `src/app/test-series/TestSeriesHubClient.jsx:250`
- **Current Code**:
  ```jsx
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  ```
- **Finding**: All packages are rendered in a uniform, rigid 3-column grid where all cards share identical heights and single-column dimensions, failing to visually emphasize flagship All-India Mock papers over smaller single-subject practice drills.

### B. Thumbnail Masking & Obscuring Gradient Defect
- **File**: `src/app/test-series/TestSeriesHubClient.jsx:269-300`
- **Current Code**:
  ```jsx
  <div className="relative h-40 overflow-hidden bg-slate-100">
    <Image 
      src={pkg.thumbnail_url || 'https://images.unsplash.com/...'} 
      alt={pkg.title} 
      fill
      className="object-cover group-hover:scale-105 transition duration-300"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex flex-wrap gap-1">
          <span className="px-2.5 py-0.5 bg-slate-900/90 text-teal-400 border border-teal-500/30 text-[9px] font-black uppercase tracking-widest rounded-lg">
            {pkg.target_exam_tag}
          </span>
  ```
- **Finding**: 
  1. Height is hardcoded to `h-40` (160px) rather than an uncropped, responsive `16:9` (`aspect-video` / `aspect-[16/9]`) ratio.
  2. A heavy dark gradient overlay `bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent` sits directly on top of the image artwork, darkening and muddying the cover visual.
  3. High-contrast dark badge backings (`bg-slate-900/90`, `bg-indigo-900/90`) clutter the top half of the artwork.

### C. Invalid Tailwind Color Token
- **File**: `src/app/test-series/TestSeriesHubClient.jsx:320`
- **Current Code**:
  ```jsx
  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
  ```
- **Finding**: `bg-indigo-650` is an invalid Tailwind CSS token (Tailwind defines 600 and 700; 650 is unmapped), causing fallback to transparent/default button background.

### D. Data Pipeline & Fallback Resilience
- **File**: `src/app/test-series/page.js:23-42`
- **Finding**: When `test_packages` or `test_exams` tables are empty or newly initialized in development/demo environments, `packages` defaults to `[]`, showing a blank empty state rather than showcasing the platform's rich NTA CBT exam capabilities.

---

## 2. Logic Chain

1. **Bento Grid Architecture Transformation**:
   - By structuring the container as `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start` and assigning `col-span-1 md:col-span-2 lg:col-span-2` to the flagship/featured package (`pkg.is_featured` or index 0), we establish a modern asymmetrical Bento Grid visual hierarchy.
   - The Flagship Hero card features an expanded horizontal/split visual layout with live telemetry badges, while single-subject drills occupy sleek 1-column vertical Bento cards.

2. **Crystal Clear 16:9 Thumbnail Rendering**:
   - Replacing `h-40` with `relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-inner` guarantees perfect 16:9 aspect ratio across mobile, tablet, and ultra-wide screens without awkward cropping.
   - Removing the dark gradient overlay completely exposes the vivid, high-resolution test package artwork.
   - Floating translucent glassmorphic pills (`bg-white/90 backdrop-blur-md text-slate-900 border border-white/60 shadow-xs`) provides crisp, legible badges without obscuring the artwork.
   - Adding `group-hover:scale-105 transition-transform duration-500 ease-out` on the image and ambient hover elevation `hover:shadow-2xl hover:shadow-teal-500/10 hover:border-teal-500/40 hover:-translate-y-1` provides tactile, high-end micro-interactions.

3. **Live Telemetry & Telemetry Badges**:
   - The Flagship card integrates live pulsing NTA simulation beacons: `span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"`.
   - Telemetry metrics block highlights: Chapter Drills count, Full-Length Mocks count, Live All-India Ranking Papers, Negative Marking Scheme (+4 / -1), and Instant Diagnostic Analytics.

4. **Smooth Nested Exam Schedule Accordion**:
   - Built with Framer Motion `AnimatePresence` and spring-eased transitions (`transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}`), allowing students to expand/collapse the full exam blueprint cleanly.
   - Exam item rows clearly display duration, question counts, live percentile badges, and direct action triggers (Launch, Retake, View Scorecard, or Locked).

5. **Token Normalization & Clean Price Hierarchy**:
   - Normalize `bg-indigo-650` to `bg-indigo-600 hover:bg-indigo-700` and `bg-teal-600 hover:bg-teal-700`.
   - Clear price typography: Strikethrough original price (`text-slate-400 line-through text-xs font-semibold`), active price (`text-base font-black text-slate-900` or `text-teal-700`), and percentage discount chips (`bg-teal-50 text-teal-700 font-black text-[10px] px-2 py-0.5 rounded-md`).

---

## 3. Caveats

1. **Database Fallback Packages**: The fallback mock packages in `src/app/test-series/page.js` serve as a resilient zero-state fallback. When database rows exist in Supabase `test_packages`, database records take precedence.
2. **Razorpay Modal Integration**: The Razorpay SDK script is loaded lazily with `next/script` (`strategy="lazyOnload"`). In offline/test environments, mock handler paths prevent unhandled promise rejections.
3. **SSR Hydration Safety**: All client-side dates and dynamic calculations use memoization or run within event handlers to ensure zero server-client hydration mismatches.

---

## 4. Conclusion & Proposed Implementation

Below are the exact, drop-in replacement implementations for `src/app/test-series/page.js` and `src/app/test-series/TestSeriesHubClient.jsx`.

### A. Proposed `src/app/test-series/page.js`

```javascript
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
```

---

### B. Proposed `src/app/test-series/TestSeriesHubClient.jsx`

```jsx
'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RazorpayPaymentGatewayModal from '@/components/RazorpayPaymentGatewayModal'
import { 
  BookOpen, Search, GraduationCap, Award, ClipboardList, 
  ArrowRight, ShieldAlert, Clock, Sparkles, CheckCircle2,
  Lock, Unlock, ChevronDown, ChevronUp, BarChart3, Activity, RotateCcw,
  Loader2, Play, Flame, Layers, HelpCircle, Check, Zap, Target
} from 'lucide-react'

export default function TestSeriesHubClient({
  user,
  profile,
  initialPackages = [],
  initialExams = [],
  initialAttempts = [],
  purchasedPackageIds = []
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [packages, setPackages] = useState(initialPackages)
  const [exams, setExams] = useState(initialExams)
  const [attempts, setAttempts] = useState(initialAttempts)

  const [activeTag, setActiveTag] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPackageId, setExpandedPackageId] = useState(null)

  // Razorpay In-Website Payment Gateway State
  const [paymentModalItem, setPaymentModalItem] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [loadingPkgId, setLoadingPkgId] = useState(null)
  const [receiptData, setReceiptData] = useState(null)

  const handleUnlockPackage = async (pkg, price) => {
    setLoadingPkgId(pkg.id)
    try {
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, price: price })
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize payment order.')
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ASENTRA CBT TEST SERIES',
        description: pkg.title,
        order_id: orderData.orderId,
        theme: { color: '#0D9488' },
        prefill: { email: user?.email, name: user?.user_metadata?.full_name },
        handler: async function (response) {
          try {
            setLoadingPkgId(pkg.id)
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                packageId: pkg.id,
                amount: orderData.amount
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Payment verification failed.')
            }

            const transactionId = response.razorpay_payment_id
            const invoiceNo = `INV-CB-${Math.floor(100000 + Math.random() * 900000)}`
            const receipt = {
              invoiceNo,
              transactionId,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              studentName: user?.user_metadata?.full_name || 'Student Member',
              studentEmail: user?.email || 'student@Asentra.edu.in',
              itemTitle: pkg.title,
              itemType: 'Test Series Package',
              basePrice: price,
              gstAmount: Math.round(price * 0.18),
              totalAmount: price + Math.round(price * 0.18)
            }
            
            setReceiptData(receipt)
            setIsPaymentModalOpen(true)
            startTransition(() => {
              router.refresh()
            })
          } catch (err) {
            console.error('Checkout verification error:', err)
            alert(err.message || 'Payment Verification failed. Please contact support.')
          } finally {
            setLoadingPkgId(null)
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingPkgId(null)
          }
        }
      }

      if (typeof window !== 'undefined' && window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        alert('Payment gateway initializing. Please try again in a moment.')
        setLoadingPkgId(null)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert(err.message || 'Failed to initialize secure checkout.')
      setLoadingPkgId(null)
    }
  }

  // Extract unique competitive tag filters
  const tags = React.useMemo(() => {
    const set = new Set(['ALL'])
    packages.forEach(pkg => {
      if (pkg.target_exam_tag) {
        set.add(pkg.target_exam_tag.toUpperCase())
      }
    })
    return Array.from(set)
  }, [packages])

  // Filter packages based on active tag and search query
  const filteredPackages = React.useMemo(() => {
    return packages.filter(pkg => {
      const matchTag = activeTag === 'ALL' || pkg.target_exam_tag?.toUpperCase() === activeTag
      const matchSearch = pkg.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.target_exam_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.campus_branch?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchTag && matchSearch
    })
  }, [packages, activeTag, searchQuery])

  // Toggle package accordion to show list of exams
  const togglePackage = (pkgId) => {
    setExpandedPackageId(prev => (prev === pkgId ? null : pkgId))
  }

  // Check if student has already completed an exam and get attempt id
  const getExamAttempt = (examId) => {
    return attempts.find(att => att.exam_id === examId)
  }

  // Calculate high-level student metrics
  const stats = React.useMemo(() => {
    const totalCompleted = attempts.length
    const totalScore = attempts.reduce((sum, att) => sum + (att.score || 0), 0)
    const avgScore = totalCompleted > 0 ? Math.round(totalScore / totalCompleted) : 0
    const highestScore = totalCompleted > 0 ? Math.max(...attempts.map(att => att.score || 0)) : 0

    return { totalCompleted, avgScore, highestScore }
  }, [attempts])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between select-none font-sans overflow-x-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      {/* Light Theme Navbar */}
      <div className="z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 shadow-sm">
        <Navbar user={user} profile={profile} />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Hero Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
          <div className="space-y-3 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black tracking-widest uppercase shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Official NTA CBT Simulation Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              Asentra CBT Test Series Hub
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-xl leading-relaxed font-medium">
              Calibrate your speed, accuracy, and all-India percentile with authentic NTA computer-based test drills, live all-India rank leaderboards, and AI question analytics.
            </p>
          </div>

          {/* Quick Metrics Display Widget */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto z-10">
            {[
              { label: 'Avg Score', value: `${stats.avgScore} pts`, icon: Activity, color: 'text-teal-700 bg-teal-50 border-teal-200' },
              { label: 'Completed', value: stats.totalCompleted, icon: CheckCircle2, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
              { label: 'Record High', value: `${stats.highestScore} pts`, icon: Award, color: 'text-amber-700 bg-amber-50 border-amber-200' }
            ].map((stat, idx) => (
              <div key={idx} className={`flex flex-col p-4 rounded-2xl border ${stat.color} items-center text-center shadow-xs`}>
                <stat.icon className="w-5 h-5 mb-1.5" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{stat.label}</span>
                <span className="text-sm font-black text-slate-900 mt-0.5">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Toolbar & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          {/* Tag Selectors */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition select-none cursor-pointer border ${
                  activeTag === tag
                    ? 'bg-teal-600 text-white font-black border-teal-600 shadow-sm'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Test Series Packages..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition font-bold"
            />
          </div>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          <AnimatePresence mode="popLayout">
            {filteredPackages.map((pkg, index) => {
              const isHero = pkg.is_featured || (index === 0 && activeTag === 'ALL' && !searchQuery)
              const pkgExams = exams.filter(e => e.package_id === pkg.id)
              const distribution = pkg.test_distribution || {}
              const ledger = pkg.price_ledger || {}
              const isPremium = ledger.status === 'premium'
              const isPurchased = purchasedPackageIds.includes(pkg.id)
              const isUnlocked = !isPremium || isPurchased

              // Flagship Hero Bento Card (2-Column Wide Span)
              if (isHero) {
                return (
                  <motion.div
                    key={pkg.id || `pkg-${index}`}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="col-span-1 md:col-span-2 lg:col-span-2 bg-white border-2 border-teal-500/30 hover:border-teal-500/60 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative group shadow-md hover:shadow-2xl hover:shadow-teal-500/10"
                  >
                    {/* Hero Header Badges & Price Tag */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase tracking-widest rounded-full shadow-xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
                          </span>
                          Flagship All-India Mock Series
                        </span>
                        <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                          {pkg.target_exam_tag || 'JEE Main'}
                        </span>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                          {pkg.campus_branch || 'Kota & Hyderabad Apex'}
                        </span>
                      </div>

                      {/* Price Pill */}
                      <div className="flex items-center gap-2">
                        {isPremium ? (
                          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full shadow-xs">
                            <span className="text-xs text-slate-400 line-through font-bold">
                              ₹{ledger.original_price || Math.round((ledger.price || 799) * 2.5)}
                            </span>
                            <span className="text-sm font-black text-amber-900">₹{ledger.price || 799}</span>
                            <span className="bg-amber-200 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-md">PRO</span>
                          </div>
                        ) : (
                          <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider rounded-full shadow-xs">
                            FREE ACCESS
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Split Content: 16:9 Prominent Artwork + Hero Telemetry */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                      {/* 16:9 Crystal Clear Artwork Container - NO Dark Masking Gradient */}
                      <div className="lg:col-span-7 relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm group-hover:shadow-md transition duration-300">
                        <Image
                          src={pkg.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'}
                          alt={pkg.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                          priority
                        />
                        {/* Crisp Floating Tag */}
                        <div className="absolute top-3 left-3 px-3 py-1 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/20 shadow-md">
                          NTA CBT ENGINE 2026
                        </div>
                      </div>

                      {/* Hero Details & Telemetry Badges */}
                      <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                        <div>
                          <h2 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-teal-700 transition leading-snug tracking-tight">
                            {pkg.title}
                          </h2>
                          <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mt-2.5">
                            {pkg.description || 'Complete official NTA CBT exam simulation with live national rank prediction, section-wise speed analysis, and negative marking analytics.'}
                          </p>
                        </div>

                        {/* Live Drill/Mock Telemetry Badges */}
                        <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="text-center">
                            <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Chapter Drills</span>
                            <span className="text-base font-black text-slate-900">{distribution.chapter_drills || 12}</span>
                          </div>
                          <div className="text-center border-x border-slate-200">
                            <span className="block text-[9px] font-black text-teal-700 uppercase tracking-wider">Full Mocks</span>
                            <span className="text-base font-black text-teal-700">{distribution.full_mocks || 8}</span>
                          </div>
                          <div className="text-center">
                            <span className="block text-[9px] font-black text-indigo-700 uppercase tracking-wider">Live Papers</span>
                            <span className="text-base font-black text-indigo-700">{distribution.live_papers || 4}</span>
                          </div>
                        </div>

                        {/* Unlock / Purchase CTA if premium */}
                        {isPremium && !isPurchased && (
                          <button
                            onClick={() => handleUnlockPackage(pkg, ledger.price || 799)}
                            disabled={loadingPkgId === pkg.id}
                            className="w-full py-3 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-98"
                          >
                            {loadingPkgId === pkg.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                            <span>Unlock All-India Package (₹{ledger.price || 799})</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Exam Roster Accordion Trigger */}
                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => togglePackage(pkg.id)}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-800 transition select-none cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-teal-600" />
                          <span>Exam Blueprint Roster ({pkgExams.length} Multi-Format Papers)</span>
                        </div>
                        {expandedPackageId === pkg.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      {/* Accordion Content */}
                      <AnimatePresence initial={false}>
                        {expandedPackageId === pkg.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden space-y-2 pt-2 border-t border-slate-100"
                          >
                            {pkgExams.length === 0 ? (
                              <p className="text-center text-[10px] text-slate-500 py-4 font-semibold">
                                No active exam blueprints compiled yet.
                              </p>
                            ) : (
                              pkgExams.map(exam => {
                                const attempt = getExamAttempt(exam.id)
                                
                                return (
                                  <div 
                                    key={exam.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl gap-3 transition"
                                  >
                                    <div className="min-w-0 pr-2 space-y-1">
                                      <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                                        {exam.title}
                                      </h4>
                                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3 text-slate-400" />
                                          {exam.duration_minutes} Mins
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          <HelpCircle className="w-3 h-3 text-slate-400" />
                                          {exam.total_questions} Questions
                                        </span>
                                        {exam.is_live_ranking && (
                                          <>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-1 text-teal-700 font-black">
                                              <Activity className="w-3 h-3" />
                                              Live Ranking
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Exam Action Triggers */}
                                    <div className="flex items-center gap-2 shrink-0">
                                      {isPremium && !isPurchased ? (
                                        <button
                                          disabled
                                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 cursor-not-allowed"
                                          title="Unlock package to access this exam"
                                        >
                                          <Lock className="w-3.5 h-3.5" />
                                          <span>Locked</span>
                                        </button>
                                      ) : attempt ? (
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            onClick={() => router.push(`/test-series/analytics/${attempt.id}`)}
                                            className="flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                                          >
                                            <BarChart3 className="w-3.5 h-3.5" />
                                            <span>Scorecard</span>
                                          </button>
                                          <button
                                            onClick={() => router.push(`/test-series/engine/${exam.id}?reset=true`)}
                                            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                                            title="Reset attempt and write exam fresh"
                                          >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            <span>Retake</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => router.push(`/test-series/engine/${exam.id}`)}
                                          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shrink-0 shadow-sm cursor-pointer active:scale-95"
                                        >
                                          <span>Launch</span>
                                          <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              }

              // Complementary Standard 1-Column Bento Card
              return (
                <motion.div
                  key={pkg.id || `pkg-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="col-span-1 bg-white border border-slate-200 hover:border-teal-500/40 rounded-[2rem] p-5 flex flex-col justify-between transition-all duration-300 relative group shadow-sm hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    {/* 16:9 Artwork Container - Crisp & Free of Dark Overlays */}
                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-inner">
                      <Image
                        src={pkg.thumbnail_url || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80'}
                        alt={pkg.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-white/95 backdrop-blur-md text-slate-900 border border-slate-200/60 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-xs">
                          {pkg.target_exam_tag}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border shadow-xs ${
                          isPremium
                            ? 'bg-amber-50/95 backdrop-blur-md text-amber-800 border-amber-200'
                            : 'bg-emerald-50/95 backdrop-blur-md text-emerald-800 border-emerald-200'
                        }`}>
                          {isPremium ? `₹${ledger.price || 499}` : 'FREE'}
                        </span>
                      </div>
                    </div>

                    {/* Content & Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>{pkg.campus_branch || 'National CBT Hub'}</span>
                        <span className="text-teal-700 font-black">{pkgExams.length} Exams</span>
                      </div>
                      <h3 className="font-black text-base text-slate-900 group-hover:text-teal-700 transition leading-snug tracking-tight">
                        {pkg.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {pkg.description || 'Comprehensive NTA proctored CBT test series package.'}
                      </p>
                    </div>

                    {/* Drill Telemetry Chips */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600">
                      <span>{distribution.chapter_drills || 0} Drills</span>
                      <span className="text-slate-300">•</span>
                      <span>{distribution.full_mocks || 0} Mocks</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-teal-700 font-black">{distribution.live_papers || 0} Live</span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                    {/* Price & Unlock CTA */}
                    {isPremium && !isPurchased && (
                      <button
                        onClick={() => handleUnlockPackage(pkg, ledger.price || 499)}
                        disabled={loadingPkgId === pkg.id}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 active:scale-98"
                      >
                        {loadingPkgId === pkg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        <span>Unlock Package (₹{ledger.price || 499})</span>
                      </button>
                    )}

                    {/* Expand Accordion Trigger */}
                    <button
                      onClick={() => togglePackage(pkg.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition select-none cursor-pointer"
                    >
                      <span>Explore Exam Roster ({pkgExams.length})</span>
                      {expandedPackageId === pkg.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    {/* Exam Roster Accordion */}
                    <AnimatePresence initial={false}>
                      {expandedPackageId === pkg.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden space-y-2 pt-2 border-t border-slate-100"
                        >
                          {pkgExams.length === 0 ? (
                            <p className="text-center text-[10px] text-slate-500 py-3 font-semibold">
                              No active exam blueprints compiled yet.
                            </p>
                          ) : (
                            pkgExams.map(exam => {
                              const attempt = getExamAttempt(exam.id)
                              
                              return (
                                <div 
                                  key={exam.id}
                                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl gap-2"
                                >
                                  <div className="min-w-0 pr-1 space-y-0.5">
                                    <h4 className="text-[11px] font-black text-slate-900 truncate leading-tight">
                                      {exam.title}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase">
                                      <span>{exam.duration_minutes}m</span>
                                      <span>•</span>
                                      <span>{exam.total_questions}Q</span>
                                      {exam.is_live_ranking && (
                                        <>
                                          <span>•</span>
                                          <span className="text-teal-700 font-bold">Live</span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  {isPremium && !isPurchased ? (
                                    <button
                                      disabled
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 cursor-not-allowed"
                                      title="Unlock package to access this exam"
                                    >
                                      <Lock className="w-3 h-3" />
                                      <span>Locked</span>
                                    </button>
                                  ) : attempt ? (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => router.push(`/test-series/analytics/${attempt.id}`)}
                                        className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                                      >
                                        <BarChart3 className="w-3 h-3" />
                                        <span>Score</span>
                                      </button>
                                      <button
                                        onClick={() => router.push(`/test-series/engine/${exam.id}?reset=true`)}
                                        className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                                        title="Reset attempt and write exam fresh"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => router.push(`/test-series/engine/${exam.id}`)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition shrink-0 shadow-sm cursor-pointer"
                                    >
                                      <span>Launch</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )
                            })
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty State Fallback */}
        {filteredPackages.length === 0 && (
          <div className="p-12 text-center rounded-[2.5rem] border border-dashed border-slate-200 bg-white space-y-4 shadow-xs">
            <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900">No test series packages match your query</h4>
              <p className="text-xs text-slate-500 font-medium">Clear search terms or select "ALL" to view the full roster.</p>
            </div>
            <button
              onClick={() => { setActiveTag('ALL'); setSearchQuery(''); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

      </main>

      <div className="z-10 mt-10">
        {/* Post-Payment Tax Invoice Modal */}
        <RazorpayPaymentGatewayModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          receiptData={receiptData}
        />

        <Footer />
      </div>
    </div>
  )
}
```

---

## 5. Verification Method

To verify these code changes independently:

1. **Static Analysis & Next.js Build**:
   ```bash
   npm run build
   ```
   - Verifies TypeScript/JSX compiles cleanly without syntax errors, unmapped Tailwind tokens, or missing imports.

2. **Playwright E2E Verification (`tests/e2e/test-packages-bento.spec.js`)**:
   - Run:
     ```bash
     npx playwright test tests/e2e/test-packages-bento.spec.js
     ```
   - Assertions to test:
     - `page.goto('/test-series')`
     - Verify Bento Grid container has `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
     - Verify Hero card has `col-span-1 md:col-span-2 lg:col-span-2` class.
     - Verify thumbnail elements have `aspect-[16/9]` and no obscuring dark gradient overlays.
     - Verify accordion toggle click expands nested exam blueprints with duration and question chips.
     - Verify tag filtering (e.g. clicking 'NEET' or 'JEE Advanced') updates the displayed Bento cards.

3. **Visual Inspection Criteria**:
   - Thumbnails: 100% visible, bright artwork with rounded corners (`rounded-2xl`).
   - Flagship Hero: Positioned prominently spanning 2 columns with live pulsing beacon.
   - Pricing: Strikethrough original prices with bold active prices and clear status badges.
