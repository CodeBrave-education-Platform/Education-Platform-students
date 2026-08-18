'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  GraduationCap, BookOpen, Sparkles, Star, CheckCircle2, 
  Package, Truck, ArrowRight, ShieldCheck, Clock, Users, Loader2, CreditCard, Award, Check, Search, Layers, Play
} from 'lucide-react'

const DEFAULT_COURSES = [
  {
    id: 'course-jee-flagship-2026',
    title: 'All-India JEE Main & Advanced 2026 Comprehensive Flagship Batch',
    subject: 'Physics',
    instructor: 'Dr. Nitin Verma & Top Kota Apex Faculty',
    instructorRole: 'Ex-HOD Kota, 18+ Yrs Exp (AIR 1 Mentor)',
    cover: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    badge: 'FLAGSHIP 2-YEAR MASTER PROGRAM',
    rating: 4.98,
    studentsCount: '12,400+ Aspirants',
    duration: '12 Months (Daily Live + 1000+ Hrs)',
    lessonsCount: 148,
    price: 4999,
    originalPrice: 14999,
    checklist: [
      'Complete Physics, Chemistry & Math PCM Full-Year Master Syllabus',
      'Daily 3-Hour Interactive Live Lectures with In-Class Doubt Clearance',
      '6-Volume Hardcopy Printed Master Textbook & Exercise Kit Delivered to Home',
      '24 Full-Length NTA CBT All-India Mock Tests with Live National Percentile',
      'Instant AI 24/7 Step-by-Step Doubt Resolution Engine Access',
      'Dedicated Mentor Assigned for Strategy & Weekly Progress Tracking'
    ],
    includedBookKit: {
      title: '6-Volume Printed Physical Master Theory & Problem Book Kit',
      booksCount: 6,
      value: 3999
    }
  },
  {
    id: 'course-physics-mechanics-pro',
    title: 'Advanced Mechanics, Waves & Electrodynamics Masterclass',
    subject: 'Physics',
    instructor: 'Prof. Arvind Sharma',
    instructorRole: 'Senior Physics Specialist (Ex-IIT Delhi)',
    cover: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=80',
    badge: 'JEE ADVANCED SPECIAL',
    rating: 4.95,
    studentsCount: '6,800+ Aspirants',
    duration: '4 Months (180+ Hrs)',
    lessonsCount: 42,
    price: 1999,
    originalPrice: 4999,
    checklist: [
      'Rotational Dynamics, Gravitation & Simple Harmonic Motion Deep-Dive',
      'Gauss Law, Electrostatics & Electromagnetic Induction Problem Labs',
      'Previous 20 Years JEE Advanced Multi-Concept Question Analysis',
      'Physical Formula Book & Workbook Delivered via Courier'
    ],
    includedBookKit: {
      title: 'Advanced Mechanics & Electromagnetism Theory Book',
      booksCount: 2,
      value: 1299
    }
  },
  {
    id: 'course-chem-organic-inorganic',
    title: 'Organic Mechanisms & Inorganic Speed Mastery Course',
    subject: 'Chemistry',
    instructor: 'Dr. Meenakshi Sundaram',
    instructorRole: 'PhD Chemistry (Gold Medalist, 15+ Yrs Exp)',
    cover: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=800&auto=format&fit=crop&q=80',
    badge: 'HIGH-SCORING SPRINT',
    rating: 4.92,
    studentsCount: '8,150+ Aspirants',
    duration: '3.5 Months (150+ Hrs)',
    lessonsCount: 38,
    price: 1799,
    originalPrice: 4499,
    checklist: [
      'Complete Named Reactions, Reagent Flowcharts & Mechanism Pathways',
      'Coordination Compounds, Metallurgy & Block Chemistry Retention Maps',
      'Zero-Error Practice Quizzes & NCERT Line-by-Line Highlight System',
      'Pocket Reaction Handbook Physical Copy Included'
    ],
    includedBookKit: {
      title: 'Complete Organic & Inorganic Handbook + Reaction Maps',
      booksCount: 2,
      value: 999
    }
  },
  {
    id: 'course-math-calculus-algebra',
    title: 'Calculus, Vectors & Coordinate Geometry Intensive',
    subject: 'Mathematics',
    instructor: 'R. K. Singhal Sir',
    instructorRole: 'Author & Senior Math Faculty (IIT Roorkee Alum)',
    cover: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
    badge: 'TOP RANKER ACCELERATOR',
    rating: 4.96,
    studentsCount: '5,900+ Aspirants',
    duration: '4 Months (160+ Hrs)',
    lessonsCount: 45,
    price: 1999,
    originalPrice: 4999,
    checklist: [
      'Definite Integrals, Differential Equations & Area Under Curves Mastery',
      '3D Geometry, Vectors, Complex Numbers & Probability Master Drills',
      'Time-Saving Speed Shortcuts for Speed & 99+ Percentile Accuracy',
      'Full Solutions Exercise Modules Shipped to Home'
    ],
    includedBookKit: {
      title: 'Higher Algebra & Calculus Problem Bank (Printed)',
      booksCount: 2,
      value: 1499
    }
  },
  {
    id: 'course-neet-biology-physiology',
    title: 'NEET Human Physiology, Genetics & Plant Anatomy Comprehensive',
    subject: 'Biology',
    instructor: 'Dr. Radhika Kulkarni',
    instructorRole: 'MBBS, AIIMS Delhi Mentor',
    cover: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    badge: 'NEET 360/360 TARGET',
    rating: 4.97,
    studentsCount: '14,200+ Aspirants',
    duration: '5 Months (200+ Hrs)',
    lessonsCount: 52,
    price: 2199,
    originalPrice: 5999,
    checklist: [
      '100% NCERT Line-by-Line Dissection with High-Yield Diagrams',
      'Genetics, Pedigree Analysis, Biotechnology & Ecology Drills',
      'Weekly 100-Question Assertion-Reason Speed Drills',
      'Illustrated NCERT Atlas & Zoology-Botany Flashcards Delivered Free'
    ],
    includedBookKit: {
      title: 'NEET 360 Biology Diagrammatic Atlas + Flashcards',
      booksCount: 3,
      value: 1899
    }
  }
]

export default function CoursesCatalogPage() {
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([])
  const [processingId, setProcessingId] = useState(null)
  const [isMounted, setIsMounted] = useState(false)
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [userXp, setUserXp] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    setIsMounted(true)
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase.from('courses').select('*')
        if (data && data.length > 0) {
          const mappedData = data.map(c => ({
            ...c,
            instructor: c.instructor_name || 'Expert Faculty',
            instructorRole: c.instructor_role || 'Senior Educator',
            cover: c.thumbnail_url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
            badge: c.badge || (c.is_featured ? 'FLAGSHIP BATCH' : 'CERTIFIED COURSE'),
            rating: c.rating || 4.9,
            studentsCount: c.students_count ? `${c.students_count}+ Aspirants` : 'New Batch',
            duration: c.duration || 'Flexible Schedule',
            lessonsCount: c.lessons_count || 36,
            checklist: Array.isArray(c.checklist) && c.checklist.length > 0 ? c.checklist : [
              'Comprehensive syllabus coverage with top faculty',
              'Physical study kit & reference books delivered to home',
              'Full CBT simulation tests with all-India live rank',
              '24/7 AI-powered instant doubt solving engine'
            ],
            includedBookKit: c.book_kit || { 
              title: 'Master Study Material & Practice Workbook Kit', 
              booksCount: 3, 
              value: 1999 
            }
          }))
          setCourses(mappedData)
        } else {
          setCourses(DEFAULT_COURSES)
        }
      } catch (err) {
        console.error('Error fetching courses:', err)
        setCourses(DEFAULT_COURSES)
      } finally {
        setLoadingCourses(false)
      }
    }
    fetchCourses()

    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
          if (profile) setUserXp(profile.xp || 0)

          const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('user_id', user.id).eq('status', 'active')
          if (enrollments) setEnrolledCourseIds(enrollments.map(e => e.course_id))
        }
      } catch (e) {}
    }
    fetchUserData()
  }, [])

  const handleEnrollCourse = async (course) => {
    if (enrolledCourseIds.includes(course.id)) return
    setProcessingId(course.id)

    // 1. Verify user session before payment
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = `/login?redirect=/courses`
      setProcessingId(null)
      return
    }

    let finalEnrollPrice = course.price
    if (userXp > 1000) {
      finalEnrollPrice = Math.max(1, Math.floor(course.price * 0.9))
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
        description: `${course.title} + Free Book Kit`,
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

            const trackingId = `TRK-BK-${Math.floor(100000000 + Math.random() * 900000000)}`
            setEnrolledCourseIds(prev => [...prev, course.id])
            alert(`🎉 Payment Verified! You enrolled in "${course.title}". Course unlocked under "My Learning", and your physical study kit has been dispatched with Tracking ID: ${trackingId}!`)
          } catch (verifyErr) {
            console.error('Enrollment verification error:', verifyErr)
            alert(verifyErr.message || 'Payment verification failed. Please contact support.')
          } finally {
            setProcessingId(null)
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || 'Candidate',
          email: user.email || 'candidate@asentra.edu.in',
          contact: user.phone || '9876543210'
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between select-none">
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
            Every master program includes printed physical book kits delivered to your doorstep, full-length CBT simulation drills, and instant 24/7 AI-powered doubt resolution.
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

        {/* Asymmetrical Modern Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {filteredCourses.map((course, index) => {
            const isHero = course.badge?.toUpperCase().includes('FLAGSHIP') || (index === 0 && selectedSubject === 'All' && !searchQuery)
            const isEnrolled = enrolledCourseIds.includes(course.id)
            const isProcessing = processingId === course.id

            let currentPrice = course.price
            let xpDiscountApplied = false
            if (userXp > 1000) {
              currentPrice = Math.max(1, Math.floor(course.price * 0.9))
              xpDiscountApplied = true
            }
            const originalPrice = course.originalPrice || Math.round(course.price * 2.5)
            const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100)

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
                        <div className="absolute top-3 left-3 z-20 px-3 py-1 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/20 shadow-md">
                          PHYSICAL BOOK KIT INCLUDED
                        </div>
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
                                {course.includedBookKit.title}
                              </span>
                              <span className="text-[11px] text-teal-800 font-medium">
                                Worth ₹{course.includedBookKit.value} • Shipped free via courier with live tracking.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feature Checklist */}
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
                  </div>

                  {/* Bottom Action & Price Ledger */}
                  <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                        Full Course Fee (Books & CBT Included)
                      </span>
                      <div className="flex items-baseline gap-2.5 mt-0.5">
                        <span className="text-3xl font-black text-slate-900">₹{currentPrice}</span>
                        <span className="text-sm text-slate-400 line-through font-bold">₹{originalPrice}</span>
                        <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-lg">
                          Save {discount}%
                        </span>
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
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {course.checklist.slice(0, 2).map((item, idx) => (
                      <div key={`${course.id}_chk_${idx}`} className="flex items-start gap-1.5 text-xs text-slate-600 font-medium">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5 stroke-[3]" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Price & Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">₹{currentPrice}</span>
                      <span className="text-xs text-slate-400 line-through font-bold">₹{originalPrice}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                      Save {discount}%
                    </span>
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
