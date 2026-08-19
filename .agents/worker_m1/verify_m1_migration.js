const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uggatacexipoidzhcjhx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZ2F0YWNleGlwb2lkemhjamh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc3MTc2NCwiZXhwIjoyMDk1MzQ3NzY0fQ.1wx6Y2pseLMBXTdBp7xpl9BAefzvYVAPY95LaA43EBk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
  console.log('=== STARTING EMPIRICAL MIGRATION VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details}`);
      failed++;
    }
  }

  // 1. Verify question_bank table existence and rows
  const { data: qbRows, error: qbErr } = await supabase.from('question_bank').select('*');
  assert(!qbErr, 'question_bank table exists and selectable', qbErr ? qbErr.message : `(found ${qbRows.length} rows)`);
  assert(qbRows && qbRows.length >= 14, 'question_bank has all extracted questions (>= 14 rows)', `count = ${qbRows?.length}`);

  if (qbRows && qbRows.length > 0) {
    const sample = qbRows[0];
    const requiredCols = [
      'id', 'content', 'format_type', 'type', 'subject', 'topic', 'sub_topic',
      'difficulty', 'options', 'correct_option_index', 'correct_answer',
      'explanation', 'diagram_url', 'marks_positive', 'marks_negative', 'tags'
    ];
    const missingCols = requiredCols.filter(col => !(col in sample));
    assert(missingCols.length === 0, 'question_bank has all required contract columns', missingCols.length ? `Missing: ${missingCols.join(', ')}` : 'All present');
  }

  // 2. Verify exam_questions junction table
  const { data: eqRows, error: eqErr } = await supabase.from('exam_questions').select('*');
  assert(!eqErr, 'exam_questions table exists and selectable', eqErr ? eqErr.message : `(found ${eqRows.length} rows)`);
  assert(eqRows && eqRows.length === 12, 'exam_questions junction links populated for both test_exams (1 + 11 = 12 links)', `count = ${eqRows?.length}`);

  // 3. Verify assessment_questions junction table
  const { data: aqRows, error: aqErr } = await supabase.from('assessment_questions').select('*');
  assert(!aqErr, 'assessment_questions table exists and selectable', aqErr ? aqErr.message : `(found ${aqRows.length} rows)`);

  // 4. Verify test_attempts integrity
  const { data: attempts, error: attErr } = await supabase.from('test_attempts').select('id, answers_payload');
  assert(!attErr, 'test_attempts table selectable', attErr ? attErr.message : `(found ${attempts.length} attempts)`);
  assert(attempts && attempts.length === 66, 'All 66 original student test attempts intact', `count = ${attempts?.length}`);

  // 5. Verify specific preserved UUIDs in question_bank
  const knownUuids = [
    'b0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003',
    'b7396eca-dd4f-4a96-8a6a-d8ba834e4a01',
    '1abb601c-568e-4cbe-b36b-3332871e8982',
    '9eb2e27d-3054-4871-995a-2a092baf8ad9',
    '6498384f-5ab2-4a92-9858-18e4eb133fbe',
    '673439fb-c76e-4d00-a1d1-62400a236dea'
  ];
  const qbIdSet = new Set(qbRows.map(q => q.id));
  const missingUuids = knownUuids.filter(id => !qbIdSet.has(id));
  assert(missingUuids.length === 0, 'Known question UUIDs 100% preserved in question_bank', missingUuids.length ? `Missing: ${missingUuids.join(', ')}` : 'All 8 sample UUIDs preserved');

  // 6. Verify student_exam_questions blind view
  const { data: viewRows, error: viewErr } = await supabase.from('student_exam_questions').select('*').limit(5);
  assert(!viewErr, 'student_exam_questions view works', viewErr ? viewErr.message : `(sample length: ${viewRows?.length})`);
  if (viewRows && viewRows.length > 0) {
    const hasAnswer = 'correct_answer' in viewRows[0] || 'correct_option_index' in viewRows[0];
    assert(!hasAnswer, 'student_exam_questions view is secure (no correct answers exposed)');
  }

  // 7. Verify Live Trigger Propagation: Update in question_bank propagates to test_exams.questions JSON
  console.log('\n--- TESTING LIVE TRIGGER BIDIRECTIONAL PROPAGATION ---');
  const targetQId = 'b0000000-0000-0000-0000-000000000001';
  const testMarker = `Kinematics Test Verification ${Date.now()}`;
  
  // Get existing content
  const { data: origQ } = await supabase.from('question_bank').select('content, explanation').eq('id', targetQId).single();
  
  // Update question_bank
  const { error: updateErr } = await supabase.from('question_bank').update({
    explanation: testMarker
  }).eq('id', targetQId);
  assert(!updateErr, 'Update question_bank row successful', updateErr ? updateErr.message : '');

  // Check test_exams (MADHAN exam has this question)
  const { data: examMADHAN, error: examErr } = await supabase
    .from('test_exams')
    .select('id, title, questions')
    .eq('id', '212bac95-39b4-43e3-8f01-83e9719b13b2')
    .single();

  assert(!examErr, 'Fetch exam MADHAN after question update', examErr ? examErr.message : '');
  let examQuestions = Array.isArray(examMADHAN.questions) ? examMADHAN.questions : JSON.parse(examMADHAN.questions || '[]');
  const matchedQ = examQuestions.find(q => q.id === targetQId);
  assert(
    matchedQ && (matchedQ.explanation === testMarker || matchedQ.solution_explanation === testMarker),
    'Trigger propagated question update to test_exams.questions JSON in real-time!',
    `Found explanation: ${matchedQ?.explanation}`
  );

  // Restore original explanation
  await supabase.from('question_bank').update({
    explanation: origQ.explanation || 'Step-by-step kinematic velocity differentiation.'
  }).eq('id', targetQId);

  // 8. Verify Exam Questions Trigger on Insert / Delete
  const tempQId = 'a1111111-1111-1111-1111-111111111111';
  // Insert temporary question
  await supabase.from('question_bank').upsert({
    id: tempQId,
    content: 'Temporary Junction Test Question',
    subject: 'Physics',
    topic: 'Mechanics',
    difficulty: 'EASY',
    format_type: 'single_mcq',
    options: ['Opt A', 'Opt B'],
    correct_option_index: 0,
    correct_answer: 'Opt A',
    marks_positive: 4,
    marks_negative: -1
  });

  // Link to MADHAN exam
  const { error: linkErr } = await supabase.from('exam_questions').insert({
    exam_id: '212bac95-39b4-43e3-8f01-83e9719b13b2',
    question_id: tempQId,
    order_index: 2,
    section: 'Section B'
  });
  assert(!linkErr, 'Inserted new link in exam_questions', linkErr ? linkErr.message : '');

  // Verify test_exams total_questions & questions JSON updated to 2 questions
  const { data: examUpdated } = await supabase.from('test_exams').select('total_questions, questions').eq('id', '212bac95-39b4-43e3-8f01-83e9719b13b2').single();
  let updatedQuestions = Array.isArray(examUpdated.questions) ? examUpdated.questions : JSON.parse(examUpdated.questions || '[]');
  assert(examUpdated.total_questions === 2 && updatedQuestions.length === 2, 'exam_questions trigger updated total_questions to 2 and injected question into JSON', `total_questions = ${examUpdated.total_questions}`);

  // Clean up: delete junction link and temp question
  await supabase.from('exam_questions').delete().eq('exam_id', '212bac95-39b4-43e3-8f01-83e9719b13b2').eq('question_id', tempQId);
  await supabase.from('question_bank').delete().eq('id', tempQId);

  // Verify test_exams rolled back to 1 question
  const { data: examFinal } = await supabase.from('test_exams').select('total_questions, questions').eq('id', '212bac95-39b4-43e3-8f01-83e9719b13b2').single();
  let finalQuestions = Array.isArray(examFinal.questions) ? examFinal.questions : JSON.parse(examFinal.questions || '[]');
  assert(examFinal.total_questions === 1 && finalQuestions.length === 1, 'exam_questions delete trigger updated total_questions back to 1 and removed question from JSON', `total_questions = ${examFinal.total_questions}`);

  console.log(`\n=== VERIFICATION SUMMARY ===`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(e => {
  console.error('Unhandled Verification Error:', e);
  process.exit(1);
});
