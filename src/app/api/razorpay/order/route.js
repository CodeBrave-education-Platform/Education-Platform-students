import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const { courseId, batchId, bookId, price, amount } = body
    const orderPrice = Number(price || amount || 0)

    if (!courseId && !batchId && !bookId) {
      return NextResponse.json({ error: 'courseId, batchId, or bookId is required' }, { status: 400 })
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay keys are not configured securely on this server.' }, { status: 500 })
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const options = {
      amount: Math.round(orderPrice * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { 
        courseId: courseId || '', 
        batchId: batchId || '',
        bookId: bookId || ''
      }
    }

    const order = await razorpay.orders.create(options)
    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: keyId
    })

  } catch (err) {
    console.error('Razorpay order creation error:', err)
    return NextResponse.json({
      success: false,
      error: 'Secure payment order could not be generated. Please try again.'
    }, { status: 500 })
  }
}
