'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, Plus, Search, GraduationCap, LayoutDashboard, 
  Users, CheckCircle2, Award, Calendar, BookOpenCheck, ArrowRight, 
  Info, Loader2, Sparkles, User, Mail, Phone, ShieldAlert,
  ArrowUpRight, AlertCircle, FileText, Clock, ChevronLeft, ChevronRight, Menu, ArrowLeft, HeartPulse
} from 'lucide-react'

export default function ProfileClient({ user, profile }) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  // Profile data states (dynamic sync)
  const [profileName, setProfileName] = useState(profile.full_name || '')
  const [profilePhone, setProfilePhone] = useState(profile.phone || '')
  const [targetYear, setTargetYear] = useState(profile.target_year || '')
  const [academicBatch, setAcademicBatch] = useState(profile.academic_batch || '')
  const [preferredSubject, setPreferredSubject] = useState(profile.preferred_subject || '')
  
  // Original Metrics
  const [dailyStudyHours, setDailyStudyHours] = useState(profile.daily_study_hours || '8 Hours')
  const [syllabusProgress, setSyllabusProgress] = useState(profile.syllabus_progress || '45%')
  const [testAverage, setTestAverage] = useState(profile.test_average || '82%')
  const [academicStrengths, setAcademicStrengths] = useState(profile.academic_strengths || 'Physics & Calculus')
  
  // NEW Metrics
  const [weeklyTestsAttempted, setWeeklyTestsAttempted] = useState(profile.weekly_tests_attempted || '3 tests/week')
  const [dreamCollege, setDreamCollege] = useState(profile.dream_college || 'IIT Bombay (Computer Science)')
  const [studyHoursSlept, setStudyHoursSlept] = useState(profile.study_hours_slept || '7 Hours')
  const [studyMentor, setStudyMentor] = useState(profile.study_mentor || 'Dr. R. V. Sharma (IIT Delhi Alumnus)')

  // Form loading states
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Mobile navigation drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isTeacher = profile.role === 'teacher'
  const displayName = profileName || user.email?.split('@')[0] || 'Student'
  const displayPhone = profilePhone || 'Not Provided'
  const displayRole = isTeacher ? 'Instructor' : 'Student'
  const displayInitials = displayName.substring(0, 2).toUpperCase()

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!profileName.trim()) {
      setProfileError('Full Name is required.')
      return
    }

    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileName.trim(),
          phone: profilePhone.trim(),
          target_year: targetYear.trim(),
          academic_batch: academicBatch.trim(),
          preferred_subject: preferredSubject.trim(),
          daily_study_hours: dailyStudyHours.trim(),
          syllabus_progress: syllabusProgress.trim(),
          test_average: testAverage.trim(),
          academic_strengths: academicStrengths.trim(),
          weekly_tests_attempted: weeklyTestsAttempted.trim(),
          dream_college: dreamCollege.trim(),
          study_hours_slept: studyHoursSlept.trim(),
          study_mentor: studyMentor.trim()
        })
        .eq('id', user.id)

      if (error) throw error

      setProfileSuccess('Academic Profile successfully updated!')
      
      startTransition(() => {
        router.refresh()
      })

      setTimeout(() => {
        setProfileSuccess('')
      }, 3000)
    } catch (err) {
      console.error('Profile Update Error:', err)
      setProfileError(err.message || 'Failed to update profile details.')
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] w-full bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      
      {/* Premium accent glows */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-500/5 dark:bg-indigo-950/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-indigo-500/5 dark:bg-zinc-950/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 flex min-h-[100dvh] pt-0 pb-12 gap-6 w-full max-w-none px-0 pr-4 md:pr-6">
        
        {/* Sidebar Nav (Unified Shell UI) */}
        <aside className="w-24 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-900/60 hidden md:flex flex-col gap-6 justify-between py-6 px-2 shrink-0 h-[calc(100dvh-62px)] sticky top-[62px] z-40">
          <div className="space-y-6">
            <nav className="space-y-4">
              {isTeacher ? (
                <>
                  <button 
                    onClick={() => router.push('/dashboard?tab=courses')}
                    className="w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium tactile-press"
                  >
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Courses</span>
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard?tab=roster')}
                    className="w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium tactile-press"
                  >
                    <Users className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Roster</span>
                  </button>
                  <button 
                    className="w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold tactile-press"
                  >
                    <User className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => router.push('/dashboard?tab=learning')}
                    className="w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium tactile-press"
                  >
                    <BookOpenCheck className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Learning</span>
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard?tab=browse')}
                    className="w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium tactile-press"
                  >
                    <Search className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Browse</span>
                  </button>
                  <button 
                    className="w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold tactile-press"
                  >
                    <User className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard?tab=invoices')}
                    className="w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium tactile-press"
                  >
                    <FileText className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Invoices</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </aside>

        {/* Unified Main Area */}
        <main className="flex-1 flex flex-col overflow-x-hidden bg-white/30 dark:bg-zinc-900/30 rounded-[2rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-500 ease-in-out my-2 mx-2 md:my-6 md:mr-6 pb-20 md:pb-6">
          
          <header className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md flex justify-between items-center">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 mr-3 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 cursor-pointer select-none transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                  Academic Profile Info
                </h1>
                <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                  View and manage your academic parameters &middot; Persisted securely
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-slate-800 dark:text-zinc-200 font-extrabold text-xs rounded-full border border-transparent shadow-sm cursor-pointer select-none transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </motion.button>
          </header>

          <div className="flex-1 p-6 md:p-8 space-y-8 w-full max-w-none">
            
            {/* Header Identity Card */}
            <div className="bg-white/60 backdrop-blur-xl shadow-md shadow-zinc-100/50 dark:bg-zinc-900/60 dark:shadow-none rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 transition-all duration-300">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0 select-none">
                {displayInitials}
              </div>
              <div className="space-y-2 text-center md:text-left flex-1">
                <div className="flex flex-col sm:flex-row items-center gap-2.5 justify-center md:justify-start">
                  <h4 className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100">{displayName}</h4>
                  <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider select-none shadow-sm">
                    Verified {displayRole} Account
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-slate-500 dark:text-zinc-400 font-semibold justify-center md:justify-start">
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{displayPhone}</span>
                  </div>
                </div>

                {/* Display extra student academic parameters */}
                {(targetYear || academicBatch || preferredSubject) && (
                  <div className="flex flex-wrap gap-2 text-[9px] font-bold text-blue-600 dark:text-indigo-400 pt-3 border-t border-slate-100 dark:border-zinc-800/80 mt-3 justify-center md:justify-start">
                    {targetYear && (
                      <span className="bg-blue-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-blue-100/20">Target: IIT JEE {targetYear}</span>
                    )}
                    {academicBatch && (
                      <span className="bg-blue-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-blue-100/20">Batch: {academicBatch}</span>
                    )}
                    {preferredSubject && (
                      <span className="bg-blue-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-blue-100/20">Focus: {preferredSubject}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Performance Indicators Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Academic Profile Indicators</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Daily Study Target', value: dailyStudyHours, desc: 'Hours logged per day', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400', icon: Clock },
                  { label: 'Syllabus Covered', value: syllabusProgress, desc: 'Core curricula completion', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400', icon: BookOpenCheck },
                  { label: 'Practice Assessment Avg', value: testAverage, desc: 'Average mock test score', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400', icon: Award },
                  { label: 'Academic Strength', value: academicStrengths, desc: 'Top performing area', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400', icon: Sparkles },
                  { label: 'Practice Tests Attempted', value: weeklyTestsAttempted, desc: 'Assessments per week', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400', icon: CheckCircle2 },
                  { label: 'Target College', value: dreamCollege, desc: 'Your dream engineering goal', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/20 dark:text-sky-400', icon: GraduationCap },
                  { label: 'Sleep & Wellness', value: studyHoursSlept, desc: 'Optimal brain rest status', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400', icon: HeartPulse },
                  { label: 'Educational Mentor', value: studyMentor, desc: 'Assigned platform advisor', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/20 dark:text-teal-400', icon: Users }
                ].map((item, index) => {
                  const IconComponent = item.icon
                  return (
                    <motion.div 
                      key={index}
                      whileHover={{ y: -2 }}
                      className="p-5 rounded-3xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm border border-zinc-200/40 dark:border-zinc-800/20 flex flex-col justify-between min-h-[125px] transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{item.label}</span>
                        <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-base font-black text-slate-800 dark:text-zinc-100 leading-snug line-clamp-1">{item.value}</p>
                        <p className="text-[9px] font-semibold text-zinc-400 mt-1 leading-none">{item.desc}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Syllabus Coverage & IIT JEE Roadmap Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Progress visualizer */}
              <div className="p-6 rounded-[2rem] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm border border-zinc-200/40 dark:border-zinc-800/20 space-y-6">
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">Syllabus Completion & Stats</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">Real-time indicators updated from personal dashboard progress.</p>
                </div>
                
                {/* Syllabus Coverage Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                    <span>Syllabus Progress Indicator</span>
                    <span className="text-blue-600">{syllabusProgress}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: syllabusProgress.includes('%') ? syllabusProgress : `${syllabusProgress}%` }}
                    />
                  </div>
                </div>

                {/* Test Average Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                    <span>Mock Assessment Average Score</span>
                    <span className="text-emerald-600">{testAverage}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: testAverage.includes('%') ? testAverage : `${testAverage}%` }}
                    />
                  </div>
                </div>

                {/* Checklist items */}
                <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span>Kinematics & Fluids (Done)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span>Algebra & Limits (Done)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    <span>Calculus & Derivatives (Active)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                    <span>Organic Compounds (Revision)</span>
                  </div>
                </div>
              </div>

              {/* Prep Roadmap Timeline */}
              <div className="p-6 rounded-[2rem] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm border border-zinc-200/40 dark:border-zinc-800/20 space-y-4">
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">Personalized IIT JEE Prep Journey</h4>
                  <p className="text-[10px] text-zinc-400 mt-1">Syllabus progression stages based on target stream goals.</p>
                </div>

                <div className="space-y-3.5 relative pl-4 border-l border-zinc-200 dark:border-zinc-800 mt-2">
                  {[
                    { title: 'Stage 1: Foundation Phase', desc: 'Core formulas, equations, and basic vectors.', status: 'COMPLETED', color: 'bg-emerald-500 text-emerald-100 border-emerald-500' },
                    { title: 'Stage 2: Mains Preparation', desc: 'Mock tests, test ledgers, and exercises.', status: 'ACTIVE PREP', color: 'bg-blue-600 text-blue-100 border-blue-600 animate-pulse' },
                    { title: 'Stage 3: Advanced Curriculums', desc: 'Multi-concept modules and IIT PYQs.', status: 'LOCKED', color: 'bg-slate-200 dark:bg-zinc-800 text-zinc-400 border-transparent' }
                  ].map((stage, idx) => (
                    <div key={idx} className="relative space-y-1">
                      <span className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 ${stage.color}`} />
                      <div className="flex justify-between items-center">
                        <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{stage.title}</h5>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          stage.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : stage.status === 'ACTIVE PREP' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                        }`}>{stage.status}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal">{stage.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Profile Updating Form Card */}
            <div className="bg-white/60 backdrop-blur-xl shadow-sm dark:bg-zinc-900/60 rounded-[2rem] p-8 space-y-6 transition-all duration-300">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-zinc-300">Update Academic Profile Details</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 font-semibold leading-relaxed">
                  Modify your display name, stream focus, and contact details. Updated parameters will synchronize seamlessly across your profile cards and metrics in real-time.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-4xl">
                
                {/* 1. Personal & Contact */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-indigo-400 ml-1">Personal Identity</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Full Name</label>
                      <input 
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Indian Phone Number</label>
                      <input 
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="Enter 10 digit number"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Stream Focus */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-indigo-400 ml-1">Stream / Focus Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Target JEE Year</label>
                      <input 
                        type="text"
                        value={targetYear}
                        onChange={(e) => setTargetYear(e.target.value)}
                        placeholder="e.g. 2027"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Prep Batch / Stream</label>
                      <select 
                        value={academicBatch}
                        onChange={(e) => setAcademicBatch(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      >
                        <option value="">Select Stream</option>
                        <option value="11th Standard Foundation">11th Standard Foundation</option>
                        <option value="12th Standard Mains">12th Standard Mains</option>
                        <option value="Dropper Elite JEE Track">Dropper Elite JEE Track</option>
                        <option value="Instructor / Faculty">Instructor / Faculty</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Preferred Subject Focus</label>
                      <select 
                        value={preferredSubject}
                        onChange={(e) => setPreferredSubject(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      >
                        <option value="">Select Subject</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Full PCM Syllabus">Full PCM Syllabus</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Original performance metrics */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-indigo-400 ml-1">Performance Indicators</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Daily Study hours</label>
                      <input 
                        type="text"
                        value={dailyStudyHours}
                        onChange={(e) => setDailyStudyHours(e.target.value)}
                        placeholder="e.g. 8 Hours"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Syllabus Progress %</label>
                      <input 
                        type="text"
                        value={syllabusProgress}
                        onChange={(e) => setSyllabusProgress(e.target.value)}
                        placeholder="e.g. 45%"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Test score average %</label>
                      <input 
                        type="text"
                        value={testAverage}
                        onChange={(e) => setTestAverage(e.target.value)}
                        placeholder="e.g. 82%"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Academic Strength</label>
                      <input 
                        type="text"
                        value={academicStrengths}
                        onChange={(e) => setAcademicStrengths(e.target.value)}
                        placeholder="e.g. Kinematics"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Advanced Performance Metrics (NEW fields) */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-indigo-400 ml-1">Advanced Profile Parameters</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Weekly Practice Tests</label>
                      <input 
                        type="text"
                        value={weeklyTestsAttempted}
                        onChange={(e) => setWeeklyTestsAttempted(e.target.value)}
                        placeholder="e.g. 3 tests/week"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Target College / Stream</label>
                      <input 
                        type="text"
                        value={dreamCollege}
                        onChange={(e) => setDreamCollege(e.target.value)}
                        placeholder="e.g. IIT Bombay, CS"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Hours Slept / Wellness</label>
                      <input 
                        type="text"
                        value={studyHoursSlept}
                        onChange={(e) => setStudyHoursSlept(e.target.value)}
                        placeholder="e.g. 7 Hours"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1 ml-2">Assigned Study Mentor</label>
                      <input 
                        type="text"
                        value={studyMentor}
                        onChange={(e) => setStudyMentor(e.target.value)}
                        placeholder="e.g. Dr. R. V. Sharma"
                        className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex-1 mr-4">
                    <AnimatePresence>
                      {profileSuccess && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400"
                        >
                          {profileSuccess}
                        </motion.span>
                      )}
                      {profileError && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400"
                        >
                          {profileError}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={profileLoading}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md text-xs tracking-wide cursor-pointer disabled:opacity-50 select-none transition-all"
                  >
                    {profileLoading ? 'Updating Profile...' : 'Save Profile Details'}
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Unified Mobile navigation drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black backdrop-blur-sm z-50 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-zinc-900 z-50 shadow-2xl p-6 flex flex-col justify-between md:hidden border-r border-zinc-200/50 dark:border-zinc-800/50"
            >
              <div className="space-y-8 flex flex-col h-full justify-between">
                <div className="space-y-8">
                  {/* Drawer Header */}
                  <div className="flex justify-between items-center border-b border-zinc-200/40 dark:border-zinc-800/40 pb-4">
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-lg font-black tracking-widest text-slate-900 dark:text-zinc-100">ASENTRA</span>
                    </div>
                    <button 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Drawer Navigation Links */}
                  <nav className="space-y-3">
                    {isTeacher ? (
                      <>
                        <button 
                          onClick={() => { router.push('/dashboard?tab=courses'); setIsMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent"
                        >
                          <LayoutDashboard className="w-5 h-5 shrink-0" />
                          <span>My Courses</span>
                        </button>
                        <button 
                          onClick={() => { router.push('/dashboard?tab=roster'); setIsMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent"
                        >
                          <Users className="w-5 h-5 shrink-0" />
                          <span>Students Roster</span>
                        </button>
                        <button 
                          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold shadow-sm"
                        >
                          <User className="w-5 h-5 shrink-0" />
                          <span>My Profile</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { router.push('/dashboard?tab=learning'); setIsMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent"
                        >
                          <BookOpenCheck className="w-5 h-5 shrink-0" />
                          <span>My Learning</span>
                        </button>
                        <button 
                          onClick={() => { router.push('/dashboard?tab=browse'); setIsMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent"
                        >
                          <Search className="w-5 h-5 shrink-0" />
                          <span>Browse Directory</span>
                        </button>
                        <button 
                          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold shadow-sm"
                        >
                          <User className="w-5 h-5 shrink-0" />
                          <span>My Profile</span>
                        </button>
                        <button 
                          onClick={() => { router.push('/dashboard?tab=invoices'); setIsMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent"
                        >
                          <FileText className="w-5 h-5 shrink-0" />
                          <span>Invoices Ledger</span>
                        </button>
                      </>
                    )}
                  </nav>
                </div>

                {/* Drawer Profile Capsule */}
                <div className="border-t border-zinc-200/40 dark:border-zinc-800/50 pt-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3.5 px-2">
                    <div className="w-11 h-11 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-extrabold shadow-sm shadow-blue-500/10 shrink-0 select-none">
                      {displayInitials}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-black text-slate-800 dark:text-zinc-100 truncate tracking-tight">{displayName}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{displayRole}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
