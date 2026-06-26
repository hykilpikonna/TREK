import { describe, expect, it } from 'vitest'
import {
  MAPBOX_DEFAULT_STYLE,
  OPENFREEMAP_DEFAULT_STYLE,
  isOpenFreeMapStyle,
  normalizeStyleForProvider,
} from './glProviders'

function createStorageStub(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => {
      values.delete(key)
    },
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
  }
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: createStorageStub() })
}

if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: createStorageStub() })
}

describe('glProviders', () => {
  it('keeps OpenFreeMap styles for MapLibre', () => {
    const style = 'https://tiles.openfreemap.org/styles/bright'

    expect(normalizeStyleForProvider('maplibre-gl', style)).toBe(style)
  })

  it('falls back to OpenFreeMap for MapLibre styles outside the CSP allowlist', () => {
    expect(normalizeStyleForProvider('maplibre-gl', 'https://demotiles.maplibre.org/style.json')).toBe(
      OPENFREEMAP_DEFAULT_STYLE,
    )
    expect(normalizeStyleForProvider('maplibre-gl', MAPBOX_DEFAULT_STYLE)).toBe(OPENFREEMAP_DEFAULT_STYLE)
  })

  it('leaves Mapbox styles unchanged for Mapbox GL', () => {
    expect(normalizeStyleForProvider('mapbox-gl', MAPBOX_DEFAULT_STYLE)).toBe(MAPBOX_DEFAULT_STYLE)
  })

  it('matches the OpenFreeMap CSP host', () => {
    expect(isOpenFreeMapStyle('https://tiles.openfreemap.org/styles/liberty')).toBe(true)
    expect(isOpenFreeMapStyle('https://demotiles.maplibre.org/style.json')).toBe(false)
  })
})
