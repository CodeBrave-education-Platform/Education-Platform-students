import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { examId, answers, secondsRemaining, durationMinutes } = await request.json()

    if (!examId || !answers) {
      return NextResponse.json({ error: 'Missing exam payload' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Securely fetch questions and marks scheme from database (not trusting client)
    const { data: examData, error: examError } = await supabase
      .from('test_exams')
      .select('id, questions, marks_scheme')
      .eq('id', examId)
      .single()

    if (examError || !examData) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

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
    const marksScheme = examData.marks_scheme || { positive_marks: 4, negative_marks: -1 }

    let correct = 0
    let incorrect = 0
    let unanswered = 0
    let score = 0

    // Secure server-side grading
    questions.forEach(q => {
      const ans = answers[q.id]
      if (!ans || ans.selected_option === undefined || ans.selected_option === null) {
        unanswered++
      } else if (ans.selected_option === q.correct_option_index) {
        correct++
        score += marksScheme.positive_marks
      } else {
        incorrect++
        score += marksScheme.negative_marks
      }
    })

    const durationSeconds = ((durationMinutes || 180) * 60) - (secondsRemaining || 0)

    // Ensure profile exists to prevent Foreign Key constraint violations
    const { error: profileError } = await supabase.from('profiles').upsert({ 
      id: user.id, 
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Student'
    }, { onConflict: 'id', ignoreDuplicates: true })

    if (profileError) console.warn('[GRADE API] Profile upsert warning:', profileError.message)

    // Insert attempt securely
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
        total_duration_seconds: isNaN(durationSeconds) ? 0 : durationSeconds,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert test attempt:', insertError)
      return NextResponse.json({ error: `Database rejection: ${insertError.message} / Code: ${insertError.code}` }, { status: 500 })
    }

    // --- GAMIFICATION ENGINE: Calculate and Award XP ---
    try {
      const accuracy = questions.length > 0 ? (correct / questions.length) : 0
      let earnedXp = correct * 10
      if (accuracy >= 0.8) earnedXp = Math.floor(earnedXp * 1.5) // 1.5x multiplier for >= 80%

      if (earnedXp > 0) {
        // Fetch current stats
        const { data: profile } = await supabase.from('profiles').select('xp, streak').eq('id', user.id).single()
        
        const newXp = (profile?.xp || 0) + earnedXp
        const newStreak = (profile?.streak || 0) + 1 // Simply incrementing streak for demo purposes
        
        // Compute Rank Badge
        let badge = 'Bronze'
        if (newXp > 1000) badge = 'Silver'
        if (newXp > 5000) badge = 'Gold'
        if (newXp > 10000) badge = 'Platinum'
        
        await supabase.from('profiles').update({
          xp: newXp,
          streak: newStreak,
          rank_badge: badge,
          last_active_date: new Date().toISOString()
        }).eq('id', user.id)
      }
    } catch (gamificationErr) {
      console.warn('Non-fatal gamification error:', gamificationErr)
    }
    // ----------------------------------------------------

    return NextResponse.json({ success: true, attemptId: attempt.id, score, earnedXp: correct * 10 })

  } catch (err) {
    console.error('[GRADE API] Exception:', err.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
