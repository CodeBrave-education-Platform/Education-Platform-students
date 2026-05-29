'use client'

import React, { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Focus Mode Learn Player boundary captured error:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 text-slate-800 p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/60 shadow-lg text-center space-y-6 animate-fade-in">
        {/* Warning Icon Graphic */}
        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto text-teal-600 border border-teal-100 shadow-inner">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Text Headers */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Encountered a Playback Issue
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            There was a problem loading this lesson or verifying your student enrollment status.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-100 text-xs font-mono text-slate-500 max-h-24 overflow-y-auto">
            {error.message || 'Unknown compilation or runtime failure.'}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 px-5 py-3 bg-teal-650 text-white font-semibold rounded-xl hover:bg-teal-750 active:bg-teal-850 transition shadow-sm text-sm border border-teal-600 cursor-pointer"
          >
            Retry Playback
          </button>
          <a
            href="/dashboard"
            className="flex-1 px-5 py-3 bg-white text-slate-655 font-semibold rounded-xl hover:bg-slate-55 transition border border-slate-205 text-sm cursor-pointer block text-center"
          >
            Return to Courses
          </a>
        </div>
      </div>
    </div>
  )
}
