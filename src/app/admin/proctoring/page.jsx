'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, Ban, Send, RefreshCw, Eye, Camera, Mic, Activity, Lock } from 'lucide-react'

export default function LiveProctorMonitor() {
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'sess-101',
      studentName: 'Rahul Sharma',
      studentId: 'STU-9401',
      examTitle: 'NTA JEE Grand Mock Test - 01',
      elapsedTime: '124 Mins',
      status: 'Active Live',
      tabSwitches: 0,
      ipAddress: '192.168.1.45',
      securityStatus: 'Clean',
      webcamSnapshot: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      aiAlert: 'No Violations Detected'
    },
    {
      id: 'sess-102',
      studentName: 'Vikram Singh',
      studentId: 'STU-8219',
      examTitle: 'NEET Physics Chapterwise CBT',
      elapsedTime: '45 Mins',
      status: 'Active Live',
      tabSwitches: 3,
      ipAddress: '10.0.0.12',
      securityStatus: 'Warning',
      webcamSnapshot: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      aiAlert: 'Multiple Tab Switch Detected (3x)'
    },
    {
      id: 'sess-103',
      studentName: 'Neha Kapoor',
      studentId: 'STU-7721',
      examTitle: 'JEE Advanced Paper 1 (MSQ)',
      elapsedTime: '88 Mins',
      status: 'Active Live',
      tabSwitches: 1,
      ipAddress: '172.16.0.8',
      securityStatus: 'Clean',
      webcamSnapshot: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
      aiAlert: 'Audio Activity Within Threshold'
    }
  ])

  const handleTerminate = (id) => {
    if (confirm(`Are you sure you want to force-submit and terminate attempt ${id}?`)) {
      setActiveSessions(activeSessions.filter(s => s.id !== id))
    }
  }

  const handleWarn = (name) => {
    alert(`Warning telemetry alert dispatched to candidate ${name}!`)
  }

  return (
    <div className="space-y-8 select-none">
      {/* Banner */}
      <div className="flex justify-between items-center bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">AI Live Proctoring Telemetry Command Feed</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Real-time AI anti-cheat proctoring feed monitoring student webcam snapshots, tab switches, and proctor action controls.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold">
          <ShieldAlert className="w-4 h-4" />
          <span>{activeSessions.length} Active Proctored Sessions</span>
        </div>
      </div>

      {/* Session Feeds Grid */}
      <div className="space-y-6">
        {activeSessions.map((session) => (
          <div key={session.id} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-sm">
            
            {/* Candidate Details */}
            <div className="flex items-start gap-5">
              {/* Webcam Snapshot Box */}
              <div className="relative w-24 h-24 rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 shrink-0 shadow-inner">
                <img src={session.webcamSnapshot} alt={session.studentName} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-950/80 text-teal-400 text-[8px] font-bold rounded flex items-center gap-1">
                  <Camera className="w-2.5 h-2.5" /> LIVE
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="font-bold text-base text-white">{session.studentName}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">({session.studentId})</span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${session.securityStatus === 'Warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {session.securityStatus}
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-medium">{session.examTitle}</p>

                {/* AI Security Tag */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Activity className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>AI Telemetry: <strong className="text-white">{session.aiAlert}</strong></span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium pt-1">
                  <span>Elapsed: {session.elapsedTime}</span>
                  <span>•</span>
                  <span>IP: {session.ipAddress}</span>
                  <span>•</span>
                  <span className={session.tabSwitches > 0 ? 'text-amber-400 font-bold' : ''}>
                    Tab Switches: {session.tabSwitches}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => handleWarn(session.studentName)}
                className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Warning Alert</span>
              </button>

              <button
                onClick={() => handleTerminate(session.id)}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Force Terminate</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
