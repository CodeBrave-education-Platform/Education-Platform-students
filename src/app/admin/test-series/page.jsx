'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Award, Plus, CheckCircle2, Clock, ShieldCheck, Save, Trash2, Edit3, ArrowLeft } from 'lucide-react'

export default function TestSeriesPackageStudio() {
  const [packages, setPackages] = useState([
    {
      id: 'pkg-1',
      title: 'NTA JEE Mains Grand Mock Series 2026',
      category: 'JEE Mains',
      priceType: 'Premium',
      price: 4999,
      examsCount: 15,
      duration: 180,
      totalMarks: 300,
      markingPositive: 4,
      markingNegative: 1
    },
    {
      id: 'pkg-2',
      title: 'NEET Medical All India Test Series',
      category: 'NEET UG',
      priceType: 'Premium',
      price: 3999,
      examsCount: 20,
      duration: 200,
      totalMarks: 720,
      markingPositive: 4,
      markingNegative: 1
    },
    {
      id: 'pkg-3',
      title: 'JEE Physics Chapterwise CBT Practice Sets',
      category: 'JEE Mains',
      priceType: 'Free',
      price: 0,
      examsCount: 10,
      duration: 60,
      totalMarks: 100,
      markingPositive: 4,
      markingNegative: 1
    }
  ])

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('JEE Mains')
  const [priceType, setPriceType] = useState('Premium')
  const [price, setPrice] = useState(2999)
  const [examsCount, setExamsCount] = useState(10)
  const [duration, setDuration] = useState(180)
  const [totalMarks, setTotalMarks] = useState(300)
  const [markingPositive, setMarkingPositive] = useState(4)
  const [markingNegative, setMarkingNegative] = useState(1)
  const [showModal, setShowModal] = useState(false)

  const handleCreatePackage = (e) => {
    e.preventDefault()
    if (!title) return

    const newPkg = {
      id: `pkg-${Date.now()}`,
      title,
      category,
      priceType,
      price: priceType === 'Free' ? 0 : Number(price),
      examsCount: Number(examsCount),
      duration: Number(duration),
      totalMarks: Number(totalMarks),
      markingPositive: Number(markingPositive),
      markingNegative: Number(markingNegative)
    }

    setPackages([newPkg, ...packages])
    setTitle('')
    setShowModal(false)
  }

  return (
    <div className="space-y-8 select-none">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-md">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Test Series Package Studio</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Create, edit, and configure NTA exam blueprints, duration timers, and marking schemes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Test Package</span>
        </button>
      </div>

      {/* Package List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold rounded uppercase">
                  {pkg.category}
                </span>
                <span className="text-xs font-black text-white">
                  {pkg.priceType === 'Free' ? 'Free' : `₹${pkg.price.toLocaleString('en-IN')}`}
                </span>
              </div>

              <h3 className="font-bold text-sm text-white leading-snug">{pkg.title}</h3>

              <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs text-slate-400 font-medium">
                <div className="flex justify-between">
                  <span>Total Exams:</span>
                  <span className="text-slate-200 font-bold">{pkg.examsCount} Tests</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="text-slate-200 font-bold">{pkg.duration} Mins</span>
                </div>
                <div className="flex justify-between">
                  <span>Marking Rules:</span>
                  <span className="text-emerald-400 font-bold">+{pkg.markingPositive} / -{pkg.markingNegative}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex gap-2">
              <button className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition">
                Configure Blueprint
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Package Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
            <h3 className="text-lg font-black text-white">Create Test Series Package</h3>

            <form onSubmit={handleCreatePackage} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-400 uppercase text-[10px]">Package Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="JEE Mains 2026 All India Grand Mocks"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px]">Exam Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="JEE Mains">JEE Mains</option>
                    <option value="JEE Advanced">JEE Advanced</option>
                    <option value="NEET UG">NEET UG</option>
                    <option value="GATE">GATE</option>
                    <option value="NTA General">NTA General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px]">Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px]">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 uppercase text-[10px]">Total Marks</label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-black shadow-md"
                >
                  Publish Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
