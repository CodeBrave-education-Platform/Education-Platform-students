import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/utils/supabase/server'
import { formatDateSafe } from '@/utils/dateFormat'
import { 
  Truck, Download, CheckCircle2, Clock, BookOpen, 
  ArrowLeft, ExternalLink, Copy, Sparkles, Package, ShoppingBag 
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Book Orders & Live Tracking | Asentra Academic Publications',
  description: 'Track your home-delivered physical textbooks and access instant eBook PDF downloads.'
}

export default async function MyBookOrdersPage() {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/books/my-orders')
  }

  // 2. Fetch authenticated user's real orders from database
  let orders = []
  try {
    const { data: dbOrders, error: ordersError } = await supabase
      .from('book_orders')
      .select('*, books(id, title, format, sample_pdf_url, cover_url)')
      .eq('user_id', user.id)
      .order('ordered_at', { ascending: false })

    if (ordersError) {
      console.error('[MY ORDERS PAGE] Error fetching book orders:', ordersError)
    }

    if (dbOrders && dbOrders.length > 0) {
      orders = dbOrders.map(o => {
        const bookTitle = o.books?.title || o.shipping_address?.book_title || 'Academic Theory & Practice Module'
        const bookFormat = o.books?.format || 'Hardcopy + Digital PDF'
        const downloadUrl = o.books?.sample_pdf_url || '/downloads/physics-formulas.pdf'
        const orderStatus = o.status ? (o.status.charAt(0).toUpperCase() + o.status.slice(1).replace('_', ' ')) : 'Placed'
        const courierPartner = o.courier_partner || o.courier || 'Blue Dart Express'
        const trackingNum = o.tracking_id || o.tracking_number || `TRK-BD-${o.id ? o.id.slice(0, 8).toUpperCase() : 'PENDING'}`
        const trackingLink = o.tracking_url || o.tracking_link || `https://track.bluedart.com/${trackingNum}`

        return {
          id: o.id ? `ORD-${o.id.slice(0, 8).toUpperCase()}` : 'ORD-2026',
          source: o.source || 'Direct Purchase',
          date: formatDateSafe(o.ordered_at || o.created_at, 'short'),
          totalAmount: Number(o.amount_paid) || 0,
          status: orderStatus,
          courier: courierPartner,
          trackingNumber: trackingNum,
          trackingLink: trackingLink,
          shippingAddress: o.shipping_address,
          items: [
            {
              title: bookTitle,
              format: bookFormat,
              downloadUrl: downloadUrl
            }
          ]
        }
      })
    }
  } catch (err) {
    console.error('[MY ORDERS PAGE] Fetch exception:', err)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col select-none pb-20 md:pb-0">
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-6 py-10 flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Link href="/books" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-1">
              <ArrowLeft className="w-4 h-4" /> Back to Store
            </Link>
            <h1 className="text-2xl font-black text-slate-900">Book Distribution & Tracking Portal</h1>
          </div>

          <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-200 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-teal-600" />
            <span>Verified Book Deliveries</span>
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-slate-800">No Book Orders Yet</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t placed any physical book orders yet. Explore our curriculum textbooks and formula handbooks in the store.
            </p>
            <div className="pt-2">
              <Link
                href="/books"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <BookOpen className="w-4 h-4" />
                <span>Browse Academic Book Store</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">{order.id}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded text-[10px]">
                        {order.source}
                      </span>
                    </div>
                    <span className="text-slate-400 block font-medium">Order Date: {order.date}</span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 font-bold rounded-lg uppercase text-[10px]">
                      {order.status}
                    </span>
                    <span className="text-slate-900 font-black block">
                      {order.totalAmount > 0 ? `₹${order.totalAmount}` : 'Included Free'}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs gap-3">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <span className="text-[10px] text-slate-500 font-medium">{item.format}</span>
                      </div>

                      {item.downloadUrl && (
                        <a
                          href={item.downloadUrl}
                          download
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Instant eBook PDF</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                {/* Shipping Destination Address Box */}
                {order.shippingAddress && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Truck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Physical Hardcopy Delivery Destination:</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium pl-5">
                      {order.shippingAddress.name} ({order.shippingAddress.phone || 'N/A'}) • {order.shippingAddress.street || order.shippingAddress.address}, {order.shippingAddress.city} - {order.shippingAddress.pincode}
                    </p>
                  </div>
                )}

                {/* Live Tracking Information */}
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2 font-bold">
                      <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Courier Partner: {order.courier}</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800">Estimated Delivery: 2-3 Business Days</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-200/60 font-mono text-[11px]">
                    <div>
                      <span className="text-amber-700">Tracking ID: </span>
                      <span className="font-bold text-amber-950">{order.trackingNumber}</span>
                    </div>

                    <a
                      href={order.trackingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold font-sans text-xs flex items-center gap-1.5 transition shadow-sm"
                    >
                      <span>Track Shipment Live</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
