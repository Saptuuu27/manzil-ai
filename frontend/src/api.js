import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// ─── Auth ──────────────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data)
export const verifyOtp = (data) => api.post('/auth/verify-otp', data)

// ─── Journey ───────────────────────────────────────────────────
export const startJourney = (data) => api.post('/journey/start', data)
export const stopJourney  = (data) => api.post('/journey/stop', data)
export const getJourneyStatus = (phone) => api.get(`/journey/status/${phone}`)
export const getJourneyAlerts = (phone) => api.get(`/journey/alerts/${phone}`)

// ─── Weather ───────────────────────────────────────────────────
export const getWeatherUpdate = (data) => api.post('/weather/update', data)

// ─── Health ────────────────────────────────────────────────────
export const healthCheck = () => api.get('/health')

export default api
