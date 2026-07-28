'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { HelpCircle, Plus, Eye, CheckCircle2, Save, Sparkles } from 'lucide-react'

export default function NtaQuestionStudio() {
  const [format, setFormat] = useState('MCQ') // 'MCQ' | 'MSQ' | 'NUMERICAL' | 'BLANKS' | 'MATCHING' | 'MATRIX'
  const [questionText, setQuestionText] = useState('A particle of mass m moves under the action of a central force F(r) = -k/r^2. Calculate its total mechanical energy.')
  const [optionA, setOptionA] = useState('-k / (2r)')
  const [optionB, setOptionB] = useState('-k / r')
  const [optionC, setOptionC] = useState('+k / (2r)')
  const [optionD, setOptionD] = useState('Zero')
  const [correctOption, setCorrectOption] = useState(0)
  const [numericalAns, setNumericalAns] = useState('14.5')
  const [solutionText, setSolutionText] = useState('Using Virial theorem for Inverse Square law forces: E = -K.E. = U / 2 = -k / (2r).')

  const [questions, setQuestions] = useState([
    {
      id: 'q-101',
      format: 'MCQ',
      text: 'A particle of mass m moves under the action of a central force F(r) = -k/r^2...',
      correct: 'Option A: -k / (2r)'
    },
    {
      id: 'q-102',
      format: 'MSQ',
      text: 'Which of the following functions are continuous everywhere on R?',
      correct: 'Options A, C, D'
    },
    {
      id: 'q-103',
      format: 'NUMERICAL',
      text: 'Calculate the pH of 0.01 M weak monoprotic acid with Ka = 10^-5.',
      correct: '3.50'
    },
    {
      id: 'q-104',
      format: 'MATRIX',
      text: 'Match the List-I physical quantities with List-II dimensional formulas in 4x5 grid.',
      correct: 'P->(1,3), Q->(2), R->(4), S->(5)'
    }
  ])

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner */}
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-md">
        <h1 className="text-2xl font-black text-white tracking-tight">NTA Multi-Format Question Studio</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Author questions across all 6 competitive exam formats with live CBT preview before publishing to the question bank.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Question Editor Form */}
        <div className="lg:col-span-7 bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 shadow-sm">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Question Authoring Panel</h3>

          <div className="space-y-4 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-slate-400 uppercase text-[10px]">Select NTA Question Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="MCQ">1. Single Choice (MCQ)</option>
                <option value="MSQ">2. Multiple Choice (MSQ - JEE Advanced Multi-Select)</option>
                <option value="NUMERICAL">3. Numerical / Integer Decimal Range</option>
                <option value="BLANKS">4. Fill in the Blanks Variant</option>
                <option value="MATCHING">5. Match the Following Columns</option>
                <option value="MATRIX">6. JEE Matrix Match Grid (4x5 Binary Grid)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 uppercase text-[10px]">Question Prompt & LaTeX Text</label>
              <textarea
                rows={3}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            {format === 'MCQ' && (
              <div className="space-y-3 pt-2">
                <label className="text-slate-400 uppercase text-[10px]">Options & Correct Answer</label>
                {[
                  { label: 'Option A', val: optionA, set: setOptionA, idx: 0 },
                  { label: 'Option B', val: optionB, set: setOptionB, idx: 1 },
                  { label: 'Option C', val: optionC, set: setOptionC, idx: 2 },
                  { label: 'Option D', val: optionD, set: setOptionD, idx: 3 }
                ].map((opt) => (
                  <div key={opt.label} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctOpt"
                      checked={correctOption === opt.idx}
                      onChange={() => setCorrectOption(opt.idx)}
                      className="w-4 h-4 accent-teal-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={opt.val}
                      onChange={(e) => opt.set(e.target.value)}
                      placeholder={opt.label}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {format === 'NUMERICAL' && (
              <div className="space-y-1 pt-2">
                <label className="text-slate-400 uppercase text-[10px]">Correct Numerical / Integer Decimal</label>
                <input
                  type="text"
                  value={numericalAns}
                  onChange={(e) => setNumericalAns(e.target.value)}
                  placeholder="e.g. 14.50"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            <div className="space-y-1 pt-2">
              <label className="text-slate-400 uppercase text-[10px]">Solution Explanation</label>
              <textarea
                rows={2}
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            <button
              onClick={() => alert('Question saved to bank!')}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Question to Bank</span>
            </button>
          </div>
        </div>

        {/* Live CBT Engine Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-xs font-black uppercase text-teal-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Live CBT Engine Rendering Preview
              </span>
              <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded uppercase font-bold">NTA Light Card</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-slate-900 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded">
                  Format: {format}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Marks: +4 / -1</span>
              </div>

              <p className="text-xs font-bold text-slate-900 leading-relaxed">
                {questionText || 'Question prompt preview will appear here.'}
              </p>

              {format === 'MCQ' && (
                <div className="space-y-2 pt-2">
                  {[optionA, optionB, optionC, optionD].map((opt, i) => (
                    <div key={i} className={`p-2.5 rounded-xl border text-xs font-medium ${correctOption === i ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      {String.fromCharCode(65 + i)}. {opt || `Option ${String.fromCharCode(65 + i)}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
