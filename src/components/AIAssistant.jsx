'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare, X, Send, Sparkles, Bot } from 'lucide-react'

export default function AIAssistant() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Study Mentor. Ask me any doubt about your current courses!' }
  ])
  const [input, setInput] = useState('')

  // Suppress rendering on active exam engine pages
  if (
    pathname && (
      pathname.startsWith('/test-series/engine') ||
      pathname.includes('/test-series/engine') ||
      pathname.includes('/exams/')
    )
  ) {
    return null
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMsgs = [...messages, { role: 'user', content: input }]
    setMessages(newMsgs)
    setInput('')

    // Simulated AI Response based on course notes
    setTimeout(() => {
      setMessages([...newMsgs, { role: 'assistant', content: "Based on the faculty's notes, that's a great question! However, this is a simulated response. In production, I will be directly linked to the PDF Vault to pull exact citations for you." }])
    }, 1000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="w-80 h-96 bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-fade-in">
          <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-bold">AI Mentor</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a doubt..."
              className="flex-1 bg-slate-100 border-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
