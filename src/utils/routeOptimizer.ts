export interface LatLng {
  lat: number
  lng: number
}

export interface RouteStop {
  orderId: string
  address: string
  latLng: LatLng | null
  distanceFromPrev: number // km
}

// Haversine distance in km
export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

// Geocode an address using Nominatim (OpenStreetMap) - free, no API key
const geocodeCache = new Map<string, LatLng | null>()

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase()
  if (geocodeCache.has(key)) return geocodeCache.get(key)!

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR' },
    })
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const result: LatLng = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      geocodeCache.set(key, result)
      return result
    }
    geocodeCache.set(key, null)
    return null
  } catch {
    geocodeCache.set(key, null)
    return null
  }
}

// Nearest-neighbor optimization
export function optimizeRoute(origin: LatLng, stops: { id: string; latLng: LatLng }[]): string[] {
  const remaining = [...stops]
  const ordered: string[] = []
  let current = origin

  while (remaining.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const dist = haversine(current, remaining[i].latLng)
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }
    const next = remaining.splice(nearestIdx, 1)[0]
    ordered.push(next.id)
    current = next.latLng
  }

  return ordered
}

// Build Google Maps directions URL with waypoints
export function buildGoogleMapsUrl(origin: LatLng, orderedStops: LatLng[]): string {
  if (orderedStops.length === 0) return ''
  const originStr = `${origin.lat},${origin.lng}`
  const destination = orderedStops[orderedStops.length - 1]
  const waypoints = orderedStops.slice(0, -1).map((s) => `${s.lat},${s.lng}`).join('|')
  let url = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destination.lat},${destination.lng}&travelmode=driving`
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`
  return url
}

// Build Waze URL for a single destination
export function buildWazeUrl(stop: LatLng): string {
  return `https://waze.com/ul?ll=${stop.lat},${stop.lng}&navigate=yes`
}

// Full route optimization pipeline
export async function calculateOptimizedRoute(
  origin: LatLng,
  stops: { id: string; address: string }[]
): Promise<{ orderedIds: string[]; stops: RouteStop[]; googleMapsUrl: string }> {
  // Geocode all stops
  const geocoded: { id: string; address: string; latLng: LatLng | null }[] = []
  for (const stop of stops) {
    const latLng = await geocodeAddress(stop.address)
    geocoded.push({ ...stop, latLng })
    // Rate limit: 1 req/sec for Nominatim
    await new Promise((r) => setTimeout(r, 1100))
  }

  const validStops = geocoded.filter((s) => s.latLng !== null) as { id: string; address: string; latLng: LatLng }[]
  const invalidStops = geocoded.filter((s) => s.latLng === null)

  // Optimize order for valid stops
  const orderedIds = optimizeRoute(origin, validStops.map((s) => ({ id: s.id, latLng: s.latLng })))

  // Build route stops with distances
  const routeStops: RouteStop[] = []
  let current = origin
  for (const id of orderedIds) {
    const stop = validStops.find((s) => s.id === id)!
    const dist = haversine(current, stop.latLng)
    routeStops.push({ orderId: id, address: stop.address, latLng: stop.latLng, distanceFromPrev: dist })
    current = stop.latLng
  }
  // Add invalid stops at the end
  for (const stop of invalidStops) {
    routeStops.push({ orderId: stop.id, address: stop.address, latLng: null, distanceFromPrev: 0 })
  }

  const validLatLngs = orderedIds.map((id) => validStops.find((s) => s.id === id)!.latLng)
  const googleMapsUrl = validLatLngs.length > 0 ? buildGoogleMapsUrl(origin, validLatLngs) : ''

  return { orderedIds, stops: routeStops, googleMapsUrl }
}