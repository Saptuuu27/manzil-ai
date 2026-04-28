import axios from 'axios'

// ─── Base URL ──────────────────────────────────────────────────
// In development: Vite proxy handles /api → localhost:5000
// In production: VITE_API_URL must point to deployed backend
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// ─── Request interceptor (logging in dev) ─────────────────────
api.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

// ─── Response error handler ────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Network error'
    console.error(`[API Error] ${msg}`)
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────
export const register   = (data) => api.post('/auth/register', data)
export const verifyOtp  = (data) => api.post('/auth/verify-otp', data)

// ─── Journey ───────────────────────────────────────────────────
export const startJourney     = (data)  => api.post('/journey/start', data)
export const stopJourney      = (data)  => api.post('/journey/stop', data)
export const getJourneyStatus = (phone) => api.get(`/journey/status/${phone}`)
export const getJourneyAlerts = (phone) => api.get(`/journey/alerts/${phone}`)

// ─── Weather ───────────────────────────────────────────────────
export const getWeatherUpdate = (data) => api.post('/weather/update', data)

// ─── Health ────────────────────────────────────────────────────
export const healthCheck = () => api.get('/health')

export default api
