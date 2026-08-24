import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/utils/supabase/server'
import { 
  Star, ShieldCheck, Download, Truck, ArrowLeft, 
  CheckCircle2, ShoppingBag, BookOpen, Sparkles, Package, BookMarked
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props) {
  const params = await props.params
  const id = params.id
  const supabase = await createClient()

  const { data: book } = await supabase
    .from('books')
    .select('title, subtitle, author')
    .eq('id', id)
    .maybeSingle()

  if (!book) {
    return {
      title: 'Book Details | Asentra Academic Press'
    }
  }

  return {
    title: `${book.title} | Asentra Academic Press`,
    description: book.subtitle || `Official publication by ${book.author} for competitive exam preparation.`
  }
}

export default async function BookDetailPage(props) {
  const params = await props.params
  const id = params.id
  const supabase = await createClient()

  const { data: rawBook, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !rawBook) {
    notFound()
  }

  const book = {
    id: rawBook.id,
    title: rawBook.title,
    subtitle: rawBook.subtitle || '',
    author: rawBook.author || 'Asentra Academic Faculty',
    category: rawBook.category || rawBook.target_exam_tag || 'JEE Advanced',
    subject: rawBook.subject || 'General',
    price: Number(rawBook.price) || 0,
    originalPrice: Number(rawBook.original_price) || (Number(rawBook.price) ? Math.round(Number(rawBook.price) * 1.5) : 0),
    rating: rawBook.rating ? Number(rawBook.rating) : 4.8,
    reviewsCount: rawBook.reviews_count || 120,
    stock: rawBook.stock || rawBook.stock_quantity || 50,
    format: rawBook.format || 'Hardcopy + Digital PDF Combo',
    isbn: rawBook.isbn || '978-81-940219-4-2',
    pages: rawBook.pages || 420,
    cover: rawBook.thumbnail_url || rawBook.cover_url || rawBook.cover_image_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop&q=80',
    samplePdf: rawBook.sample_pdf_url || '/downloads/physics-sample.pdf',
    description: rawBook.description || rawBook.subtitle || 'Comprehensive textbook and exercise manual with solved numerical problems and previous year questions.',
    tableOfContents: Array.isArray(rawBook.table_of_contents) && rawBook.table_of_contents.length > 0 
      ? rawBook.table_of_contents 
      : [
          'Chapter 1: Fundamental Principles & Core Concepts',
          'Chapter 2: In-Depth Numerical & Multi-Concept Drills',
          'Chapter 3: Previous 15 Years Chapterwise PYQ Solutions',
          'Chapter 4: Assertion-Reason & High-Speed Shortcuts',
          'Chapter 5: Final Revision Flash Summary & Formula Maps'
        ]
  }

  const discountPercent = book.originalPrice > book.price 
    ? Math.round(((book.originalPrice - book.price) / book.originalPrice) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        <Link href="/books" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Book Store
        </Link>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Cover Container */}
          <div className="md:col-span-5 relative aspect-[3/4] max-h-[460px] bg-slate-100 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center p-4">
            <img 
              src={book.cover} 
              alt={book.title} 
              className="max-h-full max-w-full object-contain rounded-lg shadow-md" 
            />
            <span className="absolute top-4 left-4 px-3 py-1 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold rounded uppercase">
              {book.category}
            </span>
          </div>

          {/* Book Info */}
          <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{book.rating} ({book.reviewsCount} Student Reviews)</span>
              </div>

              <h1 className="text-2xl font-black text-slate-900 leading-tight">{book.title}</h1>
              {book.subtitle && <p className="text-xs font-bold text-teal-700">{book.subtitle}</p>}
              <p className="text-xs text-slate-500 font-medium">By <span className="text-slate-800 font-bold">{book.author}</span></p>

              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-3xl font-black text-slate-900">₹{book.price}</span>
                {book.originalPrice > book.price && (
                  <>
                    <span className="text-sm text-slate-400 line-through font-bold">₹{book.originalPrice}</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded">
                      Save {discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal pt-1">
                {book.description}
              </p>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subject Focus:</span>
                  <span className="font-bold text-slate-900">{book.subject}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Publication Format:</span>
                  <span className="font-bold text-slate-900">{book.format}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Pages Count:</span>
                  <span className="font-bold text-slate-900">{book.pages} Pages</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Stock Availability:</span>
                  <span className="font-bold text-emerald-700">{book.stock} Units in Stock</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
              <Link
                href={`/books/checkout?bookId=${book.id}&qty=1`}
                className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black text-center shadow-md transition flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buy Now (₹{book.price})</span>
              </Link>

              {book.samplePdf && (
                <a
                  href={book.samplePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold text-center transition flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Preview Sample PDF</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Curriculum Index & Table of Contents</h3>
          </div>
          <ul className="space-y-2 text-xs font-medium text-slate-700">
            {book.tableOfContents.map((ch, idx) => (
              <li key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-semibold text-slate-800">{ch}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  )
}
