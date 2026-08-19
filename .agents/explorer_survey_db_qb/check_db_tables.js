const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uggatacexipoidzhcjhx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZ2F0YWNleGlwb2lkemhjamh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc3MTc2NCwiZXhwIjoyMDk1MzQ3NzY0fQ.1wx6Y2pseLMBXTdBp7xpl9BAefzvYVAPY95LaA43EBk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['test_packages', 'test_exams', 'test_questions', 'test_attempts', 'questions', 'assessments', 'assessment_attempts', 'exam_questions'];
  for (const t of tables) {
    try {
      const { data, count, error } = await supabase.from(t).select('*', { count: 'exact', head: false }).limit(3);
      if (error) {
        console.log(`Table [${t}]: Error -> ${error.message} (${error.code})`);
      } else {
        console.log(`Table [${t}]: Count = ${data.length} (sample), total found: ${count !== null ? count : data.length}`);
        if (data.length > 0) {
          console.log(`  Sample keys for [${t}]:`, Object.keys(data[0]));
          if (t === 'test_exams' && data[0].questions) {
            console.log(`  test_exams[0].questions type:`, typeof data[0].questions, Array.isArray(data[0].questions) ? `Array length: ${data[0].questions.length}` : 'Not array');
            if (Array.isArray(data[0].questions) && data[0].questions.length > 0) {
              console.log(`  test_exams[0].questions[0] sample:`, data[0].questions[0]);
            }
          }
        }
      }
    } catch (e) {
      console.log(`Table [${t}]: Exception ->`, e.message);
    }
  }
}

check();
