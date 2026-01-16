'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, parseISO, startOfWeek, addDays, subWeeks, addWeeks } from 'date-fns'
import { formatDurationHours } from '@/lib/utils/timezone'
import AddSessionModal from '@/components/AddSessionModal'
import ShareButton from '@/components/ShareButton'

interface WeekSession {
  id: string
  local_date: string
  note?: string
  project_id?: string
}

export default function WeekPage() {
  const [startDate, setStartDate] = useState(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  )
  const [data, setData] = useState<{
    start: string
    end: string
    days: Record<string, { totalSeconds: number; sessions: WeekSession[] }>
    totalSeconds: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()

  const fetchWeekData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/summary/week?start=${startDate}`)
      if (!res.ok) {
        throw new Error('Failed to fetch week data')
      }
      const weekData = await res.json()
      setData(weekData)
    } catch (err) {
      console.error(err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [startDate])

  useEffect(() => {
    fetchWeekData()
  }, [fetchWeekData])

  const navigateWeek = (direction: 'prev' | 'next') => {
    const current = parseISO(startDate)
    const newDate = direction === 'prev' ? subWeeks(current, 1) : addWeeks(current, 1)
    setStartDate(format(newDate, 'yyyy-MM-dd'))
  }

  const weekDays = []
  if (data) {
    const start = parseISO(data.start)
    for (let i = 0; i < 7; i++) {
      weekDays.push(addDays(start, i))
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Week View
          </h1>
          <p className="mt-1 text-muted-foreground">Weekly overview & totals</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 glass-panel rounded-xl hover:bg-primary/10 transition-colors"
            title="Previous week"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="glass-panel px-4 py-2 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-primary/50 outline-none"
          />
          
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 glass-panel rounded-xl hover:bg-primary/10 transition-colors"
            title="Next week"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data ? (
          <div className="animate-fade-in-up">
            <div className="mb-6 flex justify-between items-start gap-4">
              <div>
                <div className="text-2xl font-semibold text-foreground">
                  Week of {format(parseISO(data.start), 'MMMM d')} - {format(parseISO(data.end), 'MMMM d, yyyy')}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total Focus: <span className="font-medium text-primary">{formatDurationHours(data.totalSeconds)}</span>
                </div>
              </div>
              <ShareButton 
                title="Weekly Focus"
                subtitle={`Week of ${format(parseISO(data.start), 'MMM d')} - ${format(parseISO(data.end), 'MMM d, yyyy')}`}
                mainStat={formatDurationHours(data.totalSeconds)}
                label="Total Work Time"
                fileName={`weekly-stats-${data.start}`}
              />
            </div>

            <div className="space-y-3">
              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayData = data.days[dateStr]
                const totalSeconds = dayData?.totalSeconds || 0
                const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')

                return (
                  <div 
                    key={dateStr} 
                    className={`flex justify-between items-center p-4 rounded-xl bg-white/50 dark:bg-white/5 border ${
                      isToday ? 'border-primary/30 bg-primary/5' : 'border-transparent'
                    } hover:border-primary/20 transition-all`}
                  >
                    <div>
                      <div className={`font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {format(day, 'EEEE, MMMM d')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {dayData?.sessions.length || 0} session{dayData?.sessions.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-mono font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-lg whitespace-nowrap">
                        {formatDurationHours(totalSeconds)}
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedDate(dateStr)
                          setIsAddModalOpen(true)
                        }}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Add session"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center text-red-500 py-10">Failed to load data</div>
        )}
      </div>

      <AddSessionModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchWeekData}
        initialDate={selectedDate}
      />
    </div>
  )
}
