import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import CourseDetailsClient from './CourseDetailsClient'

export default async function CourseDetailPage(props) {
  const params = await props.params
  const courseId = params.id
  const supabase = await createClient()

  // 1. Zero-Trust Security: Authenticate user cryptographically using getUser()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch course information
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    redirect('/dashboard')
  }

  // 3. Fetch all lessons sorted by order_index
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  // 4. Authorization: Check enrollment status for courseId
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .maybeSingle()

  // 5. Fetch mock tests & test packages linked to this course
  let courseExams = []
  try {
    // A. Query test_exams directly
    const { data: allExams } = await supabase
      .from('test_exams')
      .select('id, package_id, title, duration_minutes, total_questions, is_live_ranking, activation_timestamp, marks_scheme, blueprint_type, sections_config, questions, created_at')
      .order('created_at', { ascending: false })

    if (allExams && allExams.length > 0) {
      // Check if exam is explicitly linked to this course
      const linked = allExams.filter(exam => {
        const ms = exam.marks_scheme || {}
        return ms.course_id === courseId || (course.checklist && Array.isArray(course.checklist.exam_ids) && course.checklist.exam_ids.includes(exam.id))
      })

      if (linked.length > 0) {
        courseExams = linked
      } else {
        // Fallback: If no direct test, show relevant competitive mock exams (e.g. JEE Main / Advanced)
        courseExams = allExams.slice(0, 3)
      }
    }
  } catch (e) {
    console.error('[COURSE PAGE] Error fetching course tests:', e)
  }

  // 6. Fetch student's attempts for these tests
  let initialAttempts = []
  if (user && courseExams.length > 0) {
    try {
      const examIds = courseExams.map(x => x.id)
      const { data: userAttempts } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('user_id', user.id)
        .in('exam_id', examIds)
      if (userAttempts) initialAttempts = userAttempts
    } catch (e) {
      console.error('[COURSE PAGE] Error fetching attempts:', e)
    }
  }

  return (
    <CourseDetailsClient
      course={course}
      lessons={lessons || []}
      initialEnrolled={!!enrollment}
      user={user}
      courseExams={courseExams}
      initialAttempts={initialAttempts}
    />
  )
}
