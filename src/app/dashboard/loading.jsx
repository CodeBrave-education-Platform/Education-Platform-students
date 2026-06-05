'use client'

import * as React from 'react'

export default function Loading() {
  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-300 select-none flex">
      {/* 1. MOCK SIDEBAR (Desktop only) */}
      <aside className="w-20 bg-white/70 dark:bg-zinc-900/70 border-r border-slate-200/20 dark:border-zinc-800/20 hidden md:flex flex-col gap-6 py-6 px-1.5 shrink-0 h-[100vh] sticky top-0">
        <div className="space-y-6">
          <div className="w-10 h-10 bg-slate-200 dark:bg-zinc-800 rounded-2xl mx-auto animate-pulse" />
          <nav className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-12 h-12 bg-slate-200/60 dark:bg-zinc-800/60 rounded-2xl mx-auto animate-pulse"
              />
            ))}
          </nav>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col my-2 mx-2 md:my-6 md:mr-6 md:ml-6 pb-20 md:pb-6 space-y-6">
        
        {/* Mock Header */}
        <header className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-zinc-900/20 rounded-[2rem] flex justify-between items-center shadow-sm">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-250 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-3.5 w-64 bg-slate-200 dark:bg-zinc-800/70 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-slate-250 dark:bg-zinc-800 rounded-full animate-pulse hidden sm:block" />
        </header>

        <div className="p-6 md:p-8 space-y-8 flex-1">
          {/* Welcome Banner Skeleton */}
          <div className="p-6 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/10 dark:border-zinc-800/10 shadow-sm animate-pulse space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-teal-500 rounded-full" />
              <div className="h-3 w-20 bg-slate-250 dark:bg-zinc-850 rounded" />
            </div>
            <div className="h-5 w-40 bg-slate-250 dark:bg-zinc-850 rounded-lg" />
            <div className="h-3.5 w-5/6 bg-slate-200 dark:bg-zinc-850/80 rounded" />
          </div>

          {/* Stats Cards Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 rounded-[2rem] border border-slate-200/30 dark:border-zinc-850/30 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl shadow-sm flex items-center gap-5 animate-pulse"
              >
                <div className="p-3.5 rounded-2xl bg-slate-250 dark:bg-zinc-800 w-12 h-12 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
                  <div className="h-6 w-10 bg-slate-250 dark:bg-zinc-850 rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Item/Courses Grid Skeleton */}
          <div className="space-y-4">
            <div className="h-5 w-44 bg-slate-250 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-zinc-900/40 shadow-sm flex flex-col justify-between min-h-[220px] animate-pulse space-y-4"
                >
                  <div className="space-y-3">
                    <div className="h-4.5 w-20 bg-slate-250 dark:bg-zinc-800 rounded-full" />
                    <div className="h-5 bg-slate-250 dark:bg-zinc-800 rounded-full w-5/6" />
                    <div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded-full w-full" />
                    <div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded-full w-4/5" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-850 rounded" />
                    <div className="h-8 w-24 bg-slate-250 dark:bg-zinc-800 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
