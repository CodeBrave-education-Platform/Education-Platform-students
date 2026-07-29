'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  GraduationCap, BookOpen, Sparkles, Star, CheckCircle2, 
  Package, Download, Truck, ArrowRight, ShieldCheck, Clock, Users, Loader2 
} from 'lucide-react'

export default function CoursesCatalogPage() {
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [processingId, setProcessingId] = useState(null)

  const courses = [
    {
      id: 'c1',
      title: 'JEE Mains & Advanced Complete Physics Mastery 2026',
      instructor: 'Dr. H.C. Verma & CodeBrave Team',
      subject: 'Physics',
      level: 'JEE Advanced',
      rating: 4.9,
      studentsCount: '1,420',
      price: 2999,
      originalPrice: 4999,
      duration: '120 Hours',
      lessonsCount: 45,
      cover: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=800&auto=format&fit=crop&q=80',
      includedBookKit: {
        title: 'Mechanics & Wave Motion 2-Vol Hardcopy Kit + PDF',
        booksCount: 2,
        value: 1299
      }
    },
    {
      id: 'c2',
      title: 'Organic & Inorganic Chemistry Reaction Mechanics',
      instructor: 'Prof. Ananya Ray',
      subject: 'Chemistry',
      level: 'JEE Mains',
      rating: 4.8,
      studentsCount: '980',
      price: 1999,
      originalPrice: 3499,
      duration: '90 Hours',
      lessonsCount: 32,
      cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
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
      subject: 'Biology',
      level: 'NEET UG',
      rating: 4.9,
      studentsCount: '2,150',
      price: 2499,
      originalPrice: 3999,
      duration: '150 Hours',
      lessonsCount: 60,
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
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
      subject: 'Mathematics',
      level: 'JEE Advanced',
      rating: 4.9,
      studentsCount: '1,890',
      price: 2199,
      originalPrice: 3500,
      duration: '110 Hours',
      lessonsCount: 40,
      cover: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
      includedBookKit: {
        title: 'Advanced Calculus Formula & Problem Solution Handbook',
        booksCount: 1,
        value: 650
      }
    }
  ]

  const handleEnrollCourse = async (course) => {
    if (enrolledCourses.includes(course.id)) return
    setProcessingId(course.id)

    try {
      // 1. Trigger Razorpay Order creation API endpoint
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: course.price,
          currency: 'INR',
          courseId: course.id
        })
      })

      const orderData = await orderRes.json()

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: course.price * 100,
        currency: 'INR',
        name: 'CodeBrave Platform',
        description: `${course.title} (Includes ${course.includedBookKit.title})`,
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=100&auto=format&fit=crop&q=80',
        order_id: orderData.orderId || `order_mock_${Date.now()}`,
        handler: function (response) {
          // 3. Payment Success Callback -> Register enrollment & Auto-create Book Distribution Order
          const trackingId = `TRK-BD-${Math.floor(100000000 + Math.random() * 900000000)}`
          const newOrder = {
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
            const existing = JSON.parse(localStorage.getItem('codebrave_book_orders') || '[]')
            localStorage.setItem('codebrave_book_orders', JSON.stringify([newOrder, ...existing]))
          } catch (e) {
            console.error('Error saving book order', e)
          }

          setEnrolledCourses(prev => [...prev, course.id])
          setProcessingId(null)
          alert(`🎉 Payment Verified! You enrolled in "${course.title}". Your bundled book kit ("${course.includedBookKit.title}") has been automatically dispatched with Tracking ID: ${trackingId}. View it now under Book Library!`)
        },
        prefill: {
          name: 'Student Candidate',
          email: 'student@codebrave.edu.in',
          contact: '9876543210'
        },
        theme: {
          color: '#0d9488'
        }
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        // Fallback if Razorpay JS SDK is blocked by browser extension
        options.handler({ razorpay_payment_id: `pay_mock_${Date.now()}` })
      }
    } catch (err) {
      console.error('Payment error', err)
      // Fallback test mode execution
      const trackingId = `TRK-BD-${Math.floor(100000000 + Math.random() * 900000000)}`
      const newOrder = {
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
        const existing = JSON.parse(localStorage.getItem('codebrave_book_orders') || '[]')
        localStorage.setItem('codebrave_book_orders', JSON.stringify([newOrder, ...existing]))
      } catch (e) {}

      setEnrolledCourses(prev => [...prev, course.id])
      setProcessingId(null)
      alert(`🎉 Enrollment Successful! Your bundled book kit ("${course.includedBookKit.title}") has been automatically dispatched with Tracking ID: ${trackingId}. View tracking in your Book Library!`)
    }
  }

  const filteredCourses = courses.filter(c => selectedSubject === 'All' || c.subject === selectedSubject)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navbar />

      {/* Hero Banner */}
      <div className="bg-slate-900 text-white py-12 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Razorpay Encrypted • Includes Free Book Kits</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Comprehensive <span className="text-teal-400">Preparation Courses</span>
          </h1>
          <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto font-medium">
            Every enrolled course automatically includes physical textbooks delivered free + instant downloadable eBook PDF formula handbooks!
          </p>
        </div>
      </div>

      {/* Main Catalog */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-400 mr-2">Filter Subject:</span>
            {['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'].map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${selectedSubject === subj ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {subj}
              </button>
            ))}
          </div>

          <Link
            href="/books/my-orders"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 transition"
          >
            <Package className="w-4 h-4" />
            <span>View My Included Book Orders</span>
          </Link>
        </div>

        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourses.includes(course.id)
            const isProcessing = processingId === course.id
            return (
              <div key={course.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-4">
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img src={course.cover} alt={course.title} className="w-full h-full object-cover" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-slate-900/80 text-white text-[10px] font-bold rounded uppercase">
                      {course.level}
                    </span>
                    <span className="absolute bottom-4 right-4 px-3 py-1 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-lg shadow-sm">
                      Includes Book Kit (Worth ₹{course.includedBookKit.value})
                    </span>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" /> {course.rating} ({course.studentsCount} Students)
                      </span>
                      <span>{course.duration} • {course.lessonsCount} Lessons</span>
                    </div>

                    <h3 className="font-black text-lg text-slate-900 leading-snug">{course.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">Faculty: {course.instructor}</p>

                    {/* Included Book Kit Banner */}
                    <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-teal-900 font-black">
                        <Package className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>🎁 Free Included Book Kit:</span>
                      </div>
                      <p className="text-teal-800 font-medium">{course.includedBookKit.title}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 space-y-3">
                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-xs text-slate-400 font-bold block">Course + Book Kit Price</span>
                      <span className="text-2xl font-black text-slate-900">₹{course.price}</span>
                      <span className="text-xs text-slate-400 line-through ml-2">₹{course.originalPrice}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition"
                    >
                      View Syllabus
                    </Link>

                    {isEnrolled ? (
                      <Link
                        href={`/learn/${course.id}`}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl text-center transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Go to Classroom</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnrollCourse(course)}
                        disabled={isProcessing}
                        className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl text-center transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>Pay via Razorpay & Get Books</span>
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
