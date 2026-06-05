'use client'

import * as React from 'react'

export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-zinc-950 text-slate-800 p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center transition-colors duration-300">
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-900/60 p-6 md:p-8 rounded-3xl border border-slate-200/60 dark:border-zinc-800/60 shadow-lg space-y-6 animate-pulse">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2">
          <div className="h-4.5 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
          <span className="text-slate-300 dark:text-zinc-700">/</span>
          <div className="h-4.5 w-32 bg-slate-200 dark:bg-zinc-800 rounded" />
        </div>

        {/* Test title section */}
        <div className="space-y-3">
          <div className="h-5 w-28 bg-slate-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-7 w-2/3 bg-slate-250 dark:bg-zinc-800 rounded-lg" />
          <div className="h-4 w-5/6 bg-slate-200 dark:bg-zinc-800/70 rounded" />
        </div>

        <hr className="border-slate-100 dark:border-zinc-800" />

        {/* 3 stats parameters box */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl space-y-2">
              <div className="h-3 w-10 bg-slate-200 dark:bg-zinc-800 mx-auto rounded" />
              <div className="h-4 w-16 bg-slate-250 dark:bg-zinc-800 mx-auto rounded" />
            </div>
          ))}
        </div>

        {/* Guidelines checklist */}
        <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3">
          <div className="h-3.5 w-36 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-200/80 dark:bg-zinc-850 rounded" />
            <div className="h-3 w-full bg-slate-200/80 dark:bg-zinc-850 rounded" />
            <div className="h-3 w-4/5 bg-slate-200/80 dark:bg-zinc-850 rounded" />
          </div>
        </div>

        {/* Action button trigger form placeholder */}
        <div className="pt-2 flex gap-4 w-full">
          <div className="flex-1 h-12 bg-slate-200 dark:bg-zinc-800 rounded-xl" />
          <div className="flex-1 h-12 bg-slate-250 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
