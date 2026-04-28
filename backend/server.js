require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes    = require('./routes/auth');
const journeyRoutes = require('./routes/journey');
const weatherRoutes = require('./routes/weather');
const alertRoutes   = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Dynamic CORS ──────────────────────────────────────────────
const rawOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowAllOrigins = rawOrigins.includes('*');

const allowedOrigins = rawOrigins
  .filter(o => o !== '*')
  .concat([
    'http://localhost:5173',
    'http://localhost:4173',
    'capacitor://localhost',       // Capacitor Android app
    'https://localhost',           // Capacitor HTTPS scheme
    'http://localhost',
    'https://manzil-ai.web.app',
    'https://manzil-ai.firebaseapp.com',
  ]);

app.use(cors({
  origin: (origin, cb) => {
    // Allow if: no origin (native/Postman), wildcard, or whitelisted
    if (!origin || allowAllOrigins || allowedOrigins.some(o => origin.startsWith(o))) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ─── Request Logger ────────────────────────────────────────────
app.use((req, res, next) => {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/alerts',  alertRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const isReal = process.env.USE_REAL_APIS === 'true';
  res.json({
    status: 'OK',
    message: 'Manzil AI Backend is running 🚀',
    mode: isReal ? 'PRODUCTION (Real APIs)' : 'DEMO (Mock Mode)',
    apis: {
      gemini:      !!process.env.GEMINI_API_KEY,
      ors:         !!process.env.ORS_API_KEY,
      fast2sms:    !!process.env.FAST2SMS_API_KEY,
      openWeather: !!process.env.OPENWEATHER_API_KEY,
    },
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  const isReal = process.env.USE_REAL_APIS === 'true';
  console.log(`\n🚀 Manzil AI Backend running on port ${PORT}`);
  console.log(`📡 Mode: ${isReal ? '🔴 PRODUCTION (Real APIs)' : '🟡 DEMO/MOCK'}`);
  if (isReal) {
    console.log(`  ✅ Gemini:      ${process.env.GEMINI_API_KEY      ? 'Connected' : '❌ KEY MISSING'}`);
    console.log(`  ✅ ORS Routing: ${process.env.ORS_API_KEY          ? 'Connected' : '⚠️  KEY MISSING (mock route)'}`);
    console.log(`  ✅ Fast2SMS:    ${process.env.FAST2SMS_API_KEY     ? 'Connected' : '⚠️  KEY MISSING (console log)'}`);
    console.log(`  ✅ Weather:     ${process.env.OPENWEATHER_API_KEY  ? 'Connected' : '❌ KEY MISSING'}`);
  }
  console.log(`🌐 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
