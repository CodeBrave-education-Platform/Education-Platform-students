'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { validateCoupon } from '@/utils/coupons'
import { 
  Users, Sparkles, CheckCircle2, Clock, Calendar, 
  Package, Download, Award, ArrowRight, ShieldCheck, Loader2, CreditCard, Check, Tag,
  ChevronDown, ChevronUp, BookOpen, FileText, Video, PlayCircle
} from 'lucide-react'

export default function BatchesPage() {
  const [joinedBatchIds, setJoinedBatchIds] = useState([])
  const [processingId, setProcessingId] = useState(null)
  const [expandedCurriculumBatchId, setExpandedCurriculumBatchId] = useState(null)

  // Promo Code States
  const [couponInputs, setCouponInputs] = useState({})
  const [appliedCoupons, setAppliedCoupons] = useState({})
  const [couponErrors, setCouponErrors] = useState({})

  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const { data, error } = await supabase.from('batches').select('*')
        if (data) {
          const mappedData = data.map(b => ({
             ...b,
             title: b.title || 'Untitled Batch',
             faculty: b.instructor_id || 'Expert Faculty',
             facultyRole: 'Senior Educator',
             cover: b.thumbnail_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80',
             badge: b.badge || '',
             rating: 4.9,
             targetYear: b.level || '2026',
             schedule: 'Mon-Fri Live Classes',
             studentsEnrolled: 'New Batch',
             seatsLeft: 50,
             checklist: [
               'Live Interactive Sessions',
               'DPPs & Solutions',
               'Weekly Mentorship'
             ],
             includedBookBox: b.book_kit || { title: 'Standard Digital Kit', booksCount: 0, value: 0 },
             curriculum: []
          }))
          setBatches(mappedData)
        }
      } catch (err) {
        console.error('Error fetching batches:', err)
      } finally {
        setLoadingBatches(false)
      }
    }
    fetchBatches()
    
    try {

      const stored = localStorage.getItem('Asentra_joined_batches')
      if (stored) {
        const parsed = JSON.parse(stored)
        setJoinedBatchIds(parsed.map(b => b.id || b))
      }
    } catch (e) {}
  }, [])

  const handleApplyCoupon = (batchId, basePrice) => {
    const code = couponInputs[batchId]
    const result = validateCoupon(code, basePrice)
    if (result.valid) {
      setAppliedCoupons(prev => ({ ...prev, [batchId]: result }))
      setCouponErrors(prev => ({ ...prev, [batchId]: null }))
    } else {
      setCouponErrors(prev => ({ ...prev, [batchId]: result.error }))
      setAppliedCoupons(prev => ({ ...prev, [batchId]: null }))
    }
  }

  const handleJoinBatch = async (batch) => {
    if (joinedBatchIds.includes(batch.id)) return
    setProcessingId(batch.id)

    const activeDiscount = appliedCoupons[batch.id]
    const finalEnrollPrice = activeDiscount ? activeDiscount.finalPrice : batch.price

    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          price: finalEnrollPrice
        })
      })

      const orderData = await orderRes.json()

      const saveSuccessfulJoin = () => {
        try {
          const existingBatches = JSON.parse(localStorage.getItem('Asentra_joined_batches') || '[]')
          const updatedBatches = [batch, ...existingBatches.filter(b => (b.id || b) !== batch.id)]
          localStorage.setItem('Asentra_joined_batches', JSON.stringify(updatedBatches))
        } catch (e) {}

        try {
          const existingCourses = JSON.parse(localStorage.getItem('Asentra_enrolled_courses') || '[]')
          const courseRef = {
            id: batch.id,
            title: batch.title,
            instructor: batch.faculty,
            subject: 'Batch Cohort',
            level: batch.targetYear,
            cover: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
            price: finalEnrollPrice
          }
          localStorage.setItem('Asentra_enrolled_courses', JSON.stringify([courseRef, ...existingCourses]))
        } catch (e) {}

        const trackingId = `TRK-DT-${Math.floor(100000000 + Math.random() * 900000000)}`
        const newBookOrder = {
          id: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          source: `Batch: ${batch.title}`,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          totalAmount: finalEnrollPrice,
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
          const existingOrders = JSON.parse(localStorage.getItem('Asentra_book_orders') || '[]')
          localStorage.setItem('Asentra_book_orders', JSON.stringify([newBookOrder, ...existingOrders]))
        } catch (e) {}

        setJoinedBatchIds(prev => [...prev, batch.id])
        setProcessingId(null)
        alert(`🎉 Payment Successful! You joined "${batch.title}". Your cohort is now active under "My Learning", and your 6-Volume Academic Book Box has been dispatched with Tracking ID: ${trackingId}!`)
      }

      const options = {
        key: orderData.key || 'rzp_test_mockkey123',
        amount: Math.round(finalEnrollPrice * 100),
        currency: 'INR',
        name: 'Asentra Education Platform',
        description: `${batch.title} + Free Book Box`,
        order_id: orderData.orderId,
        handler: function (response) {
          saveSuccessfulJoin()
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
        saveSuccessfulJoin()
      }
    } catch (err) {
      console.error('Payment error', err)
      setProcessingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      {/* Razorpay SDK for instantaneous checkout */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Navbar />

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 py-10 px-6">
        <div className="max-w-7xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-xs font-extrabold uppercase">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Live PW / Unacademy Style Interactive Cohorts</span>
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
            const appliedCoupon = appliedCoupons[batch.id]
            const couponError = couponErrors[batch.id]

            const currentPrice = appliedCoupon ? appliedCoupon.finalPrice : batch.price
            const discount = Math.round(((batch.originalPrice - currentPrice) / batch.originalPrice) * 100)

            return (
              <div key={batch.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase">
                      {batch.targetYear}
                    </span>
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-black rounded-lg border border-rose-200 animate-pulse">
                      {batch.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 leading-snug">{batch.title}</h3>
                    <p className="text-xs font-semibold text-slate-600">Faculty: {batch.faculty} • <span className="text-slate-400">{batch.facultyRole}</span></p>
                  </div>

                  {/* Seat Occupancy Progress Bar */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Seat Occupancy Rate</span>
                      <span className="text-rose-600">{batch.studentsEnrolled}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: '96%' }} />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{batch.schedule}</span>
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

                  {/* Promo Code Drawer */}
                  {!isJoined && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-700 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-teal-600" /> Have a Promo Code?
                        </span>
                        {appliedCoupon && (
                          <span className="text-emerald-600 font-bold text-[10px]">
                            {appliedCoupon.code} Applied (-₹{appliedCoupon.discountAmount})
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInputs[batch.id] || ''}
                          onChange={e => setCouponInputs({ ...couponInputs, [batch.id]: e.target.value })}
                          placeholder="Enter Code (e.g. JEE2026)"
                          className="flex-1 uppercase bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-teal-600 font-bold"
                        />
                        <button
                          onClick={() => handleApplyCoupon(batch.id, batch.price)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                        >
                          Apply
                        </button>
                      </div>

                      {couponError && (
                        <p className="text-rose-600 font-bold text-[10px]">{couponError}</p>
                      )}
                    </div>
                  )}

                  {/* Included Book Box Banner */}
                  <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-teal-900 font-black">
                      <Package className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>🎁 Free Included Batch Book Box:</span>
                    </div>
                    <p className="text-teal-800 font-medium">{batch.includedBookBox.title}</p>
                  </div>

                  {/* Expandable Batch Curriculum Syllabus Accordion */}
                  {batch.curriculum && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => setExpandedCurriculumBatchId(expandedCurriculumBatchId === batch.id ? null : batch.id)}
                        className="w-full p-4 flex justify-between items-center text-xs font-black text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-teal-600" />
                          <span>View Full Cohort Curriculum & Syllabus ({batch.curriculum.length} Modules)</span>
                        </div>
                        {expandedCurriculumBatchId === batch.id ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      {expandedCurriculumBatchId === batch.id && (
                        <div className="p-4 pt-0 space-y-4 border-t border-slate-200/80 bg-white">
                          {batch.curriculum.map((mod, mIdx) => (
                            <div key={mIdx} className="space-y-2 pt-3">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-extrabold text-teal-700">{mod.chapter}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{mod.duration}</span>
                              </div>
                              <div className="space-y-1.5">
                                {mod.lessons.map((les, lIdx) => (
                                  <div key={lIdx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-2">
                                      <PlayCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                      <span className="font-bold text-slate-800">{les.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-bold rounded text-[9px]">{les.type}</span>
                                      {les.pdfUrl && (
                                        <a href={les.pdfUrl} download className="p-1 text-slate-400 hover:text-teal-600 transition" title="Download Practice Sheet">
                                          <FileText className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-8 pt-0 space-y-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between pt-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Batch Fee (Book Box Included)</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">₹{currentPrice}</span>
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
