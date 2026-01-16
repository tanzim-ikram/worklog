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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  // Calculate radial progress (based on 60 minutes for a full circle effect, or just visual pulsing)
  const radius = 120
  const circumference = 2 * Math.PI * radius
  const progress = (displaySeconds % 3600) / 3600 // Fill circle every hour
  const strokeDashoffset = circumference - progress * circumference

  if (loading) {
    return (
      <div className="glass-panel p-8 rounded-2xl flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center text-red-500">
        Failed to load timer status
      </div>
    )
  }

  return (
    <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center justify-center relative">
        {/* Radial Timer SVG */}
        <div className="relative mb-8">
          <svg className="w-72 h-72 transform -rotate-90">
            {/* Track */}
            <circle
              cx="144"
              cy="144"
              r={radius}
              className="stroke-indigo-100 dark:stroke-gray-700"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Progress */}
            <circle
              cx="144"
              cy="144"
              r={radius}
              className={`transition-all duration-1000 ease-linear ${
                status.isRunning ? 'stroke-primary drop-shadow-glow' : 'stroke-gray-400'
              }`}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-mono font-bold tracking-tight mb-2 ${
              status.isRunning ? 'text-primary' : 'text-gray-500'
            }`}>
              {formatDuration(displaySeconds)}
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              {status.isRunning ? 'Focusing' : 'Paused'}
            </div>
            <div className="mt-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-xs font-medium text-gray-500">
              Today: {formatDurationHours(status.todayTotalSeconds)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 w-full max-w-xs z-10">
          {!status.isRunning ? (
            <>
              {status.currentSession ? (
                 <button
                 onClick={() => handleAction('resume')}
                 disabled={actionLoading !== null}
                 className="flex-1 py-3 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
               >
                 {actionLoading === 'resume' ? 'Resuming...' : 'Resume'}
               </button>
              ) : (
                <button
                  onClick={() => handleAction('start')}
                  disabled={actionLoading !== null}
                  className="flex-1 py-3 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                >
                  {actionLoading === 'start' ? 'Starting...' : 'Start Timer'}
                </button>
              )}
              {status.currentSession && (
                <button
                  onClick={() => handleAction('stop')}
                  disabled={actionLoading !== null}
                  className="py-3 px-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'stop' ? '...' : 'Stop'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => handleAction('pause')}
                disabled={actionLoading !== null}
                className="flex-1 py-3 px-6 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl font-medium shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {actionLoading === 'pause' ? 'Pausing...' : 'Pause'}
              </button>
              <button
                onClick={() => handleAction('stop')}
                disabled={actionLoading !== null}
                className="py-3 px-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {actionLoading === 'stop' ? '...' : 'Stop'}
              </button>
            </>
          )}
        </div>

        {status.currentSession?.note && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 w-full text-center">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700 dark:text-gray-300">Note:</span> {status.currentSession.note}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
