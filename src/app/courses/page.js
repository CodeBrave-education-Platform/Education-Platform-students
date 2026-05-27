import * as React from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { BookOpen, Sparkles, Trophy, GraduationCap, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const mockCourses = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    title: 'Foundations of Mathematics & Algebra',
    description: 'Master core algebraic concepts, linear equations, inequalities, and functions. Recommended for early IIT JEE foundation tracks.',
    price: 0,
    level: 'foundation',
    features: ['12 High-definition modules', 'Weekly practice ledgers', 'Doubt solving community access']
  },
  {
    id: 'f0000000-0000-0000-0000-000000000101',
    title: '1 Rupee Real Payment Gateway Test Course',
    description: 'Use this course to test actual live or sandbox payment processing. Charged at the minimum standard currency unit of 1 INR.',
    price: 1,
    level: 'mains',
    features: ['Minimum value live gateway testing', 'Instant status callbacks', 'Razorpay signature verification']
  },
  {
    id: 'f0000000-0000-0000-0000-000000000102',
    title: '10 Rupee Micro-Seminar: JEE Exam Strategies',
    description: 'Perfect for testing medium-value sandbox or live micro-transactions. Outlines time management strategies and high-weightage topics.',
    price: 10,
    level: 'advanced',
    features: ['Micro-transaction sandbox testing', 'Syllabus weightage strategies list', 'Full enrollment ledger records']
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    title: 'IIT JEE Mains Mastery: Physics & Chemistry',
    description: 'Comprehensive preparation ledger covering kinematics, thermodynamics, organic chemistry, and chemical bonding with step-by-step guides.',
    price: 4999,
    level: 'mains',
    features: ['Premium video curriculum', '30 Full-length mock tests', 'Dedicated 1-on-1 expert checks']
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    title: 'IIT JEE Advanced: Elite Calculus & Trigonometry',
    description: 'Solve advanced level limits, continuity, differential equations, and complex variables. Outfitted for high-tier engineering candidates.',
    price: 9999,
    level: 'advanced',
    features: ['High-difficulty elite drills', 'Previous 15 years solved archives', 'Direct weekly faculty mentoring']
  }
]

export default async function CoursesPage() {
  // Initialize Supabase Server client safely
  const supabase = createServerComponentClient({ cookies: () => cookies() })
  
  // Safe Server-Side Session check to prevent layout misfires
  const { data: { session } } = await supabase.auth.getSession()

  // Fetch actual courses from DB
  const { data: dbCourses } = await supabase
    .from('courses')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  const coursesList = dbCourses && dbCourses.length > 0 ? dbCourses : mockCourses

  const getFeatures = (course) => {
    if (course.features && Array.isArray(course.features)) {
      return course.features
    }
    if (course.level === 'foundation') {
      return ['12 High-definition modules', 'Weekly practice ledgers', 'Doubt solving community access']
    } else if (course.level === 'advanced') {
      return ['High-difficulty elite drills', 'Previous 15 years solved archives', 'Direct weekly faculty mentoring']
    } else {
      return ['Premium video curriculum', '30 Full-length mock tests', 'Dedicated 1-on-1 expert checks']
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-slate-50 overflow-x-hidden font-sans select-none text-slate-800">
      
      {/* 1. STICKY GLASSMORPHIC NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo brand */}
          <Link href="/" className="flex items-center gap-2 select-none">
            <span className="text-2xl font-extrabold tracking-widest uppercase text-slate-900">
              ASENTRA
            </span>
          </Link>

          {/* Navigation link back to Dashboard */}
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-slate-650 hover:text-slate-900 font-semibold text-sm transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>&lt; Back to Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* 2. CORE CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 mt-32 pb-20 flex flex-col items-center">
        
        {/* Editorial Heading */}
        <section className="text-center max-w-3xl space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 bg-blue-100/60 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Premium Storefront</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            Elevate Your Preparation Potential
          </h1>
          <p className="text-slate-500 font-medium text-base lg:text-lg">
            Unlock curated courses led by India's top educators. Tailored pathways for IIT JEE Foundations, Mains, and Advanced exams.
          </p>
        </section>

        {/* 3. COURSES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {coursesList.map((course) => {
            const isFree = Number(course.price) === 0
            const features = getFeatures(course)

            return (
              <div 
                key={course.id}
                className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98] transition-all duration-300 relative group"
              >
                {/* Badge layout based on pricing */}
                <div className="flex justify-between items-center mb-6">
                  {isFree ? (
                    <span className="bg-slate-100 text-slate-700 border border-slate-200/50 text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider">
                      Free Track
                    </span>
                  ) : (
                    <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-sm shadow-orange-100">
                      Premium Target
                    </span>
                  )}
                  
                  {/* Exam tag level indicator */}
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {course.level}
                  </span>
                </div>

                {/* Course Details Info */}
                <div className="space-y-4 flex-1">
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    {course.description}
                  </p>

                  {/* Bullet features */}
                  <ul className="space-y-2.5 pt-4 border-t border-slate-100">
                    {features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-[11px] font-semibold text-slate-650">
                        <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price tag & CTA buttons container */}
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cost</span>
                    <span className="text-3xl font-extrabold text-slate-900">
                      {isFree ? 'Free' : `₹${Number(course.price).toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  {isFree ? (
                    <Link
                      href={session ? "/dashboard" : "/login"}
                      className="block w-full bg-slate-900 text-white py-3.5 rounded-2xl text-center text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer select-none"
                    >
                      Enroll for Free
                    </Link>
                  ) : (
                    <div>
                      {/* TODO: Razorpay Checkout SDK Integration */}
                      <Link
                        href={session ? "/dashboard?checkout=" + course.id : "/login"}
                        className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-2xl text-center text-sm font-semibold hover:opacity-95 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.99] transition-all cursor-pointer select-none"
                      >
                        Buy Now
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </main>

    </div>
  )
}
