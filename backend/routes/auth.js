/**
 * Auth Routes — Registration & OTP verification
 * POST /api/auth/register
 * POST /api/auth/verify-otp
 */

const express = require('express');
const router = express.Router();

// In-memory user store (use MongoDB in production)
const users = new Map();
const otpStore = new Map();

// ─── Register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, phone, location } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Name and phone are required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min expiry

    // Store user (pending verification)
    users.set(phone, { name, phone, location, verified: false, createdAt: new Date() });

    console.log(`\n📲 [OTP] Phone: ${phone} → OTP: ${otp} (DEMO MODE - use this to verify)\n`);

    // In real mode, send OTP via Twilio
    if (process.env.USE_REAL_APIS === 'true') {
      const { sendSMS } = require('../services/smsService');
      await sendSMS(phone, `Your Manzil AI OTP is: ${otp}. Valid for 5 minutes.`);
    }

    res.json({
      success: true,
      message: 'OTP sent to your phone number',
      // In demo mode, return OTP for testing
      ...(process.env.USE_REAL_APIS !== 'true' && { demoOtp: otp })
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Verify OTP ────────────────────────────────────────────────
router.post('/verify-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Phone and OTP required' });
    }

    const stored = otpStore.get(phone);

    if (!stored) {
      return res.status(400).json({ success: false, error: 'OTP not found. Please register first.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ success: false, error: 'OTP expired. Please register again.' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    // Mark user as verified
    const user = users.get(phone);
    user.verified = true;
    users.set(phone, user);
    otpStore.delete(phone);

    res.json({
      success: true,
      message: 'Phone verified successfully!',
      user: { name: user.name, phone: user.phone, location: user.location }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Get User ──────────────────────────────────────────────────
router.get('/user/:phone', (req, res) => {
  const user = users.get(req.params.phone);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, user });
});

module.exports = router;
