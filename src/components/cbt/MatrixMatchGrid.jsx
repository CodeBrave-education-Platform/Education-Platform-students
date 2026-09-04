'use client'

import * as React from 'react'
import KatexRenderer from '@/components/KatexRenderer'
import { Check, X, RotateCcw } from 'lucide-react'

/**
 * Interactive Clickable Matrix Grid for JEE Advanced Matrix Match Questions
 * Rows: A, B, C, D (List I)
 * Cols: P, Q, R, S, T (List II)
 * Value format: { 'A': ['P', 'R'], 'B': ['Q'], ... }
 */
export default function MatrixMatchGrid({
  matrixRows = ['(A) A', '(B) B', '(C) C', '(D) D'],
  matrixCols = ['(P) P', '(Q) Q', '(R) R', '(S) S'],
  value = {},
  onChange,
  disabled = false
}) {
  const rowKeys = ['A', 'B', 'C', 'D']
  const colKeys = ['P', 'Q', 'R', 'S', 'T'].slice(0, Math.max(4, matrixCols.length))

  // Toggle cell bubble
  const handleToggleCell = (rKey, cKey) => {
    if (disabled) return
    const curRowSelections = Array.isArray(value[rKey]) ? [...value[rKey]] : []
    let nextRowSelections = []

    if (curRowSelections.includes(cKey)) {
      nextRowSelections = curRowSelections.filter(k => k !== cKey)
    } else {
      nextRowSelections = [...curRowSelections, cKey].sort()
    }

    const nextValue = { ...value }
    if (nextRowSelections.length === 0) {
      delete nextValue[rKey]
    } else {
      nextValue[rKey] = nextRowSelections
    }

    if (onChange) onChange(nextValue)
  }

  // Clear single row
  const handleClearRow = (rKey) => {
    if (disabled) return
    const nextValue = { ...value }
    delete nextValue[rKey]
    if (onChange) onChange(nextValue)
  }

  // Clear all
  const handleClearAll = () => {
    if (disabled) return
    if (onChange) onChange({})
  }

  const hasAnySelections = Object.keys(value).some(k => Array.isArray(value[k]) && value[k].length > 0)

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6 max-w-2xl w-full shadow-xs">
      
      {/* 1. Header Banner & Instructions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
            <span>Matrix Match Selection Grid</span>
            <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-bold uppercase">
              Click Bubbles to Pair
            </span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Match Column I (A, B, C, D) with Column II (P, Q, R, S). Multiple matches per row are allowed.
          </p>
        </div>

        {hasAnySelections && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* 2. Side-by-side List I and List II view if detailed content provided */}
      {matrixRows.length > 0 && matrixCols.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-800">
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-teal-700 block tracking-wider">
              List I (Rows)
            </span>
            {matrixRows.map((rText, idx) => (
              <div key={idx} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 leading-relaxed">
                <KatexRenderer content={typeof rText === 'string' ? rText : JSON.stringify(rText)} />
              </div>
            ))}
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-indigo-700 block tracking-wider">
              List II (Columns)
            </span>
            {matrixCols.map((cText, idx) => (
              <div key={idx} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 leading-relaxed">
                <KatexRenderer content={typeof cText === 'string' ? cText : JSON.stringify(cText)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. The Clickable Bubble Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse min-w-[320px]">
          <thead>
            <tr>
              <th className="p-2 text-xs font-black text-slate-500 uppercase tracking-wider text-left w-16">
                Row
              </th>
              {colKeys.map(cKey => (
                <th key={cKey} className="p-2 text-xs font-black text-slate-700">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-xs">
                    {cKey}
                  </span>
                </th>
              ))}
              <th className="p-2 text-xs font-black text-slate-500 uppercase tracking-wider w-20">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {rowKeys.map(rKey => {
              const selectedCols = Array.isArray(value[rKey]) ? value[rKey] : []

              return (
                <tr key={rKey} className="hover:bg-teal-50/20 transition-colors">
                  <td className="p-2 text-left">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 text-white text-xs font-black shadow-xs">
                      {rKey}
                    </span>
                  </td>
                  {colKeys.map(cKey => {
                    const isSelected = selectedCols.includes(cKey)

                    return (
                      <td key={cKey} className="p-2">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleToggleCell(rKey, cKey)}
                          aria-label={`Match ${rKey} with ${cKey}`}
                          className={`w-10 h-10 rounded-full border-2 font-black text-xs transition-all duration-150 inline-flex items-center justify-center select-none active:scale-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                            isSelected
                              ? 'bg-teal-600 border-teal-600 text-white shadow-md ring-2 ring-teal-600/30'
                              : 'bg-white border-slate-300 text-slate-700 hover:border-teal-500 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : cKey}
                        </button>
                      </td>
                    )
                  })}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      disabled={disabled || selectedCols.length === 0}
                      onClick={() => handleClearRow(rKey)}
                      className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title={`Clear row ${rKey}`}
                    >
                      Clear
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Active Selections Readout */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-500">Your Current Match:</span>
        <div className="flex flex-wrap items-center gap-2">
          {rowKeys.map(rKey => {
            const matches = value[rKey]
            if (!matches || matches.length === 0) return null
            return (
              <span key={rKey} className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg font-mono font-bold text-xs">
                {rKey} → [{matches.join(', ')}]
              </span>
            )
          })}
          {!hasAnySelections && (
            <span className="text-slate-400 italic text-[11px]">No rows matched yet</span>
          )}
        </div>
      </div>
    </div>
  )
}
