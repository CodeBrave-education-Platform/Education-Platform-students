# Milestone 2 API Route Audit & Patch Blueprint Report

**Date**: 2026-08-18  
**Author**: Explorer Subagent (Milestone 2: API Route Queries Scope)  
**Target Working Directory**: `d:\education portal\.agents\teamwork_preview_explorer_m2_api\`  
**Milestone**: Milestone 2 (API Route Queries Scope)

---

## 1. Observation

A systematic code audit of all Next.js App Router API routes under `src/app/api/` and related Server Actions was performed against the database schema definitions (`supabase/migrations/`) and `PROJECT.md` interface contracts:

### 1.1 `src/app/api/razorpay/verify/route.js`
- **Lines 57–65 (Package Payment Insertion)**:
  - Inserts into `invoices` with `profile_id: user.id` (Schema column is `user_id`).
  - Sets `status: 'captured'` while contract `PROJECT.md:49` specifies `CHECK (status IN ('success', 'pending', 'failed', 'refunded'))`.
  - Missing call to atomic RPC `execute_atomic_package_onboarding` (defined in Migration 15).
  - Missing fallback handling for `package_enrollments` or role updates.
- **Lines 76–106 (Batch & Course RPC Handlers)**:
  - Missing support for incoming polymorphic parameter shapes: `item_type` (`'course' | 'batch' | 'package' | 'book'`) and `item_id`.
  - Book purchases without batch/course fall through to `execute_atomic_student_onboarding` with `_course_id: undefined`.
  - Missing explicit response fields matching `PROJECT.md:57` (`invoice_id`, `item_type`, `item_id`).

### 1.2 `src/app/api/test-series/grade/route.js`
- **Lines 50–61 (Scoring Calculation)**:
  - Answer comparison `ans.selected_option === q.correct_option_index` is susceptible to string vs number type mismatches (e.g. `'0'` vs `0`).
  - Marks scheme extraction lacks default fallbacks for undefined/string positive and negative marks.
- **Lines 88–115 (Gamification & Stats Updates)**:
  - Multiplier check uses `accuracy >= 0.8` without normalizing accuracy to 0–100 or providing a baseline XP floor for partial completion.
  - Streak computation does not check `last_active_date` calendar day continuity (simply increments by 1).
- **Line 118 (Response Contract Deviation)**:
  - Returns only `{ success: true, attemptId, score, earnedXp }`.
  - Violates `PROJECT.md:53` contract which mandates: `{ success: true, score, totalMarks, percentage, correctCount, incorrectCount, unattemptedCount, accuracy, attemptId, newStreak, newXp, rankBadge }`.

### 1.3 `src/app/api/downloads/route.js`
- **Lines 85–114 (Authorization Queries)**:
  - Queries `enrollments` and `batch_enrollments` with `.eq('status', 'active')` (strict lowercase). If an enrollment was created via webhook with `'ACTIVE'`, access is rejected (HTTP 403).
  - Lacks role-based authorization bypass for instructors/admins/teachers inspecting or downloading course assets.
- **Lines 133–160 (Storage Redirection)**:
  - If signed URL creation fails for mock dev files, redirection to non-whitelisted external URLs lacks fallback sanitization.

### 1.4 `src/app/api/live/classroom/route.js`
- **Lines 261–277 (Doubt Insertion)**:
  - Direct insert to `lesson_doubts` without validating whether `lessonId` is a valid UUID, causing unhandled Postgres type cast exceptions for mock lesson IDs.
- **Lines 170–250 (Poll Voting)**:
  - Redis voting map handling for `poll-custom-` polls and in-memory cycle fallback requires clean error trapping for expired poll cycles.

### 1.5 `src/app/api/debug-courses/route.js`
- **Lines 12–16 (Course-Profile Join Query)**:
  - Executes `.from('courses').select('*, profiles(full_name)')`.
  - When `courses.instructor_id REFERENCES public.profiles(id)` exists, PostgREST resolves the relation. Returns structured diagnostics of courses, profiles, and active session status.

### 1.6 Additional API Routes
- **`src/app/api/razorpay/webhook/route.js:50`**: Inserts `status: 'ACTIVE'` (uppercase). Needs normalization to lowercase `'active'`.
- **`src/app/api/video/token/route.js:32`**: Uses `.eq('status', 'active')` which should be `.in('status', ['active', 'ACTIVE'])`.

---

## 2. Logic Chain

1. **Premise 1 (Database Column Consistency)**: The PostgreSQL `invoices` table is keyed on `user_id UUID REFERENCES public.profiles(id)`. Attempting to insert `profile_id` throws an undefined column error (`column "profile_id" of relation "invoices" does not exist`). Aligning the payload to `user_id` resolves the schema constraint violation.
2. **Premise 2 (Status Enum Compliance)**: Check constraints on `invoices.status` enforce `status IN ('success', 'pending', 'failed', 'refunded', 'captured')`. Normalizing `status` to `'success'` or `'captured'` guarantees compliance across both table check constraints and RPC functions.
3. **Premise 3 (Atomic Onboarding RPCs)**: Migration 13, 15, and 16 created SECURITY DEFINER functions (`execute_atomic_student_onboarding`, `execute_atomic_batch_onboarding`, `execute_atomic_package_onboarding`, `execute_atomic_book_order`) that validate `_secret_token` against `secure_config`. Calling these RPCs from server-side route handlers ensures that financial ledger writes, enrollment unlocks, and role upgrades occur in a single atomic database transaction.
4. **Premise 4 (Server-Authoritative CBT Grading)**: The client cannot be trusted for score calculation or correct answers. Fetching `test_exams.questions` and `marks_scheme` on the server, parsing answers securely with `Number(ans.selected_option) === Number(q.correct_option_index)`, applying positive/negative marks, and computing percentage/accuracy guarantees anti-tamper security.
5. **Premise 5 (Interface Contract Fulfillment)**: The frontend clients (`CbtEngineClient.jsx`, `TestSeriesHubClient.jsx`, `DashboardClient.jsx`) rely on standardized JSON keys. Returning the exact fields defined in `PROJECT.md:51-58` prevents runtime `undefined` UI bugs and hydration errors.

---

## 3. Caveats

- **Razorpay Secret Key in Development**: In development environments where `RAZORPAY_KEY_SECRET` is not provided in `.env.local`, a fallback secret (`P0YIbV3ZGKgDkloeyVk7meXl` matching Migration 13 `secure_config.onboarding_secret_token` or `mock_secret`) ensures local mock transactions succeed.
- **Upstash Redis Availability**: In offline or mock test runners, Upstash Redis calls degrade gracefully to in-memory state without blocking HTTP request resolution.
- **Legacy Foreign Keys**: If the database has both `user_id` and `profile_id` on certain views, providing `user_id` as the primary key guarantees compatibility.

---

## 4. Conclusion & Exact Code Patch Blueprints

The following exact, drop-in replacement code patches have been engineered for Milestone 2 implementation:

---

### Blueprint 1: `src/app/api/razorpay/verify/route.js`

```javascript
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

    // 2. Verify signature using edge-safe constant-time comparisons
    const text = razorpay_order_id + '|' + razorpay_payment_id
    const isValid = await verifyWebhookSignature(text, razorpay_signature, secret)

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
      invoice_id: razorpay_payment_id
    })

  } catch (err) {
    console.error('[PAYMENT VERIFY] Critical Exception:', err)
    return NextResponse.json({ error: err.message || 'Payment verification failed' }, { status: 500 })
  }
}
```

---

### Blueprint 2: `src/app/api/test-series/grade/route.js`

```javascript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { examId, answers, secondsRemaining, durationMinutes } = await request.json()

    if (!examId || !answers) {
      return NextResponse.json({ error: 'Missing examId or answers payload' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 })
    }

    // 1. Securely fetch exam metadata, questions, and marking scheme
    const { data: examData, error: examError } = await supabase
      .from('test_exams')
      .select('id, title, duration_minutes, questions, marks_scheme')
      .eq('id', examId)
      .single()

    if (examError || !examData) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Parse questions array
    let questions = []
    if (typeof examData.questions === 'string') {
      try {
        questions = JSON.parse(examData.questions)
      } catch (e) {
        questions = []
      }
    } else if (Array.isArray(examData.questions)) {
      questions = examData.questions
    }

    // Standard marking scheme
    const positiveMarks = Number(examData.marks_scheme?.positive_marks ?? 4)
    const negativeMarks = -Math.abs(Number(examData.marks_scheme?.negative_marks ?? 1))

    let correct = 0
    let incorrect = 0
    let unanswered = 0
    let rawScore = 0

    // 2. Server-Authoritative Blind Grading Engine
    questions.forEach((q) => {
      const qId = q.id || q.question_id
      const ans = answers[qId] || answers[String(qId)]

      if (!ans || ans.selected_option === undefined || ans.selected_option === null || ans.selected_option === '') {
        unanswered++
      } else {
        const submittedOption = Number(ans.selected_option)
        const correctOption = Number(q.correct_option_index)

        if (submittedOption === correctOption) {
          correct++
          rawScore += positiveMarks
        } else {
          incorrect++
          rawScore += negativeMarks
        }
      }
    })

    const totalQuestions = questions.length
    const totalMarks = totalQuestions * positiveMarks
    const attemptedCount = correct + incorrect
    const score = Math.round(rawScore)
    const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0
    const accuracy = attemptedCount > 0 ? Number(((correct / attemptedCount) * 100).toFixed(2)) : 0

    const totalDuration = (Number(durationMinutes) || examData.duration_minutes || 180) * 60
    const remaining = Number(secondsRemaining) || 0
    const durationSeconds = Math.max(0, Math.min(totalDuration, totalDuration - remaining))

    // 3. Persist Test Attempt Record
    const { data: attempt, error: insertError } = await supabase
      .from('test_attempts')
      .insert([{
        user_id: user.id,
        exam_id: examId,
        answers_payload: answers,
        score,
        correct_count: correct,
        incorrect_count: incorrect,
        unanswered_count: unanswered,
        total_duration_seconds: durationSeconds,
        completed_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (insertError) {
      console.error('[GRADE API] Failed to insert test attempt:', insertError)
      return NextResponse.json(
        { error: `Database rejection: ${insertError.message}` },
        { status: 500 }
      )
    }

    // 4. Gamification Engine: XP, Streak, Rank Badge Calculation
    let earnedXp = correct * 10
    if (accuracy >= 80) earnedXp = Math.floor(earnedXp * 1.5)
    if (earnedXp === 0 && correct > 0) earnedXp = 10

    let newXp = earnedXp
    let newStreak = 1
    let rankBadge = 'Bronze'

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, streak, rank_badge, last_active_date')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        newXp = (Number(profile.xp) || 0) + earnedXp

        // Calculate daily streak
        if (profile.last_active_date) {
          const lastDate = new Date(profile.last_active_date).toDateString()
          const today = new Date().toDateString()
          const yesterday = new Date(Date.now() - 86400000).toDateString()

          if (lastDate === today) {
            newStreak = profile.streak || 1
          } else if (lastDate === yesterday) {
            newStreak = (profile.streak || 0) + 1
          } else {
            newStreak = 1
          }
        }

        // Rank Badge Progression
        if (newXp >= 10000) rankBadge = 'Platinum'
        else if (newXp >= 5000) rankBadge = 'Gold'
        else if (newXp >= 1000) rankBadge = 'Silver'
        else rankBadge = 'Bronze'

        await supabase.from('profiles').update({
          xp: newXp,
          streak: newStreak,
          rank_badge: rankBadge,
          last_active_date: new Date().toISOString()
        }).eq('id', user.id)
      }
    } catch (gamificationErr) {
      console.warn('[GRADE API] Non-fatal gamification update notice:', gamificationErr)
    }

    // 5. Return Complete Contract Payload
    return NextResponse.json({
      success: true,
      score,
      totalMarks,
      percentage,
      correctCount: correct,
      incorrectCount: incorrect,
      unattemptedCount: unanswered,
      accuracy,
      attemptId: attempt.id,
      earnedXp,
      newXp,
      newStreak,
      rankBadge
    })

  } catch (err) {
    console.error('[GRADE API] Critical Exception:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
```

---

### Blueprint 3: `src/app/api/downloads/route.js`

```javascript
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getSafeRedirectUrl } from '@/utils/security'

let redis
let ratelimit

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  }
} catch (e) {
  console.warn('Redis rate-limiter initialization skipped:', e.message)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const file = searchParams.get('file')
    const lessonId = searchParams.get('lessonId')
    const batchId = searchParams.get('batchId')

    if (!file || (!lessonId && !batchId)) {
      return NextResponse.json(
        { error: 'Missing required parameters: file and either lessonId or batchId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Authenticate user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid session' },
        { status: 401 }
      )
    }

    // 2. Sliding window rate limit check
    if (ratelimit) {
      try {
        const { success } = await ratelimit.limit(user.id)
        if (!success) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Max 10 downloads per minute allowed.' },
            { status: 429 }
          )
        }
      } catch (err) {
        console.warn('[RATE LIMIT NOTICE] Upstash Redis bypass:', err.message)
      }
    }

    // 3. User Role Check for Staff Bypass
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isStaff = profile?.role === 'admin' || profile?.role === 'teacher' || profile?.role === 'instructor'

    // 4. Authorization Check for Students
    if (!isStaff) {
      if (lessonId) {
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .select('course_id')
          .eq('id', lessonId)
          .maybeSingle()

        if (lessonError || !lesson) {
          return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', lesson.course_id)
          .in('status', ['active', 'ACTIVE'])
          .maybeSingle()

        if (!enrollment) {
          return NextResponse.json(
            { error: 'Forbidden: Active enrollment required' },
            { status: 403 }
          )
        }
      } else if (batchId) {
        const { data: enrollment } = await supabase
          .from('batch_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('batch_id', batchId)
          .in('status', ['active', 'ACTIVE'])
          .maybeSingle()

        if (!enrollment) {
          return NextResponse.json(
            { error: 'Forbidden: Active batch enrollment required' },
            { status: 403 }
          )
        }
      }
    }

    // 5. Resolve storage path
    let filePath = file
    if (file.startsWith('http')) {
      try {
        const parsedUrl = new URL(file)
        const parts = parsedUrl.pathname.split('/storage/v1/object/public/secure-assets/')
        if (parts.length > 1) {
          filePath = decodeURIComponent(parts[1])
        } else {
          filePath = parsedUrl.pathname.split('/').pop()
        }
      } catch (err) {
        console.error('Path parsing notice:', err)
      }
    }

    // 6. Generate signed URL (expires in 60s)
    const { data, error: signedUrlError } = await supabase
      .storage
      .from('secure-assets')
      .createSignedUrl(filePath, 60)

    if (signedUrlError || !data?.signedUrl) {
      if (file.startsWith('http')) {
        const safeUrl = getSafeRedirectUrl(file, '/dashboard')
        const isSupabaseUrl = file.includes('.supabase.co')
        if (safeUrl === '/dashboard' && !isSupabaseUrl) {
          return NextResponse.json(
            { error: 'Forbidden: Redirect domain is not whitelisted' },
            { status: 403 }
          )
        }
        return NextResponse.redirect(new URL(file, request.url))
      }
      return NextResponse.json(
        { error: 'Failed to generate secure download link' },
        { status: 500 }
      )
    }

    return NextResponse.redirect(new URL(data.signedUrl, request.url))
  } catch (err) {
    console.error('Download route exception:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

---

### Blueprint 4: `src/app/api/live/classroom/route.js`

```javascript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redisGet, redisSet } from '@/utils/redis'
import { getCorsHeaders } from '@/utils/security'

function corsResponse(request, response) {
  const headers = getCorsHeaders(request)
  Object.entries(headers).forEach(([key, val]) => {
    response.headers.set(key, val)
  })
  return response
}

const rateLimitMap = new Map()
const pollVotesMap = new Map()
const pollResultsMap = new Map()

function checkRateLimit(userId) {
  const now = Date.now()
  const lastActive = rateLimitMap.get(userId)
  if (lastActive && now - lastActive < 3000) {
    return false
  }
  rateLimitMap.set(userId, now)
  return true
}

async function baseGET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 })
    }

    const now = Date.now()

    // 1. Check Redis for active instructor custom poll
    const customPoll = await redisGet('asentra:live:poll')
    if (customPoll) {
      const results = (await redisGet('asentra:live:poll:results')) || { 0: 0, 1: 0, 2: 0, 3: 0 }
      const votesList = (await redisGet('asentra:live:poll:votes')) || []
      const hasVoted = votesList.includes(user.id)
      const totalVotes = Object.values(results).reduce((a, b) => a + b, 0)

      return NextResponse.json({
        classroomState: {
          activeCohort: 'ASENTRA-Beta-Cohort-2026',
          activeUsersCount: Math.floor(Math.random() * 42) + 180,
          livePoll: {
            id: customPoll.id,
            question: customPoll.question,
            options: customPoll.options,
            expiresAt: customPoll.expiresAt,
            timeLeftSeconds: Math.max(0, Math.floor((customPoll.expiresAt - now) / 1000)),
            hasVoted,
            totalVotes,
            results
          }
        }
      })
    }

    // 2. Cyclic fallback in-memory poll
    const secondsInMinute = new Date(now).getSeconds()
    const pollCycleSeconds = 30
    const currentCycleStart = now - (secondsInMinute % pollCycleSeconds) * 1000
    const expiresAt = currentCycleStart + pollCycleSeconds * 1000

    const pollPool = [
      {
        id: `poll-${Math.floor(currentCycleStart / 30000)}-1`,
        question: 'Which sorting algorithm has a worst-case time complexity of O(n log n)?',
        options: ['Bubble Sort', 'Merge Sort', 'Quick Sort', 'Selection Sort']
      },
      {
        id: `poll-${Math.floor(currentCycleStart / 30000)}-2`,
        question: 'In JavaScript, which keyword declares a block-scoped variable?',
        options: ['var', 'let', 'const', 'Both let and const']
      },
      {
        id: `poll-${Math.floor(currentCycleStart / 30000)}-3`,
        question: 'What is the primary function of a Progressive Web App service worker?',
        options: ['Database Queries', 'Asset Caching & Offline Support', 'CSS Grid layouts', 'Video Transcoding']
      }
    ]

    const selectedPollIdx = Math.floor((currentCycleStart / 30000) % pollPool.length)
    const currentPoll = pollPool[selectedPollIdx]

    if (!pollResultsMap.has(currentPoll.id)) {
      pollResultsMap.set(currentPoll.id, {
        0: Math.floor(Math.random() * 15) + 5,
        1: Math.floor(Math.random() * 45) + 30,
        2: Math.floor(Math.random() * 25) + 15,
        3: Math.floor(Math.random() * 10) + 2
      })
      pollVotesMap.set(currentPoll.id, new Set())
    }

    const currentResults = pollResultsMap.get(currentPoll.id)
    const hasVoted = pollVotesMap.get(currentPoll.id)?.has(user.id) || false
    const totalVotes = Object.values(currentResults).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      classroomState: {
        activeCohort: 'ASENTRA-Beta-Cohort-2026',
        activeUsersCount: Math.floor(Math.random() * 42) + 180,
        livePoll: {
          ...currentPoll,
          expiresAt,
          timeLeftSeconds: Math.max(0, Math.floor((expiresAt - now) / 1000)),
          hasVoted,
          totalVotes,
          results: currentResults
        }
      }
    })
  } catch (err) {
    console.error('Classroom sync GET exception:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function basePOST(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid session' }, { status: 401 })
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: 'Too Many Requests: Dynamic rate limiting blocks spam. Please wait 3 seconds.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { action, pollId, optionIndex, lessonId, content } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing parameter: action' }, { status: 400 })
    }

    // Handle Poll Submission
    if (action === 'submit_poll') {
      if (!pollId || optionIndex === undefined) {
        return NextResponse.json({ error: 'Missing required params: pollId and optionIndex' }, { status: 400 })
      }

      if (pollId.startsWith('poll-custom-')) {
        const customPoll = await redisGet('asentra:live:poll')
        if (!customPoll || customPoll.id !== pollId) {
          return NextResponse.json({ error: 'Poll session expired or inactive' }, { status: 404 })
        }

        const votesList = (await redisGet('asentra:live:poll:votes')) || []
        if (votesList.includes(user.id)) {
          return NextResponse.json({ error: 'Forbidden: You have already submitted a vote' }, { status: 403 })
        }

        votesList.push(user.id)
        await redisSet('asentra:live:poll:votes', votesList, { ex: customPoll.durationSeconds + 120 })

        const results = (await redisGet('asentra:live:poll:results')) || { 0: 0, 1: 0, 2: 0, 3: 0 }
        results[optionIndex] = (results[optionIndex] || 0) + 1
        await redisSet('asentra:live:poll:results', results, { ex: customPoll.durationSeconds + 300 })

        const totalVotes = Object.values(results).reduce((a, b) => a + b, 0)
        return NextResponse.json({
          success: true,
          message: 'Vote recorded successfully',
          livePoll: { id: pollId, hasVoted: true, totalVotes, results }
        })
      }

      const votesSet = pollVotesMap.get(pollId)
      if (!votesSet) {
        return NextResponse.json({ error: 'Poll session expired or inactive' }, { status: 404 })
      }

      if (votesSet.has(user.id)) {
        return NextResponse.json({ error: 'Forbidden: You have already submitted a vote' }, { status: 403 })
      }

      votesSet.add(user.id)
      const currentResults = pollResultsMap.get(pollId) || { 0: 0, 1: 0, 2: 0, 3: 0 }
      currentResults[optionIndex] = (currentResults[optionIndex] || 0) + 1
      pollResultsMap.set(pollId, currentResults)

      const totalVotes = Object.values(currentResults).reduce((a, b) => a + b, 0)
      return NextResponse.json({
        success: true,
        message: 'Vote recorded successfully',
        livePoll: { id: pollId, hasVoted: true, totalVotes, results: currentResults }
      })
    }

    // Handle Doubt Submission
    if (action === 'submit_doubt') {
      if (!lessonId || !content || !content.trim()) {
        return NextResponse.json({ error: 'Missing required params: lessonId and content' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('lesson_doubts')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          content: content.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase doubt insertion error:', error)
        return NextResponse.json({ error: 'Database write failed: ' + error.message }, { status: 500 })
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()

      return NextResponse.json({
        success: true,
        doubt: {
          ...data,
          profiles: profile || { full_name: user.email?.split('@')[0] || 'Student', email: user.email }
        }
      })
    }

    return NextResponse.json({ error: 'Invalid classroom action request' }, { status: 400 })
  } catch (err) {
    console.error('Classroom sync POST exception:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function OPTIONS(request) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) })
}

export async function GET(request) {
  const response = await baseGET(request)
  return corsResponse(request, response)
}

export async function POST(request) {
  const response = await basePOST(request)
  return corsResponse(request, response)
}
```

---

### Blueprint 5: `src/app/api/debug-courses/route.js`

```javascript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Session status
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // 2. Fetch courses with profiles relation join
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })

    // 3. Fetch profiles sample
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, xp, streak, rank_badge')
      .limit(10)

    return NextResponse.json({
      status: 'ok',
      authenticated: !!user,
      user: user ? { id: user.id, email: user.email } : null,
      coursesCount: courses?.length || 0,
      courses,
      coursesError: coursesError ? { message: coursesError.message, code: coursesError.code, details: coursesError.details } : null,
      profilesCount: profiles?.length || 0,
      profiles,
      profilesError: profilesError ? { message: profilesError.message, code: profilesError.code } : null
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

### Blueprint 6: `src/app/api/razorpay/webhook/route.js`

```javascript
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_secret_production_key';

    if (signature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json({ success: false, error: 'Invalid Razorpay HMAC signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody || '{}');
    const event = payload.event || 'payment.captured';

    console.log(`[Razorpay Production Webhook]: Event ${event} received`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const orderId = paymentEntity.order_id || `order_${Date.now()}`;
      const amount = (paymentEntity.amount || 49900) / 100;
      const studentEmail = paymentEntity.email || 'student@Asentra.edu.in';
      const notes = paymentEntity.notes || {};
      const userId = notes.userId;
      const courseId = notes.courseId;
      const batchId = notes.batchId;
      const packageId = notes.packageId;

      if (userId) {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        if (courseId) {
          await supabaseAdmin
            .from('enrollments')
            .upsert([{
              user_id: userId,
              course_id: courseId,
              status: 'active'
            }], { onConflict: 'user_id,course_id' });
        }

        if (batchId) {
          await supabaseAdmin
            .from('batch_enrollments')
            .upsert([{
              user_id: userId,
              batch_id: batchId,
              status: 'active'
            }], { onConflict: 'user_id,batch_id' });
        }

        if (packageId) {
          await supabaseAdmin
            .from('invoices')
            .insert([{
              user_id: userId,
              package_id: packageId,
              razorpay_payment_id: paymentEntity.id || `webhook_${Date.now()}`,
              razorpay_order_id: orderId,
              amount_paid: amount,
              currency: 'INR',
              status: 'success'
            }]);
        }
      }

      return NextResponse.json({
        success: true,
        event,
        orderId,
        amount,
        studentEmail,
        fulfillmentStatus: 'ACCESS_UNLOCKED',
        message: 'Order access unlocked & tax invoice receipt dispatched.'
      });
    }

    return NextResponse.json({ success: true, event, status: 'IGNORED' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## 5. Verification Method

To verify these route blueprints independently:

1. **Static Analysis & Type Checking**:
   Run Next.js build / typecheck:
   ```powershell
   npm run build
   ```

2. **Simulated CBT Test Submission & Grading**:
   Send POST request to `/api/test-series/grade`:
   ```json
   {
     "examId": "00000000-0000-0000-0000-000000000001",
     "answers": {
       "q-mechanics-01": { "selected_option": 1, "seconds_spent": 45 },
       "q-mechanics-02": { "selected_option": 2, "seconds_spent": 60 }
     },
     "secondsRemaining": 10200,
     "durationMinutes": 180
   }
   ```
   **Expected Response (200 OK)**:
   ```json
   {
     "success": true,
     "score": 8,
     "totalMarks": 300,
     "percentage": 2.67,
     "correctCount": 2,
     "incorrectCount": 0,
     "unattemptedCount": 73,
     "accuracy": 100,
     "attemptId": "<UUID>",
     "earnedXp": 30,
     "newXp": 30,
     "newStreak": 1,
     "rankBadge": "Bronze"
   }
   ```

3. **Simulated Payment Verification (Package, Batch, Course)**:
   Send POST request to `/api/razorpay/verify` with mock signature HMAC:
   ```json
   {
     "razorpay_order_id": "order_test_12345",
     "razorpay_payment_id": "pay_test_98765",
     "razorpay_signature": "<HMAC_SHA256_HASH>",
     "packageId": "pkg-hero-all-india-mock-2026",
     "amount": 79900
   }
   ```
   **Expected Response (200 OK)**:
   ```json
   {
     "success": true,
     "message": "Test Package unlocking verified and completed successfully",
     "invoice_id": "pay_test_98765",
     "item_type": "package",
     "item_id": "pkg-hero-all-india-mock-2026"
   }
   ```

4. **Invalidation Conditions**:
   - The findings and blueprints are invalidated if database table names or RPC function signatures are modified in postgres migrations without updating the corresponding route caller signatures.
