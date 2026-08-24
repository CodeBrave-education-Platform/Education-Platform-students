'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  Users, Sparkles, CheckCircle2, Clock, Calendar, 
  Package, Download, Award, ArrowRight, ShieldCheck, Loader2, CreditCard, Check, Tag,
  ChevronDown, ChevronUp, BookOpen, FileText, Video, PlayCircle, Star, Search, Flame
} from 'lucide-react'
import { formatDateSafe } from '@/utils/dateFormat'

export default function BatchesClient({ initialBatches = [], initialJoinedBatchIds = [], user = null }) {
  const router = useRouter()
  const [joinedBatchIds, setJoinedBatchIds] = useState(initialJoinedBatchIds)
  const [processingId, setProcessingId] = useState(null)
  const [expandedCurriculumBatchId, setExpandedCurriculumBatchId] = useState(null)
  const [batches, setBatches] = useState(initialBatches)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    // Keep joined batch IDs in sync with user's authenticated database records
    const fetchUserBatchData = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser) {
          const { data: enrollments } = await supabase
            .from('batch_enrollments')
            .select('batch_id')
            .eq('user_id', currentUser.id)
            .in('status', ['active', 'ACTIVE'])
          if (enrollments && enrollments.length > 0) {
            setJoinedBatchIds(enrollments.map(e => e.batch_id))
          }
        }
      } catch (e) {
        console.error('Error fetching user batch enrollments:', e)
      }
    }
    fetchUserBatchData()
  }, [])

  const handleJoinBatch = async (batch) => {
    if (joinedBatchIds.includes(batch.id)) return
    setProcessingId(batch.id)

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      window.location.href = `/login?redirect=/batches`
      setProcessingId(null)
      return
    }

    const finalEnrollPrice = Number(batch.price) || 0

    // Free batch enrollment bypass
    if (finalEnrollPrice === 0) {
      try {
        const { error } = await supabase
          .from('batch_enrollments')
          .upsert({
            user_id: currentUser.id,
            batch_id: batch.id,
            status: 'active'
          }, { onConflict: 'user_id,batch_id' })

        if (error) throw error

        setJoinedBatchIds(prev => [...prev, batch.id])
        alert(`🎉 You have successfully enrolled in "${batch.title}"!`)
        router.refresh()
      } catch (err) {
        console.error('Batch enrollment error:', err)
        alert(err.message || 'Failed to enroll in batch.')
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
          batchId: batch.id,
          price: finalEnrollPrice
        })
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize batch order.')
      }

      const options = {
        key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: Math.round(finalEnrollPrice * 100),
        currency: 'INR',
        name: 'Asentra Education Platform',
        description: `${batch.title}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            setProcessingId(batch.id)
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_signature: response.razorpay_signature,
                batchId: batch.id,
                amount: Math.round(finalEnrollPrice * 100)
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Batch enrollment verification failed.')
            }

            setJoinedBatchIds(prev => [...prev, batch.id])
            alert(`🎉 Payment Successful! You joined "${batch.title}". Your cohort is active under "Batches" in Dashboard!`)
            router.refresh()
          } catch (verifyErr) {
            console.error('Batch verification error:', verifyErr)
            alert(verifyErr.message || 'Payment verification failed. Please contact support.')
          } finally {
            setProcessingId(null)
          }
        },
        prefill: {
          name: currentUser.user_metadata?.full_name || 'Student Candidate',
          email: currentUser.email || 'student@asentra.edu.in',
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
      console.error('Payment error', err)
      alert(err.message || 'Payment initialization failed.')
      setProcessingId(null)
    }
  }

  const filteredBatches = batches.filter(b => {
    if (!searchQuery) return true
    return b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           b.faculty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           b.badge?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           b.targetYear?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between select-none pb-20 md:pb-0">
      {/* Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 shadow-xs">
        <Navbar />
      </div>

      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 py-10 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Interactive Live Cohorts with Top Faculty</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Live Preparation <span className="text-teal-600">Batches & Cohorts</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Join live 2-way faculty sessions, daily doubt resolution, full-length CBT tests, and receive complete physical textbook boxes delivered straight to your home!
          </p>
        </div>
      </div>

      {/* Main Batches Section */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 flex-1 space-y-8">
        
        {/* Search & Enrolled Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Live Batches..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 font-bold outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition"
            />
          </div>

          <Link
            href="/dashboard?tab=batches"
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-teal-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition"
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>My Joined Batches ({joinedBatchIds.length})</span>
          </Link>
        </div>

        {/* Empty state if no batches */}
        {filteredBatches.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Batches Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? `No batches matching "${searchQuery}". Try refining your search.` : 'There are currently no active live batches published. Please check back soon.'}
            </p>
          </div>
        )}

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {filteredBatches.map((batch, index) => {
            const isHero = batch.badge?.toUpperCase().includes('FLAGSHIP') || (index === 0 && !searchQuery)
            const isJoined = joinedBatchIds.includes(batch.id)
            const isProcessing = processingId === batch.id

            const currentPrice = batch.price
            const originalPrice = batch.originalPrice || Math.round(batch.price * 2.5)
            const discount = originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0

            // Flagship Hero Card (2-Column Bento Span)
            if (isHero) {
              return (
                <div
                  key={`${batch.id}_hero_${index}`}
                  className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-[2.5rem] border-2 border-teal-500/30 hover:border-teal-500/60 p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative group shadow-md hover:shadow-2xl hover:shadow-teal-500/10"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-full shadow-xs">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                          </span>
                          LIVE COHORT
                        </div>
                        {batch.targetYear && (
                          <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {batch.targetYear}
                          </span>
                        )}
                        {batch.badge && (
                          <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {batch.badge}
                          </span>
                        )}
                      </div>

                      {batch.rating && (
                        <div className="flex items-center gap-1 text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{batch.rating}</span>
                          <span className="text-slate-500 font-bold ml-1">Rating</span>
                        </div>
                      )}
                    </div>

                    {/* Split Content: Uncropped Thumbnail with Ambient Blur + Cohort Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                      {/* Uncropped Media Container */}
                      <div className="lg:col-span-6 relative aspect-[16/9] sm:aspect-[4/3] lg:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 shadow-inner group">
                        <img
                          src={batch.cover}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-35"
                        />
                        <img
                          src={batch.cover}
                          alt={batch.title}
                          className="relative z-10 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        {batch.includedBookBox && (
                          <div className="absolute top-3 left-3 z-20 px-3 py-1 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/20 shadow-md">
                            PHYSICAL BOOK BOX INCLUDED
                          </div>
                        )}
                      </div>

                      {/* Right Details */}
                      <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                        <div>
                          <h2 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-teal-700 transition leading-snug tracking-tight">
                            {batch.title}
                          </h2>
                          <p className="text-xs font-semibold text-slate-600 mt-2">
                            Faculty: <span className="text-slate-900 font-bold">{batch.faculty}</span>
                          </p>
                        </div>

                        {/* Seat Occupancy Meter */}
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-teal-600" />
                              Seat Occupancy
                            </span>
                            <span className="text-rose-600 font-black">{batch.seatsLeft || 15} Seats Remaining</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-teal-500 to-rose-500 h-full rounded-full" style={{ width: '92%' }} />
                          </div>
                        </div>

                        {/* Schedule Chip */}
                        {batch.schedule && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                            <span>{batch.schedule}</span>
                          </div>
                        )}

                        {/* Included Book Box Highlight */}
                        {batch.includedBookBox && (
                          <div className="p-3.5 bg-teal-50 border border-teal-200/80 rounded-2xl text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-teal-900 font-black">
                              <Package className="w-4 h-4 text-teal-700 shrink-0" />
                              <span>🎁 Free Academic Book Box Delivered to Home</span>
                            </div>
                            <p className="text-teal-800 text-[11px] font-medium">{batch.includedBookBox.title || 'Master Textbook Kit'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checklist */}
                    {batch.checklist && batch.checklist.length > 0 && (
                      <div className="space-y-2.5 pt-4 border-t border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Cohort Inclusions Checklist:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {batch.checklist.map((item, idx) => (
                            <div key={`${batch.id}_chk_${idx}`} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                              <div className="w-4 h-4 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 border border-teal-200">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                              <span className="leading-snug">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expandable Syllabus Accordion */}
                    {batch.curriculum && batch.curriculum.length > 0 && (
                      <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                        <button
                          onClick={() => setExpandedCurriculumBatchId(expandedCurriculumBatchId === batch.id ? null : batch.id)}
                          className="w-full p-3.5 flex justify-between items-center text-xs font-black text-slate-800 hover:bg-slate-100 transition cursor-pointer"
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
                              <div key={`${batch.id}_mod_${mIdx}`} className="space-y-2 pt-3">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="font-black text-teal-700">{mod.chapter}</span>
                                  <span className="text-[10px] text-slate-400 font-bold">{mod.duration}</span>
                                </div>
                                <div className="space-y-1.5">
                                  {mod.lessons?.map((les, lIdx) => (
                                    <div key={`${batch.id}_les_${lIdx}`} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-[11px]">
                                      <div className="flex items-center gap-2">
                                        <PlayCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                        <span className="font-bold text-slate-800">{les.title}</span>
                                      </div>
                                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-bold rounded text-[9px]">{les.type}</span>
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

                  {/* Bottom Action & Price */}
                  <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                        Total Batch Fee (Book Box Included)
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
                      {isJoined ? (
                        <Link
                          href="/dashboard?tab=batches"
                          className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl text-center transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Joined • View in Dashboard</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleJoinBatch(batch)}
                          disabled={isProcessing}
                          className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl text-center transition shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              <span>Join Live Cohort (₹{currentPrice})</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            // Standard Modular Bento Batch Card (1-Column)
            return (
              <div 
                key={`${batch.id}_mod_${index}`}
                className="col-span-1 bg-white rounded-3xl border border-slate-200 hover:border-slate-300 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-lg relative group"
              >
                <div className="space-y-4">
                  {/* Uncropped 16:9 Thumbnail Container with Ambient Blur */}
                  <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 shadow-inner group">
                    <img 
                      src={batch.cover} 
                      alt="" 
                      aria-hidden="true" 
                      className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-35" 
                    />
                    <img 
                      src={batch.cover} 
                      alt={batch.title} 
                      className="relative z-10 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out" 
                    />
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 px-2.5 py-1 bg-rose-500 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>LIVE</span>
                    </div>
                    {batch.targetYear && (
                      <span className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 bg-slate-900/90 text-white text-[9px] font-black rounded-lg uppercase shadow-sm">
                        {batch.targetYear}
                      </span>
                    )}
                  </div>

                  {/* Title and Faculty */}
                  <div className="space-y-1">
                    <h3 className="font-black text-base text-slate-900 group-hover:text-teal-700 transition leading-snug line-clamp-2">
                      {batch.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 truncate">
                      {batch.faculty}
                    </p>
                  </div>

                  {/* Mini Seat Gauge */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                      <span>Seat Status</span>
                      <span className="text-rose-600 font-black">{batch.seatsLeft || 15} Seats Left</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-rose-500 h-full rounded-full" style={{ width: '88%' }} />
                    </div>
                  </div>

                  {/* Schedule */}
                  {batch.schedule && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium bg-slate-50 p-2 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">{batch.schedule}</span>
                    </div>
                  )}

                  {/* Book Kit Banner */}
                  {batch.includedBookBox && (
                    <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100 text-[11px] text-teal-900 font-bold flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span className="truncate">{batch.includedBookBox.title || 'Master Book Kit Included'}</span>
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

                  {isJoined ? (
                    <Link
                      href="/dashboard?tab=batches"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl text-center block transition shadow-xs"
                    >
                      Joined • In Dashboard
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleJoinBatch(batch)}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl text-center transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Join Batch</span>
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
