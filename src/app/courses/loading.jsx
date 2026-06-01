'use client'

import * as React from 'react'

export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-800 p-6 md:p-12 animate-fade-in-scroll">
      <div className="max-w-7xl mx-auto space-y-8 select-none">
        
        {/* Navigation Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          <span className="text-slate-350 font-bold">/</span>
          <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Catalog Header & Search Box Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-200/60">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-4 w-72 bg-slate-150 rounded-lg animate-pulse" />
          </div>
          {/* Fake Search bar input */}
          <div className="w-full md:w-80 h-11 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        {/* Dynamic Course Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div 
              key={idx} 
              className="bg-white border border-slate-200 rounded-[1.8rem] overflow-hidden flex flex-col justify-between p-5 min-h-[440px] shadow-sm relative space-y-5"
            >
              <div className="space-y-4 w-full">
                {/* Visual Thumbnail aspect-ratio */}
                <div className="w-full aspect-video bg-slate-200 rounded-2xl animate-pulse relative overflow-hidden" />
                
                {/* Level Tag Skeleton */}
                <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" />
                
                {/* Course Title and descriptive lines */}
                <div className="space-y-2">
                  <div className="h-5.5 bg-slate-200 rounded-full w-5/6 animate-pulse" />
                  <div className="h-3.5 bg-slate-150 rounded-full w-full animate-pulse" />
                  <div className="h-3.5 bg-slate-150 rounded-full w-4/5 animate-pulse" />
                </div>

                {/* Additional Course Meta-tags */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-250 rounded-full animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded-full w-1/2 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-250 rounded-full animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded-full w-1/3 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Action Button Skeleton */}
              <div className="h-10 bg-slate-250 rounded-xl w-full animate-pulse" />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
