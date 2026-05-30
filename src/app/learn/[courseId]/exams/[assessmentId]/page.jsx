import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
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

  // 2. Authorization: Check enrollment status for courseId
  const { data: enrollment, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .maybeSingle()

  if (enrollError || !enrollment) {
    redirect('/dashboard?unauthorized=true')
  }

  // 3. Fetch assessment configurations
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .maybeSingle()

  if (assessmentError || !assessment) {
    redirect('/dashboard?error=assessment-not-found')
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
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto text-red-600 border border-red-100 shadow-inner">
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

  // 6. Fetch Course details
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  // If student has already started an attempt, serve the interactive ExamClient player
  if (attempt) {
    return (
      <ExamClient
        course={course}
        assessment={assessment}
        questions={questions}
        attempt={attempt}
        alreadySubmitted={!!attempt.submitted_at}
        user={user}
        gradedMetrics={gradedMetrics}
      />
    )
  }

  // If no attempt exists, render a professional JEE Mock Test instructions landing card
  const totalQuestions = questions.length
  const totalMarks = totalQuestions * 4

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-800 p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-lg space-y-6">
        
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider select-none">
          <Link href="/dashboard" className="hover:text-teal-850">Dashboard</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
          <span className="text-slate-400">{course.title}</span>
        </div>

        {/* Test Landing details */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-100">
            <BookOpen className="w-3.5 h-3.5" />
            {assessment.type === 'quiz' ? 'Scheduled Quiz' : 'JEE Practice Mock'}
          </span>
          <h1 className="text-xl md:text-2xl font-black text-slate-850">
            {assessment.title}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Welcome to the Focus Mode Assessment Hub. Read all guidelines carefully before starting your attempt.
          </p>
        </div>

        <hr className="border-slate-100" />

        {/* Quick parameters grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
            <span className="text-sm font-black text-slate-700">{assessment.duration_minutes} Minutes</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Questions</span>
            <span className="text-sm font-black text-slate-700">{totalQuestions} MCQ</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Marks</span>
            <span className="text-sm font-black text-teal-600">+{totalMarks}</span>
          </div>
        </div>

        {/* Guidelines checklist */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 text-xs leading-relaxed text-slate-655 font-bold">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Important Guidelines & Rules
          </h3>
          <ul className="list-disc pl-4 space-y-2">
            <li>Ensure you have a stable internet connection. The countdown timer is managed authoritatively by the server and will not stop if you refresh.</li>
            <li>Each question yields <span className="text-emerald-600">+4 marks</span> for a correct response and imposes a <span className="text-red-500">-1 mark</span> penalty for incorrect selections.</li>
            <li>The test will automatically submit itself when the remaining minutes hit zero.</li>
            <li>Close all background applications to guarantee focus during mock tests.</li>
          </ul>
        </div>

        {/* Action button trigger starts attempt via Server Action */}
        <form 
          action={async () => {
            'use server'
            const res = await startAssessmentAttemptAction(courseId, assessmentId)
            if (res.success) {
              redirect(`/learn/${courseId}/exams/${assessmentId}`)
            }
          }}
          className="pt-2 flex gap-4 w-full"
        >
          <Link
            href="/dashboard"
            className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-550 font-semibold rounded-xl text-center text-sm shadow-sm"
          >
            Go Back
          </Link>
          
          <button
            type="submit"
            className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition shadow-sm border border-teal-600 cursor-pointer text-center"
          >
            Start Assessment
          </button>
        </form>

      </div>
    </div>
  )
}
