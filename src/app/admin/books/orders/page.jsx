'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Truck, CheckCircle2, Package, Search, ExternalLink, Edit3, Save, Plus, ArrowLeft, Users } from 'lucide-react'

export default function AdminOrderFulfillmentPage() {
  const [orders, setOrders] = useState([
    {
      id: 'ORD-2026-9041',
      student: 'Rahul Sharma',
      mobile: '9876543210',
      address: 'House No 42, Block B, Green Park, Kota',
      source: 'Course Enrollment (JEE Physics)',
      status: 'Dispatched',
      courier: 'Bluedart Express',
      trackingNumber: 'TRK-BD-908124901',
      trackingLink: 'https://track.bluedart.com/TRK-BD-908124901'
    },
    {
      id: 'ORD-2026-9042',
      student: 'Priya Verma',
      mobile: '9123456789',
      address: 'Plot 105, Civil Lines, Jaipur',
      source: 'Batch Bundle (NEET Dropper)',
      status: 'Processing',
      courier: 'DTDC Courier',
      trackingNumber: 'TRK-DT-441209581',
      trackingLink: 'https://www.dtdc.in/tracking/TRK-DT-441209581'
    }
  ])

  const [editingId, setEditingId] = useState(null)
  const [editTrackingId, setEditTrackingId] = useState('')
  const [editTrackingLink, setEditTrackingLink] = useState('')
  const [editCourier, setEditCourier] = useState('')

  const handleStartEdit = (o) => {
    setEditingId(o.id)
    setEditTrackingId(o.trackingNumber)
    setEditTrackingLink(o.trackingLink)
    setEditCourier(o.courier)
  }

  const handleSaveEdit = (id) => {
    setOrders(orders.map(o => o.id === id ? {
      ...o,
      trackingNumber: editTrackingId,
      trackingLink: editTrackingLink,
      courier: editCourier,
      status: 'Dispatched'
    } : o))
    setEditingId(null)
  }

  const handleStatusChange = (id, status) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
  }

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Book Distribution & Tracking Controls</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            System controls for Course & Batch book shipments: Assign tracking IDs, generate live tracking links, and update delivery statuses.
          </p>
        </div>

        <Link
          href="/admin/books"
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inventory</span>
        </Link>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-white">{o.id}</span>
                  <span className="text-xs text-teal-400 font-bold">• {o.student} ({o.mobile})</span>
                  <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold rounded">
                    {o.source}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">{o.address}</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={o.status}
                  onChange={(e) => handleStatusChange(o.id, e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-teal-500"
                >
                  <option value="Processing">Processing</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>

                <button
                  onClick={() => handleStartEdit(o)}
                  className="px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Tracking</span>
                </button>
              </div>
            </div>

            {/* Tracking Details View / Edit */}
            {editingId === o.id ? (
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3 text-xs font-bold">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 text-[10px] uppercase block mb-1">Courier Partner</label>
                    <input
                      type="text"
                      value={editCourier}
                      onChange={(e) => setEditCourier(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] uppercase block mb-1">Tracking ID</label>
                    <input
                      type="text"
                      value={editTrackingId}
                      onChange={(e) => setEditTrackingId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] uppercase block mb-1">Live Tracking URL</label>
                    <input
                      type="text"
                      value={editTrackingLink}
                      onChange={(e) => setEditTrackingLink(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(o.id)}
                    className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Tracking Details</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono">
                <div className="flex items-center gap-3 text-slate-300">
                  <Truck className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Courier: <strong className="text-white font-sans">{o.courier}</strong></span>
                  <span>•</span>
                  <span>Tracking ID: <strong className="text-teal-400">{o.trackingNumber}</strong></span>
                </div>

                <a
                  href={o.trackingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 font-sans text-[11px] font-bold flex items-center gap-1"
                >
                  <span>Verify Live Tracking URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
