'use client'

import * as React from 'react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 select-none">
        
        {/* Navigation Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          <span className="text-slate-400 font-bold">/</span>
          <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Catalog Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-4 w-80 bg-slate-200 rounded-lg animate-pulse" />
          </div>
          <div className="w-full md:w-80 h-11 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        {/* Asymmetrical Bento Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pt-4">
          
          {/* Flagship Hero Card Skeleton (2-Col Span) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 min-h-[480px] space-y-6 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <div className="h-6 w-36 bg-slate-200 rounded-full animate-pulse" />
                <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
              </div>
              <div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 aspect-[16/9] bg-slate-200 rounded-2xl animate-pulse" />
              <div className="lg:col-span-6 space-y-4">
                <div className="h-7 bg-slate-200 rounded-xl w-4/5 animate-pulse" />
                <div className="h-4 bg-slate-200 rounded-lg w-full animate-pulse" />
                <div className="h-4 bg-slate-200 rounded-lg w-2/3 animate-pulse" />
                <div className="h-12 bg-slate-100 rounded-xl w-full animate-pulse" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <div className="h-5 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-5 bg-slate-100 rounded-lg animate-pulse" />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <div className="h-8 w-32 bg-slate-200 rounded-xl animate-pulse" />
              <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Standard Modular Card Skeletons (1-Col Spans) */}
          {[1, 2, 3, 4].map((idx) => (
            <div 
              key={`skel_${idx}`} 
              className="col-span-1 bg-white border border-slate-200 rounded-3xl p-5 min-h-[420px] flex flex-col justify-between shadow-sm space-y-4"
            >
              <div className="space-y-3">
                <div className="aspect-[16/9] bg-slate-200 rounded-2xl animate-pulse" />
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="h-5 bg-slate-200 rounded-lg w-5/6 animate-pulse" />
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <div className="h-6 w-20 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-9 w-24 bg-slate-200 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}

        </div>

      </div>
    </div>
  )
}
