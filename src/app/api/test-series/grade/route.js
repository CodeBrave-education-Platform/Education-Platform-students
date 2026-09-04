import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { examId, answers = {}, secondsRemaining, durationMinutes } = await request.json()

    if (!examId) {
      return NextResponse.json({ error: 'Missing examId parameter' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 })
    }

    // 1. Fetch exam metadata
    const { data: examData, error: examError } = await supabase
      .from('test_exams')
      .select('id, title, duration_minutes, questions, marks_scheme')
      .eq('id', examId)
      .maybeSingle()

    // 2. Fetch questions: Try relational join from exam_questions + question_bank first
    let questions = []
    try {
      const { data: relQuestions, error: relError } = await supabase
        .from('exam_questions')
        .select(`
          id,
          order_index,
          question_id,
          question_bank (
            id,
            question_text,
            format,
            question_type,
            options,
            correct_option_index,
            correct_options,
            correct_value,
            numerical_range,
            tolerance,
            marks_positive,
            marks_negative,
            solution_explanation
          )
        `)
        .eq('exam_id', examId)
        .order('order_index', { ascending: true })

      if (!relError && relQuestions && relQuestions.length > 0) {
        questions = relQuestions.map(item => {
          const qb = item.question_bank || {}
          return {
            ...qb,
            id: qb.id || item.question_id || item.id,
            order_index: item.order_index
          }
        })
      }
    } catch (relErr) {
      console.warn('[GRADE API] Relational question lookup notice:', relErr)
    }

    // Fallback to JSON questions stored on test_exams
    if (questions.length === 0 && examData?.questions) {
      if (typeof examData.questions === 'string') {
        try {
          questions = JSON.parse(examData.questions)
        } catch (e) {
          questions = []
        }
      } else if (Array.isArray(examData.questions)) {
        questions = examData.questions
      }
    }

    // Default marking scheme
    const positiveMarks = Number(examData?.marks_scheme?.positive_marks ?? 4)
    const negativeMarks = -Math.abs(Number(examData?.marks_scheme?.negative_marks ?? 1))

    let correct = 0
    let incorrect = 0
    let unanswered = 0
    let rawScore = 0

    // Track Section B attempts per subject to enforce max 5 attempts cap
    const subjectSectionBAttempts = {}

    // 3. Multi-Format Server-Authoritative Grading Engine (MCQ, MSQ, Numerical, Matrix Match)
    questions.forEach((q) => {
      const qId = q.id || q.question_id
      const ans = answers[qId] || answers[String(qId)]

      const isMatrix = 
        q.format === 'MATRIX_MATCH' || 
        q.format_type === 'matrix_match' || 
        q.question_type === 'matrix_match'

      const isNumerical = 
        !isMatrix && (
          q.format === 'NUMERICAL' || 
          q.format === 'NAT' || 
          q.question_type === 'numerical' || 
          q.correct_value !== undefined ||
          (!q.options || q.options.length === 0)
        )

      const isMsq = 
        !isMatrix && !isNumerical && (
          q.format === 'MSQ' || 
          q.question_type === 'msq' || 
          Array.isArray(q.correct_options) ||
          (Array.isArray(q.correct_option_index) && q.correct_option_index.length > 1)
        )

      const qPosMarks = Number(q.marks_positive ?? positiveMarks)
      const qNegMarks = -Math.abs(Number(q.marks_negative ?? negativeMarks))

      if (!ans) {
        unanswered++
        return
      }

      // Check Section B attempt cap: Max 5 questions evaluated per subject in Section B
      const qSubject = q.subject || 'Physics'
      const isSecB = (q.section || '').toLowerCase().includes('section b') || (isNumerical && !q.section)
      if (isSecB) {
        const currentAttempts = subjectSectionBAttempts[qSubject] || 0
        if (currentAttempts >= 5) {
          // Exceeds allowed 5 attempts for Section B: treat as uncounted
          unanswered++
          return
        }
        subjectSectionBAttempts[qSubject] = currentAttempts + 1
      }

      if (isMatrix) {
        // --- MATRIX MATCH EVALUATION ---
        const submittedMatrix = ans.matrix || {}
        let targetMatrix = {}
        try {
          if (typeof q.correct_answer === 'object' && q.correct_answer !== null) {
            targetMatrix = q.correct_answer
          } else if (typeof q.correct_answer === 'string') {
            targetMatrix = JSON.parse(q.correct_answer)
          } else if (typeof q.correct_matrix === 'object' && q.correct_matrix !== null) {
            targetMatrix = q.correct_matrix
          } else if (typeof q.options === 'object' && q.options?.answer_matrix) {
            targetMatrix = q.options.answer_matrix
          }
        } catch {
          targetMatrix = {}
        }

        const rowKeys = ['A', 'B', 'C', 'D']
        let matchingRows = 0
        let attemptedRows = 0

        rowKeys.forEach(r => {
          const subCols = Array.isArray(submittedMatrix[r]) ? [...submittedMatrix[r]].sort() : []
          const tgtCols = Array.isArray(targetMatrix[r]) ? [...targetMatrix[r]].sort() : []

          if (subCols.length > 0) attemptedRows++

          if (tgtCols.length > 0 && subCols.length === tgtCols.length && subCols.every((val, i) => val === tgtCols[i])) {
            matchingRows++
          }
        })

        if (attemptedRows === 0) {
          unanswered++
          return
        }

        if (matchingRows === rowKeys.length) {
          correct++
          rawScore += qPosMarks
        } else if (matchingRows > 0) {
          // Partial credit: proportional per correct row
          correct++
          rawScore += matchingRows * (qPosMarks / 4)
        } else {
          incorrect++
          rawScore += qNegMarks
        }
      } else if (isNumerical) {
        // --- NUMERICAL / NAT EVALUATION ---
        const submittedRaw = ans.numerical_value !== undefined 
          ? ans.numerical_value 
          : (ans.value !== undefined ? ans.value : ans.selected_option)

        if (submittedRaw === undefined || submittedRaw === null || String(submittedRaw).trim() === '') {
          unanswered++
          return
        }

        const submittedNum = parseFloat(String(submittedRaw).trim())
        if (isNaN(submittedNum)) {
          incorrect++
          rawScore += qNegMarks
          return
        }

        let isCorrect = false
        if (q.numerical_range && Array.isArray(q.numerical_range) && q.numerical_range.length === 2) {
          const [minVal, maxVal] = q.numerical_range.map(Number)
          isCorrect = submittedNum >= minVal && submittedNum <= maxVal
        } else {
          const targetNum = parseFloat(q.correct_value ?? q.correct_option_index ?? 0)
          const tol = parseFloat(q.tolerance || q.numerical_tolerance || 0.05)
          isCorrect = Math.abs(submittedNum - targetNum) <= tol
        }

        if (isCorrect) {
          correct++
          rawScore += qPosMarks
        } else {
          incorrect++
          rawScore += qNegMarks
        }
      } else if (isMsq) {
        // --- MSQ MULTI-SELECT EVALUATION ---
        let submittedOptions = []
        if (Array.isArray(ans.selected_options)) {
          submittedOptions = ans.selected_options.map(Number).sort((a, b) => a - b)
        } else if (Array.isArray(ans.selected_option)) {
          submittedOptions = ans.selected_option.map(Number).sort((a, b) => a - b)
        } else if (ans.selected_option !== undefined && ans.selected_option !== null && ans.selected_option !== '') {
          submittedOptions = [Number(ans.selected_option)]
        }

        if (submittedOptions.length === 0) {
          unanswered++
          return
        }

        let correctOptions = []
        if (Array.isArray(q.correct_options)) {
          correctOptions = q.correct_options.map(Number).sort((a, b) => a - b)
        } else if (Array.isArray(q.correct_option_index)) {
          correctOptions = q.correct_option_index.map(Number).sort((a, b) => a - b)
        } else if (q.correct_option_index !== undefined && q.correct_option_index !== null) {
          correctOptions = [Number(q.correct_option_index)]
        }

        // Exact match required for full positive marks
        const isMatch = 
          submittedOptions.length === correctOptions.length &&
          submittedOptions.every((val, i) => val === correctOptions[i])

        if (isMatch) {
          correct++
          rawScore += qPosMarks
        } else {
          incorrect++
          rawScore += qNegMarks
        }
      } else {
        // --- SINGLE MCQ EVALUATION ---
        const submittedOption = ans.selected_option !== undefined && ans.selected_option !== null && ans.selected_option !== ''
          ? Number(ans.selected_option)
          : (Array.isArray(ans.selected_options) && ans.selected_options.length > 0 ? Number(ans.selected_options[0]) : null)

        if (submittedOption === null || isNaN(submittedOption)) {
          unanswered++
          return
        }

        const correctOption = Number(q.correct_option_index ?? q.correctAnswer ?? 0)

        if (submittedOption === correctOption) {
          correct++
          rawScore += qPosMarks
        } else {
          incorrect++
          rawScore += qNegMarks
        }
      }
    })

    const totalQuestions = questions.length || 1
    const totalMarks = totalQuestions * positiveMarks
    const attemptedCount = correct + incorrect
    const score = Math.round(rawScore)
    const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0
    const accuracy = attemptedCount > 0 ? Number(((correct / attemptedCount) * 100).toFixed(2)) : 0

    const totalDuration = (Number(durationMinutes) || examData?.duration_minutes || 180) * 60
    const remaining = Number(secondsRemaining) || 0
    const durationSeconds = Math.max(0, Math.min(totalDuration, totalDuration - remaining))

    // 4. Persist Test Attempt Record
    let attemptId = null
    try {
      const { data: attempt, error: insertError } = await supabase
        .from('test_attempts')
        .insert([{
          user_id: user.id,
          exam_id: examId,
          answers_payload: answers,
          score,
          correct_count: correct,
          incorrect_count: incorrect,
          unanswered_count: unanswered,
          total_duration_seconds: durationSeconds,
          completed_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        console.warn('[GRADE API] Attempt insertion notice:', insertError)
      } else if (attempt) {
        attemptId = attempt.id
      }
    } catch (dbErr) {
      console.warn('[GRADE API] Attempt persistence catch:', dbErr)
    }

    if (!attemptId) {
      attemptId = `sim-attempt-${Date.now()}`
    }

    // 5. Gamification Engine: XP, Streak, Rank Badge Calculation
    let earnedXp = correct * 10
    if (accuracy >= 80) earnedXp = Math.floor(earnedXp * 1.5)
    if (earnedXp === 0 && correct > 0) earnedXp = 10

    let newXp = earnedXp
    let newStreak = 1
    let rankBadge = 'Bronze'

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, streak, rank_badge, last_active_date')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        newXp = (Number(profile.xp) || 0) + earnedXp

        // Calculate daily streak
        if (profile.last_active_date) {
          const lastDate = new Date(profile.last_active_date).toDateString()
          const today = new Date().toDateString()
          const yesterday = new Date(Date.now() - 86400000).toDateString()

          if (lastDate === today) {
            newStreak = profile.streak || 1
          } else if (lastDate === yesterday) {
            newStreak = (profile.streak || 0) + 1
          } else {
            newStreak = 1
          }
        }

        // Rank Badge Progression
        if (newXp >= 10000) rankBadge = 'Platinum'
        else if (newXp >= 5000) rankBadge = 'Gold'
        else if (newXp >= 1000) rankBadge = 'Silver'
        else rankBadge = 'Bronze'

        await supabase.from('profiles').update({
          xp: newXp,
          streak: newStreak,
          rank_badge: rankBadge,
          last_active_date: new Date().toISOString()
        }).eq('id', user.id)
      }
    } catch (gamificationErr) {
      console.warn('[GRADE API] Non-fatal gamification update notice:', gamificationErr)
    }

    // 6. Return Complete Contract Payload
    return NextResponse.json({
      success: true,
      score,
      totalMarks,
      percentage,
      correctCount: correct,
      incorrectCount: incorrect,
      unattemptedCount: unanswered,
      accuracy,
      attemptId,
      earnedXp,
      newXp,
      newStreak,
      rankBadge
    })

  } catch (err) {
    console.error('[GRADE API] Critical Exception:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
