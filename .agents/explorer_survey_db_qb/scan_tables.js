const fs = require('fs');
const path = require('path');

const dirs = ['D:\\education portal\\src', 'D:\\admin dashboard\\src'];
const tables = ['test_questions', 'questions', 'test_exams', 'test_attempts', 'assessments', 'assessment_attempts', 'exam_questions', 'student_questions'];

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scan(full);
    } else if (/\.(js|jsx|ts|tsx)$/.test(f)) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        tables.forEach(t => {
          if (line.includes("from('" + t + "')") || line.includes('from("' + t + '")') || line.includes('from(`' + t + '`)')) {
            console.log(`${full}:${i + 1} [${t}] -> ${line.trim()}`);
          }
        });
      });
    }
  }
}

dirs.forEach(d => scan(d));
