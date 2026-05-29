import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { createClient } from '@supabase/supabase-js'

// Initialize Razorpay instance securely on the server-side
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function POST(request) {
  try {
    // 1. Get raw request body as text for cryptographic signature check
    const rawBody = await request.text()
    
    // 2. Fetch the Razorpay cryptographic signature header
    const signature = request.headers.get('x-razorpay-signature')
    
    if (!signature) {
      console.error('Webhook Error: Missing x-razorpay-signature header')
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 })
    }

    // 3. Cryptographically verify signature using the local secret
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret_here'
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('Webhook Error: Cryptographic signature mismatch. Expected:', expectedSignature, 'Got:', signature)
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
    }

    // 4. Parse payload
    const body = JSON.parse(rawBody)
    console.log(`Razorpay Webhook Event Received: ${body.event}`)

    // 5. Handle payment.captured event
    if (body.event === 'payment.captured') {
      const paymentEntity = body.payload?.payment?.entity
      
      if (!paymentEntity) {
        return NextResponse.json({ error: 'Missing payment entity inside webhook payload' }, { status: 400 })
      }

      const paymentId = paymentEntity.id
      const amountPaise = paymentEntity.amount
      const amountPaid = amountPaise / 100 // Convert paise to INR
      
      const notes = paymentEntity.notes || {}
      const userId = notes.userId
      const courseId = notes.courseId

      console.log(`Processing captured payment ID: ${paymentId}, Amount: ${amountPaid} INR, User: ${userId}, Course: ${courseId}`)

      if (!userId || !courseId) {
        console.warn(`Skipping onboarding for payment ${paymentId}: Missing userId or courseId in payment notes.`)
        return NextResponse.json({ success: true, message: 'Skipped onboarding: missing user/course references in notes.' })
      }

      // Initialize direct backend Supabase client using anon key
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables are missing on the server.')
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      try {
        // Call Postgres Stored Stored Procedure (RPC) atomically
        const { data, error: rpcError } = await supabase.rpc('execute_atomic_student_onboarding', {
          _user_id: userId,
          _course_id: courseId,
          _payment_id: paymentId,
          _amount: amountPaid
        })

        if (rpcError) {
          throw new Error(rpcError.message || JSON.stringify(rpcError))
        }

        console.log(`ACID Student Onboarding completed successfully in database for payment ${paymentId}`)
        return NextResponse.json({ success: true, message: 'Onboarding completed successfully' })

      } catch (dbErr) {
        console.error(`CRITICAL: Database transaction failed. Initiating Saga Compensation (Auto-Refund) pipeline for Payment ID: ${paymentId}. Error:`, dbErr)

        // SAGA COMPENSATION: Attempt to trigger a full refund via the Razorpay API
        try {
          const refund = await razorpay.payments.refund(paymentId, {
            amount: amountPaise, // Full refund in paise
            speed: 'normal',
            notes: {
              reason: 'Saga compensation: student onboarding transaction failed in database',
              errorDetails: dbErr.message || 'Supabase RPC error'
            }
          })
          console.log(`SAGA SUCCESS: Refund issued successfully. Refund ID: ${refund.id} for payment ${paymentId}`)
          return NextResponse.json({ 
            error: 'Database transaction failed. Payment refunded successfully.', 
            refundId: refund.id 
          }, { status: 500 })
        } catch (refundErr) {
          console.error(`FATAL SYSTEM ERROR: Saga Compensation refund failed for Payment ID: ${paymentId}. Manual intervention REQUIRED! Refund Error:`, refundErr)
          return NextResponse.json({ 
            error: 'Database transaction failed and refund compensation failed.', 
            dbError: dbErr.message, 
            refundError: refundErr.message 
          }, { status: 500 })
        }
      }
    }

    // 6. Handle payment refund/revocation events (refund.created / payment.refunded)
    if (body.event === 'refund.created' || body.event === 'payment.refunded') {
      const refundEntity = body.payload?.refund?.entity
      const paymentEntity = body.payload?.payment?.entity
      const paymentId = refundEntity?.payment_id || paymentEntity?.id

      if (!paymentId) {
        console.error('Webhook Error: Missing payment ID reference in refund webhook payload')
        return NextResponse.json({ error: 'Missing payment ID in refund payload' }, { status: 400 })
      }

      console.log(`Processing refund/revocation for payment ID: ${paymentId}`)

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase environment variables are missing on the server.')
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      try {
        // Invoke database transaction function to mathematically sever access
        const { data: success, error: rpcError } = await supabase.rpc('execute_enrollment_revocation', {
          _payment_id: paymentId
        })

        if (rpcError) {
          throw new Error(rpcError.message || JSON.stringify(rpcError))
        }

        if (success) {
          console.log(`ACID Enrollment successfully revoked in database for payment ${paymentId}`)
          return NextResponse.json({ success: true, message: 'Enrollment revoked successfully' })
        } else {
          console.warn(`Revocation RPC executed but returned false for payment ${paymentId} (No corresponding payment record found in invoices)`)
          return NextResponse.json({ success: true, message: 'Revocation acknowledged: payment record not found.' })
        }
      } catch (dbErr) {
        console.error(`CRITICAL: Database transaction failed during revocation for Payment ID: ${paymentId}. Error:`, dbErr)
        return NextResponse.json({ error: 'Database revocation transaction failed', details: dbErr.message }, { status: 500 })
      }
    }

    // Gracefully handle other events
    return NextResponse.json({ success: true, message: `Event ${body.event} received and acknowledged` })

  } catch (err) {
    console.error('Webhook Processing Exception:', err)
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 })
  }
}
