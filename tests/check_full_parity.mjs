import fs from 'fs'
import path from 'path'

const mig14 = fs.readFileSync(path.resolve('supabase/migrations/14_schema_integrity_and_qa_patch.sql'), 'utf8').split('\n')
const mig14T = fs.readFileSync(path.resolve('supabase/migrations/20260530170000_14_schema_integrity_and_qa_patch.sql'), 'utf8').split('\n')

// Normalize out the header line 2 and the single extra line in DECLARE
const norm1 = mig14.filter(l => !l.startsWith('-- Migration:')).map(l => l.trim()).join('\n')
const norm2 = mig14T.filter(l => !l.startsWith('-- Migration:') && !l.includes('v_batch_id UUID')).map(l => l.trim()).join('\n')

console.log(`Parity after normalizing 1 unused declaration: ${norm1 === norm2}`)
