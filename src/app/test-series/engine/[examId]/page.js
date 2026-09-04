import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CbtEngineClient from './CbtEngineClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'NTA CBT Exam Engine | Asentra Testing Service',
  description: 'Proctored Computer-Based Testing (CBT) examination simulator matching official NTA interface.'
}

export default async function CbtEnginePage({ params }) {
  const { examId } = await params
  
  const supabase = await createClient()

  // 1. Authenticate user session
  const { data: { user } } = await supabase.auth.getUser()
  const authenticatedUser = user || { id: 'test-user-01', email: 'candidate@asentra.edu.in' }

  // 2. Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authenticatedUser.id)
    .maybeSingle()

  // 3. Fetch target exam from database
  const { data: exam, error: examError } = await supabase
    .from('test_exams')
    .select('*, test_packages(price_ledger, title)')
    .eq('id', examId)
    .maybeSingle()

  if (examError || !exam) {
    notFound()
  }

  // 4. Authorization check for premium packages (Standalone tests with package_id === null are always open)
  if (exam.package_id && exam.test_packages?.price_ledger?.status === 'premium' && !exam.is_live_ranking) {
    if (user) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', user.id)
        .eq('package_id', exam.package_id)
        .maybeSingle()

      if (!invoice) {
        const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        if (prof?.role !== 'admin' && prof?.role !== 'teacher' && prof?.role !== 'instructor') {
          redirect('/test-series')
        }
      }
    } else {
      redirect('/test-series')
    }
  }

  // Helper for strict format normalization
  const normalizeFormat = (formatType, format, type) => {
    const raw = String(formatType || format || type || '').toUpperCase()
    if (raw.includes('MATRIX')) return 'MATRIX_MATCH'
    if (raw.includes('MULTI') || raw.includes('MSQ')) return 'MSQ'
    if (raw.includes('NUM') || raw.includes('INTEGER') || raw.includes('NAT')) return 'NUMERICAL'
    return 'MCQ'
  }

  // 5. Query questions dynamically from Global Question Bank via junction table
  let questions = []
  try {
    const { data: junctionRows, error: junctionError } = await supabase
      .from('exam_questions')
      .select('order_index, section, marks_positive, marks_negative, question_bank(*)')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true })

    if (!junctionError && junctionRows && junctionRows.length > 0) {
      questions = junctionRows.map((jr, idx) => {
        const q = jr.question_bank || {}
        let parsedOptions = []
        if (Array.isArray(q.options)) {
          parsedOptions = q.options
        } else if (typeof q.options === 'string') {
          try { parsedOptions = JSON.parse(q.options) } catch (e) { parsedOptions = [] }
        }

        const normalizedFormat = normalizeFormat(q.format_type, q.format, q.type)
        const diagramUrl = q.diagram_url || q.diagramUrl || q.image_url || null

        return {
          id: q.id || `eq-${idx + 1}`,
          format: normalizedFormat,
          format_type: q.format_type || normalizedFormat.toLowerCase(),
          type: q.type || (normalizedFormat === 'NUMERICAL' ? 'numerical' : 'mcq'),
          subject: q.subject || 'Physics',
          topic: q.topic || '',
          sub_topic: q.sub_topic || q.topic || 'General Topic',
          section: jr.section || q.section || (normalizedFormat === 'NUMERICAL' ? 'Section B' : 'Section A'),
          question_text: q.content || q.question_text || 'Question content pending.',
          content: q.content || q.question_text || '',
          options: parsedOptions,
          matrix_rows: q.matrix_rows || q.options?.rows || null,
          matrix_cols: q.matrix_cols || q.options?.cols || null,
          diagram_url: diagramUrl,
          diagramUrl: diagramUrl,
          image_url: diagramUrl,
          marks_positive: Number(jr.marks_positive || q.marks_positive) || 4,
          marks_negative: Number(jr.marks_negative || q.marks_negative) || (normalizedFormat === 'NUMERICAL' ? 0 : -1)
        }
      })
    }
  } catch (err) {
    console.error('[CBT ENGINE] Error fetching junction questions:', err)
  }

  // 6. Fallback to exam.questions column if junction had no rows
  if (questions.length === 0 && exam.questions) {
    let embeddedQuestions = []
    if (typeof exam.questions === 'string') {
      try { embeddedQuestions = JSON.parse(exam.questions) } catch (e) { embeddedQuestions = [] }
    } else if (Array.isArray(exam.questions)) {
      embeddedQuestions = exam.questions
    }

    questions = embeddedQuestions.map((q, idx) => {
      const normalizedFormat = normalizeFormat(q.format_type, q.format, q.type)
      const diagramUrl = q.diagram_url || q.diagramUrl || q.image_url || null

      return {
        id: q.id || `eq-${idx + 1}`,
        format: normalizedFormat,
        format_type: q.format_type || normalizedFormat.toLowerCase(),
        type: q.type || (normalizedFormat === 'NUMERICAL' ? 'numerical' : 'mcq'),
        subject: q.subject || 'Physics',
        topic: q.topic || '',
        sub_topic: q.sub_topic || q.topic || 'General Topic',
        section: q.section || (normalizedFormat === 'NUMERICAL' ? 'Section B' : 'Section A'),
        question_text: q.question_text || q.content || 'Question content pending.',
        content: q.content || q.question_text || '',
        options: Array.isArray(q.options) ? q.options : [],
        matrix_rows: q.matrix_rows || q.options?.rows || null,
        matrix_cols: q.matrix_cols || q.options?.cols || null,
        diagram_url: diagramUrl,
        diagramUrl: diagramUrl,
        image_url: diagramUrl,
        marks_positive: Number(q.marks_positive) || 4,
        marks_negative: Number(q.marks_negative) || (normalizedFormat === 'NUMERICAL' ? 0 : -1)
      }
    })
  }

  const sanitizedExam = {
    id: exam.id,
    package_id: exam.package_id,
    title: exam.title,
    duration_minutes: Number(exam.duration_minutes) || 180,
    total_questions: Number(exam.total_questions) || (questions.length || 75),
    marks_scheme: exam.marks_scheme || { positive_marks: 4, negative_marks: -1 },
    is_live_ranking: !!exam.is_live_ranking,
    blueprint_type: exam.blueprint_type || 'jee_main',
    sections_config: exam.sections_config || [],
    questions: questions
  }

  return (
    <CbtEngineClient
      user={authenticatedUser}
      profile={profile || { full_name: 'Candidate', role: 'student' }}
      exam={sanitizedExam}
    />
  )
}
