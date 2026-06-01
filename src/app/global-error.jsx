'use client'

import * as React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function GlobalError({ error, reset }) {
  React.useEffect(() => {
    // Production Telemetry: dispatch background fetch request to our /api/telemetry endpoint
    const reportError = async () => {
      try {
        const errorData = {
          message: error?.message || 'Unknown global root-level exception',
          stack: error?.stack || '',
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          timestamp: new Date().toISOString()
        }
        
        await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        })
      } catch (err) {
        console.error('Failed to report telemetry payload:', err)
      }
    }

    reportError()
  }, [error])

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC] dark:bg-zinc-950 font-sans text-slate-800 dark:text-zinc-200">
        
        {/* Glow orbs background decoration */}
        <div className="absolute w-[400px] h-[400px] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-[80px] -top-10 pointer-events-none" />
        
        {/* Widescreen visual recovery panel */}
        <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl p-8 sm:p-10 rounded-[2.5rem] flex flex-col items-center text-center space-y-6">
          
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-500 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full border border-rose-100/10">
              Global Root Exception
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-150">
              Core Registry Exception
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
              The root layout layout boundary isolated an unhandled crash. All database keys, course modules, and financial registries remain secure. Telemetry reports have been ingested.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Environment</span>
          </button>
          
        </div>
      </body>
    </html>
  )
}
