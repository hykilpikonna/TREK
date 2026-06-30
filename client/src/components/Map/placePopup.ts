import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CATEGORY_ICON_MAP } from '../shared/categoryIcons'
import { POI_CATEGORY_BY_KEY, type Poi } from './poiCategories'
import type { Place } from '../../types'

// HTML builders for the Mapbox GL hover popup. The Leaflet map already shows a
// name/category/address card on hover (a cursor-following overlay); Mapbox GL has
// no equivalent, so these produce the same card as an HTML string for a
// mapboxgl.Popup. Kept framework-agnostic (plain strings) on purpose.

type PlaceWithCategory = Place & {
  category_color?: string | null
  category_icon?: string | null
  category_name?: string | null
}

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Render a lucide category icon to an inline SVG string in the given colour.
function iconSvg(iconName: string | null | undefined, size: number, color: string): string {
  const Icon = (iconName && CATEGORY_ICON_MAP[iconName]) || CATEGORY_ICON_MAP['MapPin']
  try {
    return renderToStaticMarkup(createElement(Icon, { size, color, strokeWidth: 2 }))
  } catch {
    return ''
  }
}

const CARD_OPEN = '<div style="font-family:var(--font-system);max-width:220px;">'
const NAME_STYLE = 'font-weight:600;font-size:12.5px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
const ADDR_STYLE = 'font-size:11px;color:#9ca3af;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'

/** Hover-popup card for a planned place: name, category row, address. */
export function buildPlacePopupHtml(place: PlaceWithCategory, _photoUrl: string | null): string {
  const category =
    place.category_name && place.category_icon
      ? `<div style="display:flex;align-items:center;gap:4px;margin-top:2px;">${iconSvg(place.category_icon, 11, place.category_color || '#6b7280')}<span style="font-size:11px;color:#6b7280;">${esc(place.category_name)}</span></div>`
      : ''
  const address = place.address ? `<div style="${ADDR_STYLE}">${esc(place.address)}</div>` : ''
  return `${CARD_OPEN}<div style="${NAME_STYLE}">${esc(place.name)}</div>${category}${address}</div>`
}

/** Hover-popup card for an OSM "explore" POI: category-coloured icon, name, address. */
export function buildPoiPopupHtml(poi: Poi): string {
  const cat = POI_CATEGORY_BY_KEY[poi.category]
  const color = cat?.color || '#6b7280'
  const icon = cat ? renderToStaticMarkup(createElement(cat.Icon, { size: 12, color, strokeWidth: 2 })) : ''
  const head = `<div style="display:flex;align-items:center;gap:5px;"><span style="flex-shrink:0;display:inline-flex;line-height:0;">${icon}</span><span style="${NAME_STYLE}">${esc(poi.name)}</span></div>`
  const address = poi.address ? `<div style="${ADDR_STYLE}">${esc(poi.address)}</div>` : ''
  return `${CARD_OPEN}${head}${address}</div>`
}
