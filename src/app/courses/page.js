'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  BookOpen, Sparkles, Trophy, GraduationCap, ArrowLeft, ArrowRight, 
  ShieldCheck, Loader2, CreditCard, Award, User
} from 'lucide-react'

const mockCourses = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    title: 'Foundations of Mathematics & Algebra',
    description: 'Master core algebraic concepts, linear equations, inequalities, and functions. Recommended for early IIT JEE foundation tracks.',
    price: 0,
    original_price: 0,
    level: 'foundation',
    ribbon: 'ONLINE',
    language: 'Hinglish',
    aspirant_info: 'For IIT-JEE Aspirants',
    batch_info: 'Starts on 1 Jun, 2026 Ends on 28 Jun, 2028',
    thumbnail_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    features: ['12 High-definition modules', 'Weekly practice ledgers', 'Doubt solving community access']
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    title: 'Arjuna JEE 2.0 2027',
    description: 'Master the complete Class 11 & 12 Syllabus for IIT JEE. Recommended for dedicated JEE 2027 aspirants.',
    price: 4800,
    original_price: 5500,
    level: 'mains',
    ribbon: 'ONLINE',
    language: 'Hinglish',
    aspirant_info: 'For IIT-JEE Aspirants',
    batch_info: 'Starts on 1 Jun, 2026 Ends on 28 Jun, 2028',
    thumbnail_url: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=800&q=80',
    features: ['Premium video curriculum', '30 Full-length mock tests', 'Dedicated 1-on-1 expert checks']
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    title: 'Arjuna JEE 2027 + Lakshya JEE 2028',
    description: 'Elite combo track package including foundational modules, Mains, and Advanced standard syllabus.',
    price: 8800,
    original_price: 12400,
    level: 'advanced',
    ribbon: 'ONLINE',
    language: 'Hinglish',
    aspirant_info: 'For IIT-JEE Aspirants',
    batch_info: 'Starts on 13 Apr, 2026 Ends on 30 Jun, 2028',
    thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    features: ['High-difficulty elite drills', 'Previous 15 years solved archives', 'Direct weekly faculty mentoring']
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    title: 'Vidyapeeth 11 JEE (Target 2028)',
    description: 'Offline classroom learning center track with expert classroom faculty at the Vidyapeeth study hub.',
    price: 5000,
    original_price: 5000,
    level: 'mains',
    ribbon: 'OFFLINE',
    language: 'Hinglish',
    aspirant_info: '11 JEE Target 2028',
    batch_info: 'Starts on 1 Apr, 2026 Ends on 30 Mar, 2028',
    thumbnail_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    features: ['Classroom offline lectures', 'Personalized mentor checks', 'Comprehensive study kits included']
  },
  {
    id: 'f0000000-0000-0000-0000-000000000101',
    title: '1 Rupee Real Payment Gateway Test Course',
    description: 'Use this course to test actual live or sandbox payment processing. Charged at the minimum standard currency unit of 1 INR.',
    price: 1,
    original_price: 100,
    level: 'mains',
    ribbon: 'ONLINE',
    language: 'Hinglish',
    aspirant_info: 'For IIT-JEE Aspirants',
    batch_info: 'Starts on 1 Jun, 2026 Ends on 28 Jun, 2028',
    thumbnail_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
    features: ['Minimum value live gateway testing', 'Instant status callbacks', 'Razorpay signature verification']
  }
]

export default function CoursesPage() {
  const router = useRouter()
  const supabase = createClient()

  // Dynamic state Management
  const [coursesList, setCoursesList] = useState(mockCourses)
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        // 1. Fetch user session
        const { data: { session: activeSession } } = await supabase.auth.getSession()
        setSession(activeSession)
        setUser(activeSession?.user || null)

        // 2. Fetch actual database courses
        const { data: dbCourses, error: dbError } = await supabase
          .from('courses')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false })

        if (!dbError && dbCourses && dbCourses.length > 0) {
          // Map DB courses to have dynamic mock fields for visual consistency
          const mappedCourses = dbCourses.map(course => {
            const mockMatch = mockCourses.find(mc => mc.id === course.id)
            return {
              ...course,
              original_price: course.original_price || mockMatch?.original_price || course.price * 1.25,
              ribbon: course.ribbon || mockMatch?.ribbon || 'ONLINE',
              language: course.language || mockMatch?.language || 'Hinglish',
              aspirant_info: course.aspirant_info || mockMatch?.aspirant_info || 'For IIT-JEE Aspirants',
              batch_info: course.batch_info || mockMatch?.batch_info || 'Starts on 1 Jun, 2026 Ends on 28 Jun, 2028',
              thumbnail_url: course.thumbnail_url || mockMatch?.thumbnail_url || null
            }
          })
          setCoursesList(mappedCourses)
        }
      } catch (err) {
        console.error('Error loading dynamic courses catalog:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const getThumbnailUrl = (course) => {
    if (course.thumbnail_url) return course.thumbnail_url
    
    // Aesthetic fallbacks matched by difficulty track
    const defaultThumbs = {
      foundation: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
      mains: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=800&q=80',
      advanced: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'
    }
    return defaultThumbs[course.level] || defaultThumbs.foundation
  }

  // Official Razorpay JS SDK Checkout overlay trigger
  const handleRazorpayCheckout = async (course) => {
    if (!user) {
      router.push('/login')
      return
    }

    setCheckoutLoadingId(course.id)
    try {
      // Step A: Fetch order creation parameters from secure server-side API
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          price: course.price
        })
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize transaction order ID.')
      }

      // Step B: Configure Razorpay JS Checkout Overlay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SuSd4sFUgQBxn0',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ASENTRA ACADEMY',
        description: course.title,
        order_id: orderData.id,
        theme: {
          color: '#2563EB' // Premium dynamic deep blue overlay accent
        },
        prefill: {
          email: user.email,
          contact: ''
        },
        // Step C: Razorpay payment transaction completed handler
        handler: async function (response) {
          try {
            setCheckoutLoadingId(course.id) // keep loading during verification
            
            // Call server-side route to securely verify signatures and persist enrollment
            const verifyResponse = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: course.id,
                userId: user.id
              })
            })

            const verifyResult = await verifyResponse.json()

            if (verifyResponse.ok && verifyResult.success) {
              alert('Enrollment Successful! Welcome to ASENTRA Academy.')
              router.push('/dashboard')
            } else {
              alert('Signature verification failed: ' + (verifyResult.error || 'Potential transaction mismatch.'))
            }
          } catch (verifyErr) {
            console.error('Signature Verification Error:', verifyErr)
            alert('An error occurred during transaction validation: ' + verifyErr.message)
          } finally {
            setCheckoutLoadingId(null)
          }
        },
        modal: {
          ondismiss: function () {
            setCheckoutLoadingId(null)
          }
        }
      }

      // Step D: Open official Razorpay modal directly
      const razorpayObject = new window.Razorpay(options)
      razorpayObject.open()
    } catch (err) {
      console.error('Razorpay Checkout initialization failed:', err)
      alert(err.message || 'Failed to initialize payment gateway. Check network.')
      setCheckoutLoadingId(null)
    }
  }

  // Free course enrollment action
  const handleFreeEnrollment = async (course) => {
    if (!user) {
      router.push('/login')
      return
    }

    setCheckoutLoadingId(course.id)
    try {
      // Securely create zero-price mock enrollments directly in Supabase
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id,
          status: 'active'
        })

      if (enrollError && enrollError.code !== '23505') throw enrollError

      alert('Successfully enrolled in the free track!')
      router.push('/dashboard')
    } catch (err) {
      console.error('Free Enrollment Error:', err)
      alert('Failed to register free track: ' + err.message)
    } finally {
      setCheckoutLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-slate-50 overflow-x-hidden font-sans select-none text-slate-800 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Official script loader injected lazily to optimize hydration performance */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload" 
      />

      {/* 1. STICKY GLASSMORPHIC NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 px-6 py-4 dark:bg-zinc-900/70 dark:border-zinc-800/50 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 select-none">
            <span className="text-2xl font-extrabold tracking-widest uppercase text-slate-900 dark:text-white">
              ASENTRA
            </span>
          </Link>

          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-slate-650 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white font-semibold text-sm transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* 2. CORE CONTAINER */}
      <main className="max-w-7xl mx-auto px-6 mt-32 pb-20 flex flex-col items-center">
        
        {/* Editorial Heading */}
        <section className="text-center max-w-3xl space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 bg-blue-100/60 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Premium Storefront</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Elevate Your Preparation Potential
          </h1>
          <p className="text-slate-550 dark:text-zinc-400 font-medium text-base lg:text-lg">
            Unlock premium curricula led by India's top educators. Tailored pathways for IIT JEE Foundations, Mains, and Advanced exams.
          </p>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-450" />
            <p className="text-xs font-bold text-slate-400 dark:text-zinc-500">Loading premium educational catalogue...</p>
          </div>
        ) : (
          /* 3. COURSES GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-none">
            {coursesList.map((course) => {
              const isFree = Number(course.price) === 0
              const thumbUrl = getThumbnailUrl(course)
              const isCheckingOut = checkoutLoadingId === course.id

              return (
                <div 
                  key={course.id}
                  className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/80 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99] transition-all duration-300 relative group p-0 min-h-[585px]"
                >
                  {/* Premium Widescreen Banner Image Header */}
                  <div className="w-full h-52 overflow-hidden relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent z-10" />
                    <img 
                      src={thumbUrl} 
                      alt={course.title}
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                    />

                  </div>

                  {/* Card Content Section */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div>
                      {/* Title & Language Row */}
                      <div className="flex items-start justify-between gap-2.5">
                        <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[9px] px-2 py-0.5 rounded font-black tracking-wide">
                            {course.language || 'Hinglish'}
                          </span>
                          {/* WhatsApp capsule */}
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 cursor-pointer hover:scale-105 transition-transform">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.993L2 22l5.233-1.371a9.936 9.936 0 004.777 1.21h.005c5.505 0 9.989-4.478 9.99-9.984A9.97 9.97 0 0012.012 2zm5.78 14.101c-.273.767-1.355 1.396-1.854 1.488-.475.088-.934.331-3.034-.5-2.684-1.06-4.385-3.83-4.521-4.01-.132-.18-1.077-1.431-1.077-2.729 0-1.298.675-1.936.915-2.195.24-.259.525-.324.7-.324.175 0 .35 0 .5.013.159.009.373-.062.584.45.22.535.751 1.831.816 1.966.065.132.109.288.022.463-.088.175-.132.282-.263.435-.132.153-.276.341-.393.458-.132.132-.271.276-.118.539.153.263.682 1.118 1.464 1.815.998.89 1.838 1.164 2.1.132.263-.132.569-.307.744-.45.175-.143.35-.123.525-.062s1.107.525 1.298.621c.191.096.319.143.366.223.048.08.048.463-.225 1.23z"/>
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Detail metadata list */}
                      <div className="space-y-2 mt-4 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{course.aspirant_info || 'For IIT-JEE Aspirants'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{course.batch_info || 'Starts on 1 Jun, 2026 Ends on 28 Jun, 2028'}</span>
                        </div>
                      </div>

                      {/* dark Premium banner (matching PW design) */}
                      <div className="bg-slate-950 dark:bg-zinc-900 text-white px-4 py-2.5 rounded-xl flex justify-between items-center text-[10px] font-black shadow-md mt-4 select-none tracking-wide">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                          <span>Premium Features Included</span>
                        </div>
                        <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm shrink-0">
                          INFINITY
                        </span>
                      </div>
                    </div>

                    {/* Cost Row & Action Buttons */}
                    <div className="space-y-4 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-2xl font-black text-slate-900 dark:text-zinc-100">
                            {isFree ? 'Free' : `₹${Number(course.price).toLocaleString('en-IN')}`}
                          </span>
                          {!isFree && course.original_price > course.price && (
                            <>
                              <span className="text-xs font-semibold text-slate-400 line-through mt-1">
                                ₹{Number(course.original_price).toLocaleString('en-IN')}
                              </span>
                              <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[9px] px-2 py-0.5 rounded-lg font-black tracking-wide border border-emerald-100/10">
                                Discount of {Math.round(((course.original_price - course.price) / course.original_price) * 100)}% applied
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                          (FOR FULL BATCH)
                        </p>
                      </div>

                      {/* Dual explorer & buying button grid matching reference image */}
                      <div className="grid grid-cols-2 gap-3 border-t border-slate-100/80 dark:border-zinc-800/80 pt-5 mt-2">
                        <Link
                          href="/dashboard"
                          className="border border-blue-600 hover:bg-blue-50/50 dark:border-blue-500/70 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-450 text-center py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none cursor-pointer flex items-center justify-center"
                        >
                          EXPLORE
                        </Link>
                        
                        {isFree ? (
                          <button
                            onClick={() => handleFreeEnrollment(course)}
                            disabled={isCheckingOut}
                            className="bg-blue-600 hover:bg-blue-750 text-white text-center py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {isCheckingOut ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span>ENROLL FREE</span>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRazorpayCheckout(course)}
                            disabled={isCheckingOut}
                            className="bg-blue-600 hover:bg-blue-750 text-white text-center py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                          >
                            {isCheckingOut ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <span>BUY NOW</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
