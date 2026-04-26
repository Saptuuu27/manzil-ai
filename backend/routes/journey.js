/**
 * Journey Routes
 * POST /api/journey/start   — Start journey tracking
 * POST /api/journey/stop    — Stop journey
 * GET  /api/journey/status  — Get current journey status
 * GET  /api/journey/alerts  — Get all sent alerts
 */

const express = require('express');
const router = express.Router();
const { sendSMS } = require('../services/smsService');
const { analyzeRoute } = require('../services/aiService');
const { getWeather } = require('../services/weatherService');
const { generateMockRoute } = require('../services/routeService');

// Active journeys store
const activeJourneys = new Map();

// ─── Start Journey ─────────────────────────────────────────────
router.post('/start', async (req, res) => {
  try {
    const { phone, name, origin, destination } = req.body;

    if (!phone || !destination) {
      return res.status(400).json({ success: false, error: 'Phone and destination are required' });
    }

    // Stop existing journey if any
    if (activeJourneys.has(phone)) {
      clearInterval(activeJourneys.get(phone).intervalId);
    }

    // Generate route
    const route = generateMockRoute(origin || 'Current Location', destination);
    const alerts = [];

    console.log(`\n🚀 Journey started: ${name} (${phone}) → ${destination}`);
    console.log(`📍 Route: ${route.distance} | ~${route.duration}\n`);

    // Send initial journey start SMS
    const startMsg = `🚀 Manzil AI: Journey started! ${origin || 'Your location'} → ${destination}. Distance: ${route.distance}. Stay safe, ${name}!`;
    const startAlert = await sendSMS(phone, startMsg);
    alerts.push({ ...startAlert, type: 'journey_start' });

    // ── Background Tracking Loop ──────────────────────────────
    // Every 15 seconds, analyze route and send alerts (demo speed)
    let checkCount = 0;
    const intervalId = setInterval(async () => {
      checkCount++;

      // Stop after 10 checks (2.5 min in demo)
      if (checkCount > 10) {
        clearInterval(intervalId);
        const endMsg = `✅ Manzil AI: You have arrived at ${destination}! Journey complete. Stay safe!`;
        const endAlert = await sendSMS(phone, endMsg);
        const j = activeJourneys.get(phone);
        if (j) {
          j.alerts.push({ ...endAlert, type: 'journey_end' });
          j.status = 'completed';
        }
        return;
      }

      try {
        // Get weather for current waypoint
        const waypoint = route.waypoints[checkCount % route.waypoints.length];
        const weather = await getWeather(waypoint?.name || destination);

        // AI analyzes route safety
        const aiAlert = await analyzeRoute(route, weather, route.emergencySpots);

        // Send SMS alert
        const smsEntry = await sendSMS(phone, `Manzil AI: ${aiAlert.message}`);

        const j = activeJourneys.get(phone);
        if (j) {
          j.alerts.push({
            ...smsEntry,
            type: 'safety_alert',
            riskLevel: aiAlert.riskLevel,
            weather
          });
          j.currentWaypoint = waypoint;
          j.checksCompleted = checkCount;
        }

      } catch (err) {
        console.error('Alert loop error:', err.message);
      }

    }, 15000); // 15 seconds between alerts (demo)

    // Store journey state
    const journey = {
      phone, name, origin, destination,
      route, alerts,
      status: 'active',
      startedAt: new Date().toISOString(),
      intervalId, checksCompleted: 0
    };
    activeJourneys.set(phone, journey);

    res.json({
      success: true,
      message: 'Journey started! SMS alerts will be sent every 15 seconds.',
      journey: {
        destination, origin, route,
        status: 'active',
        startedAt: journey.startedAt
      }
    });

  } catch (err) {
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

    await sendSMS(phone, `🛑 Manzil AI: Journey tracking stopped. Stay safe!`);

    res.json({ success: true, message: 'Journey stopped', alerts: journey.alerts });

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
    route: journey.route,
    checksCompleted: journey.checksCompleted,
    alertCount: journey.alerts.length,
    currentWaypoint: journey.currentWaypoint,
    startedAt: journey.startedAt
  });
});

// ─── Get All Alerts ────────────────────────────────────────────
router.get('/alerts/:phone', (req, res) => {
  const journey = activeJourneys.get(req.params.phone);
  if (!journey) return res.json({ success: true, alerts: [] });
  res.json({ success: true, alerts: journey.alerts });
});

module.exports = router;
