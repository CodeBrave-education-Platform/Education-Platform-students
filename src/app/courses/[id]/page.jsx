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

  return (
    <CourseDetailsClient
      course={course}
      lessons={lessons || []}
      initialEnrolled={!!enrollment}
      user={user}
    />
  )
}
