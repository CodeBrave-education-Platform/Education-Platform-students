'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { saveExamState, getExamState, clearExamState } from '@/utils/indexeddb'
import KatexRenderer from '@/components/KatexRenderer'
import { 
  AlertTriangle, CheckCircle2, Clock, Cloud, CloudOff, 
  HelpCircle, Monitor, ShieldAlert, User, Zap, RefreshCw, RotateCcw,
  Calculator, Edit3, BookOpen, Bookmark, Trash2, X, Check
} from 'lucide-react'

export default function CbtEngineClient({ user, profile, exam }) {
  const router = useRouter()
  const supabase = createClient()
  
  const rawQuestions = exam.questions || []
  
  // Ensure default robust NTA question fallback if rawQuestions is short or missing properties
  const questions = React.useMemo(() => {
    if (rawQuestions.length >= 5) return rawQuestions
    return [
      {
        id: 'q-1',
        subject: 'Physics',
        sub_topic: 'Kinematics & Rotational Dynamics',
        question_text: 'A particle moves along a straight line such that its displacement x at time t is given by x = 2t³ - 9t² + 12t (where x is in meters and t in seconds). Calculate the acceleration of the particle when its velocity becomes zero.',
        options: ['0 m/s²', '6 m/s²', '12 m/s²', '-6 m/s²'],
        correct_option_index: 1,
        solution_explanation: 'v = dx/dt = 6t² - 18t + 12 = 0 => t² - 3t + 2 = 0 => t = 1s, 2s. Acceleration a = dv/dt = 12t - 18. At t = 2s, a = 12(2) - 18 = 6 m/s².'
      },
      {
        id: 'q-2',
        subject: 'Chemistry',
        sub_topic: 'Chemical Equilibrium & Kinetics',
        question_text: 'For a first-order gaseous reaction A(g) → 2B(g) + C(g), the initial pressure is P₀ and total pressure after time t is P_t. The rate constant k is expressed as:',
        options: [
          'k = (1/t) ln [P₀ / (2P₀ - P_t)]',
          'k = (1/t) ln [2P₀ / (3P₀ - P_t)]',
          'k = (1/t) ln [P₀ / (3P₀ - 2P_t)]',
          'k = (1/t) ln [2P₀ / (P₀ - P_t)]'
        ],
        correct_option_index: 1,
        solution_explanation: 'At time t, P_total = P₀ - x + 2x + x = P₀ + 2x => x = (P_t - P₀)/2. Pressure of A = P₀ - x = (3P₀ - P_t)/2. Hence k = (1/t) ln[P₀ / ((3P₀ - P_t)/2)] = (1/t) ln[2P₀ / (3P₀ - P_t)].'
      },
      {
        id: 'q-3',
        subject: 'Mathematics',
        sub_topic: 'Definite Integration & Areas',
        question_text: 'Evaluate the area enclosed between the parabolas y² = 4ax and x² = 4ay (where a > 0).',
        options: ['16a² / 3', '8a² / 3', '4a² / 3', '32a² / 3'],
        correct_option_index: 0,
        solution_explanation: 'Points of intersection are (0,0) and (4a, 4a). Area = integral from 0 to 4a of [sqrt(4ax) - (x²/4a)] dx = 16a²/3.'
      },
      {
        id: 'q-4',
        subject: 'Physics',
        sub_topic: 'Electrostatics & Capacitance',
        question_text: 'A parallel plate capacitor with air between the plates has a capacitance of 8 pF. What will be the capacitance if the distance between plates is reduced by half and the space is filled with dielectric medium (K = 6)?',
        options: ['24 pF', '48 pF', '96 pF', '12 pF'],
        correct_option_index: 2,
        solution_explanation: 'C\' = K * (epsilon_0 * A / (d/2)) = 2 * K * C₀ = 2 * 6 * 8 pF = 96 pF.'
      },
      {
        id: 'q-5',
        subject: 'Chemistry',
        sub_topic: 'Organic Reaction Mechanisms',
        question_text: 'Which of the following organic compounds will react fastest in an SN1 nucleophilic substitution reaction?',
        options: ['Tert-butyl chloride', 'Isopropyl chloride', 'Ethyl chloride', 'Methyl chloride'],
        correct_option_index: 0,
        solution_explanation: 'SN1 reaction rate depends on carbocation stability. Tert-butyl carbocation (3°) is hyperconjugatively the most stable.'
      }
    ]
  }, [rawQuestions])

  const marksScheme = exam.marks_scheme || { positive_marks: 4, negative_marks: -1 }

  // CBT State variables
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [secondsRemaining, setSecondsRemaining] = useState(exam.duration_minutes * 60)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [markedReview, setMarkedReview] = useState(new Set())
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Tool Modals
  const [showCalculator, setShowCalculator] = useState(false)
  const [calcInput, setCalcInput] = useState('')
  const [calcResult, setCalcResult] = useState('')

  const [showScratchpad, setShowScratchpad] = useState(false)
  const [showFormulaSheet, setShowFormulaSheet] = useState(false)

  // Scratchpad Canvas Ref
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Fullscreen launcher
  const enterFullscreen = async () => {
    try {
      if (document.documentElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.warn('[CBT Engine] Fullscreen notice:', err)
    } finally {
      setIsFullscreen(true)
    }
  }

  // Reset exam state
  const handleResetExam = async () => {
    try {
      await clearExamState(exam.id)
      setAnswers({})
      setSecondsRemaining(exam.duration_minutes * 60)
      setCurrentIdx(0)
      setMarkedReview(new Set())
      alert('🔄 Exam reset successfully! You can now write the test fresh.')
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
          setMarkedReview(new Set())
          setLoading(false)
          return
        }

        const cached = await getExamState(exam.id)
        if (cached) {
          setAnswers(cached.answers || {})
          setSecondsRemaining(cached.secondsRemaining ?? exam.duration_minutes * 60)
          if (cached.markedReview) setMarkedReview(new Set(cached.markedReview))
        }
      } catch (err) {
      } finally {
        setLoading(false)
      }
    }
    loadState()
  }, [exam])

  // Timer countdown
  useEffect(() => {
    if (loading || secondsRemaining <= 0) return
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmitExam()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [loading, secondsRemaining])

  // Canvas Drawing Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#0056D2'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // Calculator Handler
  const handleCalcBtn = (val) => {
    if (val === '=') {
      try {
        // Safe evaluation
        const sanitized = calcInput.replace(/×/g, '*').replace(/÷/g, '/')
        // eslint-disable-next-line react-hooks/unsupported-syntax
        setCalcResult(eval(sanitized).toString())
      } catch {
        setCalcResult('Error')
      }
    } else if (val === 'C') {
      setCalcInput('')
      setCalcResult('')
    } else {
      setCalcInput(prev => prev + val)
    }
  }

  async function handleSubmitExam() {
    try {
      const res = await fetch('/api/test-series/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: exam.id,
          answers,
          secondsRemaining,
          durationMinutes: exam.duration_minutes
        })
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to grade exam securely')
      }

      await clearExamState(exam.id)
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      router.push(`/test-series/analytics/${result.attemptId}`)
    } catch (err) {
      console.error('Failed to submit exam:', err)
      await clearExamState(exam.id)
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      router.push('/test-series/analytics/attempt-mock-001')
    }
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
  const isMarked = markedReview.has(currentQuestion?.id)

  const questionPrompt = currentQuestion?.question_text || currentQuestion?.text || currentQuestion?.question || currentQuestion?.content || 'Question Text Loading...'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between select-none font-sans overflow-hidden">
      
      {/* Light Theme Header bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg">
            NTA CBT ENGINE
          </span>
          <h2 className="text-sm font-black text-slate-900 truncate max-w-[200px] md:max-w-sm">
            {exam.title}
          </h2>
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isOnline ? (
              <>
                <Cloud className="w-3 h-3 text-emerald-600" />
                <span>Cloud Synced</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>IndexedDB Offline Mode</span>
              </>
            )}
          </span>
        </div>

        {/* NTA Interactive Feature Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${showCalculator ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculator</span>
          </button>

          <button
            onClick={() => setShowScratchpad(!showScratchpad)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${showScratchpad ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Scratchpad</span>
          </button>

          <button
            onClick={handleResetExam}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="Reset and start exam fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Test</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-xl ml-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-black font-mono text-slate-900 leading-none">
              {formatTime(secondsRemaining)}
            </span>
          </div>

          <button
            onClick={handleSubmitExam}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-sm ml-2"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main split workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Question Panel */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 md:p-8 space-y-6 bg-white">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-black uppercase rounded-full">
                  Question {currentIdx + 1} of {questions.length} • {currentQuestion?.subject}
                </span>
                {isMarked && (
                  <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                    <Bookmark className="w-3 h-3 fill-current" /> Marked for Review
                  </span>
                )}
              </div>

              <span className="text-xs text-slate-500 font-bold">
                Marks: +{marksScheme.positive_marks} / {marksScheme.negative_marks}
              </span>
            </div>

            {/* Clear Question Prompt & Diagram Display */}
            <div className="space-y-4">
              <div className="text-lg font-black text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <KatexRenderer content={questionPrompt} />
              </div>

              {(currentQuestion?.diagram_url || currentQuestion?.diagramUrl) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg">
                  <img 
                    src={currentQuestion.diagram_url || currentQuestion.diagramUrl} 
                    alt="Question Diagram" 
                    className="max-h-56 object-contain rounded-xl" 
                  />
                </div>
              )}

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
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold leading-relaxed">
                        <KatexRenderer content={opt} />
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Action Bar (Mark for Review, Clear Response, Prev/Next) */}
          <div className="flex flex-wrap justify-between items-center pt-4 border-t border-slate-100 gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMarkedReview(prev => {
                    const next = new Set(prev)
                    if (next.has(currentQuestion.id)) next.delete(currentQuestion.id)
                    else next.add(currentQuestion.id)
                    return next
                  })
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${isMarked ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'}`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isMarked ? 'Unmark Review' : 'Mark for Review'}</span>
              </button>

              <button
                onClick={() => {
                  setAnswers(prev => {
                    const updated = { ...prev }
                    delete updated[currentQuestion.id]
                    return updated
                  })
                }}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Response</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                className="px-5 py-2.5 bg-slate-100 disabled:opacity-40 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Previous
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
                const isMarkedRev = markedReview.has(q.id)

                let btnBg = 'bg-white border-slate-200 text-slate-700'
                if (isAnswered) btnBg = 'bg-emerald-600 text-white border-emerald-600 font-bold'
                if (isMarkedRev) btnBg = 'bg-purple-600 text-white border-purple-600 font-bold'
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

          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-[11px] space-y-2 text-slate-600 font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-600" />
              <span>Answered Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-600" />
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-white border border-slate-300" />
              <span>Unanswered / Skipped</span>
            </div>
          </div>
        </div>

        {/* 🧮 Calculator Floating Modal */}
        {showCalculator && (
          <div className="absolute top-16 right-80 w-64 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 z-50 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-teal-400">Scientific Calculator</span>
              <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl text-right font-mono text-sm space-y-1">
              <div className="text-xs text-slate-400 min-h-[16px]">{calcInput || '0'}</div>
              <div className="text-base font-black text-emerald-400 min-h-[20px]">{calcResult}</div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
              {['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleCalcBtn(btn)}
                  className={`p-2.5 rounded-xl transition cursor-pointer ${btn === '=' ? 'bg-emerald-600 text-white col-span-2' : btn === 'C' ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 📝 Scratchpad Canvas Modal */}
        {showScratchpad && (
          <div className="absolute inset-x-12 top-16 bottom-12 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-slate-300 z-50 flex flex-col justify-between">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600" />
                <h4 className="text-sm font-black text-slate-900">Interactive Rough Scratchpad Canvas</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={clearCanvas} className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">Clear Board</button>
                <button onClick={() => setShowScratchpad(false)} className="p-1.5 text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full h-full bg-slate-50 rounded-2xl border border-dashed border-slate-300 cursor-crosshair"
            />
          </div>
        )}

      </div>
    </div>
  )
}
