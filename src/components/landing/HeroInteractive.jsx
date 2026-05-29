'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, CheckCircle2, Users, Award, Shield } from 'lucide-react'

export default function HeroInteractive({ user }) {
  const [activeFeature, setActiveFeature] = useState('Exams')

  const features = [
    {
      id: 'Exams',
      title: 'NTA-Pattern Exams',
      subtitle: 'Real-time mock interface simulation',
      icon: Award,
      badge: 'JEE Main & Advanced'
    },
    {
      id: 'Cohorts',
      title: 'Live Cohorts',
      subtitle: 'Structured schedule & interactive chats',
      icon: Users,
      badge: 'Live Interactive'
    },
    {
      id: 'Matrix',
      title: 'Performance Matrix',
      subtitle: 'Database-driven metrics aggregation',
      icon: Sparkles,
      badge: 'AI Recommendations'
    }
  ]

  // Render miniature mockup UI based on active tab
  const renderMockup = () => {
    switch (activeFeature) {
      case 'Exams':
        return (
          <motion.div
            key="exams-mock"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex flex-col justify-between"
          >
            {/* Header info */}
            <div className="border-b border-slate-100 pb-3 mb-3">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>PAPER-1 (JEE ADVANCED)</span>
                <span className="text-rose-500 font-bold animate-pulse">02:44:12 LEFT</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-1">Section 1: Physical Chemistry</h4>
            </div>

            {/* Question description */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-[10px] text-slate-600 font-medium mb-3 leading-relaxed">
              <span className="font-extrabold text-slate-800 mr-1">Q14.</span> 
              Calculate the change in entropy when 1 mole of an ideal gas expands isothermally from 2.0 L to 20.0 L at 298 K.
            </div>

            {/* 4x4 Grid representation of JEE exam question palette */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-2 uppercase">Question Palette</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { n: 1, status: 'answered' },
                  { n: 2, status: 'review' },
                  { n: 3, status: 'unanswered' },
                  { n: 4, status: 'visited' },
                  { n: 5, status: 'answered' },
                  { n: 6, status: 'review' },
                  { n: 7, status: 'unvisited' },
                  { n: 8, status: 'answered' },
                  { n: 9, status: 'unvisited' },
                  { n: 10, status: 'unvisited' },
                  { n: 11, status: 'unvisited' },
                  { n: 12, status: 'answered' },
                  { n: 13, status: 'unvisited' },
                  { n: 14, status: 'review' },
                  { n: 15, status: 'unvisited' },
                  { n: 16, status: 'unvisited' }
                ].map((item) => {
                  let bgClass = 'bg-slate-100 text-slate-500 border-slate-200'
                  if (item.status === 'answered') bgClass = 'bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-100'
                  if (item.status === 'review') bgClass = 'bg-indigo-500 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                  if (item.status === 'unanswered') bgClass = 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-100'
                  if (item.status === 'visited') bgClass = 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-100'
                  
                  return (
                    <div 
                      key={item.n} 
                      className={`h-7 rounded text-[10px] font-bold flex items-center justify-center border transition-all ${bgClass}`}
                    >
                      {item.n}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-between items-center gap-1.5 pt-3 border-t border-slate-100 mt-3 text-[9px] font-semibold text-slate-500">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-600 inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500 border border-indigo-600 inline-block" />
                <span>Review</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 border border-amber-600 inline-block" />
                <span>Not Ans</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200 inline-block" />
                <span>Unvisited</span>
              </div>
            </div>
          </motion.div>
        )
      case 'Cohorts':
        return (
          <motion.div
            key="cohorts-mock"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex flex-col justify-between"
          >
            {/* Cohort detail panel */}
            <div className="border-b border-slate-100 pb-3 mb-2 flex justify-between items-start">
              <div>
                <span className="bg-red-100 text-red-700 text-[8px] font-bold px-2 py-0.5 rounded-full tracking-wide inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  LIVE CLASSROOM
                </span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">JEE Advanced Rankers Batch</h4>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">142 online</span>
            </div>

            {/* Video preview mock */}
            <div className="relative aspect-video w-full rounded-lg bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center group mb-2.5">
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[9px] px-1.5 py-0.5 rounded text-white font-mono">
                Thermodynamics: Lecture 4
              </div>
              
              {/* Fake teacher avatar */}
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-650 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                  IIT
                </div>
                <span className="text-[9px] font-bold text-slate-300">Dr. Rajesh Sharma (IITB)</span>
              </div>

              {/* Progress seeker bar */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-700">
                <div className="w-2/3 h-full bg-teal-500" />
              </div>
            </div>

            {/* Simulation of Cohort Chat */}
            <div className="flex flex-col gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200/60 overflow-hidden max-h-[85px]">
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Cohort Live Chat</div>
              
              <div className="space-y-1 overflow-y-auto">
                <div className="text-[9px] leading-tight">
                  <span className="font-bold text-teal-600">Rahul S.</span> <span className="text-slate-600">Is enthalpy zero here?</span>
                </div>
                <div className="text-[9px] leading-tight">
                  <span className="font-bold text-indigo-600 font-sans">Neha Kapoor</span> <span className="text-slate-600">No, work is positive because expansion is against pressure.</span>
                </div>
                <div className="text-[9px] leading-tight">
                  <span className="font-bold text-slate-500">Aman Mathur</span> <span className="text-slate-600">Yes, check formula ΔH = ΔU + PΔV</span>
                </div>
              </div>
            </div>
          </motion.div>
        )
      case 'Matrix':
        return (
          <motion.div
            key="matrix-mock"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex flex-col justify-between"
          >
            {/* Analytics dashboard mock */}
            <div className="border-b border-slate-100 pb-2 mb-2 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Aggregate Analytics Matrix</h4>
                <p className="text-[9px] text-slate-400">Database calculated metrics</p>
              </div>
              <span className="bg-teal-50 text-teal-700 text-[8px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
                SECURE RPC
              </span>
            </div>

            {/* Progress indicators inside card */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[9px] font-bold text-slate-600 mb-1">
                  <span>Physics Prep Level</span>
                  <span>98.4%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '98.4%' }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-emerald-500 rounded-full" 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] font-bold text-slate-600 mb-1">
                  <span>Chemistry Accuracy</span>
                  <span>94.2%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '94.2%' }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="h-full bg-teal-500 rounded-full" 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] font-bold text-slate-600 mb-1">
                  <span>Mathematics Percentile</span>
                  <span>99.1%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '99.1%' }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="h-full bg-indigo-500 rounded-full" 
                  />
                </div>
              </div>
            </div>

            {/* Simulated aggregated statistics block */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                <div className="text-[14px] font-bold text-slate-800">45</div>
                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Exams Taken</div>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                <div className="text-[14px] font-bold text-teal-600">#142</div>
                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Est. AIR</div>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                <div className="text-[14px] font-bold text-indigo-600">97.2%</div>
                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wide">Avg Score</div>
              </div>
            </div>
          </motion.div>
        )
      default:
        return null
    }
  }

  return (
    <section className="relative bg-slate-50 py-16 lg:py-24 px-6 overflow-hidden">
      
      {/* Background visual geometry decoration - no gradients, using borders & solid structures for depth */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 border border-slate-200/50 rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/10 w-120 h-120 border border-slate-200/40 rounded-full pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative z-10">
        
        {/* Left Side: Solid Editorial Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-start space-y-6 lg:space-y-8">
          
          {/* Subtle micro pill badge */}
          <div className="inline-flex items-center gap-2 bg-slate-200/60 text-slate-800 border border-slate-350 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase select-none shadow-sm">
            <Shield className="w-3.5 h-3.5 text-slate-600" />
            <span>NTA ONLINE JEE PORTAL</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Your Future is Being <span className="text-teal-600">Engineered</span> Today.
          </h1>

          <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
            Step into the next generation of academic engineering. Harness rigorous cohort schedules, direct feedback loops, and highly realistic exam environments designed to maximize percentile outcome.
          </p>

          {/* Bullet proofs */}
          <div className="space-y-3.5 pt-2">
            {[
              'Comprehensive syllabus covering Physics, Chemistry, and Mathematics.',
              'Interactive cohort channels with professional feedback.',
              'No math calculation in browser: server-side crunched analytics.'
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-3 text-slate-700 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* High-Fidelity Call-To-Action Button */}
          <div className="pt-4 w-full sm:w-auto">
            {user ? (
              <Link href="/dashboard" className="inline-block w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-xl shadow-md transition-colors text-base inline-flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span>Enter Your Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            ) : (
              <Link href="/login" className="inline-block w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-xl shadow-md transition-colors text-base inline-flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span>Start Learning for Free</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            )}
          </div>
        </div>

        {/* Right Side: The Interactive Glass Vault */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="w-full max-w-[520px] bg-white border border-slate-200/90 shadow-xl rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative select-none">
            
            {/* Interactive Feature Select List */}
            <div className="w-full md:w-[220px] shrink-0 flex flex-col gap-3 justify-center">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                LMS Vault Interfaces
              </div>
              {features.map((item) => {
                const Icon = item.icon
                const isActive = activeFeature === item.id
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setActiveFeature(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      isActive 
                        ? 'bg-slate-900 border-slate-950 text-white shadow-md' 
                        : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200/60 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                    <div>
                      <h4 className="text-xs font-bold leading-tight">{item.title}</h4>
                      <p className={`text-[9px] font-medium mt-0.5 leading-tight ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* The Dynamic Mockup Display Area */}
            <div className="flex-1 bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 h-[290px] flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {renderMockup()}
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
