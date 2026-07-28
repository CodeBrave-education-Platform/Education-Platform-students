'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  Users, Sparkles, CheckCircle2, Clock, Calendar, 
  Package, Download, Award, ArrowRight, ShieldCheck 
} from 'lucide-react'

export default function BatchesPage() {
  const [joinedBatches, setJoinedBatches] = useState([])

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

  const handleJoinBatch = (batch) => {
    if (joinedBatches.includes(batch.id)) return
    setJoinedBatches([...joinedBatches, batch.id])
    alert(`🎉 Congratulations! You have joined "${batch.title}". Your complete 6-Volume Academic Book Box ("${batch.includedBookBox.title}") has been automatically dispatched to your address and added to your Book Library!`)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-12 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Interactive Preparation Cohorts</span>
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
                      className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl transition shadow-md cursor-pointer"
                    >
                      Join Batch & Get Book Box
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
