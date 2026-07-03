import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CbtEngineClient from './CbtEngineClient'

export const dynamic = 'force-dynamic'

export default async function CbtEnginePage({ params }) {
  const { examId } = await params
  
  const supabase = await createClient()

  // Authenticate user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect(`/login?redirectTo=/test-series/engine/${examId}`)
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch target exam blueprint
  const { data: exam, error: examError } = await supabase
    .from('test_exams')
    .select('*')
    .eq('id', examId)
    .single()

  if (examError || !exam) {
    console.error('[CBT_ENGINE] Exam load error:', examError)
    notFound()
  }

  return (
    <CbtEngineClient
      user={user}
      profile={profile}
      exam={exam}
    />
  )
}
