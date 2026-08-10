'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Next.js Caught Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-rose-50 to-transparent"></div>
        
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-inner">
          <AlertTriangle className="w-10 h-10 text-rose-600" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-2 relative z-10">Systems Overloaded</h2>
        
        <p className="text-sm font-semibold text-slate-500 mb-8 relative z-10">
          We are currently experiencing extremely high traffic volumes or a temporary database timeout. You have been placed in a queue. Please hold or refresh the page.
        </p>
        
        <div className="w-full flex flex-col gap-3 relative z-10">
          <button
            onClick={() => reset()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition flex justify-center items-center gap-2 shadow-md shadow-slate-900/20"
          >
            <RefreshCcw className="w-4 h-4" />
            Retry Connection
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-xl border border-slate-200 transition flex justify-center items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </button>
        </div>
        
        <div className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">
          ASENTRA High-Availability Infrastructure
        </div>
      </div>
    </div>
  )
}
