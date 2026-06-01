import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()

    // Structured logging pattern for direct external APM ingestion (Vercel Logs, Axiom, Datadog)
    console.error(`[PRODUCTION EXCEPTION] [${new Date().toISOString()}]:`, body)

    // Respond with 200 OK status to protect frontend UI/UX loops from blocking or breaking
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
  } catch (err) {
    // Graceful fallback prevents telemetry gateway crash loops
    console.error('Telemetry Log Ingest crash:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 200 })
  }
}
