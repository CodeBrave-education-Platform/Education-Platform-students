/**
 * Milestone 3 Challenger 2: DB & API Adversarial Verification Invariants Matrix
 * 
 * Target: Asentra Education Platform
 * Focus: Database Connection Health, Server-Authoritative CBT Grading,
 *        Razorpay Verification, Downloads API, PostgREST 11 joins, RLS Isolation.
 */

export const CHALLENGE_MATRIX = [
  {
    category: 'CBT Exam Grading & Gamification',
    tests: [
      {
        id: 'CBT-01',
        name: 'Division-by-Zero Protection on 0-Attempt Examination',
        scenario: 'User submits exam with all null/undefined answers (attemptedCount = 0)',
        invariant: 'accuracy must be 0, percentage must be 0, earnedXp must be 0 (No NaN / Infinity)',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'CBT-02',
        name: 'Division-by-Zero Protection on Empty Exam (0 questions)',
        scenario: 'Exam has 0 questions (totalQuestions = 0, totalMarks = 0)',
        invariant: 'percentage = 0, score = 0, totalMarks = 0 without arithmetic exceptions',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'CBT-03',
        name: 'Option Type Normalization (String vs Number Coercion)',
        scenario: 'Submitted answers contain mixed types: {"q1": {"selected_option": "0"}, "q2": {"selected_option": 1}}',
        invariant: 'Number(ans.selected_option) === Number(q.correct_option_index) evaluates accurately',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'CBT-04',
        name: 'Empty Option Filtering (Null / Empty String / Undefined)',
        scenario: 'Submitted answers have selected_option: null or "" or undefined',
        invariant: 'Caught by guard (!ans || ans.selected_option === null || ans.selected_option === "") and counted as unanswered, NOT coerced to 0',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'CBT-05',
        name: 'Negative Marking Arithmetic Scheme',
        scenario: '+4 marks per correct, -1 per incorrect, 0 for unattempted',
        invariant: 'rawScore = (correct * 4) + (incorrect * -1), score = Math.round(rawScore)',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'CBT-06',
        name: 'Gamification 50% XP Bonus Threshold (>= 80% Accuracy)',
        scenario: 'Accuracy >= 80% triggers 1.5x XP multiplier; accuracy < 80% awards base 10 XP per correct',
        invariant: 'earnedXp = correct * 10; if (accuracy >= 80) earnedXp = Math.floor(earnedXp * 1.5)',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'CBT-07',
        name: 'Streak Progression & Daily Reset Invariants',
        scenario: 'Same day activity preserves streak; consecutive day increments streak; >48h inactivity resets streak to 1',
        invariant: 'lastDate === today -> streak; lastDate === yesterday -> streak + 1; else -> 1',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'CBT-08',
        name: 'Rank Badge Progression Tiers',
        scenario: 'XP tiers: Bronze (<1000), Silver (1000-4999), Gold (5000-9999), Platinum (>=10000)',
        invariant: 'rank_badge escalates deterministically with cumulative XP',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'CBT-09',
        name: 'Duration Seconds Clamping',
        scenario: 'Negative secondsRemaining or excess duration payload',
        invariant: 'durationSeconds clamped to [0, totalDuration]',
        status: 'VERIFIED_PASS'
      }
    ]
  },
  {
    category: 'Razorpay Cryptographic Verification & Polymorphic Onboarding',
    tests: [
      {
        id: 'RZP-01',
        name: 'Constant-Time HMAC-SHA256 Signature Verification',
        scenario: 'Cryptographic hash generated over order_id|payment_id using secret key',
        invariant: 'timingSafeEqualEdge evaluates in constant time without early termination',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'RZP-02',
        name: 'Free-Tier Bypass Security Bounds (amount=0 vs amount>0)',
        scenario: 'Attacker supplies razorpay_signature: "free_tier_bypass" with amount = 499900',
        invariant: 'Condition (razorpay_signature === "free_tier_bypass" && (amount === 0 || !amount)) fails for paid items, triggering full HMAC check and returning HTTP 400',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'RZP-03',
        name: 'Tampered Order/Payment ID Rejection',
        scenario: 'Signature generated for order_A but submitted with order_B',
        invariant: 'HMAC digest mismatch yields HTTP 400 Signature verification failed',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'RZP-04',
        name: 'Polymorphic Onboarding Dispatch',
        scenario: 'Verification of course, batch, test_package, and physical book orders',
        invariant: 'Appropriate table insertion (enrollments, batch_enrollments, invoices, book_orders) and role upgrade to paid_student',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'RZP-05',
        name: 'Dual Foreign Key Synchronicity (user_id <-> profile_id)',
        scenario: 'Invoices table requires both user_id and profile_id for backward compatibility',
        invariant: 'Postgres trigger trigger_sync_invoices_user_profile automatically synchronizes missing field',
        status: 'VERIFIED_PASS'
      }
    ]
  },
  {
    category: 'Secure Downloads RBAC & Access Control',
    tests: [
      {
        id: 'DL-01',
        name: 'Missing Parameters Rejection',
        scenario: 'GET /api/downloads without file or lessonId/batchId',
        invariant: 'Returns HTTP 400 Missing required parameters',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'DL-02',
        name: 'Unauthenticated Request Rejection',
        scenario: 'Anonymous user requests study asset',
        invariant: 'Returns HTTP 401 Unauthorized: Invalid session',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'DL-03',
        name: 'Staff Role Enrollment Bypass',
        scenario: 'Admin / Teacher / Instructor requests any course file without student enrollment',
        invariant: 'Role check profile.role in ("admin", "teacher", "instructor") allows access',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'DL-04',
        name: 'Case-Insensitive Student Enrollment Status Check',
        scenario: 'Enrollment record has status: "active" or "ACTIVE"',
        invariant: '.in("status", ["active", "ACTIVE"]) correctly grants access to valid students',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'DL-05',
        name: 'Open-Redirect Domain Sanitization',
        scenario: 'External download URL provided in file parameter',
        invariant: 'getSafeRedirectUrl whitelist sanitization blocks open redirects',
        status: 'VERIFIED_PASS'
      }
    ]
  },
  {
    category: 'Database Schema Integrity & PostgREST 11 Compatibility',
    tests: [
      {
        id: 'DB-01',
        name: 'PostgreSQL 17.6 Live Instance Connection Health',
        scenario: 'Supabase instance ref uggatacexipoidzhcjhx query execution',
        invariant: 'Database status is ACTIVE_HEALTHY, responds in <50ms',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'DB-02',
        name: 'Relational Joins across 11 Tables',
        scenario: 'courses ↔ profiles, invoices ↔ batches ↔ courses ↔ packages ↔ books, test_attempts ↔ test_exams',
        invariant: 'Foreign keys valid, queries execute without ambiguity or join failure',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'DB-03',
        name: 'Dashboard Query Disambiguation (profiles!user_id)',
        scenario: 'PostgREST join between enrollments and profiles where dual FKs exist',
        invariant: 'profiles!user_id explicitly resolves join without 300 Ambiguity error',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'DB-04',
        name: 'Row-Level Security (RLS) Anonymous Query Isolation',
        scenario: 'Anonymous client attempts SELECT on private tables (invoices, enrollments, test_attempts)',
        invariant: 'RLS policies isolate data and return 0 rows for anonymous client',
        status: 'VERIFIED_PASS'
      },
      {
        id: 'DB-05',
        name: 'Atomic Onboarding Stored Procedures (RPCs)',
        scenario: 'execute_atomic_student_onboarding, execute_atomic_batch_onboarding, execute_atomic_package_onboarding',
        invariant: 'RPCs execute as SECURITY DEFINER with token authorization and idempotent payment checks',
        status: 'VERIFIED_PASS'
      }
    ]
  }
];
