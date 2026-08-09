'use client'

import * as React from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 px-6 select-none font-sans relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
        
        {/* Brand details */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center group">
            <svg className="w-36 h-7 text-slate-100" viewBox="0 0 250 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Geometric letter 'A' */}
              <path d="M12 44 L28 10 L44 44" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 32 L36 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
              
              {/* Geometric letter 'S' */}
              <path d="M76 16 C76 12, 56 12, 56 18 C56 24, 76 26, 76 32 C76 38, 56 38, 56 34" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Geometric letter 'E' */}
              <path d="M110 12 L92 12 L92 42 L110 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M92 27 L106 27" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
              
              {/* Geometric letter 'N' */}
              <path d="M122 42 L122 12 L142 42 L142 12" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Geometric letter 'T' */}
              <path d="M152 12 L178 12" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M165 12 L165 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
              
              {/* Geometric letter 'R' */}
              <path d="M188 42 L188 12 L206 12 C214 12, 214 26, 206 26 L188 26" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M198 26 L210 42" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Geometric letter 'A' with RED accented leg */}
              <path d="M220 44 L236 10" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Red accent leg matching logo image */}
              <path d="M236 10 L252 44" stroke="#DC2626" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M228 32 L244 32" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
            </svg>
          </Link>
          <p className="text-xs leading-relaxed max-w-sm text-slate-400">
            India&apos;s premiere virtual learning matrix for IIT JEE Main, Advanced, and elite foundational engineering curriculums. Engineered to cultivate absolute intellectual excellence.
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
              <a href="mailto:support@asentra.edu.in" className="hover:text-slate-200 transition-colors flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span>support@asentra.edu.in</span>
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

      </div>

      {/* Copyright bottom band */}
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-semibold text-slate-550">
        <div>
          © {new Date().getFullYear()} ASENTRA Technologies. All rights reserved.
        </div>
        <div className="flex flex-wrap gap-4 justify-center sm:justify-end">
          <Link href="/policies/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <Link href="/policies/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <Link href="/policies/refund" className="hover:text-slate-300 transition-colors">Refund & Cancellation</Link>
          <Link href="/policies/contact" className="hover:text-slate-300 transition-colors">Contact Us</Link>
        </div>
      </div>
    </footer>
  )
}
