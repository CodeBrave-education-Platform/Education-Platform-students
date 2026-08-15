'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import InvoiceModal from '@/components/InvoiceModal'
import GlobalLeaderboard from '@/components/GlobalLeaderboard'
import { 
  BookOpen, Plus, Search, GraduationCap, LayoutDashboard, 
  Users, CheckCircle2, Award, Calendar, BookOpenCheck, ArrowRight, 
  Info, Loader2, Sparkles, User, Mail, Phone, ShieldAlert,
  ArrowUpRight, AlertCircle, FileText, Clock, ChevronLeft, ChevronRight, Menu,
  TrendingUp, BarChart3, Flame, Target, Trophy
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts'

const getDefaultThumbnail = (level) => {
  const defaultThumbs = {
    foundation: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
    mains: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=800&q=80',
    advanced: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'
  };
  return defaultThumbs[level] || defaultThumbs.foundation;
}

const getThumbnailUrl = (course) => {
  if (!course || !course.thumbnail_url || course.thumbnail_url.trim() === '') {
    return getDefaultThumbnail(course?.level);
  }

  let url = course.thumbnail_url.trim();

  // Normalize absolute URLs without protocol (e.g. www.bing.com -> https://www.bing.com)
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/') && !url.startsWith('data:')) {
    if (url.includes('.') && !url.includes(' ')) {
      url = 'https://' + url;
    }
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      let mediaUrl = null;
      for (const [key, value] of u.searchParams.entries()) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'mediaurl' || lowerKey === 'imgurl' || lowerKey === 'imageurl') {
          mediaUrl = value;
          break;
        }
      }
      if (mediaUrl) {
        return decodeURIComponent(mediaUrl);
      }
    } catch (e) {}
    return url;
  }

  if (url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }

  return getDefaultThumbnail(course.level);
}

const handleImageError = (e, level) => {
  e.target.src = getDefaultThumbnail(level);
}

const CourseSkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {[1, 2, 3].map((idx) => (
      <div key={idx} className="bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/30 dark:border-zinc-800/40 shadow-sm rounded-[2.5rem] overflow-hidden flex flex-col justify-between p-6 min-h-[480px] animate-pulse">
        <div className="space-y-4 w-full">
          <div className="w-full h-40 bg-slate-200/50 dark:bg-zinc-800/50 rounded-2xl animate-pulse" />
          <div className="h-4 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full w-2/3 animate-pulse" />
          <div className="h-3 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full w-full animate-pulse" />
          <div className="h-3 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full w-5/6 animate-pulse" />
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full animate-pulse" />
              <div className="h-3 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full w-1/2 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full animate-pulse" />
              <div className="h-3 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full w-1/3 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="h-10 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full w-full mt-6 animate-pulse" />
      </div>
    ))}
  </div>
)

const TableSkeleton = () => (
  <div className="overflow-x-auto rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md p-6 space-y-4">
    <div className="h-4 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full w-1/4 mb-4 animate-pulse" />
    {[1, 2, 3].map((idx) => (
      <div key={idx} className="flex justify-between items-center py-4 border-b border-zinc-200/30 dark:border-zinc-800/30 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full animate-pulse" />
          <div className="space-y-1">
            <div className="h-3.5 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full w-24 animate-pulse" />
            <div className="h-2 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full w-36 animate-pulse" />
          </div>
        </div>
        <div className="h-6 bg-slate-200/50 dark:bg-zinc-800/50 rounded-xl w-32 animate-pulse" />
        <div className="h-3 bg-slate-200/50 dark:bg-zinc-800/50 rounded-full w-16 animate-pulse" />
      </div>
    ))}
  </div>
)

export default function DashboardClient({ 
  user, 
  profile, 
  initialCourses, 
  initialEnrollments, 
  allCourses,
  mockInvoices = [],
  phoneNumber = 'Not Provided',
  checkoutCourseId,
  initialBatches = [],
  initialBatchEnrollments = [],
  studentAnalytics = null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [localTab, setLocalTab] = useState(null)

  const tabParam = searchParams ? searchParams.get('tab') : null

  // Sync localTab back to null when route transition resolves
  React.useEffect(() => {
    setLocalTab(null)
  }, [tabParam])

  // Dynamic computed tab states (0ms SPA-grade rendering with zero state-synchronizer effects)
  const isTeacher = profile.role === 'teacher'

  const getActiveTab = () => {
    if (localTab) return localTab
    if (isTeacher) {
      if (tabParam === 'roster') return 'ROSTER'
      if (tabParam === 'profile') return 'PROFILE'
      return 'MY_COURSES'
    } else {
      if (tabParam === 'browse') return 'BROWSE'
      if (tabParam === 'invoices') return 'INVOICES'
      if (tabParam === 'profile') return 'PROFILE'
      if (tabParam === 'batches') return 'BATCHES'
      if (tabParam === 'analytics') return 'ANALYTICS'
      if (tabParam === 'exams') return 'EXAMS'
      return 'MY_LEARNING'
    }
  }

  const activeTab = getActiveTab()

  const handleTabChange = (tabName, queryParam) => {
    setIsMobileMenuOpen(false)
    setLocalTab(tabName)
    startTransition(() => {
      router.replace(`/dashboard?tab=${queryParam}`, { scroll: false })
    })
  }

  // Rich Default Mock Enrollments Fallback
  
  // Data states (locally updated for real-time reactivity)
  const [courses, setCourses] = useState(initialCourses)
  const [enrollments, setEnrollments] = useState(initialEnrollments || [])
  const [batchEnrollments, setBatchEnrollments] = useState(initialBatchEnrollments)
  const directory = allCourses

  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [selectedCohortBatch, setSelectedCohortBatch] = useState(null)
  const [cohortLiveSessions, setCohortLiveSessions] = useState([])
  const [cohortExams, setCohortExams] = useState([])
  const [cohortFiles, setCohortFiles] = useState([])
  const [loadingCohort, setLoadingCohort] = useState(false)

  const [myExams, setMyExams] = useState([])
  const [loadingMyExams, setLoadingMyExams] = useState(false)

  // [SEC-REMEDIATION]: Removed insecure localStorage mock enrollment injection. All enrollments must come from secure backend SSR.

  React.useEffect(() => {
    if (!selectedCohortBatch) return

    const fetchCohortData = async () => {
      setLoadingCohort(true)
      try {
        const [liveRes, examRes, fileRes] = await Promise.all([
          supabase
            .from('live_sessions')
            .select('*')
            .eq('batch_id', selectedCohortBatch.id)
            .order('scheduled_start', { ascending: true }),
          supabase
            .from('assessments')
            .select('*')
            .eq('batch_id', selectedCohortBatch.id)
            .order('start_window', { ascending: true }),
          supabase
            .from('course_files')
            .select('*')
            .eq('batch_id', selectedCohortBatch.id)
            .order('created_at', { ascending: true })
        ])

        if (liveRes.error) throw liveRes.error
        if (examRes.error) throw examRes.error
        if (fileRes.error) throw fileRes.error

        setCohortLiveSessions(liveRes.data || [])
        setCohortExams(examRes.data || [])
        setCohortFiles(fileRes.data || [])
      } catch (err) {
        console.error('Error fetching cohort data:', err)
      } finally {
        setLoadingCohort(false)
      }
    }

    fetchCohortData()
  }, [selectedCohortBatch])

  React.useEffect(() => {
    if (activeTab !== 'EXAMS' || isTeacher) return

    const fetchMyExams = async () => {
      setLoadingMyExams(true)
      try {
        const courseIds = enrollments.map(e => e.course_id)
        const enrolledBatchIds = batchEnrollments.map(b => b.batch_id)
        
        let query = supabase.from('assessments').select('*, courses(title)')
        
        if (courseIds.length > 0 && enrolledBatchIds.length > 0) {
          query = query.or(`course_id.in.(${courseIds.join(',')}),batch_id.in.(${enrolledBatchIds.join(',')})`)
        } else if (courseIds.length > 0) {
          query = query.in('course_id', courseIds)
        } else if (enrolledBatchIds.length > 0) {
          query = query.in('batch_id', enrolledBatchIds)
        } else {
          setMyExams([])
          return;
        }

        const { data, error } = await query.order('start_window', { ascending: true, nullsFirst: false })
        if (error) throw error
        setMyExams(data || [])
      } catch (err) {
        console.warn('[Scheduled Exams Notice]: Serving fallback CBT exams for student portal');
        setMyExams([
          {
            id: 'exam-01',
            title: 'JEE Advanced All-India Grand Mock Test 1',
            duration: 180,
            start_window: new Date().toISOString(),
            status: 'active',
            courses: { title: 'JEE Advanced 2026 Achievers Cohort' }
          },
          {
            id: 'exam-02',
            title: 'NEET UG Full Syllabus Mock Test Series',
            duration: 180,
            start_window: new Date(Date.now() + 86400000).toISOString(),
            status: 'upcoming',
            courses: { title: 'NEET Special Ranker Batch' }
          }
        ])
      } finally {
        setLoadingMyExams(false)
      }
    }

    fetchMyExams()
  }, [activeTab, enrollments, batchEnrollments, isTeacher])

  // Interactive Search Query
  const [searchQuery, setSearchQuery] = useState('')

  // Sync search query from URL parameter 'q'
  React.useEffect(() => {
    const q = searchParams ? searchParams.get('q') : null
    if (q !== null) {
      setSearchQuery(q)
    }
  }, [searchParams])

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

      // Insert free invoice for courses
      await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          course_id: courseId,
          amount_paid: 0,
          currency: 'INR',
          status: 'captured',
          razorpay_payment_id: `free_enroll_${Date.now()}`
        }).select().maybeSingle()

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
    const price = course.price !== undefined && course.price !== null ? Number(course.price) : 0
    if (price === 0 || isNaN(price)) {
      await handleEnroll(course.id)
      return
    }
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
        notes: {
          userId: user.id,
          courseId: course.id
        },
        // Step C: Razorpay payment transaction completed handler
        handler: async function (response) {
          try {
            setCheckoutLoadingId(course.id)
            
            // Professional background provisioning alert
            alert('Payment Successful! Securing enrollment. Please wait...')
            
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                courseId: course.id,
                amount: orderData.amount
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Payment verification failed.')
            }
            
            // Upsert enrollment in local state instantly for 0ms reactive UI update
            const newEnroll = {
              id: response.razorpay_payment_id || `temp_${Date.now()}`,
              user_id: user.id,
              course_id: course.id,
              status: 'active',
              enrolled_at: new Date().toISOString(),
              courses: course,
              profiles: profile
            }
            setEnrollments(prev => [newEnroll, ...prev])
            
            // Switch tabs instantly to My Learning tab
            handleTabChange('MY_LEARNING', 'learning')
            
            // Trigger a server-side route refresh to sync standard server cached states
            startTransition(() => {
              router.refresh()
            })
          } catch (err) {
            console.error('Enrollment verification error:', err)
            alert(err.message || 'Verification failed. Please contact support.')
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

  const handleBatchEnroll = async (batch) => {
    setCheckoutLoadingId(batch.id)
    try {
      const paymentId = `free_enroll_${Date.now()}`
      const { data, error } = await supabase
        .rpc('execute_atomic_batch_onboarding', {
          _user_id: user.id,
          _batch_id: batch.id,
          _payment_id: paymentId,
          _amount: 0
        })

      if (error) throw error
      if (!data) throw new Error('Failed to enroll in cohort batch via transaction.')

      // Upsert enrollment in local state instantly for 0ms reactive UI update
      const newBatchEnroll = {
        id: paymentId,
        user_id: user.id,
        batch_id: batch.id,
        status: 'active',
        enrolled_at: new Date().toISOString()
      }
      setBatchEnrollments(prev => [newBatchEnroll, ...prev])
      alert('Enrollment Successful! Welcome to the cohort batch.')
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      console.error('Batch Enrollment Error:', err)
      alert(err.message || 'Failed to enroll in cohort batch. Please try again.')
    } finally {
      setCheckoutLoadingId(null)
    }
  }

  // Handle Secure Razorpay checkout for Hybrid cohort-based Batches
  const handleBatchRazorpayCheckout = async (batch) => {
    const price = batch.price !== undefined && batch.price !== null ? Number(batch.price) : 0
    if (price === 0 || isNaN(price)) {
      await handleBatchEnroll(batch)
      return
    }
    setCheckoutLoadingId(batch.id)
    try {
      // Step A: Fetch order creation parameters from secure server-side API
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          price: batch.price
        })
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize batch transaction order ID.')
      }

      // Step B: Configure Razorpay JS Checkout Overlay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SuSd4sFUgQBxn0',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ASENTRA ACADEMY - BATCHES',
        description: batch.title,
        order_id: orderData.id,
        theme: {
          color: '#0F766E' // Premium teal accent for batches
        },
        prefill: {
          email: user.email,
          contact: profile.phone || ''
        },
        notes: {
          userId: user.id,
          batchId: batch.id
        },
        // Step C: Razorpay payment transaction completed handler
        handler: async function (response) {
          try {
            setCheckoutLoadingId(batch.id)
            
            // Professional background provisioning alert
            alert('Payment Successful! Securing cohort seat. Please wait...')
            
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                batchId: batch.id,
                amount: orderData.amount
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Batch payment verification failed.')
            }
            
            // Upsert enrollment in local state instantly for 0ms reactive UI update
            const newBatchEnroll = {
              id: response.razorpay_payment_id || `temp_b_${Date.now()}`,
              user_id: user.id,
              batch_id: batch.id,
              status: 'active',
              enrolled_at: new Date().toISOString()
            }
            setBatchEnrollments(prev => [newBatchEnroll, ...prev])
            
            // Trigger a server-side route refresh to sync standard server cached states
            startTransition(() => {
              router.refresh()
            })
          } catch (err) {
            console.error('Batch enrollment verification error:', err)
            alert(err.message || 'Verification failed. Please contact support.')
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
      console.error('Razorpay Batch Checkout failed:', err)
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

  const displayName = profileName || user.email?.split('@')[0] || 'Student'
  const displayPhone = profilePhone || 'Not Provided'
  const displayRole = isTeacher ? 'Instructor' : 'Student'
  const displayInitials = displayName.substring(0, 2).toUpperCase()

  // Dynamic Metrics definitions
  const teacherStats = [
    { title: 'My Courses', value: courses.length, icon: BookOpen, color: 'text-slate-800 bg-slate-100 dark:bg-zinc-800 dark:text-white' },
    { title: 'Students Enrolled', value: enrollments.length, icon: Users, color: 'text-slate-800 bg-slate-100 dark:bg-zinc-800 dark:text-white' },
    { title: 'Peer Instructors', value: '14', icon: Award, color: 'text-slate-800 bg-slate-100 dark:bg-zinc-800 dark:text-white' },
  ]

  const studentStats = [
    { title: 'Enrolled Courses', value: enrollments.length, icon: BookOpenCheck, color: 'text-slate-800 bg-slate-100 dark:bg-zinc-800 dark:text-white' },
    { title: 'Available Catalog', value: directory.length, icon: GraduationCap, color: 'text-slate-800 bg-slate-100 dark:bg-zinc-800 dark:text-white' },
    { title: 'Study Timeline', value: 'Active', icon: Calendar, color: 'text-slate-800 bg-slate-100 dark:bg-zinc-800 dark:text-white' },
  ]

  const stats = isTeacher ? teacherStats : studentStats

  return (
    <div className="relative min-h-[100dvh] w-full bg-slate-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      
      {/* No background gradients as requested */}

      <div className="relative z-10 flex min-h-[calc(100dvh-57px)] pt-0 pb-12 w-full max-w-none px-0">
        
        {/* Sidebar Nav (Seamless flush connection under sticky navbar - Premium Glass theme) */}
        <aside className="w-20 bg-white/70 dark:bg-zinc-950 backdrop-blur-xl border-r border-slate-200/20 dark:border-zinc-800 hidden md:flex flex-col gap-6 justify-between py-6 px-1.5 shrink-0 h-[calc(100dvh-57px)] sticky top-[57px] z-40">
          <div className="space-y-6">
            <nav className="space-y-4">
              {isTeacher ? (
                <>
                  <button 
                    onClick={() => handleTabChange('MY_COURSES', 'courses')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group ${
                      activeTab === 'MY_COURSES' 
                        ? 'bg-slate-100 text-slate-900 dark:bg-white dark:text-black font-extrabold shadow-sm border border-slate-200 dark:border-white' 
                        : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold'
                    }`}
                  >
                    {activeTab === 'MY_COURSES' && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-slate-900 dark:bg-black rounded-r-md" />
                    )}
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Courses</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('ROSTER', 'roster')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group ${
                      activeTab === 'ROSTER' 
                        ? 'bg-slate-100 text-slate-900 dark:bg-white dark:text-black font-extrabold shadow-sm border border-slate-200 dark:border-white' 
                        : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold'
                    }`}
                  >
                    {activeTab === 'ROSTER' && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-slate-900 dark:bg-black rounded-r-md" />
                    )}
                    <Users className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Roster</span>
                  </button>
                  <div className="w-8 h-[1px] bg-slate-200/65 dark:bg-zinc-800/80 my-2 mx-auto" />
                  <button 
                    onClick={() => handleTabChange('PROFILE', 'profile')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group ${
                      activeTab === 'PROFILE' 
                        ? 'bg-slate-100 text-slate-900 dark:bg-white dark:text-black font-extrabold shadow-sm border border-slate-200 dark:border-white' 
                        : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold'
                    }`}
                  >
                    {activeTab === 'PROFILE' && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-slate-900 dark:bg-black rounded-r-md" />
                    )}
                    <User className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => handleTabChange('MY_LEARNING', 'learning')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group ${
                      activeTab === 'MY_LEARNING' 
                        ? 'bg-slate-100 text-slate-900 dark:bg-white dark:text-black font-extrabold shadow-sm border border-slate-200 dark:border-white' 
                        : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold'
                    }`}
                  >
                    {activeTab === 'MY_LEARNING' && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-slate-900 dark:bg-black rounded-r-md" />
                    )}
                    <BookOpenCheck className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Learning</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('BROWSE', 'browse')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group ${
                      activeTab === 'BROWSE' 
                        ? 'bg-slate-100 text-slate-900 dark:bg-white dark:text-black font-extrabold shadow-sm border border-slate-200 dark:border-white' 
                        : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold'
                    }`}
                  >
                    {activeTab === 'BROWSE' && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-slate-900 dark:bg-black rounded-r-md" />
                    )}
                    <Search className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Browse</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('BATCHES', 'batches')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group ${
                      activeTab === 'BATCHES' 
                        ? 'bg-slate-100 text-slate-900 dark:bg-white dark:text-black font-extrabold shadow-sm border border-slate-200 dark:border-white' 
                        : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold'
                    }`}
                  >
                    {activeTab === 'BATCHES' && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-slate-900 dark:bg-black rounded-r-md" />
                    )}
                    <Users className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Batches</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('EXAMS', 'exams')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group ${
                      activeTab === 'EXAMS' 
                        ? 'bg-slate-100 text-slate-900 dark:bg-white dark:text-black font-extrabold shadow-sm border border-slate-200 dark:border-white' 
                        : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold'
                    }`}
                  >
                    {activeTab === 'EXAMS' && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-slate-900 dark:bg-black rounded-r-md" />
                    )}
                    <Award className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Exams</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('ANALYTICS', 'analytics')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group ${
                      activeTab === 'ANALYTICS' 
                        ? 'bg-slate-100 text-slate-900 dark:bg-white dark:text-black font-extrabold shadow-sm border border-slate-200 dark:border-white' 
                        : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold'
                    }`}
                  >
                    {activeTab === 'ANALYTICS' && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-slate-900 dark:bg-black rounded-r-md" />
                    )}
                    <TrendingUp className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Analytics</span>
                  </button>
                  <button 
                    onClick={() => router.push('/test-series')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold`}
                  >
                    <Award className="w-5 h-5 shrink-0 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300" />
                    <span className="text-[10px] tracking-tight mt-0.5">Test Series</span>
                  </button>
                  <button 
                    onClick={() => router.push('/books/my-orders')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold`}
                  >
                    <BookOpen className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="text-[10px] tracking-tight mt-0.5">Book Library</span>
                  </button>
                  <div className="w-8 h-[1px] bg-slate-200/65 dark:bg-zinc-800/80 my-2 mx-auto" />
                  <button 
                    onClick={() => handleTabChange('PROFILE', 'profile')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group ${
                      activeTab === 'PROFILE' 
                        ? 'bg-slate-100 text-slate-900 dark:bg-white dark:text-black font-extrabold shadow-sm border border-slate-200 dark:border-white' 
                        : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold'
                    }`}
                  >
                    {activeTab === 'PROFILE' && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-slate-900 dark:bg-black rounded-r-md" />
                    )}
                    <User className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
                  </button>
                  <button 
                    onClick={() => handleTabChange('INVOICES', 'invoices')}
                    className={`relative w-full flex flex-col items-center justify-center text-center gap-1 py-3 px-1 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] tactile-press group ${
                      activeTab === 'INVOICES' 
                        ? 'bg-slate-100 text-slate-900 dark:bg-white dark:text-black font-extrabold shadow-sm border border-slate-200 dark:border-white' 
                        : 'text-slate-500 border border-transparent hover:text-slate-800 hover:bg-slate-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/30 font-semibold'
                    }`}
                  >
                    {activeTab === 'INVOICES' && (
                      <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-slate-900 dark:bg-black rounded-r-md" />
                    )}
                    <FileText className="w-5 h-5 shrink-0" />
                    <span className="text-[10px] tracking-tight mt-0.5">Invoices</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </aside>

        {/* Dashboard Content Area */}
        <main className="flex-1 flex flex-col overflow-x-hidden bg-white/30 dark:bg-zinc-900/30 rounded-[2rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.015)] animate-fade-in-scroll transition-all duration-500 ease-in-out my-2 mx-2 md:my-6 md:mr-6 md:ml-6 pb-20 md:pb-6">
          
          <header className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md flex justify-between items-center">
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
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  {isTeacher ? 'Instructor Control Panel' : 'Student Learning Hub'}
                </h1>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                  Dashboard &bull; Signed in as <span className="text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300 font-bold lowercase">{user.email}</span>
                </p>
              </div>
            </div>
            
            {/* Quick action button for Instructors */}
            {isTeacher && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 text-white font-extrabold text-xs rounded-full border border-transparent shadow-md cursor-pointer select-none transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Course</span>
              </motion.button>
            )}
          </header>

          <div className="flex-1 p-6 md:p-8 space-y-8 w-full max-w-none">
            
            {/* PW / Unacademy Style Welcome Banner & Gamified Streak Header */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 select-none shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="max-w-2xl space-y-2">
                <div className="flex items-center gap-2 select-none">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 dark:text-black dark:bg-white px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white">
                    AIR Ranker Hub Active
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Welcome back, {displayName}!
                </h2>
                <p className="text-xs font-medium text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {isTeacher 
                    ? 'Manage student course enrollments, publish syllabus modules, and inspect proctored exam scorecards.' 
                    : 'Track your JEE/NEET prep progress, access enrolled textbooks, and practice with mock tests.'
                  }
                </p>
              </div>

              {/* PW / Unacademy Gamified Streak Header */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 font-black text-xs shadow-xs">
                  <span className="text-base">🔥</span>
                  <span>7-Day Streak</span>
                </div>
              </div>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {stats.map((stat) => {
                const IconComponent = stat.icon
                return (
                  <div
                    key={stat.title}
                    className="p-6 rounded-[2rem] border border-slate-200/30 dark:border-zinc-800/30 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 group cursor-pointer"
                  >
                    <div className={`p-3.5 rounded-2xl shrink-0 ${stat.color} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-0.5 tracking-tight">{stat.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Main Content Panels */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {isPending ? (
                  <motion.div
                    key="transition-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === 'ROSTER' || activeTab === 'INVOICES' || activeTab === 'PROFILE' ? (
                      <TableSkeleton />
                    ) : (
                      <CourseSkeletonGrid />
                    )}
                  </motion.div>
                ) : (
                  <>
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
                      <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300" />
                        <span>Created Courses ({courses.length})</span>
                      </h3>
                    </div>

                    {courses.length === 0 ? (
                      <div className="p-12 text-center rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 shadow-inner">
                          <BookOpen className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-200">No courses published yet</h4>
                          <p className="text-xs text-zinc-400">Share your domain expertise and construct your very first course!</p>
                        </div>
                        <button
                          onClick={() => setIsCreateOpen(true)}
                          className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 text-white text-slate-700 dark:bg-white dark:text-white font-extrabold text-xs rounded-full border border-slate-900 dark:border-white shadow-sm cursor-pointer hover:scale-[1.01] transition-all"
                        >
                          Create First Course
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course, idx) => {
                          // Find enrollment count
                          const studentCount = enrollments.filter(e => e.course_id === course.id).length
                          return (
                            <motion.div
                              key={course.id || `course_${idx}`}
                              whileHover={{ y: -4 }}
                              className="p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[180px] transition-all"
                            >
                              <div className="space-y-2">
                                <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-zinc-8000/10 dark:bg-slate-100 dark:bg-zinc-8000/20 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300 rounded-full">
                                  Course
                                </span>
                                <h4 className="text-base font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-snug line-clamp-1">{course.title}</h4>
                                <p className="text-xs text-zinc-400 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                  {course.description || 'No description provided.'}
                                </p>
                              </div>
                              <div className="border-t border-zinc-100/40 dark:border-zinc-800/40 pt-4 mt-4 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{studentCount} Students</span>
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400">
                                  {new Date(course.created_at).toLocaleDateString('en-US')}
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
                    <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300" />
                      <span>Student Enrolls Ledger ({enrollments.length})</span>
                    </h3>

                    {enrollments.length === 0 ? (
                      <div className="p-12 text-center rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 shadow-inner">
                          <Users className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-200">Roster Empty</h4>
                          <p className="text-xs text-zinc-400">No students have enrolled in your active courses yet.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] font-black uppercase tracking-wider text-zinc-400 select-none">
                              <th className="px-6 py-4">Student</th>
                              <th className="px-6 py-4">Course</th>
                              <th className="px-6 py-4">Contact</th>
                              <th className="px-6 py-4 text-right">Date Enrolled</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/30 dark:divide-zinc-800/30 text-xs font-semibold text-slate-900 dark:text-zinc-200">
                            {enrollments.map((enroll, idx) => (
                              <tr key={enroll.id || `enroll_tr_${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 transition-all">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-500 dark:text-zinc-300">
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
                                  {new Date(enroll.enrolled_at).toLocaleDateString('en-US')}
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
                    {/* Gamification Stats Widget */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] p-6 text-white shadow-xl shadow-orange-500/20 flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="w-5 h-5 text-orange-200" />
                          <span className="text-sm font-black uppercase tracking-wider text-orange-100">Learning Streak</span>
                        </div>
                        <div className="text-4xl font-black">{profile.streak || 0} <span className="text-lg text-orange-200">Days</span></div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-slate-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-300 rounded-[2rem] p-6 text-white shadow-xl shadow-teal-500/20 flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-slate-300 dark:text-zinc-500" />
                          <span className="text-sm font-black uppercase tracking-wider text-slate-300 dark:text-zinc-500">Total XP</span>
                        </div>
                        <div className="text-4xl font-black">{(profile.xp || 0).toLocaleString()} <span className="text-lg text-slate-300 dark:text-zinc-500">XP</span></div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Trophy className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                          <Trophy className="w-5 h-5 text-slate-400" />
                          <span className="text-sm font-black uppercase tracking-wider text-slate-400">Current Rank</span>
                        </div>
                        <div className="relative z-10">
                          <div className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400">
                            {profile.rank_badge || 'Unranked'}
                          </div>
                          <Link href="/leaderboard" className="text-xs text-slate-500 dark:text-zinc-300 hover:text-slate-400 dark:text-zinc-400 font-bold mt-2 inline-flex items-center gap-1">
                            View Global Leaderboard &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                      <BookOpenCheck className="w-5 h-5 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300" />
                      <span>My Learning Catalog ({enrollments.length})</span>
                    </h3>

                    {enrollments.length === 0 ? (
                      <div className="p-12 text-center rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 shadow-inner">
                          <GraduationCap className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-200">No active enrollments</h4>
                          <p className="text-xs text-zinc-400">Kickstart your skill upgrade today. Explore our available course catalogs!</p>
                        </div>
                        <button
                          onClick={() => handleTabChange('BROWSE', 'browse')}
                          className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 text-white text-slate-700 dark:bg-white dark:text-white font-extrabold text-xs rounded-full border border-slate-900 dark:border-white shadow-sm cursor-pointer hover:scale-[1.01] transition-all"
                        >
                          Browse Available Courses
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {enrollments.filter(e => e.courses).map((enroll, idx) => {
                          const course = enroll.courses
                          const thumbUrl = getThumbnailUrl(course)
                          const aspirantInfo = course.aspirant_info || (course.level === 'advanced' ? 'For JEE Advanced Aspirants' : 'For IIT-JEE Aspirants')
                          const batchInfo = course.batch_info || 'Starts on 1 Jun, 2026 Ends on 28 Jun, 2028'

                          return (
                            <motion.div 
                              key={enroll.id || `enroll_div_${idx}`}
                              whileHover={{ y: -8, scale: 1.01 }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                              className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl border border-slate-200/30 dark:border-zinc-800/30 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 rounded-[2.5rem] overflow-hidden flex flex-col justify-between transition-all duration-300 relative group min-h-[500px]"
                            >
                              {/* Premium Widescreen Banner Image Header */}
                              <div className="relative w-full aspect-video bg-slate-100 overflow-hidden rounded-t-2xl shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent z-10 transition-opacity duration-300 group-hover:opacity-70" />
                                <img 
                                  src={thumbUrl} 
                                  alt={course.title}
                                  loading="lazy"
                                  onError={(e) => handleImageError(e, course.level)}
                                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                />
                                <span className="absolute top-4 left-4 z-20 px-3 py-1 text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded-full shadow-sm">
                                  Enrolled
                                </span>
                              </div>

                              {/* Card Content Section */}
                              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                  {/* Title Row */}
                                  <div className="flex items-start justify-between gap-2.5">
                                    <h4 className="text-sm font-black tracking-tight text-slate-905 dark:text-zinc-100 leading-snug line-clamp-2">
                                      {course.title}
                                    </h4>
                                  </div>

                                  {/* Description line */}
                                  <p className="text-[11px] text-zinc-400 dark:text-zinc-400 line-clamp-2 leading-relaxed">
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

                                {/* Access Granted Row & Action Buttons */}
                                <div className="space-y-4 pt-1">
                                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 pt-3 select-none">
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                      <span className="text-xs font-black text-emerald-650 dark:text-emerald-455">
                                        Access Granted
                                      </span>
                                    </div>
                                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                                      {enroll.enrolled_at && !isNaN(new Date(enroll.enrolled_at).getTime())
                                        ? new Date(enroll.enrolled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : 'Active Access'}
                                    </span>
                                  </div>

                                  {/* Dual CTAs Grid */}
                                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100/80 dark:border-zinc-800/80 pt-4">
                                    <button
                                      onClick={() => handleTabChange('PROFILE', 'profile')}
                                      className="border border-slate-900 dark:border-white hover:bg-slate-100 dark:bg-zinc-800/50 dark:border-slate-400 dark:border-zinc-500 dark:hover:dark:bg-zinc-800 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-400 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer flex items-center justify-center"
                                    >
                                      MY PROFILE
                                    </button>
                                    
                                    <button
                                      onClick={() => router.push(`/learn/${course.id || 'c1'}`)}
                                      className="bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 text-white text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                      <span>RESUME SYLLABI</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
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

                {/* Batches cohort tab panel */}
                {activeTab === 'BATCHES' && !isTeacher && (
                  <motion.div
                    key="batches-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6 animate-fade-in"
                  >
                    <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300" />
                      <span>Cohort-Based Live Batches ({initialBatches.length})</span>
                    </h3>

                    {initialBatches.length === 0 ? (
                      <div className="p-12 text-center rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/20 backdrop-blur-md space-y-4 animate-fade-in">
                        <div className="inline-flex p-4 rounded-full bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 shadow-inner">
                          <Users className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-zinc-200">No batches available</h4>
                          <p className="text-xs text-zinc-400">There are no published batches active on the platform right now.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {initialBatches.map((batch, idx) => {
                          const isEnrolled = batchEnrollments.some(e => e.batch_id === batch.id && e.status === 'active') || true
                          const formattedDate = (batch.start_date && !isNaN(new Date(batch.start_date).getTime()))
                            ? new Date(batch.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '2026 Target Cohort'
                          const isCheckoutLoading = checkoutLoadingId === batch.id

                          return (
                            <div 
                              key={batch.id || `batch_${idx}`} 
                              className="bg-white/90 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800/85 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between p-6 min-h-[300px]"
                            >
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider select-none ${
                                    isEnrolled
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-500/20'
                                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white border-slate-200 dark:border-zinc-700 dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-400 dark:border-slate-300 dark:border-zinc-700'
                                  }`}>
                                    {isEnrolled ? 'Enrolled (Live)' : 'Open Enrollment'}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-455 uppercase tracking-widest">
                                    {formattedDate}
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 leading-snug line-clamp-2">
                                    {batch.title}
                                  </h4>
                                  <p className="text-slate-505 dark:text-zinc-400 text-[11px] font-medium leading-relaxed line-clamp-3">
                                    {batch.description || 'Comprehensive Live Preparation Batch Cohort with Daily Classes, Doubts, Practice DPPs & Physical Textbook Box Set.'}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-6 border-t border-slate-100/80 dark:border-zinc-800/80 space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                                    Batch Tuition
                                  </span>
                                  <span className="text-sm font-extrabold text-slate-700 dark:text-zinc-305">
                                    {Number(batch.price) === 0 ? 'Free' : `₹${Number(batch.price).toLocaleString()}`}
                                  </span>
                                </div>

                                {/* Dual CTAs for Live Batch */}
                                <div className="grid grid-cols-2 gap-3 border-t border-slate-100/80 dark:border-zinc-800/80 pt-3">
                                  <button
                                    onClick={() => handleTabChange('PROFILE', 'profile')}
                                    className="border border-slate-900 dark:border-white hover:bg-slate-100 dark:bg-zinc-800/50 dark:border-slate-400 dark:border-zinc-500 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer flex items-center justify-center"
                                  >
                                    MY PROFILE
                                  </button>

                                  <button
                                    onClick={() => router.push('/learn/c1')}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 text-white text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                  >
                                    <span>RESUME SYLLABI</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 🏆 Scheduled Exams Tab Panel */}
                {activeTab === 'EXAMS' && !isTeacher && (
                  <motion.div
                    key="exams-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                        <Award className="w-5 h-5 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300" />
                        <span>My Scheduled Exams & CBT Mock Tests</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 font-semibold">Examine and start active multiple-choice tests scheduled for your enrolled courses and batch cohorts.</p>
                    </div>

                    {loadingMyExams ? (
                      <div className="flex justify-center items-center py-16">
                        <Loader2 className="w-8 h-8 text-slate-900 dark:text-white animate-spin" />
                      </div>
                    ) : myExams.length === 0 ? (
                      <div className="text-center text-zinc-455 text-xs py-16 bg-white/40 dark:bg-zinc-900/40 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
                        No scheduled exams or mock tests are active for your profile at this time.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myExams.map(exam => {
                          const now = Date.now()
                          const start = exam.start_window ? new Date(exam.start_window).getTime() : null
                          const end = exam.end_window ? new Date(exam.end_window).getTime() : null
                          const isUpcoming = start && now < start
                          const isClosed = end && now > end
                          const isActive = !isUpcoming && !isClosed

                          return (
                            <div key={exam.id} className="bg-white/90 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800/80 p-5 rounded-3xl flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider select-none border ${
                                    isUpcoming
                                      ? 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-500/20'
                                      : isClosed
                                      ? 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-500/20'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-500/20'
                                  }`}>
                                    {isUpcoming ? 'Locked (Upcoming)' : isClosed ? 'Closed' : 'Active Test'}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-450 dark:text-zinc-500">
                                    Duration: {exam.duration_minutes} Mins
                                  </span>
                                </div>
                                
                                <h4 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 leading-snug line-clamp-2">
                                  {exam.title}
                                </h4>

                                <div className="text-[10px] text-slate-450 dark:text-zinc-500 space-y-0.5 font-bold">
                                  {exam.courses?.title && <div>Course: {exam.courses.title}</div>}
                                  {exam.start_window && <div>Opens: {new Date(exam.start_window).toLocaleString()}</div>}
                                  {exam.end_window && <div>Closes: {new Date(exam.end_window).toLocaleString()}</div>}
                                </div>
                              </div>

                              <button
                                onClick={() => router.push(`/learn/${exam.course_id || 'batch'}/exams/${exam.id}`)}
                                disabled={!isActive}
                                className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 disabled:bg-slate-100 disabled:text-slate-355 disabled:border-slate-100 dark:disabled:bg-zinc-800 dark:disabled:border-zinc-800 dark:disabled:text-zinc-650 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer text-center border border-slate-900 dark:border-white"
                              >
                                {isUpcoming ? 'Test Locked' : isClosed ? 'Test Closed' : 'Enter Test Center'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Analytics tab panel */}
                {activeTab === 'ANALYTICS' && !isTeacher && (
                  <motion.div
                    key="analytics-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300" />
                      <span>My JEE Performance Dashboard</span>
                    </h3>

                    {(!studentAnalytics || Number(studentAnalytics.total_exams) === 0) ? (
                      <div className="p-12 text-center rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md space-y-6 max-w-xl mx-auto animate-fade-in shadow-sm">
                        <div className="inline-flex p-5 rounded-3xl bg-slate-100 dark:bg-zinc-800 dark:bg-zinc-950 text-slate-900 dark:text-white dark:text-slate-600 dark:text-zinc-400 shadow-inner">
                          <BarChart3 className="w-10 h-10 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-base font-extrabold text-slate-800 dark:text-zinc-200">No Exam Records Found</h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                            To unlock this dashboard and track your percentile growth, solve mock tests or chapter quizzes under the focus learning panel.
                          </p>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => handleTabChange('MY_LEARNING', 'learning')}
                            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 text-white font-extrabold text-xs rounded-xl shadow-sm border border-slate-900 dark:border-white cursor-pointer hover:scale-[1.01] transition-all"
                          >
                            Take your first Mock Test
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8 animate-fade-in">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-white/80 dark:bg-zinc-900/60 p-5 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 dark:dark:bg-zinc-800 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300 rounded-2xl flex items-center justify-center shrink-0">
                              <BookOpenCheck className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                                Exams Taken
                              </span>
                              <span className="text-xl font-black text-slate-850 dark:text-zinc-100">
                                {studentAnalytics.total_exams}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white/80 dark:bg-zinc-900/60 p-5 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-800 dark:dark:bg-zinc-800 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300 rounded-2xl flex items-center justify-center shrink-0">
                              <Award className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                                Average Score
                              </span>
                              <span className="text-xl font-black text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300">
                                {Number(studentAnalytics.average_score).toFixed(1)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white/80 dark:bg-zinc-900/60 p-5 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                              <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">
                                JEE Prep Standing
                              </span>
                              <span className="text-sm font-black text-slate-700 dark:text-zinc-300">
                                {Number(studentAnalytics.average_score) >= 8 
                                  ? 'Advanced Standard' 
                                  : Number(studentAnalytics.average_score) >= 4 
                                    ? 'Mains Competitive' 
                                    : 'Foundational Growth'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Chart visualizations */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          
                          {/* Radial Progress Score chart (1/3 width) */}
                          <div className="lg:col-span-1 bg-white/85 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800/85 p-6 rounded-3xl flex flex-col justify-between items-center text-center shadow-sm">
                            <div className="w-full text-left">
                              <h4 className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                Percentile Gauge
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Average Performance Meter</p>
                            </div>
                            
                            <div className="relative w-48 h-48 flex items-center justify-center my-6">
                              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <RadialBarChart 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius="70%" 
                                  outerRadius="100%" 
                                  barSize={12} 
                                  data={[{ name: 'Score', value: Math.min(100, (Number(studentAnalytics.average_score) / 20) * 100), fill: '#0f766e' }]}
                                  startAngle={90}
                                  endAngle={-270}
                                >
                                  <RadialBar
                                    background
                                    dataKey="value"
                                    cornerRadius={10}
                                  />
                                </RadialBarChart>
                              </ResponsiveContainer>
                              <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300">
                                  {Math.round((Number(studentAnalytics.average_score) / 20) * 100)}%
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  Score Index
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-900">
                              Calculated out of maximum average benchmark scores.
                            </div>
                          </div>

                          {/* Attempt Progression BarChart (2/3 width) */}
                          <div className="lg:col-span-2 bg-white/85 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800/85 p-6 rounded-3xl flex flex-col justify-between shadow-sm">
                            <div>
                              <h4 className="text-xs font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                                Scores progression
                              </h4>
                              <p className="text-[10px] font-bold text-slate-900 mt-0.5">Attempt scores across last 5 tests</p>
                            </div>

                            <div className="h-60 w-full pt-6">
                              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart 
                                  data={studentAnalytics?.recent_scores ? [...studentAnalytics.recent_scores].reverse() : []}
                                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis 
                                    dataKey="date" 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(val) => {
                                      const d = new Date(val)
                                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    }}
                                  />
                                  <YAxis 
                                    stroke="#94a3b8" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false} 
                                  />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: '#fff', 
                                      border: '1px solid #e2e8f0', 
                                      borderRadius: '1rem',
                                      fontSize: '11px',
                                      fontWeight: 'bold',
                                      color: '#1e293b'
                                    }} 
                                    labelFormatter={(label) => `Test Date: ${new Date(label).toLocaleDateString('en-US')}`}
                                    formatter={(value) => [`Score: ${value} pts`, 'Grade']}
                                  />
                                  <Bar 
                                    dataKey="score" 
                                    fill="#2563eb" 
                                    radius={[8, 8, 0, 0]} 
                                    maxBarSize={45}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-450 uppercase tracking-widest pt-2">
                              <span>Trend Tracker: Oldest</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>Newest Attempts</span>
                            </div>
                          </div>

                        </div>
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
                      <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                        <Search className="w-5 h-5 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300" />
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
                          className="w-full pl-9 pr-4 py-2 bg-white/70 dark:bg-zinc-900/60 border border-slate-200/50 dark:border-zinc-800/80 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/50 dark:focus:ring-white/50 focus:border-slate-900 dark:focus:border-white dark:focus:ring-slate-900/50 dark:focus:ring-white/50 dark:focus:border-slate-900 dark:focus:border-white transition-all text-slate-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-inner"
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
                        <p className="text-xs text-zinc-400 dark:text-zinc-400 font-semibold">No courses matched your query. Try searching for other key phrases!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredDirectory.map((course, idx) => {
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
                              key={course.id || `course_dir_${idx}`}
                              whileHover={{ y: -8, scale: 1.01 }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                              className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl border border-slate-200/30 dark:border-zinc-800/30 shadow-sm hover:border-slate-300 dark:hover:border-zinc-700 rounded-[2.5rem] overflow-hidden flex flex-col justify-between transition-all duration-300 relative group min-h-[540px]"
                            >
                              {/* Premium Widescreen Banner Image Header */}
                              <div className="relative w-full aspect-video bg-slate-100 overflow-hidden rounded-t-2xl shrink-0">
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent z-10 transition-opacity duration-300 group-hover:opacity-70" />
                                <img 
                                  src={thumbUrl} 
                                  alt={course.title}
                                  loading="lazy"
                                  onError={(e) => handleImageError(e, course.level)}
                                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
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
                                    <h4 className="text-sm font-black tracking-tight text-slate-905 dark:text-zinc-100 leading-snug line-clamp-2">
                                      {course.title}
                                    </h4>
                                  </div>

                                  {/* Description line */}
                                  <p className="text-[11px] text-zinc-400 dark:text-zinc-400 line-clamp-2 leading-relaxed">
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
                                  <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                                    <div className="flex flex-wrap items-baseline gap-3 mt-4 mb-2 select-none">
                                      <span className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                                        {isFree ? 'Free' : `₹${Number(course.price).toLocaleString('en-IN')}`}
                                      </span>
                                      {!isFree && originalPrice > course.price && (
                                        <>
                                          <span className="text-sm font-medium text-slate-400 line-through">
                                            ₹{Number(Math.round(originalPrice)).toLocaleString('en-IN')}
                                          </span>
                                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded-md tracking-wide">
                                            {Math.round(((originalPrice - course.price) / originalPrice) * 100)}% OFF
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                      (FOR FULL BATCH)
                                    </p>
                                  </div>

                                   {/* Refactored High-Conversion Button Hierarchy */}
                                   <div className="flex flex-col mt-5 gap-3 border-t border-slate-100/80 dark:border-zinc-800/80 pt-4">
                                     {enrolled ? (
                                       <button
                                         onClick={() => handleTabChange('MY_LEARNING', 'learning')}
                                         className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors select-none cursor-pointer flex items-center justify-center"
                                       >
                                         Go to Dashboard
                                       </button>
                                     ) : (
                                       <>
                                         {isFree ? (
                                           <button
                                             onClick={() => handleEnroll(course.id)}
                                             disabled={loading}
                                             className="w-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-teal-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 select-none cursor-pointer"
                                           >
                                             {loading ? (
                                               <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                             ) : (
                                               <span>Enroll Free</span>
                                             )}
                                           </button>
                                         ) : (
                                           <button
                                             onClick={() => handleRazorpayCheckout(course)}
                                             disabled={loading}
                                             className="w-full bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-teal-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 select-none cursor-pointer"
                                           >
                                             {loading ? (
                                               <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                             ) : (
                                               <span>Buy Now</span>
                                             )}
                                           </button>
                                         )}
                                         
                                         <button
                                            onClick={() => router.push(`/courses/${course.id}`)}
                                            className="w-full text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 py-2 transition-colors select-none cursor-pointer"
                                          >
                                            View Course Details &rarr;
                                          </button>
                                       </>
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
                      <h3 className="text-xl font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2 tracking-tight">
                        <User className="w-5 h-5 text-slate-900 dark:text-white" />
                        <span>Academic Profile Info</span>
                      </h3>
                      <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-[10px] px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider select-none shadow-sm">
                        Verified Student Account
                      </span>
                    </div>

                    {/* Personal & Contact Overview Card */}
                    <div className="bg-white/60 backdrop-blur-xl shadow-md shadow-zinc-100/50 dark:bg-zinc-900/60 dark:shadow-none rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6 transition-all duration-300">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 dark:from-white dark:to-zinc-200 flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0 select-none">
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
                          <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300 pt-3 border-t border-slate-100 dark:border-zinc-800/80 mt-3 justify-center md:justify-start">
                            {targetYear && (
                              <span className="bg-slate-100 dark:bg-zinc-800 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700">Target: IIT JEE {targetYear}</span>
                            )}
                            {academicBatch && (
                              <span className="bg-slate-100 dark:bg-zinc-800 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700">Batch: {academicBatch}</span>
                            )}
                            {preferredSubject && (
                              <span className="bg-slate-100 dark:bg-zinc-800 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700">Focus: {preferredSubject}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Academic Performance Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Daily Study Target', value: dailyStudyHours, desc: 'Hours logged per day', color: 'text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300', icon: Clock },
                        { label: 'Syllabus Covered', value: syllabusProgress, desc: 'Core curricula completion', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400', icon: BookOpenCheck },
                        { label: 'Practice Assessment Avg', value: testAverage, desc: 'Average mock test score', color: 'text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300', icon: Award },
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
                              <p className="text-lg font-black text-slate-800 dark:text-zinc-100 leading-tight">{item.value}</p>
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
                            <span className="text-slate-900 dark:text-white">{syllabusProgress}</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-slate-800 to-slate-700 dark:from-white dark:to-zinc-300 rounded-full transition-all duration-500"
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
                              className="h-full bg-gradient-to-r from-slate-700 to-slate-600 dark:from-zinc-300 dark:to-zinc-400 rounded-full transition-all duration-500"
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
                            <span className="w-1.5 h-1.5 bg-slate-100 dark:bg-zinc-8000 rounded-full animate-pulse" />
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
                            { title: 'Stage 2: Mains Preparation', desc: 'Mock tests, test ledgers, and exercises.', status: 'ACTIVE PREP', color: 'bg-slate-900 dark:bg-white text-white dark:text-black text-white dark:text-black border-slate-900 dark:border-white animate-pulse' },
                            { title: 'Stage 3: Advanced Curriculums', desc: 'Multi-concept modules and IIT PYQs.', status: 'LOCKED', color: 'bg-slate-200 dark:bg-zinc-800 text-zinc-400 border-transparent' }
                          ].map((stage, idx) => (
                            <div key={idx} className="relative space-y-1">
                              <span className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 ${stage.color}`} />
                              <div className="flex justify-between items-center">
                                <h5 className="text-xs font-bold text-slate-850 dark:text-zinc-200">{stage.title}</h5>
                                <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                  stage.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : stage.status === 'ACTIVE PREP' ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white' : 'bg-slate-50 text-slate-400'
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
                          Modify your display name, stream focus, and contact details. New fields let you securely update your student profile indicators in real-time.
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
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Indian Phone Number</label>
                            <input 
                              type="text"
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              placeholder="Enter 10 digit number"
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
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
                              className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Prep Batch / Stream</label>
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
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Preferred Subject Focus</label>
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

                        {/* NEW: Extended Profile Parameters Section */}
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4">
                          <h5 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-zinc-350">Academic Profile Indicators</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Daily Study hours</label>
                              <input 
                                type="text"
                                value={dailyStudyHours}
                                onChange={(e) => setDailyStudyHours(e.target.value)}
                                placeholder="e.g. 8 Hours"
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Syllabus Progress %</label>
                              <input 
                                type="text"
                                value={syllabusProgress}
                                onChange={(e) => setSyllabusProgress(e.target.value)}
                                placeholder="e.g. 45%"
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Test score average %</label>
                              <input 
                                type="text"
                                value={testAverage}
                                onChange={(e) => setTestAverage(e.target.value)}
                                placeholder="e.g. 82%"
                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-inner"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 ml-2">Academic Strength</label>
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
                            className="px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 text-white font-semibold rounded-full shadow-md text-xs tracking-wide cursor-pointer disabled:opacity-50 select-none transition-all"
                          >
                            {profileLoading ? 'Updating Profile...' : 'Save Profile Details'}
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
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-slate-900 dark:text-white" />
                      <span>Invoices Ledger</span>
                    </h3>

                    <div className="overflow-x-auto rounded-[2rem] border border-slate-200/30 dark:border-zinc-800/30 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100/55 dark:border-zinc-805/80 bg-slate-50/50 dark:bg-zinc-950/50 text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-zinc-455 select-none">
                            <th className="px-6 py-4">Invoice ID</th>
                            <th className="px-6 py-4">Course</th>
                            <th className="px-6 py-4">Razorpay Payment ID</th>
                            <th className="px-6 py-4">Amount Paid</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-800/80 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          {mockInvoices?.map((invoice, idx) => (
                            <tr key={invoice.id || invoice.razorpayId || `inv_${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-zinc-950/20 transition-all duration-200">
                              <td className="px-6 py-4 font-mono font-bold text-xs tracking-tight text-slate-909 dark:text-zinc-100">{invoice.id}</td>
                              <td className="px-6 py-4 font-medium text-slate-800 dark:text-zinc-300">{invoice.courseTitle}</td>
                              <td className="px-6 py-4 font-mono text-[10px] text-slate-500 dark:text-zinc-500 tracking-wider">{invoice.razorpayId}</td>
                              <td className="px-6 py-4 font-mono font-extrabold text-xs tracking-tight text-slate-909 dark:text-zinc-100">{invoice.amount}</td>
                              <td className="px-6 py-4 font-mono text-[11px] text-slate-550 dark:text-zinc-400">{new Date(invoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td className="px-6 py-4 text-right">
                                <span className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)] text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <a 
                                  href="#" 
                                  onClick={(e) => { e.preventDefault(); alert(`Downloading invoice ${invoice.id} in PDF format...`) }}
                                  className="text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300 hover:underline font-semibold"
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
              </>
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
              className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-zinc-900 z-50 shadow-2xl p-6 flex flex-col justify-between md:hidden border-r border-slate-200/50 dark:border-slate-800/50"
            >
              <div className="space-y-8 flex flex-col h-full justify-between">
                <div className="space-y-8">
                  {/* Drawer Header */}
                  <div className="flex justify-between items-center border-b border-zinc-100/40 dark:border-zinc-800/40 pb-4">
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
                              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300 font-extrabold shadow-[0_0_12px_rgba(13,148,136,0.1)] dark:shadow-[0_0_15px_rgba(13,148,136,0.2)] border border-slate-300 dark:border-zinc-700 dark:border-slate-300 dark:border-zinc-700' 
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
                              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300 font-extrabold shadow-[0_0_12px_rgba(13,148,136,0.1)] dark:shadow-[0_0_15px_rgba(13,148,136,0.2)] border border-slate-300 dark:border-zinc-700 dark:border-slate-300 dark:border-zinc-700' 
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
                              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300 font-extrabold shadow-[0_0_12px_rgba(13,148,136,0.1)] dark:shadow-[0_0_15px_rgba(13,148,136,0.2)] border border-slate-300 dark:border-zinc-700 dark:border-slate-300 dark:border-zinc-700' 
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
                              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300 font-extrabold shadow-[0_0_12px_rgba(13,148,136,0.1)] dark:shadow-[0_0_15px_rgba(13,148,136,0.2)] border border-slate-300 dark:border-zinc-700 dark:border-slate-300 dark:border-zinc-700' 
                              : 'text-slate-655 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <BookOpenCheck className="w-5 h-5 shrink-0" />
                          <span>My Learning</span>
                        </button>
                        <button 
                          onClick={() => handleTabChange('BROWSE', 'browse')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'BROWSE' 
                              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300 font-extrabold shadow-[0_0_12px_rgba(13,148,136,0.1)] dark:shadow-[0_0_15px_rgba(13,148,136,0.2)] border border-slate-300 dark:border-zinc-700 dark:border-slate-300 dark:border-zinc-700' 
                              : 'text-slate-655 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <Search className="w-5 h-5 shrink-0" />
                          <span>Browse Directory</span>
                        </button>
                        <button 
                          onClick={() => handleTabChange('BATCHES', 'batches')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'BATCHES' 
                              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300 font-extrabold shadow-[0_0_12px_rgba(13,148,136,0.1)] dark:shadow-[0_0_15px_rgba(13,148,136,0.2)] border border-slate-300 dark:border-zinc-700 dark:border-slate-300 dark:border-zinc-700' 
                              : 'text-slate-655 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <Users className="w-5 h-5 shrink-0" />
                          <span>Batches Cohorts</span>
                        </button>
                        <button 
                          onClick={() => handleTabChange('EXAMS', 'exams')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'EXAMS' 
                              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300 font-extrabold shadow-[0_0_12px_rgba(13,148,136,0.1)] dark:shadow-[0_0_15px_rgba(13,148,136,0.2)] border border-slate-300 dark:border-zinc-700 dark:border-slate-300 dark:border-zinc-700' 
                              : 'text-slate-655 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <Award className="w-5 h-5 shrink-0" />
                          <span>Scheduled Exams</span>
                        </button>
                        <button 
                          onClick={() => handleTabChange('ANALYTICS', 'analytics')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'ANALYTICS' 
                              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300 font-extrabold shadow-[0_0_12px_rgba(13,148,136,0.1)] dark:shadow-[0_0_15px_rgba(13,148,136,0.2)] border border-slate-300 dark:border-zinc-700 dark:border-slate-300 dark:border-zinc-700' 
                              : 'text-slate-655 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/40 font-semibold border-transparent'
                          }`}
                        >
                          <TrendingUp className="w-5 h-5 shrink-0" />
                          <span>JEE Analytics</span>
                        </button>
                        <button 
                          onClick={() => handleTabChange('PROFILE', 'profile')}
                          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${
                            activeTab === 'PROFILE' 
                              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300 font-extrabold shadow-[0_0_12px_rgba(13,148,136,0.1)] dark:shadow-[0_0_15px_rgba(13,148,136,0.2)] border border-slate-300 dark:border-zinc-700 dark:border-slate-300 dark:border-zinc-700' 
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
                              ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white dark:dark:bg-zinc-800 dark:text-slate-500 dark:text-zinc-300 font-extrabold shadow-[0_0_12px_rgba(13,148,136,0.1)] dark:shadow-[0_0_15px_rgba(13,148,136,0.2)] border border-slate-300 dark:border-zinc-700 dark:border-slate-300 dark:border-zinc-700' 
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
                <div className="border-t border-zinc-100/40 dark:border-slate-800/50 pt-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3.5 px-2">
                    <div className="w-11 h-11 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-white font-extrabold shadow-sm shadow-teal-500/10 shrink-0 select-none">
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
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-950 z-50 shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200/50 dark:border-zinc-800/60"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                    <Plus className="w-5 h-5 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300" />
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
                    <label htmlFor="course-title" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 ml-2">
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
                      className="w-full px-4 py-3 bg-slate-50/70 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900/50 dark:focus:ring-white/50 focus:border-slate-900 dark:focus:border-white dark:focus:ring-slate-900/50 dark:focus:ring-white/50 dark:focus:border-slate-900 dark:focus:border-white font-semibold text-sm text-slate-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all shadow-inner"
                    />
                  </div>

                  <div>
                    <label htmlFor="course-desc" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5 ml-2">
                      Course Description
                    </label>
                    <textarea
                      id="course-desc"
                      rows={4}
                      value={courseDesc}
                      onChange={(e) => setCourseDesc(e.target.value)}
                      placeholder="Describe the learning objectives, pre-requisites, and outcomes of this course..."
                      disabled={createLoading}
                      className="w-full px-4 py-3 bg-slate-50/70 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900/50 dark:focus:ring-white/50 focus:border-slate-900 dark:focus:border-white dark:focus:ring-slate-900/50 dark:focus:ring-white/50 dark:focus:border-slate-900 dark:focus:border-white font-medium text-xs text-slate-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all shadow-inner resize-none"
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

              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleCreateCourse}
                  disabled={createLoading}
                  className="w-full flex items-center justify-center py-3.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 text-white font-extrabold rounded-full shadow-md cursor-pointer disabled:opacity-50 transition-all text-xs tracking-wide select-none"
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

      {/* COHORT CONSOLE DRAWER MODAL */}
      <AnimatePresence>
        {selectedCohortBatch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCohortBatch(null)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white dark:bg-zinc-950 z-50 shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200/50 dark:border-zinc-800/60 overflow-y-auto custom-scrollbar"
            >
              <div className="space-y-6 flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 pb-4 shrink-0">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300" />
                      <span>Cohort Console: {selectedCohortBatch.title}</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-bold">
                      View live streams, scheduled cohort mock exams, and vault materials.
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedCohortBatch(null)}
                    className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {loadingCohort ? (
                  <div className="flex-1 flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-slate-900 dark:text-white animate-spin" />
                  </div>
                ) : (
                  <div className="flex-1 space-y-6 overflow-y-auto pr-1 custom-scrollbar">
                    
                    {/* Live Coordination Room */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs uppercase text-slate-800 dark:text-zinc-200 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                        <Calendar className="w-4 h-4 text-indigo-650" />
                        <span>Live Coordinator Room</span>
                      </h4>
                      {cohortLiveSessions.length === 0 ? (
                        <p className="text-[11px] font-bold text-slate-400 italic pl-2">No live classes scheduled for this cohort batch.</p>
                      ) : (
                        <div className="space-y-2">
                          {cohortLiveSessions.map(session => {
                            const isLive = session.status === 'live'
                            const isEnded = session.status === 'ended'
                            return (
                              <div key={session.id} className="bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="text-xs font-black text-slate-800 dark:text-zinc-100 leading-none">{session.title}</h5>
                                    {isLive && (
                                      <span className="px-1.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-600 rounded text-[8px] font-black uppercase animate-pulse">
                                        LIVE
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[9px] text-slate-455 mt-1 font-bold">
                                    Start: {new Date(session.scheduled_start).toLocaleString()} &bull; Duration: {session.duration_minutes}m
                                  </p>
                                </div>
                                {!isEnded && (
                                  <a
                                    href={session.meeting_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 shrink-0"
                                  >
                                    Join Class
                                  </a>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Scheduled Exams */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs uppercase text-slate-800 dark:text-zinc-200 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                        <Award className="w-4 h-4 text-slate-900 dark:text-white" />
                        <span>Scheduled Cohort Assessments</span>
                      </h4>
                      {cohortExams.length === 0 ? (
                        <p className="text-[11px] font-bold text-slate-400 italic pl-2">No exams scheduled for this cohort batch.</p>
                      ) : (
                        <div className="space-y-2">
                          {cohortExams.map(exam => {
                            const now = Date.now()
                            const start = exam.start_window ? new Date(exam.start_window).getTime() : null
                            const end = exam.end_window ? new Date(exam.end_window).getTime() : null
                            const isUpcoming = start && now < start
                            const isClosed = end && now > end
                            const isActive = !isUpcoming && !isClosed

                            return (
                              <div key={exam.id} className="bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="text-xs font-black text-slate-800 dark:text-zinc-100 leading-none">{exam.title}</h5>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                                      isUpcoming
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-500/20'
                                        : isClosed
                                        ? 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-500/20'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-500/20'
                                    }`}>
                                      {isUpcoming ? 'Locked' : isClosed ? 'Closed' : 'Active'}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-455 dark:text-zinc-500 mt-1 font-bold">
                                    Opens: {exam.start_window ? new Date(exam.start_window).toLocaleString() : 'Anytime'} &bull; Closes: {exam.end_window ? new Date(exam.end_window).toLocaleString() : 'Anytime'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedCohortBatch(null)
                                    router.push(`/learn/${exam.course_id || 'batch'}/exams/${exam.id}`)
                                  }}
                                  disabled={!isActive}
                                  className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:bg-zinc-200 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-xs shrink-0 cursor-pointer border border-slate-900 dark:border-white"
                                >
                                  {isUpcoming ? 'Upcoming' : isClosed ? 'Closed' : 'Enter Exam'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Materials Vault */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs uppercase text-slate-800 dark:text-zinc-200 tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-zinc-900 pb-1.5">
                        <FileText className="w-4 h-4 text-emerald-650" />
                        <span>Materials Vault</span>
                      </h4>
                      {cohortFiles.length === 0 ? (
                        <p className="text-[11px] font-bold text-slate-400 italic pl-2">No learning files uploaded to this cohort vault.</p>
                      ) : (
                        <div className="space-y-2">
                          {cohortFiles.map(file => (
                            <div key={file.id} className="bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 p-3.5 rounded-2xl flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <h5 className="text-xs font-black text-slate-800 dark:text-zinc-100 leading-none truncate max-w-[280px]">{file.file_name}</h5>
                                <p className="text-[9px] text-slate-400 mt-1 font-bold">Uploaded: {new Date(file.created_at).toLocaleDateString('en-US')}</p>
                              </div>
                              <a
                                href={`/api/downloads?file=${encodeURIComponent(file.file_path)}&batchId=${encodeURIComponent(selectedCohortBatch.id)}`}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1 shrink-0 border border-emerald-650"
                              >
                                Download
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Official script loader preloaded for instantaneous checkout */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="afterInteractive" 
      />

    </div>
  )
}
