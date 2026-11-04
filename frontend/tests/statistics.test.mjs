import assert from 'node:assert/strict'
import test from 'node:test'
import { reportingMonth, sixMonths } from '../src/statistics.ts'

test('reporting month uses WIB at a UTC month boundary', () => {
  assert.equal(reportingMonth(new Date('2026-10-31T18:00:00Z')), '2026-11')
  assert.equal(reportingMonth(new Date('2026-10-31T16:59:59Z')), '2026-10')
})

test('trend fills calendar gaps, crosses years and excludes old/future months', () => {
  const monthly = [
    { month: '2025-07', reported: 20, completed: 9 },
    { month: '2025-12', reported: 4, completed: 2 },
    { month: '2026-02', reported: 8, completed: 3 },
  ]
  const rows = sixMonths(monthly, new Date('2026-01-15T00:00:00Z'))
  assert.deepEqual(rows.map((r) => r.month), ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'])
  assert.deepEqual(rows[4], monthly[1])
  assert.deepEqual(rows[5], { month: '2026-01', reported: 0, completed: 0 })
  assert.equal(rows.reduce((sum, r) => sum + r.reported, 0), 4)
})
