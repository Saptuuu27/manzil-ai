/**
 * SMS Service — Fast2SMS (FREE for India, no CC needed)
 *
 * Fast2SMS signup: https://www.fast2sms.com → Dashboard → Dev API → copy key
 * Free credits on signup, no credit card, works for ANY Indian number (+91)
 */

const axios = require('axios');

// ─── In-memory SMS log for the alert feed UI ──────────────────
const smsLog = [];

// ─── Fast2SMS — free, India-specific ──────────────────────────
async function sendViaFast2SMS(to, message) {
  // Strip everything except digits, then remove leading 91 if present
  const digits = to.replace(/\D/g, '');
  const number = digits.startsWith('91') && digits.length === 12
    ? digits.slice(2)   // remove country code → 10-digit number
    : digits;

  const resp = await axios.post(
    'https://www.fast2sms.com/dev/bulkV2',
    {
      route:    'q',          // quick transactional route
      message:  message,
      language: 'english',
      flash:    0,
      numbers:  number,       // 10-digit Indian mobile, no country code
    },
    {
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    }
  );

  if (!resp.data?.return) {
    throw new Error(resp.data?.message || 'Fast2SMS returned failure');
  }

  console.log(`✅ [Fast2SMS] → ${number}: ${message.slice(0, 60)}...`);
}

// ─── Main sendSMS ─────────────────────────────────────────────
async function sendSMS(to, message) {
  const timestamp = new Date().toISOString();
  const entry = { to, message, timestamp, status: 'sent' };

  const useReal      = process.env.USE_REAL_APIS === 'true';
  const hasFast2SMS  = !!process.env.FAST2SMS_API_KEY;

  if (useReal) {
    if (hasFast2SMS) {
      try {
        await sendViaFast2SMS(to, message);
        entry.status = 'delivered';
        entry.provider = 'fast2sms';
        smsLog.push(entry);
        return entry;
      } catch (err) {
        console.warn(`⚠️ Fast2SMS failed: ${err.message}`);
        throw err;
      }
    }

    // ── No SMS provider configured ────────────────────────────
    console.log(`📱 [CONSOLE SMS — no provider set] → ${to}:\n   ${message}\n`);
  } else {
    // ── Demo/mock mode ─────────────────────────────────────────
    console.log(`📱 [MOCK SMS] → ${to}:\n   ${message}\n`);
  }

  smsLog.push(entry);
  return entry;
}

function getSMSLog()   { return [...smsLog]; }
function clearSMSLog() { smsLog.length = 0; }

module.exports = { sendSMS, getSMSLog, clearSMSLog };
