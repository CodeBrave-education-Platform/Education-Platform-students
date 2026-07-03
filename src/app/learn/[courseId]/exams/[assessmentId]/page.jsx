import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { redisGet, redisSet } from '@/utils/redis'
import ExamClient from './ExamClient'
import { startAssessmentAttemptAction } from './actions'
import { BookOpen, Clock, FileText, ChevronRight, HelpCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ExamPage(props) {
  const params = await props.params
  const courseId = params.courseId
  const assessmentId = params.assessmentId

  const supabase = await createClient()

  // 1. Zero-Trust Security: Authenticate user cryptographically using getUser()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch assessment configurations
  let assessment = null
  const cached = await redisGet(`asentra:exam:${assessmentId}`)
  if (cached) {
    assessment = typeof cached === 'string' ? JSON.parse(cached) : cached
    console.log(`[REDIS CACHE] Assessment cache hit for: ${assessmentId}`)
  }

  if (!assessment) {
    const { data, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .maybeSingle()
    
    if (assessmentError || !data) {
      redirect('/dashboard?error=assessment-not-found')
    }
    assessment = data

    await redisSet(`asentra:exam:${assessmentId}`, JSON.stringify(assessment), { ex: 3600 })
  }

  // 3. Authorization: Check enrollment status based on assessment links
  let enrollment = null
  let enrollError = null
  let course = null

  if (assessment.batch_id) {
    // Check batch enrollment
    const { data, error } = await supabase
      .from('batch_enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('batch_id', assessment.batch_id)
      .eq('status', 'active')
      .maybeSingle()
    
    enrollment = data
    enrollError = error

    if (!enrollError && enrollment) {
      const { data: batchData } = await supabase
        .from('batches')
        .select('*')
        .eq('id', assessment.batch_id)
        .single()
      
      if (batchData) {
        course = {
          id: batchData.id,
          title: batchData.title
        }
      }
    }
  } else {
    // Check standard course enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', assessment.course_id || courseId)
      .eq('status', 'active')
      .maybeSingle()
    
    enrollment = data
    enrollError = error

    if (!enrollError && enrollment && (assessment.course_id || courseId !== 'batch')) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', assessment.course_id || courseId)
        .single()
      
      course = courseData
    }
  }

  if (enrollError || !enrollment) {
    redirect('/dashboard?unauthorized=true')
  }

  // 4. Fetch questions from the secure BLIND student_questions view (correct_option_index is dropped)
  const { data: questions, error: qError } = await supabase
    .from('student_questions')
    .select('*')
    .eq('assessment_id', assessmentId)

  if (qError || !questions) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6 text-slate-800 animate-fade-in">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/60 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-650 border border-red-100 shadow-inner">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-850">Secure Load Failure</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Assessment questions could not be securely fetched. Please try again later.
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

  // 5. Fetch attempt status
  const { data: attempt } = await supabase
    .from('assessment_attempts')
    .select('*')
    .eq('assessment_id', assessmentId)
    .eq('user_id', user.id)
    .maybeSingle()

  // Securely evaluate correct/incorrect breakdown server-side if already submitted
  let gradedMetrics = null
  if (attempt && attempt.submitted_at) {
    const { data: realQuestions } = await supabase
      .from('questions')
      .select('id, correct_option_index, marks_positive, marks_negative')
      .eq('assessment_id', assessmentId)

    if (realQuestions) {
      let correctCount = 0
      let incorrectCount = 0
      let unattemptedCount = 0
      const questionStatuses = {}

      realQuestions.forEach((q) => {
        const submittedOption = attempt.answers_payload?.[q.id]
        if (submittedOption === undefined || submittedOption === null || submittedOption === -1) {
          unattemptedCount++
          questionStatuses[q.id] = 'unattempted'
        } else if (Number(submittedOption) === q.correct_option_index) {
          correctCount++
          questionStatuses[q.id] = 'correct'
        } else {
          incorrectCount++
          questionStatuses[q.id] = 'incorrect'
        }
      })

      gradedMetrics = {
        correctCount,
        incorrectCount,
        unattemptedCount,
        questionStatuses
      }
    }
  }

  return (
    <ExamClient
      course={course || { id: courseId, title: 'Batch Assessment' }}
      assessment={assessment}
      questions={questions}
      attempt={attempt}
      alreadySubmitted={attempt ? !!attempt.submitted_at : false}
      user={user}
      gradedMetrics={gradedMetrics}
    />
  )
}
