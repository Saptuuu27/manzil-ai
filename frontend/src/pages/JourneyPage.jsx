import { useState, useEffect, useCallback } from 'react'
import { stopJourney, getWeatherUpdate } from '../api'
import { useToast } from '../hooks/useToast'
import { useJourneyPolling } from '../hooks/useJourneyPolling'
import { ToastContainer, AlertItem, StatCard, BtnContent } from '../components/UI'

export default function JourneyPage({ user, journey, onStop }) {
  const [stopping, setStopping] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const { toasts, success, error } = useToast()
  const { alerts, isPolling, startPolling, stopPolling } = useJourneyPolling(user.phone)

  // ── Start polling for alerts ────────────────────────────────
  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  // ── Elapsed time counter ────────────────────────────────────
  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000)
      setElapsed(secs)
      // Simulate journey progress (100% = 150 seconds for demo)
      setProgress(Math.min(100, Math.floor((secs / 150) * 100)))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  // ── Stop journey ────────────────────────────────────────────
  const handleStop = async () => {
    setStopping(true)
    try {
      await stopJourney({ phone: user.phone })
      stopPolling()
      success('Journey stopped. Stay safe!')
      setTimeout(onStop, 1000)
    } catch (err) {
      error(err.response?.data?.error || 'Could not stop journey')
    } finally {
      setStopping(false)
    }
  }

  // ── Manual weather fetch ────────────────────────────────────
  const handleWeather = async () => {
    setLoadingWeather(true)
    try {
      const res = await getWeatherUpdate({
        phone: user.phone,
        location: journey.destination,
        name: user.name
      })
      const w = res.data.weather
      success(`${w.icon} ${w.condition} near ${journey.destination} — ${w.temp}°C`)
    } catch {
      error('Weather update failed')
    } finally {
      setLoadingWeather(false)
    }
  }

  // ── Risk color from latest alert ────────────────────────────
  const latestRisk = alerts.find(a => a.riskLevel)?.riskLevel
  const riskColor = latestRisk === 'High' ? 'var(--accent-red)'
    : latestRisk === 'Medium' ? 'var(--accent-orange)'
    : 'var(--accent-green)'

  return (
    <div className="screen" style={{ paddingTop: 20 }}>

      {/* ── Header ────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        padding: '14px 16px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--border-subtle)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Animated border glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, rgba(108,99,255,0.05), rgba(0,212,255,0.03))`,
          pointerEvents: 'none'
        }} />
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--gradient-hero)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', flexShrink: 0, position: 'relative',
          boxShadow: 'var(--shadow-glow)'
        }}>
          🧭
          {/* Radar rings */}
          <div style={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            border: '2px solid rgba(108,99,255,0.4)',
            animation: 'radar 2s ease-out infinite'
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Live Tracking
            </span>
          </div>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>
            → {journey.destination}
          </p>
          <p className="text-xs color-muted">
            {user.location || 'Your Location'} · {journey.route?.distance}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-secondary)', fontFamily: 'var(--font-display)' }}>
            {formatElapsed(elapsed)}
          </p>
          <p className="text-xs color-muted">elapsed</p>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div className="flex-between mb-8">
          <span className="text-xs color-muted">Journey Progress</span>
          <span className="text-xs" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex-between mt-8">
          <span className="text-xs color-muted">📍 {user.location || 'Start'}</span>
          <span className="text-xs color-muted">🏁 {journey.destination}</span>
        </div>
      </div>

      {/* ── Stats Grid ────────────────────────────────────── */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <StatCard value={alerts.length} label="Alerts Sent" icon="📨" />
        <StatCard value={journey.route?.distance || '—'} label="Distance" icon="🛣️" />
        <StatCard
          value={<span style={{ color: riskColor, fontSize: '1.2rem' }}>
            {latestRisk || 'Low'}
          </span>}
          label="Risk Level"
          icon="⚠️"
        />
        <StatCard value={journey.route?.duration?.split(' ').slice(0,2).join(' ') || '—'} label="Est. Time" icon="⏱️" />
      </div>

      {/* ── Route Waypoints ───────────────────────────────── */}
      {journey.route?.waypoints && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12 }}>📍 Route Waypoints</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {journey.route.waypoints.slice(0, 4).map((wp, i, arr) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'var(--accent-green)'
                      : i === arr.length - 1 ? 'var(--accent-red)'
                      : 'var(--accent-primary)',
                    boxShadow: `0 0 8px ${i === 0 ? 'rgba(0,230,118,0.6)' : i === arr.length - 1 ? 'rgba(255,82,82,0.6)' : 'rgba(108,99,255,0.5)'}`
                  }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{wp.name}</span>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', marginLeft: 4 }} />
                )}
              </div>
            ))}
            {journey.route.waypoints.length > 4 && (
              <p className="text-xs color-muted" style={{ marginTop: 6, marginLeft: 22 }}>
                +{journey.route.waypoints.length - 4} more waypoints
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Emergency Spots ───────────────────────────────── */}
      {journey.route?.emergencySpots && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12 }}>🆘 Emergency Spots on Route</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {journey.route.emergencySpots.map((sp, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '1.3rem' }}>{sp.type === 'hospital' ? '🏥' : '🚔'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{sp.name}</p>
                  <p className="text-xs color-muted">{sp.type === 'hospital' ? 'Hospital' : 'Police Station'} · {sp.distance}</p>
                </div>
                <span className={`badge ${sp.type === 'hospital' ? 'badge-danger' : 'badge-info'}`}>
                  {sp.distance}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Buttons ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <button
          id="btn-weather-journey"
          className="btn btn-ghost"
          onClick={handleWeather}
          disabled={loadingWeather}
        >
          <BtnContent loading={loadingWeather}>
            <span>🌦️</span><span>Get Weather Update via SMS</span>
          </BtnContent>
        </button>
        <button
          id="btn-stop-journey"
          className="btn btn-danger"
          onClick={handleStop}
          disabled={stopping}
        >
          <BtnContent loading={stopping}>
            <span>🛑</span><span>Stop Journey</span>
          </BtnContent>
        </button>
      </div>

      {/* ── Live SMS Alert Feed ────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <div className="section-header">
          <span style={{ fontSize: '0.9rem' }}>📨</span>
          <h3 className="section-title">Live SMS Alerts</h3>
          {isPolling && <span className="pulse-dot" />}
          <div className="section-line" />
          <span className="badge badge-purple">{alerts.length}</span>
        </div>

        {alerts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 16px',
            background: 'var(--bg-input)', borderRadius: 'var(--border-radius-sm)',
            border: '1px dashed var(--border-subtle)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📡</div>
            <p className="text-sm color-muted">Waiting for alerts…</p>
            <p className="text-xs color-muted mt-8">First alert arrives in ~15 seconds</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map((alert, i) => (
              <AlertItem key={i} alert={alert} />
            ))}
          </div>
        )}
      </div>

      {/* ── Offline notice ─────────────────────────────────── */}
      <div style={{
        textAlign: 'center', padding: '12px 16px', marginTop: 16,
        background: 'rgba(0,212,255,0.05)',
        borderRadius: 'var(--border-radius-sm)',
        border: '1px solid rgba(0,212,255,0.2)'
      }}>
        <p className="text-xs" style={{ color: 'var(--accent-secondary)' }}>
          ✈️ <strong>Offline-Safe Mode Active</strong> — SMS alerts continue even without internet
        </p>
      </div>

      <div style={{ height: 32 }} />
      <ToastContainer toasts={toasts} />
    </div>
  )
}
