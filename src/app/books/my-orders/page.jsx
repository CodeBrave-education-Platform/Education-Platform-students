'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Truck, Download, CheckCircle2, Clock, BookOpen, ArrowLeft } from 'lucide-react'

export default function MyBookOrdersPage() {
  const [orders] = useState([
    {
      id: 'ORD-2026-9041',
      date: '28 July 2026',
      totalAmount: 699,
      status: 'Dispatched',
      courier: 'Bluedart Express',
      trackingNumber: 'BD-908124901',
      items: [
        { title: 'IIT JEE Physics Mastery: Mechanics & Waves', format: 'Hardcopy + Digital PDF', downloadUrl: '/downloads/physics-formulas.pdf' }
      ]
    },
    {
      id: 'ORD-2026-8812',
      date: '14 June 2026',
      totalAmount: 399,
      status: 'Delivered',
      courier: 'DTDC Courier',
      trackingNumber: 'DT-441209581',
      items: [
        { title: 'Vector Calculus & 3D Geometry Handbook', format: 'Instant Digital PDF', downloadUrl: '/downloads/calculus-worksheets.pdf' }
      ]
    }
  ])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        <div className="flex justify-between items-center">
          <Link href="/books" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
          <h1 className="text-2xl font-black text-slate-900">My Book Orders & eBook Downloads</h1>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 text-xs">
                <div className="space-y-1">
                  <span className="font-black text-slate-900">{order.id}</span>
                  <span className="text-slate-400 block font-medium">Ordered on {order.date}</span>
                </div>

                <div className="text-right space-y-1">
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 font-bold rounded-lg uppercase text-[10px]">
                    {order.status}
                  </span>
                  <span className="text-slate-900 font-black block">₹{order.totalAmount}</span>
                </div>
              </div>

              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <span className="text-[10px] text-slate-500 font-medium">{item.format}</span>
                    </div>

                    {item.downloadUrl && (
                      <a
                        href={item.downloadUrl}
                        download
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download eBook PDF</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {order.status === 'Dispatched' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex justify-between items-center font-medium">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Courier: {order.courier} ({order.trackingNumber})</span>
                  </div>
                  <span className="font-bold">Estimated Delivery: 2 Days</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
