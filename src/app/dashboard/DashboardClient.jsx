'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { 
  BookOpen, Plus, Search, GraduationCap, LayoutDashboard, 
  Users, CheckCircle2, Award, Calendar, BookOpenCheck, ArrowRight, 
  Info, Loader2, Sparkles, User, Mail, Phone, ShieldAlert,
  ArrowUpRight, AlertCircle, FileText, Clock, ChevronLeft, ChevronRight, Menu
} from 'lucide-react'

const getThumbnailUrl = (course) => {
  if (course.thumbnail_url) return course.thumbnail_url
  
  // Dynamic academic fallback covers matching course difficulty level
  const defaultThumbs = {
    foundation: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    mains: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=800&q=80',
    advanced: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'
  }
  return defaultThumbs[course.level] || defaultThumbs.foundation
}

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
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  // Local reactive state for active tab to achieve 0ms transition latency between dashboard sections
  const isTeacher = profile.role === 'teacher'
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab')
    if (isTeacher) {
      if (tabParam === 'roster') return 'ROSTER'
      if (tabParam === 'profile') return 'PROFILE'
      return 'MY_COURSES' // default
    } else {
      if (tabParam === 'browse') return 'BROWSE'
      if (tabParam === 'invoices') return 'INVOICES'
      if (tabParam === 'profile') return 'PROFILE'
      return 'MY_LEARNING' // default
    }
  })

  // Synchronize state back to browser URL bar in-place (0ms SPA-grade navigation)
  const handleTabChange = (tabName, queryParam) => {
    setActiveTab(tabName)
    setIsMobileMenuOpen(false)
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', queryParam)
      window.history.pushState(null, '', url.toString())
    }
  }

  // React to browser back/forward buttons (Popstate event synchronization)
  React.useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get('tab')
      if (isTeacher) {
        if (tabParam === 'roster') setActiveTab('ROSTER')
        else if (tabParam === 'profile') setActiveTab('PROFILE')
        else setActiveTab('MY_COURSES')
      } else {
        if (tabParam === 'browse') setActiveTab('BROWSE')
        else if (tabParam === 'invoices') setActiveTab('INVOICES')
        else if (tabParam === 'profile') setActiveTab('PROFILE')
        else setActiveTab('MY_LEARNING')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isTeacher])

  // Data states (locally updated for real-time reactivity)
  const [courses, setCourses] = useState(initialCourses)
  const [enrollments, setEnrollments] = useState(initialEnrollments)
  const [directory, setDirectory] = useState(allCourses)

  // Interactive Search Query
  const [searchQuery, setSearchQuery] = useState('')

  // Profile pre-fills and dynamic contact numbers
  const [profileName, setProfileName] = useState(profile.full_name || '')
  const [profilePhone, setProfilePhone] = useState(profile.phone || '')
  const [targetYear, setTargetYear] = useState(profile.target_year || '')
  const [academicBatch, setAcademicBatch] = useState(profile.academic_batch || '')
  const [preferredSubject, setPreferredSubject] = useState(profile.preferred_subject || '')
  const [dailyStudyHours, setDailyStudyHours] = useState(profile.daily_study_hours || '8 Hours')
  const [syllabusProgress, setSyllabusProgress] = useState(profile.syllabus_progress || '45%')
  const [testAverage, setTestAverage] = useState(profile.test_average || '82%')
  const [academicStrengths, setAcademicStrengths] = useState(profile.academic_strengths || 'Physics & Calculus')
  
  // Profile update indicators
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Sidebar collapsing & mobile menu toggles
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)



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
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null)

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
          user_id: user.id,
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

  // Handle Secure Razorpay checkout and enrollment directly inside the student dashboard
  const handleRazorpayCheckout = async (course) => {
    setCheckoutLoadingId(course.id)
    try {
      // Step A: Fetch order creation parameters from secure server-side API
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          price: course.price
        })
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize transaction order ID.')
      }

      // Step B: Configure Razorpay JS Checkout Overlay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SuSd4sFUgQBxn0',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ASENTRA ACADEMY',
        description: course.title,
        order_id: orderData.id,
        theme: {
          color: '#2563EB' // Deep blue theme accent
        },
        prefill: {
          email: user.email,
          contact: profile.phone || ''
        },
        // Step C: Razorpay payment transaction completed handler
        handler: async function (response) {
          try {
            setCheckoutLoadingId(course.id)
            
            // Call server-side route to securely verify signatures and persist enrollment
            const verifyResponse = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: course.id,
                userId: user.id
              })
            })

            const verifyResult = await verifyResponse.json()

            if (verifyResponse.ok && verifyResult.success) {
              alert('Enrollment Successful! Welcome to ASENTRA Academy.')
              
              // Upsert enrollment in local state instantly for 0ms reactive UI update
              const newEnroll = {
                id: response.razorpay_payment_id,
                user_id: user.id,
                course_id: course.id,
                status: 'active',
                enrolled_at: new Date().toISOString(),
                courses: course,
                profiles: profile
              }
              setEnrollments(prev => [newEnroll, ...prev])
              
              // Trigger a server-side route refresh to sync standard server cached states
              startTransition(() => {
                router.refresh()
              })
            } else {
              alert('Signature verification failed: ' + (verifyResult.error || 'Potential transaction mismatch.'))
            }
          } catch (verifyErr) {
            console.error('Signature Verification Error:', verifyErr)
            alert('An error occurred during transaction validation: ' + verifyErr.message)
          } finally {
            setCheckoutLoadingId(null)
          }
        },
        modal: {
          ondismiss: function () {
            setCheckoutLoadingId(null)
          }
        }
      }

      // Step D: Open official Razorpay modal directly
      const razorpayObject = new window.Razorpay(options)
      razorpayObject.open()
    } catch (err) {
      console.error('Razorpay Checkout failed:', err)
      alert(err.message || 'Failed to initialize payment gateway. Check network.')
      setCheckoutLoadingId(null)
    }
  }

  // Handle Profile Edits (Name & Phone Number)
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
          academic_strengths: academicStrengths.trim()
        })
        .eq('id', user.id)

      if (error) throw error

      setProfileSuccess('Profile details successfully updated!')
      
      // Sync payment phone pre-fill reactively
      if (profilePhone.trim()) {
        setPaymentPhone(profilePhone.trim())
      }

      // Trigger a server-side route refresh to sync state
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

  const displayName = profileName || user.email.split('@')[0]
  const displayPhone = profilePhone || 'Not Provided'
  const displayRole = isTeacher ? 'Instructor' : 'Student'
  const displayInitials = displayName.substring(0, 2).toUpperCase()

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

      <div className="relative z-10 flex min-h-screen pt-0 pb-12 gap-6 w-full max-w-none px-0 pr-4 md:pr-6">
        
        {/* Sidebar Nav */}
        <aside className="w-24 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-900/60 hidden md:flex flex-col gap-6 justify-between py-6 px-2 shrink-0 h-[calc(100vh-62px)] sticky top-[62px] z-40">
          <div className="space-y-6">
            <nav className="space-y-4">
              {isTeacher ? (
                <>
                  <button 
                    onClick={() => handleTabChange('MY_COURSES', 'courses')}
                    className={`w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      activeTab === 'MY_COURSES' 
                        ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium'
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Courses</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('ROSTER', 'roster')}
                    className={`w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      activeTab === 'ROSTER' 
                        ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium'
                    }`}
                  >
                    <Users className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Roster</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('PROFILE', 'profile')}
                    className={`w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      activeTab === 'PROFILE' 
                        ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium'
                    }`}
                  >
                    <User className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handleTabChange('MY_LEARNING', 'learning')}
                    className={`w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      activeTab === 'MY_LEARNING' 
                        ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium'
                    }`}
                  >
                    <BookOpenCheck className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Learning</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('BROWSE', 'browse')}
                    className={`w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      activeTab === 'BROWSE' 
                        ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium'
                    }`}
                  >
                    <Search className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Browse</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('PROFILE', 'profile')}
                    className={`w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      activeTab === 'PROFILE' 
                        ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium'
                    }`}
                  >
                    <User className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('INVOICES', 'invoices')}
                    className={`w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 group ${
                      activeTab === 'INVOICES' 
                        ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/40 font-medium'
                    }`}
                  >
                    <FileText className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Invoices</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </aside>

        {/* Dashboard Content Area */}
        <main className="flex-1 flex flex-col overflow-x-hidden bg-white/30 dark:bg-zinc-900/30 rounded-[2rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.015)] animate-fade-in-scroll transition-all duration-500 ease-in-out">
          
          <header className="p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md flex justify-between items-center">
            <div className="flex items-center">
              {/* Responsive Hamburger Toggle Menu for Mobile */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 mr-3 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 cursor-pointer select-none transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                  {isTeacher ? 'Instructor Control Panel' : 'Student Learning Hub'}
                </h1>
                <p className="text-xs font-semibold text-zinc-400 mt-0.5">
                  Dashboard &bull; Signed in as <span className="text-blue-600 dark:text-indigo-405">{user.email}</span>
                </p>
              </div>
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

          <div className="flex-1 p-6 md:p-8 space-y-8 w-full max-w-none">
            
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
                          onClick={() => handleTabChange('BROWSE', 'browse')}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredDirectory.map((course) => {
                          const enrolled = checkIsEnrolled(course.id)
                          const loading = enrollLoadingId === course.id || checkoutLoadingId === course.id
                          const isFree = Number(course.price) === 0
                          const thumbUrl = getThumbnailUrl(course)
                          
                          // Custom mapped details for high-fidelity visual matching with Image 2
                          const language = course.language || 'Hinglish'
                          const aspirantInfo = course.aspirant_info || (course.level === 'advanced' ? 'For JEE Advanced Aspirants' : 'For IIT-JEE Aspirants')
                          const batchInfo = course.batch_info || 'Starts on 1 Jun, 2026 Ends on 28 Jun, 2028'
                          const originalPrice = course.original_price || (course.price > 0 ? course.price * 1.25 : 0)

                          return (
                            <motion.div 
                              key={course.id}
                              whileHover={{ y: -6 }}
                              className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative group min-h-[540px]"
                            >
                              {/* Premium Widescreen Banner Image Header */}
                              <div className="w-full h-48 overflow-hidden relative shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/20 via-transparent to-transparent z-10" />
                                <img 
                                  src={thumbUrl} 
                                  alt={course.title}
                                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                                />
                                {enrolled && (
                                  <span className="absolute top-4 left-4 z-20 px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded-full shadow-sm">
                                    Enrolled
                                  </span>
                                )}
                              </div>

                              {/* Card Content Section */}
                              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                  {/* Title Row */}
                                  <div className="flex items-start justify-between gap-2.5">
                                    <h4 className="text-sm font-black tracking-tight text-slate-905 dark:text-zinc-150 leading-snug line-clamp-2">
                                      {course.title}
                                    </h4>
                                  </div>

                                  {/* Description line */}
                                  <p className="text-[11px] text-zinc-450 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                    {course.description || 'No description provided.'}
                                  </p>

                                  {/* Detail metadata list */}
                                  <div className="space-y-1.5 pt-2 text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                                      <span>{aspirantInfo}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span>{batchInfo}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Cost Row & Action Buttons */}
                                <div className="space-y-4 pt-1">
                                  <div className="space-y-0.5 border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                                    <div className="flex items-center gap-2 flex-wrap select-none">
                                      <span className="text-xl font-black text-slate-900 dark:text-zinc-100">
                                        {isFree ? 'Free' : `₹${Number(course.price).toLocaleString('en-IN')}`}
                                      </span>
                                      {!isFree && originalPrice > course.price && (
                                        <>
                                          <span className="text-[10px] font-semibold text-slate-400 line-through mt-0.5">
                                            ₹{Number(Math.round(originalPrice)).toLocaleString('en-IN')}
                                          </span>
                                          <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[8px] px-1.5 py-0.5 rounded font-black tracking-wide border border-emerald-100/10">
                                            Discount of {Math.round(((originalPrice - course.price) / originalPrice) * 100)}% applied
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                      (FOR FULL BATCH)
                                    </p>
                                  </div>

                                  {/* Dual CTAs Grid */}
                                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100/80 dark:border-zinc-800/80 pt-4">
                                    <button
                                      onClick={() => handleTabChange('MY_LEARNING', 'learning')}
                                      className="border border-blue-600 hover:bg-blue-50/50 dark:border-blue-500/70 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-450 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer flex items-center justify-center"
                                    >
                                      EXPLORE
                                    </button>
                                    
                                    {enrolled ? (
                                      <div className="flex items-center justify-center gap-1 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider select-none">
                                        <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
                                        <span>Registered</span>
                                      </div>
                                    ) : isFree ? (
                                      <button
                                        onClick={() => handleEnroll(course.id)}
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-755 text-white text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                                      >
                                        {loading ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <span>ENROLL FREE</span>
                                        )}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleRazorpayCheckout(course)}
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-755 text-white text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/10"
                                      >
                                        {loading ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <span>BUY NOW</span>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
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
                    className="space-y-8"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-2">
                      <h3 className="text-xl font-black text-slate-900 dark:text-zinc-150 flex items-center gap-2 tracking-tight">
                        <User className="w-5 h-5 text-blue-600" />
                        <span>Academic Profile Dossier</span>
                      </h3>
                      <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider select-none shadow-sm">
                        Verified Student Account
                      </span>
                    </div>

                    {/* Personal & Contact Overview Card */}
                    <div className="bg-white/60 backdrop-blur-xl shadow-md shadow-zinc-100/50 dark:bg-zinc-900/60 dark:shadow-none rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 transition-all duration-300">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0 select-none">
                        {displayInitials}
                      </div>
                      <div className="space-y-2 text-center md:text-left flex-1">
                        <h4 className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100">{displayName}</h4>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs text-slate-500 dark:text-zinc-400 font-semibold justify-center md:justify-start">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span>{displayPhone}</span>
                          </div>
                        </div>

                        {/* Display extra student academic parameters */}
                        {(targetYear || academicBatch || preferredSubject) && (
                          <div className="flex flex-wrap gap-2 text-[9px] font-bold text-blue-600 dark:text-indigo-400 pt-3 border-t border-slate-100 dark:border-zinc-800/80 mt-3 justify-center md:justify-start">
                            {targetYear && (
                              <span className="bg-blue-50 dark:bg-zinc-850 px-2.5 py-1 rounded-lg border border-blue-100/20">Target: IIT JEE {targetYear}</span>
                            )}
                            {academicBatch && (
                              <span className="bg-blue-50 dark:bg-zinc-850 px-2.5 py-1 rounded-lg border border-blue-100/20">Batch: {academicBatch}</span>
                            )}
                            {preferredSubject && (
                              <span className="bg-blue-50 dark:bg-zinc-850 px-2.5 py-1 rounded-lg border border-blue-100/20">Focus: {preferredSubject}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Academic Performance Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Daily Study Target', value: dailyStudyHours, desc: 'Hours logged per day', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400', icon: Clock },
                        { label: 'Syllabus Covered', value: syllabusProgress, desc: 'Core curricula completion', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400', icon: BookOpenCheck },
                        { label: 'Practice Assessment Avg', value: testAverage, desc: 'Average mock test score', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400', icon: Award },
                        { label: 'Academic Strength', value: academicStrengths, desc: 'Top performing area', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400', icon: Sparkles }
                      ].map((item, index) => {
                        const IconComponent = item.icon
                        return (
                          <div key={index} className="p-5 rounded-3xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm border border-zinc-50 dark:border-zinc-800/20 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{item.label}</span>
                              <div className={`p-2 rounded-xl shrink-0 ${item.color}`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                            </div>
                            <div>
                              <p className="text-lg font-black text-slate-800 dark:text-zinc-150 leading-tight">{item.value}</p>
                              <p className="text-[9px] font-semibold text-zinc-400 mt-1">{item.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Progress Visualizers & timelines */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Visual Progress Bar Card */}
                      <div className="p-6 rounded-[2rem] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm border border-zinc-50 dark:border-zinc-800/20 space-y-6">
                        <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">Syllabus Completion & Stats</h4>
                          <p className="text-[10px] text-zinc-400 mt-1">Real-time stats from core mock tests and lessons checklist.</p>
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

                      {/* Interactive timelines roadmap */}
                      <div className="p-6 rounded-[2rem] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm border border-zinc-50 dark:border-zinc-800/20 space-y-4">
                        <div>
                          <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200">Personalized IIT JEE Prep Journey</h4>
                          <p className="text-[10px] text-zinc-400 mt-1">Visualizing your structured syllabus stages.</p>
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
                                <h5 className="text-xs font-bold text-slate-850 dark:text-zinc-200">{stage.title}</h5>
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

                    {/* Premium Profile Editing Card */}
                    <div className="bg-white/60 backdrop-blur-xl shadow-sm dark:bg-zinc-900/60 rounded-[2rem] p-8 space-y-6 transition-all duration-300">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">Update Profile Details</h4>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-1 font-semibold">
                          Modify your display name, stream focus, and contact details. New fields let you securely update your student dossier indicators in real-time.
                        </p>
                      </div>

                      <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-3xl">
                        {/* Core Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Full Name</label>
                            <input 
                              type="text"
                              value={profileName}
                              onChange={(e) => setProfileName(e.target.value)}
                              placeholder="Your full name"
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Indian Phone Number</label>
                            <input 
                              type="text"
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              placeholder="Enter 10 digit number"
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                            />
                          </div>
                        </div>

                        {/* Stream / Focus Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Target JEE Year</label>
                            <input 
                              type="text"
                              value={targetYear}
                              onChange={(e) => setTargetYear(e.target.value)}
                              placeholder="e.g. 2027"
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Prep Batch / Stream</label>
                            <select 
                              value={academicBatch}
                              onChange={(e) => setAcademicBatch(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                            >
                              <option value="">Select Stream</option>
                              <option value="11th Standard Foundation">11th Standard Foundation</option>
                              <option value="12th Standard Mains">12th Standard Mains</option>
                              <option value="Dropper Elite JEE Track">Dropper Elite JEE Track</option>
                              <option value="Instructor / Faculty">Instructor / Faculty</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Preferred Subject Focus</label>
                            <select 
                              value={preferredSubject}
                              onChange={(e) => setPreferredSubject(e.target.value)}
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                            >
                              <option value="">Select Subject</option>
                              <option value="Mathematics">Mathematics</option>
                              <option value="Physics">Physics</option>
                              <option value="Chemistry">Chemistry</option>
                              <option value="Full PCM Syllabus">Full PCM Syllabus</option>
                            </select>
                          </div>
                        </div>

                        {/* NEW: Extended Dossier Parameters Section */}
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850/80 space-y-4">
                          <h5 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-zinc-350">Academic Dossier Indicators</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Daily Study hours</label>
                              <input 
                                type="text"
                                value={dailyStudyHours}
                                onChange={(e) => setDailyStudyHours(e.target.value)}
                                placeholder="e.g. 8 Hours"
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Syllabus Progress %</label>
                              <input 
                                type="text"
                                value={syllabusProgress}
                                onChange={(e) => setSyllabusProgress(e.target.value)}
                                placeholder="e.g. 45%"
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Test score average %</label>
                              <input 
                                type="text"
                                value={testAverage}
                                onChange={(e) => setTestAverage(e.target.value)}
                                placeholder="e.g. 82%"
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Academic Strength</label>
                              <input 
                                type="text"
                                value={academicStrengths}
                                onChange={(e) => setAcademicStrengths(e.target.value)}
                                placeholder="e.g. Kinematics"
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
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
                                  className="text-xs font-bold text-emerald-600 dark:text-emerald-450"
                                >
                                  {profileSuccess}
                                </motion.span>
                              )}
                              {profileError && (
                                <motion.span
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  className="text-xs font-bold text-rose-600 dark:text-rose-455"
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
                            {profileLoading ? 'Updating Dossier...' : 'Save Profile Dossier'}
                          </motion.button>
                        </div>
                      </form>
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

      {/* MOBILE DRAWER SIDEBAR OVERLAY */}
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
                  <div className="flex justify-between items-center border-b border-zinc-150/40 dark:border-zinc-800/40 pb-4">
                    <div className="flex items-center gap-2 select-none">
                      {/* ASENTRA Vector Logo */}
                      <svg className="w-28 h-6" viewBox="0 0 250 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 44 L28 10 L44 44" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M20 32 L36 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M76 16 C76 12, 56 12, 56 18 C56 24, 76 26, 76 32 C76 38, 56 38, 56 34" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M110 12 L92 12 L92 42 L110 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M92 27 L106 27" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M122 42 L122 12 L142 42 L142 12" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M152 12 L178 12" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M165 12 L165 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M188 42 L188 12 L206 12 C214 12, 214 26, 206 26" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M198 26 L210 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M220 44 L236 10" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-950 dark:text-slate-100" />
                        <path d="M236 10 L252 44" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M228 32 L244 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" className="text-slate-950 dark:text-slate-100" />
                      </svg>
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
                          onClick={() => handleTabChange('MY_COURSES', 'courses')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'MY_COURSES' 
                              ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <LayoutDashboard className="w-5 h-5 shrink-0" />
                          <span>My Courses</span>
                        </button>
                        <button 
                          onClick={() => handleTabChange('ROSTER', 'roster')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'ROSTER' 
                              ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-450 font-bold shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <Users className="w-5 h-5 shrink-0" />
                          <span>Students Roster</span>
                        </button>
                        <button 
                          onClick={() => handleTabChange('PROFILE', 'profile')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'PROFILE' 
                              ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-450 font-bold shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <User className="w-5 h-5 shrink-0" />
                          <span>My Profile</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleTabChange('MY_LEARNING', 'learning')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'MY_LEARNING' 
                              ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-455 font-bold shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <BookOpenCheck className="w-5 h-5 shrink-0" />
                          <span>My Learning</span>
                        </button>
                        <button 
                          onClick={() => handleTabChange('BROWSE', 'browse')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'BROWSE' 
                              ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-455 font-bold shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <Search className="w-5 h-5 shrink-0" />
                          <span>Browse Directory</span>
                        </button>
                        <button 
                          onClick={() => handleTabChange('PROFILE', 'profile')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'PROFILE' 
                              ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-455 font-bold shadow-sm' 
                              : 'text-slate-655 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <User className="w-5 h-5 shrink-0" />
                          <span>My Profile</span>
                        </button>
                        <button 
                          onClick={() => handleTabChange('INVOICES', 'invoices')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'INVOICES' 
                              ? 'bg-[#EAF2FF] text-blue-600 dark:bg-blue-950/30 dark:text-blue-455 font-bold shadow-sm' 
                              : 'text-slate-655 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <FileText className="w-5 h-5 shrink-0" />
                          <span>Invoices Ledger</span>
                        </button>
                      </>
                    )}
                  </nav>
                </div>

                {/* Drawer Profile Capsule */}
                <div className="border-t border-zinc-150/40 dark:border-zinc-800/50 pt-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3.5 px-2">
                    <div className="w-11 h-11 rounded-full bg-[#3B82F6] flex items-center justify-center text-white font-extrabold shadow-sm shadow-blue-500/10 shrink-0 select-none">
                      {displayName.substring(0, 2).toUpperCase()}
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

      {/* Official script loader injected lazily to optimize hydration performance */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload" 
      />

    </div>
  )
}
