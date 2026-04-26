require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const journeyRoutes = require('./routes/journey');
const weatherRoutes = require('./routes/weather');
const alertRoutes = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'https://manzil-ai.web.app', 'https://manzil-ai.firebaseapp.com'],
  credentials: true
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/journey', journeyRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Manzil AI Backend is running 🚀',
    mode: process.env.USE_REAL_APIS === 'true' ? 'PRODUCTION' : 'DEMO/MOCK',
    timestamp: new Date().toISOString()
  });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Manzil AI Backend running on port ${PORT}`);
  console.log(`📡 Mode: ${process.env.USE_REAL_APIS === 'true' ? '🔴 PRODUCTION' : '🟡 DEMO/MOCK'}`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
