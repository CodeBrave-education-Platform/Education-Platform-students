import * as React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Retrieve authenticated user session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Retrieve matching profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Graceful fallback if profile wasn't created yet (e.g., fast OAuth completion)
  if (!profile) {
    const defaultName = user.email.split('@')[0]
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

  const role = profile.role || 'student'
  
  let initialCourses = []
  let initialEnrollments = []
  let allCourses = []

  if (role === 'teacher') {
    // 1. Fetch courses created by this instructor
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })
      
    initialCourses = coursesData || []

    // 2. Fetch students enrolled in courses created by this instructor
    const { data: enrollsData } = await supabase
      .from('enrollments')
      .select('id, enrolled_at, course_id, student_id, courses!inner(instructor_id, title), profiles(full_name, email, phone)')
      .eq('courses.instructor_id', user.id)
      
    initialEnrollments = enrollsData || []
  } else {
    // 1. Fetch courses the student is enrolled in
    const { data: enrollsData } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('student_id', user.id)
      
    initialEnrollments = enrollsData || []

    // 2. Fetch all courses in the platform (with instructor full name) for browsing
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      
    allCourses = coursesData || []
  }

  return (
    <DashboardClient 
      user={user} 
      profile={profile} 
      initialCourses={initialCourses}
      initialEnrollments={initialEnrollments}
      allCourses={allCourses}
    />
  )
}
