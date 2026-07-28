'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Truck, CheckCircle2, Package, Search, Send } from 'lucide-react'

export default function AdminOrderFulfillmentPage() {
  const [orders, setOrders] = useState([
    {
      id: 'ORD-2026-9041',
      student: 'Rahul Sharma',
      mobile: '9876543210',
      address: 'House No 42, Block B, Green Park, Kota',
      status: 'Dispatched',
      courier: 'Bluedart Express',
      tracking: 'BD-908124901'
    },
    {
      id: 'ORD-2026-9042',
      student: 'Priya Verma',
      mobile: '9123456789',
      address: 'Plot 105, Civil Lines, Jaipur',
      status: 'Processing',
      courier: 'DTDC',
      tracking: 'Pending'
    }
  ])

  const handleUpdateStatus = (id, status) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
  }

  return (
    <div className="space-y-8 select-none">
      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-md">
        <h1 className="text-2xl font-black text-white tracking-tight">Order Fulfillment & Shipping Console</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">
          Inspect pending student book orders, generate courier tracking numbers, and update dispatch milestones.
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-white">{o.id}</span>
                <span className="text-xs text-teal-400 font-bold">• {o.student} ({o.mobile})</span>
                <span className="px-2.5 py-0.5 bg-teal-500/10 text-teal-400 text-[10px] font-bold rounded uppercase">
                  {o.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{o.address}</p>
            </div>

            <div className="flex items-center gap-3">
              {o.status === 'Processing' && (
                <button
                  onClick={() => handleUpdateStatus(o.id, 'Dispatched')}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Truck className="w-4 h-4" />
                  <span>Dispatch & Attach Tracking</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
