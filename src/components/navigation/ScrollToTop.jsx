'use client'

import React, { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress percentage
      const totalScroll = document.documentElement.scrollTop
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scroll = `${totalScroll / windowHeight}`
      
      setScrollProgress(Number(scroll))
      
      // Show button if scrolled down more than 300px
      if (totalScroll > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Calculate SVG stroke dasharray values
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - scrollProgress * circumference

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          className="fixed bottom-[90px] right-6 z-40"
        >
          <button
            onClick={scrollToTop}
            className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Scroll to top"
          >
            {/* Progress Ring SVG */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 48 48">
              <circle
                className="text-slate-100 dark:text-slate-700"
                strokeWidth="3"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="24"
                cy="24"
              />
              <circle
                className="text-[#0056D2] transition-all duration-150 ease-out"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="24"
                cy="24"
              />
            </svg>
            <ArrowUp className="w-5 h-5 text-slate-700 dark:text-slate-200 z-10 group-hover:-translate-y-1 transition-transform" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
