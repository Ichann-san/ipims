import { useEffect, useState } from 'react'

export interface Region {
  name: string
  center: [number, number] // lng, lat
  bbox: [number, number, number, number]
  kecamatan: string[]
}

// Used until GET /api/v1/region answers (and if it is not available).
export const SURABAYA: Region = {
  name: 'Surabaya',
  center: [112.7521, -7.2575],
  bbox: [112.59, -7.36, 112.85, -7.18],
  kecamatan: [],
}

let cached: Region | null = null

export function useRegion(): Region {
  const [region, setRegion] = useState<Region>(cached ?? SURABAYA)
  useEffect(() => {
    if (cached) return
    fetch('/api/v1/region')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((r: Region) => {
        cached = r
        setRegion(r)
      })
      .catch(() => undefined)
  }, [])
  return region
}

export function formatCoord([lng, lat]: [number, number]) {
  return `${Math.abs(lat).toFixed(4)}° ${lat < 0 ? 'S' : 'N'}  ${Math.abs(lng).toFixed(4)}° ${lng < 0 ? 'W' : 'E'}`
}
