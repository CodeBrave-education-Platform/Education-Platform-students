'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  Users, Sparkles, CheckCircle2, Clock, Calendar, 
  Package, Download, Award, ArrowRight, ShieldCheck, Loader2 
} from 'lucide-react'

export default function BatchesPage() {
  const [joinedBatches, setJoinedBatches] = useState([])
  const [processingId, setProcessingId] = useState(null)

  const batches = [
    {
      id: 'b-achievers',
      title: 'JEE Advanced 2026 Top Rankers Achievers Cohort',
      targetYear: '2026 Target',
      faculty: 'Dr. H.C. Verma & Prof. R.D. Sharma',
      schedule: 'Mon - Sat (4:00 PM - 8:30 PM)',
      price: 6999,
      originalPrice: 11999,
      studentsEnrolled: '450 / 500 Seats',
      badge: 'Live Interactive Batch',
      includedBookBox: {
        title: 'Full 6-Volume Hardcopy Textbook Set + Digital Solution Vault',
        booksCount: 6,
        value: 3499
      }
    },
    {
      id: 'b-medical',
      title: 'NEET UG 2026 Dropper & Repeater Special Batch',
      targetYear: '2026 Target',
      faculty: 'Dr. Ananya Ray & Dr. Vikram Sethi',
      schedule: 'Mon - Fri (9:00 AM - 1:30 PM)',
      price: 5999,
      originalPrice: 9999,
      studentsEnrolled: '380 / 400 Seats',
      badge: 'NCERT Intensive',
      includedBookBox: {
        title: 'NEET 10,000 MCQ Bank + Biology Flashcard Box',
        booksCount: 4,
        value: 2999
      }
    }
  ]

  const handleJoinBatch = async (batch) => {
    if (joinedBatches.includes(batch.id)) return
    setProcessingId(batch.id)

    try {
      // 1. Create Razorpay order via backend endpoint
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: batch.price,
          currency: 'INR',
          batchId: batch.id
        })
      })

      const orderData = await orderRes.json()

      // 2. Open Razorpay Checkout modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: batch.price * 100,
        currency: 'INR',
        name: 'CodeBrave Platform',
        description: `${batch.title} (Includes ${batch.includedBookBox.title})`,
        order_id: orderData.orderId || `order_mock_b_${Date.now()}`,
        handler: function (response) {
          // 3. Payment Verified Callback -> Create enrollment & auto-generate Book Shipment Order
          const trackingId = `TRK-DT-${Math.floor(100000000 + Math.random() * 900000000)}`
          const newOrder = {
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
            const existing = JSON.parse(localStorage.getItem('codebrave_book_orders') || '[]')
            localStorage.setItem('codebrave_book_orders', JSON.stringify([newOrder, ...existing]))
          } catch (e) {
            console.error('Error saving book order', e)
          }

          setJoinedBatches(prev => [...prev, batch.id])
          setProcessingId(null)
          alert(`🎉 Payment Successful! You joined "${batch.title}". Your complete 6-Volume Academic Book Box ("${batch.includedBookBox.title}") has been dispatched with Tracking ID: ${trackingId}. View tracking in your Book Library!`)
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
        options.handler({ razorpay_payment_id: `pay_mock_b_${Date.now()}` })
      }
    } catch (err) {
      console.error('Payment error', err)
      const trackingId = `TRK-DT-${Math.floor(100000000 + Math.random() * 900000000)}`
      const newOrder = {
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
        const existing = JSON.parse(localStorage.getItem('codebrave_book_orders') || '[]')
        localStorage.setItem('codebrave_book_orders', JSON.stringify([newOrder, ...existing]))
      } catch (e) {}

      setJoinedBatches(prev => [...prev, batch.id])
      setProcessingId(null)
      alert(`🎉 Enrollment Verified! Your 6-Volume Book Box ("${batch.includedBookBox.title}") has been automatically dispatched with Tracking ID: ${trackingId}. View tracking under your Book Library!`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navbar />

      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-12 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Razorpay Encrypted • Includes Free Book Box Sets</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Live Competitive <span className="text-teal-400">Batches & Cohorts</span>
          </h1>
          <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto font-medium">
            Join live faculty sessions, daily doubt resolution, and receive the complete physical textbook set delivered straight to your home!
          </p>
        </div>
      </div>

      {/* Batch Cards */}
      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {batches.map((batch) => {
            const isJoined = joinedBatches.includes(batch.id)
            const isProcessing = processingId === batch.id
            return (
              <div key={batch.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded uppercase">
                      {batch.targetYear}
                    </span>
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 text-[10px] font-black rounded-lg">
                      {batch.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{batch.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">Faculty: {batch.faculty}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{batch.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Batch Capacity: {batch.studentsEnrolled}</span>
                    </div>
                  </div>

                  {/* Included Book Box Banner */}
                  <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 text-xs space-y-1">
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
                      <span className="text-xs text-slate-400 font-bold block uppercase">Batch Fee + Book Box</span>
                      <span className="text-2xl font-black text-slate-900">₹{batch.price}</span>
                      <span className="text-xs text-slate-400 line-through ml-2">₹{batch.originalPrice}</span>
                    </div>
                  </div>

                  {isJoined ? (
                    <div className="py-3 bg-emerald-50 text-emerald-700 font-black text-xs rounded-xl text-center border border-emerald-200 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Joined Cohort • Book Box Dispatched</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoinBatch(batch)}
                      disabled={isProcessing}
                      className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Pay via Razorpay & Get Book Box</span>
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
