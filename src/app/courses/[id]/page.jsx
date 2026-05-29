import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function CourseDetailPage(props) {
  const params = await props.params
  const courseId = params.id
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

  // 3. Fetch first lesson sorted by order_index
  const { data: firstLesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (lessonError || !firstLesson) {
    // If no lessons exist yet, we will redirect them to their specific default placeholder page
    redirect(`/learn/${courseId}?lesson=default`)
  }

  // 4. Redirect to the focus mode lesson player of the first lesson
  redirect(`/learn/${courseId}?lesson=${firstLesson.id}`)
}
