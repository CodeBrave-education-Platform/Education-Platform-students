'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

export default function AuthVisual() {
  return (
    <section 
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(203, 213, 225, 0.3) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(203, 213, 225, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px'
      }}
      className="bg-slate-50 border-l border-slate-200 hidden md:flex flex-col justify-between p-12 relative overflow-hidden min-h-[600px] select-none"
    >
      
      {/* 1. Abstract top background coordinate markers */}
      <div className="absolute top-8 right-8 font-mono text-[9px] text-slate-400 tracking-wider flex flex-col items-end gap-0.5">
        <span>GRID REF: AS-2569</span>
        <span>LATENCY: 0ms (LOCAL HOST)</span>
      </div>

      {/* Subtle drawing concentric circles in top left background to represent drafting blueprints */}
      <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full border border-slate-200/50 pointer-events-none" />
      <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full border border-slate-200/30 pointer-events-none" />

      {/* 2. Floating Centerpiece Glassmorphism Card */}
      <div className="flex-1 flex items-center justify-center relative">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{
            repeat: Infinity,
            repeatType: 'loop',
            duration: 5,
            ease: 'easeInOut'
          }}
          className="w-full max-w-[340px] bg-white/60 backdrop-blur-md border border-white rounded-2xl shadow-md p-5 space-y-4 select-none relative z-10"
        >
          {/* Mock Math & Geometry Header */}
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase tracking-widest">
              Coordinate Vector Plot
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Coordinate system visual (pure CSS) */}
          <div className="h-36 w-full bg-slate-100/80 rounded-xl relative border border-slate-200/60 flex items-center justify-center overflow-hidden">
            {/* Grid Axes */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-[1px] bg-slate-350/50" />
              <div className="h-full w-[1px] bg-slate-350/50" />
            </div>

            {/* Plotted vector angle lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 144">
              {/* Plotted vector lines */}
              <line x1="100" y1="72" x2="160" y2="22" stroke="#0D9488" strokeWidth="2" strokeDasharray="3 2" />
              <line x1="100" y1="72" x2="150" y2="72" stroke="#64748B" strokeWidth="1.5" />
              
              {/* Circle Arc */}
              <path d="M 120 72 A 20 20 0 0 0 115 57" fill="none" stroke="#0D9488" strokeWidth="2" />
              
              {/* Plot dots */}
              <circle cx="160" cy="22" r="4.5" fill="#0D9488" className="shadow" />
              <circle cx="100" cy="72" r="3.5" fill="#1E293B" />
            </svg>

            {/* Labels */}
            <span className="absolute top-2 left-3 font-mono text-[9px] text-slate-400">y</span>
            <span className="absolute bottom-2 right-3 font-mono text-[9px] text-slate-400">x</span>
            <span className="absolute top-[28px] left-[118px] font-mono text-[9px] text-teal-600 font-extrabold">θ = 39.8°</span>
            <span className="absolute top-[12px] right-[28px] font-mono text-[9px] text-teal-600 font-extrabold">V(r, θ)</span>
          </div>

          {/* Plotted integral calculus equation mock */}
          <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-lg text-center">
            <span className="font-mono text-xs text-slate-800 font-bold block select-all">
              f(x) = ∫<sub>0</sub><sup>∞</sup> e<sup>-x²</sup> dx = &radic;&pi; / 2
            </span>
          </div>
        </motion.div>

        {/* Faint coordinate grids elements floating behind */}
        <div className="absolute w-48 h-48 border border-slate-200/30 rounded-full top-[10%] right-[5%] pointer-events-none" />
      </div>

      {/* 3. High-Conversion Editorial Typography Focus */}
      <div className="text-left max-w-sm relative z-10 select-none">
        <h1 className="text-slate-900 text-3xl font-extrabold tracking-tight">
          Engineering the Future.
        </h1>
        <p className="text-slate-500 mt-3.5 text-xs font-semibold leading-relaxed">
          Access India's most advanced high-fidelity IIT-JEE curriculum, live telemetry, and zero-latency mock exams.
        </p>
      </div>

    </section>
  )
}
