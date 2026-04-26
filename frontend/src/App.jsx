import { useState } from 'react'
import RegisterPage from './pages/RegisterPage'
import HomePage     from './pages/HomePage'
import JourneyPage  from './pages/JourneyPage'

// Load persisted user from localStorage
function loadUser() {
  try { return JSON.parse(localStorage.getItem('manzil_user')) } catch { return null }
}

export default function App() {
  const [screen, setScreen] = useState(loadUser() ? 'home' : 'register')
  const [user, setUser] = useState(loadUser)
  const [journey, setJourney] = useState(null)

  const handleRegistered = (userData) => {
    setUser(userData)
    localStorage.setItem('manzil_user', JSON.stringify(userData))
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
    localStorage.removeItem('manzil_user')
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
          position: 'relative', zIndex: 2
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
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.75rem', padding: '4px 8px',
                borderRadius: 6, transition: 'color 0.2s'
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
