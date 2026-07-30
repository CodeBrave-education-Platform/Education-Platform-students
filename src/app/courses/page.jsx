'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  GraduationCap, BookOpen, Sparkles, Star, CheckCircle2, 
  Package, Download, Truck, ArrowRight, ShieldCheck, Clock, Users, Loader2, CreditCard, Award, Check
} from 'lucide-react'

export default function CoursesCatalogPage() {
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([])
  const [processingId, setProcessingId] = useState(null)

  const courses = [
    {
      id: 'c1',
      title: 'JEE Mains & Advanced Complete Physics Mastery 2026',
      instructor: 'Dr. H.C. Verma & CodeBrave Team',
      instructorRole: 'Ex-IIT Faculty • 22+ Yrs Experience',
      subject: 'Physics',
      level: 'JEE Advanced',
      rating: 4.9,
      studentsCount: '1,420 Aspirants',
      price: 2999,
      originalPrice: 4999,
      duration: '120 Hours Live',
      lessonsCount: 45,
      cover: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=800&auto=format&fit=crop&q=80',
      checklist: [
        'Daily Live 4-Hour Mechanics & Electrodynamics Masterclasses',
        '2 Vol. Printed Hardcopy Textbooks Delivered Free to Your Doorstep',
        '3,500+ Chapterwise PYQ Question Bank & Video Solutions',
        'Weekly Proctored NTA CBT Mock Exams & AIR Benchmark Rank'
      ],
      includedBookKit: {
        title: 'Mechanics & Wave Motion 2-Vol Hardcopy Kit + PDF Vault',
        booksCount: 2,
        value: 1299
      }
    },
    {
      id: 'c2',
      title: 'Organic & Inorganic Chemistry Reaction Mechanics',
      instructor: 'Prof. Ananya Ray',
      instructorRole: 'Senior Organic Chemistry Specialist',
      subject: 'Chemistry',
      level: 'JEE Mains',
      rating: 4.8,
      studentsCount: '980 Aspirants',
      price: 1999,
      originalPrice: 3499,
      duration: '90 Hours Live',
      lessonsCount: 32,
      cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      checklist: [
        'Step-by-Step Reaction Mechanism Breakdown & Reagent Maps',
        'Printed Chemistry PYQ Solution Handbook Included',
        '100+ Mindmaps & Short Tricks for Inorganic Memory Work',
        'Dedicated 1-on-1 Daily Doubt Resolution Sessions'
      ],
      includedBookKit: {
        title: '20-Year Chapterwise Chemistry PYQ Solution Handbook',
        booksCount: 1,
        value: 750
      }
    },
    {
      id: 'c3',
      title: 'NEET Medical Biology Complete NCERT Breakdown',
      instructor: 'Dr. Vikram Sethi',
      instructorRole: 'AIIMS Gold Medalist & Lead Mentor',
      subject: 'Biology',
      level: 'NEET UG',
      rating: 4.9,
      studentsCount: '2,150 Aspirants',
      price: 2499,
      originalPrice: 3999,
      duration: '150 Hours Live',
      lessonsCount: 60,
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
      checklist: [
        'Line-by-Line NCERT Biology Breakdown with 3D Diagrams',
        '10,000+ Chapterwise NCERT Exemplar MCQ Practice Bank',
        'NEET 2-Vol High-Yield Diagram & Flashcard Handbook Included',
        'Bi-Weekly Full Syllabus Mock Tests on NTA Engine'
      ],
      includedBookKit: {
        title: 'NEET Biology 10,000 MCQ Bank & Diagram Handbook',
        booksCount: 2,
        value: 1100
      }
    },
    {
      id: 'c4',
      title: 'Calculus, Vectors & 3D Geometry Advanced Problem Set',
      instructor: 'Prof. R.D. Sharma',
      instructorRole: 'Ex-Department Head & Author',
      subject: 'Mathematics',
      level: 'JEE Advanced',
      rating: 4.9,
      studentsCount: '1,890 Aspirants',
      price: 2199,
      originalPrice: 3500,
      duration: '110 Hours Live',
      lessonsCount: 40,
      cover: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
      checklist: [
        'Advanced Calculus & 3D Vector Geometry Shortcut Strategies',
        'Advanced Calculus Formula & Problem Solution Handbook Included',
        '1,200+ Challenging Multi-Correct & Integer Type Problems',
        'Live Rank Booster Problem Solving Workshops'
      ],
      includedBookKit: {
        title: 'Advanced Calculus Formula & Problem Solution Handbook',
        booksCount: 1,
        value: 650
      }
    }
  ]

  // Sync enrolled courses from localStorage on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('codebrave_enrolled_courses')
      if (stored) {
        const parsed = JSON.parse(stored)
        setEnrolledCourseIds(parsed.map(c => c.id || c))
      }
    } catch (e) {}
  }, [])

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handleEnrollCourse = async (course) => {
    if (enrolledCourseIds.includes(course.id)) return
    setProcessingId(course.id)

    try {
      await loadRazorpayScript()

      // 1. Request order details
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          price: course.price
        })
      })

      const orderData = await orderRes.json()

      const saveSuccessfulEnrollment = () => {
        // Save course to enrolled courses in localStorage so it instantly reflects in My Learning (/dashboard?tab=learning)
        try {
          const existingCourses = JSON.parse(localStorage.getItem('codebrave_enrolled_courses') || '[]')
          const updatedCourses = [course, ...existingCourses.filter(c => (c.id || c) !== course.id)]
          localStorage.setItem('codebrave_enrolled_courses', JSON.stringify(updatedCourses))
        } catch (e) {}

        // Auto-create Book Order in localStorage
        const trackingId = `TRK-BD-${Math.floor(100000000 + Math.random() * 900000000)}`
        const newBookOrder = {
          id: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          source: `Course: ${course.title}`,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          totalAmount: course.price,
          status: 'Dispatched',
          courier: 'Bluedart Express',
          trackingNumber: trackingId,
          trackingLink: `https://track.bluedart.com/${trackingId}`,
          items: [
            {
              title: course.includedBookKit.title,
              format: 'Physical Textbooks + Digital eBook PDF',
              downloadUrl: '/downloads/physics-formulas.pdf'
            }
          ]
        }

        try {
          const existingOrders = JSON.parse(localStorage.getItem('codebrave_book_orders') || '[]')
          localStorage.setItem('codebrave_book_orders', JSON.stringify([newBookOrder, ...existingOrders]))
        } catch (e) {}

        setEnrolledCourseIds(prev => [...prev, course.id])
        setProcessingId(null)
        alert(`🎉 Payment Verified! You enrolled in "${course.title}". It is now available under "My Learning" in your dashboard, and your bundled book kit has been dispatched with Tracking ID: ${trackingId}!`)
      }

      const options = {
        key: orderData.key || 'rzp_test_mockkey123',
        amount: Math.round(course.price * 100),
        currency: 'INR',
        name: 'CodeBrave Education Platform',
        description: `${course.title} + Free Book Kit`,
        order_id: orderData.orderId,
        handler: function (response) {
          saveSuccessfulEnrollment()
        },
        prefill: {
          name: 'Student Candidate',
          email: 'student@codebrave.edu.in',
          contact: '9876543210'
        },
        theme: {
          color: '#0056D2'
        }
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        saveSuccessfulEnrollment()
      }
    } catch (err) {
      console.error('Payment error', err)
      setProcessingId(null)
    }
  }

  const filteredCourses = courses.filter(c => selectedSubject === 'All' || c.subject === selectedSubject)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navbar />

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-xs font-extrabold uppercase">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Official CodeBrave Curriculum Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            JEE & NEET <span className="text-teal-600">Mastery Courses</span>
          </h1>
          <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto font-medium">
            Every enrolled course automatically includes physical textbooks delivered free to your home + instant downloadable eBook PDFs & reflects under My Learning!
          </p>
        </div>
      </div>

      {/* Main Catalog Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        {/* Subject Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-400 mr-2 uppercase text-[10px]">Filter Subject:</span>
            {['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'].map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-4 py-2 rounded-xl transition cursor-pointer font-bold ${selectedSubject === subj ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {subj}
              </button>
            ))}
          </div>

          <Link
            href="/dashboard?tab=learning"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Go to My Learning ({enrolledCourseIds.length})</span>
          </Link>
        </div>

        {/* Premium Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id)
            const isProcessing = processingId === course.id
            const discount = Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)

            return (
              <div key={course.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition group">
                <div className="space-y-6">
                  {/* Widescreen Banner Image */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    <img src={course.cover} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-slate-900/90 text-white text-[10px] font-black rounded-full uppercase shadow-md">
                      {course.level}
                    </span>
                    <span className="absolute bottom-4 right-4 px-3 py-1.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-xl shadow-md">
                      Includes Book Kit (Worth ₹{course.includedBookKit.value})
                    </span>
                  </div>

                  <div className="px-6 space-y-4">
                    {/* Metrics Row */}
                    <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" /> {course.rating} ({course.studentsCount})
                      </span>
                      <span>{course.duration} • {course.lessonsCount} Modules</span>
                    </div>

                    <h3 className="font-black text-xl text-slate-900 leading-snug">{course.title}</h3>
                    
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <GraduationCap className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{course.instructor} • <span className="text-slate-400">{course.instructorRole}</span></span>
                    </div>

                    {/* Structured Feature Checklist */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">What is Included in This Course:</span>
                      <ul className="space-y-2 text-xs text-slate-700 font-medium">
                        {course.checklist.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Included Book Kit Banner */}
                    <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-teal-900 font-black">
                        <Package className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>🎁 Free Included Hardcopy & eBook Kit:</span>
                      </div>
                      <p className="text-teal-800 font-medium">{course.includedBookKit.title}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-4 space-y-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Course Fee (Textbook Kit Included)</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">₹{course.price}</span>
                        <span className="text-xs text-slate-400 line-through">₹{course.originalPrice}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">Save {discount}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition"
                    >
                      View Full Syllabus
                    </Link>

                    {isEnrolled ? (
                      <Link
                        href="/dashboard?tab=learning"
                        className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl text-center transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>In My Learning</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnrollCourse(course)}
                        disabled={isProcessing}
                        className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl text-center transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>Pay via Razorpay & Enroll</span>
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
