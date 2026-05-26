'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Sun, Moon, Mail, Phone, Lock, Eye, EyeOff, KeyRound, Loader2, ArrowRight, AlertCircle, ShieldAlert, User } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Document Title update
  useEffect(() => {
    document.title = "Asentra | Login"
    setMounted(true)
  }, [])

  // Auth Modes
  const [authMode, setAuthMode] = useState('LOGIN') // 'LOGIN' | 'SIGNUP'
  const [step, setStep] = useState('SEND_EMAIL') // 'SEND_EMAIL' | 'VERIFY_OTP' | 'SET_PASSWORD'

  // Input states
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('') // Indian Mobile Number (10 digits)
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student') // 'student' | 'teacher'
  const [password, setPassword] = useState('') // Used in Direct Password Log In
  const [newPassword, setNewPassword] = useState('') // Used in Post-OTP Password Set
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')

  // UI state variables
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shakeCount, setShakeCount] = useState(0)

  // Framer Motion Shake Animation Variants
  const cardVariants = {
    idle: { scale: 1 },
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5, ease: 'easeInOut' }
    }
  }

  // Step 1: Request OTP or Log In
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    
    if (!email) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate environment variables
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        throw new Error("Missing Supabase Environment Variables.");
      }

      if (authMode === 'SIGNUP') {
        const cleanPhone = phone.trim()
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.')
        }
        if (cleanPhone.length !== 10) {
          throw new Error('Please enter a valid 10-digit Indian mobile number.')
        }

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

        if (otpError) {
          throw otpError
        }

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
      console.error("Auth Error:", err);
      let userFriendlyMessage = err.message || 'Failed to authenticate.';
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        userFriendlyMessage = "Network connection failed. Please ensure the Supabase service is online and accessible.";
      }
      setError(userFriendlyMessage);
      setShakeCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: OTP Verification logic
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

      if (verifyError) {
        throw verifyError
      }

      // Successful verification path
      if (authMode === 'SIGNUP') {
        setSuccess('Email verified successfully! Let\'s set your password.')
        setTimeout(() => {
          setStep('SET_PASSWORD')
          setSuccess('')
        }, 1000)
      } else {
        setSuccess('Successfully verified! Redirecting...')
        setTimeout(() => {
          router.push('/dashboard')
        }, 1200)
      }
    } catch (err) {
      console.error("Verification Error:", err);
      let userFriendlyMessage = err.message || 'Invalid or expired verification code.';
      setError(userFriendlyMessage);
      setShakeCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Post-OTP Password Set logic
  const handleSetPassword = async (e) => {
    e.preventDefault()
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      setShakeCount(prev => prev + 1)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.')
      setShakeCount(prev => prev + 1)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (passwordError) {
        throw passwordError
      }

      setSuccess('Password configured successfully! Accessing portal...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    } catch (err) {
      console.error("Password Configuration Error:", err);
      setError(err.message || 'Failed to update password. Please try again.');
      setShakeCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // Social Login: Google OAuth
  const handleGoogleLogin = async () => {
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

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (oauthError) {
        throw oauthError
      }
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError(err.message || 'Failed to initiate Google sign-in.');
      setShakeCount(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FAF6F2] via-[#F6ECE2] to-[#FAF6F2] dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 font-sans transition-colors duration-300">
      
      {/* Dynamic Shifting accent circles */}
      <div className="absolute top-[10%] left-[10%] w-[35rem] h-[35rem] rounded-full bg-[#F3D7C4]/15 dark:bg-indigo-950/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[30rem] h-[30rem] rounded-full bg-[#E8C8B5]/15 dark:bg-purple-950/10 blur-[120px] pointer-events-none" />

      {/* Main Container Card */}
      <motion.div
        key="auth-card"
        animate={shakeCount > 0 ? 'shake' : 'idle'}
        variants={cardVariants}
        whileHover={{ 
          y: -4, 
          boxShadow: "0 30px 60px -15px rgba(92, 63, 47, 0.1), 0 0 50px -10px rgba(246, 229, 216, 0.3)"
        }}
        className="z-10 w-full max-w-4xl mx-4 rounded-[2.5rem] bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/60 dark:border-zinc-800/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 p-6 md:p-8 justify-between items-center transition-all duration-300"
      >
        {/* Left Side Panel (Form controls) */}
        <div className="w-full md:w-[50%] flex flex-col justify-between min-h-[460px] relative z-10 px-2">
          
          {/* Header Row: Brand and Theme Toggler */}
          <div className="flex justify-between items-center mb-6">
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-[#5C3F2F] to-[#B37E5F] dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
              Asentra
            </span>
            
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 bg-[#FAF6F2]/60 dark:bg-zinc-900/60 backdrop-blur-md text-[#5C3F2F] dark:text-zinc-200 cursor-pointer shadow-sm hover:bg-white/60 dark:hover:bg-zinc-900/60 transition-colors"
                aria-label="Toggle Theme"
              >
                {resolvedTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: SEND_EMAIL state */}
            {step === 'SEND_EMAIL' && (
              <motion.div
                key="step-send-email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center"
              >
                {/* Tab Selector: Login vs Sign Up */}
                <div className="flex bg-zinc-200/50 dark:bg-zinc-950/50 p-1 rounded-2xl mb-6 relative">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('LOGIN')
                      setError('')
                      setSuccess('')
                    }}
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      authMode === 'LOGIN'
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-md'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850'
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
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      authMode === 'SIGNUP'
                        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-md'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850'
                    }`}
                  >
                    Register
                  </button>
                </div>

                <div className="mb-6">
                  <h2 className="text-3xl font-black text-[#3A251B] dark:text-zinc-100 tracking-tight">
                    Welcome Back!!
                  </h2>
                  <p className="text-xs font-semibold text-[#8C766C] dark:text-zinc-400 mt-1">
                    {authMode === 'LOGIN' ? 'Sign in to access your portal' : 'Enter your email and mobile to register'}
                  </p>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-[#8C766C] dark:text-zinc-400 mb-1.5 ml-3">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                        <Mail className="w-4.5 h-4.5" />
                      </span>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@gmail.com"
                        disabled={loading}
                        className="w-full pl-11 pr-4 py-3 bg-[#FAF6F2]/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E8C8B5]/50 focus:border-[#E8C8B5] font-medium text-[#3A251B] dark:text-zinc-100 placeholder:text-zinc-400 transition-all text-sm shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Full Name Field (Only in SIGNUP Mode) */}
                  {authMode === 'SIGNUP' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label htmlFor="fullname" className="block text-[10px] font-bold uppercase tracking-wider text-[#8C766C] dark:text-zinc-400 mb-1.5 ml-3">
                        Full Name
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                          <User className="w-4.5 h-4.5" />
                        </span>
                        <input
                          id="fullname"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          disabled={loading}
                          className="w-full pl-11 pr-4 py-3 bg-[#FAF6F2]/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E8C8B5]/50 focus:border-[#E8C8B5] font-medium text-[#3A251B] dark:text-zinc-100 placeholder:text-zinc-400 transition-all text-sm shadow-inner"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Role Selector (Only in SIGNUP Mode) */}
                  {authMode === 'SIGNUP' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8C766C] dark:text-zinc-400 mb-1.5 ml-3">
                        Choose Your Role
                      </label>
                      <div className="flex bg-[#FAF6F2]/60 dark:bg-zinc-950/60 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-800 shadow-inner">
                        <button
                          type="button"
                          onClick={() => setRole('student')}
                          className={`flex-1 text-center py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                            role === 'student'
                              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-md'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-[#5C3F2F] dark:hover:text-zinc-200'
                          }`}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('teacher')}
                          className={`flex-1 text-center py-2.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                            role === 'teacher'
                              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-md'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-[#5C3F2F] dark:hover:text-zinc-200'
                          }`}
                        >
                          Instructor
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Phone Field (Only in SIGNUP Mode) */}
                  {authMode === 'SIGNUP' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label htmlFor="phone" className="block text-[10px] font-bold uppercase tracking-wider text-[#8C766C] dark:text-zinc-400 mb-1.5 ml-3">
                        Indian Mobile Number
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                          <Phone className="w-4.5 h-4.5" />
                        </span>
                        <div className="absolute left-11 flex items-center text-[#5C3F2F] dark:text-zinc-400 font-extrabold border-r border-zinc-200 dark:border-zinc-800 pr-2 h-5 select-none text-xs">
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
                          className="w-full pl-20 pr-4 py-3 bg-[#FAF6F2]/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E8C8B5]/50 focus:border-[#E8C8B5] font-semibold tracking-wider text-[#3A251B] dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-normal placeholder:tracking-normal transition-all text-sm shadow-inner"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Password Field (Only in LOGIN Mode - Signup handles password post-OTP!) */}
                  {authMode === 'LOGIN' && (
                    <div>
                      <label htmlFor="pass" className="block text-[10px] font-bold uppercase tracking-wider text-[#8C766C] dark:text-zinc-400 mb-1.5 ml-3">
                        Password
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                          <Lock className="w-4.5 h-4.5" />
                        </span>
                        <input
                          id="pass"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          disabled={loading}
                          className="w-full pl-11 pr-11 py-3 bg-[#FAF6F2]/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E8C8B5]/50 focus:border-[#E8C8B5] font-medium text-[#3A251B] dark:text-zinc-100 placeholder:text-zinc-400 transition-all text-sm shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Forgot Password Link (Only in LOGIN Mode) */}
                  {authMode === 'LOGIN' && (
                    <div className="text-right">
                      <a href="#" className="text-xs font-bold text-[#8C766C] hover:text-[#5C3F2F] dark:hover:text-zinc-200 transition-colors">
                        Forgot Password?
                      </a>
                    </div>
                  )}

                  {/* Errors and Warnings */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 items-start p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium"
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
                        className="flex gap-2 items-start p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
                      >
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin mt-0.5" />
                        <span>{success}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button with Dynamic contrasted text in Dark Mode */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3.5 bg-gradient-to-r from-[#F6E5D8] via-[#FAF0E6] to-[#F6E5D8] hover:from-[#F3D7C4] hover:to-[#F3D7C4] text-[#5C3F2F] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 dark:text-white dark:hover:from-indigo-700 dark:hover:to-pink-700 dark:border-transparent dark:shadow-indigo-500/20 font-extrabold rounded-full cursor-pointer disabled:opacity-50 transition-all text-sm tracking-wide shadow-md shadow-[#E8C8B5]/10 border border-[#FAF6F2]/60"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span>{authMode === 'LOGIN' ? 'Login' : 'Send Code'}</span>
                    )}
                  </motion.button>
                </form>

                {/* Divider - or - */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 border-t border-zinc-200/50 dark:border-zinc-800/50" />
                  <span className="text-[10px] font-bold text-[#8C766C] dark:text-zinc-500 uppercase tracking-widest">- or -</span>
                  <div className="flex-1 border-t border-zinc-200/50 dark:border-zinc-800/50" />
                </div>

                {/* Social Login Buttons (Google-Only) */}
                <div className="flex justify-center mb-6">
                  {/* Google */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-full border border-zinc-200/60 dark:border-zinc-800 bg-[#FAF6F2]/40 dark:bg-zinc-950/40 text-xs font-bold text-[#5C3F2F] dark:text-zinc-200 cursor-pointer hover:bg-white dark:hover:bg-zinc-900 transition-colors shadow-sm select-none disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.62 15.02 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.96 3.07C6.42 7.51 9 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z" />
                      <path fill="#FBBC05" d="M5.46 10.57c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.5 2.92C.54 4.84 0 7.02 0 9.28s.54 4.44 1.5 6.36l3.96-3.07z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.03.69-2.35 1.1-4.23 1.1-3 0-5.58-2.47-6.54-5.53L1.5 15.84C3.39 20.35 7.35 23 12 23z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </motion.button>
                </div>

                {/* Switcher trigger */}
                <div className="text-center">
                  <p className="text-xs font-semibold text-[#8C766C] dark:text-zinc-400">
                    {authMode === 'LOGIN' ? "Don't have an account? " : "Already have an account? "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')
                        setError('')
                        setSuccess('')
                      }}
                      className="text-[#B37E5F] dark:text-indigo-400 hover:text-[#5C3F2F] font-bold cursor-pointer transition-colors hover:underline"
                    >
                      {authMode === 'LOGIN' ? 'Sign up' : 'Sign in'}
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: VERIFY_OTP state */}
            {step === 'VERIFY_OTP' && (
              <motion.div
                key="step-verify-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center"
              >
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 rounded-full bg-[#FAF6F2] dark:bg-zinc-800 text-[#5C3F2F] dark:text-indigo-400 mb-3 shadow-inner">
                    <KeyRound className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black text-[#3A251B] dark:text-zinc-100 tracking-tight">
                    Verify Code
                  </h2>
                  <p className="text-xs font-medium text-[#8C766C] dark:text-zinc-400 mt-1">
                    We've sent a 6-digit confirmation code to <span className="font-bold text-[#5C3F2F] dark:text-indigo-400">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label htmlFor="otp" className="block text-[10px] font-bold uppercase tracking-wider text-[#8C766C] dark:text-zinc-400 mb-1.5 ml-3">
                      Verification Code
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                        <KeyRound className="w-4.5 h-4.5" />
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
                        className="w-full pl-11 pr-4 py-3 bg-[#FAF6F2]/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E8C8B5]/50 focus:border-[#E8C8B5] font-bold tracking-widest text-center text-[#3A251B] dark:text-zinc-100 placeholder:text-zinc-300 placeholder:font-normal placeholder:tracking-normal transition-all text-base shadow-inner"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 items-start p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium"
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
                        className="flex gap-2 items-start p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
                      >
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin mt-0.5" />
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
                      className="w-full flex items-center justify-center py-3.5 bg-gradient-to-r from-[#F6E5D8] via-[#FAF0E6] to-[#F6E5D8] hover:from-[#F3D7C4] hover:to-[#F3D7C4] text-[#5C3F2F] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 dark:text-white dark:hover:from-indigo-700 dark:hover:to-pink-700 dark:border-transparent dark:shadow-indigo-500/20 font-extrabold rounded-full cursor-pointer disabled:opacity-50 transition-all text-sm tracking-wide shadow-md shadow-[#E8C8B5]/10 border border-[#FAF6F2]/60"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Verify and Connect</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
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
                      className="w-full text-center py-2 text-xs font-bold text-[#B37E5F] dark:text-indigo-400 hover:text-[#5C3F2F] transition-colors cursor-pointer"
                    >
                      Change Account details
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Step 3: SET_PASSWORD state */}
            {step === 'SET_PASSWORD' && (
              <motion.div
                key="step-set-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center"
              >
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 rounded-full bg-[#FAF6F2] dark:bg-zinc-800 text-[#5C3F2F] dark:text-indigo-400 mb-3 shadow-inner">
                    <Lock className="w-6 h-6 animate-bounce" />
                  </div>
                  <h2 className="text-2xl font-black text-[#3A251B] dark:text-zinc-100 tracking-tight">
                    Configure Password
                  </h2>
                  <p className="text-xs font-medium text-[#8C766C] dark:text-zinc-400 mt-1">
                    Please configure a secure password for <span className="font-bold text-[#5C3F2F] dark:text-indigo-400">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-4">
                  {/* New Password input */}
                  <div>
                    <label htmlFor="new-pass" className="block text-[10px] font-bold uppercase tracking-wider text-[#8C766C] dark:text-zinc-400 mb-1.5 ml-3">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                        <Lock className="w-4.5 h-4.5" />
                      </span>
                      <input
                        id="new-pass"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Choose at least 6 characters"
                        disabled={loading}
                        className="w-full pl-11 pr-11 py-3 bg-[#FAF6F2]/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E8C8B5]/50 focus:border-[#E8C8B5] font-medium text-[#3A251B] dark:text-zinc-100 placeholder:text-zinc-400 transition-all text-sm shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password input */}
                  <div>
                    <label htmlFor="confirm-pass" className="block text-[10px] font-bold uppercase tracking-wider text-[#8C766C] dark:text-zinc-400 mb-1.5 ml-3">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 dark:text-zinc-500 pointer-events-none">
                        <Lock className="w-4.5 h-4.5" />
                      </span>
                      <input
                        id="confirm-pass"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        disabled={loading}
                        className="w-full pl-11 pr-11 py-3 bg-[#FAF6F2]/40 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E8C8B5]/50 focus:border-[#E8C8B5] font-medium text-[#3A251B] dark:text-zinc-100 placeholder:text-zinc-400 transition-all text-sm shadow-inner"
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 items-start p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium"
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
                        className="flex gap-2 items-start p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
                      >
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin mt-0.5" />
                        <span>{success}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3.5 bg-gradient-to-r from-[#F6E5D8] via-[#FAF0E6] to-[#F6E5D8] hover:from-[#F3D7C4] hover:to-[#F3D7C4] text-[#5C3F2F] dark:bg-gradient-to-r dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 dark:text-white dark:hover:from-indigo-700 dark:hover:to-pink-700 dark:border-transparent dark:shadow-indigo-500/20 font-extrabold rounded-full cursor-pointer disabled:opacity-50 transition-all text-sm tracking-wide shadow-md shadow-[#E8C8B5]/10 border border-[#FAF6F2]/60"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Finish and Register</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Centered Small Quotation bottom footer text */}
          <div className="mt-8 pt-4 border-t border-zinc-200/20 dark:border-zinc-800/20 text-center">
            <span className="text-[10px] font-bold text-[#8C766C]/65 dark:text-zinc-550 uppercase tracking-widest italic select-none">
              'Your future is being created today'
            </span>
          </div>
        </div>

        {/* Right Side Panel (3D illustration rendering with arch background) */}
        <div className="w-full md:w-[46%] h-[460px] rounded-[2rem] bg-[#FCECE0]/55 dark:bg-zinc-950/40 relative overflow-hidden flex items-center justify-center border border-[#FAF6F2]/30 dark:border-zinc-800/30">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-[90%] bg-[#F5D8C3]/50 dark:bg-zinc-900/40 rounded-t-[10rem] border-t border-x border-[#FAF6F2]/30 pointer-events-none" />
          
          <div className="relative z-10 w-[95%] h-[95%] flex items-center justify-center p-4">
            <img 
              src="/auth_illustration.png" 
              alt="Asentra Illustration" 
              className="max-w-full max-h-full object-contain filter drop-shadow-2xl rounded-2xl select-none" 
            />
          </div>
        </div>

      </motion.div>
    </div>
  )
}
