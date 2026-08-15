'use client'

import React, { useState, useEffect } from 'react'
import { X, Cookie } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('asentra_cookie_consent')
    if (!hasAccepted) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('asentra_cookie_consent', 'true')
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none flex justify-center"
        >
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 sm:p-6 max-w-4xl w-full pointer-events-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full shrink-0">
              <Cookie className="w-6 h-6 text-[#0056D2] dark:text-blue-400" />
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-1">We value your privacy</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                We use cookies and telemetry to improve your experience, personalize your AI Mentor interactions, and analyze traffic. By continuing, you consent to our use of cookies.
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <button 
                onClick={() => setIsVisible(false)}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                Decline
              </button>
              <button 
                onClick={handleAccept}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-[#0056D2] hover:bg-[#00419e] text-white text-xs font-bold rounded-lg shadow-md transition-colors"
              >
                Accept All
              </button>
            </div>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 sm:hidden p-2 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
