'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Users, Award, ShieldAlert, CheckCircle2, ArrowUpRight, 
  TrendingUp, Clock, Plus, Filter, Eye, AlertTriangle, FileText, Sparkles 
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const metrics = [
    { label: 'Total Enrolled Students', value: '1,420', change: '+12%', icon: Users, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
    { label: 'Mock Test Packages', value: '18', change: 'JEE / NEET / GATE', icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Completed Attempts', value: '8,940', change: '+24%', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Active Live Proctored Sessions', value: '14', change: 'Live Feeds', icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' }
  ]

  const recentAttempts = [
    { id: 'att-901', candidate: 'Rahul Sharma', exam: 'NTA JEE Grand Mock - 01', score: '248 / 300', accuracy: '86%', status: 'Completed', date: 'Just now' },
    { id: 'att-902', candidate: 'Priya Verma', exam: 'NEET Physics Chapterwise CBT', score: '172 / 180', accuracy: '94%', status: 'Completed', date: '5 mins ago' },
    { id: 'att-903', candidate: 'Ankit Mehta', exam: 'JEE Advanced Paper 1 (MSQ)', score: '180 / 240', accuracy: '78%', status: 'Completed', date: '12 mins ago' }
  ]

  return (
    <div className="space-y-8 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">CodeBrave Admin Control Portal</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Manage competitive test series packages, NTA multi-format question banks, live proctored sessions, and student scorecards.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/questions"
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Question</span>
          </Link>
          <Link
            href="/admin/test-series"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700"
          >
            <Award className="w-4 h-4 text-purple-400" />
            <span>Create Package</span>
          </Link>
        </div>
      </div>

      {/* Top Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">{m.label}</span>
                <div className={`p-2 rounded-xl border ${m.bg}`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl font-black text-white">{m.value}</span>
                <span className="text-[10px] font-extrabold text-teal-400">{m.change}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition border-b-2 cursor-pointer ${activeTab === 'overview' ? 'border-teal-400 text-teal-400 font-black' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          📊 Platform Overview
        </button>
        <Link
          href="/admin/test-series"
          className="pb-3 transition border-b-2 border-transparent text-slate-400 hover:text-white"
        >
          📝 Test Series Studio
        </Link>
        <Link
          href="/admin/questions"
          className="pb-3 transition border-b-2 border-transparent text-slate-400 hover:text-white"
        >
          ❓ NTA Question Bank (6 Formats)
        </Link>
        <Link
          href="/admin/proctoring"
          className="pb-3 transition border-b-2 border-transparent text-slate-400 hover:text-white"
        >
          🛡️ Live Proctor Monitor
        </Link>
      </div>

      {/* Tab Content: Platform Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-800/80 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Recent Exam Attempts & Telemetry Logs</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">Real-time Stream</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {recentAttempts.map((att) => (
                <div key={att.id} className="p-5 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-white">{att.candidate} <span className="text-[10px] text-slate-500 font-mono">({att.id})</span></p>
                    <p className="text-[11px] text-slate-400 font-medium">{att.exam}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-black text-teal-400">{att.score}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-semibold">Accuracy: {att.accuracy}</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded">
                        {att.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}