import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

export function useWriteBehindQueue(userId, courseId, initialCompletedIds) {
  const [completedIds, setCompletedIds] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`asentra:progress:${courseId}`)
      if (cached) {
        try {
          return new Set(JSON.parse(cached))
        } catch (e) {
          console.error('Failed to parse cached progress state:', e)
        }
      }
    }
    return new Set(initialCompletedIds)
  })
  
  const pendingSyncRef = useRef({ add: new Set(), remove: new Set() })
  const syncTimeoutRef = useRef(null)
  
  const supabase = createClient()

  // Centralized, atomic synchronization routine
  const flushQueueToDatabase = async () => {
    const pending = pendingSyncRef.current
    if (pending.add.size === 0 && pending.remove.size === 0) return

    // Clone data blocks so we don't drop items if a network request fails mid-flight
    const toAdd = Array.from(pending.add)
    const toRemove = Array.from(pending.remove)

    try {
      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', userId)
          .in('lesson_id', toRemove)
        if (error) throw error
        // Deduct from pending queue only after verified backend deletion success
        toRemove.forEach(id => pending.remove.delete(id))
      }

      if (toAdd.length > 0) {
        const insertPayload = toAdd.map(id => ({ user_id: userId, lesson_id: id }))
        const { error } = await supabase.from('user_progress').insert(insertPayload)
        if (error) throw error
        // Deduct from pending queue only after verified backend insertion success
        toAdd.forEach(id => pending.add.delete(id))
      }
      
      console.log('[Write-Behind Sync]: Database boundaries safely aligned.')
    } catch (err) {
      console.error('[Write-Behind Sync Failed]: Network exception caught. Retaining items for retry cycle.', err)
    }
  }

  const toggleProgress = (lessonId) => {
    const newCompleted = new Set(completedIds)
    const pending = pendingSyncRef.current

    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId)
      pending.remove.add(lessonId)
      pending.add.delete(lessonId)
    } else {
      newCompleted.add(lessonId)
      pending.add.add(lessonId)
      pending.remove.delete(lessonId)
    }

    // 1. Instant UI update to guarantee a 0ms latency feel
    setCompletedIds(newCompleted)
    localStorage.setItem(`asentra:progress:${courseId}`, JSON.stringify(Array.from(newCompleted)))

    // 2. Debounce database updates into a clean 1.5s write-behind window
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(flushQueueToDatabase, 1500)
  }

  // CRITICAL UNMOUNT SAFEGUARD: Ensure data drops are flushed when navigating away
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      // Fire the mutation hook immediately on unmount to save pending user progress data
      flushQueueToDatabase()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [completedIds, toggleProgress]
}
