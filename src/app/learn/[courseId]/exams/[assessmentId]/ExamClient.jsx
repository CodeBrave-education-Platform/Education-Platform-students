'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { gradeAssessmentAction, startAssessmentAttemptAction, getServerTimeAction } from './actions'
import { 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  HelpCircle, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Award,
  ChevronRight,
  Activity,
  Cloud,
  CloudOff,
  Loader2
} from 'lucide-react'

export default function ExamClient({
  course,
  assessment,
  questions,
  attempt,
  alreadySubmitted,
  user,
  gradedMetrics
}) {
  const router = useRouter()

  // Track the active attempt state locally (supporting initial null attempts)
  const [activeAttempt, setActiveAttempt] = useState(attempt)

  // Scoreboard / Results Display if already submitted
  const [submissionResult, setSubmissionResult] = useState(
    attempt?.submitted_at
      ? {
          success: true,
          score: attempt.score,
          correctCount: gradedMetrics?.correctCount ?? Object.keys(attempt.answers_payload || {}).length,
          incorrectCount: gradedMetrics?.incorrectCount ?? 0,
          unattemptedCount: gradedMetrics?.unattemptedCount ?? (questions.length - Object.keys(attempt.answers_payload || {}).length),
          submittedAt: attempt.submitted_at,
          timeExceeded: false,
          questionStatuses: gradedMetrics?.questionStatuses ?? {}
        }
      : null
  )

  const [activeIdx, setActiveIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  
  // Track final saved answers submitted to the DB
  const [savedAnswers, setSavedAnswers] = useState(attempt?.answers_payload || {})
  const [statuses, setStatuses] = useState(() => {
    const initialStatuses = {}
    questions.forEach((q) => {
      initialStatuses[q.id] = attempt?.answers_payload?.[q.id] !== undefined ? 'answered' : 'unanswered'
    })
    return initialStatuses
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  // Interactive Loader progress states
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('Establishing Secure Connection...')

  // Timer state based on assessment limit
  const startedAtTime = activeAttempt ? new Date(activeAttempt.started_at).getTime() : 0
  const durationMs = assessment.duration_minutes * 60 * 1000
  const endAtTime = startedAtTime + durationMs
  const [timeLeft, setTimeLeft] = useState(0)

  // Progressive PWA Offline Engine states
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [pendingSync, setPendingSync] = useState(false)

  // Instruction page start handler state
  const [isStartingAttempt, setIsStartingAttempt] = useState(false)

  // 1. Time Gate States for Zero-Trust Monotonic Server Clock check
  const [sTimeAnchor, setSTimeAnchor] = useState(0)
  const [perfAnchor, setPerfAnchor] = useState(0)
  const [serverTimeSynced, setServerTimeSynced] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [timeGateLoading, setTimeGateLoading] = useState(true)

  useEffect(() => {
    const syncTime = async () => {
      try {
        const timeStr = await getServerTimeAction()
        const sTime = new Date(timeStr).getTime()
        setSTimeAnchor(sTime)
        setPerfAnchor(performance.now())
        setCurrentTime(sTime)
        setServerTimeSynced(true)
      } catch (err) {
        console.error('[Time Gate] Failed to sync server time:', err)
        setSTimeAnchor(Date.now())
        setPerfAnchor(performance.now())
        setCurrentTime(Date.now())
      } finally {
        setTimeGateLoading(false)
      }
    }
    syncTime()
  }, [])

  useEffect(() => {
    if (!serverTimeSynced) return
    const interval = setInterval(() => {
      const elapsedMs = performance.now() - perfAnchor
      setCurrentTime(sTimeAnchor + elapsedMs)
    }, 1000)
    return () => clearInterval(interval)
  }, [serverTimeSynced, sTimeAnchor, perfAnchor])

  const handleStartAttempt = async () => {
    setIsStartingAttempt(true)
    try {
      const res = await startAssessmentAttemptAction(course.id, assessment.id)
      if (res.success) {
        // Sync states with the new attempt record
        setSavedAnswers(res.attempt.answers_payload || {})
        setStatuses(() => {
          const initialStatuses = {}
          questions.forEach((q) => {
            initialStatuses[q.id] = res.attempt.answers_payload?.[q.id] !== undefined ? 'answered' : 'unanswered'
          })
          return initialStatuses
        })
        setActiveAttempt(res.attempt)
        if (res.alreadySubmitted) {
          router.refresh()
        }
      } else {
        alert('Failed to start attempt: ' + res.error)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to start attempt due to network error')
    } finally {
      setIsStartingAttempt(false)
    }
  }

  // Lightweight IndexedDB helper wrappers
  const openOfflineDB = () => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('Window context missing'))
      const request = indexedDB.open('asentra-offline-db', 2)
      request.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains('exams')) {
          db.createObjectStore('exams', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('answers')) {
          db.createObjectStore('answers', { keyPath: 'id' })
        }
      }
      request.onsuccess = (e) => resolve(e.target.result)
      request.onerror = (e) => reject(e.target.error)
    })
  }

  const saveOfflineData = async (storeName, id, data) => {
    try {
      const db = await openOfflineDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        store.put({ id, ...data })
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => reject(tx.error)
      })
    } catch (err) {
      console.error('IndexedDB save failed:', err)
    }
  }

  const getOfflineData = async (storeName, id) => {
    try {
      const db = await openOfflineDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const request = store.get(id)
        request.onsuccess = (e) => resolve(e.target.result)
        request.onerror = () => reject(request.error)
      })
    } catch (err) {
      console.error('IndexedDB get failed:', err)
      return null
    }
  }

  // Request persistent storage lockdown to prevent mobile garbage collection of offline exam data
  useEffect(() => {
    const requestPersistentStorage = async () => {
      if (navigator.storage && navigator.storage.persist) {
        try {
          const isPersisted = await navigator.storage.persist()
          console.log(`[Storage Persistence] Storage persistence granted: ${isPersisted}`)
        } catch (err) {
          console.warn('[Storage Persistence] Request failed:', err)
        }
      }
    }
    requestPersistentStorage()
  }, [])

  // Pre-fetch exam structure and recover pre-cached local states on initial load
  useEffect(() => {
    if (!activeAttempt) return

    const cacheAssessmentOffline = async () => {
      try {
        await saveOfflineData('exams', assessment.id, {
          assessment,
          questions,
          courseId: course.id
        })
        
        // Load previously saved answers to prevent crash data loss
        const cachedAnswers = await getOfflineData('answers', activeAttempt.id)
        if (cachedAnswers && cachedAnswers.payload) {
          setSavedAnswers(prev => ({ ...prev, ...cachedAnswers.payload }))
          setSelectedAnswers(prev => ({ ...prev, ...cachedAnswers.payload }))
          setStatuses(prev => {
            const updated = { ...prev }
            Object.keys(cachedAnswers.payload).forEach(qId => {
              updated[qId] = 'answered'
            })
            return updated
          })
        }
      } catch (err) {
        console.warn('IndexedDB blocked or unavailable in Exam engine.', err)
        alert('Strict Privacy Mode Detected: Offline auto-save is disabled. Your progress will not be saved if you lose connection.')
      }
    }

    cacheAssessmentOffline()
  }, [assessment, questions, course, activeAttempt])

  // Sync state modifications dynamically to IndexedDB answers store
  useEffect(() => {
    if (!activeAttempt) return
    if (Object.keys(savedAnswers).length > 0) {
      saveOfflineData('answers', activeAttempt.id, { payload: savedAnswers })
    }
  }, [savedAnswers, activeAttempt])

  // Manage offline notifications and background auto-sync triggers
  useEffect(() => {
    if (!activeAttempt) return

    const handleOnlineStatusChange = async () => {
      if (navigator.onLine) {
        setIsOfflineMode(false)
        const offlineAnswers = await getOfflineData('answers', activeAttempt.id)
        if (offlineAnswers && offlineAnswers.payload && pendingSync) {
          console.log('[IndexedDB ENGINE] Connectivity restored. Auto-synchronizing offline replies...')
          setPendingSync(false)
          await performGradingSubmission(offlineAnswers.payload)
        }
      } else {
        setIsOfflineMode(true)
      }
    }

    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)
    setIsOfflineMode(!navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange)
      window.removeEventListener('offline', handleOnlineStatusChange)
    }
  }, [activeAttempt, pendingSync])

  // Initialize countdown timer
  useEffect(() => {
    if (!activeAttempt || activeAttempt.submitted_at || !serverTimeSynced) return

    const updateTimer = () => {
      const elapsedMs = performance.now() - perfAnchor
      const currentAuthoritativeTime = sTimeAnchor + elapsedMs
      
      const diffSeconds = Math.max(0, Math.floor((endAtTime - currentAuthoritativeTime) / 1000))
      setTimeLeft(diffSeconds)

      if (diffSeconds === 0) {
        clearInterval(timerInterval)
        handleAutoSubmit()
      }
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)

    return () => clearInterval(timerInterval)
  }, [activeAttempt, endAtTime, serverTimeSynced, sTimeAnchor, perfAnchor])

  // Track selected answers when transitioning questions
  useEffect(() => {
    const currentQ = questions[activeIdx]
    if (currentQ && selectedAnswers[currentQ.id] === undefined) {
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: savedAnswers[currentQ.id] !== undefined ? savedAnswers[currentQ.id] : -1
      }))
    }
  }, [activeIdx, questions, savedAnswers, selectedAnswers])

  const handleSelectOption = (optIdx) => {
    const currentQ = questions[activeIdx]
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optIdx
    }))
  }

  // Update visited status on focus
  const visitQuestion = (idx) => {
    setActiveIdx(idx)
    const qId = questions[idx].id
    if (statuses[qId] === 'not_visited') {
      setStatuses((prev) => ({
        ...prev,
        [qId]: 'unanswered'
      }))
    }
  }

  // Save Response & Advance Next
  const handleSaveAndNext = () => {
    const currentQ = questions[activeIdx]
    const chosen = selectedAnswers[currentQ.id]

    if (chosen !== undefined && chosen !== -1) {
      // Set as answered in status & saved answers
      setSavedAnswers((prev) => ({ ...prev, [currentQ.id]: chosen }))
      setStatuses((prev) => ({ ...prev, [currentQ.id]: 'answered' }))
    } else {
      setStatuses((prev) => ({ ...prev, [currentQ.id]: 'unanswered' }))
    }

    if (activeIdx < questions.length - 1) {
      visitQuestion(activeIdx + 1)
    }
  }

  // Clear Response selection
  const handleClearResponse = () => {
    const currentQ = questions[activeIdx]
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: -1 }))
    setSavedAnswers((prev) => {
      const updated = { ...prev }
      delete updated[currentQ.id]
      return updated
    })
    setStatuses((prev) => ({ ...prev, [currentQ.id]: 'unanswered' }))
  }

  // Mark for Review & Advance Next
  const handleMarkForReview = () => {
    const currentQ = questions[activeIdx]
    const chosen = selectedAnswers[currentQ.id]

    if (chosen !== undefined && chosen !== -1) {
      setSavedAnswers((prev) => ({ ...prev, [currentQ.id]: chosen }))
    }
    
    setStatuses((prev) => ({ ...prev, [currentQ.id]: 'marked_for_review' }))

    if (activeIdx < questions.length - 1) {
      visitQuestion(activeIdx + 1)
    }
  }

  function handleManualSubmit() {
    setShowConfirmSubmit(true)
  }

  async function performGradingSubmission(answersToSubmit) {
    // Check offline state
    if (typeof window !== 'undefined' && !navigator.onLine) {
      await saveOfflineData('answers', attempt.id, { payload: answersToSubmit })
      setPendingSync(true)
      alert('[OFFLINE MODE] You are currently offline. Your exam progress and answers have been safely queued in IndexedDB. Submission will automatically synchronize once internet connectivity is restored.')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(true)
    setLoadingProgress(5)
    setLoadingMessage('Initializing Secure Database Handshake...')
    
    // Simulate real-time progress steps for a highly interactive CAD preloader feel
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        
        // Dynamically update labels based on ticks
        if (prev === 20) setLoadingMessage('Downloading Blind Answer Keys securely...')
        if (prev === 45) setLoadingMessage('Evaluating Physics Multi-Choice Vectors...')
        if (prev === 70) setLoadingMessage('Computing Chemistry Entropy and Markings...')
        if (prev === 85) setLoadingMessage('Finalizing Zero-Trust Record and AIR estimate...')
        
        return prev + 1
      })
    }, 45)

    try {
      const result = await gradeAssessmentAction(
        course.id,
        assessment.id,
        activeAttempt.id,
        answersToSubmit
      )

      clearInterval(progressInterval)
      setLoadingProgress(100)
      setLoadingMessage('Evaluation complete! Hydrating transcript...')

      setTimeout(() => {
        if (result.success) {
          setSubmissionResult(result)
        } else {
          alert('Grading failed: ' + result.error)
          if (result.timeExceeded) {
            router.refresh()
          }
        }
        setIsSubmitting(false)
      }, 600)
    } catch (err) {
      clearInterval(progressInterval)
      setIsSubmitting(false)
      console.error(err)
      alert('Network submit error')
    }
  }

  async function handleAutoSubmit() {
    console.warn('Autorun countdown expired. Initiating secure automatic grading submission.')
    await performGradingSubmission(savedAnswers)
  }

  async function handleConfirmSubmit() {
    setShowConfirmSubmit(false)
    await performGradingSubmission(savedAnswers)
  }


  // Helper stats count for JEE Question Palette Grid
  const answeredCount = Object.values(statuses).filter(s => s === 'answered').length
  const unansweredCount = Object.values(statuses).filter(s => s === 'unanswered').length
  const markedCount = Object.values(statuses).filter(s => s === 'marked_for_review').length
  const unvisitedCount = Object.values(statuses).filter(s => s === 'not_visited').length

  const formatTimer = (sec) => {
    const min = Math.floor(sec / 60)
    const remainingSec = sec % 60
    return `${min.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`
  }

  // ==========================================
  // RENDER ZERO-TRUST TIME GATE LOCKS
  // ==========================================
  const startWindowTime = assessment.start_window ? new Date(assessment.start_window).getTime() : null
  const endWindowTime = assessment.end_window ? new Date(assessment.end_window).getTime() : null
  const isLockedUpcoming = startWindowTime && currentTime < startWindowTime
  const isLockedClosed = endWindowTime && currentTime > endWindowTime

  if (timeGateLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-655"></div>
      </div>
    )
  }

  if (isLockedUpcoming) {
    const secondsRemaining = Math.max(0, Math.floor((startWindowTime - currentTime) / 1000))
    const hours = Math.floor(secondsRemaining / 3600)
    const minutes = Math.floor((secondsRemaining % 3600) / 60)
    const seconds = secondsRemaining % 60
    
    return (
      <div className="min-h-[100dvh] bg-slate-50 text-slate-800 p-4 md:p-8 flex items-center justify-center animate-pulse">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200/60 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-350 border border-slate-200 shadow-inner">
            <Clock className="w-8 h-8 text-teal-600/60" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-850 tracking-tight uppercase">Assessment Starting Soon</h2>
            <p className="text-slate-455 text-xs font-bold uppercase tracking-wider">Authoritative Server Countdown</p>
          </div>
          <div className="py-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
            <span className="font-mono text-3xl font-black text-teal-600">
              {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            This assessment is scheduled to unlock at {new Date(assessment.start_window).toLocaleString()}. Please wait here.
          </p>
        </div>
      </div>
    )
  }

  if (isLockedClosed && !alreadySubmitted) {
    return (
      <div className="min-h-[100dvh] bg-slate-900 text-white p-4 md:p-8 flex items-center justify-center select-none font-sans relative">
        <div 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
          className="absolute inset-0 pointer-events-none"
        />
        <div className="max-w-md w-full bg-slate-800 border border-slate-750 p-8 rounded-3xl shadow-2xl text-center space-y-6 relative z-10 animate-fade-in">
          <div className="w-16 h-16 bg-slate-700/60 rounded-2xl flex items-center justify-center mx-auto text-slate-400 border border-slate-600 shadow-inner">
            <AlertCircle className="w-8 h-8 text-rose-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-100 tracking-tight uppercase">Assessment Window Closed</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Access Lock Active</p>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-750 rounded-2xl">
            <span className="text-xs font-mono text-slate-400">
              Closed At: {new Date(assessment.end_window).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            The scheduled window for this assessment has officially expired. Submission calculations are locked.
          </p>
          <div className="pt-2">
            <Link href="/dashboard" className="w-full block px-5 py-3 bg-slate-750 hover:bg-slate-700 text-white font-bold rounded-xl transition shadow-sm text-xs border border-slate-650 cursor-pointer text-center uppercase tracking-wider">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER INSTRUCTIONS SCREEN (IF NO ACTIVE ATTEMPT YET)
  // ==========================================
  if (!activeAttempt) {
    const totalQuestions = questions.length
    const totalMarks = totalQuestions * 4

    return (
      <div className="min-h-[100dvh] bg-slate-50 text-slate-800 p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-lg space-y-6">
          {/* Header Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider select-none">
            <Link href="/dashboard" className="hover:text-teal-850">Dashboard</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
            <span className="text-slate-400">{course?.title || 'Course'}</span>
          </div>

          {/* Test Landing details */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-100">
              <Clock className="w-3.5 h-3.5" />
              {assessment.type === 'quiz' ? 'Scheduled Quiz' : 'JEE Practice Mock'}
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-850">
              {assessment.title}
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Welcome to the Focus Mode Assessment Hub. Read all guidelines carefully before starting your attempt.
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Quick parameters grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
              <span className="text-sm font-black text-slate-700">{assessment.duration_minutes} Minutes</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Questions</span>
              <span className="text-sm font-black text-slate-700">{totalQuestions} MCQ</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Marks</span>
              <span className="text-sm font-black text-teal-650">+{totalMarks}</span>
            </div>
          </div>

          {/* Guidelines checklist */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3 text-xs leading-relaxed text-slate-655 font-bold">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Important Guidelines & Rules
            </h3>
            <ul className="list-disc pl-4 space-y-2">
              <li>Ensure you have a stable internet connection. The countdown timer is managed authoritatively by the server and will not stop if you refresh.</li>
              <li>Each question yields <span className="text-emerald-600">+4 marks</span> for a correct response and imposes a <span className="text-red-500">-1 mark</span> penalty for incorrect selections.</li>
              <li>The test will automatically submit itself when the remaining minutes hit zero.</li>
              <li>Close all background applications to guarantee focus during mock tests.</li>
            </ul>
          </div>

          {/* Action button trigger starts attempt via Server Action */}
          <div className="pt-2 flex gap-4 w-full">
            <Link
              href="/dashboard"
              className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-550 font-semibold rounded-xl text-center text-sm shadow-sm"
            >
              Go Back
            </Link>
            
            <button
              onClick={handleStartAttempt}
              disabled={isStartingAttempt}
              className="flex-1 py-3 bg-teal-605 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition shadow-sm border border-teal-600 cursor-pointer text-center flex items-center justify-center gap-2"
            >
              {isStartingAttempt ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Establishing Session...</span>
                </>
              ) : (
                <span>Start Assessment</span>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER GRADED RESULTS PANEL
  // ==========================================
  if (submissionResult) {
    const scoreVal = submissionResult.score !== undefined ? submissionResult.score : activeAttempt?.score
    const maxPossible = questions.length * 4
    const percentage = Math.max(0, Math.round((scoreVal / maxPossible) * 100))

    return (
      <div className="min-h-[100dvh] bg-slate-50 text-slate-800 p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-lg space-y-8">
          
          {/* Header Score Info Card */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto text-teal-600 border border-teal-100 shadow-inner">
              <Award className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block">
                Assessment Graded Successfully
              </span>
              <h2 className="text-2xl font-black text-slate-800 leading-tight">
                {assessment.title}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pt-0.5">
                JEE Mock Test Performance Dashboard
              </p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Key Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Final Score
              </span>
              <span className="text-xl font-black text-teal-600">
                {scoreVal} <span className="text-slate-400 text-xs font-bold">/ {maxPossible}</span>
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Accuracy Score
              </span>
              <span className="text-xl font-black text-slate-700">
                {percentage}%
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Correct Answers
              </span>
              <span className="text-xl font-black text-emerald-600">
                {submissionResult.correctCount || 0}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Incorrect Response
              </span>
              <span className="text-xl font-black text-rose-500">
                {submissionResult.incorrectCount || 0}
              </span>
            </div>
          </div>

          {/* Time Limit Notice */}
          {submissionResult.timeExceeded && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>
                <b>Note:</b> Submission was processed after the allowed JEE testing window expired. Standard grading has been archived in academic records.
              </span>
            </div>
          )}

          {/* Secure Correct/Incorrect submissions summary list */}
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
              <Activity className="w-4 h-4 text-teal-600" />
              Secure Graded Submission Record
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {questions.map((q, idx) => {
                const answerIndex = savedAnswers[q.id]
                const hasAnswered = answerIndex !== undefined && answerIndex !== -1
                
                const statusKey = submissionResult?.questionStatuses?.[q.id] || gradedMetrics?.questionStatuses?.[q.id] || 'unattempted'
                
                let iconElement = <XCircle className="w-4.5 h-4.5 text-slate-300 shrink-0" />
                let statusText = 'Unattempted'
                let textClass = 'text-slate-400 font-bold uppercase'
                
                if (statusKey === 'correct') {
                  iconElement = <CheckCircle className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  statusText = `Correct (Option ${['A', 'B', 'C', 'D'][answerIndex]})`
                  textClass = 'text-emerald-600 font-black uppercase'
                } else if (statusKey === 'incorrect') {
                  iconElement = <XCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                  statusText = `Incorrect (Option ${['A', 'B', 'C', 'D'][answerIndex]})`
                  textClass = 'text-rose-500 font-black uppercase'
                }

                return (
                  <div key={q.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold gap-3">
                    <span className="text-slate-700">Question {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className={textClass}>
                        {statusText}
                      </span>
                      {iconElement}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Dashboard Return Button */}
          <div className="flex gap-4 pt-2">
            <Link
              href="/dashboard"
              className="flex-1 text-center py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition shadow-sm text-sm border border-teal-600 cursor-pointer"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER INTERACTIVE JEE EXAM SCREEN
  // ==========================================
  const currentQ = questions[activeIdx]
  const currentQSelected = selectedAnswers[currentQ?.id]

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-800 animate-fade-in flex flex-col select-none relative">
      
      {/* 1. Interactive CAD Submission loader overlay when submitting answers */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div 
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(203, 213, 225, 0.2) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(203, 213, 225, 0.2) 1px, transparent 1px)
              `,
              backgroundSize: '16px 16px'
            }}
            className="max-w-md w-full bg-white/95 border border-slate-200 shadow-2xl rounded-3xl p-8 space-y-6 text-center animate-in fade-in duration-300"
          >
            {/* Spinning Concentric CAD rings */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 3 }}
                className="absolute inset-0 border-2 border-dashed border-teal-600 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 2 }}
                className="absolute w-12 h-12 border-2 border-slate-350 rounded-full border-t-teal-650"
              />
              <div className="absolute font-mono text-[10px] font-black text-slate-800">
                {loadingProgress}%
              </div>
            </div>

            {/* Title & dynamic readout */}
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">
                Server grading in progress
              </h3>
              <p className="text-slate-500 text-xs font-semibold">
                Executing authoritative evaluation scripts
              </p>
            </div>

            {/* Progress line */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <motion.div
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.1 }}
                className="h-full bg-teal-600 rounded-full"
              />
            </div>

            {/* Dynamic Telemetry logs box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 font-mono text-[10px] text-teal-705 text-left font-semibold min-h-[50px] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
              <span>{loadingMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Paletted Exam Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/60 shadow-sm px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider">
              <span>JEE Assessment Hub</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
              <span className="text-slate-500">{course.title}</span>
            </div>
            <h1 className="text-base md:text-lg font-black text-slate-800 truncate mt-0.5">
              {assessment.title}
            </h1>
          </div>

          {/* Offline/Online connection status telemetry badge */}
          <div className="flex items-center gap-3 shrink-0">
            {isOfflineMode || pendingSync ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl text-xs font-extrabold select-none animate-pulse">
                <CloudOff className="w-4 h-4 shrink-0" />
                <span>Saved Locally (Waiting for Network)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-extrabold select-none">
                <Cloud className="w-4 h-4 shrink-0" />
                <span>Saved to Cloud</span>
              </div>
            )}

            {/* JEE authoritative countdown timer */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-2xl shadow-inner">
              <Clock className="w-4.5 h-4.5 text-teal-600 shrink-0" />
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  Time Remaining
                </span>
                <span className="text-sm font-black text-slate-800 font-mono">
                  {formatTimer(timeLeft)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main split screen grid */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left column (3/4 width): Active JEE Question Panel & controllers */}
        <section className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col min-h-[500px]">
          {currentQ ? (
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
              
              {/* Question Text block */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-500">
                    Question {activeIdx + 1} of {questions.length}
                  </span>
                  <span className="text-[10px] font-black uppercase text-teal-600 tracking-wider">
                    JEE Marking: +{currentQ.marks_positive || 4} / -{currentQ.marks_negative || 1}
                  </span>
                </div>
                
                <div className="text-slate-800 text-sm md:text-base font-bold leading-relaxed whitespace-pre-line pt-2">
                  {currentQ.content}
                </div>
              </div>

              {/* Options selectors list */}
              <div className="space-y-3 pt-2">
                {currentQ.options && JSON.parse(JSON.stringify(currentQ.options)).map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-2xl border text-xs md:text-sm font-bold transition flex items-center gap-3 cursor-pointer ${
                      currentQSelected === idx
                        ? 'bg-teal-50 border-teal-200 text-teal-650'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center shrink-0 text-xs font-black ${
                      currentQSelected === idx
                        ? 'border-teal-500 bg-teal-500 text-white'
                        : 'border-slate-300 text-slate-400 bg-slate-50'
                    }`}>
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>

              {/* Action Buttons footer controllers */}
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleMarkForReview}
                    className="flex-1 sm:flex-initial px-4 py-3 border border-teal-200 text-teal-600 bg-teal-50 hover:bg-teal-100/50 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Mark for Review & Next
                  </button>
                  <button
                    onClick={handleClearResponse}
                    className="flex-1 sm:flex-initial px-4 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Clear Response
                  </button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {activeIdx > 0 && (
                    <button
                      onClick={() => visitQuestion(activeIdx - 1)}
                      className="flex-1 sm:flex-initial px-4 py-3 border border-slate-200 text-slate-650 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleSaveAndNext}
                    className="flex-1 sm:flex-initial px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm border border-teal-600"
                  >
                    Save & Next
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 italic">
              Loading active test question logs...
            </div>
          )}
        </section>

        {/* Right Column (1/4 width): JEE Question Palette grid */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-5 space-y-5 flex flex-col justify-between min-h-[500px]">
            
            <div className="space-y-5">
              {/* Question status grid tracker */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Question Palette
                </h3>
                <div className="grid grid-cols-5 gap-2.5 pt-3">
                  {questions.map((q, idx) => {
                    const status = statuses[q.id]
                    const isActive = idx === activeIdx

                    let bgClass = 'bg-slate-100 text-slate-405 border-slate-200' // not visited
                    if (status === 'answered') {
                      bgClass = 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    } else if (status === 'unanswered') {
                      bgClass = 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    } else if (status === 'marked_for_review') {
                      bgClass = 'bg-teal-500 text-white border-teal-500 shadow-sm'
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => visitQuestion(idx)}
                        className={`w-10 h-10 rounded-xl border text-xs font-black transition flex items-center justify-center cursor-pointer ${bgClass} ${
                          isActive ? 'ring-2 ring-teal-650/50 ring-offset-2 scale-105' : 'hover:scale-102'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Status color indicator legends */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Status Legend
                </h4>
                
                <div className="grid grid-cols-2 gap-3 text-[10px] font-extrabold uppercase text-slate-550">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-200 shrink-0" />
                    <span>Not Visited ({unvisitedCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0" />
                    <span>Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-amber-500 shrink-0" />
                    <span>Unanswered ({unansweredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-md bg-teal-500 shrink-0" />
                    <span>Review ({markedCount})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Exam dynamic control */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleManualSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-350 text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm border border-emerald-600 text-center"
              >
                Submit Assessment
              </button>
            </div>

          </div>
        </aside>

      </main>

      {/* SUBMIT CONFIRMATION DOCK DIALOG MODAL */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-xl space-y-6 animate-fade-in text-center">
            <div className="w-14 h-14 bg-teal-550/10 rounded-2xl flex items-center justify-center mx-auto text-teal-600 border border-teal-100">
              <HelpCircle className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">
                Confirm Assessment Submission
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to submit your answers? Submitting will lock your responses and trigger server-side zero-trust grading.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">Answered</span>
                <span className="text-sm font-black text-emerald-600">{answeredCount}</span>
              </div>
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">Review</span>
                <span className="text-sm font-black text-teal-600">{markedCount}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm border border-emerald-600"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
