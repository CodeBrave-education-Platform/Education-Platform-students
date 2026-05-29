'use client'

import * as React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Phone, ArrowRight, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function AuthForm({
  authMode,
  setAuthMode,
  step,
  setStep,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  phone,
  setPhone,
  role,
  setRole,
  confirmPassword,
  setConfirmPassword,
  otp,
  setOtp,
  loading,
  error,
  success,
  onSubmit,
  onVerifyOtp,
  onGoogleLogin,
  setError,
  setSuccess
}) {
  const [showPassword, setShowPassword] = useState(false)

  // Standard input focus styles
  const inputContainerClass = "w-full flex flex-col gap-1 text-left relative"
  const inputClass = "w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent placeholder:text-slate-400"
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 shrink-0 pointer-events-none"

  return (
    <section className="w-full p-8 sm:p-12 flex flex-col justify-center select-none font-sans bg-white">
      
      {/* Brand Wordmark matching redesigned Landing page Guest Navbar */}
      <div className="flex flex-col items-start gap-2 mb-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
            A
          </div>
          <span className="text-xl font-extrabold tracking-widest text-slate-950 uppercase">
            ASENTRA
          </span>
        </Link>
        <span className="text-[9px] font-extrabold tracking-[0.2em] text-slate-400 uppercase leading-none">
          IIT JEE MAINS • ADVANCED • FOUNDATIONS
        </span>
      </div>

      {/* Header messages */}
      <div className="text-left space-y-2 mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
          {step === 'VERIFY_OTP' 
            ? 'Verify Email Identity' 
            : authMode === 'signin' 
            ? 'Sign In to Portal' 
            : 'Create Student Account'
          }
        </h2>
        <p className="text-slate-500 text-xs font-semibold">
          {step === 'VERIFY_OTP'
            ? `Enter the 6-digit confirmation code sent to ${email}`
            : authMode === 'signin'
            ? 'Access high-fidelity mock environments & metrics'
            : 'Begin India\'s most rigorous academic study route'
          }
        </p>
      </div>

      {/* Verification / Alert Banners */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-5 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-semibold leading-relaxed"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-5 bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Area */}
      {step === 'VERIFY_OTP' ? (
        /* ---------------- STEP 2: VERIFY OTP FORM ---------------- */
        <form onSubmit={onVerifyOtp} className="space-y-5">
          <div className={inputContainerClass}>
            <input
              type="text"
              name="otp"
              required
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                setOtp(val)
              }}
              disabled={loading}
              className="w-full text-center tracking-[0.6em] text-xl font-bold py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent placeholder:tracking-normal placeholder:text-sm placeholder:font-semibold placeholder:text-slate-400"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-teal-600/10 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          <button
            type="button"
            onClick={() => setStep('SEND_EMAIL')}
            disabled={loading}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest cursor-pointer inline-block"
          >
            ← Back to inputs
          </button>
        </form>
      ) : (
        /* ---------------- STEP 1: LOGIN / REGISTER FORMS ---------------- */
        <div className="space-y-6">
          
          {/* Framer Motion Toggle Pill */}
          <div className="bg-slate-100 p-1 rounded-full flex relative select-none w-fit border border-slate-200/50">
            {['signin', 'register'].map((mode) => {
              const isActive = authMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setError('')
                    setSuccess('')
                    setAuthMode(mode)
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider relative cursor-pointer z-10 transition-colors duration-200 ${
                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-white rounded-full shadow-sm z-[-1]"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  {mode === 'signin' ? 'Sign In' : 'Register'}
                </button>
              )
            })}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {authMode === 'register' ? (
                /* ----- REGISTER MODE INPUTS ----- */
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Full name */}
                  <div className={inputContainerClass}>
                    <label className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className={iconClass} />
                      <input
                        type="text"
                        placeholder="Aditya Sharma"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className={inputContainerClass}>
                    <label className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Mobile Number</label>
                    <div className="relative">
                      <Phone className={iconClass} />
                      <input
                        type="tel"
                        placeholder="9876543210"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '')
                          setPhone(val)
                        }}
                        disabled={loading}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className={inputContainerClass}>
                    <label className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className={iconClass} />
                      <input
                        type="email"
                        placeholder="aditya@student.in"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Password & Confirm password side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={inputContainerClass}>
                      <label className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className={iconClass} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className={inputContainerClass}>
                      <label className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Confirm Password</label>
                      <div className="relative">
                        <Lock className={iconClass} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={loading}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role and Toggle show password */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-1">
                    <div className="flex items-center gap-2 self-start">
                      <span className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Default Role:</span>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={loading}
                        className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Instructor</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer self-end"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* ----- SIGN IN MODE INPUTS ----- */
                <motion.div
                  key="signin-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Email */}
                  <div className={inputContainerClass}>
                    <label className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className={iconClass} />
                      <input
                        type="email"
                        placeholder="name@student.in"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className={inputContainerClass}>
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Password</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className={iconClass} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-teal-600/15 hover:shadow-teal-600/20 transition-all inline-flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 select-none mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {authMode === 'signin' ? 'Sign In to Portal' : 'Generate Verification Code'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 py-1 text-slate-300">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Auth Button */}
          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={loading}
            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-sm hover:shadow transition-all disabled:opacity-50 select-none"
          >
            {/* Minimal clean Google SVG icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.8-1.5 2.1l2.33 1.8c1.36-1.25 2.22-3.1 2.22-5.75z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-2.33-1.8c-1.07.72-2.45 1.16-4.1 1.16-3.14 0-5.8-2.11-6.75-4.96L4.35 17.3c2 3.97 6.1 6.7 10.87 6.7z"
              />
              <path
                fill="#FBBC05"
                d="M5.25 15.49c-.25-.72-.39-1.5-.39-2.3 0-.8.14-1.58.39-2.3L2.83 8.78c-1.05 2.1-1.63 4.46-1.63 6.94 0 2.48.58 4.84 1.63 6.94l2.42-2.17z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.23 0 3.13 2.73 1.13 6.7l3.27 2.54c.95-2.85 3.6-4.96 6.75-4.96z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      )}

    </section>
  )
}
