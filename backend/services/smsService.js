/**
 * SMS Service — Twilio or Mock
 * When USE_REAL_APIS=false, logs SMS to console instead of sending
 */

const USE_REAL = process.env.USE_REAL_APIS === 'true';

// In-memory SMS log for demo UI
const smsLog = [];

async function sendSMS(to, message) {
  const timestamp = new Date().toISOString();
  const entry = { to, message, timestamp, status: 'sent' };

  if (USE_REAL) {
    try {
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to
      });
      console.log(`✅ [TWILIO SMS] → ${to}: ${message}`);
      entry.status = 'delivered';
    } catch (err) {
      console.error(`❌ [TWILIO ERROR]`, err.message);
      entry.status = 'failed';
    }
  } else {
    // Mock mode — just log
    console.log(`📱 [MOCK SMS] → ${to}: ${message}`);
  }

  smsLog.push(entry);
  return entry;
}

function getSMSLog() {
  return smsLog;
}

module.exports = { sendSMS, getSMSLog };
