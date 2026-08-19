'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { 
  Star, ShieldCheck, Download, Truck, ArrowLeft, 
  CheckCircle2, ShoppingBag, BookOpen, Sparkles 
} from 'lucide-react'

export default function BookDetailPage({ params }) {
  const book = {
    id: 'b1',
    title: 'IIT JEE Physics Mastery: Mechanics & Waves',
    author: 'Dr. H.C. Verma & Asentra Academic Faculty',
    category: 'JEE Advanced',
    subject: 'Physics',
    price: 699,
    originalPrice: 999,
    rating: 4.9,
    reviewsCount: 340,
    stock: 45,
    format: 'Hardcopy + Digital PDF Combo',
    isbn: '978-81-940219-4-2',
    pages: 480,
    cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop&q=80',
    description: 'Comprehensive 480-page textbook and problem manual covering Newton laws of motion, work energy power, rotational dynamics, gravitation, fluid mechanics, and wave motion with 1500+ JEE Advanced level problems.',
    tableOfContents: [
      'Chapter 1: Kinematics in 2D & Projectile Motion',
      'Chapter 2: Newton Laws of Motion & Friction',
      'Chapter 3: Work, Energy, Power & Collisions',
      'Chapter 4: Rotational Dynamics & Torque',
      'Chapter 5: Gravitation & Orbital Motion'
    ]
  }

  const [added, setAdded] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        <Link href="/books" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Book Store
        </Link>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 relative h-96 bg-slate-100 rounded-2xl overflow-hidden shadow-inner">
            <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
            <span className="absolute top-4 left-4 px-3 py-1 bg-slate-900/80 text-white text-xs font-bold rounded uppercase">
              {book.category}
            </span>
          </div>

          <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{book.rating} ({book.reviewsCount} Student Reviews)</span>
              </div>

              <h1 className="text-2xl font-black text-slate-900 leading-tight">{book.title}</h1>
              <p className="text-xs text-slate-500 font-medium">By {book.author}</p>

              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-3xl font-black text-slate-900">₹{book.price}</span>
                <span className="text-sm text-slate-400 line-through">₹{book.originalPrice}</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded">Save 30%</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Format:</span>
                  <span className="font-bold text-slate-900">{book.format}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Pages:</span>
                  <span className="font-bold text-slate-900">{book.pages} Pages</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>ISBN:</span>
                  <span className="font-mono text-slate-500">{book.isbn}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Link
                href="/books/checkout"
                className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black text-center shadow-md transition"
              >
                Buy Now (Instant Order)
              </Link>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Syllabus & Table of Contents</h3>
          <ul className="space-y-2 text-xs font-medium text-slate-700">
            {book.tableOfContents.map((ch, idx) => (
              <li key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{ch}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  )
}
