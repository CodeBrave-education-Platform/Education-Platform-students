import re

file_path = r"D:\education portal\src\app\dashboard\DashboardClient.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "import InvoiceModal" not in content:
    content = content.replace("import GlobalLeaderboard from '@/components/GlobalLeaderboard'", "import InvoiceModal from '@/components/InvoiceModal'\nimport GlobalLeaderboard from '@/components/GlobalLeaderboard'")

if "const [selectedInvoice, setSelectedInvoice] = useState(null)" not in content:
    content = content.replace("const [selectedCohortBatch, setSelectedCohortBatch] = useState(null)", "const [selectedInvoice, setSelectedInvoice] = useState(null)\n  const [selectedCohortBatch, setSelectedCohortBatch] = useState(null)")

old_button = r'''<a 
                                  href="#" 
                                  onClick={(e) => { e.preventDefault(); alert(Downloading invoice  in PDF format...) }}
                                  className="text-slate-900 dark:text-white dark:text-slate-500 dark:text-zinc-300 hover:underline font-semibold"
                                >
                                  Download PDF
                                </a>'''
new_button = '''<button 
                                  onClick={() => setSelectedInvoice(invoice)}
                                  className="text-slate-900 dark:text-white hover:underline font-semibold cursor-pointer"
                                >
                                  View & Download
                                </button>'''

content = content.replace(old_button, new_button)
content = re.sub(
    r'<a[^>]*onClick=\{\(e\) => \{ e\.preventDefault\(\); alert\(Downloading invoice \$\{invoice\.id\} in PDF format\.\.\.\) \}\}[^>]*>.*?Download PDF.*?</a>',
    new_button,
    content,
    flags=re.DOTALL
)

old_end = '''      </AnimatePresence>

    </div>
  )
}'''

new_end = '''      </AnimatePresence>

      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceModal 
            invoice={selectedInvoice} 
            user={user} 
            profile={profile} 
            onClose={() => setSelectedInvoice(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}'''

if "InvoiceModal invoice={selectedInvoice}" not in content:
    content = content.replace(old_end, new_end)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("DashboardClient successfully updated.")
