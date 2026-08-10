'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Catch-all catastrophic error
    console.error('Next.js Global Caught Error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-200">
        <div className="min-h-screen flex items-center justify-center p-6 font-sans select-none">
          <div className="max-w-lg w-full text-center space-y-6">
            
            <div className="w-24 h-24 bg-rose-900/30 rounded-full flex items-center justify-center mx-auto border border-rose-500/20 shadow-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>

            <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-3">Critical Service Outage</h1>
              <p className="text-base font-semibold text-slate-400 max-w-md mx-auto">
                ASENTRA is currently mitigating a severe infrastructure load spike. Our engineers are auto-scaling the database clusters. We will be back online shortly.
              </p>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => reset()}
                className="w-full sm:w-auto px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl transition shadow-lg shadow-teal-500/20"
              >
                Reconnect to Matrix
              </button>
            </div>
            
            <div className="pt-12 text-[10px] font-black uppercase tracking-widest text-slate-600">
              STATUS: Code Red • Error 503
            </div>

          </div>
        </div>
      </body>
    </html>
  )
}
