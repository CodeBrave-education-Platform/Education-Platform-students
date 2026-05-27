import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/utils/supabase/server'

export async function POST(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, userId } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Verify authenticity of signature using Razorpay secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Signature verification failed. Potential tampering.' }, { status: 400 })
    }

    // TODO: Supabase Inserts: 1. Add to public.invoices 2. Add to public.enrollments 3. Update profiles.role to 'paid_student'
    const supabase = await createClient()

    // A. Fetch course details to ensure course exists and retrieve price
    let coursePrice = 0
    let courseTitle = 'ASENTRA Course'
    let courseDesc = 'Premium academic course'
    let courseLevel = 'mains'

    const { data: dbCourse } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()

    if (dbCourse) {
      coursePrice = Number(dbCourse.price)
      courseTitle = dbCourse.title
      courseDesc = dbCourse.description || courseDesc
      courseLevel = dbCourse.level || courseLevel
    } else {
      // It is a mock course - retrieve pre-fill details to upsert securely
      const mockCourses = {
        'f0000000-0000-0000-0000-000000000101': {
          title: '1 Rupee Real Payment Gateway Test Course',
          price: 1,
          description: 'Use this course to test actual live or sandbox payment processing.',
          level: 'mains'
        },
        'f0000000-0000-0000-0000-000000000102': {
          title: '10 Rupee Micro-Seminar: JEE Exam Strategies',
          price: 10,
          description: 'Perfect for testing medium-value sandbox or live micro-transactions.',
          level: 'advanced'
        },
        'f0000000-0000-0000-0000-000000000002': {
          title: 'IIT JEE Mains Mastery: Physics & Chemistry',
          price: 4999,
          description: 'Comprehensive preparation ledger covering kinematics, thermodynamics, and bonding.',
          level: 'mains'
        },
        'f0000000-0000-0000-0000-000000000003': {
          title: 'IIT JEE Advanced: Elite Calculus & Trigonometry',
          price: 9999,
          description: 'Solve advanced level limits, continuity, differential equations, and complex variables.',
          level: 'advanced'
        }
      }

      const mockInfo = mockCourses[courseId]
      if (mockInfo) {
        coursePrice = mockInfo.price
        courseTitle = mockInfo.title
        courseDesc = mockInfo.description
        courseLevel = mockInfo.level

        // Upsert course metadata to prevent foreign key violations on enrollments / invoices
        const { error: upsertError } = await supabase
          .from('courses')
          .upsert({
            id: courseId,
            title: courseTitle,
            description: courseDesc,
            price: coursePrice,
            level: courseLevel
          })
        
        if (upsertError) {
          console.error('Course upsert error:', upsertError)
          throw new Error('Failed to synchronize course information in DB: ' + upsertError.message)
        }
      } else {
        throw new Error('Requested course ID not found in catalog database.')
      }
    }

    // B. Write to public.invoices
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        course_id: courseId,
        razorpay_payment_id: razorpay_payment_id,
        amount_paid: coursePrice,
        currency: 'INR',
        status: 'paid'
      })

    if (invoiceError) {
      console.error('Failed to create invoice record:', invoiceError)
      // We don't throw because payment succeeded, but log it
    }

    // C. Write to public.enrollments
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'active'
      })

    if (enrollError && enrollError.code !== '23505') { // 23505 is unique violation (already enrolled)
      console.error('Failed to create enrollment record:', enrollError)
      throw new Error('Payment verified, but database enrollment creation failed: ' + enrollError.message)
    }

    // D. Update profiles.role to 'paid_student'
    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'paid_student' })
      .eq('id', userId)

    if (roleError) {
      console.error('Failed to update student role to paid_student:', roleError)
    }

    return NextResponse.json({ success: true, message: 'Payment successfully verified and enrolled.' })
  } catch (err) {
    console.error('Signature Verification API Exception:', err)
    return NextResponse.json({ error: err.message || 'Signature verification failed' }, { status: 500 })
  }
}
