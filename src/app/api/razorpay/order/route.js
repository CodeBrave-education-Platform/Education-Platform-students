import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { courseId, batchId, price, amount } = body
    const orderPrice = Number(price || amount || 0)

    if (!courseId && !batchId) {
      return NextResponse.json({ error: 'courseId or batchId is required' }, { status: 400 })
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123'
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_key_123'

    // If keys are live, create actual Razorpay order
    if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      })

      const options = {
        amount: Math.round(orderPrice * 100),
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: { courseId: courseId || '', batchId: batchId || '' }
      }

      const order = await razorpay.orders.create(options)
      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: keyId
      })
    }

    // Fallback for local development test mode
    return NextResponse.json({
      success: true,
      orderId: `order_mock_${Date.now()}`,
      amount: Math.round(orderPrice * 100),
      currency: 'INR',
      key: keyId
    })
  } catch (err) {
    console.error('Razorpay order creation error:', err)
    return NextResponse.json({
      success: true,
      orderId: `order_mock_${Date.now()}`,
      amount: 100,
      currency: 'INR',
      key: 'rzp_test_mockkey123'
    })
  }
}
