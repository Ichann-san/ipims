import assert from 'node:assert/strict'
import test from 'node:test'
import { initialPageSize, readReportPage, pageNumbers } from '../src/reportPaging.ts'

test('invalid URL pagination never requests a size above the API cap', () => {
  for (const query of ['page=-2&size=120', 'page=1.5&size=1000', 'page=Infinity&size=0']) {
    assert.deepEqual(readReportPage(new URLSearchParams(query), 9), { page: 1, pageSize: 9 })
  }
  assert.deepEqual(readReportPage(new URLSearchParams('page=15&size=18'), 3), { page: 15, pageSize: 18 })
})

test('initial sizes match phone/tablet/desktop without restricting explicit choices', () => {
  assert.equal(initialPageSize(390), 3)
  assert.equal(initialPageSize(800), 6)
  assert.equal(initialPageSize(1366), 9)
  assert.equal(readReportPage(new URLSearchParams('size=18'), 3).pageSize, 18)
})

test('page navigation stays bounded for large collections and the last page', () => {
  const pages = pageNumbers(17, 18)
  assert.equal(pages[0], 1)
  assert.equal(pages.at(-1), 18)
  assert.ok(pages.includes(17))
  assert.ok(pages.length <= 7)
  assert.deepEqual(pageNumbers(1, 1), [1])
  assert.deepEqual(pageNumbers(2, 3), [1, 2, 3])
})
