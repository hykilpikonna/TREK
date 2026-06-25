import { useSettingsStore } from '../../store/settingsStore'
import { MapView } from './MapView'
import { MapViewGL } from './MapViewGL'

// Auto-selects the map renderer based on user settings. Keeps the existing
// Leaflet MapView untouched so the Mapbox GL variant can mature iteratively
// behind a toggle. Atlas is not affected — it imports Leaflet directly.
//
// Offline maps: only the Leaflet renderer supports full pre-download (raster
// tiles via sync/tilePrefetcher.ts). GL maps are best-effort offline — their
// vector tiles are cached opportunistically by the Service Worker as you view
// them online (see the GL tile rules in vite.config.js), not prefetched.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MapViewAuto(props: any) {
  const provider = useSettingsStore(s => s.settings.map_provider)
  const token = useSettingsStore(s => s.settings.mapbox_access_token)
  // Fall back to Leaflet when Mapbox is selected but no token is set,
  // so trip planner never shows an empty map due to a missing token.
  if (provider === 'maplibre-gl') return <MapViewGL {...props} glProvider="maplibre-gl" />
  if (provider === 'mapbox-gl' && token) return <MapViewGL {...props} glProvider="mapbox-gl" />
  return <MapView {...props} />
}
