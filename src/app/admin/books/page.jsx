'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Plus, Edit3, Trash2, Package, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function AdminBookInventoryPage() {
  const [books, setBooks] = useState([
    { id: 'b1', title: 'IIT JEE Physics Mastery: Mechanics & Waves', subject: 'Physics', price: 699, stock: 45, category: 'JEE Advanced' },
    { id: 'b2', title: 'Organic Chemistry 20-Year Chapterwise PYQs', subject: 'Chemistry', price: 499, stock: 80, category: 'JEE Mains' },
    { id: 'b3', title: 'NEET Medical Biology 10,000 MCQ Bank', subject: 'Biology', price: 599, stock: 30, category: 'NEET UG' }
  ])

  return (
    <div className="space-y-8 select-none">
      <div className="flex justify-between items-center bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Academic Book Inventory Manager</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Add textbook titles, update stock levels, attach sample chapter PDFs, and manage pricing.
          </p>
        </div>

        <Link
          href="/admin/books/orders"
          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md"
        >
          <Package className="w-4 h-4" />
          <span>Fulfillment Console</span>
        </Link>
      </div>

      <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-sm text-white">Active Academic Titles ({books.length})</h3>
        </div>

        <div className="divide-y divide-slate-800/60">
          {books.map((b) => (
            <div key={b.id} className="p-5 flex justify-between items-center text-xs">
              <div className="space-y-1">
                <p className="font-bold text-white">{b.title}</p>
                <p className="text-[11px] text-slate-400 font-medium">{b.subject} • {b.category}</p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right space-y-1">
                  <p className="font-black text-teal-400">₹{b.price}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">Stock: {b.stock} Units</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
