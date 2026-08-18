'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Play, Volume2, Maximize, FileText, HelpCircle, List, Award, BarChart3, MessageSquare, Flame } from 'lucide-react'

export default function FeatureScroll() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
    }
  }

  return (
    <section className="bg-white py-20 lg:py-32 px-6 overflow-hidden border-t border-slate-100">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 select-none">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Rigorous Training Systems for JEE Candidates
          </h2>
          <div className="h-1.5 w-16 bg-teal-600 mx-auto rounded-full" />
          <p className="text-slate-500 text-sm font-semibold tracking-wide">
            Zero-friction interfaces. Server-validated telemetry. High-accuracy mock engines.
          </p>
        </div>

        {/* Asymmetric Bento Grid Container */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
        >
          
          {/* Cell 1: Large Wide Cell (Syllabus & Lecture Player) - Spans 2 Columns */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-6 lg:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            {/* Cell Content */}
            <div className="flex flex-col xl:flex-row gap-8 items-start justify-between">
              
              {/* Text Side */}
              <div className="w-full xl:w-2/5 space-y-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-teal-600" />
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Interactive Classroom</span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">
                  Rigorous Syllabus & Video Player.
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Attend course lectures with side-by-side synchronized notes, dynamic chapter timelines, and instant doubt-clearing panels. Toggle items without losing your timestamp.
                </p>

                <div className="space-y-2.5 pt-2">
                  {[
                    'Multi-speed HTML5 video rendering with layout presets',
                    'Integrated lecture note sheets loaded on chapter mark triggers',
                    'Doubt threads linked to the exact timestamp of the video frame'
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-slate-700 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mockup Side */}
              <div className="w-full xl:w-3/5 bg-slate-100/50 border border-slate-200 rounded-xl p-3.5 space-y-3.5">
                {/* Fake Video Player Box */}
                <div className="w-full bg-slate-950 aspect-video rounded-lg overflow-hidden relative border border-slate-800 flex flex-col justify-between p-3">
                  <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono">
                    <span className="bg-slate-800/80 px-2 py-0.5 rounded backdrop-blur">CHAPTER 3: Rotational Dynamics</span>
                    <span>1080p • 1.5x</span>
                  </div>
                  
                  {/* Fake play center button */}
                  <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center self-center cursor-pointer hover:bg-white/20 transition-all text-white tactile-press">
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  </button>

                  {/* Player Bottom Control panel */}
                  <div className="space-y-1.5">
                    {/* Seeker tracking progress */}
                    <div className="w-full h-1 bg-slate-800 rounded-full cursor-pointer relative">
                      <div className="absolute top-0 left-0 w-3/5 h-full bg-teal-500 rounded-full" />
                    </div>

                    <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        <Play className="w-3 h-3 fill-slate-400 text-slate-400 cursor-pointer" />
                        <Volume2 className="w-3 h-3 cursor-pointer" />
                        <span>24:15 / 45:00</span>
                      </div>
                      <Maximize className="w-3 h-3 cursor-pointer" />
                    </div>
                  </div>
                </div>

                {/* Sidebar Tabs Mockup Layout beneath player */}
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="flex border-b border-slate-100 bg-slate-50 text-[9px] font-bold text-slate-500">
                    <button className="flex-1 py-2 border-b-2 border-teal-600 text-teal-600 flex items-center justify-center gap-1 bg-white tactile-press">
                      <FileText className="w-3 h-3" />
                      <span>Syllabus Notes</span>
                    </button>
                    <button className="flex-1 py-2 flex items-center justify-center gap-1 hover:bg-slate-100/50 tactile-press">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      <span>Doubt Feed (12)</span>
                    </button>
                    <button className="flex-1 py-2 flex items-center justify-center gap-1 hover:bg-slate-100/50 tactile-press">
                      <List className="w-3 h-3 text-slate-400" />
                      <span>Chapters</span>
                    </button>
                  </div>

                  <div className="p-3 space-y-2 text-[10px]">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 font-medium text-slate-700">
                      <p className="font-extrabold text-slate-900 border-b border-slate-200 pb-1 mb-1">Key Formulas Summary</p>
                      <p className="font-mono text-slate-600 mt-1">1. Angular Momentum: L = Iω</p>
                      <p className="font-mono text-slate-600">2. Torque Expression: τ = Iα = dL/dt</p>
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-semibold text-slate-400">
                      <span>Last updated 2 hours ago</span>
                      <button className="text-teal-600 hover:underline flex items-center gap-0.5 tactile-press">
                        <span>Download PDF</span>
                        <FileText className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

          {/* Cell 2: Tall Vertical Cell (NTA Exam Vault) - Spans 1 Column, Spans 2 Rows */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-1 md:row-span-2 bg-white border border-slate-200 shadow-md rounded-2xl p-5 flex flex-col justify-between"
          >
            {/* Header info */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Assessment Suite</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                  NTA Examination Vault.
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">
                  Train under identical JEE exam conditions. Official timers, responsive question palettes, and secure server-side evaluations simulate actual test stress.
                </p>
              </div>

              {/* Miniature UI Exam Mockup */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5 mt-2">
                {/* Title */}
                <div className="flex justify-between items-center bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm text-[9px] font-bold">
                  <span className="text-slate-800">JEE MOCK TEST-04</span>
                  <span className="font-mono text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">01:58 LEFT</span>
                </div>

                {/* Q Panel */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm space-y-2">
                  <p className="text-[9.5px] text-slate-800 font-bold leading-normal">
                    Q4. Restore force F = -kx. If amplitude is doubled, which parameter is unchanged?
                  </p>
                  
                  {/* Options */}
                  <div className="space-y-1">
                    {[
                      { k: 'A', text: 'Max Velocity' },
                      { k: 'B', text: 'Time Period' },
                      { k: 'C', text: 'Max Acceleration' }
                    ].map((opt) => (
                      <label key={opt.k} className={`flex items-center gap-2 px-2 py-1 rounded border text-[8.5px] font-semibold cursor-pointer transition-colors ${
                        opt.k === 'B' 
                          ? 'bg-emerald-50/50 border-emerald-500 text-emerald-950 font-bold' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-700'
                      }`}>
                        <input 
                          type="radio" 
                          name="bento-shm" 
                          defaultChecked={opt.k === 'B'} 
                          disabled 
                          className="accent-emerald-600 w-2.5 h-2.5 shrink-0" 
                        />
                        <span>{opt.k}. {opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Visual guidelines to fill the vertical gap and enrich the mock representation */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm text-[8.5px] text-slate-500 font-semibold space-y-1">
                  <div className="font-bold text-slate-700 uppercase tracking-widest text-[8px] border-b border-slate-100 pb-0.5 flex items-center justify-between">
                    <span>Testing Protocol</span>
                    <span className="text-teal-600 animate-pulse flex items-center gap-1 font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      Protocol Active
                    </span>
                  </div>
                  <p className="leading-snug">1. Responses are auto-saved on clicking <span className="font-bold text-teal-600">Save & Next</span>.</p>
                  <p className="leading-snug">2. Server-side validations verify timestamps securely.</p>
                </div>

                {/* Palette */}
                <div>
                  <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">Palette</p>
                  <div className="grid grid-cols-5 gap-1">
                    {[
                      { n: 1, s: 'ans' },
                      { n: 2, s: 'ans' },
                      { n: 3, s: 'rev' },
                      { n: 4, s: 'act' },
                      { n: 5, s: 'vis' },
                      { n: 6, s: 'unv' },
                      { n: 7, s: 'unv' },
                      { n: 8, s: 'unv' },
                      { n: 9, s: 'unv' },
                      { n: 10, s: 'unv' }
                    ].map((item) => {
                      let cl = 'bg-slate-100 text-slate-400 border-slate-200'
                      if (item.s === 'ans') cl = 'bg-emerald-500 text-white border-emerald-600'
                      if (item.s === 'rev') cl = 'bg-indigo-500 text-white border-indigo-600'
                      if (item.s === 'act') cl = 'bg-slate-900 text-white border-slate-950 ring-1 ring-emerald-500/40'
                      if (item.s === 'vis') cl = 'bg-amber-500 text-white border-amber-600'
                      return (
                        <div key={item.n} className={`h-4.5 rounded text-[8px] font-bold flex items-center justify-center border tactile-press ${cl}`}>
                          {item.n}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom button controls */}
            <div className="flex gap-2 justify-between items-center text-[9px] font-bold mt-4 pt-3 border-t border-slate-100">
              <button className="bg-slate-100 border border-slate-200 px-2 py-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer tactile-press flex-1 text-center">
                Clear
              </button>
              <button className="bg-emerald-600 border border-emerald-700 text-white px-2.5 py-1.5 rounded shadow-sm hover:bg-emerald-700 cursor-pointer tactile-press flex-2 text-center">
                Save & Next
              </button>
            </div>
          </motion.div>

          {/* Cell 3: Database Analytics Metrics - Spans 1 Column */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-1 bg-slate-100 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Database Telemetry</span>
              </div>
              
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                  Sub-Second Analytics.
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">
                  Verify your preparation logs with server-aggregated telemetry. Track formula retention and precision metrics inside course modules.
                </p>
              </div>

              {/* Tiny telemetry layout */}
              <div className="space-y-2 bg-white/70 border border-slate-200 p-3 rounded-xl mt-2">
                <div className="flex justify-between text-[8px] font-bold text-slate-600">
                  <span>Chemistry Prep</span>
                  <span>94.2%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 w-[94.2%]" />
                </div>

                <div className="flex justify-between text-[8px] font-bold text-slate-600">
                  <span>Mathematics Accuracy</span>
                  <span>99.1%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[99.1%]" />
                </div>
              </div>
            </div>

            <div className="text-[9px] font-bold text-teal-600 mt-4 uppercase tracking-wider select-none">
              Aggregating live metadata...
            </div>
          </motion.div>

          {/* Cell 4: Live Cohort Doubt Rooms - Spans 1 Column */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-1 bg-white border-l-4 border-l-teal-600 border-y border-r border-slate-200 rounded-r-2xl rounded-l-md p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Synchronized Doubts</span>
              </div>
              
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
                  Structured Doubt Rooms.
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">
                  Connect directly with course educators. Resolve core equations within timed discussion threads to isolate error rates.
                </p>
              </div>

              {/* Chat Simulation */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 max-h-[80px] overflow-hidden text-[9px] font-medium text-slate-600 leading-tight">
                <div>
                  <span className="font-bold text-teal-600">Rahul S.</span> Is torque expression zero under net frame shift?
                </div>
                <div>
                  <span className="font-bold text-slate-700">Educator</span> Only in translational equilibrium. Torque depends on the origin axis.
                </div>
              </div>
            </div>

            <div className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-wide">
              142 Active Peer Discussions
            </div>
          </motion.div>

        </motion.div>

      </div>
    </section>
  )
}
