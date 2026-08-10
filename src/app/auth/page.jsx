'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import AuthForm from '@/components/auth/AuthForm'
import AuthVisual from '@/components/auth/AuthVisual'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()

  // Unified authentication state variables (Parent level for state retention)
  const [authMode, setAuthMode] = useState('signin') // 'signin' | 'register'
  const [step, setStep] = useState('SEND_EMAIL') // 'SEND_EMAIL' | 'VERIFY_OTP'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('') // Indian Mobile Number (10 digits)
  const [role, setRole] = useState('student') // 'student' | 'teacher'
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  
  // Cache the password to set it post-OTP confirmation during signup
  const [cachedPassword, setCachedPassword] = useState('')

  // UI loading, success, and error feedback states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shakeCount, setShakeCount] = useState(0)

  // Track focused form input to drive interactive animations on Right-Side Visual
  const [focusedInput, setFocusedInput] = useState(null) // 'email' | 'password' | 'fullName' | 'phone' | null

  useEffect(() => {
    document.title = "ASENTRA | Authentication"
    
    // Proactively read active queries to pre-select correct tab mode
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'register') {
        setAuthMode('register')
      }
    }
  }, [])

  // Framer Motion card shaking on credential error
  const cardVariants = {
    idle: { scale: 1 },
    shake: {
      x: [0, -10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5, ease: 'easeInOut' }
    }
  }

  // Graceful Supabase authentication errors formatter with visual developer tips
  const handleAuthError = (err) => {
    console.error("Auth Error Details:", err)
    const msg = err.message || 'Failed to complete authentication step.'
    
    if (msg.toLowerCase().includes('confirmation email') || msg.toLowerCase().includes('smtp') || msg.toLowerCase().includes('rate limit')) {
      setError(
        <div className="space-y-1.5 text-left leading-normal">
          <p className="font-extrabold text-[11px] text-rose-600">Error sending confirmation email (Supabase SMTP limits)</p>
          <p className="text-[10px] text-rose-500 font-normal leading-relaxed">
            The default Supabase email provider is rate-limited (3 signups/hour) or Resend SMTP credentials aren't initialized yet.
          </p>
          <p className="text-[10px] text-slate-800 font-bold mt-1.5">
            💡 Immediate Testing Solution:
          </p>
          <ul className="list-disc pl-4 text-[9.5px] text-slate-600 space-y-0.5 font-semibold">
            <li>Go to <strong>Supabase Dashboard</strong> &rarr; <strong>Authentication</strong> &rarr; <strong>Providers</strong> &rarr; <strong>Email</strong>.</li>
            <li>Turn <strong>Confirm Email</strong> to <strong>OFF</strong>.</li>
            <li>This confirms all signups instantly, completely bypassing SMTP requirements!</li>
          </ul>
        </div>
      )
    } else {
      setError(msg)
    }
    setShakeCount(prev => prev + 1)
  }

  // Main Submit Handler for Credentials
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (authMode === 'register') {
        const cleanPhone = phone.trim()
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.')
        }
        if (cleanPhone.length !== 10) {
          throw new Error('Please enter a valid 10-digit mobile number.')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }

        // Cache the password for setting post-verification
        setCachedPassword(password)

        // Send OTP confirmation to verify email address
        const { error: signUpError } = await supabase.auth.signInWithOtp({
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

        if (signUpError) throw signUpError

        setSuccess('Verification code sent to your email!')
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
          // Fallback to password-less OTP verification if password fails
          console.log("Password check failed, sending fallback OTP:", loginError.message)
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false }
          })
          if (otpError) throw loginError

          setSuccess('Verification code sent to email! (Incorrect password fallback)')
          setTimeout(() => {
            setStep('VERIFY_OTP')
            setSuccess('')
          }, 800)
          setSuccess('Successfully authenticated! Redirecting...')
          setTimeout(() => {
            const params = new URLSearchParams(window.location.search)
            const next = params.get('next') || '/dashboard'
            window.location.href = next
          }, 1000)
        }
      }
    } catch (err) {
      handleAuthError(err)
    } finally {
      setLoading(false)
    }
  }

  // OTP Verification Submission
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

      if (authMode === 'register') {
        setSuccess('Email verified! Updating password...')
        
        // Finalize account creation by saving the cached password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: cachedPassword
        })

        if (passwordError) throw passwordError

        setSuccess('Account set up complete! Accessing dashboard...')
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search)
          const next = params.get('next') || '/dashboard'
          window.location.href = next
        }, 1000)
      } else {
        setSuccess('Successfully authenticated! Accessing portal...')
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search)
          const next = params.get('next') || '/dashboard'
          window.location.href = next
        }, 1000)
      }
    } catch (err) {
      handleAuthError(err)
    } finally {
      setLoading(false)
    }
  }

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (oauthError) throw oauthError
    } catch (err) {
      handleAuthError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] bg-slate-100 flex items-center justify-center p-4 sm:p-8 font-sans select-none relative overflow-x-hidden">
      
      {/* Decorative clean geometry */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full border border-slate-200/40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full border border-slate-200/40 pointer-events-none" />

      {/* Grid container with shake interaction */}
      <motion.div
        key="auth-canvas"
        animate={shakeCount > 0 ? 'shake' : 'idle'}
        variants={cardVariants}
        className="max-w-5xl w-full bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10 min-h-[600px]"
      >
        
        {/* Left Column: Functional inputs and toggles */}
        <AuthForm
          authMode={authMode}
          setAuthMode={setAuthMode}
          step={step}
          setStep={setStep}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          fullName={fullName}
          setFullName={setFullName}
          phone={phone}
          setPhone={setPhone}
          role={role}
          setRole={setRole}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          otp={otp}
          setOtp={setOtp}
          loading={loading}
          error={error}
          success={success}
          setError={setError}
          setSuccess={setSuccess}
          onSubmit={handleAuthSubmit}
          onVerifyOtp={handleVerifyOtp}
          onGoogleLogin={handleGoogleLogin}
          focusedInput={focusedInput}
          setFocusedInput={setFocusedInput}
        />

        {/* Right Column: Sleek academic engineering visualizer */}
        <AuthVisual focusedInput={focusedInput} />

      </motion.div>
    </main>
  )
}
