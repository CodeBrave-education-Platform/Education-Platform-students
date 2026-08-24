'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown, User, LogOut, Loader2, Monitor, Sun, Moon, Search, Grid, BookOpen, Users, Award } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

export default function Navbar({ user: initialUser, profile: initialProfile }) {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [currentUser, setCurrentUser] = useState(initialUser || null)
  const [currentProfile, setCurrentProfile] = useState(initialProfile || null)
  const [mounted, setMounted] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isExploreOpen, setIsExploreOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const dropdownRef = useRef(null)
  const exploreRef = useRef(null)

  // Toggle state
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen)
  const toggleExplore = () => setIsExploreOpen(!isExploreOpen)

  // Hydration safety & auth resolution
  useEffect(() => {
    setMounted(true)

    if (initialUser) {
      setCurrentUser(initialUser)
      setCurrentProfile(initialProfile || null)
    } else {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          setCurrentUser(user)
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          if (prof) setCurrentProfile(prof)
        }
      }).catch((err) => {
        console.error('Error resolving session in Navbar:', err)
      })
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user)
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (prof) setCurrentProfile(prof)
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setCurrentProfile(null)
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [initialUser, initialProfile])

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (exploreRef.current && !exploreRef.current.contains(event.target)) {
        setIsExploreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayName = currentProfile?.full_name || currentUser?.email?.split('@')[0] || 'Student'
  const displayRole = currentProfile?.role || 'student'
  const displayInitials = displayName.substring(0, 2).toUpperCase()

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      setCurrentUser(null)
      setCurrentProfile(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      // Force redirect even on error to clear broken states
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
      setIsDropdownOpen(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      router.push(`/dashboard?tab=browse&q=${encodeURIComponent(searchVal)}`)
    }
  }

  return (
    <nav className="sticky top-0 w-full border-b border-zinc-100 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between transition-all duration-300 shadow-sm z-50 select-none">
      
      {/* Left side: Logo & Explore button */}
      <div className="flex items-center gap-4 lg:gap-6">
        <Link href="/" className="flex flex-col items-start group mt-1">
          <Image src="/asentra-logo.png" alt="ASENTRA Logo" width={160} height={48} className="h-10 sm:h-12 w-auto object-contain" />
        </Link>

        {/* Explore Button & Mega-Menu */}
        <div ref={exploreRef} className="relative hidden md:block">
          <button
            onClick={toggleExplore}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-colors shadow-sm select-none"
          >
            <Grid className="w-4 h-4" />
            <span>Explore</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExploreOpen ? 'rotate-180' : ''}`} />
          </button>

          {isExploreOpen && (
            <div className="absolute left-0 mt-2 w-[580px] bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-xl p-6 z-50 grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Col 1: Subjects */}
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-900 dark:text-white animate-pulse" />
                  <span>Subjects</span>
                </h4>
                <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  <li><Link href="/courses" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white transition-colors block">Physics (Mechanics, Optics)</Link></li>
                  <li><Link href="/courses" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white transition-colors block">Chemistry (Organic, Physical)</Link></li>
                  <li><Link href="/courses" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white transition-colors block">Mathematics (Calculus, Vectors)</Link></li>
                  <li><Link href="/courses" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white transition-colors block font-bold text-teal-600">Explore All Courses &rarr;</Link></li>
                </ul>
              </div>

              {/* Col 2: Batches */}
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                  <span>Featured Batches</span>
                </h4>
                <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  <li><Link href="/batches" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white transition-colors block">Apex JEE 2026 Master Cohort</Link></li>
                  <li><Link href="/batches" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white transition-colors block">AIIMS & NEET 2026 Super-Score</Link></li>
                  <li><Link href="/batches" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white transition-colors block">Class 10 Foundation Accelerator</Link></li>
                  <li><Link href="/batches" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white transition-colors block font-bold text-teal-600">All Live Batches &rarr;</Link></li>
                </ul>
              </div>

              {/* Col 3: Assessments */}
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>Test Center</span>
                </h4>
                <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  <li><Link href="/test-series" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white font-bold text-slate-900 dark:text-white transition-colors block">🚀 CBT Test Series Hub</Link></li>
                  <li><Link href="/test-series" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white transition-colors block">All-India Grand Mock Tests</Link></li>
                  <li><Link href="/dashboard?tab=analytics" onClick={() => setIsExploreOpen(false)} className="hover:text-slate-900 dark:text-white transition-colors block font-bold text-teal-600">Performance Analytics &rarr;</Link></li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Direct link to Course Catalog */}
        <Link
          href="/courses"
          className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/80 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 transition shadow-2xs select-none"
        >
          <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Course Catalog</span>
        </Link>

        {/* Direct link to Batches & Cohorts */}
        <Link
          href="/batches"
          className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/80 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 transition shadow-2xs select-none"
        >
          <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Live Batches</span>
        </Link>

        {/* Direct link to Test Series Hub */}
        <Link
          href="/test-series"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/80 rounded-lg text-xs font-bold text-slate-700 dark:text-zinc-300 transition shadow-2xs select-none"
        >
          <Award className="w-4 h-4 text-slate-900 dark:text-white dark:text-blue-400" />
          <span>Test Series Hub</span>
        </Link>

        {/* Direct link to Books & Materials */}
        <Link
          href="/books"
          className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100/80 dark:bg-teal-950/40 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/80 rounded-lg text-xs font-extrabold text-teal-800 dark:text-teal-300 transition shadow-2xs select-none"
        >
          <div className="w-4 h-4 rounded bg-teal-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
            📖
          </div>
          <span>Books & Materials</span>
        </Link>
      </div>

      {/* Middle: Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-md mx-6 relative">
        <input
          type="text"
          placeholder="What do you want to learn today?"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full bg-slate-50 dark:bg-zinc-800 text-xs sm:text-sm pl-4 pr-10 py-2 rounded-full border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-800 dark:text-zinc-200"
        />
        <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:text-white cursor-pointer">
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Right side: Profile and settings */}
      <div className="flex items-center gap-2.5 sm:gap-4 relative">
        {currentUser ? (
          <div ref={dropdownRef} className="relative">
            <button 
              type="button"
              onClick={toggleDropdown}
              className="flex items-center gap-2 sm:gap-3 bg-slate-50 hover:bg-slate-100/80 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/70 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full cursor-pointer select-none transition-all outline-none border-none shadow-sm"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white font-extrabold text-[10px] sm:text-xs shadow-sm shrink-0">
                {displayInitials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight truncate max-w-[120px]">
                  {displayName}
                </p>
                <p className="text-[9px] font-bold text-slate-900 dark:text-white uppercase tracking-widest mt-0.5 leading-none">
                  {displayRole}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl py-2 z-50 border border-zinc-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Account</p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-zinc-300 truncate mt-0.5">{currentUser.email}</p>
                </div>
                <Link
                  href="/dashboard?tab=profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer transition-colors border-none bg-transparent"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile Info</span>
                </Link>

                {/* Theme togglers inline */}
                <div className="flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-800 mt-1.5 pt-2">
                  <span>Theme Mode</span>
                  <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg">
                    <button 
                      onClick={() => setTheme('light')} 
                      className={`p-1.5 rounded-md cursor-pointer ${mounted && theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                      aria-label="Light mode"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setTheme('dark')} 
                      className={`p-1.5 rounded-md cursor-pointer ${mounted && theme === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'text-slate-400'}`}
                      aria-label="Dark mode"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors border-none bg-transparent disabled:opacity-50"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  ) : (
                    <LogOut className="w-4 h-4 text-rose-500" />
                  )}
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Guest Theme Toggler */}
            <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
              <button 
                onClick={() => setTheme('light')} 
                className={`p-1.5 rounded-md cursor-pointer transition ${mounted && theme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                aria-label="Light mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setTheme('dark')} 
                className={`p-1.5 rounded-md cursor-pointer transition ${mounted && theme === 'dark' ? 'bg-zinc-700 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
                aria-label="Dark mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Guest Sign In Button */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black rounded-lg text-xs sm:text-sm font-bold transition-all shadow-sm select-none cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
