'use client'

import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';

export default function RazorpayPaymentGatewayModal({
  isOpen,
  onClose,
  receiptData
}) {
  if (!isOpen || !receiptData) return null;

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto animate-fade-in font-sans select-none">
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] w-full max-w-2xl shadow-2xl transition-all">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Tax Invoice & Payment Receipt
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Purchase Order Verified
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Printable Tax Invoice Content */}
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between text-emerald-900">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-black">Payment Successfully Confirmed!</h4>
                <p className="text-[11px] font-medium opacity-90">Your course/test series access has been instantly unlocked.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-xs">
              <span>WhatsApp Sent</span>
            </span>
          </div>

          <div id="printable-invoice" className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 text-xs font-medium text-slate-800">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Asentra Edu Platform</h3>
                <p className="text-[10px] text-slate-500">GSTIN: 36ABCDE1234F1Z5 • Support: admin@Asentra.edu.in</p>
              </div>
              <div className="text-right">
                <span className="font-black text-slate-900 text-sm block">{receiptData?.invoiceNo}</span>
                <span className="text-[10px] text-slate-500">Date: {receiptData?.date}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase block">Billed To</span>
                <span className="font-bold text-slate-900 block mt-0.5">{receiptData?.studentName}</span>
                <span className="text-slate-500 block text-[11px]">{receiptData?.studentEmail}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase block">Transaction Reference</span>
                <span className="font-mono text-indigo-700 font-bold text-[11px] block mt-0.5">{receiptData?.transactionId}</span>
                <span className="text-emerald-700 font-black text-[10px] uppercase">Razorpay Paid</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase block">Line Items</span>
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 font-bold">
                <span>{receiptData?.itemTitle} ({receiptData?.itemType})</span>
                <span>₹{receiptData?.basePrice}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <div className="w-48 space-y-1 text-right">
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Subtotal:</span>
                  <span>₹{receiptData?.basePrice}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>GST (18%):</span>
                  <span>₹{receiptData?.gstAmount}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-200">
                  <span>Total Paid:</span>
                  <span>₹{receiptData?.totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Download PDF & Action Bar */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition cursor-pointer"
            >
              Done & Go to Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
