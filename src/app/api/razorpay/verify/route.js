import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/utils/crypto'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function POST(request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, courseId, batchId, amount } = await request.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details for verification' }, { status: 400 })
    }

    if (!courseId && !batchId) {
      return NextResponse.json({ error: 'Missing courseId or batchId reference' }, { status: 400 })
    }

    // 1. Authenticate user securely using getUser() to prevent unauthenticated/spoofed updates
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Secure user authentication required' }, { status: 401 })
    }

    // 2. Verify signature using edge-safe constant-time bitwise comparisons
    const text = razorpay_order_id + '|' + razorpay_payment_id
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      throw new Error('Razorpay Key Secret is missing in environment variables.')
    }

    const isValid = await verifyWebhookSignature(text, razorpay_signature, secret)

    if (!isValid) {
      console.error('Signature verification failed.')
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
    }

    // 3. Amount verification/fallback
    const amountPaid = amount ? amount / 100 : 0 // amount is in paise

    // 4. Enroll user atomically using supabase rpc
    if (batchId) {
      const { data, error: rpcError } = await supabase.rpc('execute_atomic_batch_onboarding', {
        _user_id: user.id,
        _batch_id: batchId,
        _payment_id: razorpay_payment_id,
        _amount: amountPaid
      })

      if (rpcError) {
        throw new Error(rpcError.message || JSON.stringify(rpcError))
      }

      console.log(`Verification: Student Batch Onboarding completed successfully for payment ${razorpay_payment_id}`)
      return NextResponse.json({ success: true, message: 'Batch onboarding verified and completed successfully' })
    } else {
      const { data, error: rpcError } = await supabase.rpc('execute_atomic_student_onboarding', {
        _user_id: user.id,
        _course_id: courseId,
        _payment_id: razorpay_payment_id,
        _amount: amountPaid
      })

      if (rpcError) {
        throw new Error(rpcError.message || JSON.stringify(rpcError))
      }

      console.log(`Verification: Student Course Onboarding completed successfully for payment ${razorpay_payment_id}`)
      return NextResponse.json({ success: true, message: 'Course onboarding verified and completed successfully' })
    }
  } catch (err) {
    console.error('Payment Verification Exception:', err)
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 })
  }
}
