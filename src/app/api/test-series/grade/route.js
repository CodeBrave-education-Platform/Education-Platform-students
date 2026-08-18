import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { examId, answers, secondsRemaining, durationMinutes } = await request.json()

    if (!examId || !answers) {
      return NextResponse.json({ error: 'Missing examId or answers payload' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 })
    }

    // 1. Securely fetch exam metadata, questions, and marking scheme
    const { data: examData, error: examError } = await supabase
      .from('test_exams')
      .select('id, title, duration_minutes, questions, marks_scheme')
      .eq('id', examId)
      .single()

    if (examError || !examData) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Parse questions array safely
    let questions = []
    if (typeof examData.questions === 'string') {
      try {
        questions = JSON.parse(examData.questions)
      } catch (e) {
        questions = []
      }
    } else if (Array.isArray(examData.questions)) {
      questions = examData.questions
    }

    // Standard marking scheme
    const positiveMarks = Number(examData.marks_scheme?.positive_marks ?? 4)
    const negativeMarks = -Math.abs(Number(examData.marks_scheme?.negative_marks ?? 1))

    let correct = 0
    let incorrect = 0
    let unanswered = 0
    let rawScore = 0

    // 2. Server-Authoritative Blind Grading Engine
    questions.forEach((q) => {
      const qId = q.id || q.question_id
      const ans = answers[qId] || answers[String(qId)]

      if (!ans || ans.selected_option === undefined || ans.selected_option === null || ans.selected_option === '') {
        unanswered++
      } else {
        const submittedOption = Number(ans.selected_option)
        const correctOption = Number(q.correct_option_index)

        if (submittedOption === correctOption) {
          correct++
          rawScore += positiveMarks
        } else {
          incorrect++
          rawScore += negativeMarks
        }
      }
    })

    const totalQuestions = questions.length
    const totalMarks = totalQuestions * positiveMarks
    const attemptedCount = correct + incorrect
    const score = Math.round(rawScore)
    const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0
    const accuracy = attemptedCount > 0 ? Number(((correct / attemptedCount) * 100).toFixed(2)) : 0

    const totalDuration = (Number(durationMinutes) || examData.duration_minutes || 180) * 60
    const remaining = Number(secondsRemaining) || 0
    const durationSeconds = Math.max(0, Math.min(totalDuration, totalDuration - remaining))

    // 3. Persist Test Attempt Record
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
      console.error('[GRADE API] Failed to insert test attempt:', insertError)
      return NextResponse.json(
        { error: `Database rejection: ${insertError.message}` },
        { status: 500 }
      )
    }

    // 4. Gamification Engine: XP, Streak, Rank Badge Calculation
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

    // 5. Return Complete Contract Payload
    return NextResponse.json({
      success: true,
      score,
      totalMarks,
      percentage,
      correctCount: correct,
      incorrectCount: incorrect,
      unattemptedCount: unanswered,
      accuracy,
      attemptId: attempt.id,
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
