'use client'

import * as React from 'react'
import { AlertCircle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default function GlobalErrorBoundary({ error, reset }) {
  React.useEffect(() => {
    // Enterprise Observability pipeline: log uncaught crashes to APM system console
    console.error('ASENTRA Global Observability Exception Boundary:', error)
  }, [error])

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-[#F8FAFC] dark:bg-zinc-950 transition-colors duration-300 font-sans relative overflow-hidden select-none">
      
      {/* Decorative premium visual elements */}
      <div className="absolute w-[500px] h-[500px] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-[80px] -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-[80px] -bottom-20 -right-20 pointer-events-none" />

      {/* Premium Glassmorphic Error Container */}
      <div className="relative w-full max-w-lg bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 shadow-2xl p-8 sm:p-12 rounded-[2.5rem] flex flex-col items-center text-center space-y-6">
        
        {/* Warning Badge Indicator */}
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-500 shadow-inner border border-rose-100/10">
          <AlertCircle className="w-8 h-8" />
        </div>

        {/* Dynamic Details block */}
        <div className="space-y-3">
          <span className="text-[10px] font-black uppercase tracking-widest bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full border border-rose-100/10">
            System Observability Boundary
          </span>
          
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-150 leading-tight">
            Runtime Exception Captured
          </h2>
          
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold max-w-sm mx-auto">
            An unexpected runtime or rendering error has been successfully isolated. Transactional ledger keys, active course progress, and grading structures remain completely secure.
          </p>

          {error?.message && (
            <div className="mt-4 p-4 bg-slate-100/50 dark:bg-zinc-950/50 rounded-2xl text-left border border-slate-200/30 dark:border-zinc-850 w-full max-h-32 overflow-y-auto">
              <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-450 break-all leading-normal">
                {error.message}
              </p>
            </div>
          )}
        </div>

        {/* Highly Interactive CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-4 border-t border-slate-100 dark:border-zinc-800/60">
          <button
            onClick={() => reset()}
            className="flex-1 py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/35 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="py-3.5 px-6 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-[0.98] text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>

      </div>
    </div>
  )
}
