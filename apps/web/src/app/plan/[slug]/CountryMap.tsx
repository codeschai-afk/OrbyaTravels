'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const TILE_URL   = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>'

const CATEGORY_COLOR: Record<string, string> = {
  BEACH: '#3B82F6', TEMPLE: '#8B5CF6', MUSEUM: '#F59E0B', MARKET: '#10B981',
  PARK: '#22C55E', MOUNTAIN: '#6B7280', CITY: '#6366F1', VILLAGE: '#84CC16',
  RESTAURANT: '#F97316', NIGHTLIFE: '#EC4899', ADVENTURE: '#EF4444',
  HISTORICAL: '#EAB308', OTHER: '#9CA3AF',
}

const CATEGORY_EMOJI: Record<string, string> = {
  BEACH: '🏖️', TEMPLE: '⛩️', MUSEUM: '🏛️', MARKET: '🛒', PARK: '🌳',
  MOUNTAIN: '⛰️', CITY: '🏙️', VILLAGE: '🏡', RESTAURANT: '🍜',
  NIGHTLIFE: '🎶', ADVENTURE: '🧗', HISTORICAL: '🏯', OTHER: '📍',
}

interface Place {
  id: string; name: string; category: string; city: string
  latitude: number; longitude: number; inBucket: boolean; description: string; image: string | null
}

interface Props {
  places:        Place[]
  initialCenter: [number, number]
  selectedId:    string | null
  onSelect:      (id: string | null) => void
  onBucket:      (id: string) => void
}

function makeIcon(place: Place) {
  const color = place.inBucket ? '#EF4444' : (CATEGORY_COLOR[place.category] ?? '#6B7280')
  const emoji = CATEGORY_EMOJI[place.category] ?? '📍'
  const shadow = place.inBucket ? '0 0 0 4px rgba(239,68,68,.25), 0 4px 14px rgba(0,0,0,.3)' : '0 4px 12px rgba(0,0,0,.25)'

  return L.divIcon({
    className: '',
    html: `<div style="
      width:44px;height:44px;border-radius:50%;background:${color};
      border:3px solid white;box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      font-size:20px;cursor:pointer;
      transform:${place.inBucket ? 'scale(1.15)' : 'scale(1)'};
      transition:transform .2s;
    ">${emoji}</div>`,
    iconSize:   [44, 44],
    iconAnchor: [22, 22],
  })
}

export default function CountryMap({ places, initialCenter, selectedId, onSelect, onBucket }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const markersRef   = useRef<Map<string, L.Marker>>(new Map())

  // Init map once, using server-calculated initialCenter
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center:      initialCenter,
      zoom:        places.length > 0 ? 7 : 6,
      zoomControl: false,
    })

    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19, subdomains: 'abcd' }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapRef.current = map

    // Critical: force Leaflet to recalculate container size after render
    requestAnimationFrame(() => {
      map.invalidateSize()

      // If multiple places, fit bounds after size is known
      if (places.length > 1) {
        const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude] as [number, number]))
        map.fitBounds(bounds, { padding: [80, 80] })
      }
    })

    return () => { map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Also invalidate size whenever the component receives new dimensions (e.g. panel opens)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const id = setTimeout(() => map.invalidateSize(), 50)
    return () => clearTimeout(id)
  })

  // Sync markers when places/bucket state changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const incoming = new Set(places.map((p) => p.id))

    markersRef.current.forEach((m, id) => {
      if (!incoming.has(id)) { m.remove(); markersRef.current.delete(id) }
    })

    places.forEach((place) => {
      const icon     = makeIcon(place)
      const existing = markersRef.current.get(place.id)
      if (existing) { existing.setIcon(icon); return }

      const marker = L.marker([place.latitude, place.longitude] as [number, number], { icon })
        .addTo(map)
        .on('click', () => onSelect(place.id))

      markersRef.current.set(place.id, marker)
    })
  }, [places, onSelect])

  // Fly to selected marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const place = places.find((p) => p.id === selectedId)
    if (place) {
      map.flyTo([place.latitude, place.longitude] as [number, number], Math.max(map.getZoom(), 12), { animate: true, duration: 0.7 })
    }
  }, [selectedId, places])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
