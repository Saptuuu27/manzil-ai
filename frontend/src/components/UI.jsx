/* Toast Component */
export function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>
            {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

/* Loading Spinner Button Content */
export function BtnContent({ loading, children }) {
  return loading
    ? <><div className="spinner" /><span>Please wait…</span></>
    : children
}

/* Risk Level Badge */
export function RiskBadge({ level }) {
  const map = {
    High:   'badge-danger',
    Medium: 'badge-warning',
    Low:    'badge-success',
  }
  return <span className={`badge ${map[level] || 'badge-info'}`}>{level} Risk</span>
}

/* Alert feed item */
export function AlertItem({ alert }) {
  const iconMap = {
    journey_start: '🚀',
    journey_end:   '🏁',
    safety_alert:  alert?.riskLevel === 'High' ? '⚠️' : alert?.riskLevel === 'Medium' ? '🚧' : '📍',
    weather:       '🌤️',
  }
  const icon = iconMap[alert.type] || '📨'
  const levelClass = alert.riskLevel?.toLowerCase() || alert.type || 'low'

  return (
    <div className={`alert-item ${levelClass}`}>
      <span className="alert-icon">{icon}</span>
      <div className="alert-content">
        <p className="alert-msg">{alert.message}</p>
        <p className="alert-time">{new Date(alert.timestamp).toLocaleTimeString()}</p>
      </div>
      {alert.riskLevel && <RiskBadge level={alert.riskLevel} />}
    </div>
  )
}

/* Stat card */
export function StatCard({ value, label, icon }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
