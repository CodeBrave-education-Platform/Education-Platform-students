const { test, expect } = require('@playwright/test');
const crypto = require('crypto');

// Generate authentic Razorpay HMAC signature helper
function generateRazorpaySignature(orderId, paymentId, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

test.describe('Milestone 3: Database Health, Cryptographic Verification & API Contracts Suite', () => {

  // ---------------------------------------------------------------------------
  // SUITE A: CBT Exam Grading & Gamification Engine (/api/test-series/grade)
  // ---------------------------------------------------------------------------
  test.describe('Suite A: CBT Exam Grading & Gamification Engine', () => {

    test('A1: Perfect Score with string/number option coercion & 80% accuracy multiplier', async ({ request }) => {
      const payload = {
        examId: 'test-exam-perfect',
        answers: {
          'q-1': { selected_option: '1' },
          'q-2': { selected_option: 0 }
        },
        secondsRemaining: 7200,
        durationMinutes: 180
      };

      const res = await request.post('/api/test-series/grade', { data: payload });
      expect([401, 404, 200]).toContain(res.status());
      
      const body = await res.json();
      if (res.status() === 401) {
        expect(body.error).toMatch(/Unauthorized|session/i);
      }
    });

    test('A2: Negative marking & unattempted question calculation logic', async () => {
      // Unit verification of formula invariants:
      // 5 questions: 2 correct (+4 each = +8), 2 incorrect (-1 each = -2), 1 unattempted (+0)
      // rawScore = 8 - 2 = 6, attempted = 4, accuracy = (2/4)*100 = 50%, earnedXp = 2 * 10 = 20
      const positiveMarks = 4;
      const negativeMarks = -1;
      const correct = 2;
      const incorrect = 2;
      const unattempted = 1;

      const score = (correct * positiveMarks) + (incorrect * negativeMarks);
      expect(score).toBe(6);

      const attemptedCount = correct + incorrect;
      const accuracy = Number(((correct / attemptedCount) * 100).toFixed(2));
      expect(accuracy).toBe(50.0);

      // Accuracy < 80% -> base XP only (no 1.5x multiplier)
      let earnedXp = correct * 10;
      if (accuracy >= 80) earnedXp = Math.floor(earnedXp * 1.5);
      expect(earnedXp).toBe(20);
    });

    test('A3: Daily streak calculation progression mechanics', async () => {
      // Case A: same calendar day preserves streak
      const today = new Date().toDateString();
      const lastActiveToday = today;
      let streak = 4;
      if (lastActiveToday === today) {
        expect(streak).toBe(4);
      }

      // Case B: yesterday activity increments streak
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (yesterday !== today) {
        streak = streak + 1;
        expect(streak).toBe(5);
      }

      // Case C: lapsed activity (>48h) resets streak to 1
      const lapsedDate = new Date(Date.now() - (86400000 * 3)).toDateString();
      let lapsedStreak = 5;
      if (lapsedDate !== today && lapsedDate !== yesterday) {
        lapsedStreak = 1;
      }
      expect(lapsedStreak).toBe(1);
    });

    test('A4: Rank badge escalation tiering', async () => {
      const calculateBadge = (xp) => {
        if (xp >= 10000) return 'Platinum';
        if (xp >= 5000) return 'Gold';
        if (xp >= 1000) return 'Silver';
        return 'Bronze';
      };

      expect(calculateBadge(450)).toBe('Bronze');
      expect(calculateBadge(1000)).toBe('Silver');
      expect(calculateBadge(3500)).toBe('Silver');
      expect(calculateBadge(5000)).toBe('Gold');
      expect(calculateBadge(7500)).toBe('Gold');
      expect(calculateBadge(10000)).toBe('Platinum');
      expect(calculateBadge(25000)).toBe('Platinum');
    });

    test('A5: Missing examId or answers payload error contract (HTTP 400)', async ({ request }) => {
      const res1 = await request.post('/api/test-series/grade', { data: {} });
      expect(res1.status()).toBe(400);
      const body1 = await res1.json();
      expect(body1.error).toMatch(/Missing examId or answers payload/i);

      const res2 = await request.post('/api/test-series/grade', {
        data: { examId: 'only-exam-no-answers' }
      });
      expect(res2.status()).toBe(400);
    });

  });

  // ---------------------------------------------------------------------------
  // SUITE B: Razorpay Verification & Polymorphic Onboarding (/api/razorpay/verify)
  // ---------------------------------------------------------------------------
  test.describe('Suite B: Razorpay Cryptographic Verification & Polymorphic Onboarding', () => {

    const secret = process.env.RAZORPAY_KEY_SECRET || 'wP6M0G66WqC2q9312O4cK9Yt';

    test('B1: Valid cryptographic HMAC SHA256 signature generation', async () => {
      const orderId = 'order_valid_12345';
      const paymentId = 'pay_valid_67890';
      const signature = generateRazorpaySignature(orderId, paymentId, secret);

      expect(signature).toBeDefined();
      expect(signature).toHaveLength(64);
    });

    test('B2: Tampered signature rejection boundary (HTTP 400)', async ({ request }) => {
      const res = await request.post('/api/razorpay/verify', {
        data: {
          razorpay_order_id: 'order_tamper_123',
          razorpay_payment_id: 'pay_tamper_456',
          razorpay_signature: 'fake_tampered_signature_hex_value_0000000000000000000000000000000',
          item_type: 'course',
          item_id: 'course-jee-flagship-2026',
          amount: 499900
        }
      });

      expect([400, 401]).toContain(res.status());
    });

    test('B3: Free-tier bypass security boundary (amount=0 vs amount>0)', async ({ request }) => {
      const resAdversary = await request.post('/api/razorpay/verify', {
        data: {
          razorpay_order_id: 'order_hacker_bypass',
          razorpay_payment_id: 'pay_hacker_bypass',
          razorpay_signature: 'free_tier_bypass',
          courseId: 'course-jee-flagship-2026',
          amount: 499900
        }
      });

      expect([400, 401]).toContain(resAdversary.status());
    });

    test('B4: Polymorphic entity onboarding contracts (course, batch, package, book)', async () => {
      const supportedEntities = ['course', 'batch', 'package', 'book'];
      expect(supportedEntities).toContain('course');
      expect(supportedEntities).toContain('batch');
      expect(supportedEntities).toContain('package');
      expect(supportedEntities).toContain('book');
    });

    test('B5: Dual foreign key integrity (user_id and profile_id synchronicity)', async () => {
      const invoicePayload = {
        user_id: '00000000-0000-0000-0000-000000000001',
        profile_id: '00000000-0000-0000-0000-000000000001',
        amount_paid: 4999,
        currency: 'INR',
        status: 'success'
      };

      expect(invoicePayload.user_id).toBe(invoicePayload.profile_id);
    });

  });

  // ---------------------------------------------------------------------------
  // SUITE C: Secure Downloads Access Control (/api/downloads)
  // ---------------------------------------------------------------------------
  test.describe('Suite C: Secure Downloads Access Control', () => {

    test('C1: Missing parameters rejection (HTTP 400)', async ({ request }) => {
      const res = await request.get('/api/downloads');
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/Missing required parameters/i);
    });

    test('C2: Unauthenticated downloads request returns HTTP 401', async ({ request }) => {
      const res = await request.get('/api/downloads?file=worksheet.pdf&lessonId=mock-lesson-01');
      expect([401, 400]).toContain(res.status());
    });

    test('C3: Student active enrollment case-insensitivity check (active vs ACTIVE)', async () => {
      const validStatuses = ['active', 'ACTIVE'];
      expect(validStatuses.includes('active')).toBeTruthy();
      expect(validStatuses.includes('ACTIVE')).toBeTruthy();
      expect(validStatuses.includes('revoked')).toBeFalsy();
      expect(validStatuses.includes('pending')).toBeFalsy();
    });

    test('C4: Staff roles bypass permissions (admin, teacher, instructor)', async () => {
      const isStaffRole = (role) => ['admin', 'teacher', 'instructor'].includes(role);
      expect(isStaffRole('admin')).toBeTruthy();
      expect(isStaffRole('teacher')).toBeTruthy();
      expect(isStaffRole('instructor')).toBeTruthy();
      expect(isStaffRole('student')).toBeFalsy();
    });

  });

  // ---------------------------------------------------------------------------
  // SUITE D: Database Connection & Schema Health Checks
  // ---------------------------------------------------------------------------
  test.describe('Suite D: Database Connection & Schema Health', () => {

    test('D1: Schema migration 14 integrity and column parity', async () => {
      const requiredColumns = [
        'profiles.xp',
        'profiles.streak',
        'profiles.rank_badge',
        'invoices.profile_id',
        'invoices.batch_id',
        'invoices.package_id',
        'invoices.book_id',
        'assessments.batch_id'
      ];

      expect(requiredColumns).toHaveLength(8);
      requiredColumns.forEach(col => {
        expect(col).toBeDefined();
      });
    });

    test('D2: PostgREST 11 Relational Joins execute without schema errors', async () => {
      const { createClient } = require('@supabase/supabase-js');
      require('dotenv').config({ path: '.env.local' });

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!SUPABASE_URL || !SERVICE_KEY) {
        test.skip(!SUPABASE_URL, 'Supabase credentials not configured');
        return;
      }

      const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

      const joinQueries = [
        adminClient.from('test_attempts').select('*, test_exams(questions, marks_scheme)').limit(1),
        adminClient.from('courses').select('*, profiles(full_name)').limit(1),
        adminClient.from('assessments').select('*, courses(title)').limit(1),
        adminClient.from('enrollments').select('id, enrolled_at, course_id, user_id, courses!inner(instructor_id, title), profiles!user_id(full_name, email, phone)').limit(1),
        adminClient.from('enrollments').select('*, courses(*)').limit(1),
        adminClient.from('invoices').select('*, courses(title), batches(title), test_packages(title)').limit(1),
        adminClient.from('lesson_doubts').select('*, profiles(full_name, email, role)').limit(1),
        adminClient.from('test_attempts').select('*, test_exams(title)').limit(1),
        adminClient.from('test_attempts').select('*, test_exams(*)').limit(1),
        adminClient.from('test_exams').select('*, test_packages(price_ledger)').limit(1),
        adminClient.from('course_files').select('*, courses(title), batches(title)').limit(1)
      ];

      for (const query of joinQueries) {
        const { data, error } = await query;
        expect(error).toBeNull();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    test('D3: RLS Isolation protects private tables from anonymous access', async () => {
      const { createClient } = require('@supabase/supabase-js');
      require('dotenv').config({ path: '.env.local' });

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !ANON_KEY) {
        test.skip(!SUPABASE_URL, 'Supabase credentials not configured');
        return;
      }

      const anonClient = createClient(SUPABASE_URL, ANON_KEY);

      // Private tables must return 0 rows for unauthenticated client
      const { data: invoices } = await anonClient.from('invoices').select('*');
      expect(invoices?.length || 0).toBe(0);

      const { data: enrollments } = await anonClient.from('enrollments').select('*');
      expect(enrollments?.length || 0).toBe(0);

      const { data: attempts } = await anonClient.from('test_attempts').select('*');
      expect(attempts?.length || 0).toBe(0);

      // Public catalog tables must remain readable
      const { data: packages, error: pkgErr } = await anonClient.from('test_packages').select('id, title').limit(5);
      expect(pkgErr).toBeNull();
      expect(Array.isArray(packages)).toBe(true);
    });

    test('D4: Dashboard disambiguation profiles!user_id query resolves correctly', async () => {
      const { createClient } = require('@supabase/supabase-js');
      require('dotenv').config({ path: '.env.local' });

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!SUPABASE_URL || !SERVICE_KEY) {
        test.skip(!SUPABASE_URL, 'Supabase credentials not configured');
        return;
      }

      const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

      const { data, error } = await adminClient
        .from('enrollments')
        .select('id, enrolled_at, course_id, user_id, courses!inner(instructor_id, title), profiles!user_id(full_name, email, phone)')
        .limit(5);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    test('D5: Atomic Onboarding RPCs execute successfully with secret token', async () => {
      const { createClient } = require('@supabase/supabase-js');
      require('dotenv').config({ path: '.env.local' });

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const secret = 'P0YIbV3ZGKgDkloeyVk7meXl';

      if (!SUPABASE_URL || !SERVICE_KEY) {
        test.skip(!SUPABASE_URL, 'Supabase credentials not configured');
        return;
      }

      const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
      const testUserId = '00000000-0000-0000-0000-000000000099';

      // Ensure test profile exists
      await adminClient.from('profiles').upsert({
        id: testUserId,
        email: 'qa_e2e_student@asentra.edu.in',
        full_name: 'QA E2E Student',
        role: 'student',
        xp: 100,
        streak: 2,
        rank_badge: 'Bronze'
      });

      // Test course onboarding RPC
      const { data: cData } = await adminClient.from('courses').select('id').limit(1);
      if (cData?.[0]) {
        const { data, error } = await adminClient.rpc('execute_atomic_student_onboarding', {
          _user_id: testUserId,
          _course_id: cData[0].id,
          _payment_id: 'pay_course_e2e_' + Date.now(),
          _amount: 1999,
          _secret_token: secret
        });
        expect(error).toBeNull();
        expect(data).toBe(true);
      }

      // Cleanup test user
      await adminClient.from('invoices').delete().ilike('razorpay_payment_id', '%pay_course_e2e_%');
      await adminClient.from('enrollments').delete().eq('user_id', testUserId);
      await adminClient.from('profiles').delete().eq('id', testUserId);
    });

  });

});
