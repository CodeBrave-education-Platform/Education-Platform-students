// indexeddb.js
// Standalone IndexedDB cache wrapper for proctored CBT offline session recovery

const DB_NAME = 'asentra-offline-db'
const DB_VERSION = 1
const STORE_NAME = 'exam_attempts'

export function initExamDb() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null)
      return
    }

    const timer = setTimeout(() => {
      resolve(null)
    }, 1000)

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        clearTimeout(timer)
        console.warn('[IndexedDB] Database open error:', event.target.error)
        resolve(null)
      }

      request.onblocked = () => {
        clearTimeout(timer)
        resolve(null)
      }

      request.onsuccess = (event) => {
        clearTimeout(timer)
        resolve(event.target.result)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'examId' })
        }
      }
    } catch (e) {
      clearTimeout(timer)
      resolve(null)
    }
  })
}

export async function saveExamState(examId, state) {
  try {
    const db = await initExamDb()
    if (!db) return false

    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 1000)
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        
        const record = {
          examId,
          ...state,
          updatedAt: Date.now()
        }

        const request = store.put(record)

        request.onsuccess = () => {
          clearTimeout(timer)
          resolve(true)
        }
        request.onerror = () => {
          clearTimeout(timer)
          resolve(false)
        }
      } catch (err) {
        clearTimeout(timer)
        resolve(false)
      }
    })
  } catch {
    return false
  }
}

export async function getExamState(examId) {
  try {
    const db = await initExamDb()
    if (!db) return null

    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 1000)
      try {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(examId)

        request.onsuccess = (event) => {
          clearTimeout(timer)
          resolve(event.target.result || null)
        }
        request.onerror = () => {
          clearTimeout(timer)
          resolve(null)
        }
      } catch (err) {
        clearTimeout(timer)
        resolve(null)
      }
    })
  } catch {
    return null
  }
}

export async function clearExamState(examId) {
  try {
    const db = await initExamDb()
    if (!db) return false

    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 1000)
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(examId)

        request.onsuccess = () => {
          clearTimeout(timer)
          resolve(true)
        }
        request.onerror = () => {
          clearTimeout(timer)
          resolve(false)
        }
      } catch (err) {
        clearTimeout(timer)
        resolve(false)
      }
    })
  } catch {
    return false
  }
}

