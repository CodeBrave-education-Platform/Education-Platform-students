'use client'

import React, { useState } from 'react'
import { 
  Users, Layers, FileText, ShieldAlert, CheckCircle2, 
  Plus, Edit3, Trash2, Eye, Search, Filter, RefreshCw, 
  Award, TrendingUp, Clock, AlertTriangle, ChevronRight,
  Calculator, CheckSquare, Bookmark, Play, BarChart2
} from 'lucide-react'

// Sample initial admin datasets
const INITIAL_PACKAGES = [
  {
    id: 'pkg_nta_grand_2026',
    title: 'NTA All-Format Grand Mock Package 2026',
    target_exam: 'JEE Main / Advanced / NEET',
    total_tests: 10,
    price: 0,
    status: 'Active',
    enrolled_count: 840,
    exam_types: ['MCQ', 'MSQ', 'Numerical', 'Fill-in-Blank', 'Match', 'Matrix']
  },
  {
    id: 'pkg_jee_main_ranker',
    title: 'JEE Main Rank Booster Test Series',
    target_exam: 'JEE Main 2026',
    total_tests: 15,
    price: 999,
    status: 'Active',
    enrolled_count: 420,
    exam_types: ['MCQ', 'Numerical']
  },
  {
    id: 'pkg_neet_ultimate',
    title: 'NEET Ultimate Biology & Physics Drill',
    target_exam: 'NEET UG 2026',
    total_tests: 20,
    price: 1499,
    status: 'Active',
    enrolled_count: 610,
    exam_types: ['MCQ', 'Match']
  }
]

const INITIAL_PROCTOR_FEED = [
  { id: 'sess_1', student: 'Rohan Sharma', exam: 'NTA Grand Mock Test #1', timeSpent: '42 mins', violations: 0, status: 'Live', scoreEstimate: '184 / 300' },
  { id: 'sess_2', student: 'Priya Verma', exam: 'JEE Main Physics Drill', timeSpent: '18 mins', violations: 2, status: 'Warning Alert', scoreEstimate: '110 / 300' },
  { id: 'sess_3', student: 'Ananya Gupta', exam: 'NEET Full Mock 2026', timeSpent: '85 mins', violations: 0, status: 'Live', scoreEstimate: '540 / 720' },
  { id: 'sess_4', student: 'Vikram Singh', exam: 'NTA Grand Mock Test #1', timeSpent: '112 mins', violations: 3, status: 'Auto-Submitted', scoreEstimate: '162 / 300' }
]

const INITIAL_ATTEMPT_LOGS = [
  { id: 'att_101', student: 'Aarav Mehta', test: 'NTA Grand Mock Test #1', score: 240, maxScore: 300, accuracy: '88%', timeTaken: '142m', date: '2026-07-27' },
  { id: 'att_102', student: 'Sneha Roy', test: 'JEE Main Ranker #2', score: 195, maxScore: 300, accuracy: '76%', timeTaken: '165m', date: '2026-07-26' },
  { id: 'att_103', student: 'Kabir Patel', test: 'NTA Grand Mock Test #1', score: 280, maxScore: 300, accuracy: '94%', timeTaken: '130m', date: '2026-07-25' }
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview') // overview, packages, questions, proctor, attempts
  
  // Data states
  const [packages, setPackages] = useState(INITIAL_PACKAGES)
  const [proctorFeed, setProctorFeed] = useState(INITIAL_PROCTOR_FEED)
  const [attemptLogs, setAttemptLogs] = useState(INITIAL_ATTEMPT_LOGS)
  const [searchTerm, setSearchTerm] = useState('')

  // New Package Modal state
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [newPkgTitle, setNewPkgTitle] = useState('')
  const [newPkgExam, setNewPkgExam] = useState('JEE Main')
  const [newPkgPrice, setNewPkgPrice] = useState('0')
  const [newPkgTests, setNewPkgTests] = useState('10')

  // New Question Studio state
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [qType, setQType] = useState('single_choice')
  const [qPrompt, setQPrompt] = useState('')
  const [qSubject, setQSubject] = useState('Physics')
  const [qOptionA, setQOptionA] = useState('')
  const [qOptionB, setQOptionB] = useState('')
  const [qOptionC, setQOptionC] = useState('')
  const [qOptionD, setQOptionD] = useState('')
  const [qCorrectOpt, setQCorrectOpt] = useState(0)

  // Success notifications
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const handleCreatePackage = (e) => {
    e.preventDefault()
    if (!newPkgTitle) return

    const newPkg = {
      id: `pkg_${Date.now()}`,
      title: newPkgTitle,
      target_exam: newPkgExam,
      total_tests: parseInt(newPkgTests) || 5,
      price: parseFloat(newPkgPrice) || 0,
      status: 'Active',
      enrolled_count: 0,
      exam_types: ['MCQ', 'MSQ', 'Numerical']
    }

    setPackages([newPkg, ...packages])
    setShowPackageModal(false)
    setNewPkgTitle('')
    showToast(`Test Package "${newPkgTitle}" published successfully!`)
  }

  const handleCreateQuestion = (e) => {
    e.preventDefault()
    if (!qPrompt) return

    showToast(`New ${qType.replace('_', ' ').toUpperCase()} Question added to NTA Question Bank!`)
    setShowQuestionModal(false)
    setQPrompt('')
    setQOptionA('')
    setQOptionB('')
    setQOptionC('')
    setQOptionD('')
  }

  const handleForceSubmitProctor = (sessId, studentName) => {
    setProctorFeed(prev => prev.map(s => s.id === sessId ? { ...s, status: 'Force Submitted', violations: 3 } : s))
    showToast(`Session for ${studentName} force submitted successfully.`)
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-100 select-none">
      
      {/* Toast Notification Popup */}
      {toastMsg && (
        <div className="fixed top-6 right-6 bg-teal-500 text-slate-950 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Admin Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-black uppercase tracking-widest mb-1">
            <ShieldAlert className="w-4 h-4" /> CodeBrave Control Engine
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Operations & Test Series Manager</h1>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPackageModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-4 h-4 font-black" />
            <span>Create Test Package</span>
          </button>
          
          <button
            onClick={() => setShowQuestionModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>Add NTA Question</span>
          </button>
        </div>
      </div>

      {/* Navigation Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-900 pb-2">
        {[
          { id: 'overview', label: 'Overview Metrics', icon: TrendingUp },
          { id: 'packages', label: 'Test Packages', icon: Layers },
          { id: 'questions', label: 'NTA Question Studio', icon: FileText },
          { id: 'proctor', label: 'Live Proctor Telemetry', icon: ShieldAlert },
          { id: 'attempts', label: 'Student Attempt Reports', icon: Award }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                isActive 
                  ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-extrabold uppercase tracking-wider">Total Enrolled</span>
                <Users className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-black text-white">1,870</p>
              <span className="text-[10px] text-emerald-400 font-bold">+14% this month</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-extrabold uppercase tracking-wider">Active Mock Packages</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-white">{packages.length}</p>
              <span className="text-[10px] text-slate-500 font-bold">NTA, JEE, NEET, GATE</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-extrabold uppercase tracking-wider">NTA Question Bank</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">450</p>
              <span className="text-[10px] text-amber-400 font-bold">6 NTA Question Formats</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-extrabold uppercase tracking-wider">Live Proctored Sessions</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-white">{proctorFeed.filter(s => s.status === 'Live' || s.status === 'Warning Alert').length}</p>
              <span className="text-[10px] text-rose-400 font-bold">Real-time telemetry</span>
            </div>
          </div>

          {/* Quick Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Live Proctoring Feed */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> Live Telemetry Overview
                </h3>
                <button onClick={() => setActiveTab('proctor')} className="text-xs font-bold text-teal-400 hover:underline">
                  View All Feed →
                </button>
              </div>

              <div className="space-y-3">
                {proctorFeed.slice(0, 3).map(sess => (
                  <div key={sess.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-xs">
                    <div>
                      <span className="font-extrabold text-white block">{sess.student}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{sess.exam}</span>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        sess.status === 'Live' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        sess.status === 'Warning Alert' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {sess.status}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">Violations: {sess.violations}/3</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Series Packages Overview */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" /> Active Mock Test Series
                </h3>
                <button onClick={() => setActiveTab('packages')} className="text-xs font-bold text-teal-400 hover:underline">
                  Manage Studio →
                </button>
              </div>

              <div className="space-y-3">
                {packages.map(pkg => (
                  <div key={pkg.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3.5 rounded-2xl text-xs">
                    <div>
                      <span className="font-extrabold text-white block">{pkg.title}</span>
                      <span className="text-[10px] text-teal-400 font-bold">{pkg.target_exam} • {pkg.total_tests} Tests</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-emerald-400">
                        {pkg.price === 0 ? 'FREE' : `₹${pkg.price}`}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-bold">{pkg.enrolled_count} Enrolled</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: TEST PACKAGES STUDIO */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">Test Series Package Studio</h2>
              <p className="text-xs text-slate-400">Create, configure, and publish test packages for JEE, NEET, GATE, and NTA exams.</p>
            </div>
            <button
              onClick={() => setShowPackageModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Package</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-black uppercase rounded-lg">
                      {pkg.target_exam}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-400">
                      {pkg.price === 0 ? 'FREE' : `₹${pkg.price}`}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-white leading-snug">{pkg.title}</h3>
                  <p className="text-xs text-slate-400 font-medium">Includes {pkg.total_tests} full syllabus mock tests and chapter drills.</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Enrolled Candidates:</span>
                    <span className="font-extrabold text-white font-mono">{pkg.enrolled_count}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/test-series/engine/${pkg.id}`}
                      className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-center text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-teal-400" />
                      <span>Preview CBT</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: NTA QUESTION BANK STUDIO */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">NTA Multi-Format Question Studio</h2>
              <p className="text-xs text-slate-400">Manage question pool across Single Choice, Multiple Choice, Numerical, Fill in Blank, Match, and Matrix Match formats.</p>
            </div>
            <button
              onClick={() => setShowQuestionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Available NTA Question Types in Bank</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { name: 'Single Choice (MCQ)', count: 180, format: 'MCQ' },
                { name: 'Multiple Choice (MSQ)', count: 95, format: 'MSQ' },
                { name: 'Numerical / Integer', count: 70, format: 'NUM' },
                { name: 'Fill in the Blank', count: 40, format: 'FIB' },
                { name: 'Match Following', count: 35, format: 'MTF' },
                { name: 'Matrix Match Grid', count: 30, format: 'MMG' }
              ].map((fmt, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-1 text-center">
                  <span className="text-[10px] font-black uppercase text-teal-400">{fmt.format}</span>
                  <h4 className="text-xs font-extrabold text-white leading-tight">{fmt.name}</h4>
                  <span className="text-[10px] text-slate-500 font-bold block">{fmt.count} Questions</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE PROCTOR TELEMETRY */}
      {activeTab === 'proctor' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">Live Proctoring & Telemetry Feed</h2>
              <p className="text-xs text-slate-400">Monitor live candidate test sessions, anti-cheat tab switch logs, and proctor interventions.</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Exam Title</th>
                  <th className="p-4">Elapsed Time</th>
                  <th className="p-4">Violations</th>
                  <th className="p-4">Session Status</th>
                  <th className="p-4 text-right">Proctor Action</th>
                </tr>
              </thead>
              <tbody>
                {proctorFeed.map(sess => (
                  <tr key={sess.id} className="border-b border-slate-900 hover:bg-slate-900/40">
                    <td className="p-4 font-extrabold text-white">{sess.student}</td>
                    <td className="p-4 text-slate-300">{sess.exam}</td>
                    <td className="p-4 font-mono font-bold text-teal-400">{sess.timeSpent}</td>
                    <td className="p-4 font-mono font-bold text-rose-400">{sess.violations} / 3</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                        sess.status === 'Live' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        sess.status === 'Warning Alert' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {sess.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {sess.status !== 'Auto-Submitted' && sess.status !== 'Force Submitted' ? (
                        <button
                          onClick={() => handleForceSubmitProctor(sess.id, sess.student)}
                          className="px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500 text-rose-400 hover:text-slate-950 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer"
                        >
                          Force Submit
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Terminated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT ATTEMPT REPORTS */}
      {activeTab === 'attempts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">Student Attempt Reports</h2>
              <p className="text-xs text-slate-400">View scorecard logs, candidate marks, and accuracy percentages.</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Test Title</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Accuracy</th>
                  <th className="p-4">Time Taken</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Scorecard</th>
                </tr>
              </thead>
              <tbody>
                {attemptLogs.map(log => (
                  <tr key={log.id} className="border-b border-slate-900 hover:bg-slate-900/40">
                    <td className="p-4 font-extrabold text-white">{log.student}</td>
                    <td className="p-4 text-slate-300">{log.test}</td>
                    <td className="p-4 font-mono font-black text-emerald-400">{log.score} / {log.maxScore}</td>
                    <td className="p-4 font-mono font-bold text-teal-400">{log.accuracy}</td>
                    <td className="p-4 font-mono text-slate-400">{log.timeTaken}</td>
                    <td className="p-4 text-slate-500">{log.date}</td>
                    <td className="p-4 text-right">
                      <a
                        href="/test-series/analytics/mock-attempt-1"
                        className="px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500 hover:text-slate-950 text-teal-400 rounded-lg text-[10px] font-extrabold uppercase transition"
                      >
                        Inspect Analytics
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PACKAGE MODAL */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreatePackage} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" /> Create Test Package
              </h3>
              <button type="button" onClick={() => setShowPackageModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Package Title:</label>
                <input
                  type="text"
                  required
                  value={newPkgTitle}
                  onChange={e => setNewPkgTitle(e.target.value)}
                  placeholder="e.g. NTA All-Format Grand Mock 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Target Exam Category:</label>
                <select
                  value={newPkgExam}
                  onChange={e => setNewPkgExam(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-teal-500"
                >
                  <option value="JEE Main">JEE Main</option>
                  <option value="JEE Advanced">JEE Advanced</option>
                  <option value="NEET UG">NEET UG</option>
                  <option value="GATE CS">GATE CS</option>
                  <option value="NTA All-Format">NTA All-Format Aggregate</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Price (₹):</label>
                  <input
                    type="number"
                    value={newPkgPrice}
                    onChange={e => setNewPkgPrice(e.target.value)}
                    placeholder="0 for Free"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Total Mock Tests:</label>
                  <input
                    type="number"
                    value={newPkgTests}
                    onChange={e => setNewPkgTests(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPackageModal(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition"
              >
                Publish Package
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD NTA QUESTION MODAL */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateQuestion} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" /> NTA Question Studio
              </h3>
              <button type="button" onClick={() => setShowQuestionModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">NTA Question Format:</label>
                  <select
                    value={qType}
                    onChange={e => setQType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-teal-400 font-extrabold outline-none"
                  >
                    <option value="single_choice">Single Choice (MCQ)</option>
                    <option value="multiple_choice">Multiple Choice (MSQ)</option>
                    <option value="numerical">Numerical / Integer</option>
                    <option value="fill_in_blank">Fill in the Blank</option>
                    <option value="match_following">Match the Following</option>
                    <option value="matrix_match">Matrix Match Grid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Subject:</label>
                  <select
                    value={qSubject}
                    onChange={e => setQSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Question Prompt / Statement:</label>
                <textarea
                  required
                  rows={3}
                  value={qPrompt}
                  onChange={e => setQPrompt(e.target.value)}
                  placeholder="Enter the question text, equation, or prompt..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-teal-500 font-medium"
                />
              </div>

              {qType === 'single_choice' && (
                <div className="space-y-2">
                  <label className="block text-slate-400 font-bold">Options (Select radio for correct option):</label>
                  {['Option A', 'Option B', 'Option C', 'Option D'].map((label, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={qCorrectOpt === idx}
                        onChange={() => setQCorrectOpt(idx)}
                      />
                      <input
                        type="text"
                        placeholder={label}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowQuestionModal(false)}
                className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition"
              >
                Add Question
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}