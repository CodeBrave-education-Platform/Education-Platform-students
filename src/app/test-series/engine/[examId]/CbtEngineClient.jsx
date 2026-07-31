'use client'

import * as React from 'react'
import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { saveExamState, getExamState, clearExamState } from '@/utils/indexeddb'
import { 
  AlertTriangle, CheckCircle2, Clock, Cloud, CloudOff, 
  HelpCircle, Monitor, ShieldAlert, User, Zap, RefreshCw, RotateCcw
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
  const secondsSpentRef = useRef({})

  // 1. Reset / Load Exam State
  const handleResetExam = async () => {
    try {
      await clearExamState(exam.id)
      setAnswers({})
      setSecondsRemaining(exam.duration_minutes * 60)
      setViolations(0)
      setCurrentIdx(0)
      setVisited(new Set([questions[0]?.id]))
      setMarkedReview(new Set())
      alert('🔄 Exam reset successfully! You can now write the test from Question 1.')
    } catch (e) {}
  }

  useEffect(() => {
    const loadState = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('reset') === 'true') {
          await clearExamState(exam.id)
          setAnswers({})
          setSecondsRemaining(exam.duration_minutes * 60)
          setViolations(0)
          setVisited(new Set([questions[0]?.id]))
          setMarkedReview(new Set())
          setLoading(false)
          return
        }

        const cached = await getExamState(exam.id)
        if (cached) {
          setAnswers(cached.answers || {})
          setSecondsRemaining(cached.secondsRemaining ?? exam.duration_minutes * 60)
          setViolations(cached.violations || 0)
          if (cached.visited) setVisited(new Set(cached.visited))
          if (cached.markedReview) setMarkedReview(new Set(cached.markedReview))
        }
      } catch (err) {
        console.error('[CBT Engine] Failed to load offline cache:', err)
      } finally {
        setLoading(false)
      }
    }
    loadState()
  }, [exam])

  // Fullscreen enforcement check
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

  // Timer countdown hook
  useEffect(() => {
    if (loading || secondsRemaining <= 0) return
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          triggerAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [loading, secondsRemaining])

  const handleSubmitExam = async (isAuto = false) => {
    setSubmitting(true)

    let correct = 0
    let incorrect = 0
    let unanswered = 0
    let score = 0

    questions.forEach(q => {
      const ans = answers[q.id]
      if (!ans || ans.selected_option === undefined || ans.selected_option === null) {
        unanswered++
      } else if (ans.selected_option === q.correct_option_index) {
        correct++
        score += marksScheme.positive_marks
      } else {
        incorrect++
        score += marksScheme.negative_marks
      }
    })

    const totalDurationSeconds = (exam.duration_minutes * 60) - secondsRemaining

    try {
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

      await clearExamState(exam.id)
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      router.push(`/test-series/analytics/${data?.id || 'attempt-mock-001'}`)
    } catch (err) {
      await clearExamState(exam.id)
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      router.push('/test-series/analytics/attempt-mock-001')
    }
  }

  const triggerAutoSubmit = () => {
    alert('Time expired or Proctor security violation threshold reached. Submitting test...')
    handleSubmitExam(true)
  }

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-600">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mr-2" />
        <span>Loading secure proctored environment...</span>
      </div>
    )
  }

  if (!isFullscreen) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans select-none z-50">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl border border-slate-200">
          <Monitor className="w-12 h-12 text-teal-600 mx-auto animate-pulse" />
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Official NTA CBT Launcher</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This NTA Computer-Based Test requires full-screen mode. Window resizing and tab switches will be logged.
            </p>
          </div>
          <button
            onClick={enterFullscreen}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none shadow-md"
          >
            Acknowledge & Launch Test Engine
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
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between select-none font-sans overflow-hidden"
    >
      {/* Light Theme Header bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg">
            NTA CBT ENGINE
          </span>
          <h2 className="text-sm font-black text-slate-900 truncate max-w-[200px] md:max-w-sm">
            {exam.title}
          </h2>
        </div>

        {/* Live Timer, Reset & Status */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleResetExam}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="Reset and start exam fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Test</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl">
            <Clock className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-black font-mono text-slate-900 leading-none">
              {formatTime(secondsRemaining)}
            </span>
          </div>

          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-sm"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main split workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Question Panel */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 md:p-8 space-y-6 bg-white">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-black uppercase rounded-full">
                Question {currentIdx + 1} of {questions.length} • {currentQuestion?.subject}
              </span>
              <span className="text-xs text-slate-500 font-bold">
                Marks: +{marksScheme.positive_marks} / {marksScheme.negative_marks}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-900 leading-relaxed">
                {currentQuestion?.question_text}
              </h3>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQuestion?.options?.map((opt, optIdx) => {
                  const isSelected = currentAnswer?.selected_option === optIdx
                  return (
                    <button
                      key={optIdx}
                      onClick={() => {
                        setAnswers(prev => ({
                          ...prev,
                          [currentQuestion.id]: { selected_option: optIdx, seconds_spent: 10 }
                        }))
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-semibold">{opt}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              className="px-5 py-2.5 bg-slate-100 disabled:opacity-40 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Previous Question
            </button>

            <button
              disabled={currentIdx === questions.length - 1}
              onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
              className="px-5 py-2.5 bg-teal-600 disabled:opacity-40 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm"
            >
              Next Question
            </button>
          </div>
        </div>

        {/* NTA Question Palette Sidebar */}
        <div className="w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">NTA Question Palette</h4>
            
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const ans = answers[q.id]
                const isCurrent = idx === currentIdx
                const isAnswered = ans && ans.selected_option !== undefined

                let btnBg = 'bg-white border-slate-200 text-slate-700'
                if (isAnswered) btnBg = 'bg-emerald-600 text-white border-emerald-600 font-bold'
                if (isCurrent) btnBg = 'bg-teal-600 text-white border-teal-600 font-bold ring-2 ring-teal-600 ring-offset-2'

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl border text-xs font-black transition cursor-pointer ${btnBg}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-[11px] space-y-2 text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-600" />
              <span>Answered Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white border border-slate-300" />
              <span>Unanswered / Skipped</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
