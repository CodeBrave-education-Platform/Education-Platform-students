'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

export default function LiveTicker({ stats = null }) {
  const studentCount = stats?.activeStudents || '1,400+'
  const cohortCount = stats?.liveCohorts || '24'
  const examCount = stats?.mockExams || '45,800+'

  const tickerText = `SYSTEM ONLINE • ${studentCount} ACTIVE ASPIRANTS • ${cohortCount} LIVE COHORTS • ${examCount} CBT DRILLS GRADED • REAL-TIME LEADERBOARDS • ZERO DOWNTIME`
  
  // Create a continuous seamless scroll loop by repeating the text
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
