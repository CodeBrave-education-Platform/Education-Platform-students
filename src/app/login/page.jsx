'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, Mail, Phone, KeyRound, Loader2, ArrowRight, ShieldCheck, AlertCircle, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Auth Modes
  const [authMode, setAuthMode] = useState('LOGIN') // 'LOGIN' | 'SIGNUP'

  // Input states
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student') // 'student' | 'teacher'
  const [otp, setOtp] = useState('')

  // UI Flow states
  const [step, setStep] = useState('SEND_EMAIL') // 'SEND_EMAIL' | 'VERIFY_OTP'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Animation state
  const [shakeCount, setShakeCount] = useState(0)

  // Prevent server-side hydration mismatches for next-themes
  useEffect(() => {
    setMounted(true)
  }, [])

  // Framer Motion Shake Animation Variants
  const cardVariants = {
    idle: {
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    },
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5, ease: 'easeInOut' }
    }
  }

  // OTP Request logic (Step 1)
  const handleRequestOtp = async (e) => {
    e.preventDefault()
    
    // Validations
    if (!email) return
    
    const cleanPhone = phone.trim()
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.')
      setShakeCount(prev => prev + 1)
      return
    }

    if (authMode === 'SIGNUP' && !fullName) {
      setError('Please enter your full name to register.')
      setShakeCount(prev => prev + 1)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    // Defensive log check of the Supabase URL
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    try {
      // Validate environment variables
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id") ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-supabase-anon-key")
      ) {
        throw new Error("Missing Supabase Environment Variables.");
      }

      // Configure metadata to pass inside options.data
      const metadata = {
        phone_number: `+91${cleanPhone}`
      }
      
      if (authMode === 'SIGNUP') {
        metadata.full_name = fullName
        metadata.role = role
      }

      // Call signInWithOtp using email and phone number passed in options.data
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: metadata
        }
      })

      if (otpError) {
        throw otpError
      }

      setSuccess('Verification code sent successfully!')
      // Transition to code confirmation
      setTimeout(() => {
        setStep('VERIFY_OTP')
        setSuccess('')
      }, 800)
    } catch (err) {
      console.error("OTP Request Error:", err);
      let userFriendlyMessage = err.message || 'Failed to request verification code.';
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        userFriendlyMessage = "Network connection failed. Please ensure the Supabase service is online and accessible.";
      }
      setError(userFriendlyMessage);
      setShakeCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // OTP Verification logic (Step 2)
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit verification code.')
      setShakeCount(prev => prev + 1)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        throw new Error("Missing Supabase Environment Variables.");
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })

      if (verifyError) {
        throw verifyError
      }

      setSuccess('Successfully authenticated! Redirecting...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    } catch (err) {
      console.error("Verification Error:", err);
      let userFriendlyMessage = err.message || 'Invalid or expired verification code.';
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        userFriendlyMessage = "Network connection failed. Please ensure the Supabase service is online and accessible.";
      }
      setError(userFriendlyMessage);
      setShakeCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans">
      
      {/* Dynamic Animated Shifting Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/30 bg-gradient-size animate-gradient-shift filter blur-3xl opacity-80" />
      
      {/* Decorative Glow accent elements */}
      <div className="absolute top-[15%] left-[10%] w-[35rem] h-[35rem] rounded-full bg-violet-400/10 dark:bg-indigo-950/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[10%] w-[30rem] h-[30rem] rounded-full bg-pink-400/10 dark:bg-purple-950/15 blur-[120px] pointer-events-none" />

      {/* Header and Toggle Theme Selector */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-pink-500 bg-clip-text text-transparent">
          <ShieldCheck className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
          <span>EduPortal</span>
        </div>
        
        {mounted && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-3 rounded-full border border-white/20 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md text-zinc-800 dark:text-zinc-200 cursor-pointer shadow-lg transition-colors hover:bg-white/60 dark:hover:bg-zinc-900/60"
            aria-label="Toggle Dark Mode"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>
        )}
      </header>

      {/* Main Glassmorphic Auth Card */}
      <motion.div
        key="auth-card"
        animate={shakeCount > 0 ? 'shake' : 'idle'}
        variants={cardVariants}
        whileHover={{ 
          y: -6, 
          scale: 1.015,
          boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.15), 0 0 50px -10px rgba(99, 102, 241, 0.15)"
        }}
        className="z-10 w-full max-w-md mx-4 p-8 rounded-3xl bg-white/30 dark:bg-zinc-900/30 backdrop-blur-xl border border-white/40 dark:border-zinc-800/40 shadow-2xl relative overflow-hidden transition-all duration-300"
      >
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-indigo-500/5 to-transparent pointer-events-none rotate-45" />

        <AnimatePresence mode="wait">
          {step === 'SEND_EMAIL' ? (
            <motion.div
              key="step-request"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Tab Selector: Login vs Sign Up */}
              <div className="flex bg-zinc-200/50 dark:bg-zinc-950/50 p-1.5 rounded-2xl mb-8 relative">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN')
                    setError('')
                    setSuccess('')
                  }}
                  className={`flex-1 text-center py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'LOGIN'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-md'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('SIGNUP')
                    setError('')
                    setSuccess('')
                  }}
                  className={`flex-1 text-center py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'SIGNUP'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-md'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
                  }`}
                >
                  Register
                </button>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {authMode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                  {authMode === 'LOGIN' 
                    ? 'Access your educational portal instantly' 
                    : 'Enter details below to create your account'}
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                
                {/* Signup Fields (Full Name and Role selector) */}
                {authMode === 'SIGNUP' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                          <User className="w-5 h-5" />
                        </span>
                        <input
                          id="fullName"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          disabled={loading}
                          className="w-full pl-11 pr-4 py-3.5 bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-400 font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all text-base"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                        I am registering as a
                      </label>
                      <div className="grid grid-cols-2 gap-3 bg-zinc-200/50 dark:bg-zinc-950/50 p-1 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setRole('student')}
                          className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            role === 'student'
                              ? 'bg-indigo-500 text-white shadow-md'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
                          }`}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('teacher')}
                          className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            role === 'teacher'
                              ? 'bg-indigo-500 text-white shadow-md'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700'
                          }`}
                        >
                          Instructor
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Email Input Field */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                      <Mail className="w-5 h-5" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3.5 bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-400 font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all text-base"
                    />
                  </div>
                </div>

                {/* Phone Number Input Field placed right below the Email input */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                    Indian Mobile Number
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                      <Phone className="w-5 h-5" />
                    </span>
                    <div className="absolute left-11 flex items-center text-zinc-500 dark:text-zinc-400 font-bold border-r border-zinc-200 dark:border-zinc-800/80 pr-2.5 h-6 select-none text-sm">
                      +91
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        setPhone(val.substring(0, 10))
                      }}
                      placeholder="98765 43210"
                      disabled={loading}
                      className="w-full pl-22 pr-4 py-3.5 bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-400 font-semibold tracking-wider text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-normal placeholder:tracking-normal transition-all text-base"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-2.5 items-start p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-2.5 items-start p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
                    >
                      <Loader2 className="w-5 h-5 shrink-0 animate-spin mt-0.5" />
                      <span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/20 cursor-pointer disabled:opacity-50 transition-all text-base"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{authMode === 'LOGIN' ? 'Send Code' : 'Register Account'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            // Step 2: OTP Verification
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4 shadow-inner">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Verify Passcode
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                  We've sent a 6-digit confirmation code to{' '}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {email}
                  </span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label htmlFor="otp" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                      <KeyRound className="w-5 h-5" />
                    </span>
                    <input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        setOtp(val.substring(0, 6))
                      }}
                      placeholder="000000"
                      disabled={loading}
                      className="w-full pl-11 pr-4 py-3.5 bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 dark:focus:border-indigo-400 font-bold tracking-widest text-center text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 placeholder:font-normal transition-all text-xl"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-2.5 items-start p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-2.5 items-start p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
                    >
                      <Loader2 className="w-5 h-5 shrink-0 animate-spin mt-0.5" />
                      <span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-500/20 cursor-pointer disabled:opacity-50 transition-all text-base"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Verify and Connect</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('SEND_EMAIL')
                      setOtp('')
                      setError('')
                      setSuccess('')
                    }}
                    disabled={loading}
                    className="w-full text-center py-2.5 text-sm font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Change Credentials
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
