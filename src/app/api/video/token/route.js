import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { courseId, lessonId } = await request.json()
    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required parameters: courseId and lessonId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Zero-Trust Security: Authenticate user cryptographically using getUser()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      )
    }

    // 2. Authorization: Check enrollment status for courseId
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .in('status', ['active', 'ACTIVE'])
      .maybeSingle()

    // Retrieve user profiles role details to verify Instructor/Admin privileges
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = profile?.role === 'admin'
    
    // Check if instructor is the owner of the course
    let isInstructor = false
    if (profile?.role === 'instructor' || profile?.role === 'teacher') {
      const { data: course } = await supabase
        .from('courses')
        .select('instructor_id')
        .eq('id', courseId)
        .maybeSingle()
      if (course?.instructor_id === user.id) {
        isInstructor = true
      }
    }

    if (!enrollment && !isAdmin && !isInstructor) {
      return NextResponse.json(
        { error: 'Forbidden: Active enrollment required' },
        { status: 403 }
      )
    }

    // 3. Cryptographically generate a short-lived token
    // stamp with expiry time (15 minutes validity window)
    const expiresAt = Date.now() + 15 * 60 * 1000
    const payload = `${user.id}:${courseId}:${lessonId}:${expiresAt}`
    
    // Sign payload with secure server secret to prevent client side forgery
    const secret = process.env.RAZORPAY_KEY_SECRET || 'P0YIbV3ZGKgDkloeyVk7meXl'
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    const secureToken = `${payload}:${signature}`

    return NextResponse.json({ token: secureToken, expiresAt })
  } catch (err) {
    console.error('Secure streaming token gateway exception:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
