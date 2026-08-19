const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://uggatacexipoidzhcjhx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZ2F0YWNleGlwb2lkemhjamh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc3MTc2NCwiZXhwIjoyMDk1MzQ3NzY0fQ.1wx6Y2pseLMBXTdBp7xpl9BAefzvYVAPY95LaA43EBk');

async function dump() {
  const { data: exams } = await supabase.from('test_exams').select('id, title, questions');
  console.log('--- TEST EXAMS ---');
  exams.forEach(e => {
    console.log(`Exam: ${e.id} | Title: ${e.title}`);
    console.log(`  Questions count in JSON:`, Array.isArray(e.questions) ? e.questions.length : (typeof e.questions === 'string' ? JSON.parse(e.questions).length : 'None'));
    console.log(`  Questions dump:`, JSON.stringify(e.questions, null, 2));
  });

  const { data: tqs } = await supabase.from('test_questions').select('*');
  console.log('--- TEST QUESTIONS ---');
  console.log(`Count: ${tqs.length}`);
  console.log(JSON.stringify(tqs, null, 2));
}

dump();
