# Client & Server Page DB Queries Audit & Code Patch Blueprints (Milestone 2)

**Author**: Explorer Subagent (Client & Server Page DB Queries Scope)  
**Date**: 2026-08-18  
**Working Directory**: `d:\education portal\.agents\teamwork_preview_explorer_m2_client_db\`  
**Target Files Audited**:
- `src/app/courses/page.jsx`
- `src/app/batches/page.jsx`
- `src/app/dashboard/page.jsx`
- `src/app/dashboard/DashboardClient.jsx`
- `src/app/test-series/engine/[examId]/page.js`
- `src/app/test-series/analytics/[attemptId]/page.js`
- `src/app/books/checkout/page.jsx`
- `src/app/analytics/page.jsx`

---

## 1. Observation

Direct code analysis of all client and server database interaction points revealed the following verbatim issues:

### 1.1 `src/app/courses/page.jsx` (Lines 237–272)
- **Direct Client-Side Database Inserts**:
  ```javascript
  const saveSuccessfulEnrollment = async (response) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { ... }
    try {
      await supabase.from('enrollments').insert({
        user_id: user.id,
        course_id: course.id,
        status: 'active'
      })
      const trackingId = `TRK-BK-${Math.floor(100000000 + Math.random() * 900000000)}`
      await supabase.from('invoices').insert({
        profile_id: user.id,
        user_id: user.id,
        course_id: course.id,
        amount_paid: finalEnrollPrice,
        currency: 'INR',
        status: 'success',
        invoice_date: new Date().toISOString().split('T')[0],
        razorpay_payment_id: response?.razorpay_payment_id || trackingId
      })
      ...
  ```
- **Defects**:
  1. `invoices` table has RLS enabled with no INSERT policy for regular authenticated users (only server-side SECURITY DEFINER RPCs can insert invoices).
  2. Bypasses cryptographic HMAC signature verification on the server (`POST /api/razorpay/verify`).
  3. Uses non-existent/redundant `profile_id` column on `invoices`.

### 1.2 `src/app/batches/page.jsx` (Lines 165–223 & 243–291)
- **No DB Batch Enrollment Persistence & In-Memory Only Storage**:
  ```javascript
  const saveSuccessfulJoin = () => {
    try {
      const existingBatches = JSON.parse(localStorage.getItem('Asentra_joined_batches') || '[]')
      const updatedBatches = [batch, ...existingBatches.filter(b => (b.id || b) !== batch.id)]
      localStorage.setItem('Asentra_joined_batches', JSON.stringify(updatedBatches))
    } catch (e) {}
    ...
  ```
- **Defects**:
  1. On payment completion, `saveSuccessfulJoin` only saves to browser `localStorage`.
  2. It never calls `/api/razorpay/verify` to write to `batch_enrollments` or `invoices` in PostgreSQL.
  3. `fetchBatches` on mount only checks `localStorage`, failing to fetch existing user enrollments from `public.batch_enrollments`.

### 1.3 `src/app/dashboard/page.jsx` (Lines 120–128 & 166–183)
- **PostgREST Foreign Key Join Expectations**:
  ```javascript
  // Line 121:
  const { data, error: coursesError } = await supabase
    .from('courses')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  // Line 167:
  const { data: invoicesData } = await supabase
    .from('invoices')
    .select('*, courses(title), batches(title)')
    .eq('user_id', user.id)
    .order('invoice_date', { ascending: false })
  ```
- **Defects**:
  1. In `courses`, the foreign key referencing `profiles(id)` is `instructor_id`. PostgREST requires the explicit FK constraint `courses.instructor_id REFERENCES public.profiles(id)` in place.
  2. In `invoices`, `test_packages(title)` is missing from the select statement even though users purchase test series packages (`package_id REFERENCES public.test_packages(id)`).

### 1.4 `src/app/dashboard/DashboardClient.jsx` (Lines 411–433 & 561–595)
- **Invalid Client-Side RPC Call Without Secret Token & Direct Invoice Inserts**:
  ```javascript
  // Line 565:
  const { data, error } = await supabase
    .rpc('execute_atomic_batch_onboarding', {
      _user_id: user.id,
      _batch_id: batch.id,
      _payment_id: paymentId,
      _amount: 0
    })
  ```
- **Defects**:
  1. Migration 13 defined `execute_atomic_batch_onboarding(_user_id, _batch_id, _payment_id, _amount, _secret_token)` requiring 5 arguments and secret token matching `secure_config`. Calling it from the client with 4 arguments fails with Postgres signature mismatch / unauthorized exception.
  2. Direct client insert into `invoices` in `handleEnroll` (line 424) is blocked by RLS.

### 1.5 `src/app/test-series/engine/[examId]/page.js` (Lines 37–41 & 59–65)
- **Wrong Column Name on Invoices Query & Potential Question String Parsing**:
  ```javascript
  // Line 60:
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('profile_id', authenticatedUser.id)
    .eq('package_id', exam.package_id)
    .single()
  ```
- **Defects**:
  1. `invoices` table column is `user_id`, not `profile_id`. Querying `profile_id` throws a column does not exist error and causes access denial for paid exams.
  2. `exam.questions` and `exam.marks_scheme` may be returned as serialized JSON strings from PostgreSQL or mock data. If unparsed, array methods crash.

### 1.6 `src/app/test-series/analytics/[attemptId]/page.js` (Lines 37–40) & `src/app/analytics/page.jsx` (Lines 46–48)
- Unchecked access on `attempt.test_exams.questions` and `attempt.answers_payload` without string type verification can throw runtime errors if PostgreSQL returns stringified JSONB.

---

## 2. Logic Chain

1. **Premise 1 (Cryptographic & Transactional Integrity)**: Payments and enrollment provisioning must be server-authoritative to verify HMAC signatures with `RAZORPAY_KEY_SECRET` and execute atomic database transactions using SECURITY DEFINER RPCs.
2. **Step 1 (`courses/page.jsx` & `batches/page.jsx`)**: When client components bypass `/api/razorpay/verify` and attempt direct browser `insert` or localStorage updates, security is compromised, RLS blocks invoice creation, and cross-session persistence fails. Routing through `/api/razorpay/verify` restores server-side HMAC validation and invokes `execute_atomic_student_onboarding` and `execute_atomic_batch_onboarding`.
3. **Step 2 (`dashboard/page.jsx` & `DashboardClient.jsx`)**: PostgREST joins require exact foreign key declarations (`invoices.batch_id -> batches(id)`, `invoices.package_id -> test_packages(id)`, `courses.instructor_id -> profiles(id)`). Adding `test_packages(title)` to the `invoices` select statement allows all purchase types (courses, batches, packages) to display correct titles in the student financial ledger. Furthermore, removing client-side `supabase.rpc('execute_atomic_batch_onboarding', ...)` and routing free/paid enrollments through `/api/razorpay/verify` eliminates token mismatch errors.
4. **Step 3 (`test-series/engine/[examId]/page.js`)**: In PostgreSQL, the foreign key column on `invoices` referencing users is `user_id`. Replacing `.eq('profile_id', ...)` with `.eq('user_id', ...)` ensures authorization verification succeeds for legitimate purchasers. Adding defensive `JSON.parse` checks guarantees crash-free execution regardless of whether Supabase returns parsed JSONB or serialized text.

---

## 3. Caveats

- **Free Tier Bypasses in `/api/razorpay/verify`**: For 0-rupee (free) enrollments, `/api/razorpay/verify` or the client must handle mock transaction IDs (`free_enroll_*`) gracefully without requiring Razorpay gateway roundtrips.
- **Migration Dependency**: The PostgREST relation joins (`courses.instructor_id -> profiles` and `invoices.batch_id -> batches`) depend on Migration 17 (`20260530170000_17_comprehensive_schema_fix.sql`) being applied.

---

## 4. Conclusion & Concrete Code Patch Blueprints

### Blueprint 1: `src/app/courses/page.jsx`
Replace lines 216–304 with server-authoritative verification:

```jsx
  const handleEnrollCourse = async (course) => {
    if (enrolledCourseIds.includes(course.id)) return
    setProcessingId(course.id)

    // 1. Verify user session before payment
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = `/login?redirect=/courses`
      setProcessingId(null)
      return
    }

    let finalEnrollPrice = course.price
    if (userXp > 1000) {
      finalEnrollPrice = Math.max(1, Math.floor(course.price * 0.9))
    }

    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          price: finalEnrollPrice
        })
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize checkout order.')
      }

      const options = {
        key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: Math.round(finalEnrollPrice * 100),
        currency: 'INR',
        name: 'Asentra Education Platform',
        description: `${course.title} + Free Book Kit`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            setProcessingId(course.id)
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_signature: response.razorpay_signature,
                courseId: course.id,
                amount: Math.round(finalEnrollPrice * 100)
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Payment verification failed.')
            }

            const trackingId = `TRK-BK-${Math.floor(100000000 + Math.random() * 900000000)}`
            setEnrolledCourseIds(prev => [...prev, course.id])
            alert(`🎉 Payment Verified! You enrolled in "${course.title}". Course unlocked under "My Learning", and your physical study kit has been dispatched with Tracking ID: ${trackingId}!`)
          } catch (verifyErr) {
            console.error('Enrollment verification error:', verifyErr)
            alert(verifyErr.message || 'Payment verification failed. Please contact support.')
          } finally {
            setProcessingId(null)
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || 'Candidate',
          email: user.email || 'candidate@asentra.edu.in',
          contact: user.phone || '9876543210'
        },
        theme: {
          color: '#0D9488'
        }
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        throw new Error('Razorpay payment SDK not loaded.')
      }
    } catch (err) {
      console.error('Payment error:', err)
      alert(err.message || 'Payment initialization failed.')
      setProcessingId(null)
    }
  }
```

---

### Blueprint 2: `src/app/batches/page.jsx`
Update `fetchBatches` and `handleJoinBatch`:

```jsx
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const { data, error } = await supabase.from('batches').select('*')
        if (data && data.length > 0) {
          const mappedData = data.map(b => ({
            ...b,
            title: b.title || 'Untitled Batch',
            faculty: b.faculty || b.instructor_name || 'Expert Faculty Team',
            facultyRole: b.instructor_role || 'Senior Academic Mentors',
            cover: b.thumbnail_url || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
            badge: b.badge || (b.is_featured ? 'FLAGSHIP COHORT' : 'LIVE BATCH'),
            rating: b.rating || 4.9,
            targetYear: b.level || b.target_year || 'TARGET 2026',
            schedule: b.schedule || 'Mon - Fri Live Classes (6:00 PM - 9:00 PM)',
            studentsEnrolled: b.students_enrolled ? `${b.students_enrolled} Enrolled` : '85% Seats Filled',
            seatsLeft: b.seats_left || 15,
            checklist: Array.isArray(b.checklist) && b.checklist.length > 0 ? b.checklist : [
              'Daily Live 2-Way Interactive Video Classes',
              'Printed 6-Volume Hardcopy Study Material Box Shipped Free',
              'Full NTA CBT Simulation Mocks with Live National Ranking',
              'Instant 24/7 AI Doubt Resolution Support'
            ],
            includedBookBox: b.book_kit || { 
              title: 'Standard Printed Physical Textbook Box + Worksheets', 
              booksCount: 4, 
              value: 2999 
            },
            curriculum: Array.isArray(b.curriculum) && b.curriculum.length > 0 ? b.curriculum : [
              {
                chapter: 'Module 1: High-Yield Theory & Fundamental Concepts',
                duration: '6 Weeks (36 Live Hours)',
                lessons: [
                  { title: 'Core Lecture Series & Diagnostic Drills', type: 'Live Lecture', pdfUrl: '/downloads/worksheets.pdf' },
                  { title: 'In-Depth Problem-Solving Laboratory', type: 'Problem Lab', pdfUrl: '/downloads/worksheets.pdf' }
                ]
              }
            ]
          }))
          setBatches(mappedData)
        } else {
          setBatches(DEFAULT_BATCHES)
        }
      } catch (err) {
        console.error('Error fetching batches:', err)
        setBatches(DEFAULT_BATCHES)
      } finally {
        setLoadingBatches(false)
      }
    }
    fetchBatches()
    
    // Fetch authenticated user's active batch enrollments from database
    const fetchUserBatchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: enrollments } = await supabase
            .from('batch_enrollments')
            .select('batch_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
          if (enrollments && enrollments.length > 0) {
            setJoinedBatchIds(enrollments.map(e => e.batch_id))
          }
        }
      } catch (e) {}
    }
    fetchUserBatchData()
  }, [])

  const handleJoinBatch = async (batch) => {
    if (joinedBatchIds.includes(batch.id)) return
    setProcessingId(batch.id)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = `/login?redirect=/batches`
      setProcessingId(null)
      return
    }

    const finalEnrollPrice = batch.price

    try {
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          price: finalEnrollPrice
        })
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize batch order.')
      }

      const options = {
        key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: Math.round(finalEnrollPrice * 100),
        currency: 'INR',
        name: 'Asentra Education Platform',
        description: `${batch.title} + Free Book Box`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            setProcessingId(batch.id)
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_signature: response.razorpay_signature,
                batchId: batch.id,
                amount: Math.round(finalEnrollPrice * 100)
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Batch enrollment verification failed.')
            }

            const trackingId = `TRK-DT-${Math.floor(100000000 + Math.random() * 900000000)}`
            setJoinedBatchIds(prev => [...prev, batch.id])
            alert(`🎉 Payment Successful! You joined "${batch.title}". Your cohort is active under "Batches" in Dashboard, and your Academic Book Box has been dispatched with Tracking ID: ${trackingId}!`)
          } catch (verifyErr) {
            console.error('Batch verification error:', verifyErr)
            alert(verifyErr.message || 'Payment verification failed. Please contact support.')
          } finally {
            setProcessingId(null)
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || 'Student Candidate',
          email: user.email || 'student@asentra.edu.in',
          contact: user.phone || '9876543210'
        },
        theme: {
          color: '#0D9488'
        }
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        throw new Error('Razorpay payment SDK not loaded.')
      }
    } catch (err) {
      console.error('Payment error', err)
      alert(err.message || 'Payment initialization failed.')
      setProcessingId(null)
    }
  }
```

---

### Blueprint 3: `src/app/dashboard/page.jsx` & `src/app/dashboard/DashboardClient.jsx`

#### In `src/app/dashboard/page.jsx` (Lines 166–183):
```jsx
  let dbInvoices = []
  if (role !== 'teacher') {
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*, courses(title), batches(title), test_packages(title)')
      .eq('user_id', user.id)
      .order('invoice_date', { ascending: false })

    if (invoicesError) {
      console.error('[DASHBOARD INVOICES ERROR]:', invoicesError)
    }

    if (invoicesData) {
      dbInvoices = invoicesData.map(inv => ({
        id: inv.id ? inv.id.slice(0, 8).toUpperCase() : 'INV-REC',
        courseTitle: inv.courses?.title || inv.batches?.title || inv.test_packages?.title || 'Academic Program Access',
        razorpayId: inv.razorpay_payment_id || 'N/A',
        amount: Number(inv.amount_paid) === 0 ? 'Free' : `₹${Number(inv.amount_paid).toLocaleString('en-IN')}`,
        currency: inv.currency || 'INR',
        date: inv.invoice_date || new Date().toISOString().split('T')[0],
        status: inv.status === 'captured' || inv.status === 'success' ? 'Paid' : (inv.status || 'Paid')
      }))
    }
  }
```

#### In `src/app/dashboard/DashboardClient.jsx` (Lines 561–595):
Replace client-side RPC call with `/api/razorpay/verify`:

```jsx
  const handleBatchEnroll = async (batch) => {
    setCheckoutLoadingId(batch.id)
    try {
      const paymentId = `free_enroll_${Date.now()}`
      const verifyRes = await fetch('/api/razorpay/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_payment_id: paymentId,
          razorpay_order_id: `order_${paymentId}`,
          razorpay_signature: 'free_tier_bypass',
          batchId: batch.id,
          amount: 0
        })
      })

      const verifyData = await verifyRes.json()
      if (!verifyRes.ok || verifyData.error) {
        throw new Error(verifyData.error || 'Failed to enroll in cohort batch via transaction.')
      }

      // Upsert enrollment in local state instantly for 0ms reactive UI update
      const newBatchEnroll = {
        id: paymentId,
        user_id: user.id,
        batch_id: batch.id,
        status: 'active',
        enrolled_at: new Date().toISOString()
      }
      setBatchEnrollments(prev => [newBatchEnroll, ...prev])
      alert('Enrollment Successful! Welcome to the cohort batch.')
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      console.error('Batch Enrollment Error:', err)
      alert(err.message || 'Failed to enroll in cohort batch. Please try again.')
    } finally {
      setCheckoutLoadingId(null)
    }
  }
```

---

### Blueprint 4: `src/app/test-series/engine/[examId]/page.js`
Fix `user_id` query column and questions parsing:

```javascript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CbtEngineClient from './CbtEngineClient'

export const dynamic = 'force-dynamic'

export default async function CbtEnginePage({ params }) {
  const { examId } = await params
  
  const supabase = await createClient()

  // Authenticate user session
  const { data: { user } } = await supabase.auth.getUser()
  const authenticatedUser = user || { id: 'test-user-01', email: 'candidate@Asentra.edu.in' }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authenticatedUser.id)
    .single()

  // Fetch target exam blueprint from database
  let examData = null
  let isAuthorized = true

  try {
    const { data: exam } = await supabase
      .from('test_exams')
      .select('*, test_packages(price_ledger)')
      .eq('id', examId)
      .single()
      
    if (exam) {
      // SECURITY PATCH: Strip correct answers and explanations before sending to client
      let sanitizedQuestions = []
      if (typeof exam.questions === 'string') {
        try { sanitizedQuestions = JSON.parse(exam.questions) } catch (e) { sanitizedQuestions = [] }
      } else if (Array.isArray(exam.questions)) {
        sanitizedQuestions = exam.questions
      }

      examData = {
        ...exam,
        questions: sanitizedQuestions.map(q => {
          const safeQ = { ...q }
          delete safeQ.correct_option_index
          delete safeQ.correctAnswer
          delete safeQ.solution_explanation
          delete safeQ.explanation
          return safeQ
        })
      }

      const isPremium = exam.test_packages?.price_ledger?.status === 'premium'

      if (isPremium) {
        // Verify invoice with correct user_id column
        const { data: invoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('user_id', authenticatedUser.id)
          .eq('package_id', exam.package_id)
          .maybeSingle()

        if (!invoice) {
          isAuthorized = false
        }
      }
    }
  } catch (e) {
    console.error('Error fetching exam details:', e)
  }

  if (!isAuthorized) {
    redirect('/test-series')
  }

  // High-fidelity fallback exam paper with 6 multi-format questions for testing NTA CBT features
  if (!examData) {
    examData = {
      id: examId === 'nta-grand-mock-1' ? '00000000-0000-0000-0000-000000000001' : (examId || '00000000-0000-0000-0000-000000000001'),
      title: examId === 'jee-physics-sprint-1' ? 'JEE Physics Mechanics Speed Sprint 01' : 'NTA JEE Mains All India Grand Mock Test 2026',
      duration_minutes: 180,
      total_questions: 75,
      marks_scheme: { positive_marks: 4, negative_marks: -1 },
      questions: [
        {
          id: 'q-1',
          format: 'MCQ',
          subject: 'Physics',
          sub_topic: 'Mechanics & Rotational Dynamics',
          question_text: 'A uniform disc of mass M = 4 kg and radius R = 0.5 m is rolling purely on a horizontal surface with a velocity of v = 6 m/s. Calculate its total kinetic energy in Joules.',
          options: ['72 J', '108 J', '144 J', '54 J'],
          correct_option_index: 1,
          solution_explanation: 'Total K.E. = (1/2) M v^2 + (1/2) I w^2 = (3/4) M v^2 = (3/4) * 4 * 36 = 108 Joules.'
        },
        {
          id: 'q-2',
          format: 'MCQ',
          subject: 'Chemistry',
          sub_topic: 'Organic Reaction Mechanisms',
          question_text: 'Which of the following carbocations is most stable due to maximum hyperconjugative and resonance stabilization?',
          options: ['Triphenylmethyl carbocation', 'Tert-butyl carbocation', 'Allyl carbocation', 'Isopropyl carbocation'],
          correct_option_index: 0,
          solution_explanation: 'Triphenylmethyl carbocation is stabilized by extensive resonance delocalization across 3 phenyl rings.'
        },
        {
          id: 'q-3',
          format: 'MSQ',
          subject: 'Physics',
          sub_topic: 'Electrostatics & Gauss Law',
          question_text: 'Select ALL correct statements regarding a conducting spherical shell of radius R carrying charge Q:',
          options: [
            'Electric field inside the conducting shell is zero.',
            'Electric potential is constant throughout the volume inside the shell.',
            'Electric field just outside the surface is Q / (4 * pi * epsilon_0 * R^2).',
            'Surface charge density is uniform.'
          ],
          correct_option_index: 0,
          solution_explanation: 'All four statements are correct fundamental properties of electrostatic conductors.'
        },
        {
          id: 'q-4',
          format: 'NUMERICAL',
          subject: 'Mathematics',
          sub_topic: 'Calculus & Integration',
          question_text: 'Evaluate the definite integral integral from 0 to pi/2 of (sin(x) / (sin(x) + cos(x))) dx. Enter exact decimal value.',
          options: [],
          correct_option_index: 0,
          correct_value: 0.785,
          solution_explanation: 'Using King Property integral I = integral (pi/2 - x) => 2I = pi/2 => I = pi/4 approx 0.785.'
        },
        {
          id: 'q-5',
          format: 'MCQ',
          subject: 'Mathematics',
          sub_topic: '3D Geometry & Vectors',
          question_text: 'Find the shortest distance between lines (r_vec = a_vec + lambda * b_vec) and (r_vec = c_vec + mu * d_vec).',
          options: ['|(a - c) . (b x d)| / |b x d|', '|(a + c) . (b x d)| / |b x d|', '|b x d|', 'Zero'],
          correct_option_index: 0,
          solution_explanation: 'Shortest distance formula for skew lines in vector form is |(a - c) . (b x d)| / |b x d|.'
        },
        {
          id: 'q-6',
          format: 'MCQ',
          subject: 'Chemistry',
          sub_topic: 'Physical Chemistry & Equilibrium',
          question_text: 'Calculate the pH of 0.01 M HCl solution at 25 degrees Celsius.',
          options: ['2.0', '1.0', '7.0', '14.0'],
          correct_option_index: 0,
          solution_explanation: 'pH = -log10([H+]) = -log10(10^-2) = 2.0.'
        }
      ]
    }
  }

  return (
    <CbtEngineClient
      user={authenticatedUser}
      profile={profile || { full_name: 'Test Candidate', role: 'student' }}
      exam={examData}
    />
  )
}
```

---

## 5. Verification Method

To independently verify all patched client and server page queries:

1. **Build & Syntax Verification**:
   Execute Next.js build / linting check:
   ```powershell
   npm run lint
   ```
2. **PostgREST Foreign Key Join Check**:
   - Inspect `/dashboard` server query logs. Verify that `.from('invoices').select('*, courses(title), batches(title), test_packages(title)')` executes without `Could not find a relationship` errors.
3. **Course & Batch Enrollment Route Verification**:
   - Trigger enrollment on `/courses` and `/batches` through the Razorpay modal.
   - Verify network tab shows `POST /api/razorpay/verify` returning HTTP 200 `{ success: true }`.
   - Verify records in PostgreSQL:
     - `SELECT * FROM public.enrollments WHERE user_id = '<USER_ID>' AND course_id = '<COURSE_ID>';`
     - `SELECT * FROM public.batch_enrollments WHERE user_id = '<USER_ID>' AND batch_id = '<BATCH_ID>';`
     - `SELECT * FROM public.invoices WHERE user_id = '<USER_ID>';`
4. **CBT Engine Authorization & Rendering Check**:
   - Navigate to `/test-series/engine/00000000-0000-0000-0000-000000000001`.
   - Confirm the page renders without `TypeError: exam.questions.map is not a function` and invoice check succeeds on `.eq('user_id', authenticatedUser.id)`.
5. **Invalidation Conditions**:
   - The verification fails if `invoices` table column is renamed to anything other than `user_id` or if `/api/razorpay/verify` endpoint signature changes.
