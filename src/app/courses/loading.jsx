'use client'

import * as React from 'react'

export default function Loading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="relative flex flex-col items-center gap-6">
        {/* Animated background glow orbs */}
        <div className="absolute w-40 h-40 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl -top-10 animate-pulse pointer-events-none" />
        
        {/* Spinning Gradient Loader ring */}
        <div className="relative w-16 h-16 rounded-full border-[3px] border-slate-200 dark:border-zinc-800 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-[3px] border-t-blue-600 dark:border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-500 uppercase tracking-widest animate-pulse">A</span>
        </div>

        {/* Branding */}
        <div className="text-center space-y-1">
          <span className="text-2xl font-extrabold tracking-[0.25em] text-slate-900 dark:text-zinc-100 uppercase">
            ASENTRA
          </span>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Loading Catalog &bull; ASENTRA Courses
          </p>
        </div>
      </div>
    </div>
  )
}
