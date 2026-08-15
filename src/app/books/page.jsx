'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/utils/supabase/client'
import { 
  BookOpen, Search, ShoppingBag, Star, Download, Truck, 
  CheckCircle2, ArrowRight, ShieldCheck, Filter, Sparkles, X, Plus, Minus 
} from 'lucide-react'

export default function BookStorePage() {
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const supabase = createClient()

  const sampleBooks = [
    {
      id: 'b1',
      title: 'IIT JEE Physics Mastery: Mechanics & Waves',
      author: 'Dr. H.C. Verma & Asentra Faculty',
      category: 'JEE Advanced',
      subject: 'Physics',
      price: 699,
      originalPrice: 999,
      rating: 4.9,
      reviewsCount: 340,
      stock: 45,
      format: 'Hardcopy + PDF',
      cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop&q=80',
      samplePdf: '/downloads/physics-sample.pdf'
    },
    {
      id: 'b2',
      title: 'Organic Chemistry 20-Year Chapterwise PYQs',
      author: 'Asentra JEE Editorial Team',
      category: 'JEE Mains',
      subject: 'Chemistry',
      price: 499,
      originalPrice: 750,
      rating: 4.8,
      reviewsCount: 210,
      stock: 80,
      format: 'Hardcopy + PDF',
      cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      samplePdf: '/downloads/chemistry-sample.pdf'
    },
    {
      id: 'b3',
      title: 'NEET Medical Biology 10,000 MCQ Bank',
      author: 'Dr. Ananya Ray',
      category: 'NEET UG',
      subject: 'Biology',
      price: 599,
      originalPrice: 899,
      rating: 4.9,
      reviewsCount: 520,
      stock: 30,
      format: 'Hardcopy + PDF',
      cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
      samplePdf: '/downloads/biology-sample.pdf'
    },
    {
      id: 'b4',
      title: 'Vector Calculus & 3D Geometry Handbook',
      author: 'Prof. R.D. Sharma & Team',
      category: 'JEE Advanced',
      subject: 'Mathematics',
      price: 399,
      originalPrice: 599,
      rating: 4.7,
      reviewsCount: 180,
      stock: 60,
      format: 'Instant Digital PDF',
      cover: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
      samplePdf: '/downloads/maths-sample.pdf'
    }
  ]

  const [books, setBooks] = useState(sampleBooks)

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data, error } = await supabase.from('books').select('*')
        if (data && data.length > 0) {
          const formatted = data.map(b => ({
            ...b,
            author: b.author || 'Asentra Faculty',
            category: b.category || 'Standard',
            subject: b.subject || 'General',
            rating: 4.8,
            reviewsCount: 120,
            stock: b.stock || 50,
            format: 'Hardcopy + PDF',
            cover: b.thumbnail_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop&q=80',
            samplePdf: '/downloads/physics-sample.pdf'
          }))
          setBooks([...sampleBooks, ...formatted])
        }
      } catch (err) {}
    }
    fetchBooks()
  }, [])

  const addToCart = (book) => {
    const existing = cart.find(item => item.id === book.id)
    if (existing) {
      setCart(cart.map(item => item.id === book.id ? { ...item, qty: item.qty + 1 } : item))
    } else {
      setCart([...cart, { ...book, qty: 1 }])
    }
    setIsCartOpen(true)
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  const filteredBooks = books.filter(book => {
    const matchSubject = selectedSubject === 'All' || book.subject === selectedSubject
    const matchCategory = selectedCategory === 'All' || book.category === selectedCategory
    const matchQuery = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || book.author.toLowerCase().includes(searchQuery.toLowerCase())
    return matchSubject && matchCategory && matchQuery
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-12 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Asentra Academic Press</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Competitive Exam Books & <span className="text-teal-400">eBook Modules</span>
          </h1>
          <p className="text-xs sm:text-base text-slate-400 max-w-2xl mx-auto font-medium">
            Hardcopy textbooks delivered to your doorstep & instant downloadable PDF eBooks with chapterwise PYQs and formula handbooks.
          </p>

          {/* Search Input */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by book title, author, or subject..."
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog View */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="text-slate-400 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Subject:
            </span>
            {['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'].map(subj => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${selectedSubject === subj ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {subj}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/books/my-orders"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4 text-teal-600" />
              <span>Track My Book Orders</span>
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer relative"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart ({cart.reduce((sum, i) => sum + i.qty, 0)})</span>
            </button>
          </div>
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <div key={book.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="relative h-56 bg-slate-100 overflow-hidden group">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/80 text-white text-[10px] font-bold rounded uppercase">
                    {book.category}
                  </span>
                  <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-teal-600 text-white text-[10px] font-bold rounded-lg shadow-sm">
                    {book.format}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>{book.subject}</span>
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-current" /> {book.rating} ({book.reviewsCount})
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">{book.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{book.author}</p>
                </div>
              </div>

              <div className="p-5 pt-0 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-900">₹{book.price}</span>
                  <span className="text-xs text-slate-400 line-through">₹{book.originalPrice}</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/books/${book.id}`}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold text-center transition"
                  >
                    Inspect
                  </Link>
                  <button
                    onClick={() => addToCart(book)}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white max-w-md w-full h-full p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-teal-600" />
                  <span>My Academic Cart ({cart.length})</span>
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center gap-3 text-xs">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 leading-snug line-clamp-1">{item.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium">₹{item.price} × {item.qty}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-700 text-[10px] font-bold cursor-pointer">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Total Amount:</span>
                  <span className="text-teal-600">₹{totalAmount}</span>
                </div>

                <Link
                  href="/books/checkout"
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black text-center block shadow-md transition"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
