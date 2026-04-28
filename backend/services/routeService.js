/**
 * Route Service — OpenRouteService (FREE, no CC needed) + Overpass API for emergency spots
 * OpenRouteService: https://openrouteservice.org → free 2000 req/day
 * Overpass API: OpenStreetMap-based, completely free, no key needed
 */

const axios = require('axios');

// ─── Mock Fallback ─────────────────────────────────────────────
const mockRoute = {
  waypoints: [
    { lat: 28.6139, lng: 77.2090, name: 'New Delhi' },
    { lat: 28.7041, lng: 77.1025, name: 'Rohini' },
    { lat: 29.0461, lng: 76.8461, name: 'Rohtak' },
    { lat: 29.3909, lng: 76.9635, name: 'Panipat' },
    { lat: 30.3398, lng: 76.3869, name: 'Ambala' },
    { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
  ],
  distance: '250 km',
  duration: '4 hrs 30 mins',
  emergencySpots: [
    { type: 'hospital', name: 'Civil Hospital Rohtak', lat: 28.8955, lng: 76.6066, distance: '45km' },
    { type: 'hospital', name: 'General Hospital Ambala', lat: 30.3782, lng: 76.7767, distance: '180km' },
    { type: 'police', name: 'Panipat Police Station', lat: 29.3909, lng: 76.9635, distance: '120km' },
    { type: 'police', name: 'Chandigarh Sector 17 Police', lat: 30.7411, lng: 76.7875, distance: '248km' },
  ]
};

function generateMockRoute(origin, destination) {
  return {
    ...mockRoute,
    origin,
    destination,
    duration: `${Math.floor(3 + Math.random() * 3)} hrs ${Math.floor(Math.random() * 60)} mins`,
    distance: `${Math.floor(150 + Math.random() * 300)} km`,
  };
}

// ─── Geocode city name → [lng, lat] using Nominatim (free) ────
async function geocode(place) {
  const resp = await axios.get('https://nominatim.openstreetmap.org/search', {
    params: { q: place, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'ManzilAI-SafetyApp/1.0' },
    timeout: 6000,
  });
  if (!resp.data?.length) throw new Error(`Could not geocode: ${place}`);
  const { lon, lat } = resp.data[0];
  return [parseFloat(lon), parseFloat(lat)];
}

// ─── OpenRouteService Directions (FREE, no CC) ─────────────────
async function getRealRoute(origin, destination) {
  const key = process.env.ORS_API_KEY;

  // Geocode both locations
  const [originCoords, destCoords] = await Promise.all([
    geocode(origin),
    geocode(destination),
  ]);

  const resp = await axios.post(
    'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
    {
      coordinates: [originCoords, destCoords],
      instructions: true,
      language: 'en',
      units: 'km',
    },
    {
      headers: {
        'Authorization': key,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  const feature = resp.data.features[0];
  const props   = feature.properties;
  const seg     = props.segments[0];
  const coords  = feature.geometry.coordinates; // [lng, lat] pairs

  // Sample up to 8 waypoints from the route geometry
  const step = Math.max(1, Math.floor(coords.length / 8));
  const waypoints = coords
    .filter((_, i) => i % step === 0)
    .slice(0, 8)
    .map((c, i) => ({
      lat: c[1], lng: c[0],
      name: seg.steps[i]
        ? stripHtml(seg.steps[i].instruction)
        : `Waypoint ${i + 1}`,
    }));

  const distKm  = (props.summary.distance).toFixed(1);
  const durMins = Math.round(props.summary.duration / 60);
  const durStr  = durMins >= 60
    ? `${Math.floor(durMins / 60)} hrs ${durMins % 60} mins`
    : `${durMins} mins`;

  console.log(`🗺️ [ORS] Route: ${distKm} km | ${durStr}`);

  return {
    origin,
    destination,
    distance: `${distKm} km`,
    duration: durStr,
    waypoints,
    polyline: coords,      // raw [lng,lat] array for Leaflet
    emergencySpots: [],    // filled by Overpass below
  };
}

// ─── Overpass API — nearby hospitals & police (100% free) ──────
async function getNearbyEmergencySpots(lat, lng) {
  const radius = 10000; // 10km
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      way["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="police"](around:${radius},${lat},${lng});
      way["amenity"="police"](around:${radius},${lat},${lng});
    );
    out center 10;
  `;

  const resp = await axios.post(
    'https://overpass-api.de/api/interpreter',
    `data=${encodeURIComponent(query)}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
  );

  const spots = [];
  for (const el of (resp.data.elements || [])) {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (!elLat || !elLng) continue;
    const dist = getDistanceKm(lat, lng, elLat, elLng);
    const amenity = el.tags?.amenity;
    if (amenity === 'hospital' || amenity === 'police') {
      spots.push({
        type:     amenity === 'hospital' ? 'hospital' : 'police',
        name:     el.tags?.name || (amenity === 'hospital' ? 'Hospital' : 'Police Station'),
        lat:      elLat,
        lng:      elLng,
        distance: `${dist.toFixed(1)}km`,
        address:  el.tags?.['addr:street'] || '',
      });
    }
    if (spots.length >= 6) break;
  }

  return spots;
}

// ─── Haversine distance ────────────────────────────────────────
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function toRad(v) { return v * Math.PI / 180; }
function stripHtml(html) { return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim(); }

// ─── Main Exported Function ────────────────────────────────────
async function getRoute(origin, destination) {
  if (process.env.ORS_API_KEY && process.env.USE_REAL_APIS === 'true') {
    try {
      const route = await getRealRoute(origin, destination);

      // Sample 4 evenly-spaced points along the route for emergency spots
      if (route.waypoints.length > 0) {
        const wps = route.waypoints;
        const indices = [
          0,
          Math.floor(wps.length * 0.33),
          Math.floor(wps.length * 0.66),
          wps.length - 1,
        ].filter((v, i, arr) => arr.indexOf(v) === i); // dedupe indices

        try {
          // Query all sample points in parallel
          const spotsArrays = await Promise.all(
            indices.map(i => getNearbyEmergencySpots(wps[i].lat, wps[i].lng))
          );

          // Flatten + deduplicate by name (avoid same hospital showing twice)
          const seen = new Set();
          const allSpots = [];
          for (const spots of spotsArrays) {
            for (const sp of spots) {
              const key = sp.name.toLowerCase().trim();
              if (!seen.has(key)) {
                seen.add(key);
                allSpots.push(sp);
              }
            }
          }

          // Sort: hospitals first, then police; within each type sort by distance
          allSpots.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'hospital' ? -1 : 1;
            return parseFloat(a.distance) - parseFloat(b.distance);
          });

          route.emergencySpots = allSpots.slice(0, 8);
          console.log(`🏥 [Overpass] Found ${route.emergencySpots.length} route-based emergency spots`);
        } catch (e) {
          console.warn('Overpass API failed:', e.message);
          route.emergencySpots = mockRoute.emergencySpots;
        }
      }

      return route;
    } catch (err) {
      console.warn('⚠️ ORS routing failed, using mock route:', err.message);
    }
  }
  return generateMockRoute(origin, destination);
}

module.exports = { getRoute, generateMockRoute, getNearbyEmergencySpots };
