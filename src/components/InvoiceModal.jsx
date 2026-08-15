'use client'

import React, { useRef } from 'react'
import { X, Printer, Download, CheckCircle2, ShieldCheck, FileText, QrCode, Building2, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useState } from 'react'

export default function InvoiceModal({ invoice, user, profile, onClose }) {
  const printRef = useRef(null)
  const [isDownloading, setIsDownloading] = useState(false)

  if (!invoice) return null

  const studentName = invoice.studentName || profile?.full_name || user?.user_metadata?.full_name || 'Registered Student'
  const studentEmail = invoice.studentEmail || user?.email || 'N/A'
  const studentPhone = invoice.studentPhone || profile?.phone || user?.phone || user?.user_metadata?.phone_number || 'N/A'

  // Determine Category & HSN Code based on transaction item
  let itemCategory = 'Online Educational Course'
  let hsnCode = '999293' // Education Services
  if (invoice.bookId || invoice.courseTitle?.toLowerCase().includes('book') || invoice.courseTitle?.toLowerCase().includes('study material')) {
    itemCategory = 'Physical Study Material / Printed Book'
    hsnCode = '490110' // Printed Books
  } else if (invoice.packageId || invoice.courseTitle?.toLowerCase().includes('test series') || invoice.courseTitle?.toLowerCase().includes('mock')) {
    itemCategory = 'CBT Test Series Examination Bundle'
    hsnCode = '999294' // Online Assessment Services
  } else if (invoice.courseTitle?.toLowerCase().includes('batch') || invoice.courseTitle?.toLowerCase().includes('cohort')) {
    itemCategory = 'Live Classroom Cohort Batch'
    hsnCode = '999293'
  }

  const rawAmount = typeof invoice.amount === 'number' 
    ? invoice.amount 
    : parseFloat(String(invoice.amount).replace(/[^0-9.]/g, '')) || 0

  const isFree = rawAmount === 0 || invoice.amount === 'Free'
  const basePrice = isFree ? 0 : Math.round((rawAmount / 1.18) * 100) / 100
  const gstAmount = isFree ? 0 : Math.round((rawAmount - basePrice) * 100) / 100

  const handleDownloadPDF = async () => {
    const printContent = printRef.current
    if (!printContent) return

    try {
      setIsDownloading(true)
      // Hide any web-specific UI during capture if needed
      
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Asentra_Invoice_INV-${invoice.id || '1001'}.pdf`)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Fallback print function
  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank', 'width=850,height=950')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice_</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #ffffff; }
            .invoice-box { max-width: 800px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 2px solid #000; padding-bottom: 16px; }
            .header-table td { vertical-align: top; }
            .logo-title { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
            .subtitle { font-size: 11px; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: 1.5px; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; background: #f8fafc; border-radius: 12px; overflow: hidden; }
            .meta-table th, .meta-table td { padding: 12px 16px; text-align: left; font-size: 12px; }
            .meta-table th { background: #f1f5f9; color: #475569; text-transform: uppercase; font-size: 10px; font-weight: 800; border-bottom: 1px solid #e2e8f0; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .items-table th, .items-table td { padding: 12px 16px; text-align: left; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
            .items-table th { background: #f8fafc; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 10px; }
            .total-row { font-size: 14px; font-weight: 900; color: #0f172a; background: #f8fafc; }
            .footer-note { font-size: 10px; color: #64748b; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
            .status-badge { display: inline-block; padding: 6px 14px; background: #f8fafc; color: #000; border: 1px solid #000; border-radius: 999px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
            @media print {
              body { padding: 0; }
              .invoice-box { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] max-w-3xl w-full p-8 space-y-6 shadow-2xl my-8 text-slate-900 dark:text-white select-none">
        
        {/* Action Bar Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-600 dark:text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Official Digital Tax Invoice & Receipt</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GST Compliant Tax Document</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-900 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-black rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Digital Preview Container */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-6 overflow-hidden">
          <div ref={printRef} className="space-y-6">
            <div className="invoice-box">
              
              {/* Header Branding */}
              <table className="header-table">
                <tr>
                  <td>
                    <div className="logo-title">Asentra ACADEMY</div>
                    <div className="subtitle">IIT-JEE MAINS • ADVANCED • FOUNDATIONS</div>
                    <p style={{ fontSize: '10px', color: '#64748b', margin: '6px 0 0 0', leading: '1.4' }}>
                      Asentra EdTech Private Limited • GSTIN: 36AAACA0000A1Z5<br />
                      Official Support: support@asentra.edu • Portal: https://asentra.edu
                    </p>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="status-badge">PAID & VERIFIED</div>
                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: '10px 0 0 0', fontFamily: 'monospace' }}>
                      Invoice #: INV-{invoice.id || '1001'}
                    </p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                      Date: {invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-IN')}
                    </p>
                  </td>
                </tr>
              </table>

              {/* Billed To / Payment Metadata */}
              <table className="meta-table">
                <thead>
                  <tr>
                    <th style={{ width: '50%' }}>BILLED TO (STUDENT)</th>
                    <th style={{ width: '50%' }}>PAYMENT METADATA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{studentName}</strong><br />
                      <span style={{ color: '#475569' }}>Email: {studentEmail}</span><br />
                      <span style={{ color: '#475569' }}>Phone: {studentPhone}</span>
                    </td>
                    <td>
                      <span>Gateway: <strong>Razorpay Secured (100% Verified)</strong></span><br />
                      <span>Razorpay ID: <strong style={{ fontFamily: 'monospace', color: '#000000' }}>{invoice.razorpayId || 'pay_Nsh721Hhs812'}</strong></span><br />
                      <span>Currency: <strong>INR (₹)</strong></span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Line Items Table */}
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>HSN/SAC</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{invoice.courseTitle || 'Asentra Educational Access'}</strong><br />
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Full curriculum access with synchronized testing telemetry</span>
                    </td>
                    <td>{itemCategory}</td>
                    <td>{hsnCode}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {isFree ? 'Free' : `₹${basePrice.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                  {!isFree && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                        GST (18% IGST Included)
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '11px', fontWeight: 'bold' }}>
                        ₹{gstAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                  <tr className="total-row">
                    <td colSpan="3" style={{ textAlign: 'right', padding: '14px 16px' }}>TOTAL AMOUNT PAID</td>
                    <td style={{ textAlign: 'right', color: '#059669', fontSize: '16px', padding: '14px 16px' }}>
                      {isFree ? 'FREE' : `₹${rawAmount.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer Note */}
              <div className="footer-note">
                <p>This is an official computer-generated tax invoice issued under Asentra Academy&apos;s digital access policy. No physical signature is required.</p>
                <p style={{ margin: '6px 0 0 0', fontWeight: 'bold', color: '#000000' }}>Thank you for learning with Asentra Academy!</p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}