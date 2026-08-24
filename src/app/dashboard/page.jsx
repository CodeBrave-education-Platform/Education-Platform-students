import * as React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { redisGet, redisSet } from '@/utils/redis'
import DashboardClient from './DashboardClient'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Student & Faculty Command Dashboard | Asentra Education',
  description: 'Manage your enrolled courses, live cohorts, scheduled tests, and performance diagnostics.'
}

export default async function DashboardPage(props) {
  const searchParams = await props.searchParams
  const checkoutCourseId = searchParams?.checkout || null
  const supabase = await createClient()

  // Retrieve authenticated user session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/dashboard')
  }

  // Retrieve matching profile
  let { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (fetchError) {
    console.error('[DASHBOARD PAGE] Error fetching profile:', fetchError)
  }

  // Graceful fallback if profile wasn't created yet (e.g., fast OAuth completion)
  if (!profile) {
    const defaultName = user.email?.split('@')[0] || 'Student'
    const defaultRole = 'student'
    
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: defaultName,
        role: defaultRole
      })
      .select()
      .single()

    if (!profileError && newProfile) {
      profile = newProfile
    } else {
      profile = {
        id: user.id,
        email: user.email,
        full_name: defaultName,
        role: defaultRole
      }
    }
  }

  const role = profile.role || 'student'
  
  let initialCourses = []
  let initialEnrollments = []
  let allCourses = []

  if (role === 'teacher') {
    // 1. Fetch courses created by this instructor
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })
      
    initialCourses = coursesData || []

    // 2. Fetch students enrolled in courses created by this instructor
    const { data: enrollsData } = await supabase
      .from('enrollments')
      .select('id, enrolled_at, course_id, user_id, courses!inner(instructor_id, title), profiles!user_id(full_name, email, phone)')
      .eq('courses.instructor_id', user.id)
      
    initialEnrollments = enrollsData || []
  } else {
    // 1. Fetch courses the student is enrolled in
    const { data: enrollsData, error: enrollsError } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('user_id', user.id)
      
    if (enrollsError) {
      console.error('DASHBOARD ENROLLMENTS FETCH ERROR:', enrollsError)
    }
    initialEnrollments = enrollsData || []

    // 2. Fetch all courses in the platform for browsing
    let coursesData = null
    const cached = await redisGet('asentra:course:catalog')
    if (cached) {
      coursesData = typeof cached === 'string' ? JSON.parse(cached) : cached
    }

    if (!coursesData) {
      const { data, error: coursesError } = await supabase
        .from('courses')
        .select('*, profiles(full_name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (coursesError) {
        console.error('DASHBOARD COURSES FETCH ERROR:', coursesError)
      }
      coursesData = data || []

      if (coursesData.length > 0) {
        await redisSet('asentra:course:catalog', JSON.stringify(coursesData), { ex: 30 })
      }
    }
    allCourses = coursesData || []
  }

  // Fetch hybrid cohorts and secure statistics aggregates
  let initialBatches = []
  let initialBatchEnrollments = []
  let studentAnalytics = null

  if (role !== 'teacher') {
    const { data: batchesData } = await supabase
      .from('batches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    const { data: batchEnrollsData } = await supabase
      .from('batch_enrollments')
      .select('*')
      .eq('user_id', user.id)

    const { data: analyticsData } = await supabase
      .rpc('get_student_analytics', { student_id: user.id })

    initialBatches = batchesData || []
    initialBatchEnrollments = batchEnrollsData || []
    studentAnalytics = analyticsData || null

    // Calculate dynamic academic metrics from real database rows
    let calculatedTestAverage = '0%'
    let calculatedWeeklyTests = '0 tests'
    let calculatedSyllabus = '0%'

    try {
      const { data: userAttempts } = await supabase
        .from('test_attempts')
        .select('score, total_marks, completed_at')
        .eq('user_id', user.id)

      if (userAttempts && userAttempts.length > 0) {
        const validScores = userAttempts.filter(a => a.total_marks > 0)
        if (validScores.length > 0) {
          const avgPct = Math.round(validScores.reduce((acc, a) => acc + ((a.score / a.total_marks) * 100), 0) / validScores.length)
          calculatedTestAverage = `${avgPct}%`
        }
        calculatedWeeklyTests = `${userAttempts.length} tests completed`
      }

      // Calculate syllabus progress %
      const { data: progressRows } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true)

      const completedLessonsCount = progressRows ? progressRows.length : 0
      const enrolledCourseIds = initialEnrollments.map(e => e.course_id).filter(Boolean)
      
      if (enrolledCourseIds.length > 0) {
        const { count: totalLessonsCount } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .in('course_id', enrolledCourseIds)

        if (totalLessonsCount && totalLessonsCount > 0) {
          const pct = Math.min(100, Math.round((completedLessonsCount / totalLessonsCount) * 100))
          calculatedSyllabus = `${pct}%`
        }
      }
    } catch (metricErr) {
      console.error('[DASHBOARD METRICS ERROR]:', metricErr)
    }

    // Inject genuine calculated metrics into profile object
    profile = {
      ...profile,
      daily_study_hours: profile.daily_study_hours || '8 Hours',
      syllabus_progress: calculatedSyllabus !== '0%' ? calculatedSyllabus : (profile.syllabus_progress || '0%'),
      test_average: calculatedTestAverage !== '0%' ? calculatedTestAverage : (profile.test_average || '0%'),
      weekly_tests_attempted: calculatedWeeklyTests !== '0 tests' ? calculatedWeeklyTests : (profile.weekly_tests_attempted || '0 tests/week'),
      academic_strengths: profile.academic_strengths || (profile.preferred_subject ? `${profile.preferred_subject} Focus` : 'Physics & Mathematics')
    }
  }

  const phoneNumber = user.user_metadata?.phone_number || user.phone || 'Not Provided'

  let dbInvoices = []
  if (role !== 'teacher') {
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*, courses(title), batches(title), test_packages(title)')
      .eq('user_id', user.id)
      .order('invoice_date', { ascending: false })

    if (invoicesError) {
      console.error('[DASHBOARD INVOICES ERROR]:', invoicesError)
    }

    if (invoicesData) {
      dbInvoices = invoicesData.map(inv => ({
        id: inv.id ? inv.id.slice(0, 8).toUpperCase() : 'INV-REC',
        courseTitle: inv.courses?.title || inv.batches?.title || inv.test_packages?.title || 'Academic Program Access',
        razorpayId: inv.razorpay_payment_id || 'N/A',
        amount: Number(inv.amount_paid) === 0 ? 'Free' : `₹${Number(inv.amount_paid).toLocaleString('en-IN')}`,
        currency: inv.currency || 'INR',
        date: inv.invoice_date || new Date().toISOString().split('T')[0],
        status: inv.status === 'captured' || inv.status === 'success' ? 'Paid' : (inv.status || 'Paid')
      }))
    }
  }

  return (
    <>
      <Navbar user={user} profile={profile} />
      <DashboardClient 
        user={user} 
        profile={profile} 
        initialCourses={initialCourses}
        initialEnrollments={initialEnrollments}
        allCourses={allCourses}
        mockInvoices={dbInvoices}
        phoneNumber={phoneNumber}
        checkoutCourseId={checkoutCourseId}
        initialBatches={initialBatches}
        initialBatchEnrollments={initialBatchEnrollments}
        studentAnalytics={studentAnalytics}
      />
    </>
  )
}
