'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, User, LogOut, Loader2, Monitor, Sun, Moon, Search, Grid, BookOpen, Users, Award } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

export default function Navbar({ user, profile }) {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isExploreOpen, setIsExploreOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const dropdownRef = useRef(null)
  const exploreRef = useRef(null)

  // Toggle state
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen)
  const toggleExplore = () => setIsExploreOpen(!isExploreOpen)

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

  if (!user) {
    return null
  }

  const displayName = profile?.full_name || user.email.split('@')[0]
  const displayRole = profile?.role || 'student'
  const displayInitials = displayName.substring(0, 2).toUpperCase()

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
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
          <img src="/asentra-logo.png" alt="ASENTRA Logo" className="h-10 sm:h-12 w-auto object-contain" />
        </Link>

        {/* Explore Button & Mega-Menu */}
        <div ref={exploreRef} className="relative hidden md:block">
          <button
            onClick={toggleExplore}
            className="flex items-center gap-2 bg-[#0056D2] hover:bg-[#00419e] text-white px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-colors shadow-sm select-none"
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
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  <span>Subjects</span>
                </h4>
                <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  <li><Link href="/dashboard?tab=browse&q=Physics" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 transition-colors block">Physics (Mechanics, Optics)</Link></li>
                  <li><Link href="/dashboard?tab=browse&q=Chemistry" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 transition-colors block">Chemistry (Organic, Physical)</Link></li>
                  <li><Link href="/dashboard?tab=browse&q=Mathematics" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 transition-colors block">Mathematics (Calculus, Algebra)</Link></li>
                  <li><Link href="/dashboard?tab=browse&q=Foundation" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 transition-colors block">Foundation Science</Link></li>
                </ul>
              </div>

              {/* Col 2: Batches */}
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Featured Batches</span>
                </h4>
                <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  <li><Link href="/dashboard?tab=batches" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 transition-colors block">JEE Rankers Batch 2026</Link></li>
                  <li><Link href="/dashboard?tab=batches" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 transition-colors block">JEE Advanced Focus Batch</Link></li>
                  <li><Link href="/dashboard?tab=batches" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 transition-colors block">Quick Revision Crash Course</Link></li>
                  <li><Link href="/dashboard?tab=batches" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 transition-colors block">Rankers Cohort A</Link></li>
                </ul>
              </div>

              {/* Col 3: Assessments */}
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-blue-650" />
                  <span>Test Center</span>
                </h4>
                <ul className="space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                  <li><Link href="/test-series" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 font-bold text-blue-600 dark:text-blue-400 transition-colors block">🚀 CBT Test Series Hub</Link></li>
                  <li><Link href="/dashboard?tab=exams" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 transition-colors block">Scheduled Mock Exams</Link></li>
                  <li><Link href="/dashboard?tab=analytics" onClick={() => setIsExploreOpen(false)} className="hover:text-blue-600 transition-colors block">Performance Analytics</Link></li>
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
          <Award className="w-4 h-4 text-blue-600 dark:text-blue-450" />
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
          className="w-full bg-slate-50 dark:bg-zinc-800 text-xs sm:text-sm pl-4 pr-10 py-2 rounded-full border border-slate-200 dark:border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-zinc-200"
        />
        <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer">
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Right side: Profile and settings */}
      <div className="flex items-center gap-3 sm:gap-4 relative">
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
              <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5 leading-none">
                {displayRole}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl py-2 z-50 border border-zinc-100 dark:border-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-850">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Account</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-zinc-250 truncate mt-0.5">{user.email}</p>
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
              <div className="flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-850 mt-1.5 pt-2">
                <span>Theme Mode</span>
                <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg">
                  <button 
                    onClick={() => setTheme('light')} 
                    className={`p-1.5 rounded-md cursor-pointer ${theme === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setTheme('dark')} 
                    className={`p-1.5 rounded-md cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 text-blue-400 shadow-sm' : 'text-slate-400'}`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-850 my-1" />

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
      </div>
    </nav>
  )
}
