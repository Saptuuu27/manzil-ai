import { useState, useEffect } from 'react'
import { stopJourney, getWeatherUpdate } from '../api'
import { useToast } from '../hooks/useToast'
import { useJourneyPolling } from '../hooks/useJourneyPolling'
import { ToastContainer, AlertItem, StatCard, BtnContent } from '../components/UI'

// Map uses free OpenStreetMap embed — no API key needed

export default function JourneyPage({ user, journey, onStop }) {
  const [stopping, setStopping]           = useState(false)
  const [elapsed, setElapsed]             = useState(0)
  const [progress, setProgress]           = useState(0)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [mapExpanded, setMapExpanded]     = useState(false)
  const { toasts, success, error }        = useToast()
  const { alerts, isPolling, startPolling, stopPolling } = useJourneyPolling(user.phone)

  useEffect(() => { startPolling(); return () => stopPolling() }, [startPolling, stopPolling])

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const secs = Math.floor((Date.now() - start) / 1000)
      setElapsed(secs)
      setProgress(Math.min(100, Math.floor((secs / 150) * 100)))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60), sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  const handleStop = async () => {
    setStopping(true)
    try {
      await stopJourney({ phone: user.phone })
      stopPolling()
      success('🛑 Journey stopped. Stay safe!')
      setTimeout(onStop, 1000)
    } catch (err) {
      error(err.response?.data?.error || 'Could not stop journey')
    } finally { setStopping(false) }
  }

  const handleWeather = async () => {
    setLoadingWeather(true)
    try {
      const res = await getWeatherUpdate({ phone: user.phone, location: journey.destination, name: user.name })
      const w = res.data.weather
      success(`${w.icon} ${w.condition} near ${journey.destination} — ${w.temp}°C, Wind: ${w.windSpeed}km/h`)
    } catch { error('Weather update failed') }
    finally { setLoadingWeather(false) }
  }

  const latestRisk = alerts.find(a => a.riskLevel)?.riskLevel
  const riskColor  = latestRisk === 'High' ? 'var(--accent-red)'
    : latestRisk === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-green)'

  const mapOrigin = journey.origin || user.location || 'Delhi'
  const mapDest   = journey.destination

  return (
    <div className="screen" style={{ paddingTop: 20 }}>

      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', gap:12, marginBottom:16,
        padding:'14px 16px', background:'var(--bg-card)',
        borderRadius:'var(--border-radius)', border:'1px solid var(--border-subtle)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(108,99,255,0.05),rgba(0,212,255,0.03))', pointerEvents:'none' }} />
        <div style={{ width:44,height:44,borderRadius:'50%',background:'var(--gradient-hero)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',flexShrink:0,position:'relative',boxShadow:'var(--shadow-glow)' }}>
          🧭
          <div style={{ position:'absolute',inset:-6,borderRadius:'50%',border:'2px solid rgba(108,99,255,0.4)',animation:'radar 2s ease-out infinite' }} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className="pulse-dot" />
            <span style={{ fontSize:'0.72rem',fontWeight:700,color:'var(--accent-green)',textTransform:'uppercase',letterSpacing:'0.1em' }}>Live Tracking</span>
          </div>
          <p style={{ fontWeight:700,fontSize:'0.95rem',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>→ {journey.destination}</p>
          <p className="text-xs color-muted">{(journey.origin||user.location||'Start').split(',')[0]} · {journey.route?.distance||'—'}</p>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <p style={{ fontSize:'1.1rem',fontWeight:800,color:'var(--accent-secondary)',fontFamily:'var(--font-display)' }}>{formatElapsed(elapsed)}</p>
          <p className="text-xs color-muted">elapsed</p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom:16 }}>
        <div className="flex-between mb-8">
          <span className="text-xs color-muted">Journey Progress</span>
          <span className="text-xs" style={{ color:'var(--accent-primary)',fontWeight:700 }}>{progress}%</span>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width:`${progress}%` }} /></div>
        <div className="flex-between mt-8">
          <span className="text-xs color-muted">📍 {(journey.origin||user.location||'Start').split(',')[0]}</span>
          <span className="text-xs color-muted">🏁 {journey.destination}</span>
        </div>
      </div>

      {/* Free OpenStreetMap Embed */}
      <div style={{ marginBottom:16,borderRadius:'var(--border-radius)',overflow:'hidden',border:'1px solid var(--border-subtle)' }}>
        <button onClick={() => setMapExpanded(v => !v)} style={{ width:'100%',background:'var(--bg-card)',border:'none',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',color:'var(--text-primary)',fontSize:'0.85rem',fontWeight:600 }}>
          <span>🗺️ Live Route Map</span>
          <span style={{ fontSize:'0.75rem',color:'var(--accent-secondary)' }}>{mapExpanded ? '▲ Collapse' : '▼ Expand'}</span>
        </button>
        {mapExpanded && (
          <iframe
            title="Route Map"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=68.0,6.0,97.0,37.0&layer=mapnik&marker=${encodeURIComponent(journey.destination)}`}
            width="100%"
            height="220"
            style={{ display:'block', border:'none' }}
            loading="lazy"
          />
        )}
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom:16 }}>
        <StatCard value={alerts.length} label="Alerts Sent" icon="📨" />
        <StatCard value={journey.route?.distance||'—'} label="Distance" icon="🛣️" />
        <StatCard value={<span style={{ color:riskColor,fontSize:'1.1rem' }}>{latestRisk||'Low'}</span>} label="Risk Level" icon="⚠️" />
        <StatCard value={journey.route?.duration?.split(' ').slice(0,2).join(' ')||'—'} label="Est. Time" icon="⏱️" />
      </div>

      {/* Emergency Spots */}
      {journey.route?.emergencySpots?.length > 0 && (
        <div className="card" style={{ marginBottom:16 }}>
          <h3 style={{ fontSize:'0.875rem',fontWeight:700,marginBottom:12 }}>🆘 Emergency Spots on Route</h3>
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {journey.route.emergencySpots.slice(0,4).map((sp,i) => (
              <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:'var(--bg-input)',borderRadius:'var(--border-radius-sm)',border:'1px solid var(--border-subtle)' }}>
                <span style={{ fontSize:'1.3rem' }}>{sp.type==='hospital' ? '🏥' : '🚔'}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'0.8rem',fontWeight:600 }}>{sp.name}</p>
                  <p className="text-xs color-muted">{sp.type==='hospital'?'Hospital':'Police'} · {sp.distance}</p>
                  {sp.address && <p className="text-xs color-muted" style={{ marginTop:2 }}>{sp.address}</p>}
                </div>
                <span className={`badge ${sp.type==='hospital'?'badge-danger':'badge-info'}`}>{sp.distance}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display:'flex',flexDirection:'column',gap:10,marginBottom:20 }}>
        <button id="btn-weather-journey" className="btn btn-ghost" onClick={handleWeather} disabled={loadingWeather}>
          <BtnContent loading={loadingWeather}><span>🌦️</span><span>Get Weather Update via SMS</span></BtnContent>
        </button>
        <button id="btn-stop-journey" className="btn btn-danger" onClick={handleStop} disabled={stopping}>
          <BtnContent loading={stopping}><span>🛑</span><span>Stop Journey</span></BtnContent>
        </button>
      </div>

      {/* Live Alert Feed */}
      <div style={{ marginBottom:8 }}>
        <div className="section-header">
          <span style={{ fontSize:'0.9rem' }}>📨</span>
          <h3 className="section-title">Live SMS Alerts</h3>
          {isPolling && <span className="pulse-dot" />}
          <div className="section-line" />
          <span className="badge badge-purple">{alerts.length}</span>
        </div>
        {alerts.length === 0 ? (
          <div style={{ textAlign:'center',padding:'32px 16px',background:'var(--bg-input)',borderRadius:'var(--border-radius-sm)',border:'1px dashed var(--border-subtle)' }}>
            <div style={{ fontSize:'2rem',marginBottom:8 }}>📡</div>
            <p className="text-sm color-muted">Waiting for alerts…</p>
            <p className="text-xs color-muted mt-8">First alert arrives in ~15 seconds</p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {[...alerts].reverse().map((alert,i) => <AlertItem key={i} alert={alert} />)}
          </div>
        )}
      </div>

      {/* Offline notice */}
      <div style={{ textAlign:'center',padding:'12px 16px',marginTop:16,background:'rgba(0,212,255,0.05)',borderRadius:'var(--border-radius-sm)',border:'1px solid rgba(0,212,255,0.2)' }}>
        <p className="text-xs" style={{ color:'var(--accent-secondary)' }}>✈️ <strong>Offline-Safe Mode Active</strong> — SMS alerts continue even without internet</p>
      </div>
      <div style={{ height:32 }} />
      <ToastContainer toasts={toasts} />
    </div>
  )
}
