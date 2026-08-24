'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  GraduationCap, BookOpen, Sparkles, Star, CheckCircle2, 
  Package, Truck, ArrowRight, ShieldCheck, Clock, Users, Loader2, CreditCard, Award, Check, Search, Layers, Play
} from 'lucide-react'

export default function CoursesCatalogClient({ 
  initialCourses = [], 
  initialEnrolledCourseIds = [], 
  userXp = 0,
  user = null 
}) {
  const router = useRouter()
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(initialEnrolledCourseIds)
  const [processingId, setProcessingId] = useState(null)
  const [courses, setCourses] = useState(initialCourses)
  const supabase = createClient()

  useEffect(() => {
    // Keep user's active enrollments synced with database
    const syncEnrollments = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', currentUser.id)
            .eq('status', 'active')
          if (enrollments && enrollments.length > 0) {
            setEnrolledCourseIds(enrollments.map(e => e.course_id))
          }
        }
      } catch (e) {
        console.error('Error syncing course enrollments:', e)
      }
    }
    syncEnrollments()
  }, [])

  const handleEnrollCourse = async (course) => {
    if (enrolledCourseIds.includes(course.id)) return
    setProcessingId(course.id)

    // 1. Verify user session before payment
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      window.location.href = `/login?redirect=/courses`
      setProcessingId(null)
      return
    }

    let finalEnrollPrice = Number(course.price) || 0
    if (userXp > 1000 && finalEnrollPrice > 0) {
      finalEnrollPrice = Math.max(1, Math.floor(finalEnrollPrice * 0.9))
    }

    // Free course enrollment
    if (finalEnrollPrice === 0) {
      try {
        const { error } = await supabase
          .from('enrollments')
          .upsert({
            user_id: currentUser.id,
            course_id: course.id,
            status: 'active'
          }, { onConflict: 'user_id,course_id' })

        if (error) throw error

        setEnrolledCourseIds(prev => [...prev, course.id])
        alert(`🎉 You have successfully enrolled in "${course.title}"!`)
        router.refresh()
      } catch (err) {
        console.error('Course enrollment error:', err)
        alert(err.message || 'Failed to enroll in course.')
      } finally {
        setProcessingId(null)
      }
      return
    }

    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          price: finalEnrollPrice
        })
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize checkout order.')
      }

      const options = {
        key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: Math.round(finalEnrollPrice * 100),
        currency: 'INR',
        name: 'Asentra Education Platform',
        description: `${course.title}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            setProcessingId(course.id)
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_signature: response.razorpay_signature,
                courseId: course.id,
                amount: Math.round(finalEnrollPrice * 100)
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Payment verification failed.')
            }

            setEnrolledCourseIds(prev => [...prev, course.id])
            alert(`🎉 Payment Verified! You enrolled in "${course.title}". Course unlocked under "My Learning"!`)
            router.refresh()
          } catch (verifyErr) {
            console.error('Enrollment verification error:', verifyErr)
            alert(verifyErr.message || 'Payment verification failed. Please contact support.')
          } finally {
            setProcessingId(null)
          }
        },
        prefill: {
          name: currentUser.user_metadata?.full_name || 'Candidate',
          email: currentUser.email || 'candidate@asentra.edu.in',
          contact: currentUser.phone || '9876543210'
        },
        theme: {
          color: '#0D9488'
        }
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        throw new Error('Razorpay payment SDK not loaded.')
      }
    } catch (err) {
      console.error('Payment error:', err)
      alert(err.message || 'Payment initialization failed.')
      setProcessingId(null)
    }
  }

  const subjects = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology']

  const filteredCourses = courses.filter(c => {
    const matchSubject = selectedSubject === 'All' || c.subject?.toLowerCase() === selectedSubject.toLowerCase()
    const matchSearch = !searchQuery || 
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.instructor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.badge?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchSubject && matchSearch
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between select-none pb-20 md:pb-0">
      {/* Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      {/* Navigation Bar */}
      <div className="z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 shadow-xs">
        <Navbar />
      </div>

      {/* Hero Header Section */}
      <div className="bg-white border-b border-slate-200 py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Official JEE & NEET Master Academic Programs</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Comprehensive Courses & <span className="text-teal-600">Master Batches</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Every master program includes comprehensive syllabus coverage, printed physical book kits delivered to your doorstep, full-length CBT simulation drills, and instant 24/7 AI-powered doubt resolution.
          </p>
        </div>
      </div>

      {/* Main Catalog Section */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex-1 space-y-8">
        
        {/* Filter Toolbar & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Subject Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {subjects.map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer border ${
                  selectedSubject === subj 
                    ? 'bg-teal-600 text-white font-black border-teal-600 shadow-sm' 
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Search Box & Enrolled Quick Link */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search courses, mentors..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 font-bold outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition"
              />
            </div>
            <Link
              href="/dashboard?tab=learning"
              className="shrink-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-teal-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition"
            >
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">My Learning</span>
              <span className="px-1.5 py-0.5 bg-teal-600 text-white text-[10px] font-black rounded-full">
                {enrolledCourseIds.length}
              </span>
            </Link>
          </div>
        </div>

        {/* Empty state */}
        {filteredCourses.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Courses Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? `No courses matching "${searchQuery}". Try a different search query.` : 'There are currently no courses published in this subject. Please check back later.'}
            </p>
          </div>
        )}

        {/* Asymmetrical Modern Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {filteredCourses.map((course, index) => {
            const isHero = course.badge?.toUpperCase().includes('FLAGSHIP') || (index === 0 && selectedSubject === 'All' && !searchQuery)
            const isEnrolled = enrolledCourseIds.includes(course.id)
            const isProcessing = processingId === course.id

            let currentPrice = course.price
            let xpDiscountApplied = false
            if (userXp > 1000 && currentPrice > 0) {
              currentPrice = Math.max(1, Math.floor(course.price * 0.9))
              xpDiscountApplied = true
            }
            const originalPrice = course.originalPrice || Math.round(course.price * 2.5)
            const discount = originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0

            // Flagship Hero Card (2-Column Bento Span)
            if (isHero) {
              return (
                <div
                  key={`${course.id}_hero_${index}`}
                  className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-[2.5rem] border-2 border-teal-500/30 hover:border-teal-500/60 p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative group shadow-md hover:shadow-2xl hover:shadow-teal-500/10"
                >
                  <div>
                    {/* Top Badges & Live Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase tracking-widest rounded-full shadow-xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
                          </span>
                          Flagship Academic Program
                        </span>
                        <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                          {course.subject || 'All Subjects'}
                        </span>
                        {xpDiscountApplied && (
                          <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            10% Ranker Discount
                          </span>
                        )}
                      </div>

                      {/* Rating & Aspirants */}
                      <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{course.rating}</span>
                        <span className="text-slate-500 font-bold ml-1">({course.studentsCount})</span>
                      </div>
                    </div>

                    {/* Dual-Column Split: Uncropped Thumbnail with Ambient Blur + Program Intel */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                      {/* Uncropped Media Container */}
                      <div className="lg:col-span-6 relative aspect-[16/9] sm:aspect-[4/3] lg:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 shadow-inner group">
                        {/* Ambient Backdrop Blur */}
                        <img 
                          src={course.cover} 
                          alt="" 
                          aria-hidden="true" 
                          className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-35" 
                        />
                        {/* Foreground Uncropped Artwork */}
                        <img 
                          src={course.cover} 
                          alt={course.title} 
                          className="relative z-10 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out" 
                        />
                        {course.includedBookKit && (
                          <div className="absolute top-3 left-3 z-20 px-3 py-1 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/20 shadow-md">
                            PHYSICAL BOOK KIT INCLUDED
                          </div>
                        )}
                      </div>

                      {/* Right Details */}
                      <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                        <div>
                          <h2 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-teal-700 transition leading-snug tracking-tight">
                            {course.title}
                          </h2>
                          
                          {/* Faculty Pill */}
                          <div className="flex items-center gap-2.5 mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">{course.instructor}</p>
                              <p className="text-[10px] text-slate-500 font-semibold truncate">{course.instructorRole}</p>
                            </div>
                          </div>

                          {/* Quick Telemetry Chips */}
                          <div className="flex flex-wrap gap-2 mt-3 text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              {course.duration}
                            </span>
                            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                              <Layers className="w-3.5 h-3.5 text-indigo-600" />
                              {course.lessonsCount} Modules & Tests
                            </span>
                          </div>
                        </div>

                        {/* Included Physical Book Box Banner */}
                        {course.includedBookKit && (
                          <div className="p-3.5 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-start gap-3">
                            <Package className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <span className="font-black text-teal-900 block">
                                {course.includedBookKit.title || 'Master Study Material Kit'}
                              </span>
                              <span className="text-[11px] text-teal-800 font-medium">
                                Worth ₹{course.includedBookKit.value || 1999} • Shipped free via courier with live tracking.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feature Checklist */}
                    {course.checklist && course.checklist.length > 0 && (
                      <div className="space-y-2.5 pt-4 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Program Inclusions & Benefits:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {course.checklist.map((item, idx) => (
                            <div key={`${course.id}_feat_${idx}`} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                              <div className="w-4 h-4 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 border border-teal-200">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                              <span className="leading-snug">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action & Price Ledger */}
                  <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                        Full Course Fee (Books & CBT Included)
                      </span>
                      <div className="flex items-baseline gap-2.5 mt-0.5">
                        <span className="text-3xl font-black text-slate-900">₹{currentPrice}</span>
                        {originalPrice > currentPrice && (
                          <>
                            <span className="text-sm text-slate-400 line-through font-bold">₹{originalPrice}</span>
                            <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-lg">
                              Save {discount}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/courses/${course.id}`}
                        className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition border border-slate-200"
                      >
                        View Syllabus
                      </Link>

                      {isEnrolled ? (
                        <Link
                          href="/dashboard?tab=learning"
                          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl text-center transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>In My Learning</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleEnrollCourse(course)}
                          disabled={isProcessing}
                          className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl text-center transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              <span>Enroll Now (₹{currentPrice})</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            // Standard Modular Bento Card (1-Column)
            return (
              <div 
                key={`${course.id}_mod_${index}`} 
                className="col-span-1 bg-white rounded-3xl border border-slate-200 hover:border-slate-300 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-lg relative group"
              >
                <div className="space-y-4">
                  {/* Uncropped 16:9 Thumbnail Container */}
                  <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 shadow-inner group">
                    <img 
                      src={course.cover} 
                      alt="" 
                      aria-hidden="true" 
                      className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-35" 
                    />
                    <img 
                      src={course.cover} 
                      alt={course.title} 
                      className="relative z-10 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out" 
                    />
                    <span className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 bg-slate-900/90 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow-sm">
                      {course.badge || course.subject}
                    </span>
                    {xpDiscountApplied && (
                      <span className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-black rounded-lg uppercase shadow-sm flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" /> 10% Off
                      </span>
                    )}
                  </div>

                  {/* Rating and Duration */}
                  <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" /> {course.rating} ({course.studentsCount})
                    </span>
                    <span className="text-[11px] text-slate-400">{course.lessonsCount} Modules</span>
                  </div>

                  {/* Course Title */}
                  <h3 className="font-black text-base text-slate-900 leading-snug group-hover:text-teal-700 transition line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Instructor Chip */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <GraduationCap className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate">{course.instructor}</span>
                  </div>

                  {/* Mini Checklist Summary */}
                  {course.checklist && course.checklist.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {course.checklist.slice(0, 2).map((item, idx) => (
                        <div key={`${course.id}_chk_${idx}`} className="flex items-start gap-1.5 text-xs text-slate-600 font-medium">
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5 stroke-[3]" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Price & Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">₹{currentPrice}</span>
                      {originalPrice > currentPrice && (
                        <span className="text-xs text-slate-400 line-through font-bold">₹{originalPrice}</span>
                      )}
                    </div>
                    {discount > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                        Save {discount}%
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition"
                    >
                      Syllabus
                    </Link>

                    {isEnrolled ? (
                      <Link
                        href="/dashboard?tab=learning"
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl text-center transition flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Enrolled</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnrollCourse(course)}
                        disabled={isProcessing}
                        className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl text-center transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Enroll</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <Footer />
    </div>
  )
}
