import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Session status
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // 2. Fetch courses with profiles relation join
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })

    // 3. Fetch profiles sample
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, xp, streak, rank_badge')
      .limit(10)

    return NextResponse.json({
      status: 'ok',
      authenticated: !!user,
      user: user ? { id: user.id, email: user.email } : null,
      coursesCount: courses?.length || 0,
      courses,
      coursesError: coursesError ? { message: coursesError.message, code: coursesError.code, details: coursesError.details } : null,
      profilesCount: profiles?.length || 0,
      profiles,
      profilesError: profilesError ? { message: profilesError.message, code: profilesError.code } : null
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}