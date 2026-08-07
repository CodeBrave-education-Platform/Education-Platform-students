'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Truck, Download, CheckCircle2, Clock, BookOpen, ArrowLeft, ExternalLink, Copy, Sparkles, Package } from 'lucide-react'

export default function MyBookOrdersPage() {
  const defaultOrders = [
    {
      id: 'ORD-2026-9041',
      source: 'Course Enrollment',
      date: '28 July 2026',
      totalAmount: 0,
      status: 'Dispatched',
      courier: 'Bluedart Express',
      trackingNumber: 'TRK-BD-908124901',
      trackingLink: 'https://track.bluedart.com/TRK-BD-908124901',
      items: [
        { title: 'Mechanics & Wave Motion 2-Vol Hardcopy Kit', format: 'Hardcopy + Digital PDF', downloadUrl: '/downloads/physics-formulas.pdf' }
      ]
    },
    {
      id: 'ORD-2026-8812',
      source: 'Batch Bundle',
      date: '27 July 2026',
      totalAmount: 0,
      status: 'Dispatched',
      courier: 'DTDC Courier',
      trackingNumber: 'TRK-DT-441209581',
      trackingLink: 'https://www.dtdc.in/tracking/TRK-DT-441209581',
      items: [
        { title: 'Full 6-Volume JEE Advanced Hardcopy Textbook Set', format: 'Included Batch Box', downloadUrl: '/downloads/calculus-worksheets.pdf' }
      ]
    }
  ]

  const [orders, setOrders] = useState(defaultOrders)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('codebrave_book_orders')
      if (stored) {
        const parsed = JSON.parse(stored)
        setOrders([...parsed, ...defaultOrders])
      }
    } catch (e) {
      console.error('Error loading stored book orders', e)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link href="/books" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-1">
              <ArrowLeft className="w-4 h-4" /> Back to Store
            </Link>
            <h1 className="text-2xl font-black text-slate-900">Book Distribution & Tracking Portal</h1>
          </div>

          <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-200 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-teal-600" />
            <span>Course & Batch Kits Included</span>
          </span>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{order.id}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded text-[10px]">
                      {order.source || 'Distribution Order'}
                    </span>
                  </div>
                  <span className="text-slate-400 block font-medium">Order Date: {order.date}</span>
                </div>

                <div className="text-right space-y-1">
                  <span className="px-3 py-1 bg-teal-50 text-teal-700 font-bold rounded-lg uppercase text-[10px]">
                    {order.status}
                  </span>
                  <span className="text-slate-900 font-black block">
                    {order.totalAmount > 0 ? `₹${order.totalAmount}` : 'Included Free'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs gap-3">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">{item.title}</p>
                      <span className="text-[10px] text-slate-500 font-medium">{item.format}</span>
                    </div>

                    {item.downloadUrl && (
                      <a
                        href={item.downloadUrl}
                        download
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Instant eBook PDF</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Shipping Destination Address Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Truck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Physical Hardcopy Delivery Destination:</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium pl-5">
                  {order.shippingAddress 
                    ? `${order.shippingAddress.name} (${order.shippingAddress.phone}) • ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
                    : 'CodeBrave Student Campus Registry • Flat 402, Block A, Jubilee Hills, Hyderabad, TS - 500033 (Ph: +91 9876543210)'
                  }
                </p>
              </div>

              {/* Live Tracking Information */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Courier Partner: {order.courier}</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800">Estimated Delivery: 2-3 Business Days</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200/60 font-mono text-[11px]">
                  <div>
                    <span className="text-amber-700">Tracking ID: </span>
                    <span className="font-bold text-amber-950">{order.trackingNumber}</span>
                  </div>

                  <a
                    href={order.trackingLink || `https://track.bluedart.com/${order.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold font-sans text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <span>Track Shipment Live</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
