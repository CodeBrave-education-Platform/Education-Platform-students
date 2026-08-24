import { createClient } from '@/utils/supabase/server'
import BookCheckoutClient from './BookCheckoutClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Order Checkout | Asentra Academic Publications',
  description: 'Complete your hardcopy textbook order and access digital PDF materials.'
}

export default async function BookCheckoutPage(props) {
  const searchParams = await props.searchParams
  const bookId = searchParams?.bookId || null
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Fetch target book dynamically from database
  let targetBook = null
  if (bookId) {
    const { data: dbBook } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .maybeSingle()
    if (dbBook) {
      targetBook = {
        id: dbBook.id,
        title: dbBook.title,
        price: Number(dbBook.price) || 0,
        originalPrice: Number(dbBook.original_price) || Math.round(Number(dbBook.price) * 1.5),
        format: dbBook.format || 'Hardcopy + PDF',
        cover: dbBook.thumbnail_url || dbBook.cover_url || ''
      }
    }
  }

  // Fallback to first active book if none specified
  if (!targetBook) {
    const { data: firstBook } = await supabase
      .from('books')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (firstBook) {
      targetBook = {
        id: firstBook.id,
        title: firstBook.title,
        price: Number(firstBook.price) || 0,
        originalPrice: Number(firstBook.original_price) || Math.round(Number(firstBook.price) * 1.5),
        format: firstBook.format || 'Hardcopy + PDF',
        cover: firstBook.thumbnail_url || firstBook.cover_url || ''
      }
    }
  }

  return (
    <BookCheckoutClient 
      book={targetBook}
      user={user}
    />
  )
}
