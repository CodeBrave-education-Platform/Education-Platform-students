'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Fingerprint, Network, Radio, Sparkles } from 'lucide-react'

export default function AuthVisual({ focusedInput }) {
  const containerRef = useRef(null)
  
  // Cartesian coordinate states for mouse tracking
  const [vectorState, setVectorState] = useState({
    x: 160,
    y: 35,
    realX: 40,
    realY: 37,
    angle: 42.8
  })
  
  const [isHovered, setIsHovered] = useState(false)

  // Calculate mouse vectors relative to grid origin (120, 72)
  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    const relativeY = e.clientY - rect.top
    
    // Clamp mouse relative coordinates inside vector plot boundary (240x144)
    const clampedX = Math.max(10, Math.min(relativeX, 230))
    const clampedY = Math.max(10, Math.min(relativeY, 134))
    
    // Calculate Cartesian coordinates relative to center origin (120, 72)
    const originX = 120
    const originY = 72
    
    const realX = Math.round(clampedX - originX)
    const realY = Math.round(originY - clampedY) // Invert Y-axis so positive is upwards
    
    // Calculate angle in degrees
    let rad = Math.atan2(realY, realX)
    if (rad < 0) rad += 2 * Math.PI
    const angle = Math.round(rad * (180 / Math.PI))
    
    setVectorState({
      x: clampedX,
      y: clampedY,
      realX,
      realY,
      angle
    })
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    // Smoothly transition back to default vector values
    setVectorState({
      x: 160,
      y: 35,
      realX: 40,
      realY: 37,
      angle: 42.8
    })
  }

  // Generate dynamic undulating wave coordinates for Email focus
  const [waveOffset, setWaveOffset] = useState(0)
  useEffect(() => {
    if (focusedInput !== 'email') return
    const interval = setInterval(() => {
      setWaveOffset(prev => (prev + 0.1) % (Math.PI * 2))
    }, 16)
    return () => clearInterval(interval)
  }, [focusedInput])

  const generateWavePath = () => {
    let path = 'M 10 72'
    for (let x = 10; x <= 230; x += 5) {
      const y = 72 + Math.sin((x / 20) + waveOffset) * 20
      path += ` L ${x} ${y}`
    }
    return path
  }

  // Render miniature interactive dashboard elements based on form focus
  const renderInteractiveDashboard = () => {
    switch (focusedInput) {
      case 'password':
      case 'confirmPassword':
        return (
          <motion.div
            key="secure-key-orbit"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex flex-col justify-between"
          >
            {/* Security Cryptography header */}
            <div className="border-b border-slate-200/60 pb-2 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-mono text-slate-800 font-extrabold uppercase tracking-widest">
                  Secure Cryptographic Lock
                </span>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded border border-emerald-150 animate-pulse">
                AES-GCM-256
              </span>
            </div>

            {/* Visual concentric security circles (pure CSS rotating circles) */}
            <div className="h-36 w-full bg-slate-100 rounded-xl relative border border-slate-200/60 overflow-hidden flex items-center justify-center">
              
              {/* Rotating outer compass ring */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 15 }}
                className="absolute w-28 h-28 border border-dashed border-teal-500/60 rounded-full flex items-center justify-center"
              >
                <div className="absolute top-0 w-2 h-2 rounded-full bg-teal-500" />
                <div className="absolute bottom-0 w-2 h-2 rounded-full bg-teal-500" />
              </motion.div>

              {/* Rotating inner ring */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 10 }}
                className="absolute w-20 h-20 border border-slate-350/70 rounded-full"
              >
                <div className="absolute left-0 w-1.5 h-1.5 rounded-full bg-slate-700" />
                <div className="absolute right-0 w-1.5 h-1.5 rounded-full bg-slate-700" />
              </motion.div>

              {/* Center locking node */}
              <div className="absolute w-12 h-12 rounded-full bg-white border border-slate-200 shadow flex items-center justify-center text-teal-600">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>

              {/* Data readouts */}
              <span className="absolute top-2 left-3 font-mono text-[8px] text-slate-400">KEY_VAULT: OK</span>
              <span className="absolute bottom-2 right-3 font-mono text-[8px] text-slate-400">SHA_256: LOCKED</span>
            </div>

            {/* Status box */}
            <div className="bg-slate-50 border border-slate-200/70 p-2.5 rounded-lg text-left space-y-1">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Encryption Tunnel Ledger</span>
              <span className="font-mono text-[9.5px] text-slate-800 font-extrabold block">
                status: active • entropy: safe • bypass: blocked
              </span>
            </div>
          </motion.div>
        )

      case 'email':
        return (
          <motion.div
            key="email-signal-resonance"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex flex-col justify-between"
          >
            {/* Signal transmission header */}
            <div className="border-b border-slate-200/60 pb-2 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-teal-600" />
                <span className="text-[10px] font-mono text-slate-800 font-extrabold uppercase tracking-widest">
                  Signal Resonance Wave
                </span>
              </div>
              <span className="bg-teal-50 text-teal-700 text-[8px] font-bold px-2 py-0.5 rounded border border-teal-150">
                SINE_AMP: LIVE
              </span>
            </div>

            {/* Animated undulating sine wave graph (pure CSS/SVG coordinates) */}
            <div className="h-36 w-full bg-slate-100 rounded-xl relative border border-slate-200/60 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-slate-200" />
              </div>

              {/* Undulating sine wave path */}
              <svg className="absolute inset-0 w-full h-full">
                <path d={generateWavePath()} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Visual coordinate guide nodes */}
                <circle cx="120" cy="72" r="3.5" fill="#1E293B" />
              </svg>

              <span className="absolute top-2 left-3 font-mono text-[8px] text-slate-400">AMP: 20dB</span>
              <span className="absolute bottom-2 right-3 font-mono text-[8px] text-slate-400">FREQ: 60Hz</span>
            </div>

            {/* Status box */}
            <div className="bg-slate-50 border border-slate-200/70 p-2.5 rounded-lg text-left space-y-1">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">SMTP Node Status</span>
              <span className="font-mono text-[9.5px] text-slate-800 font-extrabold block">
                resolving domain... data resonance validated
              </span>
            </div>
          </motion.div>
        )

      case 'fullName':
      case 'phone':
        return (
          <motion.div
            key="profile-neural-network"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex flex-col justify-between"
          >
            {/* Neural profile network header */}
            <div className="border-b border-slate-200/60 pb-2 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Network className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] font-mono text-slate-800 font-extrabold uppercase tracking-widest">
                  Constellation Mapping
                </span>
              </div>
              <span className="bg-indigo-50 text-indigo-700 text-[8px] font-bold px-2 py-0.5 rounded border border-indigo-150">
                TUNNEL: SECURE
              </span>
            </div>

            {/* Neural network mock layout */}
            <div className="h-36 w-full bg-slate-100 rounded-xl relative border border-slate-200/60 overflow-hidden flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full">
                {/* Interconnecting grid lines */}
                <line x1="50" y1="40" x2="100" y2="90" stroke="#CBD5E1" strokeWidth="1.5" />
                <line x1="100" y1="90" x2="160" y2="40" stroke="#CBD5E1" strokeWidth="1.5" />
                <line x1="160" y1="40" x2="190" y2="100" stroke="#CBD5E1" strokeWidth="1.5" />
                <line x1="100" y1="90" x2="190" y2="100" stroke="#CBD5E1" strokeWidth="1.5" />
                
                {/* Glowing Nodes */}
                <circle cx="50" cy="40" r="5" fill="#6366F1" />
                <circle cx="100" cy="90" r="6" fill="#4F46E5" />
                <circle cx="160" cy="40" r="5" fill="#0D9488" />
                <circle cx="190" cy="100" r="5" fill="#10B981" />
              </svg>

              <span className="absolute top-2 left-3 font-mono text-[8px] text-slate-400">NODES: 4/4</span>
              <span className="absolute bottom-2 right-3 font-mono text-[8px] text-slate-400">RESOLVE: 100%</span>
            </div>

            {/* Status box */}
            <div className="bg-slate-50 border border-slate-200/70 p-2.5 rounded-lg text-left space-y-1">
              <span className="text-[9px] font-bold text-slate-500 block uppercase">Telemetry Mapping Link</span>
              <span className="font-mono text-[9.5px] text-slate-800 font-extrabold block">
                {focusedInput === 'fullName' ? 'profile index: loading... indexing full name' : 'validating mobile gateway... tunnel ready'}
              </span>
            </div>
          </motion.div>
        )

      default:
        return (
          /* ---------------- DEFAULT: MOUSE-TRACKING CAD VECTOR PLOT ---------------- */
          <motion.div
            key="default-cad-plot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col justify-between"
          >
            {/* CAD coordinates header */}
            <div className="border-b border-slate-200/60 pb-2 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-650" />
                <span className="text-[10px] font-mono text-slate-800 font-extrabold uppercase tracking-widest">
                  {isHovered ? 'Interactive Mouse Tracking Vector' : 'CAD Blueprint Vector Plot'}
                </span>
              </div>
              <span className="bg-teal-50 text-teal-700 text-[8px] font-bold px-2 py-0.5 rounded border border-teal-150 select-none animate-pulse">
                {isHovered ? 'REALTIME TRACKING' : 'MOVE CURSOR HERE'}
              </span>
            </div>

            {/* Vector plotting grid box with mouse event listeners */}
            <div 
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="h-36 w-full bg-slate-100 rounded-xl relative border border-slate-200/60 cursor-crosshair overflow-hidden flex items-center justify-center transition-all hover:bg-slate-100/90"
            >
              {/* Coordinate Grid Axes */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-slate-350/50" />
                <div className="h-full w-[1px] bg-slate-350/50" />
              </div>

              {/* Vector diagram rendering dynamically based on state */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 240 144">
                {/* Plotted vector lines */}
                <line x1="120" y1="72" x2={vectorState.x} y2={vectorState.y} stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Horizontal guide relative to origin (120, 72) */}
                <line x1="120" y1="72" x2="180" y2="72" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 2" />
                
                {/* Concentric blueprint guide circles */}
                <circle cx="120" cy="72" r="40" fill="none" stroke="#CBD5E1/40" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx="120" cy="72" r="70" fill="none" stroke="#CBD5E1/40" strokeWidth="1" strokeDasharray="2 2" />

                {/* Plot dots */}
                <circle cx={vectorState.x} cy={vectorState.y} r="5" fill="#0D9488" className="shadow-md" />
                <circle cx="120" cy="72" r="3.5" fill="#1E293B" />
              </svg>

              {/* Labels readouts inside plot */}
              <span className="absolute top-2 left-3 font-mono text-[9px] text-slate-400">y</span>
              <span className="absolute bottom-2 right-3 font-mono text-[9px] text-slate-400">x</span>
              <span className="absolute top-[28px] left-[134px] font-mono text-[9.5px] text-teal-700 font-extrabold bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded border border-slate-200/50">
                θ = {vectorState.angle}°
              </span>
              <span className="absolute top-[12px] right-[28px] font-mono text-[9px] text-teal-600 font-bold bg-white/60 px-1 py-0.5 rounded">
                ({vectorState.realX}, {vectorState.realY})
              </span>
            </div>

            {/* Plotted calculus equation readout */}
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-lg text-center select-all">
              <span className="font-mono text-xs text-slate-800 font-bold block">
                {isHovered 
                  ? `V(x, y) = √(${vectorState.realX}² + ${vectorState.realY}²) = ${(Math.sqrt(vectorState.realX * vectorState.realX + vectorState.realY * vectorState.realY)).toFixed(1)} u` 
                  : 'f(x) = ∫₀^∞ e^-x² dx = √π / 2'
                }
              </span>
            </div>
          </motion.div>
        )
    }
  }

  return (
    <section 
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(203, 213, 225, 0.3) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(203, 213, 225, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px'
      }}
      className="bg-slate-50 border-l border-slate-200 hidden md:flex flex-col justify-between p-12 relative overflow-hidden min-h-[600px] select-none"
    >
      
      {/* 1. Abstract top background coordinate markers */}
      <div className="absolute top-8 right-8 font-mono text-[9px] text-slate-400 tracking-wider flex flex-col items-end gap-0.5">
        <span>GRID REF: AS-2569</span>
        <span>LATENCY: 0ms (LOCAL HOST)</span>
      </div>

      {/* Blueprint background shapes */}
      <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full border border-slate-200/40 pointer-events-none" />
      <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full border border-slate-200/20 pointer-events-none" />

      {/* 2. Concentric Centerpiece Interactive Glass Card */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-[340px] bg-white/60 backdrop-blur-md border border-white rounded-2xl shadow-md p-5 h-[270px]">
          <AnimatePresence mode="wait">
            {renderInteractiveDashboard()}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. High-Conversion Editorial Typography Focus */}
      <div className="text-left max-w-sm relative z-10 select-none">
        <h1 className="text-slate-900 text-3xl font-extrabold tracking-tight">
          Engineering the Future.
        </h1>
        <p className="text-slate-500 mt-3.5 text-xs font-semibold leading-relaxed">
          Access India's most advanced high-fidelity IIT-JEE curriculum, live telemetry, and zero-latency mock exams.
        </p>
      </div>

    </section>
  )
}
