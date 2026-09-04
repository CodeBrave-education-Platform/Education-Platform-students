'use client'

import * as React from 'react'
import { Delete, RotateCcw, PlusCircle, MinusCircle } from 'lucide-react'

/**
 * NTA-Standard Virtual On-Screen Number Pad
 * Provides mouse and touch input for Integer and Numerical questions.
 */
export default function VirtualNumpad({
  value = '',
  onChange,
  onClear,
  disabled = false
}) {
  const handleKeyClick = (key) => {
    if (disabled) return

    const cur = String(value ?? '')

    if (key === 'CLEAR') {
      if (onClear) onClear()
      else if (onChange) onChange('')
      return
    }

    if (key === 'BACKSPACE') {
      if (onChange) onChange(cur.slice(0, -1))
      return
    }

    if (key === '+/-') {
      if (!cur) return
      if (cur.startsWith('-')) {
        if (onChange) onChange(cur.slice(1))
      } else {
        if (onChange) onChange('-' + cur)
      }
      return
    }

    if (key === '.') {
      if (!cur.includes('.')) {
        if (onChange) onChange(cur + '.')
      }
      return
    }

    // Number key
    if (onChange) onChange(cur + key)
  }

  const keys = [
    { label: '7', val: '7' },
    { label: '8', val: '8' },
    { label: '9', val: '9' },
    { label: '⌫', val: 'BACKSPACE', icon: true, style: 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200' },
    { label: '4', val: '4' },
    { label: '5', val: '5' },
    { label: '6', val: '6' },
    { label: '±', val: '+/-', style: 'bg-slate-200 hover:bg-slate-300 text-slate-800' },
    { label: '1', val: '1' },
    { label: '2', val: '2' },
    { label: '3', val: '3' },
    { label: '.', val: '.', style: 'bg-slate-200 hover:bg-slate-300 text-slate-800' },
    { label: '0', val: '0', span: 'col-span-2' },
    { label: 'Clear', val: 'CLEAR', span: 'col-span-2', style: 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-200' }
  ]

  return (
    <div className="bg-slate-100/80 border border-slate-200 p-4 rounded-2xl max-w-sm w-full space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          NTA Virtual Numpad
        </span>
        <button
          type="button"
          onClick={() => handleKeyClick('CLEAR')}
          disabled={disabled || !value}
          className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer disabled:opacity-40"
        >
          Clear Input
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {keys.map((k, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => handleKeyClick(k.val)}
            className={`min-h-[48px] rounded-xl font-black text-sm transition-all select-none active:scale-95 cursor-pointer shadow-xs flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
              k.span || 'col-span-1'
            } ${
              k.style || 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 text-center font-medium">
        Use on-screen keypad or physical keyboard to input answer
      </p>
    </div>
  )
}
