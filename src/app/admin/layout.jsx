'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Award, HelpCircle, ShieldAlert, BarChart2, 
  Settings, ArrowLeft, LogOut, Bell, Sparkles, CheckCircle2 
} from 'lucide-react'

export default function AdminLayout({ children }) {
  const pathname = usePathname()

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Test Series Studio', href: '/admin/test-series', icon: Award },
    { label: 'NTA Question Bank', href: '/admin/questions', icon: HelpCircle },
    { label: 'Live Proctor Monitor', href: '/admin/proctoring', icon: ShieldAlert },
    { label: 'Student Performance', href: '/admin#analytics', icon: BarChart2 }
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex select-none">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="space-y-8">
          {/* Logo & Brand Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black text-base shadow-md">
                CB
              </div>
              <span className="text-sm font-black tracking-wider uppercase text-white">CodeBrave</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-md text-[10px] font-extrabold uppercase">
              <Sparkles className="w-3 h-3" />
              <span>Admin Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive 
                      ? 'bg-teal-500 text-slate-950 font-black shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Quick Links & Back to Student View */}
        <div className="space-y-4 pt-6 border-t border-slate-800/80">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Student View</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-slate-950/80 border-b border-slate-800 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-slate-300">System Telemetry: Operational</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">Administrator Session</span>
            <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {children}
        </main>
      </div>
    </div>
  )
}