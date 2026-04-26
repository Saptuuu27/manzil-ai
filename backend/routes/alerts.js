/**
 * Alerts Routes
 * GET  /api/alerts/log         — full SMS log
 * POST /api/alerts/manual      — manually send an alert SMS
 */

const express = require('express');
const router = express.Router();
const { sendSMS, getSMSLog } = require('../services/smsService');

// ─── Get SMS Log ───────────────────────────────────────────────
router.get('/log', (req, res) => {
  res.json({ success: true, alerts: getSMSLog() });
});

// ─── Manual Alert ──────────────────────────────────────────────
router.post('/manual', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message required' });
    }
    const smsEntry = await sendSMS(phone, `Manzil AI: ${message}`);
    res.json({ success: true, sms: smsEntry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
