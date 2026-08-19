'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RazorpayPaymentGatewayModal from '@/components/RazorpayPaymentGatewayModal'
import { 
  BookOpen, Search, GraduationCap, Award, ClipboardList, 
  ArrowRight, ShieldAlert, Clock, Sparkles, CheckCircle2,
  Lock, Unlock, ChevronDown, ChevronUp, BarChart3, Activity, RotateCcw,
  Loader2, Play, Flame, Layers, HelpCircle, Check, Zap, Target
} from 'lucide-react'
import { formatDateSafe } from '@/utils/dateFormat'

export default function TestSeriesHubClient({
  user,
  profile,
  initialPackages = [],
  initialExams = [],
  initialAttempts = [],
  purchasedPackageIds = []
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [packages, setPackages] = useState(initialPackages)
  const [exams, setExams] = useState(initialExams)
  const [attempts, setAttempts] = useState(initialAttempts)

  const [activeTag, setActiveTag] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPackageId, setExpandedPackageId] = useState(null)

  // Razorpay In-Website Payment Gateway State
  const [paymentModalItem, setPaymentModalItem] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [loadingPkgId, setLoadingPkgId] = useState(null)
  const [receiptData, setReceiptData] = useState(null)

  const handleUnlockPackage = async (pkg, price) => {
    setLoadingPkgId(pkg.id)
    try {
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id, price: price })
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize payment order.')
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ASENTRA CBT TEST SERIES',
        description: pkg.title,
        order_id: orderData.orderId,
        theme: { color: '#0D9488' },
        prefill: { email: user?.email, name: user?.user_metadata?.full_name },
        handler: async function (response) {
          try {
            setLoadingPkgId(pkg.id)
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                packageId: pkg.id,
                amount: orderData.amount
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Payment verification failed.')
            }

            const transactionId = response.razorpay_payment_id
            const invoiceNo = `INV-CB-${Math.floor(100000 + Math.random() * 900000)}`
            const receipt = {
              invoiceNo,
              transactionId,
              date: formatDateSafe(new Date(), 'short'),
              studentName: user?.user_metadata?.full_name || 'Student Member',
              studentEmail: user?.email || 'student@asentra.edu.in',
              itemTitle: pkg.title,
              itemType: 'Test Series Package',
              basePrice: price,
              gstAmount: Math.round(price * 0.18),
              totalAmount: price + Math.round(price * 0.18)
            }
            
            setReceiptData(receipt)
            setIsPaymentModalOpen(true)
            startTransition(() => {
              router.refresh()
            })
          } catch (err) {
            console.error('Checkout verification error:', err)
            alert(err.message || 'Payment Verification failed. Please contact support.')
          } finally {
            setLoadingPkgId(null)
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingPkgId(null)
          }
        }
      }

      if (typeof window !== 'undefined' && window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        alert('Payment gateway initializing. Please try again in a moment.')
        setLoadingPkgId(null)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert(err.message || 'Failed to initialize secure checkout.')
      setLoadingPkgId(null)
    }
  }

  // Extract unique competitive tag filters
  const tags = React.useMemo(() => {
    const set = new Set(['ALL'])
    packages.forEach(pkg => {
      if (pkg.target_exam_tag) {
        set.add(pkg.target_exam_tag.toUpperCase())
      }
    })
    return Array.from(set)
  }, [packages])

  // Filter packages based on active tag and search query
  const filteredPackages = React.useMemo(() => {
    return packages.filter(pkg => {
      const matchTag = activeTag === 'ALL' || pkg.target_exam_tag?.toUpperCase() === activeTag
      const matchSearch = !searchQuery || 
                          pkg.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.target_exam_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.campus_branch?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchTag && matchSearch
    })
  }, [packages, activeTag, searchQuery])

  // Toggle package accordion to show list of exams
  const togglePackage = (pkgId) => {
    setExpandedPackageId(prev => (prev === pkgId ? null : pkgId))
  }

  // Check if student has already completed an exam and get attempt id
  const getExamAttempt = (examId) => {
    return attempts.find(att => att.exam_id === examId)
  }

  // Calculate high-level student metrics
  const stats = React.useMemo(() => {
    const totalCompleted = attempts.length
    const totalScore = attempts.reduce((sum, att) => sum + (att.score || 0), 0)
    const avgScore = totalCompleted > 0 ? Math.round(totalScore / totalCompleted) : 0
    const highestScore = totalCompleted > 0 ? Math.max(...attempts.map(att => att.score || 0)) : 0

    return { totalCompleted, avgScore, highestScore }
  }, [attempts])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between select-none font-sans overflow-x-hidden pb-20 md:pb-0">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      {/* Light Theme Navbar */}
      <div className="z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 shadow-xs">
        <Navbar user={user} profile={profile} />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Hero Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
          <div className="space-y-3 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black tracking-widest uppercase shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Official NTA CBT Simulation Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              Asentra CBT Test Series Hub
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-xl leading-relaxed font-medium">
              Calibrate your speed, accuracy, and all-India percentile with authentic NTA computer-based test drills, live all-India rank leaderboards, and AI question analytics.
            </p>
          </div>

          {/* Quick Metrics Display Widget */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto z-10">
            {[
              { label: 'Avg Score', value: `${stats.avgScore} pts`, icon: Activity, color: 'text-teal-700 bg-teal-50 border-teal-200' },
              { label: 'Completed', value: stats.totalCompleted, icon: CheckCircle2, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
              { label: 'Record High', value: `${stats.highestScore} pts`, icon: Award, color: 'text-amber-700 bg-amber-50 border-amber-200' }
            ].map((stat, idx) => (
              <div key={`stat_${idx}`} className={`flex flex-col p-4 rounded-2xl border ${stat.color} items-center text-center shadow-xs`}>
                <stat.icon className="w-5 h-5 mb-1.5" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{stat.label}</span>
                <span className="text-sm font-black text-slate-900 mt-0.5">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Toolbar & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          {/* Tag Selectors */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {tags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition select-none cursor-pointer border ${
                  activeTag === tag
                    ? 'bg-teal-600 text-white font-black border-teal-600 shadow-sm'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Test Series Packages..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition font-bold"
            />
          </div>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          <AnimatePresence mode="popLayout">
            {filteredPackages.map((pkg, index) => {
              const isHero = pkg.is_featured || (index === 0 && activeTag === 'ALL' && !searchQuery)
              const pkgExams = exams.filter(e => e.package_id === pkg.id)
              const distribution = pkg.test_distribution || {}
              const ledger = pkg.price_ledger || {}
              const isPremium = ledger.status === 'premium'
              const isPurchased = purchasedPackageIds.includes(pkg.id)
              const isUnlocked = !isPremium || isPurchased

              // Flagship Hero Bento Card (2-Column Wide Span)
              if (isHero) {
                return (
                  <motion.div
                    key={pkg.id || `pkg-${index}`}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="col-span-1 md:col-span-2 lg:col-span-2 bg-white border-2 border-teal-500/30 hover:border-teal-500/60 rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative group shadow-md hover:shadow-2xl hover:shadow-teal-500/10"
                  >
                    <div>
                      {/* Hero Header Badges & Price Tag */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase tracking-widest rounded-full shadow-xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
                            </span>
                            Flagship All-India Mock Series
                          </span>
                          <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {pkg.target_exam_tag || 'JEE Main'}
                          </span>
                          <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {pkg.campus_branch || 'Kota & Hyderabad Apex'}
                          </span>
                        </div>

                        {/* Price Pill */}
                        <div className="flex items-center gap-2">
                          {isPremium ? (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full shadow-xs">
                              <span className="text-xs text-slate-400 line-through font-bold">
                                ₹{ledger.original_price || Math.round((ledger.price || 799) * 2.5)}
                              </span>
                              <span className="text-sm font-black text-amber-900">₹{ledger.price || 799}</span>
                              <span className="bg-amber-200 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-md">PRO</span>
                            </div>
                          ) : (
                            <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider rounded-full shadow-xs">
                              FREE ACCESS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Split Content: 16:9 Prominent Artwork + Hero Telemetry */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                        {/* 16:9 Crystal Clear Artwork Container with Ambient Blur */}
                        <div className="lg:col-span-7 relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 shadow-inner group">
                          <img
                            src={pkg.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-35"
                          />
                          <img
                            src={pkg.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'}
                            alt={pkg.title}
                            className="relative z-10 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute top-3 left-3 z-20 px-3 py-1 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/20 shadow-md">
                            NTA CBT ENGINE 2026
                          </div>
                        </div>

                        {/* Hero Details & Telemetry Badges */}
                        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                          <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-teal-700 transition leading-snug tracking-tight">
                              {pkg.title}
                            </h2>
                            <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mt-2.5">
                              {pkg.description || 'Complete official NTA CBT exam simulation with live national rank prediction, section-wise speed analysis, and negative marking analytics.'}
                            </p>
                          </div>

                          {/* Live Drill/Mock Telemetry Badges */}
                          <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                            <div className="text-center">
                              <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Chapter Drills</span>
                              <span className="text-base font-black text-slate-900">{distribution.chapter_drills || 12}</span>
                            </div>
                            <div className="text-center border-x border-slate-200">
                              <span className="block text-[9px] font-black text-teal-700 uppercase tracking-wider">Full Mocks</span>
                              <span className="text-base font-black text-teal-700">{distribution.full_mocks || 8}</span>
                            </div>
                            <div className="text-center">
                              <span className="block text-[9px] font-black text-indigo-700 uppercase tracking-wider">Live Papers</span>
                              <span className="text-base font-black text-indigo-700">{distribution.live_papers || 4}</span>
                            </div>
                          </div>

                          {/* Unlock / Purchase CTA if premium */}
                          {isPremium && !isPurchased && (
                            <button
                              onClick={() => handleUnlockPackage(pkg, ledger.price || 799)}
                              disabled={loadingPkgId === pkg.id}
                              className="w-full py-3 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-98"
                            >
                              {loadingPkgId === pkg.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                              <span>Unlock All-India Package (₹{ledger.price || 799})</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Exam Roster Accordion Trigger */}
                      <div className="space-y-3 pt-2">
                        <button
                          onClick={() => togglePackage(pkg.id)}
                          className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-800 transition select-none cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-teal-600" />
                            <span>Exam Blueprint Roster ({pkgExams.length} Multi-Format Papers)</span>
                          </div>
                          {expandedPackageId === pkg.id ? (
                            <ChevronUp className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          )}
                        </button>

                        {/* Accordion Content */}
                        <AnimatePresence initial={false}>
                          {expandedPackageId === pkg.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                              className="overflow-hidden space-y-2 pt-2 border-t border-slate-100"
                            >
                              {pkgExams.length === 0 ? (
                                <p className="text-center text-[10px] text-slate-500 py-4 font-semibold">
                                  No active exam blueprints compiled yet.
                                </p>
                              ) : (
                                pkgExams.map(exam => {
                                  const attempt = getExamAttempt(exam.id)
                                  
                                  return (
                                    <div 
                                      key={exam.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl gap-3 transition"
                                    >
                                      <div className="min-w-0 pr-2 space-y-1">
                                        <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                                          {exam.title}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            {exam.duration_minutes} Mins
                                          </span>
                                          <span>•</span>
                                          <span className="flex items-center gap-1">
                                            <HelpCircle className="w-3 h-3 text-slate-400" />
                                            {exam.total_questions} Questions
                                          </span>
                                          {exam.is_live_ranking && (
                                            <>
                                              <span>•</span>
                                              <span className="inline-flex items-center gap-1 text-teal-700 font-black">
                                                <Activity className="w-3 h-3" />
                                                Live Ranking
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Exam Action Triggers */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        {isPremium && !isPurchased ? (
                                          <button
                                            disabled
                                            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 cursor-not-allowed"
                                            title="Unlock package to access this exam"
                                          >
                                            <Lock className="w-3.5 h-3.5" />
                                            <span>Locked</span>
                                          </button>
                                        ) : attempt ? (
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                              onClick={() => router.push(`/test-series/analytics/${attempt.id}`)}
                                              className="flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                                            >
                                              <BarChart3 className="w-3.5 h-3.5" />
                                              <span>Scorecard</span>
                                            </button>
                                            <button
                                              onClick={() => router.push(`/test-series/engine/${exam.id}?reset=true`)}
                                              className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                                              title="Reset attempt and write exam fresh"
                                            >
                                              <RotateCcw className="w-3.5 h-3.5" />
                                              <span>Retake</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => router.push(`/test-series/engine/${exam.id}`)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shrink-0 shadow-xs cursor-pointer"
                                          >
                                            <Play className="w-3 h-3 fill-current" />
                                            <span>Launch CBT</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )
              }

              // Standard Modular Bento Card (1-Column)
              return (
                <motion.div
                  key={pkg.id || `pkg-mod-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="col-span-1 bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 relative group shadow-sm hover:shadow-lg"
                >
                  <div className="space-y-4">
                    {/* Uncropped 16:9 Thumbnail Container with Ambient Blur */}
                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 shadow-inner group">
                      <img 
                        src={pkg.thumbnail_url || 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80'} 
                        alt="" 
                        aria-hidden="true" 
                        className="absolute inset-0 w-full h-full object-cover blur-xl scale-125 opacity-35" 
                      />
                      <img 
                        src={pkg.thumbnail_url || 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80'} 
                        alt={pkg.title} 
                        className="relative z-10 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out" 
                      />
                      <div className="absolute top-2.5 left-2.5 z-20 flex flex-wrap gap-1">
                        <span className="px-2.5 py-1 bg-slate-900/90 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm">
                          {pkg.target_exam_tag}
                        </span>
                      </div>
                      <div className="absolute top-2.5 right-2.5 z-20">
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border shadow-sm ${
                          isPremium 
                            ? 'bg-amber-50 text-amber-900 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {isPremium ? `₹${ledger.price || 499}` : 'FREE'}
                        </span>
                      </div>
                    </div>

                    {/* Card Info Area */}
                    <div className="space-y-2">
                      <h3 className="font-black text-base text-slate-900 group-hover:text-teal-700 transition leading-snug line-clamp-2">
                        {pkg.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {pkg.description || 'Comprehensive NTA proctored CBT test series package.'}
                      </p>
                      
                      {/* Telemetry pill */}
                      <div className="flex items-center gap-1.5 text-[10px] text-teal-700 font-black uppercase tracking-wide bg-teal-50 p-2 rounded-xl border border-teal-100">
                        <Zap className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{distribution.chapter_drills || 0} Drills • {distribution.full_mocks || 0} Mocks • {distribution.live_papers || 0} Live</span>
                      </div>
                    </div>

                    {/* Unlock button if premium */}
                    {isPremium && !isPurchased && (
                      <button
                        onClick={() => handleUnlockPackage(pkg, ledger.price || 499)}
                        disabled={loadingPkgId === pkg.id}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        {loadingPkgId === pkg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        <span>Unlock Package (₹{ledger.price || 499})</span>
                      </button>
                    )}

                    {/* Accordion Trigger */}
                    <button
                      onClick={() => togglePackage(pkg.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition select-none cursor-pointer"
                    >
                      <span>Exam Papers ({pkgExams.length})</span>
                      {expandedPackageId === pkg.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>

                    {/* Accordion Panel for active exams */}
                    <AnimatePresence>
                      {expandedPackageId === pkg.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-2 pt-2 border-t border-slate-100"
                        >
                          {pkgExams.length === 0 ? (
                            <p className="text-center text-[10px] text-slate-500 py-3 font-semibold">
                              No active exam blueprints compiled yet.
                            </p>
                          ) : (
                            pkgExams.map(exam => {
                              const attempt = getExamAttempt(exam.id)
                              
                              return (
                                <div 
                                  key={exam.id}
                                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl gap-2"
                                >
                                  <div className="min-w-0 pr-1">
                                    <h4 className="text-[11px] font-black text-slate-900 truncate leading-tight">
                                      {exam.title}
                                    </h4>
                                    <div className="flex gap-1.5 text-[9px] text-slate-500 font-bold uppercase mt-0.5 leading-none">
                                      <span>{exam.duration_minutes}m</span>
                                      <span>•</span>
                                      <span>{exam.total_questions}Q</span>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  {isPremium && !isPurchased ? (
                                    <button
                                      disabled
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 cursor-not-allowed"
                                      title="Unlock package to access this exam"
                                    >
                                      <Lock className="w-3 h-3" />
                                      <span>Locked</span>
                                    </button>
                                  ) : attempt ? (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => router.push(`/test-series/analytics/${attempt.id}`)}
                                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                                      >
                                        Score
                                      </button>
                                      <button
                                        onClick={() => router.push(`/test-series/engine/${exam.id}?reset=true`)}
                                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                                        title="Reset attempt and write exam fresh"
                                      >
                                        Retake
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => router.push(`/test-series/engine/${exam.id}`)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition shrink-0 shadow-xs cursor-pointer"
                                    >
                                      <span>Start</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )
                            })
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty state fallback */}
        {filteredPackages.length === 0 && (
          <div className="p-12 text-center rounded-[2rem] border border-dashed border-slate-200 bg-white space-y-4 shadow-xs">
            <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900">No test series packages found</h4>
              <p className="text-xs text-slate-500 font-medium">Adjust filters or refine search text</p>
            </div>
          </div>
        )}

      </main>

      <div className="z-10 mt-10">
        {/* Post-Payment Tax Invoice Modal */}
        <RazorpayPaymentGatewayModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          receiptData={receiptData}
        />

        <Footer />
      </div>
    </div>
  )
}
