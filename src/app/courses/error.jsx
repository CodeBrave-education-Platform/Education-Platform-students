'use client'

import * as React from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function Error({ error, reset }) {
  React.useEffect(() => {
    console.error('ASENTRA Courses Route Exception:', error)
  }, [error])

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Glow orbs */}
      <div className="absolute w-[400px] h-[400px] bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl -top-10 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -bottom-10 pointer-events-none" />

      {/* Glassmorphic Error Card */}
      <div className="relative w-full max-w-md bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white dark:border-zinc-800 shadow-2xl p-8 sm:p-10 rounded-[2.5rem] flex flex-col items-center text-center space-y-6">
        
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-500 shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Catalog Loading Failed
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            An unexpected error occurred while fetching the premium course catalog. Our transactional registries are perfectly secure.
          </p>
          {error?.message && (
            <div className="mt-3 p-3 bg-slate-100/55 dark:bg-zinc-950/50 rounded-xl text-left border border-slate-200/30 dark:border-zinc-850 w-full">
              <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-455 break-all leading-normal">
                {error.message}
              </p>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-6 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/35 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="py-3 px-6 rounded-full border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-[0.98] text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
        </div>

      </div>
    </div>
  )
}
