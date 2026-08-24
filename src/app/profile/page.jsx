import * as React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProfileClient from './ProfileClient'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Academic Profile | Asentra Education Platform',
  description: 'Manage your student profile, academic strengths, and exam preparation targets.'
}

export default async function ProfilePage() {
  const supabase = await createClient()

  // Retrieve authenticated user session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/profile')
  }

  // Retrieve matching profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

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
    
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const enrolledCourseIds = enrollments ? enrollments.map(e => e.course_id).filter(Boolean) : []
    
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
    console.error('[PROFILE METRICS ERROR]:', metricErr)
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

  return (
    <>
      <Navbar user={user} profile={profile} />
      <ProfileClient user={user} profile={profile} />
    </>
  )
}
