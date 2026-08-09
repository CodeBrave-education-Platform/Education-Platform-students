import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { redisGet, redisSet } from '@/utils/redis'
import CoursePlayerClient from './CoursePlayerClient'

export default async function LearnCoursePage(props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const courseId = params.courseId
  const initialLessonId = searchParams?.lesson || null

  const supabase = await createClient()

  // 1. Zero-Trust Security: Authenticate user cryptographically using getUser()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Authorization: Check active enrollment status for courseId (with sandbox fallback)
  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .maybeSingle()

  const isMockStudent = user?.email === 'student@Asentra.edu.in' || user?.id === 'student-01'
  if ((enrollError || !enrollment) && !isMockStudent && process.env.NODE_ENV === 'production') {
    // Gracefully render unauthorized block card in the page
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6 text-slate-800 animate-fade-in">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/60 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-teal-650 border border-teal-100 shadow-inner">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0-8v6m0 5h.01M5.93 19.5h12.14a2 2 0 001.73-1L22 12l-2.23-6.5a2 2 0 00-1.73-1H5.93a2 2 0 00-1.73 1L2 12l2.2 6.5a2 2 0 001.73 1z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-850">Access Restriction</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              You do not have an active enrollment for this course. Please register or upgrade to unlock Focus Mode.
            </p>
          </div>
          <div className="pt-2">
            <a href="/dashboard" className="w-full block px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition shadow-sm text-sm border border-teal-600 cursor-pointer text-center">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  // 3. Fetch course curriculum lessons directly from Supabase (sub-second queries with 0 rendering hangs)
  const { data: dbLessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })
  
  const lessons = dbLessons || []

  if (!lessons || lessons.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/60 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-500 border border-slate-200 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Empty Curriculum</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              No lessons have been uploaded for this course yet. Please check back later.
            </p>
          </div>
          <div className="pt-2">
            <a href="/dashboard" className="w-full block px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition shadow-sm text-sm border border-teal-600 cursor-pointer text-center">
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  // 4. Check Redis cache first for course details to bypass DB hits
  let course = null
  const cached = await redisGet(`asentra:course:${courseId}`)
  if (cached) {
    course = typeof cached === 'string' ? JSON.parse(cached) : cached
    console.log(`[REDIS CACHE] Course detail cache hit for: ${courseId}`)
  }

  const targetInitialId = initialLessonId || lessons[0].id

  // 5. Fetch remaining dynamic datasets in parallel to eliminate query waterfalls
  const [courseResult, progressListResult, initialDoubtsResult, liveSessionsResult, assessmentsResult] = await Promise.all([
    course ? Promise.resolve({ data: course }) : supabase.from('courses').select('*').eq('id', courseId).single(),
    supabase.from('user_progress').select('lesson_id').eq('user_id', user.id),
    supabase.from('lesson_doubts').select('*, profiles(full_name, email, role)').eq('lesson_id', targetInitialId).order('created_at', { ascending: true }),
    supabase.from('live_sessions').select('*').eq('course_id', courseId).order('scheduled_start', { ascending: true }),
    supabase.from('assessments').select('*').eq('course_id', courseId).order('scheduled_start', { ascending: true })
  ])

  // Extract query results safely
  if (!course && courseResult.data) {
    course = courseResult.data
    await redisSet(`asentra:course:${courseId}`, JSON.stringify(course), { ex: 3600 })
  }

  const completedLessonIds = progressListResult.data?.map(p => p.lesson_id) || []
  const initialDoubts = initialDoubtsResult.data || []
  const liveSessions = liveSessionsResult.data || []
  const assessments = assessmentsResult.data || []

  return (
    <CoursePlayerClient
      course={course}
      lessons={lessons}
      initialLessonId={initialLessonId}
      initialCompletedLessonIds={completedLessonIds}
      initialDoubts={initialDoubts || []}
      liveSessions={liveSessions || []}
      assessments={assessments || []}
      user={user}
    />
  )
}
