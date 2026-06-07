#!/usr/bin/env node
/**
 * Converts GeoJSON country borders → SVG path files + a bounding-box manifest.
 *
 * Output:
 *   public/maps/{slug}.svg   — the country outline as an SVG
 *   public/maps/bounds.json  — { slug: { north, south, east, west, w, h } }
 *
 * Projection: equirectangular (simple linear mapping).
 * This is intentional — it lets us place pins with:
 *   x = (lng - west)  / (east - west)  * svgWidth
 *   y = (north - lat) / (north - south) * svgHeight
 */

const fs   = require('fs')
const path = require('path')

const GEO_DIR  = path.join(__dirname, '../public/geodata')
const MAP_DIR  = path.join(__dirname, '../public/maps')
const SVG_W    = 1000   // fixed SVG canvas width

// ── helpers ──────────────────────────────────────────────────────────────────

function collectPoints(coords, out = []) {
  if (typeof coords[0] === 'number') { out.push(coords); return out }
  for (const c of coords) collectPoints(c, out)
  return out
}

function bbox(geojson) {
  let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity
  for (const feat of geojson.features) {
    for (const [lng, lat] of collectPoints(feat.geometry.coordinates)) {
      if (lng < w) w = lng
      if (lng > e) e = lng
      if (lat < s) s = lat
      if (lat > n) n = lat
    }
  }
  // add 5% padding on each side so the outline doesn't touch the SVG edge
  const dLng = (e - w) * 0.05
  const dLat = (n - s) * 0.05
  return { west: w - dLng, east: e + dLng, south: s - dLat, north: n + dLat }
}

function project(lng, lat, b, W, H) {
  const x = (lng - b.west)  / (b.east  - b.west)  * W
  const y = (b.north - lat) / (b.north - b.south) * H
  return [x, y]
}

function ringToPath(ring, b, W, H) {
  return ring.map(([lng, lat], i) => {
    const [x, y] = project(lng, lat, b, W, H)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ') + ' Z'
}

function geomToPath(geom, b, W, H) {
  if (geom.type === 'Polygon') {
    return geom.coordinates.map(ring => ringToPath(ring, b, W, H)).join(' ')
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.flatMap(poly =>
      poly.map(ring => ringToPath(ring, b, W, H))
    ).join(' ')
  }
  return ''
}

// ── main ─────────────────────────────────────────────────────────────────────

const manifest = {}

for (const file of fs.readdirSync(GEO_DIR)) {
  if (!file.endsWith('.json')) continue
  const slug = file.replace('.json', '')
  const geo  = JSON.parse(fs.readFileSync(path.join(GEO_DIR, file), 'utf8'))
  const b    = bbox(geo)

  // Preserve aspect ratio
  const aspect = (b.east - b.west) / (b.north - b.south)
  const H      = Math.round(SVG_W / aspect)

  // Build path data from all features
  const d = geo.features.map(f => geomToPath(f.geometry, b, SVG_W, H)).join(' ')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_W} ${H}" width="${SVG_W}" height="${H}">
  <path d="${d}" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.55)" stroke-width="1.5" stroke-linejoin="round"/>
</svg>`

  fs.writeFileSync(path.join(MAP_DIR, `${slug}.svg`), svg)
  manifest[slug] = { north: b.north, south: b.south, east: b.east, west: b.west, w: SVG_W, h: H }
  console.log(`✓ ${slug.padEnd(12)} bbox: ${b.south.toFixed(2)}–${b.north.toFixed(2)}N  ${b.west.toFixed(2)}–${b.east.toFixed(2)}E  (${SVG_W}×${H}px)`)
}

fs.writeFileSync(path.join(MAP_DIR, 'bounds.json'), JSON.stringify(manifest, null, 2))
console.log(`\nWrote ${Object.keys(manifest).length} SVGs + bounds.json`)
