'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RazorpayPaymentGatewayModal from '@/components/RazorpayPaymentGatewayModal'
import { 
  BookOpen, Search, GraduationCap, Award, ClipboardList, 
  ArrowRight, ShieldAlert, Clock, Sparkles, CheckCircle2,
  Lock, Unlock, ChevronDown, ChevronUp, BarChart3, Activity, RotateCcw, Image as ImageIcon,
  Loader2
} from 'lucide-react'

export default function TestSeriesHubClient({
  user,
  profile,
  initialPackages,
  initialExams,
  initialAttempts
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
  const [paymentModalItem, setPaymentModalItem] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loadingPkgId, setLoadingPkgId] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const handleUnlockPackage = async (pkg, price) => {
    setLoadingPkgId(pkg.id)
    try {
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: pkg.id, price: price })
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize payment order.')
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ASENTRA TEST SERIES',
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
                batchId: pkg.id,
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
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              studentName: user?.user_metadata?.full_name || 'Student Member',
              studentEmail: user?.email || 'student@Asentra.edu.in',
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

      const rzp = new window.Razorpay(options)
      rzp.open()
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
      const matchTag = activeTag === 'ALL' || pkg.target_exam_tag.toUpperCase() === activeTag
      const matchSearch = pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pkg.target_exam_tag.toLowerCase().includes(searchQuery.toLowerCase())
      return matchTag && matchSearch
    })
  }, [packages, activeTag, searchQuery])

  // Toggle package accordion to show list of exams
  const togglePackage = (pkgId) => {
    if (expandedPackageId === pkgId) {
      setExpandedPackageId(null)
    } else {
      setExpandedPackageId(pkgId)
    }
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between select-none font-sans overflow-x-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* Light Theme Navbar */}
      <div className="z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 shadow-sm">
        <Navbar user={user} profile={profile} />
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-10">
        
        {/* Dynamic Header Section - Light Theme */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm relative overflow-hidden">
          <div className="space-y-2.5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-black tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Official NTA CBT Test Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              Asentra Test Series Hub
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-xl leading-relaxed font-medium">
              Examine your speed, accuracy, and subject mastery with proctored computer-based test drills matching official NTA competitive testing parameters.
            </p>
          </div>

          {/* Quick Metrics display widget */}
          <div className="grid grid-cols-3 gap-4 w-full md:w-auto z-10">
            {[
              { label: 'Avg Score', value: `${stats.avgScore} pts`, icon: Activity, color: 'text-teal-700 bg-teal-50 border-teal-200' },
              { label: 'Completed', value: stats.totalCompleted, icon: CheckCircle2, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
              { label: 'Record High', value: `${stats.highestScore} pts`, icon: Award, color: 'text-amber-700 bg-amber-50 border-amber-200' }
            ].map((stat, idx) => (
              <div key={idx} className={`flex flex-col p-4 rounded-2xl border ${stat.color} items-center text-center shadow-xs`}>
                <stat.icon className="w-5 h-5 mb-2" />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{stat.label}</span>
                <span className="text-sm font-black text-slate-900 mt-1">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Toolbar & Search */}
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

        {/* Grid of Test Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPackages.map(pkg => {
              const pkgExams = exams.filter(e => e.package_id === pkg.id)
              const distribution = pkg.test_distribution || {}
              const ledger = pkg.price_ledger || {}
              const isPremium = ledger.status === 'premium'

              return (
                <motion.div
                  key={pkg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-[2rem] overflow-hidden flex flex-col justify-between transition-all duration-300 relative group shadow-sm hover:shadow-md"
                >
                  {/* Package Thumbnail & Header */}
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <Image 
                      src={pkg.thumbnail_url || 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80'} 
                      alt={pkg.title} 
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2.5 py-0.5 bg-slate-900/90 text-teal-400 border border-teal-500/30 text-[9px] font-black uppercase tracking-widest rounded-lg">
                            {pkg.target_exam_tag}
                          </span>
                          <span className="px-2.5 py-0.5 bg-indigo-900/90 text-indigo-200 border border-indigo-500/30 text-[9px] font-black uppercase tracking-widest rounded-lg">
                            {pkg.campus_branch || 'Hyderabad Main'}
                          </span>
                        </div>
                        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border flex items-center gap-1.5 ${
                          isPremium 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isPremium ? (
                            <>
                              <span className="line-through opacity-50">₹{Math.round((ledger.price || 499) * 2.5)}</span>
                              <span>₹{ledger.price || 499}</span>
                            </>
                          ) : 'FREE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Info Area */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="font-black text-base text-slate-900 group-hover:text-teal-700 transition leading-snug">
                        {pkg.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {pkg.description || 'Comprehensive NTA proctored CBT test series package.'}
                      </p>
                      <p className="text-[10px] text-teal-700 font-black uppercase tracking-wide">
                        {distribution.chapter_drills || 0} Drills • {distribution.full_mocks || 0} Mocks • {distribution.live_papers || 0} Live Ranking
                      </p>
                    </div>

                    {isPremium && (
                      <button
                        onClick={() => handleUnlockPackage(pkg, ledger.price || 499)}
                        disabled={loadingPkgId === pkg.id}
                        className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                      >
                        {loadingPkgId === pkg.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        <span>Unlock Package via Razorpay (₹{ledger.price || 499})</span>
                      </button>
                    )}

                    <button
                      onClick={() => togglePackage(pkg.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition select-none cursor-pointer"
                    >
                      <span>Explore Exam Roster ({pkgExams.length})</span>
                      {expandedPackageId === pkg.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>

                    {/* Accordion panel for active exams */}
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
                                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl"
                                >
                                  <div className="min-w-0 pr-2">
                                    <h4 className="text-[11px] font-black text-slate-900 truncate leading-tight">
                                      {exam.title}
                                    </h4>
                                    <div className="flex gap-2 text-[9px] text-slate-500 font-bold uppercase mt-0.5 leading-none">
                                      <span>{exam.duration_minutes} Mins</span>
                                      <span>•</span>
                                      <span>{exam.total_questions} Questions</span>
                                      {exam.is_live_ranking && (
                                        <>
                                          <span>•</span>
                                          <span className="text-teal-700 font-bold">Live Ranking</span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  {attempt ? (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => router.push(`/test-series/analytics/${attempt.id}`)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                                      >
                                        <BarChart3 className="w-3.5 h-3.5" />
                                        <span>Scorecard</span>
                                      </button>
                                      <button
                                        onClick={() => router.push(`/test-series/engine/${exam.id}?reset=true`)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                                        title="Reset attempt and write exam fresh"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Retake</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => router.push(`/test-series/engine/${exam.id}`)}
                                      className="flex items-center gap-1 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shrink-0 shadow-sm cursor-pointer"
                                    >
                                      <span>Launch</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
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

      </div>

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
