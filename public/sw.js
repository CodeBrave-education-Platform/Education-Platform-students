const CACHE_NAME = 'asentra-pwa-cache-v2'
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/academic_prosperity_1779866712293.png'
]

// Service Worker Install: Cache static shells
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Service Worker Activate: Clean obsolete registries
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Service Worker Fetch Intercept Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle requests to our own origin (ignore Supabase, Cloudinary, Razorpay external APIs, etc.)
  if (!request.url.startsWith(self.location.origin)) {
    return
  }

  // Strictly skip non-GET endpoints, payment checkouts, and dynamic video authorizations
  if (
    request.method !== 'GET' || 
    url.pathname.includes('/api/razorpay') || 
    url.pathname.includes('/api/video')
  ) {
    return
  }

  // Network-First strategy: profiles, announcements, and classroom registries
  if (
    url.pathname.includes('/profile') ||
    url.pathname.includes('/dashboard') ||
    url.pathname.includes('/learn')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Dynamic offline mapping: clone dynamic responses and update cache
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Network disconnected: fall back gracefully to localized offline states
          return caches.match(request)
        })
    )
  } 
  // Cache-First strategy: static styles, fonts, and skeletal templates
  else {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
  }
})
