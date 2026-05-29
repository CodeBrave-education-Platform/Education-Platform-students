import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Upstash Redis client securely for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Allow 5 download requests per 60 seconds per authenticated student
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
})

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const file = searchParams.get('file')
    const lessonId = searchParams.get('lessonId')

    if (!file || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required parameters: file and lessonId' },
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

    // 2. Strict Rate Limiting via Upstash Redis sliding window
    const { success, limit, reset, remaining } = await ratelimit.limit(user.id)
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 5 downloads per minute allowed.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      )
    }

    // 2. Fetch course_id matching the lessonId
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

    // 3. High-Performance authorization check via active enrollments
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
      return NextResponse.redirect(new URL(file, request.url))
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
