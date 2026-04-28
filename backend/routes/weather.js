/**
 * Weather Routes
 * POST /api/weather/update — Fetch weather and optionally send via SMS
 */

const express = require('express');
const router = express.Router();
const { getWeather } = require('../services/weatherService');
const { sendSMS } = require('../services/smsService');

router.post('/update', async (req, res) => {
  try {
    const { phone, location, name } = req.body;

    if (!location) {
      return res.status(400).json({ success: false, error: 'Location is required' });
    }

    const weather = await getWeather(location);

    // Send weather SMS if phone provided
    if (phone) {
      const visibilityStr = weather.visibility != null ? `, Visibility: ${weather.visibility}km` : '';
      const msg = `${weather.icon} Manzil AI Weather Update for ${weather.cityName || location}: ${weather.condition} — ${weather.temp}°C (feels ${weather.feelsLike || weather.temp}°C), Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed}km/h${visibilityStr}. Drive safely, ${name || 'traveler'}!`;
      await sendSMS(phone, msg);
    }

    res.json({
      success: true,
      weather,
      location: weather.cityName || location,
    });

  } catch (err) {
    console.error('Weather route error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET weather (no SMS)
router.get('/current/:location', async (req, res) => {
  try {
    const weather = await getWeather(req.params.location);
    res.json({ success: true, weather });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
