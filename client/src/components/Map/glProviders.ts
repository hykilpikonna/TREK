export type GlMapProvider = 'mapbox-gl' | 'maplibre-gl'

export interface GlStylePreset {
  name: string
  url: string
  tags?: string[]
}

export const MAPBOX_DEFAULT_STYLE = 'mapbox://styles/mapbox/standard'
export const OPENFREEMAP_DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export const MAPBOX_STYLE_PRESETS: GlStylePreset[] = [
  { name: 'Mapbox Standard', url: MAPBOX_DEFAULT_STYLE, tags: ['3D', 'Apple-like'] },
  { name: 'Standard Satellite', url: 'mapbox://styles/mapbox/standard-satellite', tags: ['3D', 'Satellite'] },
  { name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12', tags: ['3D', 'Classic'] },
  { name: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12', tags: ['3D', 'Terrain'] },
  { name: 'Light', url: 'mapbox://styles/mapbox/light-v11', tags: ['3D', 'Minimal'] },
  { name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11', tags: ['3D', 'Dark'] },
  { name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-v9', tags: ['3D', 'Satellite'] },
  { name: 'Satellite Streets', url: 'mapbox://styles/mapbox/satellite-streets-v12', tags: ['3D', 'Satellite'] },
  { name: 'Navigation Day', url: 'mapbox://styles/mapbox/navigation-day-v1', tags: ['3D', 'Apple-like'] },
  { name: 'Navigation Night', url: 'mapbox://styles/mapbox/navigation-night-v1', tags: ['3D', 'Dark'] },
]

export const OPENFREEMAP_STYLE_PRESETS: GlStylePreset[] = [
  { name: 'OpenFreeMap Liberty', url: OPENFREEMAP_DEFAULT_STYLE, tags: ['OpenFreeMap', '2D'] },
  { name: 'OpenFreeMap Bright', url: 'https://tiles.openfreemap.org/styles/bright', tags: ['OpenFreeMap', 'Classic'] },
  { name: 'OpenFreeMap Positron', url: 'https://tiles.openfreemap.org/styles/positron', tags: ['OpenFreeMap', 'Minimal'] },
]

export function getStylePresets(provider: GlMapProvider): GlStylePreset[] {
  return provider === 'maplibre-gl' ? OPENFREEMAP_STYLE_PRESETS : MAPBOX_STYLE_PRESETS
}

export function defaultStyleForProvider(provider: GlMapProvider): string {
  return provider === 'maplibre-gl' ? OPENFREEMAP_DEFAULT_STYLE : MAPBOX_DEFAULT_STYLE
}

export function isOpenFreeMapStyle(style?: string | null): boolean {
  return (style || '').trim().startsWith('https://tiles.openfreemap.org/')
}

export function normalizeStyleForProvider(provider: GlMapProvider, style?: string | null): string {
  const trimmed = (style || '').trim()
  if (!trimmed) return defaultStyleForProvider(provider)
  if (provider === 'maplibre-gl' && trimmed.startsWith('mapbox://')) return OPENFREEMAP_DEFAULT_STYLE
  return trimmed
}
