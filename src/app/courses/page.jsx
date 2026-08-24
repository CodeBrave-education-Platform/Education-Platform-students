import { createClient } from '@/utils/supabase/server'
import CoursesCatalogClient from './CoursesCatalogClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Comprehensive Courses & Master Batches | Asentra Education Platform',
  description: 'Explore comprehensive courses in Physics, Chemistry, Mathematics, and Biology for JEE Main, Advanced, and NEET with top faculty mentors.'
}

export default async function CoursesCatalogPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Query public.courses directly from Supabase
  let courses = []
  try {
    const { data: dbCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('[COURSES PAGE] Query error:', coursesError)
    }

    if (dbCourses && dbCourses.length > 0) {
      courses = dbCourses.map(c => ({
        id: c.id,
        title: c.title || 'Untitled Course',
        subject: c.subject || 'General',
        instructor: c.instructor_name || 'Expert Faculty',
        instructorRole: c.instructor_role || 'Senior Educator',
        cover: c.thumbnail_url || c.cover_url || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
        badge: c.badge || (c.is_featured ? 'FLAGSHIP BATCH' : 'CERTIFIED COURSE'),
        rating: c.rating ? Number(c.rating) : 4.9,
        studentsCount: c.students_count ? `${c.students_count}+ Aspirants` : 'New Master Batch',
        duration: c.duration || '12 Months',
        lessonsCount: c.lessons_count || 24,
        price: Number(c.price) || 0,
        originalPrice: Number(c.original_price) || (Number(c.price) ? Math.round(Number(c.price) * 2.5) : 0),
        checklist: Array.isArray(c.checklist) ? c.checklist : [],
        includedBookKit: c.book_kit || null
      }))
    }
  } catch (err) {
    console.error('[COURSES PAGE] Unexpected fetch error:', err)
  }

  // 3. Query authenticated user's active enrollments and profile XP
  let enrolledCourseIds = []
  let userXp = 0

  if (user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .single()
      if (profile) userXp = profile.xp || 0

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (enrollments && enrollments.length > 0) {
        enrolledCourseIds = enrollments.map(e => e.course_id)
      }
    } catch (e) {
      console.error('[COURSES PAGE] Error fetching user data:', e)
    }
  }

  return (
    <CoursesCatalogClient
      initialCourses={courses}
      initialEnrolledCourseIds={enrolledCourseIds}
      userXp={userXp}
      user={user}
    />
  )
}
