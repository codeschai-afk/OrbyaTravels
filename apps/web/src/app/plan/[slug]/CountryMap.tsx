'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// CartoDB Voyager — polished, readable, travel-appropriate
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>'

const CATEGORY_COLOR: Record<string, string> = {
  BEACH:      '#3B82F6',
  TEMPLE:     '#8B5CF6',
  MUSEUM:     '#F59E0B',
  MARKET:     '#10B981',
  PARK:       '#22C55E',
  MOUNTAIN:   '#6B7280',
  CITY:       '#6366F1',
  VILLAGE:    '#84CC16',
  RESTAURANT: '#F97316',
  NIGHTLIFE:  '#EC4899',
  ADVENTURE:  '#EF4444',
  HISTORICAL: '#EAB308',
  OTHER:      '#9CA3AF',
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
  places:     Place[]
  selectedId: string | null
  onSelect:   (id: string | null) => void
  onBucket:   (id: string) => void
}

function makeIcon(place: Place) {
  const color = place.inBucket ? '#EF4444' : (CATEGORY_COLOR[place.category] ?? '#6B7280')
  const emoji = CATEGORY_EMOJI[place.category] ?? '📍'
  const ring  = place.inBucket ? '3px solid #FCA5A5' : '3px solid white'
  const scale = place.inBucket ? 'scale(1.15)' : 'scale(1)'

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:44px;height:44px;border-radius:50%;background:${color};
        border:${ring};box-shadow:0 4px 12px rgba(0,0,0,.25);
        display:flex;align-items:center;justify-content:center;
        font-size:20px;cursor:pointer;transition:transform .15s;
        transform:${scale};
      ">${emoji}</div>`,
    iconSize:   [44, 44],
    iconAnchor: [22, 22],
  })
}

export default function CountryMap({ places, selectedId, onSelect, onBucket }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const markersRef   = useRef<Map<string, L.Marker>>(new Map())

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const lats = places.map((p) => p.latitude)
    const lngs = places.map((p) => p.longitude)
    const center: [number, number] = places.length > 0
      ? [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2]
      : [20, 80]

    const map = L.map(containerRef.current, {
      center,
      zoom: places.length > 0 ? 6 : 5,
      zoomControl: false,
    })

    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19, subdomains: 'abcd' }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Auto-fit bounds if multiple places
    if (places.length > 1) {
      const bounds = L.latLngBounds(places.map((p) => [p.latitude, p.longitude]))
      map.fitBounds(bounds, { padding: [60, 60] })
    }

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const incoming = new Set(places.map((p) => p.id))

    // Remove stale
    markersRef.current.forEach((m, id) => {
      if (!incoming.has(id)) { m.remove(); markersRef.current.delete(id) }
    })

    places.forEach((place) => {
      const icon     = makeIcon(place)
      const existing = markersRef.current.get(place.id)

      if (existing) {
        existing.setIcon(icon)
        return
      }

      const marker = L.marker([place.latitude, place.longitude], { icon })
        .addTo(map)
        .on('click', () => onSelect(place.id))

      markersRef.current.set(place.id, marker)
    })
  }, [places, onSelect])

  // Pan + zoom to selected
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const place = places.find((p) => p.id === selectedId)
    if (place) {
      map.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 11), { animate: true, duration: 0.8 })
    }
  }, [selectedId, places])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
