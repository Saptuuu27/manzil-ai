import { useState } from 'react'
import { startJourney, getWeatherUpdate } from '../api'
import { useToast } from '../hooks/useToast'
import { ToastContainer, BtnContent } from '../components/UI'

const QUICK_DESTINATIONS = [
  { label: 'Delhi → Chandigarh', icon: '🛣️' },
  { label: 'Mumbai → Pune',      icon: '🏔️' },
  { label: 'Chennai → Bangalore', icon: '🚗' },
  { label: 'Bangalore → Mysore', icon: '🌿' },
]

export default function HomePage({ user, onJourneyStarted }) {
  const [destination, setDestination] = useState('')
  const [loadingJourney, setLoadingJourney] = useState(false)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const { toasts, success, error, info } = useToast()

  const handleStart = async (e) => {
    e.preventDefault()
    if (!destination.trim()) {
      error('Please enter a destination first')
      return
    }
    setLoadingJourney(true)
    try {
      const res = await startJourney({
        phone: user.phone,
        name: user.name,
        origin: user.location || 'Your Location',
        destination: destination.trim()
      })
      success('🚀 Journey started! SMS alerts activated.')
      setTimeout(() => onJourneyStarted({ ...res.data.journey, destination: destination.trim() }), 600)
    } catch (err) {
      error(err.response?.data?.error || 'Failed to start journey — is the backend running?')
    } finally {
      setLoadingJourney(false)
    }
  }

  const handleWeatherUpdate = async () => {
    const loc = destination.trim() || user.location || 'Delhi'
    setLoadingWeather(true)
    try {
      const res = await getWeatherUpdate({ phone: user.phone, location: loc, name: user.name })
      const w = res.data.weather
      success(`${w.icon} ${w.condition} in ${loc} — ${w.temp}°C, ${w.description}`)
    } catch (err) {
      error(err.response?.data?.error || 'Could not fetch weather')
    } finally {
      setLoadingWeather(false)
    }
  }

  return (
    <div className="screen" style={{ paddingTop: 24 }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex-between" style={{ marginBottom: 28 }}>
        <div>
          <p className="text-xs color-muted" style={{ marginBottom: 2 }}>Welcome back,</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            {user.name} <span style={{ fontSize: '1.2rem' }}>👋</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span className="pulse-dot" />
            <span className="text-xs color-muted">📍 {user.location || 'Location not set'}</span>
          </div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--gradient-hero)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', flexShrink: 0
        }}>
          🧭
        </div>
      </div>

      {/* ── Journey Form ──────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
          🗺️ Where are you heading?
        </h2>

        <form onSubmit={handleStart}>
          {/* Origin */}
          <div className="input-group">
            <label className="input-label">From</label>
            <div className="input-wrapper">
              <span className="input-icon">🟢</span>
              <input
                className="input-field"
                type="text"
                value={user.location || 'Current Location'}
                readOnly
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          {/* Destination */}
          <div className="input-group">
            <label className="input-label">Destination</label>
            <div className="input-wrapper">
              <span className="input-icon">📍</span>
              <input
                id="input-destination"
                className="input-field"
                type="text"
                placeholder="Enter city or address…"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* Quick destinations */}
          <div style={{ marginBottom: 16 }}>
            <p className="text-xs color-muted" style={{ marginBottom: 8 }}>Quick select:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {QUICK_DESTINATIONS.map(d => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => setDestination(d.label.split('→')[1].trim())}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '999px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>
          </div>

          <button id="btn-start-journey" className="btn btn-primary" type="submit" disabled={loadingJourney}>
            <BtnContent loading={loadingJourney}>
              <span>🚀</span><span>Start Journey</span>
            </BtnContent>
          </button>
        </form>
      </div>

      {/* ── Weather Update Card ────────────────────────────── */}
      <div className="card-gradient card" style={{ marginBottom: 20 }}>
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>🌤️ Weather Update</h3>
            <p className="text-xs color-muted mt-8">Get current weather via SMS</p>
          </div>
          <span style={{ fontSize: '2rem' }}>⛅</span>
        </div>
        <button
          id="btn-weather-update"
          className="btn btn-outline btn-sm"
          onClick={handleWeatherUpdate}
          disabled={loadingWeather}
        >
          <BtnContent loading={loadingWeather}>
            <span>📨</span>
            <span>Send Weather to {user.phone}</span>
          </BtnContent>
        </button>
      </div>

      {/* ── Info Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '🤖', title: 'AI Analysis', desc: 'Gemini-powered route safety' },
          { icon: '📨', title: 'SMS Alerts', desc: 'Works even offline' },
          { icon: '🏥', title: 'Emergency', desc: 'Hospitals & police nearby' },
          { icon: '🌦️', title: 'Weather', desc: 'Real-time hazard detection' },
        ].map(f => (
          <div key={f.title} className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{f.icon}</div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 2 }}>{f.title}</p>
            <p className="text-xs color-muted">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Phone info ─────────────────────────────────────── */}
      <div style={{
        textAlign: 'center', padding: '12px 16px',
        background: 'var(--bg-input)', borderRadius: 'var(--border-radius-sm)',
        border: '1px solid var(--border-subtle)', marginBottom: 8
      }}>
        <p className="text-xs color-muted">
          📱 Alerts will be sent to <strong style={{ color: 'var(--text-primary)' }}>{user.phone}</strong>
        </p>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  )
}
