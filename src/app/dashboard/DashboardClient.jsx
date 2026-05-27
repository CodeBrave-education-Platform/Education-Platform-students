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
  ArrowUpRight, AlertCircle, FileText, Clock
} from 'lucide-react'

export default function DashboardClient({ 
  user, 
  profile, 
  initialCourses, 
  initialEnrollments, 
  allCourses,
  mockInvoices = [],
  phoneNumber = 'Not Provided',
  checkoutCourseId
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  // Core active tab states
  // Student tabs: 'MY_LEARNING' | 'BROWSE' | 'PROFILE' | 'INVOICES'
  // Instructor tabs: 'MY_COURSES' | 'ROSTER' | 'PROFILE'
  const isTeacher = profile.role === 'teacher'
  const [activeTab, setActiveTab] = useState(isTeacher ? 'MY_COURSES' : 'MY_LEARNING')

  // Data states (locally updated for real-time reactivity)
  const [courses, setCourses] = useState(initialCourses)
  const [enrollments, setEnrollments] = useState(initialEnrollments)
  const [directory, setDirectory] = useState(allCourses)

  // Interactive Search Query
  const [searchQuery, setSearchQuery] = useState('')

  // Simulated Razorpay payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedCheckoutCourse, setSelectedCheckoutCourse] = useState(null)
  const [paymentState, setPaymentState] = useState('IDLE') // 'IDLE' | 'CONNECTING' | 'AUTHORIZING' | 'SUCCESS'
  const [paymentPhone, setPaymentPhone] = useState(phoneNumber !== 'Not Provided' ? phoneNumber : '')

  React.useEffect(() => {
    if (checkoutCourseId) {
      const allAvailableCourses = [
        ...directory,
        {
          id: 'course-free-1',
          title: 'Foundations of Mathematics & Algebra',
          price: 0,
          level: 'foundation',
          description: 'Master core algebraic concepts, linear equations, inequalities, and functions. Recommended for early IIT JEE foundation tracks.'
        },
        {
          id: 'course-prem-1',
          title: 'IIT JEE Mains Mastery: Physics & Chemistry',
          price: 4999,
          level: 'mains',
          description: 'Comprehensive preparation ledger covering kinematics, thermodynamics, organic chemistry, and chemical bonding with step-by-step guides.'
        },
        {
          id: 'course-prem-2',
          title: 'IIT JEE Advanced: Elite Calculus & Trigonometry',
          price: 9999,
          level: 'advanced',
          description: 'Solve advanced level limits, continuity, differential equations, and complex variables. Outfitted for high-tier engineering candidates.'
        }
      ]
      const course = allAvailableCourses.find(c => c.id === checkoutCourseId)
      if (course) {
        setSelectedCheckoutCourse(course)
        setShowPaymentModal(true)
        setPaymentState('INITIATED')
      }
    }
  }, [checkoutCourseId, directory])

  // Create Course Form States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  // Enrollment Action States
  const [enrollLoadingId, setEnrollLoadingId] = useState(null)
  const [enrollError, setEnrollError] = useState('')

  // Filtered Course Directory for Student Search
  const filteredDirectory = directory.filter(course => {
    const titleMatch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const descMatch = (course.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const instructorMatch = (course.profiles?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    return titleMatch || descMatch || instructorMatch
  })

  // Check if student is already enrolled in a course
  const checkIsEnrolled = (courseId) => {
    return enrollments.some(enroll => enroll.course_id === courseId)
  }

  // Handle Dynamic Course Creation by Instructors
  const handleCreateCourse = async (e) => {
    e.preventDefault()
    if (!courseTitle.trim()) {
      setCreateError('Course title is required.')
      return
    }

    setCreateLoading(true)
    setCreateError('')
    setCreateSuccess('')

    try {
      const { data: newCourse, error } = await supabase
        .from('courses')
        .insert({
          title: courseTitle.trim(),
          description: courseDesc.trim(),
          instructor_id: user.id
        })
        .select()
        .single()

      if (error) throw error

      setCreateSuccess('Course published successfully!')
      
      // Update local courses state instantly for zero-latency UI update
      setCourses(prev => [newCourse, ...prev])

      setTimeout(() => {
        setIsCreateOpen(false)
        setCourseTitle('')
        setCourseDesc('')
        setCreateSuccess('')
      }, 1000)
      
      // Trigger a server-side route refresh to update cached layouts
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      console.error('Course Creation Error:', err)
      setCreateError(err.message || 'Failed to create course. Please try again.')
    } finally {
      setCreateLoading(false)
    }
  }

  // Handle Dynamic Enrollment by Students
  const handleEnroll = async (courseId) => {
    setEnrollLoadingId(courseId)
    setEnrollError('')

    try {
      const { data: newEnroll, error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId
        })
        .select('*, courses(*)')
        .single()

      if (error) throw error

      // Update local enrollments list instantly
      setEnrollments(prev => [newEnroll, ...prev])

      // Trigger a server-side route refresh to sync layout state
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      console.error('Enrollment Error:', err)
      setEnrollError(err.message || 'Failed to enroll in course. Please try again.')
    } finally {
      setEnrollLoadingId(null)
    }
  }

  const displayName = profile.full_name || user.email.split('@')[0]
  const displayRole = isTeacher ? 'Instructor' : 'Student'

  // Dynamic Metrics definitions
  const teacherStats = [
    { title: 'My Courses', value: courses.length, icon: BookOpen, color: 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20' },
    { title: 'Students Enrolled', value: enrollments.length, icon: Users, color: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/20' },
    { title: 'Peer Instructors', value: '14', icon: Award, color: 'text-pink-500 bg-pink-500/10 dark:bg-pink-500/20' },
  ]

  const studentStats = [
    { title: 'Enrolled Courses', value: enrollments.length, icon: BookOpenCheck, color: 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20' },
    { title: 'Available Catalog', value: directory.length, icon: GraduationCap, color: 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20' },
    { title: 'Study Timeline', value: 'Active', icon: Calendar, color: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/20' },
  ]

  const stats = isTeacher ? teacherStats : studentStats

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      
      {/* Premium accent glows */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-500/5 dark:bg-indigo-950/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-indigo-500/5 dark:bg-zinc-950/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 flex min-h-screen">
        
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl hidden md:flex flex-col p-6 gap-8 justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-2 select-none">
              <svg className="w-36 h-7" viewBox="0 0 250 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Custom drawn geometric letter 'A' */}
                <path d="M12 44 L28 10 L44 44" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                <path d="M20 32 L36 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                
                {/* Custom drawn geometric letter 'S' */}
                <path d="M76 16 C76 12, 56 12, 56 18 C56 24, 76 26, 76 32 C76 38, 56 38, 56 34" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                
                {/* Custom drawn geometric letter 'E' */}
                <path d="M110 12 L92 12 L92 42 L110 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                <path d="M92 27 L106 27" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                
                {/* Custom drawn geometric letter 'N' */}
                <path d="M122 42 L122 12 L142 42 L142 12" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                
                {/* Custom drawn geometric letter 'T' */}
                <path d="M152 12 L178 12" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                <path d="M165 12 L165 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                
                {/* Custom drawn geometric letter 'R' */}
                <path d="M188 42 L188 12 L206 12 C214 12, 214 26, 206 26 L188 26" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                <path d="M198 26 L210 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                
                {/* Custom drawn geometric letter 'A' with RED accented leg */}
                <path d="M220 44 L236 10" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
                {/* Red accent leg matching logo image */}
                <path d="M236 10 L252 44" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M228 32 L244 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100 transition-colors duration-300" />
              </svg>
            </div>

            <nav className="space-y-1.5">
              {isTeacher ? (
                <>
                  <button 
                    onClick={() => setActiveTab('MY_COURSES')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-extrabold rounded-2xl transition-all cursor-pointer ${
                      activeTab === 'MY_COURSES' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-l-4 border-blue-600 dark:border-indigo-500 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <LayoutDashboard className="w-4.5 h-4.5" />
                    <span>My Courses</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('ROSTER')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-extrabold rounded-2xl transition-all cursor-pointer ${
                      activeTab === 'ROSTER' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-l-4 border-blue-600 dark:border-indigo-500 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <Users className="w-4.5 h-4.5" />
                    <span>Students Roster</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('PROFILE')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-extrabold rounded-2xl transition-all cursor-pointer ${
                      activeTab === 'PROFILE' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-l-4 border-blue-600 dark:border-indigo-500 shadow-sm' 
                        : 'text-slate-650 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <User className="w-4.5 h-4.5" />
                    <span>My Profile</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setActiveTab('MY_LEARNING')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-extrabold rounded-2xl transition-all cursor-pointer ${
                      activeTab === 'MY_LEARNING' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-l-4 border-blue-600 dark:border-indigo-500 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <BookOpenCheck className="w-4.5 h-4.5" />
                    <span>My Learning</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('BROWSE')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-extrabold rounded-2xl transition-all cursor-pointer ${
                      activeTab === 'BROWSE' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-l-4 border-blue-600 dark:border-indigo-500 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <Search className="w-4.5 h-4.5" />
                    <span>Browse Directory</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('PROFILE')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-extrabold rounded-2xl transition-all cursor-pointer ${
                      activeTab === 'PROFILE' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-l-4 border-blue-600 dark:border-indigo-500 shadow-sm' 
                        : 'text-slate-650 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <User className="w-4.5 h-4.5" />
                    <span>My Profile</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('INVOICES')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-extrabold rounded-2xl transition-all cursor-pointer ${
                      activeTab === 'INVOICES' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-indigo-950/20 dark:text-indigo-400 border-l-4 border-blue-600 dark:border-indigo-500 shadow-sm' 
                        : 'text-slate-650 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <FileText className="w-4.5 h-4.5" />
                    <span>Invoices Ledger</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* User profile capsule in sidebar */}
          <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-extrabold shadow-md">
                {displayName.substring(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-200 truncate">{displayName}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide truncate">{displayRole}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Dashboard Content Area */}
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          
          <header className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                {isTeacher ? 'Instructor Control Panel' : 'Student Learning Hub'}
              </h1>
              <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                Dashboard &bull; Signed in as <span className="text-blue-600 dark:text-indigo-405">{user.email}</span>
              </p>
            </div>
            
            {/* Quick action button for Instructors */}
            {isTeacher && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-750 text-white font-extrabold text-xs rounded-full border border-transparent shadow-md cursor-pointer select-none transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Course</span>
              </motion.button>
            )}
          </header>

          <div className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl w-full mx-auto">
            
            {/* Dynamic Banner */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-600 text-white relative overflow-hidden shadow-xl shadow-blue-500/10 dark:shadow-none">
              <div className="absolute -top-[50%] -left-[10%] w-[50rem] h-[50rem] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest bg-white/20 rounded-full select-none">
                  Portal Active
                </span>
                <h2 className="text-3xl font-black tracking-tight">
                  Welcome, {displayName}!
                </h2>
                <p className="text-xs font-semibold text-white/90 leading-relaxed max-w-xl">
                  {isTeacher 
                    ? 'Manage your educational offerings, publish modules, track course enrollments, and check rosters instantly.' 
                    : 'Search and enroll in high-caliber educational curricula, view your registered syllabi, and level up your skills.'
                  }
                </p>
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {stats.map((stat) => {
                const IconComponent = stat.icon
                return (
                  <div
                    key={stat.title}
                    className="p-5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm flex items-center gap-4 transition-all hover:-y-0.5"
                  >
                    <div className={`p-3.5 rounded-2xl shrink-0 ${stat.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{stat.title}</p>
                      <p className="text-xl font-black text-slate-900 dark:text-zinc-100 mt-0.5">{stat.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Main Content Panels */}
            <div className="relative">
              <AnimatePresence mode="wait">
                
                {/* 1. TEACHER: My Courses Grid */}
                {activeTab === 'MY_COURSES' && isTeacher && (
                  <motion.div
                    key="my-courses-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-black text-[#3A251B] dark:text-zinc-100 tracking-tight flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#B37E5F] dark:text-indigo-400" />
                        <span>Created Courses ({courses.length})</span>
                      </h3>
                    </div>

                    {courses.length === 0 ? (
                      <div className="p-12 text-center rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 shadow-inner">
                          <BookOpen className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-extrabold text-[#3A251B] dark:text-zinc-200">No courses published yet</h4>
                          <p className="text-xs text-zinc-400">Share your domain expertise and construct your very first course!</p>
                        </div>
                        <button
                          onClick={() => setIsCreateOpen(true)}
                          className="px-5 py-2.5 bg-gradient-to-r from-[#F6E5D8] to-[#FAF0E6] text-[#5C3F2F] dark:from-indigo-600 dark:to-purple-600 dark:text-white font-extrabold text-xs rounded-full border border-[#FAF6F2]/60 shadow-sm cursor-pointer hover:scale-[1.01] transition-all"
                        >
                          Create First Course
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => {
                          // Find enrollment count
                          const studentCount = enrollments.filter(e => e.course_id === course.id).length
                          return (
                            <motion.div
                              key={course.id}
                              whileHover={{ y: -4 }}
                              className="p-6 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[180px] transition-all"
                            >
                              <div className="space-y-2">
                                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full">
                                  Course
                                </span>
                                <h4 className="text-base font-black text-[#3A251B] dark:text-zinc-100 tracking-tight leading-snug line-clamp-1">{course.title}</h4>
                                <p className="text-xs text-zinc-450 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                  {course.description || 'No description provided.'}
                                </p>
                              </div>
                              <div className="border-t border-zinc-150/40 dark:border-zinc-800/40 pt-4 mt-4 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{studentCount} Students</span>
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400">
                                  {new Date(course.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 2. TEACHER: Enrolls Roster */}
                {activeTab === 'ROSTER' && isTeacher && (
                  <motion.div
                    key="roster-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-black text-[#3A251B] dark:text-zinc-100 tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#B37E5F] dark:text-indigo-400" />
                      <span>Student Enrolls Ledger ({enrollments.length})</span>
                    </h3>

                    {enrollments.length === 0 ? (
                      <div className="p-12 text-center rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 shadow-inner">
                          <Users className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-extrabold text-[#3A251B] dark:text-zinc-200">Roster Empty</h4>
                          <p className="text-xs text-zinc-400">No students have enrolled in your active courses yet.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-200/50 dark:border-zinc-800/50 text-[10px] font-black uppercase tracking-wider text-zinc-400 select-none">
                              <th className="px-6 py-4">Student</th>
                              <th className="px-6 py-4">Course</th>
                              <th className="px-6 py-4">Contact</th>
                              <th className="px-6 py-4 text-right">Date Enrolled</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200/30 dark:divide-zinc-800/30 text-xs font-semibold text-[#3A251B] dark:text-zinc-200">
                            {enrollments.map((enroll) => (
                              <tr key={enroll.id} className="hover:bg-[#FAF6F2]/30 dark:hover:bg-zinc-950/20 transition-all">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center font-bold text-[#5C3F2F] dark:text-indigo-400">
                                      {(enroll.profiles?.full_name || 'ST').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-extrabold">{enroll.profiles?.full_name || 'Anonymous Student'}</p>
                                      <p className="text-[10px] text-zinc-400">{enroll.profiles?.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-2.5 py-1 rounded-xl bg-zinc-200/50 dark:bg-zinc-800 text-[10px] font-bold">
                                    {enroll.courses?.title || 'Unknown Course'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[10px] text-zinc-400 tracking-wider">
                                    {enroll.profiles?.phone || 'No phone recorded'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-[10px] text-zinc-400 tracking-wide">
                                  {new Date(enroll.enrolled_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. STUDENT: Registered Courses */}
                {activeTab === 'MY_LEARNING' && !isTeacher && (
                  <motion.div
                    key="my-learning-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-black text-[#3A251B] dark:text-zinc-100 tracking-tight flex items-center gap-2">
                      <BookOpenCheck className="w-5 h-5 text-[#B37E5F] dark:text-indigo-400" />
                      <span>My Learning Catalog ({enrollments.length})</span>
                    </h3>

                    {enrollments.length === 0 ? (
                      <div className="p-12 text-center rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 shadow-inner">
                          <GraduationCap className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-extrabold text-[#3A251B] dark:text-zinc-200">No active enrollments</h4>
                          <p className="text-xs text-zinc-400">Kickstart your skill upgrade today. Explore our available course catalogs!</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('BROWSE')}
                          className="px-5 py-2.5 bg-gradient-to-r from-[#F6E5D8] to-[#FAF0E6] text-[#5C3F2F] dark:from-indigo-600 dark:to-purple-600 dark:text-white font-extrabold text-xs rounded-full border border-[#FAF6F2]/60 shadow-sm cursor-pointer hover:scale-[1.01] transition-all"
                        >
                          Browse Available Courses
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrollments.map((enroll) => {
                          const course = enroll.courses
                          if (!course) return null
                          return (
                            <motion.div
                              key={enroll.id}
                              whileHover={{ y: -4 }}
                              className="p-6 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[180px] transition-all"
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full">
                                    Enrolled
                                  </span>
                                  <span className="text-[10px] text-zinc-400">
                                    Enrolled {new Date(enroll.enrolled_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <h4 className="text-base font-black text-[#3A251B] dark:text-zinc-100 tracking-tight leading-snug line-clamp-1">{course.title}</h4>
                                <p className="text-xs text-zinc-450 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                  {course.description || 'No description provided.'}
                                </p>
                              </div>
                              <div className="border-t border-zinc-150/40 dark:border-zinc-800/40 pt-4 mt-4 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Self-paced</span>
                                </span>
                                <button 
                                  className="flex items-center gap-1 text-[10px] font-extrabold text-[#B37E5F] dark:text-indigo-400 hover:underline cursor-pointer"
                                >
                                  <span>Resume Syllabi</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 4. STUDENT: Searchable Directory */}
                {activeTab === 'BROWSE' && !isTeacher && (
                  <motion.div
                    key="browse-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
                      <h3 className="text-lg font-black text-[#3A251B] dark:text-zinc-100 tracking-tight flex items-center gap-2">
                        <Search className="w-5 h-5 text-[#B37E5F] dark:text-indigo-400" />
                        <span>All Available Curriculums ({directory.length})</span>
                      </h3>
                      
                      {/* Premium Search Input */}
                      <div className="relative w-full md:w-80">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                          <Search className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search titles, descriptions..."
                          className="w-full pl-9 pr-4 py-2 bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/80 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#E8C8B5]/50 focus:border-[#E8C8B5] dark:focus:ring-indigo-500/50 dark:focus:border-indigo-500 transition-all text-[#3A251B] dark:text-zinc-100 placeholder:text-zinc-400 shadow-inner"
                        />
                      </div>
                    </div>

                    {enrollError && (
                      <div className="flex gap-2 items-start p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{enrollError}</span>
                      </div>
                    )}

                    {filteredDirectory.length === 0 ? (
                      <div className="p-12 text-center rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md">
                        <p className="text-xs text-zinc-450 dark:text-zinc-450 font-semibold">No courses matched your query. Try searching for other key phrases!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDirectory.map((course) => {
                          const enrolled = checkIsEnrolled(course.id)
                          const loading = enrollLoadingId === course.id
                          return (
                            <motion.div
                              key={course.id}
                              whileHover={{ y: -4 }}
                              className="p-6 rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[190px] transition-all"
                            >
                              <div className="space-y-2">
                                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#F6E5D8]/60 dark:bg-zinc-800 text-[#5C3F2F] dark:text-zinc-300 rounded-full">
                                  Course
                                </span>
                                <h4 className="text-base font-black text-[#3A251B] dark:text-zinc-100 tracking-tight leading-snug line-clamp-1">{course.title}</h4>
                                <p className="text-xs text-zinc-450 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                  {course.description || 'No description provided.'}
                                </p>
                              </div>
                              <div className="border-t border-zinc-150/40 dark:border-zinc-800/40 pt-4 mt-4 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                                  <User className="w-3.5 h-3.5" />
                                  <span>{course.profiles?.full_name || 'Platform Faculty'}</span>
                                </span>
                                
                                {enrolled ? (
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-450 select-none">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Registered</span>
                                  </div>
                                ) : (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleEnroll(course.id)}
                                    disabled={loading}
                                    className="flex items-center gap-1 px-4.5 py-2 bg-gradient-to-r from-[#F6E5D8] to-[#FAF0E6] text-[#5C3F2F] dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 dark:text-white font-extrabold text-[10px] rounded-full border border-[#FAF6F2]/60 dark:border-transparent shadow-sm cursor-pointer disabled:opacity-50 select-none transition-all"
                                  >
                                    {loading ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <span>Enroll Now</span>
                                        <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                                      </>
                                    )}
                                  </motion.button>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 5. PROFILE: Profile Tab (Both Students and Teachers) */}
                {activeTab === 'PROFILE' && (
                  <motion.div
                    key="profile-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-150 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span>My Profile Overview</span>
                    </h3>

                    <div className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-zinc-900/60 dark:border-zinc-800 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 transition-all duration-300 hover:shadow-2xl">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                        {displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1 text-center md:text-left flex-1">
                        <h4 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{displayName}</h4>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                          <div className="flex items-center justify-center md:justify-start gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center justify-center md:justify-start gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{phoneNumber}</span>
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider">
                          Account Verified
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 6. INVOICES: Invoices Ledger (Students only) */}
                {activeTab === 'INVOICES' && (
                  <motion.div
                    key="invoices-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-150 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>Invoices Ledger</span>
                    </h3>

                    <div className="overflow-hidden rounded-3xl border border-white dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 text-[10px] font-semibold uppercase tracking-wider text-slate-450 dark:text-zinc-400 select-none">
                            <th className="px-6 py-4">Invoice ID</th>
                            <th className="px-6 py-4">Course</th>
                            <th className="px-6 py-4">Razorpay Payment ID</th>
                            <th className="px-6 py-4">Amount Paid</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-850 text-xs font-medium text-slate-800 dark:text-zinc-200">
                          {mockInvoices?.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-white/40 dark:hover:bg-zinc-900/20 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-zinc-100">{invoice.id}</td>
                              <td className="px-6 py-4">{invoice.courseTitle}</td>
                              <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{invoice.razorpayId}</td>
                              <td className="px-6 py-4 font-semibold">{invoice.amount}</td>
                              <td className="px-6 py-4 text-slate-500 dark:text-zinc-400">{new Date(invoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td className="px-6 py-4 text-right">
                                <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <a 
                                  href="#" 
                                  onClick={(e) => { e.preventDefault(); alert(`Downloading invoice ${invoice.id} in PDF format...`) }}
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                >
                                  Download PDF
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* CREATE COURSE PANEL (SLIDE OVER DRAWER) */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-950 z-50 shadow-2xl p-6 flex flex-col justify-between border-l border-zinc-200/50 dark:border-zinc-800/60"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4">
                  <h3 className="text-lg font-black text-[#3A251B] dark:text-zinc-100 tracking-tight flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#B37E5F] dark:text-indigo-400" />
                    <span>Publish New Course</span>
                  </h3>
                  <button 
                    onClick={() => setIsCreateOpen(false)}
                    className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label htmlFor="course-title" className="block text-[10px] font-bold uppercase tracking-wider text-[#8C766C] dark:text-zinc-400 mb-1.5 ml-2">
                      Course Title
                    </label>
                    <input
                      id="course-title"
                      type="text"
                      required
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="e.g. Masterclass in Advanced Algorithms"
                      disabled={createLoading}
                      className="w-full px-4 py-3 bg-[#FAF6F2]/45 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8C8B5]/50 focus:border-[#E8C8B5] dark:focus:ring-indigo-500/50 dark:focus:border-indigo-500 font-semibold text-sm text-[#3A251B] dark:text-zinc-100 placeholder:text-zinc-400 transition-all shadow-inner"
                    />
                  </div>

                  <div>
                    <label htmlFor="course-desc" className="block text-[10px] font-bold uppercase tracking-wider text-[#8C766C] dark:text-zinc-400 mb-1.5 ml-2">
                      Course Description
                    </label>
                    <textarea
                      id="course-desc"
                      rows={4}
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                      placeholder="Describe the learning objectives, pre-requisites, and outcomes of this course..."
                      disabled={createLoading}
                      className="w-full px-4 py-3 bg-[#FAF6F2]/45 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E8C8B5]/50 focus:border-[#E8C8B5] dark:focus:ring-indigo-500/50 dark:focus:border-indigo-500 font-medium text-xs text-[#3A251B] dark:text-zinc-100 placeholder:text-zinc-400 transition-all shadow-inner resize-none"
                    />
                  </div>

                  <AnimatePresence>
                    {createError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 items-start p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{createError}</span>
                      </motion.div>
                    )}
                    {createSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 items-start p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 text-xs font-semibold"
                      >
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin mt-0.5" />
                        <span>{createSuccess}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleCreateCourse}
                  disabled={createLoading}
                  className="w-full flex items-center justify-center py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-full shadow-md cursor-pointer disabled:opacity-50 transition-all text-xs tracking-wide select-none"
                >
                  {createLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Publish Course to Platform</span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SIMULATED RAZORPAY PAYMENT GATEWAY MODAL */}
      <AnimatePresence>
        {showPaymentModal && selectedCheckoutCourse && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal Body Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white dark:bg-zinc-950 z-50 rounded-[2.5rem] shadow-2xl border border-white/80 dark:border-zinc-800 p-8 flex flex-col justify-between space-y-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-lg shadow-md tracking-wider">
                    RAZORPAY
                  </span>
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-widest">
                    Checkout Simulator
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setShowPaymentModal(false)
                    router.push('/dashboard') // clear parameters
                  }}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Course & Payment details */}
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-zinc-900 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800/80">
                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{selectedCheckoutCourse.level} track</span>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-zinc-100 mt-1">{selectedCheckoutCourse.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{selectedCheckoutCourse.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-slate-450">
                    <span>Base Tuition Fee</span>
                    <span>₹{selectedCheckoutCourse.price.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-450">
                    <span>Tax (0% Simulated)</span>
                    <span>₹0</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-zinc-100 border-t border-slate-100 dark:border-zinc-800 pt-3">
                    <span>Total Amount Payable</span>
                    <span className="text-lg text-blue-600 dark:text-blue-400">₹{selectedCheckoutCourse.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Simulated Payment Credentials Form */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 mb-1 ml-2">Billing Email</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={user.email} 
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-455 mb-1 ml-2">Indian Contact Number</label>
                    <input 
                      type="text" 
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder="Enter 10 digit number"
                      disabled={paymentState !== 'INITIATED'}
                      className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Progress states & Submit button */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                {paymentState === 'INITIATED' && (
                  <button
                    onClick={async () => {
                      if (paymentPhone.trim().length < 10) {
                        alert('Please enter a valid billing contact number.')
                        return
                      }
                      setPaymentState('CONNECTING')
                      
                      // Step 1: Connect simulation (1.2s)
                      setTimeout(() => {
                        setPaymentState('AUTHORIZING')
                        
                        // Step 2: Authorize transaction & execute DB persistence (1.5s)
                        setTimeout(async () => {
                          try {
                            // Upsert the course into Supabase public.courses to prevent foreign key errors
                            await supabase
                              .from('courses')
                              .upsert({
                                id: selectedCheckoutCourse.id,
                                title: selectedCheckoutCourse.title,
                                description: selectedCheckoutCourse.description || 'Pre-configured premium preparation ledger.',
                                price: selectedCheckoutCourse.price,
                                level: selectedCheckoutCourse.level
                              })

                            // Write real enrollment row
                            const { error: enrollErr } = await supabase
                              .from('enrollments')
                              .insert({
                                user_id: user.id,
                                course_id: selectedCheckoutCourse.id,
                                status: 'active'
                              })
                            
                            if (enrollErr) throw enrollErr

                            // Write real invoice row
                            const { error: invoiceErr } = await supabase
                              .from('invoices')
                              .insert({
                                user_id: user.id,
                                course_id: selectedCheckoutCourse.id,
                                razorpay_payment_id: 'pay_' + Math.random().toString(36).substring(2, 14),
                                amount_paid: selectedCheckoutCourse.price,
                                currency: 'INR',
                                status: 'paid'
                              })
                              
                            if (invoiceErr) throw invoiceErr

                            // Success state
                            setPaymentState('SUCCESS')
                            
                            // Refresh routing states and close modal after 1.5s
                            setTimeout(() => {
                              setShowPaymentModal(false)
                              router.push('/dashboard') // clear parameters
                              startTransition(() => {
                                router.refresh()
                              })
                            }, 1500)

                          } catch (err) {
                            console.error('Simulated Gateway Error:', err)
                            alert('Transaction execution failed: ' + err.message)
                            setPaymentState('INITIATED')
                          }
                        }, 1500)
                      }, 1200)
                    }}
                    className="w-full flex items-center justify-center py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg shadow-blue-500/20 active:scale-[0.99] transition-all text-xs tracking-wide select-none cursor-pointer"
                  >
                    <span>Authorize simulated payment</span>
                  </button>
                )}

                {paymentState === 'CONNECTING' && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Razorpay secure gateway...</span>
                  </div>
                )}

                {paymentState === 'AUTHORIZING' && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-indigo-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Persisting enrollment ledger on database...</span>
                  </div>
                )}

                {paymentState === 'SUCCESS' && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 rounded-xl animate-pulse">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Payment Success! Redirecting to hub...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
