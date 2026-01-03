'use client'

import { useState, useEffect } from 'react'
import { formatDurationHours } from '@/lib/utils/timezone'
import { format, parseISO } from 'date-fns'

interface Session {
  id: string
  local_date: string
  note?: string
  project_id?: string
  created_at: string
  segments: Array<{
    id: string
    start_at: string
    end_at: string | null
  }>
}

export default function TodaySessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/summary/day?date=${today}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch sessions:', res.status, errorData)
        throw new Error(errorData.error || 'Failed to fetch sessions')
      }
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Error fetching sessions:', err)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading sessions...</div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Sessions</h2>
        <p className="text-gray-500">No sessions recorded today</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Sessions</h2>
      <div className="space-y-4">
        {sessions.map((session) => {
          const totalSeconds = session.segments.reduce((total, seg) => {
            const start = parseISO(seg.start_at)
            const end = seg.end_at ? parseISO(seg.end_at) : new Date()
            return total + Math.floor((end.getTime() - start.getTime()) / 1000)
          }, 0)

          const firstStart = session.segments[0]?.start_at
          const lastEnd = session.segments[session.segments.length - 1]?.end_at

          return (
            <div key={session.id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  {firstStart && (
                    <div className="text-sm text-gray-600">
                      {format(parseISO(firstStart), 'HH:mm')} -{' '}
                      {lastEnd ? format(parseISO(lastEnd), 'HH:mm') : 'Running'}
                    </div>
                  )}
                  {session.note && (
                    <div className="mt-1 text-sm text-gray-700">{session.note}</div>
                  )}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDurationHours(totalSeconds)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

