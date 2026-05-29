'use client'

import * as React from 'react'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve search params such as ?tab=register
    const params = searchParams.toString()
    const destination = params ? `/auth?${params}` : '/auth'
    router.replace(destination)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans select-none">
      <div className="text-center space-y-3">
        <span className="text-3xl font-extrabold tracking-[0.2em] text-slate-900 animate-pulse select-none uppercase">
          ASENTRA
        </span>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Redirecting to secure authentication gateway...
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans select-none">
        <div className="text-center space-y-3">
          <span className="text-3xl font-extrabold tracking-[0.2em] text-slate-900 animate-pulse select-none uppercase">
            ASENTRA
          </span>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Loading secure authentication gateway...
          </p>
        </div>
      </div>
    }>
      <LoginRedirect />
    </Suspense>
  )
}
