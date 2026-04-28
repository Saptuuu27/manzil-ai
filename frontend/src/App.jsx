import { useState } from 'react'
import RegisterPage from './pages/RegisterPage'
import HomePage     from './pages/HomePage'
import JourneyPage  from './pages/JourneyPage'

// ─── No localStorage persistence — real industry app ───────────
// Users must log in every session (no auto-saved data)

export default function App() {
  const [screen, setScreen] = useState('register')
  const [user, setUser] = useState(null)
  const [journey, setJourney] = useState(null)

  const handleRegistered = (userData) => {
    setUser(userData)
    setScreen('home')
  }

  const handleJourneyStarted = (journeyData) => {
    setJourney(journeyData)
    setScreen('journey')
  }

  const handleJourneyStopped = () => {
    setJourney(null)
    setScreen('home')
  }

  const handleLogout = () => {
    setUser(null)
    setJourney(null)
    setScreen('register')
  }

  return (
    <div className="app-shell">

      {/* ── Top Status Bar ─────────────────────────────────── */}
      {screen !== 'register' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 8px',
          borderBottom: '1px solid var(--border-subtle)',
          position: 'relative', zIndex: 2,
          background: 'rgba(6,6,18,0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>🧭</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem',
              background: 'var(--gradient-hero)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>Manzil AI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {screen === 'journey' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="pulse-dot" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-green)', letterSpacing: '0.08em' }}>
                  TRACKING
                </span>
              </div>
            )}
            {user && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: 4 }}>
                {user.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)',
                color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.72rem',
                padding: '4px 10px', borderRadius: 6, transition: 'all 0.2s', fontWeight: 600,
              }}
            >
              ↩ Logout
            </button>
          </div>
        </div>
      )}

      {/* ── Screens ────────────────────────────────────────── */}
      {screen === 'register' && (
        <RegisterPage onRegistered={handleRegistered} />
      )}

      {screen === 'home' && user && (
        <HomePage user={user} onJourneyStarted={handleJourneyStarted} />
      )}

      {screen === 'journey' && user && journey && (
        <JourneyPage
          user={user}
          journey={journey}
          onStop={handleJourneyStopped}
        />
      )}
    </div>
  )
}
