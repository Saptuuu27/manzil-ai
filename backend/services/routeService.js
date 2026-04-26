/**
 * Route Service — Google Maps or Mock route generation
 */

const mockRoutes = {
  default: {
    waypoints: [
      { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
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
  }
};

function generateMockRoute(origin, destination) {
  const route = { ...mockRoutes.default };
  // Customize origin/destination labels
  route.origin = origin;
  route.destination = destination;
  // Add slight randomization to simulate real route
  route.duration = `${Math.floor(3 + Math.random() * 3)} hrs ${Math.floor(Math.random() * 60)} mins`;
  route.distance = `${Math.floor(150 + Math.random() * 300)} km`;
  return route;
}

module.exports = { generateMockRoute };
