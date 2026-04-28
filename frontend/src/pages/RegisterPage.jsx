import { useState, useRef, useEffect } from 'react'
import { register, verifyOtp, healthCheck } from '../api'
import { useToast } from '../hooks/useToast'
import { ToastContainer, BtnContent } from '../components/UI'

const POPULAR_CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Chandigarh', 'Chennai', 'Kolkata', 'Pune']

export default function RegisterPage({ onRegistered }) {
  const [step, setStep] = useState('form') // 'form' | 'otp'
  const [form, setForm] = useState({ name: '', phone: '', location: '' })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [demoOtp, setDemoOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState('checking') // 'checking' | 'ok' | 'error'
  const otpRefs = useRef([])
  const { toasts, success, error, info } = useToast()

  // ── Backend connectivity check on mount ─────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        await healthCheck()
        setBackendStatus('ok')
      } catch {
        setBackendStatus('error')
      }
    }
    check()
  }, [])

  // ── Form helpers ────────────────────────────────────────────
  const updateForm = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const requestLocation = () => {
    if (!navigator.geolocation) {
      info('Geolocation not available — enter city manually')
      return
    }
    info('Detecting your location…')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.state || 'Detected Location'
          setForm(p => ({ ...p, location: city }))
          success(`📍 Location: ${city}`)
        } catch {
          setForm(p => ({ ...p, location: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }))
        }
      },
      () => info('Could not detect location — please enter manually')
    )
  }

  // ── Submit registration ─────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) {
      error('Name and phone number are required')
      return
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      error('Enter a valid phone number (10+ digits)')
      return
    }
    setLoading(true)
    try {
      const res = await register(form)
      if (res.data.demoOtp) {
        setDemoOtp(res.data.demoOtp)
        // Show OTP in badge — user must type it themselves (no auto-fill)
        info(`Demo OTP: ${res.data.demoOtp} — Enter it below`)
      } else {
        success('✅ OTP sent to your phone via SMS!')
      }
      setStep('otp')
    } catch (err) {
      const msg = err.code === 'ECONNABORTED' || err.message?.includes('timeout')
        ? '⏳ Server is waking up (cold start). Please wait 30s and try again.'
        : err.response?.data?.error || `Network error: ${err.message || 'Cannot reach backend'}`
      error(msg)
      setBackendStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP input handling ──────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // ── Verify OTP ──────────────────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault()
    const otpStr = otp.join('')
    if (otpStr.length < 6) {
      error('Enter the complete 6-digit OTP')
      return
    }
    setLoading(true)
    try {
      const res = await verifyOtp({ phone: form.phone, otp: otpStr })
      success('✅ Phone verified! Welcome to Manzil AI!')
      setTimeout(() => onRegistered(res.data.user), 800)
    } catch (err) {
      error(err.response?.data?.error || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen" style={{ justifyContent: 'center', minHeight: '100dvh' }}>

      {/* ── Brand ─────────────────────────────────────────── */}
      <div className="brand">
        <span className="brand-icon">🧭</span>
        <h1 className="brand-title">Manzil AI</h1>
        <p className="brand-tagline">AI-powered safety navigation</p>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
            background: backendStatus === 'ok' ? 'var(--accent-green)' : backendStatus === 'error' ? 'var(--accent-red)' : 'var(--accent-orange)',
            animation: backendStatus === 'checking' ? 'pulse 1s infinite' : 'none' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {backendStatus === 'checking' ? 'Connecting to server…' :
             backendStatus === 'ok' ? 'Server connected ✓' :
             'Server unreachable — check network'}
          </span>
        </div>
      </div>

      {/* ── Feature Pills ─────────────────────────────────── */}
      <div className="feature-pills">
        {['📨 SMS Alerts', '🤖 AI Safety', '🌦️ Weather', '🏥 Emergency Spots', '✈️ Offline-Safe'].map(f => (
          <span key={f} className="feature-pill">{f}</span>
        ))}
      </div>

      <div style={{ height: 24 }} />

      {/* ── Step: Registration Form ────────────────────────── */}
      {step === 'form' && (
        <div className="card card-glow" style={{ animation: 'slideInUp 0.5s ease' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Create Account</h2>
          <p className="text-sm color-muted" style={{ marginBottom: 20 }}>Register to start your safe journey</p>

          <form onSubmit={handleRegister}>
            {/* Name */}
            <div className="input-group">
              <label className="input-label">Your Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  id="reg-name"
                  className="input-field"
                  type="text"
                  placeholder="e.g. Rahul Kumar"
                  value={form.name}
                  onChange={updateForm('name')}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <div className="input-wrapper">
                <span className="input-icon">📱</span>
                <input
                  id="reg-phone"
                  className="input-field"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={updateForm('phone')}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="input-group">
              <div className="flex-between mb-8">
                <label className="input-label">Your City / Location</label>
                <button
                  type="button"
                  onClick={requestLocation}
                  style={{
                    background: 'none', border: 'none', color: 'var(--accent-secondary)',
                    fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  📍 Auto-detect
                </button>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">🏙️</span>
                <input
                  id="reg-location"
                  className="input-field"
                  type="text"
                  placeholder="e.g. Delhi, Mumbai"
                  value={form.location}
                  onChange={updateForm('location')}
                  list="cities-list"
                />
                <datalist id="cities-list">
                  {POPULAR_CITIES.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            <div style={{ height: 8 }} />
            <button id="btn-register" className="btn btn-primary" type="submit" disabled={loading}>
              <BtnContent loading={loading}>
                <span>📲</span><span>Send OTP</span>
              </BtnContent>
            </button>
          </form>

          <p className="text-xs color-muted text-center mt-12">
            By registering you agree to receive SMS safety alerts
          </p>
        </div>
      )}

      {/* ── Step: OTP Verification ─────────────────────────── */}
      {step === 'otp' && (
        <div className="card card-glow" style={{ animation: 'slideInUp 0.5s ease' }}>
          <button
            onClick={() => setStep('form')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.875rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Back
          </button>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Verify OTP</h2>
          <p className="text-sm color-muted" style={{ marginBottom: 6 }}>
            6-digit code sent to <strong style={{ color: 'var(--text-primary)' }}>{form.phone}</strong>
          </p>

          {demoOtp && (
            <div style={{ marginBottom:16, padding:'10px 14px', background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.3)', borderRadius:'var(--border-radius-sm)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span className="text-xs" style={{ color:'var(--accent-secondary)' }}>🎯 Demo OTP (type it below):</span>
              <strong style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', letterSpacing:'0.2em', color:'var(--text-primary)' }}>{demoOtp}</strong>
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div className="otp-container">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  ref={el => otpRefs.current[i] = el}
                  className={`otp-input ${digit ? 'filled' : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <div style={{ height: 20 }} />
            <button id="btn-verify-otp" className="btn btn-primary" type="submit" disabled={loading}>
              <BtnContent loading={loading}>
                <span>✅</span><span>Verify & Continue</span>
              </BtnContent>
            </button>

            <button
              type="button"
              className="btn btn-ghost mt-8"
              onClick={handleRegister}
              disabled={loading}
            >
              🔄 Resend OTP
            </button>
          </form>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </div>
  )
}
