'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Play, Volume2, Maximize, FileText, HelpCircle, List, Award } from 'lucide-react'

export default function FeatureScroll() {
  const rowVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  return (
    <section className="bg-white py-20 lg:py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-24 lg:space-y-36">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3.5 select-none">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            High-Fidelity Gateway to Academic Mastery
          </h2>
          <div className="h-1 w-20 bg-teal-600 mx-auto rounded-full" />
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
            Engineered UI • Zero Clutter • Absolute Performance
          </p>
        </div>

        {/* Row 1: Video Player & Syllabus Tab Switcher (Left Text / Right UI Mockup) */}
        <motion.div 
          variants={rowVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 select-none"
        >
          {/* Left Column: Text description */}
          <div className="w-full lg:w-1/2 flex flex-col items-start space-y-5 lg:space-y-6">
            <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold tracking-widest px-3.5 py-1 rounded-full uppercase border border-slate-200">
              01 • Syllabus & Lecture Room
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 leading-tight">
              Rigorous Lectures, Fully Structured.
            </h3>
            <p className="text-slate-500 text-base leading-relaxed font-medium">
              Experience course video study sessions optimized for focus STUDYING. Toggle between the syllabus outline, structured course notes, and active class-level doubt forums instantly without losing your timestamp.
            </p>

            <div className="space-y-3.5 pt-2">
              {[
                { label: 'Multi-speed video player rendering with visual quality controls', icon: CheckCircle2 },
                { label: 'Integrated notebook panels loaded alongside current chapters', icon: CheckCircle2 },
                { label: 'Dynamic course forums directly synchronized with course timelines', icon: CheckCircle2 }
              ].map((item, index) => {
                const IconComp = item.icon
                return (
                  <div key={index} className="flex items-start gap-3 text-slate-700 text-sm font-semibold">
                    <IconComp className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: High-Fidelity UI Player HTML/CSS representation */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="w-full max-w-[540px] bg-slate-50 border border-slate-200 shadow-md rounded-2xl p-4 space-y-4">
              
              {/* Fake Video Player Box */}
              <div className="w-full bg-slate-950 aspect-video rounded-xl overflow-hidden relative border border-slate-800 flex flex-col justify-between p-3">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium">
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded backdrop-blur">CHAPTER 3: Rotational Dynamics</span>
                  <span>1080p • 1.5x</span>
                </div>
                
                {/* Fake play center button */}
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center self-center cursor-pointer hover:bg-white/20 transition-all text-white">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>

                {/* Player Bottom Control panel */}
                <div className="space-y-2">
                  {/* Seeker tracking progress */}
                  <div className="w-full h-1 bg-slate-800 rounded-full cursor-pointer relative">
                    <div className="absolute top-0 left-0 w-3/5 h-full bg-teal-500 rounded-full" />
                    <div className="absolute top-1/2 left-3/5 -translate-y-1/2 w-2.5 h-2.5 bg-white border border-teal-600 rounded-full shadow" />
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                    <div className="flex items-center gap-3">
                      <Play className="w-3.5 h-3.5 fill-slate-400 text-slate-400 cursor-pointer" />
                      <Volume2 className="w-3.5 h-3.5 cursor-pointer" />
                      <span>24:15 / 45:00</span>
                    </div>
                    <Maximize className="w-3.5 h-3.5 cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Sidebar Tabs Mockup Layout beneath player */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500">
                  <button className="flex-1 py-2.5 border-b-2 border-teal-600 text-teal-600 flex items-center justify-center gap-1.5 bg-white">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Formatted Notes</span>
                  </button>
                  <button className="flex-1 py-2.5 flex items-center justify-center gap-1.5 hover:bg-slate-100/50">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-450" />
                    <span>Doubt Feed (12)</span>
                  </button>
                  <button className="flex-1 py-2.5 flex items-center justify-center gap-1.5 hover:bg-slate-100/50">
                    <List className="w-3.5 h-3.5 text-slate-455" />
                    <span>Lecture Chapters</span>
                  </button>
                </div>

                <div className="p-3.5 space-y-2.5 text-[10.5px]">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium text-slate-700">
                    <p className="font-extrabold text-slate-900 border-b border-slate-200 pb-1 mb-1">Key Formulas Summary</p>
                    <p className="font-mono text-slate-600 mt-1">1. Angular Momentum: L = Iω</p>
                    <p className="font-mono text-slate-600">2. Torque Expression: τ = Iα = dL/dt</p>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-semibold text-slate-405">
                    <span>Last updated by Faculty 2 hours ago</span>
                    <button className="text-teal-600 hover:underline flex items-center gap-0.5">
                      <span>Download PDF</span>
                      <FileText className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

        {/* Row 2: Secure Assessment Suite (Right Text / Left UI Mockup) */}
        <motion.div 
          variants={rowVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-16 select-none"
        >
          {/* Right Column: Text description */}
          <div className="w-full lg:w-1/2 flex flex-col items-start space-y-5 lg:space-y-6">
            <span className="bg-slate-100 text-slate-800 text-[10px] font-extrabold tracking-widest px-3.5 py-1 rounded-full uppercase border border-slate-200">
              02 • Secure Assessment Suite
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 leading-tight">
              Simulated JEE Exam Vault.
            </h3>
            <p className="text-slate-500 text-base leading-relaxed font-medium">
              Familiarize yourself with high-stakes environments using an identical recreation of the NTA JEE testing terminal. Equipped with official timers, responsive question status monitors, and instantaneous backend score crunches.
            </p>

            <div className="space-y-3.5 pt-2">
              {[
                { label: 'Pixel-perfect NTA examination dashboard reproduction', icon: CheckCircle2 },
                { label: 'Built-in real-time timer with autocommit on expiration', icon: CheckCircle2 },
                { label: 'Secure server-side evaluations preventing local scripts injection', icon: CheckCircle2 }
              ].map((item, index) => {
                const IconComp = item.icon
                return (
                  <div key={index} className="flex items-start gap-3 text-slate-700 text-sm font-semibold">
                    <IconComp className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Left Column: High-Fidelity UI Exam Mockup representation */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="w-full max-w-[540px] bg-slate-50 border border-slate-200 shadow-md rounded-2xl p-4 flex flex-col gap-3">
              
              {/* Exam Title Header */}
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-800">JEE MOCK TEST-04</span>
                </div>
                <span className="font-mono text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-100">01:58:30 LEFT</span>
              </div>

              {/* Main content split */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* Question panel */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between min-h-[220px]">
                  <div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 border-b border-slate-100 pb-2 mb-2 uppercase">
                      <span>Question 4</span>
                      <span className="text-emerald-600 font-mono">+4 / -1 Marks</span>
                    </div>
                    <p className="text-[11px] text-slate-800 font-bold leading-relaxed mb-3">
                      A particle executes simple harmonic motion under a restoring force F = -kx. If the amplitude is doubled, which parameter remains unchanged?
                    </p>
                    
                    {/* Radio Options */}
                    <div className="space-y-1.5">
                      {[
                        { k: 'A', text: 'Maximum Velocity' },
                        { k: 'B', text: 'Time Period' },
                        { k: 'C', text: 'Maximum Acceleration' },
                        { k: 'D', text: 'Total Mechanical Energy' }
                      ].map((opt) => (
                        <label key={opt.k} className={`flex items-center gap-2.5 p-2 rounded-lg border text-[10px] font-semibold cursor-pointer transition-colors ${
                          opt.k === 'B' 
                            ? 'bg-emerald-50/50 border-emerald-500 text-emerald-950 font-bold' 
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-700'
                        }`}>
                          <input 
                            type="radio" 
                            name="mock-shm" 
                            defaultChecked={opt.k === 'B'} 
                            disabled 
                            className="accent-emerald-600 w-3 h-3 shrink-0" 
                          />
                          <span>{opt.k}. {opt.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-4 text-[9px] font-bold">
                    <button className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer">
                      Mark for Review
                    </button>
                    <button className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer">
                      Clear
                    </button>
                    <button className="bg-emerald-600 border border-emerald-700 text-white px-3.5 py-1.5 rounded shadow-sm hover:bg-emerald-700 cursor-pointer">
                      Save & Next
                    </button>
                  </div>
                </div>

                {/* Right grid palette sidebar */}
                <div className="w-full md:w-[130px] bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-between">
                  <div>
                    <h5 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1.5">Palette</h5>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { n: 1, s: 'ans' },
                        { n: 2, s: 'ans' },
                        { n: 3, s: 'rev' },
                        { n: 4, s: 'act' },
                        { n: 5, s: 'vis' },
                        { n: 6, s: 'unv' },
                        { n: 7, s: 'unv' },
                        { n: 8, s: 'unv' },
                        { n: 9, s: 'unv' }
                      ].map((item) => {
                        let cl = 'bg-slate-100 text-slate-400 border-slate-200'
                        if (item.s === 'ans') cl = 'bg-emerald-500 text-white border-emerald-600 font-bold'
                        if (item.s === 'rev') cl = 'bg-indigo-500 text-white border-indigo-600 font-bold'
                        if (item.s === 'act') cl = 'bg-slate-900 text-white border-slate-950 font-bold animate-pulse ring-2 ring-emerald-500/40'
                        if (item.s === 'vis') cl = 'bg-amber-500 text-white border-amber-600 font-bold'
                        return (
                          <div key={item.n} className={`h-6 rounded text-[9px] flex items-center justify-center border transition-all ${cl}`}>
                            {item.n}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="text-[8px] font-semibold text-slate-400 space-y-1 pt-3 border-t border-slate-100 mt-3">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500" /><span>Answered</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-indigo-500" /><span>Review</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-slate-900" /><span>Current</span></div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
