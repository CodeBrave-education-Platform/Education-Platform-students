'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, ArrowLeft } from 'lucide-react'



export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden relative">
      {/* Background Soft Glows for Light Theme */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-50/50 rounded-full blur-[100px] -z-10"></div>

      {/* Premium Light Theme 404 Illustration */}
      <div className="relative w-full max-w-lg mx-auto aspect-square mb-2 md:mb-6 z-10 animate-fade-in">
        <Image
          src="/404-illustration.jpg"
          alt="Premium 404 Error Graphic"
          fill
          className="object-contain drop-shadow-xl"
          priority
        />
      </div>

      <div className="relative z-20 max-w-xl mx-auto -mt-10 md:-mt-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-4 tracking-tight drop-shadow-sm">
          404
        </h1>
        
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3">
          Connection Interrupted
        </h2>
        <p className="text-slate-500 mb-10 text-sm md:text-base font-medium px-4 leading-relaxed">
          The educational matrix you are attempting to access has been relocated, archived, or temporarily suspended.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0056D2] hover:bg-[#00419e] text-white font-bold rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
          >
            <Home className="w-5 h-5" />
            Return Home
          </Link>
          <button 
            onClick={() => {
              // Ensure we only go back if there's history, otherwise go home
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back()
              } else {
                window.location.href = '/'
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all active:scale-95 border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
