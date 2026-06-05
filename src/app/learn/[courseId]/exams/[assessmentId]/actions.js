'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Zero-Trust Server-Side Grading Action
 * Enforces Blind Frontend Grading and Server-Authoritative Timer checking
 */
export async function gradeAssessmentAction(courseId, assessmentId, attemptId, answers) {
  try {
    const supabase = await createClient()

    // 1. Zero-Trust Security: Authenticate user cryptographically using getUser()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized user session')
    }

    // 2. Fetch the corresponding attempt record, verifying ownership
    const { data: attempt, error: attemptError } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (attemptError || !attempt) {
      throw new Error('Assessment attempt record not found or access denied')
    }

    // Prevent double submission exploits
    if (attempt.submitted_at) {
      return {
        success: false,
        error: 'Assessment has already been submitted and graded.'
      }
    }

    // 3. Server-Authoritative Time Check: Get exact submission time on the server
    const submittedAt = new Date()
    const startedAt = new Date(attempt.started_at)
    const elapsedMs = submittedAt.getTime() - startedAt.getTime()

    // Retrieve configured assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('duration_minutes, end_window')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      throw new Error('Assessment configurations not found')
    }

    // Server-Authoritative Time Gate: Check end_window with grace period
    if (assessment.end_window) {
      const endWindowTime = new Date(assessment.end_window).getTime()
      const gracePeriodMs = 60000 // 60 seconds grace period
      if (submittedAt.getTime() > endWindowTime + gracePeriodMs) {
        return {
          success: false,
          error: 'Assessment submission window has closed. Submission rejected.'
        }
      }
    }

    // Define 30-second grace window to compensate for network transit delays
    const allowedMs = (assessment.duration_minutes * 60 * 1000) + 30000 
    const timeExceeded = elapsedMs > allowedMs

    if (timeExceeded) {
      // SAGA AUTO-CLOSE: Force-submit the test with a penalty of 0 marks for late tampering/submission
      await supabase
        .from('assessment_attempts')
        .update({
          submitted_at: submittedAt.toISOString(),
          score: 0,
          answers_payload: { ...answers, _system_flagged_late: true }
        })
        .eq('id', attemptId)

      revalidatePath(`/learn/${courseId}/exams/${assessmentId}`)

      return {
        success: false,
        error: 'Submission rejected: Assessment completion window has expired.',
        timeExceeded: true
      }
    }

    // 4. Secure Database grading (Correct answers are NEVER exposed to the React client)
    const { data: realQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('id, correct_option_index, marks_positive, marks_negative')
      .eq('assessment_id', assessmentId)

    if (questionsError || !realQuestions || realQuestions.length === 0) {
      throw new Error('Assessment questions could not be securely retrieved')
    }

    let score = 0
    let correctCount = 0
    let incorrectCount = 0
    let unattemptedCount = 0
    const questionStatuses = {}

    realQuestions.forEach((q) => {
      const submittedOption = answers[q.id]

      if (submittedOption === undefined || submittedOption === null || submittedOption === -1) {
        unattemptedCount++
        questionStatuses[q.id] = 'unattempted'
      } else if (Number(submittedOption) === q.correct_option_index) {
        score += q.marks_positive
        correctCount++
        questionStatuses[q.id] = 'correct'
      } else {
        score -= q.marks_negative
        incorrectCount++
        questionStatuses[q.id] = 'incorrect'
      }
    })

    // 5. Update submission records and lock the score in assessment_attempts
    const { error: updateError } = await supabase
      .from('assessment_attempts')
      .update({
        submitted_at: submittedAt.toISOString(),
        score: score,
        answers_payload: answers
      })
      .eq('id', attemptId)

    if (updateError) {
      throw new Error('Failed to persist assessment results: ' + updateError.message)
    }

    // Refresh dynamic layouts
    revalidatePath(`/learn/${courseId}/exams/${assessmentId}`)

    return {
      success: true,
      score,
      correctCount,
      incorrectCount,
      unattemptedCount,
      questionStatuses,
      submittedAt: submittedAt.toISOString(),
      timeExceeded
    }
  } catch (err) {
    console.error('Zero-Trust grading critical crash:', err)
    return {
      success: false,
      error: err.message || 'Server grading failed'
    }
  }
}

/**
 * Initialize a new assessment attempt securely on the server
 */
export async function startAssessmentAttemptAction(courseId, assessmentId) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized session')
    }

    // Check if an unsubmitted attempt is already active
    const { data: existingAttempt } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('user_id', user.id)
      .is('submitted_at', null)
      .maybeSingle()

    if (existingAttempt) {
      return {
        success: true,
        attempt: existingAttempt
      }
    }

    // Check if they already submitted one (prevent infinite tries on JEE mocks)
    const { data: submittedAttempt } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('user_id', user.id)
      .not('submitted_at', 'is', null)
      .maybeSingle()

    if (submittedAttempt) {
      return {
        success: true,
        attempt: submittedAttempt,
        alreadySubmitted: true
      }
    }

    // Retrieve start_window and end_window to validate temporal access locks
    const { data: assessment, error: assErr } = await supabase
      .from('assessments')
      .select('start_window, end_window')
      .eq('id', assessmentId)
      .single()

    if (assErr || !assessment) {
      throw new Error('Assessment configurations not found')
    }

    const nowTime = new Date().getTime()
    if (assessment.start_window) {
      const startWindowTime = new Date(assessment.start_window).getTime()
      if (nowTime < startWindowTime) {
        throw new Error('Assessment is locked. The start window has not opened yet.')
      }
    }

    if (assessment.end_window) {
      const endWindowTime = new Date(assessment.end_window).getTime()
      if (nowTime > endWindowTime) {
        throw new Error('Assessment window has closed.')
      }
    }

    // Start a new secure attempt
    const { data: newAttempt, error: insertError } = await supabase
      .from('assessment_attempts')
      .insert({
        assessment_id: assessmentId,
        user_id: user.id,
        started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    revalidatePath(`/learn/${courseId}/exams/${assessmentId}`)

    return {
      success: true,
      attempt: newAttempt
    }
  } catch (err) {
    console.error('Failed to initialize attempt:', err)
    return {
      success: false,
      error: err.message || 'Failed to start attempt'
    }
  }
}

/**
 * Server-authoritative time sync action
 */
export async function getServerTimeAction() {
  return new Date().toISOString()
}
