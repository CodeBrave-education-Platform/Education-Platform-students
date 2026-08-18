'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { createClient } from '@/utils/supabase/client'
import { 
  GraduationCap, Calendar, Clock, BookOpen, CheckCircle2, 
  ArrowLeft, ArrowRight, ShieldAlert, Sparkles, Loader2, Award, Play
} from 'lucide-react'
import Footer from '@/components/Footer'

const getDefaultThumbnail = (level) => {
  const defaultThumbs = {
    foundation: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    mains: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=800&q=80',
    advanced: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'
  };
  return defaultThumbs[level] || defaultThumbs.foundation;
}

const getThumbnailUrl = (course) => {
  if (!course || !course.thumbnail_url || course.thumbnail_url.trim() === '') {
    return getDefaultThumbnail(course?.level);
  }

  let url = course.thumbnail_url.trim();

  // Normalize absolute URLs without protocol (e.g. www.bing.com -> https://www.bing.com)
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/') && !url.startsWith('data:')) {
    if (url.includes('.') && !url.includes(' ')) {
      url = 'https://' + url;
    }
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      let mediaUrl = null;
      for (const [key, value] of u.searchParams.entries()) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'mediaurl' || lowerKey === 'imgurl' || lowerKey === 'imageurl') {
          mediaUrl = value;
          break;
        }
      }
      if (mediaUrl) {
        return decodeURIComponent(mediaUrl);
      }
    } catch (e) {}
    return url;
  }

  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }

  return getDefaultThumbnail(course.level);
}

const handleImageError = (e, level) => {
  e.target.src = getDefaultThumbnail(level);
}

export default function CourseDetailsClient({ course, lessons, initialEnrolled, user }) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  
  const [enrolled, setEnrolled] = useState(initialEnrolled)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const isFree = Number(course.price) === 0
  const originalPrice = course.original_price || (course.price > 0 ? course.price * 1.25 : 0)
  const discountPercent = Math.round(((originalPrice - course.price) / originalPrice) * 100)
  const thumbUrl = getThumbnailUrl(course)

  // handle enroll for free courses
  const handleEnroll = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const { data: newEnroll, error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id
        })
        .select()
        .single()

      if (error) throw error

      setEnrolled(true)
      alert('Enrollment Successful! Welcome to the classroom.')
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      console.error('Enrollment error:', err)
      setErrorMsg(err.message || 'Failed to enroll in the course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // handle Razorpay checkout
  const handleRazorpayCheckout = async () => {
    const price = course.price !== undefined && course.price !== null ? Number(course.price) : 0
    if (price === 0 || isNaN(price)) {
      await handleEnroll()
      return
    }
    setLoading(true)
    setErrorMsg('')
    try {
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
        throw new Error(orderData.error || 'Failed to initialize payment order.')
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SuSd4sFUgQBxn0',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ASENTRA ACADEMY',
        description: course.title,
        order_id: orderData.id,
        theme: {
          color: '#0D9488' // Teal brand theme color
        },
        prefill: {
          email: user.email,
          contact: ''
        },
        notes: {
          userId: user.id,
          courseId: course.id
        },
        handler: async function (response) {
          try {
            setLoading(true)
            
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                courseId: course.id,
                amount: orderData.amount
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Payment verification failed.')
            }

            // Auto-provision accompanying Hardcopy Book Kit into Book Orders
            try {
              const bookKitTitle = course.bookKit || `${course.title} Printed Textbook Set`;
              const newBookOrder = {
                id: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                source: 'Course Enrollment',
                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                totalAmount: 0,
                status: 'Dispatched & In Transit',
                courier: 'Bluedart Express',
                trackingNumber: `TRK-BD-${Math.floor(100000000 + Math.random() * 900000000)}`,
                trackingLink: 'https://track.bluedart.com/',
                items: [
                  {
                    title: bookKitTitle,
                    format: 'Hardcopy Textbook Kit + Instant eBook PDF',
                    downloadUrl: '/downloads/physics-formulas.pdf'
                  }
                ]
              };
              const existingOrders = JSON.parse(localStorage.getItem('Asentra_book_orders') || '[]');
              localStorage.setItem('Asentra_book_orders', JSON.stringify([newBookOrder, ...existingOrders]));
            } catch (e) {
              console.warn('Book provision error:', e);
            }

            setEnrolled(true)
            startTransition(() => {
              router.refresh()
            })
          } catch (err) {
            console.error('Enrollment state transition error:', err)
            alert(err.message || 'Verification failed. Please contact support.')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error('Checkout error:', err)
      setErrorMsg(err.message || 'Failed to initialize checkout gateway.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] dark:bg-zinc-950 font-sans text-slate-800 dark:text-zinc-200">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Premium Glassmorphic Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-zinc-800/50 py-4 px-6 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer tactile-press"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 px-3 py-1 rounded-full border border-teal-100/30">
              JEE Training
            </span>
          </div>
        </div>
      </nav>

      {/* Main Course Layout container */}
      <main className="max-w-7xl mx-auto px-6 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Side: Course Detail and Syllabus Timeline */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Header Title Information */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border select-none ${
                course.level === 'advanced' 
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400' 
                  : 'bg-teal-50 border-teal-200 text-teal-600 dark:bg-teal-950/20 dark:border-teal-900/40 dark:text-teal-400'
              }`}>
                JEE {course.level || 'Foundation'}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 select-none">
                {course.language || 'Hinglish'}
              </span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight leading-tight">
              {course.title}
            </h1>
            
            <p className="text-sm leading-relaxed text-slate-500 dark:text-zinc-400 font-medium">
              {course.description || 'Access comprehensive dynamic curriculum structures engineered for complete conceptual mastery.'}
            </p>
          </div>

          {/* Academic Highlight Matrix */}
          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-zinc-800/50 rounded-3xl p-6 lg:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <GraduationCap className="w-5 h-5 shrink-0" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audience</h4>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {course.aspirant_info || 'IIT-JEE Aspirants'}
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-500">
                <Calendar className="w-5 h-5 shrink-0" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline</h4>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {course.batch_info || 'Starts 1 Jun, 2026'}
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-500">
                <Clock className="w-5 h-5 shrink-0" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chapters</h4>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                {lessons.length} Core Lectures & Exams
              </p>
            </div>
          </div>

          {/* Dynamic Syllabus Timelines */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                Curriculum syllabus chapters
              </h2>
            </div>

            <div className="relative border-l border-slate-200/80 dark:border-zinc-800/80 pl-6 space-y-8 select-none">
              {lessons.map((lesson, idx) => (
                <div 
                  key={lesson.id} 
                  className={`relative group transition-all duration-200 ${
                    enrolled 
                      ? 'cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 p-4 rounded-2xl -mx-4' 
                      : ''
                  }`}
                  onClick={() => {
                    if (enrolled) {
                      router.push(`/learn/${course.id}?lesson=${lesson.id}`)
                    }
                  }}
                >
                  
                  {/* Glowing vertical point marker */}
                  <span className={`absolute top-5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 ring-4 ring-[#F8FAFC] dark:ring-zinc-950 transition-colors group-hover:border-teal-500 ${
                    enrolled ? '-left-[15px]' : '-left-[31px]'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 group-hover:bg-teal-500 transition-colors" />
                  </span>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>CHAPTER 0{idx + 1}</span>
                      <span>•</span>
                      <span>LECTURE MODULE</span>
                      {enrolled && (
                        <>
                          <span>•</span>
                          <span className="text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 inline" /> Play Lesson
                          </span>
                        </>
                      )}
                    </div>
                    
                    <h3 className="text-sm font-black text-slate-800 dark:text-zinc-200 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {lesson.title}
                    </h3>
                    
                    {lesson.assignment_title && (
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 border border-slate-200/40 dark:border-zinc-800/40 px-2 py-0.5 rounded text-[8px] font-semibold text-slate-500 dark:text-zinc-400">
                        <Award className="w-3 h-3 text-amber-500" />
                        <span>Worksheet: {lesson.assignment_title}</span>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Sticky Course Action Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            
            {/* Visual Action Panel */}
            <div className="bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 shadow-md rounded-[2.5rem] overflow-hidden flex flex-col relative">
              
              {/* Aspect-Video strict widescreen image */}
              <div className="relative w-full aspect-video bg-slate-100 overflow-hidden shrink-0">
                <img 
                  src={thumbUrl} 
                  alt={course.title}
                  loading="lazy"
                  onError={(e) => handleImageError(e, course.level)}
                  className="w-full h-full object-cover object-center"
                />
                {enrolled && (
                  <span className="absolute top-4 left-4 z-20 px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded-full shadow-sm">
                    Enrolled
                  </span>
                )}
              </div>

              {/* Action content pricing & CTAs */}
              <div className="p-6 space-y-6">
                
                {/* Cost Row baseline aligned */}
                <div className="border-b border-slate-100 dark:border-zinc-800/60 pb-5">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                      {isFree ? 'Free' : `₹${Number(course.price).toLocaleString('en-IN')}`}
                    </span>
                    {!isFree && originalPrice > course.price && (
                      <>
                        <span className="text-sm font-medium text-slate-400 line-through">
                          ₹{Number(Math.round(originalPrice)).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded-md tracking-wide">
                          {discountPercent}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                    (FULL CURRICULUM ACCESS)
                  </p>
                </div>

                {errorMsg && (
                  <div className="flex gap-2 items-start p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Refactored High-Conversion Button Hierarchy */}
                <div className="flex flex-col gap-3">
                  {enrolled ? (
                    <button
                      onClick={() => router.push(`/learn/${course.id}`)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors cursor-pointer select-none flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Resume Syllabus</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      {isFree ? (
                        <button
                          onClick={handleEnroll}
                          disabled={loading}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm shadow-teal-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer select-none"
                        >
                          {loading ? (
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          ) : (
                            <span>Enroll Free</span>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={handleRazorpayCheckout}
                          disabled={loading}
                          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm shadow-teal-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer select-none"
                        >
                          {loading ? (
                            <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          ) : (
                            <span>Buy Now</span>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Quality Guarantees list */}
                <div className="space-y-3.5 text-[10px] font-bold text-slate-500 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800/60 pt-5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Server-validated testing telemetry</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Synchronized doubt community panels</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Syllabus homework worksheets included</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Zero-Trust Security disclaimer notice */}
            <div className="flex items-start gap-2.5 p-4 bg-slate-100/50 dark:bg-zinc-900/30 rounded-2xl border border-slate-200/50 dark:border-zinc-800/40 text-[10px] text-slate-500 dark:text-zinc-500 select-none">
              <svg className="w-4.5 h-4.5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Transactions are secured with zero-trust validation keys to prevent active session hijackings.</span>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
