import * as React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ProfileClient from './ProfileClient'
import Navbar from '@/components/Navbar'

export default async function ProfilePage() {
  const supabase = await createClient()

  // Retrieve authenticated user session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Retrieve matching profile
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Graceful fallback if profile wasn't created yet (e.g., fast OAuth completion)
  if (!profile) {
    const defaultName = user.email.split('@')[0]
    const defaultRole = 'student'
    
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: defaultName,
        role: defaultRole
      })
      .select()
      .single()

    if (!profileError && newProfile) {
      profile = newProfile
    } else {
      profile = {
        id: user.id,
        email: user.email,
        full_name: defaultName,
        role: defaultRole
      }
    }
  }

  return (
    <>
      <Navbar user={user} profile={profile} />
      <ProfileClient user={user} profile={profile} />
    </>
  )
}
