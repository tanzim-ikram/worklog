'use client'

import { useState, useEffect } from 'react'
import { format, parseISO, startOfWeek, addDays } from 'date-fns'
import { formatDurationHours } from '@/lib/utils/timezone'

export default function WeekPage() {
  const [startDate, setStartDate] = useState(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  )
  const [data, setData] = useState<{
    start: string
    end: string
    days: Record<string, { totalSeconds: number; sessions: any[] }>
    totalSeconds: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeekData()
  }, [startDate])

  const fetchWeekData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/summary/week?start=${startDate}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch week data:', res.status, errorData)
        throw new Error(errorData.error || 'Failed to fetch week data')
      }
      const weekData = await res.json()
      setData(weekData)
    } catch (err) {
      console.error('Error fetching week data:', err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const weekDays = []
  if (data) {
    const start = parseISO(data.start)
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(start, i))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Week View</h1>
        <p className="mt-1 text-sm text-gray-500">View weekly totals</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label htmlFor="weekStart" className="block text-sm font-medium text-gray-700 mb-2">
            Week Starting
          </label>
          <input
            id="weekStart"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : data ? (
          <div>
            <div className="mb-6">
              <div className="text-xl font-semibold text-gray-900">
                Week of {format(parseISO(data.start), 'MMMM d')} - {format(parseISO(data.end), 'MMMM d, yyyy')}
              </div>
              <div className="text-lg text-gray-600 mt-1">
                Total: {formatDurationHours(data.totalSeconds)}
              </div>
            </div>

            <div className="space-y-3">
              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayData = data.days[dateStr]
                const totalSeconds = dayData?.totalSeconds || 0

                return (
                  <div key={dateStr} className="flex justify-between items-center border-b pb-3 last:border-0">
                    <div>
                      <div className="font-medium text-gray-900">
                        {format(day, 'EEEE, MMMM d')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {dayData?.sessions.length || 0} session{dayData?.sessions.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDurationHours(totalSeconds)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center text-red-600">Failed to load data</div>
        )}
      </div>
    </div>
  )
}

