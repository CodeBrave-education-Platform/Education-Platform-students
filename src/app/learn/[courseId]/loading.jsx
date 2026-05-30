'use client'

import React from 'react'

export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-800 p-4 md:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
          <span className="text-slate-300">/</span>
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          <span className="text-slate-300">/</span>
          <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Dynamic Focus Mode Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Left Video Player Canvas Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="w-full aspect-video bg-slate-200 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden animate-pulse">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Play Button Skeleton */}
                <div className="w-16 h-16 rounded-full bg-slate-300/50 flex items-center justify-center">
                  <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-slate-400 ml-1" />
                </div>
              </div>
              {/* Fake progress bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-300/40">
                <div className="h-full w-1/3 bg-teal-500/30 animate-pulse" />
              </div>
            </div>

            {/* Title & Actions Skeleton */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-7 w-2/3 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse" />
              </div>

              <hr className="border-slate-100" />

              {/* Description Skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-4/5 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Curriculum Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-[600px]">
              {/* Sidebar Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-2">
                <div className="h-5 w-2/3 bg-slate-200 rounded animate-pulse" />
                <div className="h-3.5 w-1/2 bg-slate-100 rounded animate-pulse" />
              </div>

              {/* Curriculum List Skeleton */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3 bg-white"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Checkbox Skeleton */}
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-slate-50 animate-pulse flex-shrink-0" />
                      {/* Lesson title */}
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 w-full bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 w-1/3 bg-slate-100 rounded animate-pulse" />
                      </div>
                    </div>
                    {/* Play symbol/duration */}
                    <div className="w-8 h-4 bg-slate-100 rounded animate-pulse flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
