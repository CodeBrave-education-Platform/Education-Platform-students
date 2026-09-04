'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react'

export default function DiagramLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Question Diagram'
}) {
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1)
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) return null

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))
  const handleResetZoom = () => setZoomLevel(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
              {title}
            </h3>
            <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-bold">
              Click-to-Zoom Lightbox
            </span>
          </div>

          {/* Zoom Controls & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.75}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 disabled:opacity-40 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono font-bold text-slate-700 min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 disabled:opacity-40 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 border-l border-slate-100 cursor-pointer ml-0.5"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition cursor-pointer"
              title="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zoomable Image Container */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-900/5 min-h-[300px]">
          <div 
            className="transition-transform duration-200 ease-out origin-center inline-block max-w-full"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg border border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium shrink-0">
          Use zoom buttons to inspect circuits, organic mechanisms, or coordinate geometry in detail. Press Esc or click Close to return.
        </div>
      </div>
    </div>
  )
}
