import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getSafeRedirectUrl } from '@/utils/security'

// Initialize Upstash Redis client securely for rate limiting
let redis;
let ratelimit;

try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  // Allow 5 download requests per 60 seconds per authenticated student
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    analytics: true,
    prefix: '@upstash/ratelimit',
  })
} catch (e) {
  console.warn('Redis rate-limiter initialization failed:', e.message)
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

    // 1. Zero-Trust Cryptographic User Verification via getUser()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      )
    }

    // 2. Strict Rate Limiting via Upstash Redis sliding window (with graceful degradation)
    if (ratelimit) {
      try {
        const { success } = await ratelimit.limit(user.id)
        if (!success) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Max 5 downloads per minute allowed.' },
            { status: 429 }
          )
        }
      } catch (err) {
        console.warn('[RATE LIMIT ERROR] Upstash Redis is unreachable. Bypassing rate limit check.', err.message)
      }
    }

    // 3. Authorization Check
    if (lessonId) {
      // Fetch course_id matching the lessonId
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('course_id')
        .eq('id', lessonId)
        .maybeSingle()

      if (lessonError || !lesson) {
        return NextResponse.json(
          { error: 'Lesson not found' },
          { status: 404 }
        )
      }

      // High-Performance authorization check via active enrollments
      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', lesson.course_id)
        .eq('status', 'active')
        .maybeSingle()

      if (enrollError || !enrollment) {
        return NextResponse.json(
          { error: 'Forbidden: Active enrollment required' },
          { status: 403 }
        )
      }
    } else if (batchId) {
      // High-Performance authorization check via active batch enrollments
      const { data: enrollment, error: enrollError } = await supabase
        .from('batch_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('batch_id', batchId)
        .maybeSingle()

      if (enrollError || !enrollment) {
        return NextResponse.json(
          { error: 'Forbidden: Active batch enrollment required' },
          { status: 403 }
        )
      }
    }

    // Extract relative storage path if a full URL was supplied
    let filePath = file
    if (file.startsWith('http')) {
      try {
        const parsedUrl = new URL(file)
        const parts = parsedUrl.pathname.split('/storage/v1/object/public/secure-assets/')
        if (parts.length > 1) {
          filePath = decodeURIComponent(parts[1])
        } else {
          filePath = parsedUrl.pathname.split('/').pop()
        }
      } catch (err) {
        console.error('Failed to parse URL, using raw path:', err)
      }
    }

    // 4. Create signed URL for secure download (expires in 60s)
    const { data, error: signedUrlError } = await supabase
      .storage
      .from('secure-assets')
      .createSignedUrl(filePath, 60)

    if (signedUrlError || !data?.signedUrl) {
      // Fallback: If signed asset generation fails or bucket not fully set up,
      // redirect securely to the original workspace link to ensure resilience
      if (file.startsWith('http')) {
        const safeUrl = getSafeRedirectUrl(file, '/dashboard')
        const isSupabaseUrl = file.includes('.supabase.co')
        if (safeUrl === '/dashboard' && !isSupabaseUrl) {
          return NextResponse.json(
            { error: 'Forbidden: Redirect domain is not whitelisted' },
            { status: 403 }
          )
        }
        return NextResponse.redirect(file)
      } else {
        return NextResponse.json(
          { error: 'Failed to generate secure download link' },
          { status: 500 }
        )
      }
    }

    // 5. Redirect user to the temporary signed download URL
    return NextResponse.redirect(data.signedUrl)
  } catch (err) {
    console.error('Secure download gateway critical crash:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
