import { redirect } from 'next/navigation'

export default async function CoursesRedirectPage() {
  redirect('/dashboard?tab=browse')
}
