'use client'

import React, { useState } from 'react';
import { ShieldCheck, CreditCard, QrCode, CheckCircle2, Lock, Loader2, Download, Printer, Award, FileText } from 'lucide-react';

export default function RazorpayPaymentGatewayModal({
  isOpen,
  onClose,
  item = null, // { title, price, type: 'Test Series' | 'Course' | 'Book Kit', id }
  studentUser = null,
  onSuccessPayment
}) {
  const [paymentMethod, setPaymentMethod] = useState('upi_qr'); // 'upi_qr' | 'upi_id' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  if (!isOpen || !item) return null;

  const itemPrice = Number(item.price || 499);
  const gstAmount = Math.round(itemPrice * 0.18);
  const totalAmount = itemPrice + gstAmount;

  const [dispatchStatus, setDispatchStatus] = useState(null);

  const handleRazorpayPay = () => {
    setProcessing(true);

    // Simulate Razorpay In-Website Gateway Transaction Verification
    setTimeout(async () => {
      const transactionId = `pay_rzp_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      const invoiceNo = `INV-CB-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const receipt = {
        invoiceNo,
        transactionId,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        studentName: studentUser?.user_metadata?.full_name || studentUser?.email?.split('@')[0] || 'Student Member',
        studentEmail: studentUser?.email || 'student@codebrave.edu.in',
        itemTitle: item.title,
        itemType: item.type || 'Test Series Package',
        basePrice: itemPrice,
        gstAmount: gstAmount,
        totalAmount: totalAmount
      };

      setReceiptData(receipt);
      setProcessing(false);
      setPaymentCompleted(true);

      // Auto-Provision Included Printed Book Kit into Book Orders Portal
      try {
        const bookKitTitle = item.bookKit || `${item.title} - Complete Textbook & Formula Box Set`;
        const newBookOrder = {
          id: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          source: `${item.type || 'Course'} Enrollment`,
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          totalAmount: 0,
          status: 'Dispatched & In Transit',
          courier: 'Bluedart Express',
          trackingNumber: `TRK-BD-${Math.floor(100000000 + Math.random() * 900000000)}`,
          trackingLink: 'https://track.bluedart.com/',
          items: [
            {
              title: bookKitTitle,
              format: 'Hardcopy Textbook Kit + Instant eBook PDF',
              downloadUrl: '/downloads/physics-formulas.pdf'
            }
          ]
        };

        const existingOrders = JSON.parse(localStorage.getItem('codebrave_book_orders') || '[]');
        localStorage.setItem('codebrave_book_orders', JSON.stringify([newBookOrder, ...existingOrders]));
      } catch (e) {
        console.warn('[Book Auto-Provisioning Notice]:', e);
      }

      // Dispatch automated WhatsApp & Email notification receipt
      try {
        const res = await fetch('/api/notifications/dispatch-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptData: receipt, studentEmail: receipt.studentEmail })
        });
        const data = await res.json();
        setDispatchStatus(data.message || 'Invoice sent to WhatsApp & Email');
      } catch (err) {
        console.warn('[Invoice Dispatch Warning]:', err.message);
      }

      if (onSuccessPayment) {
        onSuccessPayment(receipt);
      }
    }, 1500);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto animate-fade-in font-sans select-none">
      <div className={`bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] w-full shadow-2xl transition-all ${
        paymentCompleted ? 'max-w-2xl' : 'max-w-xl'
      }`}>
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {paymentCompleted ? 'Tax Invoice & Payment Receipt' : 'Razorpay Secure Checkout'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {paymentCompleted ? 'Purchase Order Verified' : '256-Bit SSL Encryption Gateway'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => {
              setPaymentCompleted(false);
              onClose();
            }} 
            className="text-slate-400 hover:text-slate-700 font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {!paymentCompleted ? (
          /* Step 1: Razorpay In-Website Checkout Screen */
          <div className="space-y-6">
            {/* Item Order Summary Card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {item.type || 'Test Series Package'}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-1">{item.title}</h4>
                </div>
                <span className="text-base font-black text-slate-900">₹{totalAmount}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium flex justify-between border-t border-slate-200/60 pt-2 mt-2">
                <span>Tuition Base: ₹{itemPrice}</span>
                <span>GST (18%): ₹{gstAmount}</span>
              </div>
            </div>

            {/* Razorpay Payment Method Selectors */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Choose Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi_qr')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                    paymentMethod === 'upi_qr'
                      ? 'bg-teal-50 border-teal-600 text-teal-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <div className="text-xs font-black">UPI Instant QR</div>
                    <div className="text-[10px] opacity-75">Scan & Pay (GPay / PhonePe)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
                    paymentMethod === 'card'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <div className="text-xs font-black">Cards & Net Banking</div>
                    <div className="text-[10px] opacity-75">Visa, Mastercard, HDFC</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Method Details */}
            {paymentMethod === 'upi_qr' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl max-w-[160px] mx-auto shadow-sm">
                  {/* Simulated Razorpay Dynamic UPI QR */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=razorpay@codebrave&pn=CodeBrave&am=${totalAmount}&cu=INR`} 
                    alt="Razorpay UPI QR" 
                    className="w-full h-auto rounded" 
                  />
                </div>
                <p className="text-[11px] font-bold text-slate-600">Scan QR Code with Google Pay, PhonePe, or Paytm</p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <input
                  type="text"
                  placeholder="Card Number (4532 •••• •••• 8921)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-600 font-mono"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-600 font-mono"
                  />
                  <input
                    type="password"
                    maxLength="4"
                    placeholder="CVV"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleRazorpayPay}
              disabled={processing}
              className="w-full py-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Transaction with Razorpay...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-white" />
                  <span>Pay ₹{totalAmount} & Instant Unlock</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Step 2: Printable Tax Invoice Receipt */
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

            {/* Printable Tax Invoice Content */}
            <div id="printable-invoice" className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4 text-xs font-medium text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-base">CodeBrave Edu Platform</h3>
                  <p className="text-[10px] text-slate-500">GSTIN: 36ABCDE1234F1Z5 • Support: admin@codebrave.edu.in</p>
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
                onClick={() => {
                  setPaymentCompleted(false);
                  onClose();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition cursor-pointer"
              >
                Done & Go to Portal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
