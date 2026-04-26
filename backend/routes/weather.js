/**
 * Weather Routes
 * GET  /api/weather/:location
 * POST /api/weather/update   — fetch weather + send SMS
 */

const express = require('express');
const router = express.Router();
const { getWeather } = require('../services/weatherService');
const { sendSMS } = require('../services/smsService');

// ─── Get Weather ───────────────────────────────────────────────
router.get('/:location', async (req, res) => {
  try {
    const weather = await getWeather(req.params.location);
    res.json({ success: true, weather });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Send Weather Update via SMS ───────────────────────────────
router.post('/update', async (req, res) => {
  try {
    const { phone, location, name } = req.body;
    if (!phone || !location) {
      return res.status(400).json({ success: false, error: 'Phone and location required' });
    }

    const weather = await getWeather(location);

    let riskMsg = '';
    if (weather.condition === 'Rain' || weather.condition === 'Storm') {
      riskMsg = ' ⚠️ Caution: Poor driving conditions!';
    } else if (weather.condition === 'Fog') {
      riskMsg = ' ⚠️ Low visibility, drive slowly!';
    }

    const msg = `${weather.icon} Manzil AI Weather Update for ${location}: ${weather.condition} — ${weather.description}. Temp: ${weather.temp}°C, Wind: ${weather.windSpeed} km/h.${riskMsg}`;

    const smsEntry = await sendSMS(phone, msg);

    res.json({
      success: true,
      message: 'Weather update sent via SMS',
      weather,
      sms: smsEntry
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
