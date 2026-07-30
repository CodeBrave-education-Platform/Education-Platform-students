'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  Users, Sparkles, CheckCircle2, Clock, Calendar, 
  Package, Download, Award, ArrowRight, ShieldCheck, Loader2, CreditCard, Check 
} from 'lucide-react'

export default function BatchesPage() {
  const [joinedBatchIds, setJoinedBatchIds] = useState([])
  const [processingId, setProcessingId] = useState(null)

  const batches = [
    {
      id: 'b-achievers',
      title: 'JEE Advanced 2026 Top Rankers Achievers Cohort',
      targetYear: '2026 Target',
      faculty: 'Dr. H.C. Verma & Prof. R.D. Sharma',
      facultyRole: 'Ex-IIT Department Heads',
      schedule: 'Mon - Sat (4:00 PM - 8:30 PM)',
      price: 6999,
      originalPrice: 11999,
      studentsEnrolled: '450 / 500 Seats Filled',
      badge: 'Live Interactive Cohort',
      checklist: [
        'Daily Live 4.5-Hour Interactive Problem-Solving Lectures',
        'Full 6-Volume Hardcopy Printed Textbook Set Delivered Free',
        'Unlimited 1-on-1 Faculty Doubt Resolution via Live Classroom',
        'Weekly Full-Length NTA CBT Mock Exams with AIR Analysis'
      ],
      includedBookBox: {
        title: 'Full 6-Volume Hardcopy Textbook Box Set + Digital PDF Vault',
        booksCount: 6,
        value: 3499
      }
    },
    {
      id: 'b-medical',
      title: 'NEET UG 2026 Dropper & Repeater Special Ranker Batch',
      targetYear: '2026 Target',
      faculty: 'Dr. Ananya Ray & Dr. Vikram Sethi',
      facultyRole: 'AIIMS Gold Medalists & Authors',
      schedule: 'Mon - Fri (9:00 AM - 1:30 PM)',
      price: 5999,
      originalPrice: 9999,
      studentsEnrolled: '380 / 400 Seats Filled',
      badge: 'NCERT Intensive',
      checklist: [
        '360-Degree NCERT Line-by-Line Biology & Chemistry Coverage',
        'NEET 10,000 MCQ Bank & Biology Flashcard Box Delivered Free',
        'Daily Practice Problem (DPP) Sets with Video Solutions',
        'Personalized Ranker Mentorship & Time-Management Seminars'
      ],
      includedBookBox: {
        title: 'NEET 10,000 MCQ Bank + Biology Flashcard Box Set',
        booksCount: 4,
        value: 2999
      }
    }
  ]

  useEffect(() => {
    try {
      const stored = localStorage.getItem('codebrave_joined_batches')
      if (stored) {
        const parsed = JSON.parse(stored)
        setJoinedBatchIds(parsed.map(b => b.id || b))
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

  const handleJoinBatch = async (batch) => {
    if (joinedBatchIds.includes(batch.id)) return
    setProcessingId(batch.id)

    try {
      await loadRazorpayScript()

      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          price: batch.price
        })
      })

      const orderData = await orderRes.json()

      const saveSuccessfulJoin = () => {
        // Save to joined batches in localStorage
        try {
          const existingBatches = JSON.parse(localStorage.getItem('codebrave_joined_batches') || '[]')
          const updatedBatches = [batch, ...existingBatches.filter(b => (b.id || b) !== batch.id)]
          localStorage.setItem('codebrave_joined_batches', JSON.stringify(updatedBatches))
        } catch (e) {}

        // Save also as enrolled course so it instantly shows in My Learning
        try {
          const existingCourses = JSON.parse(localStorage.getItem('codebrave_enrolled_courses') || '[]')
          const courseRef = {
            id: batch.id,
            title: batch.title,
            instructor: batch.faculty,
            subject: 'Batch Cohort',
            level: batch.targetYear,
            cover: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
            price: batch.price
          }
          localStorage.setItem('codebrave_enrolled_courses', JSON.stringify([courseRef, ...existingCourses]))
        } catch (e) {}

        // Auto-create Book Distribution Order
        const trackingId = `TRK-DT-${Math.floor(100000000 + Math.random() * 900000000)}`
        const newBookOrder = {
          id: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          source: `Batch: ${batch.title}`,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          totalAmount: batch.price,
          status: 'Dispatched',
          courier: 'DTDC Express',
          trackingNumber: trackingId,
          trackingLink: `https://www.dtdc.in/tracking/${trackingId}`,
          items: [
            {
              title: batch.includedBookBox.title,
              format: 'Full 6-Vol Hardcopy Textbook Box + PDF Vault',
              downloadUrl: '/downloads/calculus-worksheets.pdf'
            }
          ]
        }

        try {
          const existingOrders = JSON.parse(localStorage.getItem('codebrave_book_orders') || '[]')
          localStorage.setItem('codebrave_book_orders', JSON.stringify([newBookOrder, ...existingOrders]))
        } catch (e) {}

        setJoinedBatchIds(prev => [...prev, batch.id])
        setProcessingId(null)
        alert(`🎉 Payment Successful! You joined "${batch.title}". Your cohort is now active under "My Learning", and your 6-Volume Academic Book Box has been dispatched with Tracking ID: ${trackingId}!`)
      }

      const options = {
        key: orderData.key || 'rzp_test_mockkey123',
        amount: Math.round(batch.price * 100),
        currency: 'INR',
        name: 'CodeBrave Education Platform',
        description: `${batch.title} + Free Book Box`,
        order_id: orderData.orderId,
        handler: function (response) {
          saveSuccessfulJoin()
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
        saveSuccessfulJoin()
      }
    } catch (err) {
      console.error('Payment error', err)
      setProcessingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navbar />

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-xs font-extrabold uppercase">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Live Interactive Batches • Includes Textbook Box Sets</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Live Preparation <span className="text-teal-600">Batches & Cohorts</span>
          </h1>
          <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto font-medium">
            Join live faculty sessions, daily doubt resolution, and receive the complete physical textbook box set delivered straight to your home!
          </p>
        </div>
      </div>

      {/* Batch Cards Grid */}
      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {batches.map((batch) => {
            const isJoined = joinedBatchIds.includes(batch.id)
            const isProcessing = processingId === batch.id
            const discount = Math.round(((batch.originalPrice - batch.price) / batch.originalPrice) * 100)

            return (
              <div key={batch.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase">
                      {batch.targetYear}
                    </span>
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 text-[10px] font-black rounded-lg border border-teal-200">
                      {batch.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 leading-snug">{batch.title}</h3>
                    <p className="text-xs font-semibold text-slate-600">Faculty: {batch.faculty} • <span className="text-slate-400">{batch.facultyRole}</span></p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{batch.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="font-bold text-slate-900">Seat Capacity: {batch.studentsEnrolled}</span>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cohort Inclusions Checklist:</span>
                    <ul className="space-y-2 text-xs text-slate-700 font-medium">
                      {batch.checklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Included Book Box Banner */}
                  <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-900 font-black">
                      <Package className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>🎁 Free Included Batch Book Box:</span>
                    </div>
                    <p className="text-teal-800 font-medium">{batch.includedBookBox.title}</p>
                  </div>
                </div>

                <div className="p-8 pt-0 space-y-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between pt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Batch Fee (Book Box Included)</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">₹{batch.price}</span>
                        <span className="text-xs text-slate-400 line-through">₹{batch.originalPrice}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">Save {discount}%</span>
                      </div>
                    </div>
                  </div>

                  {isJoined ? (
                    <Link
                      href="/dashboard?tab=learning"
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl text-center block transition shadow-sm"
                    >
                      Joined Cohort • Go to My Learning
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleJoinBatch(batch)}
                      disabled={isProcessing}
                      className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Pay via Razorpay & Join Batch</span>
                        </>
                      )}
                    </button>
                  )}
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
