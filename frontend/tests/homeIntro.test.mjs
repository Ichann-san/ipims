import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { stageHomeIntro } from '../src/map/homeIntro.ts'

const city = { center: [112.7, -7.27], zoom: 12.4, pitch: 58, bearing: -18 }
function mockMap() {
  const listeners = new Map()
  return {
    once(event, callback) { const set = listeners.get(event) ?? new Set(); set.add(callback); listeners.set(event, set) },
    off(event, callback) { listeners.get(event)?.delete(callback) },
    emit(event) { const callbacks = [...(listeners.get(event) ?? [])]; listeners.delete(event); callbacks.forEach((callback) => callback()) },
    flyTo(options) { assert.equal(options.duration, 5200) },
    jumpTo() { this.emit('moveend') },
  }
}

test('report layers wait for camera completion and settling, then mount once', () => {
  const map = mockMap(); let mounted = 0
  const stop = stageHomeIntro(map, city, false, () => mounted++)
  map.emit('idle'); assert.equal(mounted, 0)
  map.emit('moveend'); assert.equal(mounted, 0)
  map.emit('idle'); map.emit('idle'); assert.equal(mounted, 1)
  stop()
})

test('reduced-motion synchronous jump does not miss completion', () => {
  const map = mockMap(); let mounted = 0
  const stop = stageHomeIntro(map, city, true, () => mounted++)
  map.emit('idle'); assert.equal(mounted, 1)
  stop()
})

test('idle timeout is bounded; leaving the route cancels pending attachment', async () => {
  const map = mockMap(); let mounted = 0
  const stop = stageHomeIntro(map, city, false, () => mounted++)
  map.emit('moveend')
  await delay(800)
  assert.equal(mounted, 1); stop()
  const abandoned = mockMap()
  const cancel = stageHomeIntro(abandoned, city, false, () => mounted++)
  abandoned.emit('moveend'); cancel(); abandoned.emit('idle')
  await delay(800)
  assert.equal(mounted, 1)
})
