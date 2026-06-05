'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ESRI World Physical Map — topographic relief, green terrain, blue water
// Matches the ref image style: land relief + ocean gradient
const TILE_URL   = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}'
const ATTRIBUTION = 'Tiles &copy; <a href="https://www.esri.com" target="_blank">Esri</a>, sources: USGS, FAO, NOAA, EPA, NPS'

// Dark page background that the vignette fades to
const BG = 'rgba(7,9,15,1)'

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
  const s = document.createElement('style')
  s.id = CSS_ID
  s.textContent = `
    /* Attribution */
    .leaflet-control-attribution {
      background: rgba(7,9,15,0.55) !important;
      backdrop-filter: blur(8px);
      border-radius: 8px 0 0 0 !important;
      font-size: 9px !important;
      padding: 3px 8px !important;
      color: rgba(255,255,255,0.35) !important;
      border: none !important;
    }
    .leaflet-control-attribution a { color: rgba(255,255,255,0.45) !important; }

    /* Zoom control */
    .leaflet-control-zoom {
      border: none !important;
      border-radius: 14px !important;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3) !important;
    }
    .leaflet-control-zoom a {
      width: 38px !important; height: 38px !important;
      line-height: 38px !important; font-size: 20px !important;
      color: rgba(255,255,255,0.85) !important;
      background: rgba(14,18,32,0.8) !important;
      backdrop-filter: blur(12px);
      border: none !important; font-weight: 200 !important;
      transition: background 0.15s, color 0.15s !important;
    }
    .leaflet-control-zoom a:hover {
      background: rgba(30,40,70,0.9) !important;
      color: white !important;
    }
    .leaflet-control-zoom-in { border-bottom: 1px solid rgba(255,255,255,0.08) !important; }

    /* Tile rendering */
    .leaflet-tile { border: 0 !important; }
    .leaflet-tile-pane {
      filter: contrast(1.06) saturate(1.12) brightness(0.92);
    }

    /* Keyframes */
    @keyframes pinPulse {
      0%   { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(3.2); opacity: 0;   }
    }
    @keyframes pinBounce {
      0%   { transform: translateY(-8px) scale(1.1); }
      55%  { transform: translateY(1px) scale(0.97); }
      100% { transform: translateY(0) scale(1); }
    }
    @keyframes bucketPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6), 0 6px 20px rgba(0,0,0,.4); }
      50%       { box-shadow: 0 0 0 10px rgba(239,68,68,0), 0 6px 20px rgba(0,0,0,.4); }
    }
  `
  document.head.appendChild(s)
}

function pinHTML(place: Place, isSelected: boolean): string {
  const color = place.inBucket ? '#EF4444' : (CATEGORY_COLOR[place.category] ?? '#6B7280')
  const emoji = place.inBucket ? '❤️' : (CATEGORY_EMOJI[place.category] ?? '📍')

  const pulses = isSelected ? `
    <div style="
      position:absolute;top:-12px;left:-12px;
      width:64px;height:64px;border-radius:50%;
      background:${color};
      animation:pinPulse 1.6s ease-out infinite;
    "></div>
    <div style="
      position:absolute;top:-12px;left:-12px;
      width:64px;height:64px;border-radius:50%;
      background:${color};
      animation:pinPulse 1.6s ease-out 0.55s infinite;
    "></div>` : ''

  const shadow = place.inBucket
    ? 'animation:bucketPulse 2.2s ease-in-out infinite;'
    : `box-shadow:0 6px 22px rgba(0,0,0,${isSelected ? '0.55' : '0.35'}),inset 0 0 0 2.5px rgba(255,255,255,0.3);`

  const bounce = isSelected ? 'animation:pinBounce 0.35s cubic-bezier(.34,1.56,.64,1);' : ''
  const scale  = isSelected ? 1.3 : 1.0

  return `<div style="
    position:relative;
    width:40px;height:40px;
    transform:scale(${scale});
    transform-origin:center bottom;
    transition:transform 0.25s cubic-bezier(.34,1.56,.64,1);
    ${bounce}
  ">
    ${pulses}
    <div style="
      width:40px;height:40px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      ${shadow}
      position:relative;z-index:1;
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);display:block;font-size:17px;line-height:1;margin-top:2px;">${emoji}</span>
    </div>
    <div style="
      position:absolute;bottom:-5px;left:50%;
      transform:translateX(-50%);
      width:10px;height:5px;
      background:rgba(0,0,0,0.2);
      border-radius:50%;filter:blur(2px);
    "></div>
  </div>`
}

function makeIcon(place: Place, isSelected: boolean) {
  return L.divIcon({
    className:   '',
    html:        pinHTML(place, isSelected),
    iconSize:    [40, 52],
    iconAnchor:  [20, 50],
    popupAnchor: [0, -52],
  })
}

export default function CountryMap({ places, initialCenter, selectedId, onSelect }: Props) {
  const wrapRef    = useRef<HTMLDivElement>(null)
  const mapRef     = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  // Mount once — initialCenter is server-computed
  useEffect(() => {
    if (!wrapRef.current || mapRef.current) return

    injectMapCSS()

    const map = L.map(wrapRef.current, {
      center:         initialCenter,
      zoom:           places.length > 0 ? 7 : 5,
      zoomControl:    false,
      attributionControl: true,
    })

    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    map.on('click', () => onSelect(null))

    mapRef.current = map

    requestAnimationFrame(() => {
      map.invalidateSize()
      if (places.length > 1) {
        map.fitBounds(
          L.latLngBounds(places.map((p) => [p.latitude, p.longitude] as [number, number])),
          { padding: [120, 120], maxZoom: 13 }
        )
      } else if (places.length === 1) {
        map.setView([places[0].latitude, places[0].longitude], 12)
      }
    })

    return () => { map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-invalidate on any re-render (panel open/close changes layout)
  useEffect(() => {
    const m = mapRef.current
    if (!m) return
    const id = setTimeout(() => m.invalidateSize(), 60)
    return () => clearTimeout(id)
  })

  // Sync markers
  useEffect(() => {
    const m = mapRef.current
    if (!m) return

    const ids = new Set(places.map((p) => p.id))
    markersRef.current.forEach((mk, id) => {
      if (!ids.has(id)) { mk.remove(); markersRef.current.delete(id) }
    })

    places.forEach((place) => {
      const isSel = place.id === selectedId
      const icon  = makeIcon(place, isSel)
      const mk    = markersRef.current.get(place.id)

      if (mk) {
        mk.setIcon(icon)
        mk.setZIndexOffset(isSel ? 500 : 0)
      } else {
        const m2 = L.marker(
          [place.latitude, place.longitude] as [number, number],
          { icon, zIndexOffset: isSel ? 500 : 0 }
        )
          .addTo(m)
          .on('click', (e) => { L.DomEvent.stopPropagation(e); onSelect(place.id) })
        markersRef.current.set(place.id, m2)
      }
    })
  }, [places, selectedId, onSelect])

  // Fly to selected
  useEffect(() => {
    const m = mapRef.current
    if (!m || !selectedId) return
    const p = places.find((x) => x.id === selectedId)
    if (p) {
      m.flyTo(
        [p.latitude, p.longitude] as [number, number],
        Math.max(m.getZoom(), 13),
        { animate: true, duration: 0.65, easeLinearity: 0.3 }
      )
    }
  }, [selectedId, places])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Leaflet container */}
      <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Dark vignette — fades terrain edges into the page background.
          z-index 400 = above tiles (200), below markers (600) and controls (800+).
          The alpha at 100% matches the page bg-[#07090f] exactly. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(
            ellipse 66% 56% at 50% 44%,
            transparent 15%,
            rgba(7,9,15,0.38) 50%,
            rgba(7,9,15,0.72) 72%,
            rgba(7,9,15,0.93) 88%,
            ${BG} 100%
          )`,
          pointerEvents: 'none',
          zIndex: 400,
        }}
      />
    </div>
  )
}
