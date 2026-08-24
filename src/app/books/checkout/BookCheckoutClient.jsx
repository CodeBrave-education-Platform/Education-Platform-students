'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ShieldCheck, Truck, CreditCard, ArrowLeft, CheckCircle2, Loader2, BookOpen } from 'lucide-react'

export default function BookCheckoutClient({ book = null, user = null }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [mobile, setMobile] = useState(user?.phone || user?.user_metadata?.phone || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const finalPrice = book ? Number(book.price) || 0 : 499

  const handleRazorpayCheckout = async (e) => {
    e.preventDefault()
    if (!book) {
      alert('No book selected for checkout.')
      return
    }

    setLoading(true)

    try {
      const orderResponse = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          price: finalPrice
        })
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize payment order.')
      }

      const options = {
        key: orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
        amount: Math.round(finalPrice * 100),
        currency: 'INR',
        name: 'ASENTRA PUBLICATIONS',
        description: book.title,
        order_id: orderData.orderId,
        theme: {
          color: '#0D9488'
        },
        prefill: {
          name: fullName,
          email: user?.email || '',
          contact: mobile
        },
        handler: async function (response) {
          try {
            setLoading(true)
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || orderData.orderId,
                razorpay_signature: response.razorpay_signature,
                bookId: book.id,
                amount: Math.round(finalPrice * 100),
                shippingAddress: {
                  name: fullName,
                  phone: mobile,
                  street: address,
                  city: city,
                  pincode: pincode
                }
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Payment verification failed.')
            }

            setSuccess(true)
          } catch (err) {
            console.error('Checkout verification error:', err)
            alert(err.message || 'Payment Verification failed. Please contact support.')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          }
        }
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        throw new Error('Razorpay payment SDK not loaded.')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert(err.message || 'Failed to initialize secure checkout.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none pb-20 md:pb-0">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navbar />

      <main className="max-w-3xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        <Link href="/books" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        {success ? (
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900">Order Placed Successfully!</h1>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Your order for <span className="font-bold text-slate-800">{book?.title}</span> has been confirmed. Hardcopy books will be dispatched via Blue Dart Express with live tracking updates.
              </p>
            </div>

            <div className="pt-4 flex justify-center gap-4">
              <Link
                href="/books/my-orders"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Track My Order & Downloads
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-xl font-black text-slate-900">Delivery Address & Payment</h1>
                {book && (
                  <p className="text-xs font-semibold text-teal-700 mt-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{book.title} ({book.format || 'Hardcopy + PDF'})</span>
                  </p>
                )}
              </div>
              <span className="px-3 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase rounded-lg">
                Razorpay Encrypted
              </span>
            </div>

            <form onSubmit={handleRazorpayCheckout} className="space-y-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase text-[10px]">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase text-[10px]">Flat / House / Building Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House No 42, Block B, Green Park"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 uppercase text-[10px]">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kota / New Delhi / Hyderabad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 uppercase text-[10px]">Pincode (6 digits)</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="324005"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase text-[10px]">10-Digit Mobile Number for Dispatch Updates</label>
                <input
                  type="text"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Payable Total</span>
                  <span className="text-xl font-black text-slate-900">₹{finalPrice}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !book}
                  className="px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm & Pay via Razorpay (₹{finalPrice})</span>}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
