import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getSafeRedirectUrl } from '@/utils/security'

let redis
let ratelimit

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  }
} catch (e) {
  console.warn('Redis rate-limiter initialization skipped:', e.message)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const file = searchParams.get('file')
    const lessonId = searchParams.get('lessonId')
    const batchId = searchParams.get('batchId')

    if (!file || (!lessonId && !batchId)) {
      return NextResponse.json(
        { error: 'Missing required parameters: file and either lessonId or batchId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      )
    }

    // 2. Sliding window rate limit check
    if (ratelimit) {
      try {
        const { success } = await ratelimit.limit(user.id)
        if (!success) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Max 10 downloads per minute allowed.' },
            { status: 429 }
          )
        }
      } catch (err) {
        console.warn('[RATE LIMIT NOTICE] Upstash Redis bypass:', err.message)
      }
    }

    // 3. User Role Check for Staff Bypass
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isStaff = profile?.role === 'admin' || profile?.role === 'teacher' || profile?.role === 'instructor'

    // 4. Authorization Check for Students
    if (!isStaff) {
      if (lessonId) {
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select('course_id')
          .eq('id', lessonId)
          .maybeSingle()

        if (lessonError || !lesson) {
          return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', lesson.course_id)
          .in('status', ['active', 'ACTIVE'])
          .maybeSingle()

        if (!enrollment) {
          return NextResponse.json(
            { error: 'Forbidden: Active enrollment required' },
            { status: 403 }
          )
        }
      } else if (batchId) {
        const { data: enrollment } = await supabase
          .from('batch_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('batch_id', batchId)
          .in('status', ['active', 'ACTIVE'])
          .maybeSingle()

        if (!enrollment) {
          return NextResponse.json(
            { error: 'Forbidden: Active batch enrollment required' },
            { status: 403 }
          )
        }
      }
    }

    // 5. Resolve storage path
    let filePath = file
    if (file.startsWith('http')) {
      try {
        const parsedUrl = new URL(file)
        const parts = parsedUrl.pathname.split('/storage/v1/object/public/course-materials/')
        if (parts.length > 1) {
          filePath = decodeURIComponent(parts[1])
        } else {
          filePath = parsedUrl.pathname.split('/').pop()
        }
      } catch (err) {
        console.error('Path parsing notice:', err)
      }
    }

    // 6. Generate signed URL (expires in 60s)
    const { data, error: signedUrlError } = await supabase
      .storage
      .from('course-materials')
      .createSignedUrl(filePath, 60)

    if (signedUrlError || !data?.signedUrl) {
      if (file.startsWith('http')) {
        const safeUrl = getSafeRedirectUrl(file, '/dashboard')
        const isSupabaseUrl = file.includes('.supabase.co')
        if (safeUrl === '/dashboard' && !isSupabaseUrl) {
          return NextResponse.json(
            { error: 'Forbidden: Redirect domain is not whitelisted' },
            { status: 403 }
          )
        }
        return NextResponse.redirect(new URL(file, request.url))
      }
      return NextResponse.json(
        { error: 'Failed to generate secure download link' },
        { status: 500 }
      )
    }

    return NextResponse.redirect(new URL(data.signedUrl, request.url))
  } catch (err) {
    console.error('Download route exception:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
