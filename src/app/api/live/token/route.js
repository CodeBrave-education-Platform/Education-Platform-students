import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { AccessToken } from 'livekit-server-sdk'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { roomName, identity, participantName } = await request.json()

    if (!roomName || !identity) {
      return NextResponse.json({ error: 'Missing roomName or identity' }, { status: 400 })
    }

    const supabase = await createClient()

    // Zero-Trust Security: Authenticate user cryptographically using getUser()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Role check for permissions (Teacher vs Student)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle()

    const isTeacher = profile?.role === 'instructor' || profile?.role === 'teacher' || profile?.role === 'admin'
    const name = profile?.full_name || participantName || 'Anonymous Student'

    // Configure LiveKit Access Token
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY || 'devkey',
      process.env.LIVEKIT_API_SECRET || 'secret',
      {
        identity: user.id,
        name: name,
      }
    )

    // Set permissions based on role
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: isTeacher,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()

    return NextResponse.json({ token, serverUrl: process.env.LIVEKIT_URL || 'wss://asentra-demo.livekit.cloud' })

  } catch (error) {
    console.error('Failed to generate LiveKit token:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}
