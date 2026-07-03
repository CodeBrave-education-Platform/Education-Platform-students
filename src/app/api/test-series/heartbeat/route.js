import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redis } from '@/utils/redis'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { examId } = await request.json()
    if (!examId) {
      return NextResponse.json({ error: 'Missing examId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set heartbeat in Redis with a 20-second expiration TTL
    const redisKey = `asentra:test:active:${examId}:${user.id}`
    await redis.set(redisKey, 'active', { ex: 20 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[HEARTBEAT API] Exception:', err.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
