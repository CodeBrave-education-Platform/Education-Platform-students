'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

export default function LiveTicker() {
  const tickerText = "SYSTEM ONLINE • 1,402 ACTIVE STUDENTS • 24 LIVE COHORTS • 45,890 JEE MOCK EXAMS GRADED • ZERO DOWNTIME"
  
  // To create a perfectly seamless infinite scroll loop, we repeat the text a few times
  const repeatedText = `${tickerText} • ${tickerText} • ${tickerText} • ${tickerText}`

  return (
    <div className="w-full bg-slate-900 text-slate-300 py-2.5 text-xs font-mono tracking-widest overflow-hidden relative select-none z-50 border-b border-slate-800">
      <div className="flex whitespace-nowrap min-w-full">
        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            duration: 35
          }}
          className="inline-block whitespace-nowrap pl-4 pr-4"
        >
          <span className="inline-block">{repeatedText}</span>
        </motion.div>
      </div>
    </div>
  )
}
