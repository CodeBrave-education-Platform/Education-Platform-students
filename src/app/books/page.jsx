import { createClient } from '@/utils/supabase/server'
import BooksClient from './BooksClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Competitive Exam Books & Physical Store | Asentra Academic Press',
  description: 'Official Asentra Academic Press textbooks, printed problem manuals, and digital PDF modules for JEE Main, Advanced, and NEET aspirants.'
}

export default async function BookStorePage() {
  const supabase = await createClient()

  let books = []
  try {
    const { data: dbBooks, error: booksError } = await supabase
      .from('books')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })

    if (booksError) {
      console.error('[BOOKS PAGE] Database query error:', booksError)
    }

    if (dbBooks && dbBooks.length > 0) {
      books = dbBooks.map(b => ({
        id: b.id,
        title: b.title || 'Untitled Publication',
        subtitle: b.subtitle || '',
        author: b.author || 'Asentra Academic Faculty',
        category: b.category || 'JEE Mains',
        subject: b.subject || 'General',
        targetExamTag: b.target_exam_tag || 'JEE Mains',
        price: Number(b.price) || 0,
        originalPrice: Number(b.original_price) || (Number(b.price) ? Math.round(Number(b.price) * 1.5) : 0),
        rating: b.rating ? Number(b.rating) : 4.8,
        reviewsCount: b.reviews_count || 120,
        stock: b.stock || b.stock_quantity || 50,
        format: b.format || 'Hardcopy + PDF',
        cover: b.thumbnail_url || b.cover_url || b.cover_image_url || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&auto=format&fit=crop&q=80',
        samplePdf: b.sample_pdf_url || '/downloads/physics-sample.pdf'
      }))
    }
  } catch (err) {
    console.error('[BOOKS PAGE] Error loading books from Supabase:', err)
  }

  return <BooksClient initialBooks={books} />
}
