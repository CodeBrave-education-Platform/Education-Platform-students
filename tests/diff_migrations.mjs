import fs from 'fs'
import path from 'path'

const mig14 = fs.readFileSync(path.resolve('supabase/migrations/14_schema_integrity_and_qa_patch.sql'), 'utf8').split('\n')
const mig14T = fs.readFileSync(path.resolve('supabase/migrations/20260530170000_14_schema_integrity_and_qa_patch.sql'), 'utf8').split('\n')

console.log(`mig14 lines: ${mig14.length}, mig14T lines: ${mig14T.length}`)

let diffCount = 0
for (let i = 0; i < Math.max(mig14.length, mig14T.length); i++) {
  const l1 = mig14[i] || ''
  const l2 = mig14T[i] || ''
  if (l1.trim() !== l2.trim()) {
    diffCount++
    if (diffCount <= 10) {
      console.log(`Diff at line ${i + 1}:`)
      console.log(`  mig14 : ${l1}`)
      console.log(`  mig14T: ${l2}`)
    }
  }
}
console.log(`Total line diffs: ${diffCount}`)
