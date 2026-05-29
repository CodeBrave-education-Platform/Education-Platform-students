'use client'

import * as React from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 px-6 select-none font-sans relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
        
        {/* Brand details */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
              A
            </div>
            <span className="text-xl font-extrabold tracking-widest text-slate-100 uppercase">
              ASENTRA
            </span>
          </Link>
          <p className="text-xs leading-relaxed max-w-sm text-slate-400">
            India's premiere virtual learning matrix for IIT JEE Main, Advanced, and elite foundational engineering curriculums. Engineered to cultivate absolute intellectual excellence.
          </p>
        </div>

        {/* Platform links */}
        <div>
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest mb-4">LMS Ecosystem</h4>
          <ul className="space-y-2.5 text-xs font-semibold">
            <li>
              <Link href="/login" className="hover:text-slate-200 transition-colors">
                Mock Assessment Suites
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-slate-200 transition-colors">
                Live Cohorts & Schedule
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-slate-200 transition-colors">
                Performance Analytics
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-slate-200 transition-colors">
                Hybrid Batches
              </Link>
            </li>
          </ul>
        </div>

        {/* Info / Support Links */}
        <div>
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest mb-4">Support Matrix</h4>
          <ul className="space-y-2.5 text-xs font-semibold">
            <li>
              <a href="mailto:support@asentra.edu" className="hover:text-slate-200 transition-colors flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span>support@asentra.edu</span>
              </a>
            </li>
            <li>
              <span className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>+91 98765 43210</span>
              </span>
            </li>
            <li>
              <span className="flex items-center gap-2 leading-tight">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>IIT Bombay Campus Link Road, Powai, Mumbai</span>
              </span>
            </li>
          </ul>
        </div>

        {/* Security & System Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Gateway Security</h4>
          <p className="text-[10px] leading-relaxed text-slate-550">
            Secure transactional routing protected by standard SHA-256 cryptographic validations. Active RLS locks prevent local injection. Database telemetry aggregates performance matrices strictly server-side.
          </p>
          <div className="flex items-center gap-1.5 text-[9px] font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 text-teal-400 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SSL HIGH-SECURITY CLIENT</span>
          </div>
        </div>

      </div>

      {/* Copyright bottom band */}
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-semibold text-slate-550">
        <div>
          © {new Date().getFullYear()} ASENTRA Technologies. All rights reserved.
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <Link href="/login" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <Link href="/login" className="hover:text-slate-300 transition-colors">SLA Agreement</Link>
        </div>
      </div>
    </footer>
  )
}
