'use client'

import React from 'react'
import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -z-10"></div>

      {/* Nano Banana Animation */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2,
          ease: "easeInOut"
        }}
        className="text-[120px] leading-none mb-4 filter drop-shadow-2xl select-none"
      >
        🍌
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tight"
      >
        404
      </motion.h1>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-slate-200 mb-4">
          Oops! The Nano Banana slipped.
        </h2>
        <p className="text-slate-400 max-w-md mx-auto mb-10 text-sm md:text-base font-medium">
          The page you are looking for has been moved, deleted, or possibly eaten by our highly advanced AI. Let's get you back on track.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-900/50"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 border border-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>
      </motion.div>
    </div>
  )
}
