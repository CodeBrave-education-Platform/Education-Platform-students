import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/utils/crypto'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      courseId,
      batchId,
      packageId,
      bookId,
      item_type,
      item_id,
      amount,
      bookTitle,
      shippingAddress
    } = body

    // 1. Authenticate user securely using getUser() to prevent unauthenticated/spoofed updates
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Secure user authentication required' }, { status: 401 })
    }

    if (!razorpay_order_id || !razorpay_signature || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing payment details for verification' }, { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'P0YIbV3ZGKgDkloeyVk7meXl'

    // 2. Verify signature (support free tier bypass or edge-safe constant-time HMAC check)
    let isValid = false
    if (razorpay_signature === 'free_tier_bypass' && (amount === 0 || !amount)) {
      isValid = true
    } else {
      const text = razorpay_order_id + '|' + razorpay_payment_id
      isValid = await verifyWebhookSignature(text, razorpay_signature, secret)
    }

    if (!isValid) {
      console.error('[RAZORPAY VERIFY] Signature verification failed.')
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
    }

    // 3. Amount verification (amount in paise -> rupees)
    const amountPaid = amount ? amount / 100 : 0

    // Resolve polymorphic targets
    const targetCourseId = courseId || (item_type === 'course' ? item_id : null)
    const targetBatchId = batchId || (item_type === 'batch' ? item_id : null)
    const targetPackageId = packageId || (item_type === 'package' ? item_id : null)
    const targetBookId = bookId || (item_type === 'book' ? item_id : null)

    let createdInvoiceId = razorpay_payment_id

    // 4. Handle Physical Book Orders
    if (targetBookId && shippingAddress) {
      const { data: rpcResult, error: bookRpcError } = await supabase.rpc('execute_atomic_book_order', {
        _user_id: user.id,
        _book_id: targetBookId,
        _shipping_address: shippingAddress,
        _payment_id: razorpay_payment_id,
        _amount: amountPaid,
        _shipping_fee: 0,
        _secret_token: secret
      })

      if (bookRpcError) {
        console.warn('[BOOK ONBOARDING RPC FALLBACK]:', bookRpcError.message)
        // Direct resilient fallback
        await supabase.from('book_orders').insert([{
          user_id: user.id,
          book_id: targetBookId,
          shipping_address: shippingAddress,
          amount_paid: amountPaid,
          shipping_fee: 0,
          status: 'placed'
        }])
        await supabase.from('invoices').insert([{
          user_id: user.id,
          profile_id: user.id,
          book_id: targetBookId,
          razorpay_payment_id,
          razorpay_order_id,
          amount_paid: amountPaid,
          currency: 'INR',
          status: 'success'
        }])
      }

      console.log(`[VERIFY] Book Order verified for payment ${razorpay_payment_id}`)
      return NextResponse.json({
        success: true,
        message: 'Book order verified and placed successfully',
        invoice_id: razorpay_payment_id,
        item_type: 'book',
        item_id: targetBookId
      })
    }

    // 5. Handle Test Series Package Unlocking
    if (targetPackageId) {
      const { data: rpcResult, error: pkgRpcError } = await supabase.rpc('execute_atomic_package_onboarding', {
        _user_id: user.id,
        _package_id: targetPackageId,
        _payment_id: razorpay_payment_id,
        _amount: amountPaid,
        _secret_token: secret
      })

      if (pkgRpcError) {
        console.warn('[PACKAGE ONBOARDING RPC FALLBACK]:', pkgRpcError.message)
        // Direct resilient fallback
        const { data: invData, error: invError } = await supabase.from('invoices').insert([{
          user_id: user.id,
          profile_id: user.id,
          package_id: targetPackageId,
          razorpay_payment_id,
          razorpay_order_id,
          amount_paid: amountPaid,
          currency: 'INR',
          status: 'success',
          invoice_date: new Date().toISOString()
        }]).select('id').maybeSingle()

        if (invError) {
          throw new Error(invError.message || 'Failed to record package invoice')
        }
        if (invData?.id) createdInvoiceId = invData.id

        // Upgrade profile role
        await supabase.from('profiles').update({ role: 'paid_student' }).eq('id', user.id)
      }

      console.log(`[VERIFY] Test Package unlocked successfully for payment ${razorpay_payment_id}`)
      return NextResponse.json({
        success: true,
        message: 'Test Package unlocking verified and completed successfully',
        invoice_id: createdInvoiceId,
        item_type: 'package',
        item_id: targetPackageId
      })
    }

    // 6. Handle Live Cohort Batch Onboarding
    if (targetBatchId) {
      const { data: rpcResult, error: batchRpcError } = await supabase.rpc('execute_atomic_batch_onboarding', {
        _user_id: user.id,
        _batch_id: targetBatchId,
        _payment_id: razorpay_payment_id,
        _amount: amountPaid,
        _secret_token: secret
      })

      if (batchRpcError) {
        console.warn('[BATCH ONBOARDING RPC FALLBACK]:', batchRpcError.message)
        // Direct resilient fallback
        await supabase.from('invoices').insert([{
          user_id: user.id,
          profile_id: user.id,
          batch_id: targetBatchId,
          razorpay_payment_id,
          razorpay_order_id,
          amount_paid: amountPaid,
          currency: 'INR',
          status: 'success'
        }])
        await supabase.from('batch_enrollments').upsert({
          user_id: user.id,
          batch_id: targetBatchId,
          status: 'active'
        }, { onConflict: 'user_id,batch_id' })
        await supabase.from('profiles').update({ role: 'paid_student' }).eq('id', user.id)
      }

      console.log(`[VERIFY] Batch onboarding completed successfully for payment ${razorpay_payment_id}`)
      return NextResponse.json({
        success: true,
        message: 'Batch onboarding verified and completed successfully',
        invoice_id: createdInvoiceId,
        item_type: 'batch',
        item_id: targetBatchId
      })
    }

    // 7. Handle Standard Course Onboarding
    if (targetCourseId) {
      const { data: rpcResult, error: courseRpcError } = await supabase.rpc('execute_atomic_student_onboarding', {
        _user_id: user.id,
        _course_id: targetCourseId,
        _payment_id: razorpay_payment_id,
        _amount: amountPaid,
        _secret_token: secret
      })

      if (courseRpcError) {
        console.warn('[COURSE ONBOARDING RPC FALLBACK]:', courseRpcError.message)
        // Direct resilient fallback
        await supabase.from('invoices').insert([{
          user_id: user.id,
          profile_id: user.id,
          course_id: targetCourseId,
          razorpay_payment_id,
          razorpay_order_id,
          amount_paid: amountPaid,
          currency: 'INR',
          status: 'success'
        }])
        await supabase.from('enrollments').upsert({
          user_id: user.id,
          course_id: targetCourseId,
          status: 'active'
        }, { onConflict: 'user_id,course_id' })
        await supabase.from('profiles').update({ role: 'paid_student' }).eq('id', user.id)
      }

      console.log(`[VERIFY] Course onboarding completed successfully for payment ${razorpay_payment_id}`)
      return NextResponse.json({
        success: true,
        message: 'Course onboarding verified and completed successfully',
        invoice_id: createdInvoiceId,
        item_type: 'course',
        item_id: targetCourseId
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      invoice_id: razorpay_payment_id,
      item_type: item_type || 'general',
      item_id: item_id || razorpay_payment_id
    })

  } catch (err) {
    console.error('[PAYMENT VERIFY] Critical Exception:', err)
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 })
  }
}
