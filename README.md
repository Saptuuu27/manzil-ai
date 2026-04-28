# 🧭 Manzil AI — Smart Safety Navigation

**Manzil AI** is a production-ready, AI-powered safety and navigation system for travelers, truck drivers, and emergency responders. It analyzes your route in real-time using Google Gemini AI, fetches live weather, identifies nearby hospitals and police stations via OpenStreetMap, and sends real SMS alerts via Fast2SMS — even when you're offline.

---

## 🚀 Key Features

- 📱 **Mobile-First PWA** — Premium dark-themed React UI, fully installable as an Android APK via Capacitor
- 🤖 **Gemini 1.5 Flash** — Real-time AI route safety analysis (fast, cost-effective)
- 📨 **Fast2SMS Alerts** — Real SMS every 15 seconds with weather, risks, and emergency info (free, India, no CC)
- 🗺️ **OpenRouteService** — Free routing for Indian roads, no credit card needed
- 🌍 **OpenStreetMap** — Free map display and reverse geocoding via Nominatim
- 🏥 **Emergency Spotting** — Auto-finds nearest hospitals and police stations via Overpass API (free)
- 🌦️ **OpenWeatherMap** — Live weather data along every waypoint of your route
- 🔐 **OTP Auth** — Real phone verification via SMS (or demo mode with on-screen OTP)
- ✈️ **Backend Journey Tracking** — Server-side tracking continues even if app is closed
- 💰 **Zero Cost APIs** — All APIs either free forever or free tier with no credit card

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Vanilla CSS |
| Backend | Node.js 18+, Express 4 |
| AI | Google Gemini 1.5 Flash |
| Routing | OpenRouteService (free, 2000 req/day) |
| Geocoding | Nominatim / OpenStreetMap (free, no key) |
| Emergency Spots | Overpass API / OpenStreetMap (free, no key) |
| Map Display | OpenStreetMap embed (free, no key) |
| Weather | OpenWeatherMap API (free, 1000 req/day) |
| SMS (Primary) | Fast2SMS (free for India, no CC) |
| SMS (Fallback) | Twilio (optional, $15 trial credit) |
| Mobile APK | Capacitor 6 |

---

## 🔑 API Keys You Need

All free. No credit card required (except Twilio which is optional).

| API | Where to Get | Free Tier | CC Needed? |
|-----|-------------|-----------|------------|
| **Google Gemini** | https://aistudio.google.com/app/apikey | ✅ Yes | No |
| **OpenRouteService** | https://openrouteservice.org/dev/#/signup | ✅ 2000 req/day | **No** |
| **Fast2SMS** | https://www.fast2sms.com → Dev API | ✅ Free credits | **No** |
| **OpenWeatherMap** | https://home.openweathermap.org/api_keys | ✅ 1000 req/day | **No** |
| Twilio *(optional)* | https://console.twilio.com | $15 trial | Yes |

> **No Google Maps needed.** Routing, maps, geocoding and emergency spots are all handled by free OpenStreetMap-based services.

---

## 🏃 Running Locally

### Quickest way — one double-click:

Double-click **`START.bat`** in the project root. It starts both backend and frontend using the bundled Node.js v20 and opens your browser automatically.

---

### Manual setup

#### Backend
```bash
cd backend
npm install
# Edit .env — paste your 4 API keys, set USE_REAL_APIS=true
node server.js
# Starts on http://localhost:5000
```

#### Frontend
```bash
cd frontend
npm install
# frontend/.env is already configured (leave VITE_API_URL empty)
npm run dev
# Opens on http://localhost:5173
```

#### Demo Mode (No API Keys Needed)
Set `USE_REAL_APIS=false` in `backend/.env`. All responses are mocked — OTP shown on screen, route uses mock Delhi→Chandigarh data, SMS logged to console.

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `GEMINI_API_KEY` | Google Gemini AI key | ✅ Yes |
| `ORS_API_KEY` | OpenRouteService routing key | Recommended |
| `FAST2SMS_API_KEY` | Fast2SMS key (India SMS, free) | Recommended |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | Recommended |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (optional fallback) | Optional |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token (optional fallback) | Optional |
| `TWILIO_PHONE_NUMBER` | Twilio phone number (optional fallback) | Optional |
| `USE_REAL_APIS` | `true` = real APIs, `false` = demo/mock | ✅ Yes |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | No |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (leave empty for local dev — Vite proxy handles it) |

---

## 📁 Project Structure

```
manzil-ai/
├── START.bat                 # One-click launcher (uses bundled Node.js)
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── App.jsx           # Root — no localStorage, fresh sessions
│   │   ├── api.js            # Axios API client with proxy config
│   │   ├── pages/
│   │   │   ├── RegisterPage.jsx  # Name + phone + OTP flow
│   │   │   ├── HomePage.jsx      # Journey start + quick weather
│   │   │   └── JourneyPage.jsx   # Live map + alerts + stats
│   │   ├── components/UI.jsx
│   │   └── hooks/
│   │       ├── useToast.js
│   │       └── useJourneyPolling.js
│   ├── .env                  # Dev env (empty VITE_API_URL)
│   ├── .env.production       # Prod env (backend URL)
│   ├── vite.config.js        # Vite proxy: /api → localhost:5000
│   └── capacitor.config.json # Android APK config
├── backend/                  # Node.js + Express API
│   ├── server.js             # Entry point + CORS + routes
│   ├── routes/
│   │   ├── auth.js           # OTP register/verify + rate limiting
│   │   ├── journey.js        # Start/stop/status/alerts
│   │   ├── weather.js        # Weather endpoint
│   │   └── alerts.js        # SMS alert log
│   ├── services/
│   │   ├── aiService.js      # Gemini 1.5 Flash analysis
│   │   ├── routeService.js   # OpenRouteService + Overpass API
│   │   ├── weatherService.js # OpenWeatherMap
│   │   └── smsService.js     # Fast2SMS (primary) + Twilio (fallback)
│   ├── .env                  # Your API keys (not committed)
│   └── .env.example          # Key reference template
├── node-v20.11.1-win-x64/   # Bundled Node.js (no install needed)
├── firebase.json             # Firebase Hosting config
├── vercel.json               # Vercel SPA fallback config
└── README.md
```

---

## 🎯 App Flow

1. **Register** — Enter name + phone → OTP sent via Fast2SMS → verify → logged in
2. **Home** — Enter destination → click **Start Journey**
3. **Journey** — Live tracking dashboard: OpenStreetMap route, emergency spots, elapsed time
4. **SMS Alerts** — Every 15 seconds: Gemini AI safety analysis + weather sent to your phone
5. **Stop** — Click "Stop Journey" → final summary SMS sent

---

## 📱 Build Android APK

### Prerequisites
- [Android Studio](https://developer.android.com/studio)
- [Java JDK 17](https://adoptium.net)

### Commands (run inside `frontend/`)
```bat
# 1. Build the web app
npm run build

# 2. Sync to Capacitor Android
npm run cap:sync

# 3. Open in Android Studio
npm run cap:open
```

### In Android Studio:
1. Wait for Gradle sync to complete
2. Click **▶ Run** to test on emulator, or
3. **Build → Generate Signed Bundle / APK → APK** for a distributable APK
4. APK output: `android/app/build/outputs/apk/release/`

> **Quick demo alternative:** Open `http://YOUR_PC_IP:5173` on your phone (same WiFi) — works as a full mobile web app instantly.

---

## 🌐 Health Check

Once running, verify all services at:
```
http://localhost:5000/api/health
```
Expected response:
```json
{
  "status": "OK",
  "mode": "PRODUCTION (Real APIs)",
  "apis": {
    "gemini": true,
    "ors": true,
    "fast2sms": true,
    "openWeather": true
  }
}
```

---

**Developed with ❤️ for the Manzil AI Safety Initiative.**
