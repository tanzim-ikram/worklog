'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { formatDurationHours } from '@/lib/utils/timezone'
import Link from 'next/link'
import ShareButton from '@/components/ShareButton'

export default function MonthPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<{
    month: string
    days: Record<string, { totalSeconds: number; sessionCount: number }>
    totalSeconds: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMonthData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/summary/month?month=${month}`)
      if (!res.ok) {
        throw new Error('Failed to fetch month data')
      }
      const monthData = await res.json()
      setData(monthData)
    } catch (err) {
      console.error(err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    fetchMonthData()
  }, [fetchMonthData])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const current = parseISO(month + '-01')
    const newDate = direction === 'prev' 
      ? format(new Date(current.getFullYear(), current.getMonth() - 1, 1), 'yyyy-MM')
      : format(new Date(current.getFullYear(), current.getMonth() + 1, 1), 'yyyy-MM')
    setMonth(newDate)
  }

  const monthStart = startOfMonth(parseISO(month + '-01'))
  const monthEnd = endOfMonth(monthStart)
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const firstDayOfWeek = getDay(monthStart)
  const firstDayOffset = (firstDayOfWeek + 6) % 7

  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < firstDayOffset; i++) {
    calendarDays.push(null)
  }
  allDays.forEach((day) => calendarDays.push(day))

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Month View
          </h1>
          <p className="mt-1 text-muted-foreground">Monthly overview & exports</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 glass-panel rounded-xl hover:bg-primary/10 transition-colors"
            title="Previous month"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <input
            id="month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="glass-panel px-4 py-2 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-primary/50 outline-none"
          />
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 glass-panel rounded-xl hover:bg-primary/10 transition-colors"
            title="Next month"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-1/4"></div>
            <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden mt-6">
              <div className="grid grid-cols-7 bg-gray-50/50 dark:bg-white/5 h-10"></div>
              <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-white/5">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-[1.2] bg-gray-200 dark:bg-white/5"></div>
                ))}
              </div>
            </div>
          </div>
        ) : data ? (
          <div className="animate-fade-in-up">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  {format(monthStart, 'MMMM yyyy')}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total Focus: <span className="font-medium text-primary">{formatDurationHours(data.totalSeconds)}</span>
                </div>
              </div>
              
               <div className="flex items-center gap-2">
                <ShareButton 
                  title="Monthly Focus"
                  subtitle={format(monthStart, 'MMMM yyyy')}
                  mainStat={formatDurationHours(data.totalSeconds)}
                  label="Total Work Time"
                  fileName={`monthly-stats-${month}`}
                />
                <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1" />
                <a
                  href={`/api/export/month.csv?month=${month}`}
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  CSV
                </a>
                <a
                  href={`/api/export/month.pdf?month=${month}`}
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-sm font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </a>
              </div>
            </div>

            {/* Compact Calendar Grid */}
            <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm bg-white/40 dark:bg-black/20">
              <div className="grid grid-cols-7 bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                {weekDays.map((day) => (
                  <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-white/5">
                {calendarDays.map((day, idx) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="aspect-[1.2] bg-gray-50/30 dark:bg-white/2"
                      />
                    )
                  }

                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayData = data.days[dateStr]
                  const totalSeconds = dayData?.totalSeconds || 0
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  
                  // Heatmap colors based on hours
                  const hours = totalSeconds / 3600
                  let bgClass = ''
                  if (totalSeconds > 0) {
                     if (hours < 2) bgClass = 'bg-primary/10'
                     else if (hours < 4) bgClass = 'bg-primary/20'
                     else if (hours < 6) bgClass = 'bg-primary/30'
                     else bgClass = 'bg-primary/40'
                  }

                  return (
                    <div
                      key={dateStr}
                      className={`relative aspect-[1.2] group ${
                        isToday ? 'ring-2 ring-inset ring-primary z-10' : ''
                      } ${bgClass} transition-colors hover:bg-primary/20 dark:hover:bg-white/10`}
                    >
                      <Link
                        href={`/dashboard/day?date=${dateStr}`}
                        prefetch={true}
                        className="w-full h-full p-2 flex flex-col justify-between"
                      >
                         <span className={`text-sm ${isToday ? 'font-bold text-primary dark:text-primary' : 'text-foreground/70'}`}>
                           {format(day, 'd')}
                         </span>
                         
                         {totalSeconds > 0 && (
                           <div className="text-xs font-medium text-foreground truncate">
                             {formatDurationHours(totalSeconds)}
                           </div>
                         )}
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-red-500 py-10">Failed to load data</div>
        )}
      </div>
    </div>
  )
}
