import { NextResponse } from 'next/server'
import { redisDel } from '@/utils/redis'

import { createClient } from '@/utils/supabase/server'

export async function POST(request) {
  try {
    // 1. Verify session server-side for authenticated admin/teacher users
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let isAuthorized = false
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (profile && (profile.role === 'admin' || profile.role === 'teacher' || profile.role === 'instructor')) {
        isAuthorized = true
      }
    }

    // 2. Fall back to Authorization Bearer token checking if no active authorized session exists
    if (!isAuthorized) {
      const authHeader = request.headers.get('Authorization')
      const secretToken = process.env.RAZORPAY_KEY_SECRET || 'asentra-secret-drm-key-2026'

      if (authHeader !== `Bearer ${secretToken}`) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid credentials or session expired' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { courseId, assessmentId } = body
    const purgedKeys = []

    // 1. Purge course catalog list key
    await redisDel('asentra:course:catalog')
    purgedKeys.push('asentra:course:catalog')

    // 2. Purge course detail cache if courseId is active
    if (courseId) {
      const courseKey = `asentra:course:${courseId}`
      await redisDel(courseKey)
      purgedKeys.push(courseKey)
    }

    // 3. Purge specific exam cache if assessmentId is active
    if (assessmentId) {
      const examKey = `asentra:exam:${assessmentId}`
      await redisDel(examKey)
      purgedKeys.push(examKey)
    }

    console.log('[REDIS CACHE] Purged keys successfully via trigger webhook:', purgedKeys)

    return NextResponse.json({
      success: true,
      message: 'Redis cache-aside registries invalidated successfully',
      purgedKeys
    })
  } catch (err) {
    console.error('Cache invalidation webhook exception:', err)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
