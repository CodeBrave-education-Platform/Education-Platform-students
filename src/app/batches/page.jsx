import { createClient } from '@/utils/supabase/server'
import BatchesClient from './BatchesClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Live Preparation Batches & Cohorts | Asentra Education Platform',
  description: 'Join live interactive preparation batches with top Kota and AIIMS faculty mentors, live testing drills, and home-delivered master theory textbook boxes.'
}

export default async function BatchesPage() {
  const supabase = await createClient()

  // 1. Authenticate user session
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Query public.batches dynamically with proper ordering
  let batches = []
  try {
    const { data: dbBatches, error: batchesError } = await supabase
      .from('batches')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (batchesError) {
      console.error('[BATCHES PAGE] Database query error:', batchesError)
    }

    if (dbBatches && dbBatches.length > 0) {
      batches = dbBatches.map(b => ({
        id: b.id,
        title: b.title || 'Untitled Cohort',
        faculty: b.faculty || b.instructor_name || 'Expert Faculty Team',
        facultyRole: b.faculty_role || b.instructor_role || 'Senior Academic Mentors',
        cover: b.thumbnail_url || b.cover || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
        badge: b.badge || (b.is_featured ? 'FLAGSHIP COHORT' : 'LIVE BATCH'),
        rating: b.rating ? Number(b.rating) : 4.95,
        targetYear: b.target_year || b.target_focus || 'TARGET 2026',
        schedule: b.schedule || 'Mon - Fri Live Classes (6:00 PM - 9:00 PM)',
        studentsEnrolled: b.students_enrolled || '85% Seats Filled',
        seatsLeft: b.seats_left !== undefined && b.seats_left !== null ? b.seats_left : 15,
        price: Number(b.price) || 0,
        originalPrice: Number(b.original_price) || (Number(b.price) ? Math.round(Number(b.price) * 2.5) : 0),
        checklist: Array.isArray(b.checklist) ? b.checklist : [],
        includedBookBox: b.book_kit || null,
        curriculum: Array.isArray(b.curriculum) ? b.curriculum : []
      }))
    }
  } catch (err) {
    console.error('[BATCHES PAGE] Unexpected fetch error:', err)
  }

  // 3. Query authenticated user's active batch enrollments from database
  let joinedBatchIds = []
  if (user) {
    try {
      const { data: enrollments } = await supabase
        .from('batch_enrollments')
        .select('batch_id')
        .eq('user_id', user.id)
        .in('status', ['active', 'ACTIVE'])

      if (enrollments && enrollments.length > 0) {
        joinedBatchIds = enrollments.map(e => e.batch_id)
      }
    } catch (e) {
      console.error('[BATCHES PAGE] Error fetching user batch enrollments:', e)
    }
  }

  return (
    <BatchesClient 
      initialBatches={batches}
      initialJoinedBatchIds={joinedBatchIds}
      user={user}
    />
  )
}
