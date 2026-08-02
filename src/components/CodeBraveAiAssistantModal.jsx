'use client'

import React, { useState } from 'react'
import { Sparkles, X, Send, Bot, User, CheckCircle2, RefreshCw, Zap } from 'lucide-react'

export default function CodeBraveAiAssistantModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: '👋 Hello Aspirant! I am CodeBrave AI, your personal Physics, Chemistry, and Math doubt solver. Ask me any numerical or concept question!'
    }
  ])
  const [inputQuery, setInputQuery] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputQuery.trim()) return

    const userText = inputQuery.trim()
    setMessages(prev => [...prev, { sender: 'user', text: userText }])
    setInputQuery('')
    setLoading(true)

    setTimeout(() => {
      let aiResponse = 'Here is the step-by-step resolution:\n1. Apply Newton’s 2nd Law (F = ma).\n2. Calculate net acceleration: a = F / total_mass.\n3. Integrate over time t to find final velocity.'

      if (userText.toLowerCase().includes('chemistry') || userText.toLowerCase().includes('reaction')) {
        aiResponse = 'Organic Chemistry Resolution:\n- Tertiary carbocations undergo SN1 substitution with 3° hyperconjugative stability.\n- Reagent Map: HBr in presence of peroxide gives Anti-Markovnikov addition.'
      } else if (userText.toLowerCase().includes('math') || userText.toLowerCase().includes('integration')) {
        aiResponse = 'Calculus Resolution:\n- Apply Definite Integral King Property: ∫₀^a f(x)dx = ∫₀^a f(a-x)dx.\n- Adding both equations eliminates the denominator term cleanly.'
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }])
      setLoading(false)
    }, 800)
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] select-none font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[580px]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-teal-500 text-slate-950 flex items-center justify-center font-black">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <span>CodeBrave AI Tutor</span>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] uppercase rounded-full">PW/Unacademy Grade</span>
              </h3>
              <p className="text-[10px] text-slate-400">Instant 24/7 Competitive Doubt Resolution</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${msg.sender === 'user' ? 'bg-teal-600 text-white' : 'bg-slate-900 text-teal-400'}`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[80%] ${msg.sender === 'user' ? 'bg-teal-600 text-white font-bold rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 font-medium shadow-xs rounded-tl-none whitespace-pre-line'}`}>
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-max">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
              <span>Analyzing problem statement...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2 shrink-0">
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder="Ask any Physics, Chemistry or Math doubt..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-teal-600 font-medium"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim()}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
