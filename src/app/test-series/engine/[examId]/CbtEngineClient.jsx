'use client'

import * as React from 'react'
import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { saveExamState, getExamState, clearExamState } from '@/utils/indexeddb'
import { 
  AlertTriangle, CheckCircle2, Clock, Cloud, CloudOff, 
  HelpCircle, Monitor, ShieldAlert, User, Zap, RefreshCw
} from 'lucide-react'

export default function CbtEngineClient({ user, profile, exam }) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  
  const questions = exam.questions || []
  const marksScheme = exam.marks_scheme || { positive_marks: 4, negative_marks: -1 }

  // CBT State variables
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // { question_id: { selected_option: X, seconds_spent: Y } }
  const [secondsRemaining, setSecondsRemaining] = useState(exam.duration_minutes * 60)
  const [violations, setViolations] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [loading, setLoading] = useState(true)

  // Question visited tracker
  const [visited, setVisited] = useState(new Set([questions[0]?.id]))
  // Question marked for review tracker
  const [markedReview, setMarkedReview] = useState(new Set())

  // Modal / warning alerts
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningMsg, setWarningMsg] = useState('')
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const containerRef = useRef(null)
  const secondsSpentRef = useRef({}) // tracks seconds spent on the current active question

  // 1. Initial State Load from IndexedDB
  useEffect(() => {
    const loadState = async () => {
      try {
        const cached = await getExamState(exam.id)
        if (cached) {
          setAnswers(cached.answers || {})
          setSecondsRemaining(cached.secondsRemaining ?? exam.duration_minutes * 60)
          setViolations(cached.violations || 0)
          if (cached.visited) setVisited(new Set(cached.visited))
          if (cached.markedReview) setMarkedReview(new Set(cached.markedReview))
          console.log('[CBT Engine] Caches loaded from offline IndexedDB.')
        }
      } catch (err) {
        console.error('[CBT Engine] Failed to load offline cache:', err)
      } finally {
        setLoading(false)
      }
    }
    loadState()
  }, [exam])

  // 2. Fullscreen enforcement check
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const enterFullscreen = async () => {
    try {
      if (containerRef.current) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (err) {
      console.error('[CBT Engine] Failed to enter fullscreen:', err)
    }
  }

  // 3. Connectivity status background polling & heartbeat proctor ping
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const res = await fetch('/api/test-series/heartbeat', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId: exam.id })
        })
        setIsOnline(res.ok)
      } catch {
        setIsOnline(false)
      }
    }
    
    // Initial check
    checkNetwork()
    const interval = setInterval(checkNetwork, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [exam.id])

  // 4. Timer loop and seconds-spent counter
  useEffect(() => {
    if (loading || submitting || secondsRemaining <= 0) return

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          triggerAutoSubmit()
          return 0
        }
        return prev - 1
      })

      // Increment seconds spent on current question
      const currentQuestionId = questions[currentIdx]?.id
      if (currentQuestionId) {
        secondsSpentRef.current[currentQuestionId] = (secondsSpentRef.current[currentQuestionId] || 0) + 1
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, submitting, secondsRemaining, currentIdx, questions])

  // 5. Sync state to IndexedDB on state changes
  useEffect(() => {
    if (loading || submitting) return

    const syncToIndexedDB = async () => {
      try {
        await saveExamState(exam.id, {
          answers,
          secondsRemaining,
          violations,
          visited: Array.from(visited),
          markedReview: Array.from(markedReview)
        })
      } catch (err) {
        console.error('[CBT Engine] Cache save failed:', err)
      }
    }
    syncToIndexedDB()
  }, [answers, secondsRemaining, violations, visited, markedReview, loading, submitting, exam])

  // 6. Anti-Cheat Visibility Switch detection
  useEffect(() => {
    if (loading || submitting || secondsRemaining <= 0) return

    const handleVisibility = () => {
      if (document.hidden) {
        setViolations(prev => {
          const next = prev + 1
          if (next >= 3) {
            triggerAutoSubmit()
          } else {
            setWarningMsg(`Anti-Cheat Warning: Tab change or window blur detected. Violation ${next}/3. Upon reaching 3 violations, the exam will be automatically submitted.`)
            setShowWarningModal(true)
          }
          return next
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleVisibility)
    }
  }, [loading, submitting, secondsRemaining])

  // Answer handler
  const handleSelectOption = (optionIndex) => {
    const qId = questions[currentIdx].id
    setAnswers(prev => ({
      ...prev,
      [qId]: {
        selected_option: optionIndex,
        seconds_spent: (prev[qId]?.seconds_spent || 0) + (secondsSpentRef.current[qId] || 0)
      }
    }))
    secondsSpentRef.current[qId] = 0 // reset current timer segment
  }

  const handleClearResponse = () => {
    const qId = questions[currentIdx].id
    setAnswers(prev => {
      const copy = { ...prev }
      delete copy[qId]
      return copy
    })
    secondsSpentRef.current[qId] = 0
  }

  const navigateQuestion = (nextIdx) => {
    const currentQId = questions[currentIdx].id
    // Flush current seconds spent accumulator to answers payload
    if (answers[currentQId]) {
      setAnswers(prev => ({
        ...prev,
        [currentQId]: {
          ...prev[currentQId],
          seconds_spent: (prev[currentQId]?.seconds_spent || 0) + (secondsSpentRef.current[currentQId] || 0)
        }
      }))
    }
    secondsSpentRef.current[currentQId] = 0

    // Set visited
    const nextQId = questions[nextIdx]?.id
    if (nextQId) {
      setVisited(prev => new Set([...prev, nextQId]))
    }
    setCurrentIdx(nextIdx)
  }

  const handleMarkForReview = () => {
    const qId = questions[currentIdx].id
    setMarkedReview(prev => {
      const nextSet = new Set(prev)
      if (nextSet.has(qId)) {
        nextSet.delete(qId)
      } else {
        nextSet.add(qId)
      }
      return nextSet
    })
    // Move to next question if possible
    if (currentIdx < questions.length - 1) {
      navigateQuestion(currentIdx + 1)
    }
  }

  // 7. Scoring Logic & Database Submission
  const handleSubmitExam = async (isAuto = false) => {
    setSubmitting(true)
    setShowSubmitConfirm(false)

    // Calculate score card values
    let score = 0
    let correct = 0
    let incorrect = 0
    let unanswered = 0

    questions.forEach(q => {
      const ansObj = answers[q.id]
      if (!ansObj || ansObj.selected_option === undefined) {
        unanswered++
      } else if (ansObj.selected_option === q.correct_option_index) {
        correct++
        score += marksScheme.positive_marks
      } else {
        incorrect++
        score += marksScheme.negative_marks
      }
    })

    const totalDurationSeconds = (exam.duration_minutes * 60) - secondsRemaining

    try {
      // Post to Supabase database
      const { data, error } = await supabase
        .from('test_attempts')
        .insert([{
          user_id: user.id,
          exam_id: exam.id,
          answers_payload: answers,
          score,
          correct_count: correct,
          incorrect_count: incorrect,
          unanswered_count: unanswered,
          total_duration_seconds: totalDurationSeconds,
          completed_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      // Clean local IndexedDB state cache
      await clearExamState(exam.id)
      
      // Exit fullscreen if active
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }

      // Route to analytics scorecard
      router.push(`/test-series/analytics/${data.id}`)
    } catch (err) {
      console.error('[CBT Engine] Submit failed:', err)
      alert('Network sync failed. Answers are cached locally in your browser. We will retry.')
      setSubmitting(false)
    }
  }

  const triggerAutoSubmit = () => {
    alert('Time expired or Proctor security violation threshold reached. Saving scorecard and submitting...')
    handleSubmitExam(true)
  }

  // Formatting remaining timer duration
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-500 mr-2" />
        <span>Loading secure proctored environment...</span>
      </div>
    );
  }

  // Force Fullscreen Modal Overlay
  if (!isFullscreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans select-none z-50">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl">
          <Monitor className="w-12 h-12 text-teal-400 mx-auto animate-pulse" />
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">Proctored CBT Launcher</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This Computer-Based Test requires full-screen proctoring mode. All browser interactions, window resizing, and tab switches will be logged.
            </p>
          </div>
          <button
            onClick={enterFullscreen}
            className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none"
          >
            Acknowledge & Launch Fullscreen
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIdx]
  const currentAnswer = answers[currentQuestion?.id]

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none font-sans overflow-hidden"
    >
      
      {/* Header controls bar */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-black uppercase rounded-lg">
            NTA-CBT SYSTEM
          </span>
          <h2 className="text-xs font-extrabold text-white truncate max-w-[200px] md:max-w-sm">
            {exam.title}
          </h2>
        </div>

        {/* Live Timer & Proctored Indicators */}
        <div className="flex items-center gap-6">
          {/* Connection Status Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                <CloudOff className="w-3.5 h-3.5" />
                <span>CloudOff</span>
              </span>
            )}
          </div>

          {/* Time Remaining */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
            <Clock className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-black font-mono text-white leading-none">
              {formatTime(secondsRemaining)}
            </span>
          </div>
        </div>
      </header>

      {/* Main split work space */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Question Board */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="space-y-6">
            
            {/* Subject Panel */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <span className="text-xs font-black uppercase text-teal-400 tracking-wider">
                Question {currentIdx + 1} of {questions.length} • {currentQuestion?.subject}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                Marks Scheme: +{marksScheme.positive_marks} / {marksScheme.negative_marks}
              </span>
            </div>

            {/* Question Text Content */}
            <div className="bg-slate-900/10 border border-slate-900 p-6 rounded-2xl text-slate-200 text-sm leading-relaxed overflow-x-auto select-text font-medium">
              <p className="whitespace-pre-wrap">{currentQuestion?.content}</p>
            </div>

            {/* MCQ Options checklist */}
            <div className="space-y-3">
              {currentQuestion?.options.map((opt, oIdx) => {
                const isSelected = currentAnswer?.selected_option === oIdx
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full flex items-start gap-4 p-4 border rounded-xl text-xs font-bold text-left transition select-none cursor-pointer hover:scale-[1.005] active:scale-[0.995] ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-extrabold'
                        : 'bg-slate-900/20 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center text-[10px] font-black ${
                      isSelected ? 'border-teal-400 bg-teal-500 text-slate-950' : 'border-slate-800 bg-slate-950 text-slate-500'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="leading-tight">{opt}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Core Navigation Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-900 pt-5 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkForReview}
                className="px-4 py-2.5 bg-slate-900/60 border border-slate-800 text-violet-400 hover:text-violet-300 rounded-xl text-xs font-bold transition select-none cursor-pointer"
              >
                {markedReview.has(currentQuestion?.id) ? 'Unmark Review' : 'Mark for Review & Next'}
              </button>
              <button
                onClick={handleClearResponse}
                className="px-4 py-2.5 bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold transition select-none cursor-pointer"
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateQuestion(currentIdx - 1)}
                disabled={currentIdx === 0}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-805 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed select-none"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  if (currentIdx < questions.length - 1) {
                    navigateQuestion(currentIdx + 1)
                  } else {
                    setShowSubmitConfirm(true)
                  }
                }}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition select-none cursor-pointer"
              >
                {currentIdx === questions.length - 1 ? 'Submit Exam' : 'Save & Next'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Question Palette Drawer */}
        <aside className="w-80 border-l border-slate-900 bg-slate-950 p-6 flex flex-col justify-between shrink-0 overflow-y-auto hidden md:flex">
          <div className="space-y-6">
            
            {/* Student metadata widget */}
            <div className="flex items-center gap-3 bg-slate-900/20 border border-slate-900 p-4 rounded-2xl">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-teal-400 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] font-black text-white leading-none truncate">
                  {profile?.full_name || user.email.split('@')[0]}
                </h4>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1 block">
                  Student Registry
                </span>
              </div>
            </div>

            {/* Question Palette Stats */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl">
                <span className="w-2.5 h-2.5 rounded bg-violet-500 shrink-0" />
                <span>Review</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-800/50 border border-slate-800/80 text-slate-400 rounded-xl">
                <span className="w-2.5 h-2.5 rounded bg-slate-700 shrink-0" />
                <span>Not Visited</span>
              </div>
            </div>

            {/* Grid Palette */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Question Palette</h4>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = currentIdx === idx
                  const isAnswered = answers[q.id]?.selected_option !== undefined
                  const isMarked = markedReview.has(q.id)
                  const isVisited = visited.has(q.id)

                  let btnClass = 'bg-slate-900 border-slate-800 text-slate-400'
                  if (isAnswered) {
                    btnClass = 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                  } else if (isMarked) {
                    btnClass = 'bg-violet-500 border-violet-400 text-slate-950 font-black'
                  } else if (isVisited) {
                    btnClass = 'bg-rose-500 border-rose-400 text-slate-950 font-black'
                  }

                  if (isCurrent) {
                    btnClass += ' ring-2 ring-teal-400 ring-offset-2 ring-offset-slate-950'
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => navigateQuestion(idx)}
                      className={`h-9 rounded-xl border text-[11px] flex items-center justify-center transition cursor-pointer select-none ${btnClass}`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Submit Block */}
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-2xl transition cursor-pointer select-none flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>Finish CBT Series</span>
          </button>
        </aside>
      </div>

      {/* Proctoring Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/25 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-white text-lg">Proctor Alert Triggered</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  {warningMsg}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowWarningModal(false)
                  enterFullscreen()
                }}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none"
              >
                Acknowledge & Resume
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submission Confirmation Modal */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl"
            >
              <HelpCircle className="w-12 h-12 text-teal-400 mx-auto" />
              <div className="space-y-2">
                <h3 className="font-extrabold text-white text-lg">Submit Mock Exam?</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  Are you sure you want to end this exam attempt? You will not be able to change your answer selections after submitting.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  disabled={submitting}
                  className="py-3.5 bg-slate-800 hover:bg-slate-705 border border-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitExam(false)}
                  disabled={submitting}
                  className="py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Submit Paper</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
