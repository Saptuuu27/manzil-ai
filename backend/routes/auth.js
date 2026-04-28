/**
 * Auth Routes — Registration & OTP verification
 * POST /api/auth/register    — Register user, send OTP (real Twilio or demo)
 * POST /api/auth/verify-otp  — Verify OTP and return user profile
 * GET  /api/auth/user/:phone — Get user by phone
 */

const express = require('express');
const router = express.Router();

// ─── In-memory store ──────────────────────────────────────────
// In production: replace with MongoDB/Firestore
const users    = new Map();
const otpStore = new Map();

// ─── Register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, phone, location } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, error: 'Name and phone are required' });
    }

    const cleanPhone = phone.trim();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(cleanPhone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
    });

    // Store user (pending verification)
    users.set(cleanPhone, {
      name:      name.trim(),
      phone:     cleanPhone,
      location:  location?.trim() || '',
      verified:  false,
      createdAt: new Date().toISOString(),
    });

    const isReal = process.env.USE_REAL_APIS === 'true';

    if (isReal && process.env.FAST2SMS_API_KEY) {
      try {
        const { sendSMS } = require('../services/smsService');
        await sendSMS(cleanPhone, `Your Manzil AI OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`);
        console.log(`📲 [OTP SENT] → ${cleanPhone}`);

        res.json({
          success: true,
          message: 'OTP sent to your phone number via SMS',
        });
      } catch (smsErr) {
        console.warn(`⚠️ SMS Failed, falling back to Demo OTP. Error:`, smsErr.message);
        res.json({
          success: true,
          message: 'SMS failed (invalid key or limits). Falling back to Demo OTP.',
          demoOtp: otp,
        });
      }
    } else {
      // ── Demo mode — return OTP in response ───────────────────
      console.log(`\n📲 [DEMO OTP] Phone: ${cleanPhone} → OTP: ${otp}\n`);
      res.json({
        success:  true,
        message:  'OTP sent (demo mode)',
        demoOtp:  otp,
      });
    }

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Verify OTP ────────────────────────────────────────────────
router.post('/verify-otp', (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.trim();
    const stored = otpStore.get(cleanPhone);

    if (!stored) {
      return res.status(400).json({ success: false, error: 'OTP not found. Please register again.' });
    }

    // Rate-limit: max 5 attempts
    if (stored.attempts >= 5) {
      otpStore.delete(cleanPhone);
      return res.status(429).json({ success: false, error: 'Too many attempts. Please register again.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanPhone);
      return res.status(400).json({ success: false, error: 'OTP expired. Please register again.' });
    }

    stored.attempts++;

    if (stored.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        error: `Invalid OTP. ${5 - stored.attempts} attempts remaining.`,
      });
    }

    // ── OTP valid — mark user as verified ─────────────────────
    const user = users.get(cleanPhone);
    if (!user) {
      return res.status(400).json({ success: false, error: 'User not found. Please register again.' });
    }

    user.verified = true;
    user.verifiedAt = new Date().toISOString();
    users.set(cleanPhone, user);
    otpStore.delete(cleanPhone);

    console.log(`✅ [AUTH] User verified: ${user.name} (${cleanPhone})`);

    res.json({
      success: true,
      message: 'Phone verified successfully!',
      user: {
        name:     user.name,
        phone:    user.phone,
        location: user.location,
      }
    });

  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Get User ──────────────────────────────────────────────────
router.get('/user/:phone', (req, res) => {
  const user = users.get(req.params.phone);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  // Never expose internal fields
  res.json({
    success: true,
    user: { name: user.name, phone: user.phone, location: user.location, verified: user.verified }
  });
});

module.exports = router;
