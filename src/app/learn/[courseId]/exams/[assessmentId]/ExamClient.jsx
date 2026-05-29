'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { gradeAssessmentAction } from './actions'
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
  BookOpen,
  Eye,
  Activity
} from 'lucide-react'

export default function ExamClient({
  course,
  assessment,
  questions,
  attempt,
  alreadySubmitted,
  user
}) {
  const router = useRouter()

  // Scoreboard / Results Display if already submitted
  const [submissionResult, setSubmissionResult] = useState(
    attempt.submitted_at
      ? {
          success: true,
          score: attempt.score,
          correctCount: Object.keys(attempt.answers_payload || {}).length, // simple fallback
          incorrectCount: 0,
          unattemptedCount: questions.length - Object.keys(attempt.answers_payload || {}).length,
          submittedAt: attempt.submitted_at,
          timeExceeded: false
        }
      : null
  )

  const [activeIdx, setActiveIdx] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  
  // Track final saved answers submitted to the DB
  const [savedAnswers, setSavedAnswers] = useState(attempt.answers_payload || {})
  
  // Track status for each question
  // Statuses: 'not_visited', 'answered', 'unanswered', 'marked_for_review'
  const [statuses, setStatuses] = useState(() => {
    const initialStatuses = {}
    questions.forEach((q, idx) => {
      if (attempt.submitted_at) {
        initialStatuses[q.id] = attempt.answers_payload?.[q.id] !== undefined ? 'answered' : 'unanswered'
      } else {
        initialStatuses[q.id] = idx === 0 ? 'unanswered' : 'not_visited'
      }
    })
    return initialStatuses
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  // Timer state based on assessment limit
  const startedAtTime = new Date(attempt.started_at).getTime()
  const durationMs = assessment.duration_minutes * 60 * 1000
  const endAtTime = startedAtTime + durationMs
  const [timeLeft, setTimeLeft] = useState(0)

  // Initialize countdown timer
  useEffect(() => {
    if (attempt.submitted_at) return

    const updateTimer = () => {
      const now = Date.now()
      const diffSeconds = Math.max(0, Math.floor((endAtTime - now) / 1000))
      setTimeLeft(diffSeconds)

      if (diffSeconds === 0) {
        clearInterval(timerInterval)
        handleAutoSubmit()
      }
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)

    return () => clearInterval(timerInterval)
  }, [attempt.submitted_at])

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

  const handleManualSubmit = () => {
    setShowConfirmSubmit(true)
  }

  const handleAutoSubmit = async () => {
    console.warn('Autorun countdown expired. Initiating secure automatic grading submission.')
    await performGradingSubmission(savedAnswers)
  }

  const handleConfirmSubmit = async () => {
    setShowConfirmSubmit(false)
    setIsSubmitting(true)
    await performGradingSubmission(savedAnswers)
  }

  const performGradingSubmission = async (answersToSubmit) => {
    setIsSubmitting(true)
    try {
      const result = await gradeAssessmentAction(
        course.id,
        assessment.id,
        attempt.id,
        answersToSubmit
      )

      if (result.success) {
        setSubmissionResult(result)
      } else {
        alert('Grading failed: ' + result.error)
      }
    } catch (err) {
      console.error(err)
      alert('Network submit error')
    } finally {
      setIsSubmitting(false)
    }
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
  // RENDER GRADED RESULTS PANEL
  // ==========================================
  if (submissionResult) {
    const scoreVal = submissionResult.score !== undefined ? submissionResult.score : attempt.score
    const maxPossible = questions.length * 4
    const percentage = Math.max(0, Math.round((scoreVal / maxPossible) * 100))

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center">
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
              <h2 className="text-2xl font-black text-slate-850 leading-tight">
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
              <span className="text-xl font-black text-red-500">
                {submissionResult.incorrectCount || 0}
              </span>
            </div>
          </div>

          {/* Time Limit Notice */}
          {submissionResult.timeExceeded && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>
                <b>Note:</b> Submission was processed after the allowed JEE testing window expired. Standard grading has been archived in dossiers.
              </span>
            </div>
          )}

          {/* Blind Submissions Dossier summary */}
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              Zero-Trust Blind Submission Logs
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {questions.map((q, idx) => {
                const answerIndex = savedAnswers[q.id]
                const hasAnswered = answerIndex !== undefined && answerIndex !== -1

                return (
                  <div key={q.id} className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between text-xs font-bold gap-3">
                    <span className="text-slate-700">Question {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-extrabold uppercase">
                        {hasAnswered ? `Submitted: Option ${['A', 'B', 'C', 'D'][answerIndex]}` : 'Unattempted'}
                      </span>
                      {hasAnswered ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
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
              className="flex-1 text-center py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition shadow-sm text-sm border border-teal-600"
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
    <div className="min-h-screen bg-slate-50 text-slate-800 animate-fade-in flex flex-col select-none">
      
      {/* Sticky Paletted Exam Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/60 shadow-sm px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-600 uppercase tracking-wider">
              <span>JEE Assessment Hub</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-350" />
              <span className="text-slate-500">{course.title}</span>
            </div>
            <h1 className="text-base md:text-lg font-black text-slate-850 truncate mt-0.5">
              {assessment.title}
            </h1>
          </div>

          {/* JEE authoritative countdown timer */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-2xl shrink-0 shadow-inner">
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
      </header>

      {/* Main split-screen grid - custom stacked on mobile POV */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-8 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left column (3/4 width): Active JEE Question Panel & controllers */}
        <section className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/60 shadow-sm flex flex-col min-h-[500px]">
          {currentQ ? (
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
              
              {/* Question Text block */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="px-3 py-1 bg-slate-50 border border-slate-150 rounded-xl text-xs font-black text-slate-550">
                    Question {activeIdx + 1} of {questions.length}
                  </span>
                  <span className="text-[10px] font-black uppercase text-teal-650 tracking-wider">
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
                        : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700'
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
                    className="flex-1 sm:flex-initial px-4 py-3 border border-slate-200 text-slate-550 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
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

                    let bgClass = 'bg-slate-100 text-slate-400 border-slate-200' // not visited
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
                          isActive ? 'ring-2 ring-teal-600/50 ring-offset-2 scale-105' : 'hover:scale-102'
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
                
                <div className="grid grid-cols-2 gap-3 text-[10px] font-extrabold uppercase text-slate-500">
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
                {isSubmitting ? 'Grading...' : 'Submit Assessment'}
              </button>
            </div>

          </div>
        </aside>

      </main>

      {/* SUBMIT CONFIRMATION DOCK DIALOG MODAL */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-xl space-y-6 animate-fade-in text-center">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto text-teal-650 border border-teal-100">
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
                className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-550 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
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
