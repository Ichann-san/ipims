import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { BRAND } from '../src/brand.ts'
import { nearbyRoad, reportTitle, reportLocation, formatHours, formatScore, formatDate, formatIdr, STATUS_LABEL } from '../src/labels.ts'

test('off-road infrastructure keeps its category and location identity', () => {
  const report = { code: 'IPIMS-TEST', category: 'lampu_jalan', lat: -7.25, lng: 112.75, segment: null }
  assert.match(reportTitle(report), /IPIMS-TEST\s+Street light/)
  assert.equal(reportLocation(report), '-7.25000, 112.75000')
  assert.equal(nearbyRoad(report), null)
  assert.equal(nearbyRoad({ ...report, segment: { name: 'Jalan Contoh' } }), 'Nearby road: Jalan Contoh')
  assert.equal(STATUS_LABEL.ai_verified, 'AI assessed')
})

test('unknown metrics differ from zero and dates use the reporting time zone', () => {
  assert.equal(formatScore(null), '—')
  assert.equal(formatScore(0), '0.0')
  assert.equal(formatHours(undefined), '—')
  assert.equal(formatHours(0), '0.0 h')
  assert.match(formatDate('2026-11-04T18:00:00Z'), /5 Nov 2026, 01:00 WIB/)
  assert.match(formatIdr(1250000), /1\.250\.000/)
})

test('canonical brand agrees with static metadata and declared app icons exist', () => {
  assert.equal(BRAND.name, 'Intelligence Public Infrastructure Management System')
  const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url)))
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.equal(manifest.name, BRAND.name)
  assert.ok(html.includes(`<title>${BRAND.name}</title>`))
  for (const icon of manifest.icons) assert.ok(existsSync(new URL(`../public${icon.src}`, import.meta.url)), icon.src)
})
