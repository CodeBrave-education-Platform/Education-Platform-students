'use client'

import * as React from 'react'

export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 text-slate-800 p-4 md:p-8 animate-fade-in transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6 select-none animate-pulse">
        {/* Navigation Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 bg-slate-200 dark:bg-zinc-800 rounded" />
          <span className="text-slate-300 dark:text-zinc-700">/</span>
          <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded" />
        </div>

        {/* Profile Card Shell */}
        <div className="bg-white dark:bg-zinc-900/60 rounded-3xl border border-slate-200/60 dark:border-zinc-800/60 shadow-lg overflow-hidden">
          {/* Header Banner Accent */}
          <div className="h-32 bg-slate-100 dark:bg-zinc-800 relative">
            {/* Avatar Circle */}
            <div className="absolute -bottom-10 left-6 sm:left-8 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white dark:border-zinc-900 bg-slate-250 dark:bg-zinc-750 shadow-md" />
          </div>

          <div className="pt-14 pb-8 px-6 sm:px-8 space-y-6">
            {/* Header Text Placeholders */}
            <div className="space-y-2">
              <div className="h-6 w-48 bg-slate-250 dark:bg-zinc-800 rounded-lg" />
              <div className="h-3.5 w-60 bg-slate-200 dark:bg-zinc-800/70 rounded-md" />
            </div>

            <hr className="border-slate-100 dark:border-zinc-800" />

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3.5 w-24 bg-slate-200 dark:bg-zinc-800 rounded" />
                  <div className="h-10 w-full bg-slate-150 dark:bg-zinc-850 rounded-xl border border-slate-200/40 dark:border-zinc-800/40" />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 justify-end">
              <div className="h-10 w-24 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-10 w-36 bg-slate-250 dark:bg-zinc-800 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
