import { useState, useCallback, useRef } from 'react'
import { getJourneyAlerts } from '../api'

export function useJourneyPolling(phone) {
  const [alerts, setAlerts] = useState([])
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef(null)
  const seenIds = useRef(new Set())

  const startPolling = useCallback(() => {
    if (intervalRef.current) return
    setIsPolling(true)

    const poll = async () => {
      try {
        const res = await getJourneyAlerts(phone)
        const incoming = res.data.alerts || []
        const newAlerts = incoming.filter(a => {
          const id = a.timestamp + a.message
          if (seenIds.current.has(id)) return false
          seenIds.current.add(id)
          return true
        })
        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts.reverse(), ...prev])
        }
      } catch (_) {}
    }

    poll() // immediate first call
    intervalRef.current = setInterval(poll, 5000)
  }, [phone])

  const stopPolling = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsPolling(false)
  }, [])

  return { alerts, setAlerts, isPolling, startPolling, stopPolling }
}
