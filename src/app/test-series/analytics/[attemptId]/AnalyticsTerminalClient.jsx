'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell, Legend, ResponsiveContainer 
} from 'recharts'
import { 
  Award, ArrowLeft, BarChart3, Clock, CheckCircle2, 
  XCircle, AlertCircle, HelpCircle, Activity, Sparkles
} from 'lucide-react'

export default function AnalyticsTerminalClient({
  user,
  profile,
  attempt,
  exam,
  studentSubjectAcc,
  topperSubjectAcc
}) {
  const questions = exam.questions || []
  const answersPayload = attempt.answers_payload || {}

  // 1. Prepare ScatterPlot Time-Drain Data
  const scatterData = React.useMemo(() => {
    return questions.map((q, idx) => {
      const ans = answersPayload[q.id]
      const secondsSpent = ans ? (ans.seconds_spent || 0) : 0
      
      let status = 'Unanswered'
      let color = '#64748B' // slate-500
      
      if (ans && ans.selected_option !== undefined) {
        if (ans.selected_option === q.correct_option_index) {
          status = 'Correct'
          color = '#10B981' // emerald-500
        } else {
          status = 'Incorrect'
          color = '#EF4444' // rose-500
        }
      }

      return {
        questionIndex: idx + 1,
        secondsSpent,
        status,
        color,
        subject: q.subject || 'General',
        sub_topic: q.sub_topic || 'Misc'
      }
    })
  }, [questions, answersPayload])

  // Custom tooltips for ScatterPlot
  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans">
          <p className="font-extrabold text-white">Question {data.questionIndex}</p>
          <p className="text-slate-400 font-bold"><span className="text-[10px] uppercase text-slate-500 block leading-none">Subject</span> {data.subject} ({data.sub_topic})</p>
          <p className="text-slate-400 font-bold"><span className="text-[10px] uppercase text-slate-500 block leading-none">Time Spent</span> {data.secondsSpent} seconds</p>
          <p className="font-black" style={{ color: data.color }}>{data.status}</p>
        </div>
      )
    }
    return null
  }

  // 2. Prepare BarChart comparison data
  const barChartData = React.useMemo(() => {
    return studentSubjectAcc.map(item => ({
      subject: item.subject,
      student: item.accuracy,
      topper: topperSubjectAcc[item.subject] || 0
    }))
  }, [studentSubjectAcc, topperSubjectAcc])

  // Aggregate metrics
  const accuracy = React.useMemo(() => {
    const total = attempt.correct_count + attempt.incorrect_count + attempt.unanswered_count
    return total > 0 ? Math.round((attempt.correct_count / total) * 100) : 0
  }, [attempt])

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between select-none font-sans overflow-x-hidden">
      
      {/* Sticky Glass Navbar */}
      <div className="z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 sticky top-0">
        <Navbar user={user} profile={profile} />
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link
            href="/test-series"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Test Series Hub</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deep Diagnostic Scorecard</span>
          </div>
        </div>

        {/* Diagnostic Scorecard Header */}
        <div className="bg-slate-900/30 border border-slate-900 p-8 rounded-[2rem] backdrop-blur-xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px]" />
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Performance Breakdown: {exam.title}
          </h1>

          {/* Core Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: 'Score Achieved', value: `${attempt.score} pts`, icon: Award, color: 'text-teal-400 bg-teal-500/5 border-teal-500/10' },
              { label: 'CBT Accuracy', value: `${accuracy}%`, icon: Activity, color: 'text-indigo-400 bg-indigo-500/5 border-indigo-500/10' },
              { label: 'Time Spent', value: formatDuration(attempt.total_duration_seconds), icon: Clock, color: 'text-amber-400 bg-amber-500/5 border-amber-500/10' },
              { label: 'Correct', value: `${attempt.correct_count} Qns`, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
              { label: 'Incorrect', value: `${attempt.incorrect_count} Qns`, icon: XCircle, color: 'text-rose-400 bg-rose-500/5 border-rose-500/10' },
              { label: 'Unanswered', value: `${attempt.unanswered_count} Qns`, icon: HelpCircle, color: 'text-slate-400 bg-slate-500/5 border-slate-500/10' }
            ].map((card, idx) => (
              <div key={idx} className={`p-4 border ${card.color} rounded-2xl flex flex-col justify-between h-24`}>
                <div className="flex justify-between items-center text-slate-500">
                  <span className="text-[9px] font-black uppercase tracking-wider">{card.label}</span>
                  <card.icon className="w-4 h-4" />
                </div>
                <span className="text-lg font-black text-white leading-none mt-2">{card.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Charts & Matrix Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Time-Drain Matrix ScatterPlot */}
          <div className="bg-slate-900/20 border border-slate-900 p-6 md:p-8 rounded-[2rem] space-y-6 flex flex-col justify-between">
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Time-Drain Matrix</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                X-axis: Seconds Spent per Question • Y-axis: Question Index (Colored by accuracy status)
              </p>
            </div>

            <div className="h-80 w-full bg-slate-950/40 border border-slate-900/60 rounded-2xl p-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis 
                    type="number" 
                    dataKey="secondsSpent" 
                    name="Time spent" 
                    unit="s" 
                    stroke="#475569" 
                    fontSize={10} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="questionIndex" 
                    name="Question Index" 
                    stroke="#475569" 
                    fontSize={10} 
                    domain={[1, questions.length]} 
                    tickCount={questions.length}
                  />
                  <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
                  <Scatter name="Questions" data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} r={6} className="cursor-pointer" />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Subject-wise Accuracy comparison BarChart */}
          <div className="bg-slate-900/20 border border-slate-900 p-6 md:p-8 rounded-[2rem] space-y-6 flex flex-col justify-between">
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span>Subject Accuracy vs. Topper average</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                Comparison of your correct percentage against the batch topper averages
              </p>
            </div>

            <div className="h-80 w-full bg-slate-950/40 border border-slate-900/60 rounded-2xl p-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 10, bottom: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="subject" stroke="#475569" fontSize={10} />
                  <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '12px', fontSize: '11px', fontFamily: 'sans-serif' }}
                    itemStyle={{ color: '#F1F5F9' }}
                    labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="student" fill="#14B8A6" name="Your Accuracy %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="topper" fill="#6366F1" name="Batch Topper %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Detailed Question Review Sheet */}
        <div className="bg-slate-900/20 border border-slate-900 p-6 md:p-8 rounded-[2rem] space-y-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-white">Item Response Log</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
              Examine option choices and time drain for each item on the paper
            </p>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const ans = answersPayload[q.id]
              const isCorrect = ans && ans.selected_option === q.correct_option_index
              const isUnanswered = !ans || ans.selected_option === undefined

              return (
                <div 
                  key={q.id}
                  className="p-4 bg-slate-950/50 border border-slate-900 hover:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase">
                      <span className="text-slate-400">Q {idx + 1}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{q.subject}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{q.sub_topic}</span>
                      <span className="text-slate-600">•</span>
                      <span className={`px-2 py-0.5 rounded ${
                        q.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        q.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium truncate max-w-xl">
                      {q.content.replace(/\$/g, '')}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-6 shrink-0 text-xs font-bold font-mono">
                    {/* Time spent */}
                    <div className="text-slate-500 flex items-center gap-1 font-bold">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span>{ans ? `${ans.seconds_spent}s` : '0s'}</span>
                    </div>

                    {/* Score status badge */}
                    {isUnanswered ? (
                      <span className="px-3 py-1 bg-slate-900 border border-slate-850 text-slate-400 text-[10px] font-extrabold uppercase tracking-wide rounded-lg">
                        Unanswered
                      </span>
                    ) : isCorrect ? (
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wide rounded-lg">
                        +{marksScheme.positive_marks} Marks
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-extrabold uppercase tracking-wide rounded-lg">
                        {marksScheme.negative_marks} Marks
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      <div className="z-10 mt-10">
        <Footer />
      </div>

    </div>
  )
}
