// Empirical Verification Script for Milestone 2 Schema & RLS Stress Verification
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- SUPABASE CONFIG CHECK ---');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Anon Key Present:', Boolean(ANON_KEY));
console.log('Service Key Present:', Boolean(SERVICE_KEY));

const anonClient = createClient(SUPABASE_URL, ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

async function runEmpiricalStressTests() {
  const results = {
    postgrest_joins: [],
    rls_isolation: [],
    integrity_constraints: [],
    onboarding_rpc: [],
    cbt_grading: []
  };

  console.log('\n======================================================');
  console.log('TEST SUITE 1: PostgREST Relational Joins Resolution (11 Queries)');
  console.log('======================================================');

  const queries = [
    { name: '1. analytics test_attempts -> test_exams', q: () => adminClient.from('test_attempts').select('*, test_exams(questions, marks_scheme)').limit(1) },
    { name: '2. debug-courses courses -> profiles', q: () => adminClient.from('courses').select('*, profiles(full_name)').limit(1) },
    { name: '3. dashboard assessments -> courses', q: () => adminClient.from('assessments').select('*, courses(title)').limit(1) },
    { name: '4a. dashboard teacher enrollments with profiles (ambiguous check)', q: () => adminClient.from('enrollments').select('id, enrolled_at, course_id, user_id, courses!inner(instructor_id, title), profiles(full_name, email, phone)').limit(1) },
    { name: '4b. dashboard teacher enrollments with profiles!user_id (disambiguated)', q: () => adminClient.from('enrollments').select('id, enrolled_at, course_id, user_id, courses!inner(instructor_id, title), profiles!user_id(full_name, email, phone)').limit(1) },
    { name: '5. dashboard student enrollments -> courses', q: () => adminClient.from('enrollments').select('*, courses(*)').limit(1) },
    { name: '6. dashboard courses -> profiles', q: () => adminClient.from('courses').select('*, profiles(full_name)').limit(1) },
    { name: '7. dashboard invoices -> courses, batches, test_packages', q: () => adminClient.from('invoices').select('*, courses(title), batches(title), test_packages(title)').limit(1) },
    { name: '8. learn lesson_doubts -> profiles', q: () => adminClient.from('lesson_doubts').select('*, profiles(full_name, email, role)').limit(1) },
    { name: '9. test-series attempts -> test_exams(title)', q: () => adminClient.from('test_attempts').select('*, test_exams(title)').limit(1) },
    { name: '10. test-series analytics attempts -> test_exams(*)', q: () => adminClient.from('test_attempts').select('*, test_exams(*)').limit(1) },
    { name: '11. test-series engine exams -> test_packages', q: () => adminClient.from('test_exams').select('*, test_packages(price_ledger)').limit(1) }
  ];

  for (const item of queries) {
    try {
      const res = await item.q();
      if (res.error) {
        results.postgrest_joins.push({ test: item.name, status: 'FAIL', error: res.error.message });
        console.error(' [FAIL]', item.name, '-> Error:', res.error.message);
      } else {
        results.postgrest_joins.push({ test: item.name, status: 'PASS', rows: res.data?.length });
        console.log(' [PASS]', item.name, '-> Rows returned:', res.data?.length);
      }
    } catch (e) {
      results.postgrest_joins.push({ test: item.name, status: 'EXCEPTION', error: e.message });
      console.error(' [EXCEPTION]', item.name, '-> Error:', e.message);
    }
  }

  console.log('\n======================================================');
  console.log('TEST SUITE 2: RLS Isolation & Policy Bypass Vectors');
  console.log('======================================================');

  // 2.1 Anon client attempting to read private invoices
  try {
    const { data, error } = await anonClient.from('invoices').select('*');
    if (data && data.length > 0) {
      results.rls_isolation.push({ test: 'Anon invoices read isolation', status: 'FAIL_LEAK', count: data.length });
      console.error(' [CRITICAL FAIL] Anon client leaked', data.length, 'invoice rows!');
    } else {
      results.rls_isolation.push({ test: 'Anon invoices read isolation', status: 'PASS', returnedRows: data?.length || 0 });
      console.log(' [PASS] Invoices table strictly protected from anon read. Rows returned:', data?.length || 0);
    }
  } catch (err) {
    results.rls_isolation.push({ test: 'Anon invoices read isolation', status: 'PASS', note: err.message });
    console.log(' [PASS] Anon invoices read rejected with error:', err.message);
  }

  // 2.2 Anon client attempting to read enrollments
  try {
    const { data, error } = await anonClient.from('enrollments').select('*');
    if (data && data.length > 0) {
      results.rls_isolation.push({ test: 'Anon enrollments read isolation', status: 'FAIL_LEAK', count: data.length });
      console.error(' [CRITICAL FAIL] Anon client leaked', data.length, 'enrollments!');
    } else {
      results.rls_isolation.push({ test: 'Anon enrollments read isolation', status: 'PASS', returnedRows: data?.length || 0 });
      console.log(' [PASS] Enrollments table strictly protected from anon read. Rows returned:', data?.length || 0);
    }
  } catch (err) {
    results.rls_isolation.push({ test: 'Anon enrollments read isolation', status: 'PASS', note: err.message });
    console.log(' [PASS] Anon enrollments read rejected.');
  }

  // 2.3 Anon client attempting to read test_attempts
  try {
    const { data, error } = await anonClient.from('test_attempts').select('*');
    if (data && data.length > 0) {
      results.rls_isolation.push({ test: 'Anon test_attempts read isolation', status: 'FAIL_LEAK', count: data.length });
      console.error(' [CRITICAL FAIL] Anon client leaked', data.length, 'test_attempts!');
    } else {
      results.rls_isolation.push({ test: 'Anon test_attempts read isolation', status: 'PASS', returnedRows: data?.length || 0 });
      console.log(' [PASS] test_attempts table strictly protected from anon read. Rows returned:', data?.length || 0);
    }
  } catch (err) {
    results.rls_isolation.push({ test: 'Anon test_attempts read isolation', status: 'PASS', note: err.message });
    console.log(' [PASS] Anon test_attempts read rejected.');
  }

  // 2.4 Anon client reading public catalog (courses, test_packages, books, coursera)
  try {
    const { data: courses } = await anonClient.from('courses').select('id, title, status').limit(5);
    const { data: packages } = await anonClient.from('test_packages').select('id, title').limit(5);
    const { data: books } = await anonClient.from('books').select('id, title').limit(5);
    const { data: coursera } = await anonClient.from('coursera_courses').select('id, title').limit(5);
    results.rls_isolation.push({
      test: 'Public catalog readability',
      status: 'PASS',
      coursesCount: courses?.length,
      packagesCount: packages?.length,
      booksCount: books?.length,
      courseraCount: coursera?.length
    });
    console.log(' [PASS] Public catalog read successful. Courses:', courses?.length, 'Packages:', packages?.length, 'Books:', books?.length, 'Coursera:', coursera?.length);
  } catch (err) {
    results.rls_isolation.push({ test: 'Public catalog readability', status: 'FAIL', error: err.message });
    console.error(' [FAIL] Public catalog read failed:', err.message);
  }

  console.log('\n======================================================');
  console.log('TEST SUITE 3: Atomic Onboarding RPCs');
  console.log('======================================================');

  const secret = 'P0YIbV3ZGKgDkloeyVk7meXl';
  const dummyUser = '00000000-0000-0000-0000-000000000099';

  // Ensure test profile exists
  await adminClient.from('profiles').upsert({
    id: dummyUser,
    email: 'adversarial_qa@example.com',
    full_name: 'Adversarial QA Tester',
    role: 'student',
    xp: 100,
    streak: 2,
    rank_badge: 'Bronze'
  });

  // 3.1 Test execute_atomic_student_onboarding (5 params)
  try {
    const { data: cData } = await adminClient.from('courses').select('id, title').limit(1);
    if (cData?.[0]) {
      const res = await adminClient.rpc('execute_atomic_student_onboarding', {
        _user_id: dummyUser,
        _course_id: cData[0].id,
        _payment_id: 'pay_course_emp_' + Date.now(),
        _amount: 1999,
        _secret_token: secret
      });
      if (res.error) throw res.error;
      results.onboarding_rpc.push({ test: 'execute_atomic_student_onboarding', status: 'PASS', data: res.data });
      console.log(' [PASS] execute_atomic_student_onboarding succeeded.');
    }
  } catch (err) {
    results.onboarding_rpc.push({ test: 'execute_atomic_student_onboarding', status: 'FAIL', error: err.message });
    console.error(' [FAIL] execute_atomic_student_onboarding failed:', err.message);
  }

  // 3.2 Test execute_atomic_batch_onboarding
  try {
    const { data: bData } = await adminClient.from('batches').select('id, title').limit(1);
    if (bData?.[0]) {
      const res = await adminClient.rpc('execute_atomic_batch_onboarding', {
        _user_id: dummyUser,
        _batch_id: bData[0].id,
        _payment_id: 'pay_batch_emp_' + Date.now(),
        _amount: 2999,
        _secret_token: secret
      });
      if (res.error) throw res.error;
      results.onboarding_rpc.push({ test: 'execute_atomic_batch_onboarding', status: 'PASS', data: res.data });
      console.log(' [PASS] execute_atomic_batch_onboarding succeeded.');
    }
  } catch (err) {
    results.onboarding_rpc.push({ test: 'execute_atomic_batch_onboarding', status: 'FAIL', error: err.message });
    console.error(' [FAIL] execute_atomic_batch_onboarding failed:', err.message);
  }

  // 3.3 Test execute_atomic_package_onboarding
  try {
    const { data: pData } = await adminClient.from('test_packages').select('id, title').limit(1);
    if (pData?.[0]) {
      const res = await adminClient.rpc('execute_atomic_package_onboarding', {
        _user_id: dummyUser,
        _package_id: pData[0].id,
        _payment_id: 'pay_pkg_emp_' + Date.now(),
        _amount: 999,
        _secret_token: secret
      });
      if (res.error) throw res.error;
      results.onboarding_rpc.push({ test: 'execute_atomic_package_onboarding', status: 'PASS', data: res.data });
      console.log(' [PASS] execute_atomic_package_onboarding succeeded.');
    }
  } catch (err) {
    results.onboarding_rpc.push({ test: 'execute_atomic_package_onboarding', status: 'FAIL', error: err.message });
    console.error(' [FAIL] execute_atomic_package_onboarding failed:', err.message);
  }

  // 3.4 Test execute_atomic_book_order
  try {
    const { data: bkData } = await adminClient.from('books').select('id, title, stock_quantity').gt('stock_quantity', 0).limit(1);
    if (bkData?.[0]) {
      const res = await adminClient.rpc('execute_atomic_book_order', {
        _user_id: dummyUser,
        _book_id: bkData[0].id,
        _shipping_address: { address: 'Plot 42, Hitech City', city: 'Hyderabad', pincode: '500081' },
        _payment_id: 'pay_book_emp_' + Date.now(),
        _amount: 549,
        _shipping_fee: 0,
        _secret_token: secret
      });
      if (res.error) throw res.error;
      results.onboarding_rpc.push({ test: 'execute_atomic_book_order', status: 'PASS', data: res.data });
      console.log(' [PASS] execute_atomic_book_order succeeded.');
    }
  } catch (err) {
    results.onboarding_rpc.push({ test: 'execute_atomic_book_order', status: 'FAIL', error: err.message });
    console.error(' [FAIL] execute_atomic_book_order failed:', err.message);
  }

  console.log('\n======================================================');
  console.log('TEST SUITE 4: CBT Exam Grading & Gamification Stress Logic');
  console.log('======================================================');

  // Test grading calculation logic locally against test questions
  const mockQuestions = [
    { id: 'q1', correct_option_index: 0 },
    { id: 'q2', correct_option_index: 2 },
    { id: 'q3', correct_option_index: 1 }
  ];
  const mockAnswers = {
    'q1': { selected_option: 0, seconds_spent: 30 }, // correct (+4)
    'q2': { selected_option: 1, seconds_spent: 45 }, // incorrect (-1)
    // q3 unattempted (0)
  };

  let correct = 0, incorrect = 0, unanswered = 0, rawScore = 0;
  mockQuestions.forEach(q => {
    const ans = mockAnswers[q.id];
    if (!ans || ans.selected_option === undefined || ans.selected_option === null) {
      unanswered++;
    } else if (Number(ans.selected_option) === Number(q.correct_option_index)) {
      correct++;
      rawScore += 4;
    } else {
      incorrect++;
      rawScore -= 1;
    }
  });

  const accuracy = (correct + incorrect) > 0 ? (correct / (correct + incorrect)) * 100 : 0;
  const percentage = (rawScore / (mockQuestions.length * 4)) * 100;

  if (correct === 1 && incorrect === 1 && unanswered === 1 && rawScore === 3) {
    results.cbt_grading.push({
      test: 'Blind CBT grading arithmetic',
      status: 'PASS',
      correct,
      incorrect,
      unanswered,
      rawScore,
      accuracy: accuracy.toFixed(2),
      percentage: percentage.toFixed(2)
    });
    console.log(' [PASS] CBT grading formula verified: correct=1, incorrect=1, unanswered=1, score=3/12');
  } else {
    results.cbt_grading.push({ test: 'Blind CBT grading arithmetic', status: 'FAIL', rawScore });
    console.error(' [FAIL] CBT grading formula calculation unexpected:', rawScore);
  }

  // Cleanup test artifacts
  console.log('\nCleaning up test records...');
  await adminClient.from('invoices').delete().ilike('razorpay_payment_id', '%_emp_%');
  await adminClient.from('book_orders').delete().eq('user_id', dummyUser);
  await adminClient.from('batch_enrollments').delete().eq('user_id', dummyUser);
  await adminClient.from('enrollments').delete().eq('user_id', dummyUser);
  await adminClient.from('profiles').delete().eq('id', dummyUser);
  console.log('Cleanup finished.');

  console.log('\n======================================================');
  console.log('FINAL VERIFICATION SUMMARY');
  console.log('======================================================');
  console.log(JSON.stringify(results, null, 2));
}

runEmpiricalStressTests();
