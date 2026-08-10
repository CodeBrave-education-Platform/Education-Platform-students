import * as React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { redisGet, redisSet } from '@/utils/redis'
import DashboardClient from './DashboardClient'
import Navbar from '@/components/Navbar'

export default async function DashboardPage(props) {
  const searchParams = await props.searchParams
  const checkoutCourseId = searchParams?.checkout || null
  const supabase = await createClient()

  // Retrieve authenticated user session
  const { data: { user } } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  console.log('[DASHBOARD DEBUG] User:', user ? user.id : 'null')
  console.log('[DASHBOARD DEBUG] All cookies:', cookieStore.getAll().map(c => c.name))

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-900 p-8 rounded-xl max-w-md w-full border border-red-200">
          <h1 className="text-xl font-bold mb-4">Diagnostic Auth Error</h1>
          <p className="mb-4">The dashboard received your request, but the server component could not find a valid user session.</p>
          <div className="bg-black/10 p-4 rounded font-mono text-xs overflow-x-auto mb-4">
            <p><strong>Cookies Received:</strong> {cookieStore.getAll().map(c => c.name).join(', ') || 'None'}</p>
            <p><strong>Time:</strong> {new Date().toISOString()}</p>
          </div>
          <p className="text-sm opacity-80">Please copy this screen and send it to JARVIS.</p>
        </div>
      </div>
    )
  }

  // Retrieve matching profile
  let { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

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
      .select('id, enrolled_at, course_id, user_id, courses!inner(instructor_id, title), profiles(full_name, email, phone)')
      .eq('courses.instructor_id', user.id)
      
    initialEnrollments = enrollsData || []
  } else {
    // 1. Fetch courses the student is enrolled in
    const { data: enrollsData, error: enrollsError } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('user_id', user.id)
      
    if (enrollsError) {
      console.error('DASHBOARD ENROLLMENTS FETCH ERROR:', JSON.stringify(enrollsError), 'MSG:', enrollsError.message, 'CODE:', enrollsError.code)
    }
    initialEnrollments = enrollsData || []

    // 2. Fetch all courses in the platform (with instructor full name) for browsing
    let coursesData = null
    const cached = await redisGet('asentra:course:catalog')
    if (cached) {
      coursesData = typeof cached === 'string' ? JSON.parse(cached) : cached
      console.log('[REDIS CACHE] Course catalog cache hit!')
    }

    if (!coursesData) {
      const { data, error: coursesError } = await supabase
        .from('courses')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
      
      if (coursesError) {
        console.error('DASHBOARD COURSES FETCH ERROR:', JSON.stringify(coursesError), 'MSG:', coursesError.message, 'CODE:', coursesError.code)
      }
      coursesData = data || []

      if (coursesData.length > 0) {
        await redisSet('asentra:course:catalog', JSON.stringify(coursesData), { ex: 3600 })
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
      .eq('status', 'published')
      .order('start_date', { ascending: true })

    const { data: batchEnrollsData } = await supabase
      .from('batch_enrollments')
      .select('*')
      .eq('user_id', user.id)

    const { data: analyticsData } = await supabase
      .rpc('get_student_analytics', { student_id: user.id })

    initialBatches = batchesData || []
    initialBatchEnrollments = batchEnrollsData || []
    studentAnalytics = analyticsData || null
  }

  const phoneNumber = user.user_metadata?.phone_number || user.phone || 'Not Provided'

  let dbInvoices = []
  if (role !== 'teacher') {
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*, courses(title), batches(title)')
      .order('invoice_date', { ascending: false })

    if (invoicesData) {
      dbInvoices = invoicesData.map(inv => ({
        id: inv.id.slice(0, 8).toUpperCase(),
        courseTitle: inv.courses?.title || inv.batches?.title || 'Hybrid Cohort Batch Access',
        razorpayId: inv.razorpay_payment_id,
        amount: inv.amount_paid === 0 ? 'Free' : `₹${inv.amount_paid.toLocaleString('en-IN')}`,
        currency: inv.currency || 'INR',
        date: inv.invoice_date,
        status: inv.status === 'captured' ? 'Paid' : (inv.status || 'Paid')
      }))
    }
  }

  const mockInvoices = [
    {
      id: 'inv-1001',
      courseTitle: 'Foundations of Mathematics & Algebra',
      razorpayId: 'pay_Nsh721Hhs812',
      amount: 'Free',
      currency: 'INR',
      date: '2026-04-10',
      status: 'Paid'
    },
    {
      id: 'inv-1002',
      courseTitle: 'IIT JEE Mains Mastery: Physics & Chemistry',
      razorpayId: 'pay_Osk192Jks921',
      amount: '₹4,999',
      currency: 'INR',
      date: '2026-05-15',
      status: 'Paid'
    }
  ]

  const finalInvoices = [...dbInvoices, ...mockInvoices]

  return (
    <>
      <Navbar user={user} profile={profile} />
      <DashboardClient 
        user={user} 
        profile={profile} 
        initialCourses={initialCourses}
        initialEnrollments={initialEnrollments}
        allCourses={allCourses}
        mockInvoices={finalInvoices}
        phoneNumber={phoneNumber}
        checkoutCourseId={checkoutCourseId}
        initialBatches={initialBatches}
        initialBatchEnrollments={initialBatchEnrollments}
        studentAnalytics={studentAnalytics}
      />
    </>
  )
}
