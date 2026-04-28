/**
 * Journey Routes
 * POST /api/journey/start   — Start journey tracking with real route
 * POST /api/journey/stop    — Stop journey
 * GET  /api/journey/status  — Get current journey status
 * GET  /api/journey/alerts  — Get all sent alerts
 */

const express = require('express');
const router = express.Router();
const { sendSMS } = require('../services/smsService');
const { analyzeRoute } = require('../services/aiService');
const { getWeather, getWeatherForCoords } = require('../services/weatherService');
const { getRoute, getNearbyEmergencySpots } = require('../services/routeService');

// ─── Active journeys store (in-memory) ────────────────────────
const activeJourneys = new Map();

// ─── Start Journey ─────────────────────────────────────────────
router.post('/start', async (req, res) => {
  try {
    const { phone, name, origin, destination } = req.body;

    if (!phone || !destination) {
      return res.status(400).json({ success: false, error: 'Phone and destination are required' });
    }

    // Stop any existing journey for this user
    if (activeJourneys.has(phone)) {
      clearInterval(activeJourneys.get(phone).intervalId);
      activeJourneys.delete(phone);
    }

    console.log(`\n🚀 Journey started: ${name} (${phone})`);
    console.log(`📍 ${origin || 'Current Location'} → ${destination}\n`);

    // ── Fetch real route (Google Maps or mock) ─────────────────
    const route = await getRoute(origin || 'Delhi', destination);
    const alerts = [];

    // ── Send journey start SMS ─────────────────────────────────
    const startMsg = `🚀 Manzil AI: Journey started! ${route.origin?.split(',')[0] || origin} → ${destination}. Distance: ${route.distance}, ETA: ${route.duration}. Stay safe, ${name}! 🧭`;
    let startAlert;
    try {
      startAlert = await sendSMS(phone, startMsg);
      alerts.push({ ...startAlert, type: 'journey_start', message: startMsg });
    } catch (e) {
      console.warn('⚠️ Journey start SMS failed, continuing anyway:', e.message);
      alerts.push({ status: 'failed', provider: 'none', type: 'journey_start', message: startMsg });
    }

    // ── Background Alert Loop ──────────────────────────────────
    let checkCount = 0;
    const intervalId = setInterval(async () => {
      checkCount++;
      const j = activeJourneys.get(phone);
      if (!j || j.status !== 'active') {
        clearInterval(intervalId);
        return;
      }

      // Auto-complete after 10 checks (2.5 min demo)
      if (checkCount > 10) {
        clearInterval(intervalId);
        const endMsg = `✅ Manzil AI: You've arrived at ${destination}! Journey complete in ${route.duration}. Stay safe, ${name}! 🏁`;
        const endAlert = await sendSMS(phone, endMsg);
        j.alerts.push({ ...endAlert, type: 'journey_end', message: endMsg });
        j.status = 'completed';
        return;
      }

      try {
        // Pick current waypoint based on progress
        const wpIndex = checkCount % (route.waypoints?.length || 1);
        const waypoint = route.waypoints?.[wpIndex] || { name: destination };

        // Get real-time weather for this waypoint
        let weather;
        if (waypoint.lat && waypoint.lng) {
          weather = await getWeatherForCoords(waypoint.lat, waypoint.lng);
        } else {
          weather = await getWeather(waypoint.name || destination);
        }

        // Get nearby emergency spots for this waypoint
        let nearbySpots = route.emergencySpots || [];
        if (process.env.USE_REAL_APIS === 'true' && waypoint.lat) {
          nearbySpots = await getNearbyEmergencySpots(waypoint.lat, waypoint.lng);
        }

        // AI analyzes the route safety
        const aiAlert = await analyzeRoute(
          { origin: route.origin, destination, distance: route.distance, duration: route.duration },
          weather,
          nearbySpots
        );

        const smsBody = `Manzil AI: ${aiAlert.message}`;
        const smsEntry = await sendSMS(phone, smsBody);

        j.alerts.push({
          ...smsEntry,
          message: smsBody,
          type: 'safety_alert',
          riskLevel: aiAlert.riskLevel,
          weather,
          waypoint: waypoint.name,
        });
        j.currentWaypoint = waypoint;
        j.checksCompleted = checkCount;

      } catch (err) {
        console.error(`Alert loop error (check ${checkCount}):`, err.message);
      }

    }, 15000); // Alert every 15 seconds

    // ── Store journey state ────────────────────────────────────
    const journey = {
      phone, name,
      origin: route.origin || origin,
      destination,
      route,
      alerts,
      status: 'active',
      startedAt: new Date().toISOString(),
      intervalId,
      checksCompleted: 0,
    };
    activeJourneys.set(phone, journey);

    res.json({
      success: true,
      message: 'Journey started! SMS alerts will be sent every 15 seconds.',
      journey: {
        destination,
        origin: route.origin || origin,
        route,
        status: 'active',
        startedAt: journey.startedAt,
      }
    });

  } catch (err) {
    console.error('Start journey error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Stop Journey ──────────────────────────────────────────────
router.post('/stop', async (req, res) => {
  try {
    const { phone } = req.body;
    const journey = activeJourneys.get(phone);

    if (!journey) {
      return res.status(404).json({ success: false, error: 'No active journey found' });
    }

    clearInterval(journey.intervalId);
    journey.status = 'stopped';

    const stopMsg = `🛑 Manzil AI: Journey to ${journey.destination} stopped. You've traveled approx. ${journey.route?.distance}. Stay safe, ${journey.name}!`;
    try {
      await sendSMS(phone, stopMsg);
    } catch (e) {
      console.warn('⚠️ Journey stop SMS failed:', e.message);
    }

    res.json({
      success: true,
      message: 'Journey stopped',
      summary: {
        destination: journey.destination,
        checksCompleted: journey.checksCompleted,
        alertsSent: journey.alerts.length,
        duration: journey.startedAt,
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Journey Status ────────────────────────────────────────────
router.get('/status/:phone', (req, res) => {
  const journey = activeJourneys.get(req.params.phone);
  if (!journey) {
    return res.json({ success: true, status: 'no_journey', alerts: [] });
  }
  res.json({
    success: true,
    status: journey.status,
    destination: journey.destination,
    origin: journey.origin,
    route: journey.route,
    checksCompleted: journey.checksCompleted,
    alertCount: journey.alerts.length,
    currentWaypoint: journey.currentWaypoint,
    startedAt: journey.startedAt,
  });
});

// ─── Get All Alerts ────────────────────────────────────────────
router.get('/alerts/:phone', (req, res) => {
  const journey = activeJourneys.get(req.params.phone);
  if (!journey) return res.json({ success: true, alerts: [] });
  res.json({ success: true, alerts: journey.alerts });
});

module.exports = router;
