import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Session status
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Fetch courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })

    // 3. Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10)

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : null,
      courses,
      coursesError,
      profiles,
      profilesError
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
