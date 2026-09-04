'use client'

import * as React from 'react'
import { ShieldAlert, AlertTriangle, X, ArrowRight, RotateCcw } from 'lucide-react'

export default function SectionAttemptLimitModal({
  isOpen,
  onClose,
  subject = 'Physics',
  sectionName = 'Section B',
  maxAttempts = 5,
  answeredQuestions = [],
  onJumpToQuestion
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs select-none animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
        
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                JEE Main Attempt Rule
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {subject} • {sectionName}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Section B Attempt Limit Reached ({maxAttempts}/{maxAttempts})
            </h3>
          </div>
        </div>

        {/* Warning Explanation */}
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 space-y-2 leading-relaxed font-medium">
          <p>
            You have already answered the maximum allowed <strong className="font-bold">{maxAttempts} questions</strong> in <strong className="font-bold">{sectionName}</strong> for <strong className="font-bold">{subject}</strong>.
          </p>
          <p className="text-amber-800">
            To submit an answer for this question, please first <strong>clear your response</strong> on one of your previously answered Section B questions below.
          </p>
        </div>

        {/* List of Answered Section B Questions for Quick Jump */}
        {answeredQuestions.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Currently Answered in {sectionName}:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {answeredQuestions.map((item) => (
                <button
                  key={item.id || item.originalIndex}
                  type="button"
                  onClick={() => {
                    if (onJumpToQuestion) onJumpToQuestion(item.originalIndex)
                    onClose()
                  }}
                  className="p-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left text-xs font-bold text-slate-800 transition flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate">
                    Question {item.originalIndex + 1}
                  </span>
                  <span className="text-[10px] text-teal-600 group-hover:underline flex items-center gap-1 shrink-0">
                    Review <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  )
}
