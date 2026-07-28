import React from 'react'
import Link from 'next/link'
import { 
  ShieldCheck, LayoutDashboard, FileText, HelpCircle, 
  Eye, BarChart3, Settings, ArrowLeft, Layers
} from 'lucide-react'

export const metadata = {
  title: 'Admin Control Center | Education Portal',
  description: 'Manage Test Series, NTA Question Bank, Live Proctored Exams & Analytics',
}

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900/80 border-b md:border-b-0 md:border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0 select-none">
        <div className="space-y-6">
          
          {/* Admin Header Branding */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-2xl shadow-lg shadow-teal-500/20 text-slate-950">
                <ShieldCheck className="w-5 h-5 font-black" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wide text-white">CodeBrave Admin</h1>
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">Portal Control</span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            <Link 
              href="/admin" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-slate-200 bg-teal-500/10 border border-teal-500/20 text-teal-400 transition"
            >
              <LayoutDashboard className="w-4 h-4 text-teal-400" />
              <span>Admin Dashboard</span>
            </Link>

            <Link 
              href="/test-series" 
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition"
            >
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Student Test Hub</span>
            </Link>
          </nav>
        </div>

        {/* Footer Shortcut */}
        <div className="pt-4 border-t border-slate-800/80">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to App</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        {children}
      </main>

    </div>
  )
}