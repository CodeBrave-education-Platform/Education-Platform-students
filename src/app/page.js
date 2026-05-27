'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { 
  Mail, Phone, Lock, Eye, EyeOff, KeyRound, Loader2, 
  ArrowRight, AlertCircle, Sparkles, User, CheckCircle2, 
  Sun, Moon, ShieldAlert
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

// Refined ASENTRA Logo component matching original image assets
function AsentraLogo({ className = "w-48" }) {
  const { resolvedTheme } = useTheme()
  const strokeColor = resolvedTheme === 'dark' ? '#F8FAFC' : '#0F172A'

  return (
    <div className={`flex flex-col items-center justify-center ${className} select-none`}>
      {/* Circle Icon Mark */}
      <svg className="w-14 h-14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="42" stroke={strokeColor} strokeWidth="3" className="transition-colors duration-300" />
        <path d="M28 66 L50 28 L72 66" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" />
      </svg>
      
      {/* Lettering Wordmark */}
      <svg className="w-52 h-10 mt-3" viewBox="0 0 250 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Custom drawn geometric letter 'A' */}
        <path d="M12 44 L28 10 L44 44" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" />
        <path d="M20 32 L36 32" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" className="transition-colors duration-300" />
        
        {/* Custom drawn geometric letter 'S' */}
        <path d="M76 16 C76 12, 56 12, 56 18 C56 24, 76 26, 76 32 C76 38, 56 38, 56 34" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" />
        
        {/* Custom drawn geometric letter 'E' */}
        <path d="M110 12 L92 12 L92 42 L110 42" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" />
        <path d="M92 27 L106 27" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" className="transition-colors duration-300" />
        
        {/* Custom drawn geometric letter 'N' */}
        <path d="M122 42 L122 12 L142 42 L142 12" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" />
        
        {/* Custom drawn geometric letter 'T' */}
        <path d="M152 12 L178 12" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" />
        <path d="M165 12 L165 42" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" className="transition-colors duration-300" />
        
        {/* Custom drawn geometric letter 'R' */}
        <path d="M188 42 L188 12 L206 12 C214 12, 214 26, 206 26 L188 26" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" />
        <path d="M198 26 L210 42" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" />
        
        {/* Custom drawn geometric letter 'A' with RED accented leg */}
        <path d="M220 44 L236 10" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" />
        {/* Red accent leg matching logo image */}
        <path d="M236 10 L252 44" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M228 32 L244 32" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" className="transition-colors duration-300" />
      </svg>
      
      {/* Tagline */}
      <div className="text-[8.5px] font-extrabold tracking-[0.25em] text-slate-700 dark:text-slate-300 mt-2 select-none font-sans uppercase">
        IIT JEE Mains <span className="text-red-500">•</span> Advanced <span className="text-red-500">•</span> Foundations
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  // State variables
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('signin') // 'signin' | 'register'
  const [step, setStep] = useState('SEND_EMAIL') // 'SEND_EMAIL' | 'VERIFY_OTP'
  
  // Onboarding forms states
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('') // Indian Mobile Number (10 digits)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student') // 'student' | 'teacher'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  
  // Password cache to allow automatic setting post-OTP verification
  const [cachedPassword, setCachedPassword] = useState('')

  // UI state variables
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shakeCount, setShakeCount] = useState(0)

  useEffect(() => {
    document.title = "Asentra | Portal"
    setMounted(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  // Framer Motion Shake Animation Variants
  const cardVariants = {
    idle: { scale: 1 },
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5, ease: 'easeInOut' }
    }
  }

  // Handle standard credential actions (Step 1)
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Missing Supabase Environment Variables.")
      }

      if (activeTab === 'register') {
        const cleanPhone = phone.trim()
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.')
        }
        if (cleanPhone.length !== 10) {
          throw new Error('Please enter a valid 10-digit Indian mobile number.')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please verify.')
        }

        // Cache the password for post-OTP submission
        setCachedPassword(password)

        // Call signInWithOtp for Register, passing email and name/role/phone metadata (no password here!)
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            data: {
              phone_number: `+91${cleanPhone}`,
              full_name: fullName.trim(),
              role: role
            }
          }
        })

        if (otpError) throw otpError

        setSuccess('Verification code sent successfully to your email!')
        setTimeout(() => {
          setStep('VERIFY_OTP')
          setSuccess('')
        }, 800)
      } else {
        // Sign In Flow (Direct Password Sign In)
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (loginError) {
          // If password login fails, fallback to sending an OTP
          console.log("Password login error, sending OTP instead:", loginError.message)
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false }
          })
          if (otpError) throw loginError

          setSuccess('Code sent to email! (Standard password verification failed)')
          setTimeout(() => {
            setStep('VERIFY_OTP')
            setSuccess('')
          }, 800)
        } else {
          setSuccess('Successfully authenticated! Redirecting...')
          setTimeout(() => {
            router.push('/dashboard')
          }, 1200)
        }
      }
    } catch (err) {
      console.error("Auth Error:", err)
      setError(err.message || 'Failed to authenticate.')
      setShakeCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP Verification Logic (Step 2)
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
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })

      if (verifyError) throw verifyError

      // Successful OTP verification path
      if (activeTab === 'register') {
        setSuccess('Email verified! Finalizing password settings...')
        
        // Auto-configure password post-OTP using cached password state
        const { error: passwordError } = await supabase.auth.updateUser({
          password: cachedPassword
        })

        if (passwordError) throw passwordError

        setSuccess('Account set up completed! Accessing portal...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1200)
      } else {
        setSuccess('Successfully verified! Redirecting...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1200)
      }
    } catch (err) {
      console.error("Verification Error:", err)
      setError(err.message || 'Invalid or expired verification code.')
      setShakeCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth Hook
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Missing Supabase Environment Variables.")
      }

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (oauthError) throw oauthError
    } catch (err) {
      console.error("Google Auth Error:", err)
      setError(err.message || 'Failed to initiate Google sign-in.')
      setShakeCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // 1. Loading Pre-loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 transition-colors duration-300">
        <div className="text-center space-y-4">
          <span className="text-4xl font-extrabold tracking-[0.25em] text-blue-900 dark:text-blue-400 animate-pulse select-none font-sans uppercase">
            ASENTRA
          </span>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">IIT JEE mains &bull; Advanced &bull; Foundations</p>
        </div>
      </div>
    )
  }

  // 2. Main Portal Canvas
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950/40 flex items-center justify-center p-4 sm:p-8 font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Subtle theme toggler at the top right of canvas */}
      {mounted && (
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="absolute top-6 right-6 p-2.5 rounded-full border border-slate-200/50 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md text-slate-700 dark:text-zinc-200 cursor-pointer shadow-sm hover:bg-white dark:hover:bg-zinc-900 transition-colors z-20"
          aria-label="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      )}

      {/* Main Glassmorphic Card Container */}
      <motion.div
        key="auth-glass-card"
        animate={shakeCount > 0 ? 'shake' : 'idle'}
        variants={cardVariants}
        className="w-full max-w-6xl bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-2xl shadow-blue-900/10 dark:shadow-none rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row min-h-[650px] border border-white dark:border-zinc-800 relative z-10 transition-all duration-300"
      >
        
        {/* Left Section: Interactive Forms */}
        <section className="w-full md:w-[45%] p-8 sm:p-12 flex flex-col justify-center relative bg-white/50 dark:bg-zinc-900/40 border-r border-slate-100 dark:border-zinc-850">
          
          {/* Logo Brand Header */}
          <div className="flex justify-start mb-6">
            <AsentraLogo className="w-48 !items-start" />
          </div>

          <AnimatePresence mode="wait">
            {step === 'SEND_EMAIL' ? (
              <motion.div
                key="step-credentials-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Sleek Pill-Shaped Toggle */}
                <div className="flex bg-slate-100 dark:bg-zinc-950 rounded-full p-1 w-full border border-slate-200/40 dark:border-zinc-800 shadow-inner select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin')
                      setError('')
                      setSuccess('')
                    }}
                    className={`flex-1 text-center py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      activeTab === 'signin'
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register')
                      setError('')
                      setSuccess('')
                    }}
                    className={`flex-1 text-center py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                      activeTab === 'register'
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-500 dark:text-zinc-450 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* Subtitle context */}
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-150 tracking-tight">
                    {activeTab === 'signin' ? 'Sign in to access your portal' : 'Join ASENTRA Prep'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {activeTab === 'signin' ? 'Welcome back! Enter credentials' : 'Construct an account for JEE/Foundations'}
                  </p>
                </div>

                {/* Inputs Core Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {/* Full Name (Only for registration) */}
                  {activeTab === 'register' && (
                    <div>
                      <label htmlFor="fullname" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1 ml-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          id="fullname"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Dr. Sarah Jenkins"
                          disabled={loading}
                          className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/55 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 transition-all outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Address */}
                  <div>
                    <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1 ml-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@gmail.com"
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/55 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Indian Mobile Number (Only for registration) */}
                  {activeTab === 'register' && (
                    <div>
                      <label htmlFor="phone" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1 ml-2">
                        Indian Mobile Number
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <Phone className="w-4 h-4" />
                        </span>
                        <div className="absolute left-9 text-slate-500 font-extrabold pr-2 text-xs select-none">
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
                          placeholder="9876543210"
                          disabled={loading}
                          className="w-full pl-16 pr-4 py-2.5 bg-white/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/55 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 tracking-wider transition-all outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Role Selector (Only for registration) */}
                  {activeTab === 'register' && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1 ml-2">
                        Account Role
                      </label>
                      <div className="flex bg-slate-100/60 dark:bg-zinc-950/60 p-1 rounded-xl border border-slate-200/50 dark:border-zinc-800 shadow-inner">
                        <button
                          type="button"
                          onClick={() => setRole('student')}
                          className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            role === 'student'
                              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-450 shadow-sm'
                              : 'text-slate-400 dark:text-zinc-400'
                          }`}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('teacher')}
                          className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            role === 'teacher'
                              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-450 shadow-sm'
                              : 'text-slate-400 dark:text-zinc-400'
                          }`}
                        >
                          Instructor
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Password Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1 select-none">
                      <label htmlFor="pass" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 ml-2">
                        Password
                      </label>
                      {activeTab === 'signin' && (
                        <a href="#" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                          Forgot password?
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="pass"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        className="w-full pl-10 pr-10 py-2.5 bg-white/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/55 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password (Only for registration) */}
                  {activeTab === 'register' && (
                    <div>
                      <label htmlFor="confirmpass" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1 ml-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          id="confirmpass"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={loading}
                          className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/55 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 transition-all outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Error & Success indicators */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 items-start p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 items-start p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-[10px] font-bold"
                      >
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin mt-0.5" />
                        <span>{success}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit CTA */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs tracking-wide cursor-pointer disabled:opacity-50 select-none"
                  >
                    {loading ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <span>{activeTab === 'signin' ? 'Sign In' : 'Register Account'}</span>
                    )}
                  </motion.button>
                </form>

                {/* OR Divider */}
                <div className="flex items-center gap-3 my-4 select-none">
                  <div className="flex-1 border-t border-slate-200/60 dark:border-zinc-800" />
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">OR</span>
                  <div className="flex-1 border-t border-slate-200/60 dark:border-zinc-800" />
                </div>

                {/* Social Login */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 font-medium py-3 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-zinc-900 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer transition-all duration-200 ease-out text-xs disabled:opacity-50 select-none"
                >
                  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15.02 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.96 3.07C6.42 7.51 9 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z" />
                    <path fill="#FBBC05" d="M5.46 10.57c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 2.92C.54 4.84 0 7.02 0 9.28s.54 4.44 1.5 6.36l3.96-3.07z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.35 1.1-4.23 1.1-3 0-5.58-2.47-6.54-5.53L1.5 15.84C3.39 20.35 7.35 23 12 23z" />
                  </svg>
                  <span>Sign in with Google</span>
                </motion.button>
              </motion.div>
            ) : (
              // Step 2: VERIFY_OTP state
              <motion.div
                key="step-otp-verification"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6 flex flex-col justify-center"
              >
                <div className="text-center space-y-2">
                  <div className="inline-flex p-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-inner">
                    <KeyRound className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-150 tracking-tight">Verify Code</h2>
                  <p className="text-xs text-slate-400">
                    We've sent a 6-digit confirmation code to <span className="font-bold text-slate-700 dark:text-zinc-200">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label htmlFor="otp" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 mb-1.5 ml-2">
                      Verification Code
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <KeyRound className="w-4 h-4" />
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
                        className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/55 rounded-xl text-sm font-bold tracking-widest text-center text-slate-800 dark:text-zinc-100 placeholder:text-slate-350 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 items-start p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 items-start p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-[10px] font-bold"
                      >
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin mt-0.5" />
                        <span>{success}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-xs tracking-wide cursor-pointer disabled:opacity-50 select-none"
                    >
                      {loading ? (
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      ) : (
                        <>
                          <span>Verify and Connect</span>
                          <ArrowRight className="w-4 h-4 ml-1.5" />
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
                      className="w-full text-center py-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      Change account details
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </section>

        {/* Right Section: Visual Showcase */}
        <section className="hidden md:flex w-[55%] relative items-center justify-center p-12 bg-gradient-to-bl from-blue-100/50 to-transparent dark:from-zinc-950 dark:to-transparent">
          
          {/* Framed Graphic Frame */}
          <div className="w-full h-full max-w-md rounded-3xl bg-blue-50/50 dark:bg-zinc-900/30 shadow-inner flex flex-col items-center justify-center relative overflow-hidden p-6 border border-white/60 dark:border-zinc-800/40">
            
            {/* Ambient animated blurs inside card */}
            <div className="absolute w-48 h-48 bg-blue-400/10 dark:bg-indigo-950/20 rounded-full blur-2xl top-10 right-10 pointer-events-none" />
            <div className="absolute w-56 h-56 bg-indigo-400/10 dark:bg-purple-950/15 rounded-full blur-3xl bottom-10 left-5 pointer-events-none" />

            {/* Graphics container */}
            <motion.div
              whileHover={{ y: -6 }}
              className="relative z-10 w-full flex flex-col items-center text-center space-y-6 select-none"
            >
              
              {/* Refined Student Laptop 3D mock image mapping */}
              <div className="relative w-72 h-72 flex items-center justify-center">
                {/* Visual Glass floating shadow */}
                <div className="absolute bottom-2 w-48 h-6 bg-blue-900/10 dark:bg-zinc-950/40 rounded-full blur-xl animate-pulse" />
                
                {/* Animated graphic asset display */}
                <img 
                  src="/auth_illustration.png" 
                  alt="Asentra 3D Student Illustration" 
                  className="w-full h-full object-contain relative z-10 drop-shadow-2xl animate-float"
                  style={{ animationDuration: '6s' }}
                  onError={(e) => {
                    // Fail-safe dynamic Vector blueprint drawing in case PNG asset is missing or blocked
                    e.target.style.display = 'none';
                    const fallback = e.target.nextSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />

                {/* Highly premium abstract SVG Classroom Blueprint Fallback */}
                <div className="absolute inset-0 z-0 hidden items-center justify-center text-slate-350 dark:text-zinc-700">
                  <svg className="w-56 h-56 opacity-60" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                    <rect x="50" y="50" width="100" height="100" rx="12" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M50 150 L150 150 M70 120 L130 120 M85 90 L115 90" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M100 20 L100 50 M100 150 L100 180" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                  </svg>
                </div>
              </div>

              {/* Illustration branding tagline */}
              <div className="space-y-2 max-w-xs">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-200 tracking-tight">Your future is being created today</h3>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  Leverage high-fidelity custom lectures, instant tutor rosters, and live curriculum tracking inside a singular portal.
                </p>
              </div>

            </motion.div>

          </div>

        </section>

      </motion.div>
    </main>
  )
}
