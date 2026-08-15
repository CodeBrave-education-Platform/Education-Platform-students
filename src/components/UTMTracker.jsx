'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function UTMTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const utmSource = searchParams.get('utm_source')
      const utmMedium = searchParams.get('utm_medium')
      const utmCampaign = searchParams.get('utm_campaign')
      
      if (utmSource || utmMedium || utmCampaign) {
        const utmData = {
          source: utmSource || '',
          medium: utmMedium || '',
          campaign: utmCampaign || '',
          timestamp: new Date().toISOString()
        }
        // Store UTM data in local storage to be passed during signup/telemetry
        localStorage.setItem('asentra_utm_data', JSON.stringify(utmData))
        
        console.log('[Telemetry] Captured UTM parameters:', utmData)
      }
    }
  }, [searchParams])

  return null
}
