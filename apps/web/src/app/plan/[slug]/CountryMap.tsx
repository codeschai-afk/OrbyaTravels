'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import BOUNDS_RAW from '../../../../public/maps/bounds.json'

const BOUNDS = BOUNDS_RAW as Record<string, {
  north: number; south: number; east: number; west: number
}>

export interface Place {
  id:             string
  name:           string
  category:       string
  city:           string
  latitude:       number
  longitude:      number
  inBucket:       boolean
  description:    string
  images:         string[]
  pin_importance: 'MAJOR' | 'MEDIUM' | 'MINOR'
}

interface Props {
  places:        Place[]
  countrySlug:   string
  initialCenter: [number, number]
  selectedId:    string | null
  onSelect:      (id: string | null) => void
  onBucket:      (id: string) => void
}

const CAT_COLOR: Record<string, string> = {
  BEACH: '#3B82F6', TEMPLE: '#7C3AED', MUSEUM: '#D97706', MARKET: '#059669',
  PARK: '#16A34A', MOUNTAIN: '#94A3B8', CITY: '#4F46E5', VILLAGE: '#65A30D',
  RESTAURANT: '#EA580C', NIGHTLIFE: '#DB2777', ADVENTURE: '#DC2626',
  HISTORICAL: '#CA8A04', OTHER: '#6B7280',
}
const CAT_EMOJI: Record<string, string> = {
  BEACH: '🏖️', TEMPLE: '⛩️', MUSEUM: '🏛️', MARKET: '🛍️', PARK: '🌳',
  MOUNTAIN: '⛰️', CITY: '🏙️', VILLAGE: '🏡', RESTAURANT: '🍜',
  NIGHTLIFE: '🎶', ADVENTURE: '🧗', HISTORICAL: '🏯', OTHER: '📍',
}

// ESRI satellite + label tiles — free, no API key required.
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
      maxzoom: 19,
    },
    labels: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    { id: 'satellite', type: 'raster', source: 'satellite' },
    { id: 'labels',    type: 'raster', source: 'labels', paint: { 'raster-opacity': 0.85 } },
  ],
}

// MAJOR always visible; MEDIUM at zoom ≥ 8; MINOR at zoom ≥ 10.5
function pinVisible(importance: string, zoom: number): boolean {
  if (importance === 'MINOR')  return zoom >= 10.5
  if (importance === 'MEDIUM') return zoom >= 8
  return true
}

function makeMarkerEl(place: Place, isSelected: boolean): HTMLElement {
  const color = place.inBucket ? '#EF4444' : (CAT_COLOR[place.category] ?? '#6B7280')
  const emoji = place.inBucket ? '❤️' : (CAT_EMOJI[place.category] ?? '📍')

  const el = document.createElement('div')
  el.style.cssText = `
    position: relative; width: 36px; height: 36px;
    transform: scale(${isSelected ? 1.35 : 1}) translateY(-18px);
    transform-origin: center bottom;
    transition: transform 0.2s cubic-bezier(.34,1.56,.64,1);
    cursor: pointer;
  `
  el.innerHTML = `
    <div style="
      width:36px;height:36px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2.5px solid white;
      box-shadow:0 4px 16px rgba(0,0,0,0.55);
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);font-size:15px;line-height:1;">${emoji}</span>
    </div>
    <div style="
      position:absolute;bottom:-4px;left:50%;
      transform:translateX(-50%);
      width:8px;height:4px;
      background:rgba(0,0,0,0.25);
      border-radius:50%;filter:blur(2px);
    "></div>
  `
  return el
}


export default function CountryMap({ places, countrySlug, initialCenter, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)
  const markersRef   = useRef<Map<string, maplibregl.Marker>>(new Map())
  // Track mapLoaded state to trigger marker sync only after map is ready
  const [mapLoaded, setMapLoaded] = useState(false)
  // Track zoom for importance-based visibility
  const [zoom, setZoom] = useState(6)

  const b = BOUNDS[countrySlug]

  // Map initialisation (runs once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const bounds: [number, number, number, number] | undefined = b
      ? [b.west, b.south, b.east, b.north]
      : undefined

    const map = new maplibregl.Map({
      container:  containerRef.current,
      style:      SATELLITE_STYLE,
      center:     [initialCenter[1], initialCenter[0]],
      zoom:       6,
      maxBounds:  bounds ? [bounds[0] - 1, bounds[1] - 1, bounds[2] + 1, bounds[3] + 1] : undefined,
      attributionControl: false,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      if (bounds) {
        map.fitBounds(bounds, { padding: 60, animate: false })
        map.setMinZoom(map.getZoom() - 0.5)
        setZoom(map.getZoom())
      }
      setMapLoaded(true)
    })

    map.on('zoom', () => setZoom(map.getZoom()))
    map.on('click', () => onSelect(null))

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
      setMapLoaded(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync markers — runs after map loads and whenever places / zoom / selection change
  useEffect(() => {
    const m = mapRef.current
    if (!m || !mapLoaded) return

    const ids = new Set(places.map((p) => p.id))

    // Remove markers for deleted places
    markersRef.current.forEach((marker, id) => {
      if (!ids.has(id)) { marker.remove(); markersRef.current.delete(id) }
    })

    places.forEach((place) => {
      const isSel    = place.id === selectedId
      const visible  = pinVisible(place.pin_importance, zoom)
      const existing = markersRef.current.get(place.id)

      if (existing) {
        const el = existing.getElement()
        el.style.display    = visible ? '' : 'none'
        el.style.transform  = `scale(${isSel ? 1.35 : 1}) translateY(-18px)`
        return
      }

      const el = makeMarkerEl(place, isSel)
      el.style.display = visible ? '' : 'none'
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelect(isSel ? null : place.id)
      })

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([place.longitude, place.latitude])
        .addTo(m)

      markersRef.current.set(place.id, marker)
    })
  }, [places, selectedId, onSelect, mapLoaded, zoom])

  // Fly to selected place
  useEffect(() => {
    const m = mapRef.current
    if (!m || !selectedId || !mapLoaded) return
    const p = places.find((x) => x.id === selectedId)
    if (p) m.flyTo({ center: [p.longitude, p.latitude], zoom: Math.max(m.getZoom(), 10), duration: 700 })
  }, [selectedId, places, mapLoaded])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Vignette — softens edges without hiding pins (zIndex 1 but pins are inside map container) */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse 75% 65% at 50% 48%, transparent 25%, rgba(7,9,15,0.15) 55%, rgba(7,9,15,0.5) 75%, #07090f 95%)',
      }} />
    </div>
  )
}
