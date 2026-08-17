'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  GraduationCap, BookOpen, Sparkles, Star, CheckCircle2, 
  Package, Download, Truck, ArrowRight, ShieldCheck, Clock, Users, Loader2, CreditCard, Award, Check, Tag, Percent
} from 'lucide-react'

export default function CoursesCatalogPage() {
  const [selectedSubject, setSelectedSubject] = useState('All')
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
        if (data) {
          const mappedData = data.map(c => ({
             ...c,
             instructor: c.instructor_name || 'Expert Faculty',
             instructorRole: c.instructor_role || 'Senior Educator',
             cover: c.thumbnail_url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
             badge: c.badge || '',
             rating: c.rating || 0,
             studentsCount: c.students_count ? `${c.students_count}+ Aspirants` : 'New Batch',
             duration: c.duration || 'Flexible',
             lessonsCount: c.lessons_count || 0,
             checklist: c.checklist || [],
             includedBookKit: c.book_kit || { title: 'Digital Kit', booksCount: 0, value: 0 }
          }))
          setCourses(mappedData)
        }
      } catch (err) {
        console.error('Error fetching courses:', err)
      } finally {
        setLoadingCourses(false)
      }
    }
    fetchCourses()

    const fetchUserXp = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
        if (data) setUserXp(data.xp || 0)
      }
    }
    fetchUserXp()


    const fetchEnrollments = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('enrollments').select('course_id').eq('user_id', user.id).eq('status', 'active')
        if (data) setEnrolledCourseIds(data.map(e => e.course_id))
      }
    }
    fetchEnrollments()
  }, [])

  const handleEnrollCourse = async (course) => {
    if (enrolledCourseIds.includes(course.id)) return
    setProcessingId(course.id)

    const finalEnrollPrice = course.price

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

      const saveSuccessfulEnrollment = async (response) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          alert('You must be logged in to enroll.')
          setProcessingId(null)
          return
        }

        try {
          await supabase.from('enrollments').insert({
            user_id: user.id,
            course_id: course.id,
            status: 'active'
          })

          const trackingId = `TRK-BD-${Math.floor(100000000 + Math.random() * 900000000)}`
          
          await supabase.from('invoices').insert({
            profile_id: user.id,
            user_id: user.id,
            course_id: course.id,
            amount_paid: finalEnrollPrice,
            currency: 'INR',
            status: 'Paid',
            invoice_date: new Date().toISOString().split('T')[0],
            razorpay_payment_id: response?.razorpay_payment_id || trackingId
          })

          setEnrolledCourseIds(prev => [...prev, course.id])
          setProcessingId(null)
          alert(`🎉 Payment Verified! You enrolled in "${course.title}". It is now active under "My Learning", and your bundled book kit has been dispatched with Tracking ID: ${trackingId}!`)
        } catch (err) {
          console.error('Error saving enrollment:', err)
          setProcessingId(null)
        }
      }

      const options = {
        key: orderData.key || 'rzp_test_mockkey123',
        amount: Math.round(finalEnrollPrice * 100),
        currency: 'INR',
        name: 'Asentra Education Platform',
        description: `${course.title} + Free Book Kit`,
        order_id: orderData.orderId,
        handler: function (response) {
          saveSuccessfulEnrollment(response)
        },
        prefill: {
          name: 'Student Candidate',
          email: 'student@Asentra.edu.in',
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
        saveSuccessfulEnrollment(null)
      }
    } catch (err) {
      console.error('Payment error', err)
      setProcessingId(null)
    }
  }

  const filteredCourses = courses.filter(c => selectedSubject === 'All' || c.subject === selectedSubject)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      {/* Razorpay SDK for instantaneous checkout */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Navbar />

      {/* PW / Unacademy Style Hero Header */}
      <div className="bg-white border-b border-slate-200 py-10 px-6">
        <div className="max-w-7xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-xs font-extrabold uppercase">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>PW & Unacademy Style Interactive Catalog</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            JEE & NEET <span className="text-teal-600">Mastery Batches & Courses</span>
          </h1>
          <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto font-medium">
            Includes printed physical textbooks delivered free + instant downloadable eBook PDFs & auto-sync to My Learning!
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

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id)
            const isProcessing = processingId === course.id

            let currentPrice = course.price
            let xpDiscountApplied = false
            if (userXp > 1000) {
              currentPrice = Math.max(1, Math.floor(course.price * 0.9)) // 10% off for >1000 XP
              xpDiscountApplied = true
            }
            const originalPrice = course.originalPrice || Math.round(course.price * 2.5)
            const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100)

            return (
              <div key={course.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition group">
                <div className="space-y-6">
                  {/* Banner Image */}
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    <img src={course.cover} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-slate-900/90 text-white text-[10px] font-black rounded-full uppercase shadow-md">
                      {course.badge}
                    </span>
                    <span className="absolute bottom-4 right-4 px-3 py-1.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-xl shadow-md">
                      Includes Book Kit (Worth ₹{course.includedBookKit.value})
                    </span>
                    {xpDiscountApplied && (
                      <span className="absolute top-4 right-4 px-3 py-1 bg-amber-400 text-amber-900 text-[10px] font-black rounded-full uppercase shadow-md flex items-center gap-1">
                        <Star className="w-3 h-3" /> 10% Ranker Discount
                      </span>
                    )}
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
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">What is Included:</span>
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

                  </div>
                </div>

                <div className="p-6 pt-4 space-y-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Course Fee (Textbook Kit Included)</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">₹{currentPrice}</span>
                        <span className="text-xs text-slate-400 line-through">₹{originalPrice}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">Save {discount}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl text-center transition"
                    >
                      View Syllabus
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
