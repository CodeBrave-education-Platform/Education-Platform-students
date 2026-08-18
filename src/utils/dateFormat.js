/**
 * Hydration-Safe Deterministic Date Formatter for Server and Client SSR Render
 * Uses UTC methods to guarantee identical string generation across server and client timezones.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function formatDateSafe(dateInput, format = 'short') {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return String(dateInput)

  const day = d.getUTCDate()
  const monthShort = MONTHS_SHORT[d.getUTCMonth()]
  const monthLong = MONTHS_LONG[d.getUTCMonth()]
  const year = d.getUTCFullYear()

  if (format === 'year-only') return `${year}`
  if (format === 'month-year') return `${monthShort} ${year}`
  if (format === 'short') return `${day} ${monthShort}, ${year}`
  if (format === 'long') {
    const hours = String(d.getUTCHours()).padStart(2, '0')
    const mins = String(d.getUTCMinutes()).padStart(2, '0')
    return `${day} ${monthShort}, ${year} ${hours}:${mins} UTC`
  }
  if (format === 'full') return `${monthLong} ${day}, ${year}`
  if (format === 'iso-date') return `${year}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  return `${day} ${monthShort}, ${year}`
}

export function formatDateTimeSafe(dateInput) {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return String(dateInput)

  const day = d.getUTCDate()
  const monthShort = MONTHS_SHORT[d.getUTCMonth()]
  const year = d.getUTCFullYear()
  const hours = String(d.getUTCHours()).padStart(2, '0')
  const mins = String(d.getUTCMinutes()).padStart(2, '0')

  return `${day} ${monthShort} ${year}, ${hours}:${mins} UTC`
}
