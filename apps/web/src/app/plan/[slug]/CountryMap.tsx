'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Clean minimal tile — white base, colored pins pop beautifully
const TILE_URL   = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png'
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> © <a href="https://carto.com/" target="_blank">CARTO</a>'

const CATEGORY_COLOR: Record<string, string> = {
  BEACH:      '#3B82F6',
  TEMPLE:     '#7C3AED',
  MUSEUM:     '#D97706',
  MARKET:     '#059669',
  PARK:       '#16A34A',
  MOUNTAIN:   '#374151',
  CITY:       '#4F46E5',
  VILLAGE:    '#65A30D',
  RESTAURANT: '#EA580C',
  NIGHTLIFE:  '#DB2777',
  ADVENTURE:  '#DC2626',
  HISTORICAL: '#CA8A04',
  OTHER:      '#6B7280',
}

const CATEGORY_EMOJI: Record<string, string> = {
  BEACH:      '🏖️',
  TEMPLE:     '⛩️',
  MUSEUM:     '🏛️',
  MARKET:     '🛍️',
  PARK:       '🌳',
  MOUNTAIN:   '⛰️',
  CITY:       '🏙️',
  VILLAGE:    '🏡',
  RESTAURANT: '🍜',
  NIGHTLIFE:  '🎶',
  ADVENTURE:  '🧗',
  HISTORICAL: '🏯',
  OTHER:      '📍',
}

export interface Place {
  id: string; name: string; category: string; city: string
  latitude: number; longitude: number; inBucket: boolean
  description: string; image: string | null
}

interface Props {
  places:        Place[]
  initialCenter: [number, number]
  selectedId:    string | null
  onSelect:      (id: string | null) => void
  onBucket:      (id: string) => void
}

const CSS_ID = 'orbya-map-styles'

function injectMapCSS() {
  if (document.getElementById(CSS_ID)) return
  const style = document.createElement('style')
  style.id = CSS_ID
  style.textContent = `
    /* Leaflet attribution cleanup */
    .leaflet-control-attribution {
      background: rgba(255,255,255,0.75) !important;
      backdrop-filter: blur(6px);
      border-radius: 8px 0 0 0 !important;
      font-size: 9px !important;
      padding: 2px 6px !important;
      color: #9ca3af !important;
    }
    .leaflet-control-attribution a { color: #9ca3af !important; }

    /* Custom zoom control */
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
      border-radius: 14px !important;
      overflow: hidden;
    }
    .leaflet-control-zoom a {
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 18px !important;
      color: #374151 !important;
      background: rgba(255,255,255,0.95) !important;
      backdrop-filter: blur(8px);
      border: none !important;
      font-weight: 300 !important;
      transition: background 0.15s !important;
    }
    .leaflet-control-zoom a:hover { background: white !important; color: #111827 !important; }
    .leaflet-control-zoom-in  { border-bottom: 1px solid rgba(0,0,0,0.06) !important; }

    /* Remove tile seam artifacts */
    .leaflet-tile { border: 0 !important; }

    /* Pin keyframes */
    @keyframes pinPulse {
      0%   { transform: scale(0.8); opacity: 0.8; }
      100% { transform: scale(2.8); opacity: 0;   }
    }
    @keyframes pinBounce {
      0%   { transform: translateY(-6px) scale(1.08); }
      60%  { transform: translateY(1px) scale(0.97); }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes bucketGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5), 0 6px 20px rgba(0,0,0,0.3); }
      50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0), 0 6px 20px rgba(0,0,0,0.3); }
    }
  `
  document.head.appendChild(style)
}

function makePinHTML(place: Place, isSelected: boolean): string {
  const color  = place.inBucket ? '#EF4444' : (CATEGORY_COLOR[place.category] ?? '#6B7280')
  const emoji  = place.inBucket ? '❤️' : (CATEGORY_EMOJI[place.category] ?? '📍')
  const scale  = isSelected ? 1.25 : 1
  const zIndex = isSelected ? 'z-index:1000;' : ''

  // Outer pulse rings for selected state
  const pulseRings = isSelected ? `
    <div style="
      position:absolute;top:-10px;left:-10px;
      width:60px;height:60px;border-radius:50%;
      background:${color};opacity:0.25;
      animation:pinPulse 1.5s ease-out infinite;
    "></div>
    <div style="
      position:absolute;top:-10px;left:-10px;
      width:60px;height:60px;border-radius:50%;
      background:${color};opacity:0.18;
      animation:pinPulse 1.5s ease-out 0.5s infinite;
    "></div>
  ` : ''

  // Teardrop pin: rotated square with border-radius trick
  const glow = place.inBucket
    ? 'animation:bucketGlow 2s ease-in-out infinite;'
    : `box-shadow:0 6px 20px rgba(0,0,0,${isSelected ? '.4' : '.25'});`

  const bounce = isSelected ? 'animation:pinBounce 0.3s ease-out;' : ''

  return `
    <div style="
      position:relative;
      width:40px;height:40px;
      ${zIndex}
      transform:scale(${scale});
      transform-origin:center bottom;
      transition:transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
      ${bounce}
    ">
      ${pulseRings}
      <div style="
        width:40px;height:40px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2.5px solid white;
        ${glow}
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="
          transform:rotate(45deg);
          display:block;font-size:17px;line-height:1;
          margin-top:1px;
        ">${emoji}</span>
      </div>
      <!-- Pin shadow beneath tip -->
      <div style="
        position:absolute;bottom:-6px;left:50%;
        transform:translateX(-50%);
        width:8px;height:4px;
        background:rgba(0,0,0,0.15);
        border-radius:50%;
        filter:blur(2px);
      "></div>
    </div>
  `
}

function makeIcon(place: Place, isSelected: boolean) {
  return L.divIcon({
    className:  '',
    html:       makePinHTML(place, isSelected),
    iconSize:   [40, 52],
    iconAnchor: [20, 48],
    popupAnchor:[0, -50],
  })
}

export default function CountryMap({ places, initialCenter, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const markersRef   = useRef<Map<string, L.Marker>>(new Map())

  // Mount map once — initialCenter is server-computed so always correct
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    injectMapCSS()

    const map = L.map(containerRef.current, {
      center:          initialCenter,
      zoom:            places.length > 0 ? 7 : 6,
      zoomControl:     false,
      attributionControl: true,
      scrollWheelZoom: true,
    })

    L.tileLayer(TILE_URL, {
      attribution: ATTRIBUTION,
      maxZoom:     20,
      subdomains:  'abcd',
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Click on empty map = deselect
    map.on('click', () => onSelect(null))

    mapRef.current = map

    requestAnimationFrame(() => {
      map.invalidateSize()
      if (places.length > 1) {
        const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude] as [number, number]))
        map.fitBounds(bounds, { padding: [100, 100], maxZoom: 14 })
      } else if (places.length === 1) {
        map.setView([places[0].latitude, places[0].longitude], 13)
      }
    })

    return () => { map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Invalidate size when panel opens/closes (sizing changes)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const id = setTimeout(() => map.invalidateSize(), 60)
    return () => clearTimeout(id)
  })

  // Sync markers whenever place list or bucket/selected state changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const incoming = new Set(places.map((p) => p.id))

    // Remove stale markers
    markersRef.current.forEach((m, id) => {
      if (!incoming.has(id)) { m.remove(); markersRef.current.delete(id) }
    })

    places.forEach((place) => {
      const isSelected = place.id === selectedId
      const icon       = makeIcon(place, isSelected)
      const existing   = markersRef.current.get(place.id)

      if (existing) {
        existing.setIcon(icon)
        existing.setZIndexOffset(isSelected ? 500 : 0)
        return
      }

      const marker = L.marker(
        [place.latitude, place.longitude] as [number, number],
        { icon, zIndexOffset: isSelected ? 500 : 0 }
      )
        .addTo(map)
        .on('click', (e) => { L.DomEvent.stopPropagation(e); onSelect(place.id) })

      markersRef.current.set(place.id, marker)
    })
  }, [places, selectedId, onSelect])

  // Fly to selected marker with gentle animation
  useEffect(() => {
    const map   = mapRef.current
    if (!map || !selectedId) return
    const place = places.find((p) => p.id === selectedId)
    if (place) {
      const currentZoom = map.getZoom()
      map.flyTo(
        [place.latitude, place.longitude] as [number, number],
        Math.max(currentZoom, 13),
        { animate: true, duration: 0.6, easeLinearity: 0.35 }
      )
    }
  }, [selectedId, places])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  )
}
