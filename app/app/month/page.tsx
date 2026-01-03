'use client'

import { useState, useEffect } from 'react'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, subDays } from 'date-fns'
import { formatDurationHours } from '@/lib/utils/timezone'
import Link from 'next/link'

export default function MonthPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<{
    month: string
    days: Record<string, { totalSeconds: number; sessionCount: number }>
    totalSeconds: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMonthData()
  }, [month])

  const fetchMonthData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/summary/month?month=${month}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch month data:', res.status, errorData)
        throw new Error(errorData.error || 'Failed to fetch month data')
      }
      const monthData = await res.json()
      setData(monthData)
    } catch (err) {
      console.error('Error fetching month data:', err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const monthStart = startOfMonth(parseISO(month + '-01'))
  const monthEnd = endOfMonth(monthStart)
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Get first day of week for the month start (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = getDay(monthStart)
  // Adjust to Monday = 0
  const firstDayOffset = (firstDayOfWeek + 6) % 7

  // Create calendar grid
  const calendarDays: (Date | null)[] = []
  // Add empty cells for days before month start
  for (let i = 0; i < firstDayOffset; i++) {
    calendarDays.push(null)
  }
  // Add all days of the month
  allDays.forEach((day) => calendarDays.push(day))

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Month View</h1>
        <p className="mt-1 text-sm text-gray-500">View monthly calendar and totals</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <input
            id="month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : data ? (
          <div>
            <div className="mb-6">
              <div className="text-2xl font-semibold text-gray-900">
                {format(monthStart, 'MMMM yyyy')}
              </div>
              <div className="text-lg text-gray-600 mt-1">
                Total: {formatDurationHours(data.totalSeconds)}
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-50">
                {weekDays.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="aspect-square border-r border-b border-gray-200 last:border-r-0 bg-gray-50"
                      />
                    )
                  }

                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayData = data.days[dateStr]
                  const totalSeconds = dayData?.totalSeconds || 0
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

                  return (
                    <div
                      key={dateStr}
                      className={`aspect-square border-r border-b border-gray-200 last:border-r-0 p-2 ${
                        isToday ? 'bg-blue-50' : ''
                      }`}
                    >
                      <Link
                        href={`/app/day?date=${dateStr}`}
                        className="block h-full hover:bg-gray-100 rounded transition-colors p-1"
                      >
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {format(day, 'd')}
                        </div>
                        {totalSeconds > 0 && (
                          <div className="text-xs text-gray-600">
                            {formatDurationHours(totalSeconds)}
                          </div>
                        )}
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Export buttons */}
            <div className="mt-6 flex gap-4">
              <a
                href={`/api/export/month.csv?month=${month}`}
                download
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
              >
                Export CSV
              </a>
              <a
                href={`/api/export/month.pdf?month=${month}`}
                download
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                Export PDF
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center text-red-600">Failed to load data</div>
        )}
      </div>
    </div>
  )
}

