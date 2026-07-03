// indexeddb.js
// Standalone IndexedDB cache wrapper for proctored CBT offline session recovery

const DB_NAME = 'asentra-offline-db'
const DB_VERSION = 1
const STORE_NAME = 'exam_attempts'

export function initExamDb() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(null)
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error('[IndexedDB] Database open error:', event.target.error)
      reject(event.target.error)
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'examId' })
      }
    }
  })
}

export async function saveExamState(examId, state) {
  const db = await initExamDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(transaction.objectStoreNames[0])
    
    const record = {
      examId,
      ...state,
      updatedAt: Date.now()
    }

    const request = store.put(record)

    request.onsuccess = () => resolve(true)
    request.onerror = (e) => reject(e.target.error)
  })
}

export async function getExamState(examId) {
  const db = await initExamDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(transaction.objectStoreNames[0])
    const request = store.get(examId)

    request.onsuccess = (event) => resolve(event.target.result || null)
    request.onerror = (e) => reject(e.target.error)
  })
}

export async function clearExamState(examId) {
  const db = await initExamDb()
  if (!db) return

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(transaction.objectStoreNames[0])
    const request = store.delete(examId)

    request.onsuccess = () => resolve(true)
    request.onerror = (e) => reject(e.target.error)
  })
}
