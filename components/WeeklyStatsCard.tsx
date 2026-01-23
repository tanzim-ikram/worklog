'use client'

import { useState, useEffect } from 'react'
import { subDays, format, parseISO } from 'date-fns'
import { formatDurationHours } from '@/lib/utils/timezone'

interface WeekData {
  days: Record<string, { totalSeconds: number }>
  totalSeconds: number
}

export default function WeeklyStatsCard() {
  const [data, setData] = useState<WeekData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWeekData = async () => {
      try {
        const rollingStart = subDays(new Date(), 6) // Last 7 days including today
        const startStr = format(rollingStart, 'yyyy-MM-dd')
        const res = await fetch(`/api/summary/week?start=${startStr}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Failed to fetch week data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchWeekData()

    const handleTimerChange = () => {
      fetchWeekData()
    }

    window.addEventListener('worklog-timer-changed', handleTimerChange)
    return () => {
      window.removeEventListener('worklog-timer-changed', handleTimerChange)
    }
  }, [])

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const days = data?.days ? Object.keys(data.days).sort() : []
  const maxSeconds = Math.max(...(data ? Object.values(data.days).map(d => d.totalSeconds) : [0]), 3600 * 8) // At least 2h scale for better visibility
  
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-full relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 -mt-10 -ml-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex justify-between items-center mb-6 relative">
        <div>
          <h2 className="text-lg font-bold text-foreground">Weekly Overview</h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Last 7 Days
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {data ? formatDurationHours(data.totalSeconds) : '0h 0m'}
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Total Activity</p>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between gap-1 mt-4">
        {days.map((dateStr) => {
          const dayData = data?.days[dateStr]
          const height = dayData ? (dayData.totalSeconds / maxSeconds) * 100 : 0
          const dayName = format(parseISO(dateStr), 'EEEEE') // Single letter M, T, W...
          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
          const durationLabel = dayData && dayData.totalSeconds > 0 
            ? formatDurationHours(dayData.totalSeconds).split(' ')[0] // e.g. "1.5h"
            : ''

          return (
            <div key={dateStr} className="flex-1 flex flex-col items-center group">
              <div className="w-full relative flex flex-col items-center justify-end h-[260px] pb-1">
                {/* Bar Track Background */}
                <div className="absolute inset-x-0 bottom-0 top-0 mx-auto w-3 sm:w-4 bg-gray-100 dark:bg-white/5 rounded-t-full" />
                
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-20 pointer-events-none shadow-xl">
                  {dayData ? formatDurationHours(dayData.totalSeconds) : '0h'}
                </div>
                
                {/* Duration Label (Visible above bar if there's data) */}
                {durationLabel && (
                  <span className="text-[9px] font-bold mb-1.5 text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {durationLabel}
                  </span>
                )}

                {/* Bar */}
                <div 
                  className={`w-3 sm:w-4 rounded-t-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer relative z-10 ${
                    isToday 
                      ? 'bg-primary shadow-lg shadow-primary/30' 
                      : 'bg-primary/40 group-hover:bg-primary/70' 
                  }`}
                  style={{ 
                    height: `${Math.max(height, 5)}%`,
                    minHeight: '8px'
                  }}
                />
              </div>
              <span className={`mt-3 text-[10px] font-bold uppercase transition-colors ${
                isToday ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              }`}>
                {dayName}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
