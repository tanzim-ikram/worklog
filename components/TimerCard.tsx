'use client'

import { useState, useEffect } from 'react'
import { formatDuration, formatDurationHours } from '@/lib/utils/timezone'

interface TimerStatus {
  isRunning: boolean
  currentSegment?: {
    id: string
    startAt: string
    sessionId: string
  }
  currentSession?: {
    id: string
    localDate: string
    note?: string
    projectId?: string
  }
  elapsedSeconds: number
  todayTotalSeconds: number
}

export default function TimerCard() {
  const [status, setStatus] = useState<TimerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [displaySeconds, setDisplaySeconds] = useState(0)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/timer/status')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch status')
      }
      const data = await res.json()
      setStatus(data)
      setDisplaySeconds(data.elapsedSeconds)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => {
      if (status?.isRunning) {
        setDisplaySeconds((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [status?.isRunning])

  // Refresh status every 5 seconds to stay in sync
  useEffect(() => {
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    setActionLoading(action)
    setError(null)
    try {
      const res = await fetch(`/api/timer/${action}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} timer`)
      }
      await fetchStatus()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">Failed to load timer status</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="text-center mb-6">
        <div className="text-5xl font-mono font-bold text-gray-900 mb-2">
          {formatDuration(displaySeconds)}
        </div>
        <div className="text-sm text-gray-500">
          Today: {formatDurationHours(status.todayTotalSeconds)}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {!status.isRunning ? (
          <>
            {status.currentSession ? (
              <button
                onClick={() => handleAction('resume')}
                disabled={actionLoading !== null}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'resume' ? 'Resuming...' : 'Resume'}
              </button>
            ) : (
              <button
                onClick={() => handleAction('start')}
                disabled={actionLoading !== null}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'start' ? 'Starting...' : 'Start'}
              </button>
            )}
            {status.currentSession && (
              <button
                onClick={() => handleAction('stop')}
                disabled={actionLoading !== null}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'stop' ? 'Stopping...' : 'Stop'}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => handleAction('pause')}
              disabled={actionLoading !== null}
              className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'pause' ? 'Pausing...' : 'Pause'}
            </button>
            <button
              onClick={() => handleAction('stop')}
              disabled={actionLoading !== null}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'stop' ? 'Stopping...' : 'Stop'}
            </button>
          </>
        )}
      </div>

      {status.currentSession?.note && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Note:</span> {status.currentSession.note}
          </p>
        </div>
      )}
    </div>
  )
}

