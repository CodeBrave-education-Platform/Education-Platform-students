import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AnalyticsTerminalClient from './AnalyticsTerminalClient'

export const dynamic = 'force-dynamic'

export default async function AnalyticsTerminalPage({ params }) {
  const { attemptId } = await params
  
  const supabase = await createClient()

  // Authenticate user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect(`/login?redirectTo=/test-series/analytics/${attemptId}`)
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch this specific test attempt with exam questions
  const { data: attempt, error: attemptError } = await supabase
    .from('test_attempts')
    .select('*, test_exams(*)')
    .eq('id', attemptId)
    .single()

  if (attemptError || !attempt) {
    console.error('[ANALYTICS] Error loading attempt:', attemptError)
    notFound()
  }

  const exam = attempt.test_exams
  const questions = exam.questions || []
  const answersPayload = attempt.answers_payload || {}

  // Calculate subject-wise accuracy and seconds spent
  const subjectsData = {}
  
  questions.forEach((q, idx) => {
    const sub = q.subject || 'General'
    if (!subjectsData[sub]) {
      subjectsData[sub] = { total: 0, correct: 0, timeSpent: 0 }
    }
    
    subjectsData[sub].total++
    const ans = answersPayload[q.id]
    if (ans) {
      subjectsData[sub].timeSpent += (ans.seconds_spent || 0)
      if (ans.selected_option === q.correct_option_index) {
        subjectsData[sub].correct++
      }
    }
  })

  const studentSubjectAcc = Object.keys(subjectsData).map(sub => {
    const item = subjectsData[sub]
    return {
      subject: sub,
      accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
      timeSpent: item.timeSpent
    }
  })

  // Fetch other attempts for the same exam to calculate topper average
  const { data: allAttempts } = await supabase
    .from('test_attempts')
    .select('score, answers_payload')
    .eq('exam_id', exam.id)

  let topperSubjectAcc = {}
  if (allAttempts && allAttempts.length > 0) {
    // Find the attempt with the highest score (topper)
    const topperAttempt = allAttempts.reduce((max, curr) => curr.score > max.score ? curr : max, allAttempts[0])
    const topperPayload = topperAttempt.answers_payload || {}

    const topperSubjects = {}
    questions.forEach(q => {
      const sub = q.subject || 'General'
      if (!topperSubjects[sub]) {
        topperSubjects[sub] = { total: 0, correct: 0 }
      }
      topperSubjects[sub].total++
      const ans = topperPayload[q.id]
      if (ans && ans.selected_option === q.correct_option_index) {
        topperSubjects[sub].correct++
      }
    })

    Object.keys(topperSubjects).forEach(sub => {
      const item = topperSubjects[sub]
      topperSubjectAcc[sub] = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0
    })
  }

  // Fallback / mock topper metrics if no other user attempts exist
  studentSubjectAcc.forEach(item => {
    if (topperSubjectAcc[item.subject] === undefined) {
      topperSubjectAcc[item.subject] = Math.min(100, item.accuracy + 12) // topper is slightly higher
    }
  })

  return (
    <AnalyticsTerminalClient
      user={user}
      profile={profile}
      attempt={attempt}
      exam={exam}
      studentSubjectAcc={studentSubjectAcc}
      topperSubjectAcc={topperSubjectAcc}
    />
  )
}
