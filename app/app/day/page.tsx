'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { formatDurationHours } from '@/lib/utils/timezone'
import Link from 'next/link'

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

function DayPageContent() {
  const searchParams = useSearchParams()
  const initialDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(initialDate)
  const [data, setData] = useState<{ date: string; totalSeconds: number; sessions: Session[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDayData()
  }, [date])

  const fetchDayData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/summary/day?date=${date}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch day data:', res.status, errorData)
        throw new Error(errorData.error || 'Failed to fetch day data')
      }
      const dayData = await res.json()
      setData(dayData)
    } catch (err) {
      console.error('Error fetching day data:', err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Day View</h1>
        <p className="mt-1 text-sm text-gray-500">View sessions for a specific day</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : data ? (
          <div>
            <div className="mb-6">
              <div className="text-2xl font-semibold text-gray-900">
                {format(parseISO(data.date), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="text-lg text-gray-600 mt-1">
                Total: {formatDurationHours(data.totalSeconds)}
              </div>
            </div>

            {data.sessions.length === 0 ? (
              <p className="text-gray-500">No sessions recorded for this day</p>
            ) : (
              <div className="space-y-4">
                {data.sessions.map((session) => {
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
                        <div className="flex-1">
                          {firstStart && (
                            <div className="text-sm text-gray-600">
                              {format(parseISO(firstStart), 'HH:mm')} -{' '}
                              {lastEnd ? format(parseISO(lastEnd), 'HH:mm') : 'Running'}
                            </div>
                          )}
                          {session.note && (
                            <div className="mt-1 text-sm text-gray-700">{session.note}</div>
                          )}
                          <div className="mt-2">
                            <Link
                              href={`/app/sessions/${session.id}/edit`}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDurationHours(totalSeconds)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-red-600">Failed to load data</div>
        )}
      </div>
    </div>
  )
}

export default function DayPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
      <DayPageContent />
    </Suspense>
  )
}
