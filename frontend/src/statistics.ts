import type { Stats } from './api'

// All reporting calendar boundaries use Surabaya's timezone, independent of the device.
export function reportingMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit' }).formatToParts(now)
  return `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}`
}

export function sixMonths(monthly: Stats['monthly'], now = new Date()): Stats['monthly'] {
  const [year, month] = reportingMonth(now).split('-').map(Number)
  const byMonth = new Map(monthly.map((row) => [row.month, row]))
  return Array.from({ length: 6 }, (_, i) => {
    const date = new Date(Date.UTC(year, month - 6 + i, 1))
    const key = date.toISOString().slice(0, 7)
    return byMonth.get(key) ?? { month: key, reported: 0, completed: 0 }
  })
}
