'use client'

import * as React from 'react'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/utils/supabase/client'
import { saveExamState, getExamState, clearExamState } from '@/utils/indexeddb'
import KatexRenderer from '@/components/KatexRenderer'
import { 
  AlertTriangle, CheckCircle2, Clock, Cloud, CloudOff, 
  HelpCircle, Monitor, ShieldAlert, User, Zap, RefreshCw, RotateCcw,
  Calculator, Edit3, BookOpen, Bookmark, Trash2, X, Check,
  Grid, Menu, ChevronLeft, ChevronRight, CheckSquare, Square,
  FileText, Send, Eraser, PenTool, Hash, Info, Layers
} from 'lucide-react'

export default function CbtEngineClient({ user, profile, exam }) {
  const router = useRouter()
  const supabase = createClient()
  
  let rawQuestions = []
  if (typeof exam.questions === 'string') {
    try {
      rawQuestions = JSON.parse(exam.questions)
    } catch (e) {
      rawQuestions = []
    }
  } else if (Array.isArray(exam.questions)) {
    rawQuestions = exam.questions
  }
  
  // Ensure default robust NTA question fallback if rawQuestions is short or missing properties
  const questions = useMemo(() => {
    if (rawQuestions.length >= 5) return rawQuestions
    return [
      {
        id: 'q-1',
        format: 'MCQ',
        subject: 'Physics',
        sub_topic: 'Kinematics & Rotational Dynamics',
        question_text: 'A uniform disc of mass M = 4 kg and radius R = 0.5 m is rolling purely on a horizontal surface with a velocity of v = 6 m/s. Calculate its total kinetic energy in Joules.',
        options: ['72 J', '108 J', '144 J', '54 J'],
        correct_option_index: 1,
        solution_explanation: 'Total K.E. = (1/2) M v² + (1/2) I ω² = (3/4) M v² = (3/4) * 4 * 36 = 108 Joules.'
      },
      {
        id: 'q-2',
        format: 'MCQ',
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
        solution_explanation: 'At time t, P_total = P₀ - x + 2x + x = P₀ + 2x => x = (P_t - P₀)/2. Pressure of A = P₀ - x = (3P₀ - P_t)/2. Hence k = (1/t) ln[2P₀ / (3P₀ - P_t)].'
      },
      {
        id: 'q-3',
        format: 'MSQ',
        subject: 'Physics',
        sub_topic: 'Electrostatics & Conductors',
        question_text: 'Select ALL correct statements regarding a charged conducting sphere of radius R carrying total positive charge Q:',
        options: [
          'Electric field intensity everywhere inside the volume of the sphere is zero.',
          'Electric potential is constant and uniform throughout the volume inside the sphere.',
          'Electric field just outside the surface is Q / (4πε₀R²).',
          'Surface charge density is uniform on the conducting sphere.'
        ],
        correct_options: [0, 1, 2, 3],
        correct_option_index: 0,
        solution_explanation: 'All 4 options represent fundamental physical properties of electrostatic conductors in equilibrium.'
      },
      {
        id: 'q-4',
        format: 'NUMERICAL',
        subject: 'Mathematics',
        sub_topic: 'Definite Integration & King Property',
        question_text: 'Evaluate the definite integral ∫₀^(π/2) (sin(x) / (sin(x) + cos(x))) dx. Enter the exact decimal value up to 3 decimal places (e.g. 0.785).',
        options: [],
        correct_value: 0.785,
        tolerance: 0.01,
        solution_explanation: 'Using King Property: 2I = π/2 => I = π/4 ≈ 0.785.'
      },
      {
        id: 'q-5',
        format: 'MCQ',
        subject: 'Mathematics',
        sub_topic: 'Definite Integration & Areas',
        question_text: 'Evaluate the area enclosed between the parabolas y² = 4ax and x² = 4ay (where a > 0).',
        options: ['16a² / 3', '8a² / 3', '4a² / 3', '32a² / 3'],
        correct_option_index: 0,
        solution_explanation: 'Points of intersection are (0,0) and (4a, 4a). Area = ∫₀^(4a) [√(4ax) - (x²/4a)] dx = 16a²/3.'
      },
      {
        id: 'q-6',
        format: 'MCQ',
        subject: 'Chemistry',
        sub_topic: 'Organic Reaction Mechanisms',
        question_text: 'Which of the following carbocations is most stable due to maximum hyperconjugative and resonance stabilization?',
        options: ['Triphenylmethyl carbocation', 'Tert-butyl carbocation', 'Allyl carbocation', 'Isopropyl carbocation'],
        correct_option_index: 0,
        solution_explanation: 'Triphenylmethyl carbocation is stabilized by extensive resonance delocalization across 3 phenyl rings.'
      }
    ]
  }, [rawQuestions])

  const marksScheme = exam.marks_scheme || { positive_marks: 4, negative_marks: -1 }

  // Unique list of subjects present in the exam
  const subjectsList = useMemo(() => {
    const subs = new Set()
    questions.forEach(q => {
      if (q.subject) subs.add(q.subject)
    })
    return ['All', ...Array.from(subs)]
  }, [questions])

  // CBT State variables
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [secondsRemaining, setSecondsRemaining] = useState((Number(exam.duration_minutes) || 180) * 60)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [markedReview, setMarkedReview] = useState(new Set())
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modals and Drawers
  const [showPaletteSheet, setShowPaletteSheet] = useState(false)
  const [selectedSubjectTab, setSelectedSubjectTab] = useState('All')
  const [paletteFilter, setPaletteFilter] = useState('All') // 'All' | 'Answered' | 'Unanswered' | 'Marked'
  const [showToolsDropdown, setShowToolsDropdown] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showScratchpad, setShowScratchpad] = useState(false)
  const [showQuestionPaper, setShowQuestionPaper] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Calculator State
  const [calcInput, setCalcInput] = useState('')
  const [calcResult, setCalcResult] = useState('')

  // Scratchpad Canvas State
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [penColor, setPenColor] = useState('#0d9488') // Teal
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [isEraser, setIsEraser] = useState(false)

  // Track online/offline status
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
    if (!window.confirm('Are you sure you want to reset this exam? All your current answers will be cleared.')) {
      return
    }
    try {
      await clearExamState(exam.id)
      setAnswers({})
      setSecondsRemaining((Number(exam.duration_minutes) || 180) * 60)
      setCurrentIdx(0)
      setMarkedReview(new Set())
      setShowToolsDropdown(false)
      alert('🔄 Exam reset successfully! You can now start fresh.')
    } catch (e) {
      console.warn('Reset exam warning:', e)
    }
  }

  // Hydrate exam state from IndexedDB
  useEffect(() => {
    const loadState = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('reset') === 'true') {
          await clearExamState(exam.id)
          setAnswers({})
          setSecondsRemaining((Number(exam?.duration_minutes) || 180) * 60)
          setMarkedReview(new Set())
          setLoading(false)
          return
        }

        const defaultDuration = (Number(exam?.duration_minutes) || 180) * 60
        const cached = await getExamState(exam.id)
        if (cached && typeof cached.secondsRemaining === 'number' && cached.secondsRemaining > 5) {
          setAnswers(cached.answers || {})
          setSecondsRemaining(cached.secondsRemaining)
          if (cached.markedReview) setMarkedReview(new Set(cached.markedReview))
          if (typeof cached.currentIdx === 'number' && cached.currentIdx < questions.length) {
            setCurrentIdx(cached.currentIdx)
          }
        } else {
          setAnswers({})
          setSecondsRemaining(defaultDuration)
          setMarkedReview(new Set())
        }
      } catch (err) {
        console.warn('IndexedDB blocked or unavailable. Falling back to memory state.', err)
      } finally {
        setLoading(false)
      }
    }
    loadState()
  }, [exam, questions.length])

  // Debounced auto-save to IndexedDB
  useEffect(() => {
    if (loading || !exam?.id) return
    const timer = setTimeout(() => {
      saveExamState(exam.id, {
        answers,
        markedReview: Array.from(markedReview),
        secondsRemaining,
        currentIdx,
        updatedAt: Date.now()
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [answers, markedReview, secondsRemaining, currentIdx, exam?.id, loading])

  // Timer countdown
  useEffect(() => {
    if (loading || secondsRemaining <= 0 || !isFullscreen) return
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
  }, [loading, secondsRemaining, isFullscreen])

  // Canvas Drawing & Touch Handlers
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  useEffect(() => {
    if (showScratchpad) {
      setTimeout(() => initCanvas(), 50)
    }
  }, [showScratchpad, initCanvas])

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { x, y } = getCanvasCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = isEraser ? '#f8fafc' : penColor
    ctx.lineWidth = isEraser ? strokeWidth * 3 : strokeWidth
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { x, y } = getCanvasCoords(e)
    ctx.lineTo(x, y)
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

  // Calculator logic
  const handleCalcBtn = (val) => {
    if (val === '=') {
      try {
        const sanitized = calcInput
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/π/g, 'Math.PI')
          .replace(/e/g, 'Math.E')
          .replace(/sin\(/g, 'Math.sin(')
          .replace(/cos\(/g, 'Math.cos(')
          .replace(/tan\(/g, 'Math.tan(')
          .replace(/sqrt\(/g, 'Math.sqrt(')
          .replace(/log\(/g, 'Math.log10(')
          .replace(/ln\(/g, 'Math.log(')
        
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${sanitized})`)()
        const formatted = typeof res === 'number' ? (Number.isInteger(res) ? String(res) : res.toFixed(4).replace(/\.?0+$/, '')) : String(res)
        setCalcResult(formatted)
      } catch {
        setCalcResult('Error')
      }
    } else if (val === 'C') {
      setCalcInput('')
      setCalcResult('')
    } else if (val === '⌫') {
      setCalcInput(prev => prev.slice(0, -1))
    } else {
      setCalcInput(prev => prev + val)
    }
  }

  // Submit Exam handler
  async function handleSubmitExam() {
    if (isSubmitting) return
    setIsSubmitting(true)
    setShowSubmitModal(false)

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
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        await document.exitFullscreen()
      }
      router.push(`/test-series/analytics/${result.attemptId}`)
    } catch (err) {
      console.error('Failed to submit exam:', err)
      await clearExamState(exam.id)
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        await document.exitFullscreen()
      }
      alert('Error submitting exam: ' + err.message + '\nYour progress has been cleared. Redirecting to hub.')
      router.push('/test-series')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const currentQuestion = questions[currentIdx] || questions[0]
  const currentAnswer = answers[currentQuestion?.id]
  const isMarked = markedReview.has(currentQuestion?.id)

  const isNumerical = 
    currentQuestion?.format === 'NUMERICAL' || 
    currentQuestion?.format === 'NAT' || 
    currentQuestion?.question_type === 'numerical' || 
    currentQuestion?.correct_value !== undefined ||
    (!currentQuestion?.options || currentQuestion?.options.length === 0)

  const isMsq = 
    currentQuestion?.format === 'MSQ' || 
    currentQuestion?.question_type === 'msq' || 
    Array.isArray(currentQuestion?.correct_options) || 
    (Array.isArray(currentQuestion?.correct_option_index) && currentQuestion?.correct_option_index.length > 1)

  // Question selection handlers
  const handleSingleMcqSelect = (optIdx) => {
    setAnswers(prev => {
      const updated = {
        ...prev,
        [currentQuestion.id]: {
          selected_option: optIdx,
          format: 'MCQ',
          seconds_spent: (prev[currentQuestion.id]?.seconds_spent || 0) + 5
        }
      }
      saveExamState(exam.id, {
        answers: updated,
        markedReview: Array.from(markedReview),
        secondsRemaining,
        currentIdx
      })
      return updated
    })
  }

  const handleMsqToggle = (optIdx) => {
    setAnswers(prev => {
      const prevAns = prev[currentQuestion.id]
      let currentOptions = []
      if (Array.isArray(prevAns?.selected_options)) {
        currentOptions = [...prevAns.selected_options]
      } else if (prevAns?.selected_option !== undefined && prevAns?.selected_option !== null) {
        currentOptions = [Number(prevAns.selected_option)]
      }

      let updatedOptions = []
      if (currentOptions.includes(optIdx)) {
        updatedOptions = currentOptions.filter(i => i !== optIdx)
      } else {
        updatedOptions = [...currentOptions, optIdx].sort((a, b) => a - b)
      }

      const updated = { ...prev }
      if (updatedOptions.length === 0) {
        delete updated[currentQuestion.id]
      } else {
        updated[currentQuestion.id] = {
          selected_options: updatedOptions,
          format: 'MSQ',
          seconds_spent: (prevAns?.seconds_spent || 0) + 5
        }
      }
      saveExamState(exam.id, {
        answers: updated,
        markedReview: Array.from(markedReview),
        secondsRemaining,
        currentIdx
      })
      return updated
    })
  }

  const handleNumericalInput = (val) => {
    setAnswers(prev => {
      const updated = { ...prev }
      if (val === '' || val === null || val === undefined) {
        delete updated[currentQuestion.id]
      } else {
        updated[currentQuestion.id] = {
          numerical_value: String(val),
          format: 'NUMERICAL',
          seconds_spent: (prev[currentQuestion.id]?.seconds_spent || 0) + 5
        }
      }
      saveExamState(exam.id, {
        answers: updated,
        markedReview: Array.from(markedReview),
        secondsRemaining,
        currentIdx
      })
      return updated
    })
  }

  const handleNumericalKeypad = (char) => {
    const curVal = currentAnswer?.numerical_value || ''
    if (char === 'CLEAR') {
      handleNumericalInput('')
    } else if (char === 'BACKSPACE') {
      handleNumericalInput(curVal.slice(0, -1))
    } else if (char === '+/-') {
      if (curVal.startsWith('-')) {
        handleNumericalInput(curVal.slice(1))
      } else if (curVal.length > 0) {
        handleNumericalInput('-' + curVal)
      }
    } else if (char === '.') {
      if (!curVal.includes('.')) {
        handleNumericalInput(curVal + '.')
      }
    } else {
      handleNumericalInput(curVal + char)
    }
  }

  const handleClearResponse = () => {
    setAnswers(prev => {
      const updated = { ...prev }
      delete updated[currentQuestion.id]
      saveExamState(exam.id, {
        answers: updated,
        markedReview: Array.from(markedReview),
        secondsRemaining,
        currentIdx
      })
      return updated
    })
  }

  const handleToggleReview = () => {
    setMarkedReview(prev => {
      const next = new Set(prev)
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id)
      } else {
        next.add(currentQuestion.id)
      }
      saveExamState(exam.id, {
        answers,
        markedReview: Array.from(next),
        secondsRemaining,
        currentIdx
      })
      return next
    })
  }

  // Filter questions for the Question Palette
  const filteredPaletteQuestions = useMemo(() => {
    return questions.map((q, idx) => ({ ...q, originalIndex: idx })).filter(q => {
      // Subject filter
      if (selectedSubjectTab !== 'All' && q.subject !== selectedSubjectTab) {
        return false
      }
      // Status filter
      const ans = answers[q.id]
      const hasAnswer = ans && (
        (ans.selected_option !== undefined && ans.selected_option !== null && ans.selected_option !== '') ||
        (Array.isArray(ans.selected_options) && ans.selected_options.length > 0) ||
        (ans.numerical_value !== undefined && ans.numerical_value !== null && String(ans.numerical_value).trim() !== '')
      )
      const isMark = markedReview.has(q.id)

      if (paletteFilter === 'Answered') return hasAnswer
      if (paletteFilter === 'Unanswered') return !hasAnswer
      if (paletteFilter === 'Marked') return isMark
      return true
    })
  }, [questions, selectedSubjectTab, paletteFilter, answers, markedReview])

  // Count summary stats
  const summaryStats = useMemo(() => {
    let answered = 0
    let marked = 0
    questions.forEach(q => {
      const ans = answers[q.id]
      const hasAnswer = ans && (
        (ans.selected_option !== undefined && ans.selected_option !== null && ans.selected_option !== '') ||
        (Array.isArray(ans.selected_options) && ans.selected_options.length > 0) ||
        (ans.numerical_value !== undefined && ans.numerical_value !== null && String(ans.numerical_value).trim() !== '')
      )
      if (hasAnswer) answered++
      if (markedReview.has(q.id)) marked++
    })
    return {
      total: questions.length,
      answered,
      marked,
      unanswered: questions.length - answered
    }
  }, [questions, answers, markedReview])

  const questionPrompt = currentQuestion?.question_text || currentQuestion?.text || currentQuestion?.question || currentQuestion?.content || 'Question Text Loading...'

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-600">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mr-2" />
        <span className="font-bold">Loading secure proctored environment...</span>
      </div>
    )
  }

  if (!isFullscreen) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans select-none z-50">
        <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl border border-slate-200">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto border border-teal-100">
            <Monitor className="w-8 h-8 text-teal-600 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Official NTA CBT Launcher</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              This Computer-Based Test simulates authentic JEE/NEET proctoring standards. Full-screen mode is required to maintain integrity.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 text-slate-600">
            <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
              <span>{exam.title}</span>
              <span className="text-teal-600 font-mono">{exam.duration_minutes || 180} Mins</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Multi-Format (MCQ, MSQ, NAT Numerical)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>IndexedDB Offline Persistence Active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Mobile-Optimized Touch Bottom Sheet Palette</span>
            </div>
          </div>
          <button
            onClick={enterFullscreen}
            className="w-full py-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none shadow-md"
          >
            Acknowledge & Launch Test Engine
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between select-none font-sans overflow-x-hidden relative">
      
      {/* 1. Compact Sticky Header Bar (56px) */}
      <header className="h-14 sticky top-0 z-20 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg shrink-0 tracking-wider">
            NTA CBT ENGINE
          </span>
          <h2 className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[120px] sm:max-w-xs md:max-w-md">
            {exam.title}
          </h2>
          <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black uppercase rounded-full shrink-0">
            Q {currentIdx + 1}/{questions.length}
          </span>
        </div>

        {/* Center Timer & Sync Status */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black font-mono leading-none border transition-colors ${
            secondsRemaining < 300 
              ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' 
              : secondsRemaining < 900 
                ? 'bg-amber-50 border-amber-300 text-amber-700' 
                : 'bg-slate-100 border-slate-200 text-slate-900'
          }`}>
            <Clock className={`w-3.5 h-3.5 ${secondsRemaining < 300 ? 'text-rose-600' : 'text-teal-600'}`} />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <span className={`hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
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

        {/* Utilities & Submit Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop Direct Tool Shortcuts */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => setShowCalculator(prev => !prev)}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${showCalculator ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
              title="Calculator"
            >
              <Calculator className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowScratchpad(prev => !prev)}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border cursor-pointer ${showScratchpad ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
              title="Touch Scratchpad"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowQuestionPaper(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-slate-200 cursor-pointer"
              title="Question Paper View"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Tools Dropdown for Mobile / Compact Header */}
          <div className="relative">
            <button
              onClick={() => setShowToolsDropdown(prev => !prev)}
              className="p-2 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-slate-200 cursor-pointer"
              title="Utilities Menu"
            >
              <Menu className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline">Tools</span>
            </button>

            {showToolsDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-fade-in">
                <button
                  onClick={() => { setShowCalculator(true); setShowToolsDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4 text-teal-600" />
                  <span>Calculator</span>
                </button>
                <button
                  onClick={() => { setShowScratchpad(true); setShowToolsDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4 text-teal-600" />
                  <span>Touch Scratchpad</span>
                </button>
                <button
                  onClick={() => { setShowQuestionPaper(true); setShowToolsDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Question Paper</span>
                </button>
                <button
                  onClick={() => { handleClearResponse(); setShowToolsDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Clear Response</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={handleResetExam}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>Reset Test</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>Submit</span>
          </button>
        </div>
      </header>

      {/* 2. Main split workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Question Panel */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 bg-white pb-32 lg:pb-8">
          <div className="space-y-6 max-w-4xl mx-auto w-full">
            
            {/* Top Question Info Bar */}
            <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-100 gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 text-xs font-black uppercase rounded-full">
                  Question {currentIdx + 1} of {questions.length} • {currentQuestion?.subject}
                </span>

                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase rounded-md">
                  {isNumerical ? 'Numerical (NAT)' : isMsq ? 'Multi-Select (MSQ)' : 'Single Choice (MCQ)'}
                </span>

                {isMarked && (
                  <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                    <Bookmark className="w-3 h-3 fill-current" /> Marked for Review
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>Marks:</span>
                <span className="text-emerald-600">+{currentQuestion?.marks_positive ?? marksScheme.positive_marks}</span>
                <span>/</span>
                <span className="text-rose-600">{currentQuestion?.marks_negative ?? marksScheme.negative_marks}</span>
              </div>
            </div>

            {/* Question Text & Math Display */}
            <div className="space-y-4">
              <div className="text-base sm:text-lg font-black text-slate-900 leading-relaxed bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs max-w-full overflow-hidden">
                <KatexRenderer content={questionPrompt} />
              </div>

              {/* Responsive Question Diagram */}
              {(currentQuestion?.diagram_url || currentQuestion?.diagramUrl) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl max-w-xl mx-auto relative h-56 sm:h-72 w-full overflow-hidden">
                  <Image 
                    src={currentQuestion.diagram_url || currentQuestion.diagramUrl} 
                    alt="Question Diagram" 
                    fill
                    className="object-contain rounded-xl max-w-full h-auto" 
                  />
                </div>
              )}

              {/* Option Rendering: Multi-Format Support */}
              <div className="space-y-3 pt-2">
                
                {/* Format 1: Numerical Input (NAT) */}
                {isNumerical && (
                  <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4 max-w-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-slate-600 flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-teal-600" />
                        <span>Enter Numerical Answer:</span>
                      </label>
                      <button 
                        onClick={() => handleNumericalKeypad('CLEAR')}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>

                    <input
                      type="text"
                      value={currentAnswer?.numerical_value ?? ''}
                      onChange={(e) => handleNumericalInput(e.target.value)}
                      placeholder="Type decimal or integer value..."
                      className="w-full text-center text-xl font-black font-mono p-3.5 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-900"
                    />

                    {/* Integrated On-Screen Touch Keypad */}
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {['7', '8', '9', 'BACKSPACE', '4', '5', '6', '+/-', '1', '2', '3', '.', '0', 'CLEAR'].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleNumericalKeypad(key)}
                          className={`min-h-[48px] rounded-xl font-black text-sm transition-all select-none active:scale-95 cursor-pointer shadow-xs ${
                            key === 'BACKSPACE' 
                              ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                              : key === 'CLEAR' 
                                ? 'bg-rose-100 text-rose-900 border border-rose-200 col-span-2' 
                                : key === '+/-' || key === '.' 
                                  ? 'bg-slate-200 text-slate-800' 
                                  : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-200'
                          }`}
                        >
                          {key === 'BACKSPACE' ? '⌫' : key}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Format 2: Multi-Select MSQ (Checkbox Behavior) */}
                {isMsq && !isNumerical && currentQuestion?.options?.map((opt, optIdx) => {
                  const selectedList = Array.isArray(currentAnswer?.selected_options) 
                    ? currentAnswer.selected_options 
                    : (currentAnswer?.selected_option !== undefined ? [Number(currentAnswer.selected_option)] : [])
                  const isSelected = selectedList.includes(optIdx)
                  const letterBadge = ['A', 'B', 'C', 'D', 'E', 'F'][optIdx] || optIdx + 1

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleMsqToggle(optIdx)}
                      className={`min-h-[52px] w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3.5 select-none active:scale-[0.98] ${
                        isSelected 
                          ? 'bg-teal-50/90 border-teal-600 text-teal-950 font-bold shadow-xs ring-1 ring-teal-600/30' 
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-xs transition-colors ${
                          isSelected ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {letterBadge}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold leading-relaxed break-words flex-1">
                          <KatexRenderer content={opt} />
                        </span>
                      </div>

                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected ? <CheckSquare className="w-4 h-4 stroke-[3]" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                  )
                })}

                {/* Format 3: Single Choice MCQ (Radio Behavior) */}
                {!isMsq && !isNumerical && currentQuestion?.options?.map((opt, optIdx) => {
                  const isSelected = currentAnswer?.selected_option === optIdx
                  const letterBadge = ['A', 'B', 'C', 'D', 'E', 'F'][optIdx] || optIdx + 1

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSingleMcqSelect(optIdx)}
                      className={`min-h-[52px] w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3.5 select-none active:scale-[0.98] ${
                        isSelected 
                          ? 'bg-teal-50/90 border-teal-600 text-teal-950 font-bold shadow-xs ring-1 ring-teal-600/30' 
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-xs transition-colors ${
                          isSelected ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {letterBadge}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold leading-relaxed break-words flex-1">
                          <KatexRenderer content={opt} />
                        </span>
                      </div>

                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  )
                })}

              </div>
            </div>
          </div>
        </div>

        {/* 3. Desktop NTA Question Palette Sidebar (Hidden on Mobile < 1024px) */}
        <div className="hidden lg:flex w-80 bg-slate-50 border-l border-slate-200 p-6 flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                NTA Question Palette
              </h4>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {summaryStats.answered}/{summaryStats.total} Done
              </span>
            </div>

            {/* Subject Tabs */}
            {subjectsList.length > 2 && (
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                {subjectsList.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubjectTab(sub)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition whitespace-nowrap cursor-pointer ${
                      selectedSubjectTab === sub 
                        ? 'bg-teal-600 text-white shadow-xs' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
            
            {/* Desktop Question Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto p-1">
              {questions.map((q, idx) => {
                if (selectedSubjectTab !== 'All' && q.subject !== selectedSubjectTab) {
                  return null
                }

                const ans = answers[q.id]
                const isCurrent = idx === currentIdx
                const isAnswered = ans && (
                  (ans.selected_option !== undefined && ans.selected_option !== null && ans.selected_option !== '') ||
                  (Array.isArray(ans.selected_options) && ans.selected_options.length > 0) ||
                  (ans.numerical_value !== undefined && ans.numerical_value !== null && String(ans.numerical_value).trim() !== '')
                )
                const isMarkedRev = markedReview.has(q.id)

                let btnBg = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                if (isAnswered) btnBg = 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                if (isMarkedRev) btnBg = 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                if (isCurrent) btnBg = 'bg-teal-600 text-white border-teal-600 font-black ring-2 ring-teal-600 ring-offset-2'

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center active:scale-95 ${btnBg}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Palette Legend */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-[11px] space-y-2 text-slate-600 font-medium shadow-xs mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-600" />
                <span>Answered</span>
              </div>
              <span className="font-black text-slate-900">{summaryStats.answered}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-600" />
                <span>Marked for Review</span>
              </div>
              <span className="font-black text-slate-900">{summaryStats.marked}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-white border border-slate-300" />
                <span>Unanswered</span>
              </div>
              <span className="font-black text-slate-900">{summaryStats.unanswered}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-between gap-2">
        {/* Left Actions: Mark Review & Clear */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleToggleReview}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
              isMarked 
                ? 'bg-purple-600 text-white border-purple-600' 
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">{isMarked ? 'Unmark Review' : 'Mark for Review'}</span>
            <span className="sm:hidden">Review</span>
          </button>

          <button
            onClick={handleClearResponse}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            title="Clear Response"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        {/* Center Action: Mobile Question Palette Trigger Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowPaletteSheet(true)}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Grid className="w-3.5 h-3.5 text-teal-400" />
            <span>Palette ({summaryStats.answered}/{summaryStats.total})</span>
          </button>
        </div>

        {/* Right Actions: Prev / Next */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-slate-100 disabled:opacity-40 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <button
            disabled={currentIdx === questions.length - 1}
            onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-teal-600 disabled:opacity-40 hover:bg-teal-700 active:scale-95 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>Next Question</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. Mobile Swipeable Bottom Sheet Question Palette (< 1024px) */}
      <AnimatePresence>
        {showPaletteSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaletteSheet(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Sheet Body */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) setShowPaletteSheet(false)
              }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col lg:hidden border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center py-2.5 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
              </div>

              {/* Sheet Header */}
              <div className="px-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-teal-600" />
                  <h4 className="text-sm font-black text-slate-900">
                    NTA Question Palette
                  </h4>
                </div>
                <button
                  onClick={() => setShowPaletteSheet(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subject & Status Filter Pills */}
              <div className="p-3 border-b border-slate-100 space-y-2 shrink-0 bg-slate-50">
                {/* Subject Tabs */}
                {subjectsList.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {subjectsList.map(sub => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubjectTab(sub)}
                        className={`px-3 py-1 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                          selectedSubjectTab === sub 
                            ? 'bg-teal-600 text-white shadow-xs' 
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}

                {/* Status Filter Pills */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                  {['All', 'Answered', 'Unanswered', 'Marked'].map(status => (
                    <button
                      key={status}
                      onClick={() => setPaletteFilter(status)}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                        paletteFilter === status 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Tap Question Grid */}
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
                  {filteredPaletteQuestions.map((q) => {
                    const idx = q.originalIndex
                    const ans = answers[q.id]
                    const isCurrent = idx === currentIdx
                    const isAnswered = ans && (
                      (ans.selected_option !== undefined && ans.selected_option !== null && ans.selected_option !== '') ||
                      (Array.isArray(ans.selected_options) && ans.selected_options.length > 0) ||
                      (ans.numerical_value !== undefined && ans.numerical_value !== null && String(ans.numerical_value).trim() !== '')
                    )
                    const isMarkedRev = markedReview.has(q.id)

                    let btnBg = 'bg-white border-slate-200 text-slate-700'
                    if (isAnswered) btnBg = 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                    if (isMarkedRev) btnBg = 'bg-purple-600 text-white border-purple-600 font-bold shadow-xs'
                    if (isCurrent) btnBg = 'bg-teal-600 text-white border-teal-600 font-black ring-2 ring-teal-600 ring-offset-2'

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentIdx(idx)
                          setShowPaletteSheet(false)
                        }}
                        className={`h-11 rounded-2xl border text-xs font-black transition cursor-pointer flex items-center justify-center active:scale-90 ${btnBg}`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Summary Stats & Quick Submit */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-black">
                    {summaryStats.answered} Answered
                  </div>
                  <div className="p-2 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 font-black">
                    {summaryStats.marked} Review
                  </div>
                  <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-black">
                    {summaryStats.unanswered} Left
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowPaletteSheet(false)
                    setShowSubmitModal(true)
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-md transition"
                >
                  Proceed to Submit Test
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 6. Responsive Calculator Floating Modal */}
      {showCalculator && (
        <div className="fixed inset-x-3 top-16 sm:inset-auto sm:top-16 sm:right-6 md:right-10 w-auto sm:w-72 bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-slate-800 z-50 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              <span>Scientific Calculator</span>
            </span>
            <button 
              onClick={() => setShowCalculator(false)} 
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl text-right font-mono space-y-1 border border-slate-800">
            <div className="text-xs text-slate-400 min-h-[16px] overflow-x-auto scrollbar-none">{calcInput || '0'}</div>
            <div className="text-lg font-black text-emerald-400 min-h-[24px] overflow-x-auto scrollbar-none">{calcResult}</div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
            {['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='].map(btn => (
              <button
                key={btn}
                onClick={() => handleCalcBtn(btn)}
                className={`min-h-[38px] rounded-xl transition cursor-pointer active:scale-95 ${
                  btn === '=' 
                    ? 'bg-emerald-600 text-white font-black hover:bg-emerald-500' 
                    : btn === 'C' 
                      ? 'bg-rose-600 text-white hover:bg-rose-500' 
                      : btn === '⌫' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 7. Interactive Touch Scratchpad Modal */}
      {showScratchpad && (
        <div className="fixed inset-3 md:inset-x-12 md:top-16 md:bottom-12 bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-2xl border border-slate-300 z-50 flex flex-col justify-between">
          <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-200 gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-teal-600" />
              <h4 className="text-sm font-black text-slate-900">
                Touch Rough Scratchpad
              </h4>
            </div>

            {/* Scratchpad Controls */}
            <div className="flex items-center gap-2">
              {/* Pen / Eraser Toggle */}
              <button
                onClick={() => setIsEraser(false)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border ${!isEraser ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-100 text-slate-700'}`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pen</span>
              </button>

              <button
                onClick={() => setIsEraser(true)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border ${isEraser ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-100 text-slate-700'}`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Eraser</span>
              </button>

              {/* Stroke Width Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[2, 4, 8].map(size => (
                  <button
                    key={size}
                    onClick={() => setStrokeWidth(size)}
                    className={`w-6 h-6 rounded-lg text-[10px] font-black ${strokeWidth === size ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500'}`}
                  >
                    {size}px
                  </button>
                ))}
              </div>

              <button 
                onClick={clearCanvas} 
                className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 hover:bg-rose-100"
              >
                Clear Board
              </button>

              <button 
                onClick={() => setShowScratchpad(false)} 
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Responsive Touch Canvas */}
          <div className="flex-1 w-full relative my-2 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
              style={{ touchAction: 'none' }}
              className="w-full h-full cursor-crosshair block"
            />
          </div>
        </div>
      )}

      {/* 8. Full Question Paper View Modal */}
      {showQuestionPaper && (
        <div className="fixed inset-3 md:inset-x-16 md:top-14 md:bottom-10 bg-white p-4 sm:p-6 rounded-3xl shadow-2xl border border-slate-300 z-50 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 shrink-0">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">Question Paper Blueprint</h3>
              <p className="text-xs text-slate-500">All {questions.length} questions in this test series</p>
            </div>
            <button 
              onClick={() => setShowQuestionPaper(false)}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-teal-700">
                  <span>Question {idx + 1} • {q.subject || 'General'}</span>
                  <span className="text-slate-500">Marks: +{q.marks_positive || 4} / {q.marks_negative || -1}</span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900">
                  <KatexRenderer content={q.question_text || q.text || 'Question text'} />
                </div>
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="text-xs p-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-100 font-bold flex items-center justify-center text-[10px] text-slate-600 shrink-0">
                          {['A', 'B', 'C', 'D'][oIdx] || oIdx + 1}
                        </span>
                        <span className="flex-1 truncate"><KatexRenderer content={opt} /></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end shrink-0">
            <button
              onClick={() => setShowQuestionPaper(false)}
              className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              Close Question Paper
            </button>
          </div>
        </div>
      )}

      {/* 9. Safe Double-Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Submit CBT Exam</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to complete and submit your exam attempt?
              </p>
            </div>

            {/* Breakdown summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Total Questions:</span>
                <span className="font-black text-slate-900">{summaryStats.total}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 font-bold">
                <span>Answered:</span>
                <span>{summaryStats.answered}</span>
              </div>
              <div className="flex justify-between items-center text-purple-700 font-bold">
                <span>Marked for Review:</span>
                <span>{summaryStats.marked}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-bold">
                <span>Unanswered:</span>
                <span>{summaryStats.unanswered}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-slate-900 font-mono font-bold">
                <span>Time Left:</span>
                <span className="text-teal-600">{formatTime(secondsRemaining)}</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Resume Exam
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSubmitExam}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Grading...</span>
                  </>
                ) : (
                  <span>Confirm & Submit</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
