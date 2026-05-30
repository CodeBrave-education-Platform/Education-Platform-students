import { redirect } from 'next/navigation'

export default async function BatchesRedirectPage() {
  redirect('/dashboard?tab=batches')
}
