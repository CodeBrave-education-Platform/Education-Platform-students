import re

file_path = r"D:\education portal\src\components\InvoiceModal.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
if "html2canvas" not in content:
    content = content.replace("import { X, Printer, Download, CheckCircle2, ShieldCheck, FileText, QrCode, Building2 } from 'lucide-react'", "import { X, Printer, Download, CheckCircle2, ShieldCheck, FileText, QrCode, Building2, Loader2 } from 'lucide-react'\nimport html2canvas from 'html2canvas'\nimport jsPDF from 'jspdf'\nimport { useState } from 'react'")

# Add state for loading
if "const [isDownloading, setIsDownloading] = useState(false)" not in content:
    content = content.replace("const printRef = useRef(null)", "const printRef = useRef(null)\n  const [isDownloading, setIsDownloading] = useState(false)")

# Replace handlePrint
old_handle_print = r'''  const handlePrint = \(\) => \{.*?\}\n'''

new_handle_print = '''  const handleDownloadPDF = async () => {
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
      pdf.save(Asentra_Invoice_INV-.pdf)
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
    printWindow.document.write(
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
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    )
    printWindow.document.close()
  }'''

content = re.sub(r'  const handlePrint = \(\) => \{[\s\S]*?printWindow\.document\.close\(\)\n  \}', new_handle_print, content)

# Update buttons in UI
old_buttons = r'''<button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>'''

new_buttons = '''<button
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
            </button>'''

content = content.replace(old_buttons, new_buttons)

# Clean up Teal colors to Monochrome in InvoiceModal
content = content.replace("bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400", "bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white")
content = content.replace("#0d9488", "#000000")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("InvoiceModal successfully updated.")
