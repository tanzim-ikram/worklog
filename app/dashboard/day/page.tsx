'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { format, parseISO, addDays, subDays } from 'date-fns'
import { formatDurationHours } from '@/lib/utils/timezone'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ start: string; end: string; note: string }>({ start: '', end: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchDayData()
  }, [date])

  const fetchDayData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/summary/day?date=${date}`)
      if (!res.ok) throw new Error('Failed to fetch day data')
      const dayData = await res.json()
      setData(dayData)
    } catch (err) {
      console.error(err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const navigateDay = (direction: 'prev' | 'next') => {
    const current = parseISO(date)
    const newDate = direction === 'prev' ? subDays(current, 1) : addDays(current, 1)
    setDate(format(newDate, 'yyyy-MM-dd'))
  }

  const handleEditClick = (session: Session) => {
    const firstStart = session.segments[0]?.start_at
    const lastEnd = session.segments[session.segments.length - 1]?.end_at
    
    const formatForInput = (isoStr?: string | null) => {
      if (!isoStr) return ''
      return format(parseISO(isoStr), "yyyy-MM-dd'T'HH:mm")
    }

    setEditingId(session.id)
    setEditForm({
      start: formatForInput(firstStart),
      end: formatForInput(lastEnd),
      note: session.note || ''
    })
  }

  const handleDeleteClick = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return
    
    setDeletingId(sessionId)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await fetchDayData()
    } catch (err) {
      console.error(err)
      alert('Failed to delete session')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSave = async (sessionId: string) => {
    setSaving(true)
    try {
      const payload: any = {
        note: editForm.note,
      }
      
      if (editForm.start) payload.start_at = new Date(editForm.start).toISOString()
      if (editForm.end) payload.end_at = new Date(editForm.end).toISOString()

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to update')
      
      await fetchDayData()
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-600">
            Day View
          </h1>
          <p className="mt-1 text-muted-foreground">Daily sessions & details</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateDay('prev')}
            className="p-2 glass-panel rounded-xl hover:bg-primary/10 transition-colors"
            title="Previous day"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="glass-panel px-4 py-2 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-primary/50 outline-none"
          />
          
          <button
            onClick={() => navigateDay('next')}
            className="p-2 glass-panel rounded-xl hover:bg-primary/10 transition-colors"
            title="Next day"
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
            <div className="mb-6">
              <div className="text-2xl font-semibold text-foreground">
                {format(parseISO(data.date), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total Focus: <span className="font-medium text-primary">{formatDurationHours(data.totalSeconds)}</span>
              </div>
            </div>

            {data.sessions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                No sessions recorded for this day
              </div>
            ) : (
              <div className="space-y-3">
                {data.sessions.map((session) => {
                  const totalSeconds = session.segments.reduce((total, seg) => {
                    const start = parseISO(seg.start_at)
                    const end = seg.end_at ? parseISO(seg.end_at) : new Date()
                    return total + Math.floor((end.getTime() - start.getTime()) / 1000)
                  }, 0)

                  const firstStart = session.segments[0]?.start_at
                  const lastEnd = session.segments[session.segments.length - 1]?.end_at
                  const isEditing = editingId === session.id
                  const isDeleting = deletingId === session.id

                  return (
                    <div 
                      key={session.id} 
                      className={`group relative bg-white/50 dark:bg-white/5 border border-transparent hover:border-primary/20 rounded-xl p-4 transition-all ${
                        isDeleting ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-4 animate-fade-in-up">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Time</label>
                              <input 
                                type="datetime-local" 
                                value={editForm.start}
                                onChange={e => setEditForm({...editForm, start: e.target.value})}
                                className="w-full text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">End Time</label>
                              <input 
                                type="datetime-local" 
                                value={editForm.end}
                                onChange={e => setEditForm({...editForm, end: e.target.value})}
                                className="w-full text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Note</label>
                            <input 
                              type="text" 
                              value={editForm.note}
                              onChange={e => setEditForm({...editForm, note: e.target.value})}
                              className="w-full text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                              placeholder="What were you working on?"
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <button 
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSave(session.id)}
                              disabled={saving}
                              className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm transition-colors disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                          <div>
                            {firstStart && (
                              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <span className="font-mono">{format(parseISO(firstStart), 'HH:mm')}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-mono">{lastEnd ? format(parseISO(lastEnd), 'HH:mm') : <span className="text-primary animate-pulse">Running</span>}</span>
                              </div>
                            )}
                            {session.note ? (
                              <div className="mt-1 text-sm text-foreground/80">{session.note}</div>
                            ) : (
                              <div className="mt-1 text-sm text-muted-foreground italic">Add a note...</div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <div className="text-sm font-mono font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-lg whitespace-nowrap">
                              {formatDurationHours(totalSeconds)}
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEditClick(session)}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                title="Edit session"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(session.id)}
                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                                title="Delete session"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-red-500 py-10">Failed to load data</div>
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
