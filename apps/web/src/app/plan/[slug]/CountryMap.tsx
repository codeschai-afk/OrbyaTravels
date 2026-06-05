'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon paths broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

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

const CATEGORY_ICON: Record<string, string> = {
  BEACH: '🏖️', TEMPLE: '⛩️', MUSEUM: '🏛️', MARKET: '🛒', PARK: '🌳',
  MOUNTAIN: '⛰️', CITY: '🏙️', VILLAGE: '🏡', RESTAURANT: '🍜',
  NIGHTLIFE: '🎶', ADVENTURE: '🧗', HISTORICAL: '🏯', OTHER: '📍',
}

interface Place {
  id: string; name: string; category: string; city: string
  latitude: number; longitude: number; inBucket: boolean; description: string
}

interface Props {
  places:     Place[]
  selectedId: string | null
  onSelect:   (id: string | null) => void
  onBucket:   (id: string) => void
}

export default function CountryMap({ places, selectedId, onSelect, onBucket }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const markersRef   = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const defaultCenter: [number, number] = places.length > 0
      ? [places.reduce((s, p) => s + p.latitude, 0) / places.length,
         places.reduce((s, p) => s + p.longitude, 0) / places.length]
      : [20, 0]

    const map = L.map(containerRef.current, { center: defaultCenter, zoom: 6, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync markers when places/bucket changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const existing = new Set(markersRef.current.keys())
    const current  = new Set(places.map((p) => p.id))

    // Remove stale markers
    existing.forEach((id) => {
      if (!current.has(id)) {
        markersRef.current.get(id)?.remove()
        markersRef.current.delete(id)
      }
    })

    places.forEach((place) => {
      const color = place.inBucket ? '#EF4444' : (CATEGORY_COLOR[place.category] ?? '#6B7280')
      const emoji = CATEGORY_ICON[place.category] ?? '📍'

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;">${emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

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

  // Pan to selected marker
  useEffect(() => {
    if (!selectedId || !mapRef.current) return
    const marker = markersRef.current.get(selectedId)
    const place  = places.find((p) => p.id === selectedId)
    if (marker && place) {
      mapRef.current.setView([place.latitude, place.longitude], Math.max(mapRef.current.getZoom(), 10), { animate: true })
    }
  }, [selectedId, places])

  return <div ref={containerRef} className="w-full h-full" />
}
