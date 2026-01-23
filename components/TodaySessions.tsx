'use client'

import { useState, useEffect } from 'react'
import { formatDurationHours } from '@/lib/utils/timezone'
import { format, parseISO } from 'date-fns'
import AddSessionModal from './AddSessionModal'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ start: string; end: string; note: string }>({ start: '', end: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    fetchSessions()

    const handleTimerChange = () => {
      fetchSessions()
    }

    window.addEventListener('worklog-timer-changed', handleTimerChange)
    return () => {
      window.removeEventListener('worklog-timer-changed', handleTimerChange)
    }
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch(`/api/summary/day?date=${today}`)
      if (!res.ok) throw new Error('Failed to fetch sessions')
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
      await fetchSessions()
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
      const session = sessions.find(s => s.id === sessionId)
      if (!session) return

      const payload: any = {}

      // Only include note if changed
      if (editForm.note !== (session.note || '')) {
        payload.note = editForm.note
      }

      // Only include times if changed
      const originalStart = session.segments[0]?.start_at
      const originalEnd = session.segments[session.segments.length - 1]?.end_at

      const formatForInput = (isoStr?: string | null) => {
        if (!isoStr) return ''
        return format(parseISO(isoStr), "yyyy-MM-dd'T'HH:mm")
      }

      if (editForm.start && editForm.start !== formatForInput(originalStart)) {
        const start = new Date(editForm.start)
        if (isNaN(start.getTime())) {
          throw new Error('Invalid start time format')
        }
        payload.start_at = start.toISOString()
      }

      if (editForm.end !== formatForInput(originalEnd)) {
        if (editForm.end) {
          const end = new Date(editForm.end)
          if (isNaN(end.getTime())) {
            throw new Error('Invalid end time format')
          }
          payload.end_at = end.toISOString()
        } else if (originalEnd) {
          payload.end_at = null
        }
      }

      // Final validation: Ensure start < end if both exist
      const finalStart = payload.start_at ? new Date(payload.start_at) : (originalStart ? new Date(originalStart) : null)
      const finalEnd = payload.end_at !== undefined ? (payload.end_at ? new Date(payload.end_at) : null) : (originalEnd ? new Date(originalEnd) : null)

      if (finalStart && finalEnd && finalStart >= finalEnd) {
        throw new Error('Start time must be before end time')
      }

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Update failed with status ${res.status}`)
      }

      await fetchSessions()
      setEditingId(null)

      // Notify other components (like WeeklyStatsCard)
      window.dispatchEvent(new CustomEvent('worklog-timer-changed'))
    } catch (err) {
      console.error('Session update error:', err)
      alert(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-2xl animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-white/10 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 dark:bg-white/5 rounded-xl"></div>
          <div className="h-16 bg-gray-100 dark:bg-white/5 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center flex flex-col items-center justify-center min-h-[200px]">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 hover:bg-primary/20 transition-colors"
          title="Add manual session"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold mb-2">Ready to Focus?</h2>
        <p className="text-muted-foreground max-w-xs">Start the timer above to record your first session today or add one manually.</p>
        <AddSessionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchSessions}
        />
      </div>
    )
  }

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-primary rounded-full"></span>
        Today&apos;s Sessions
      </h2>
      <div className="space-y-3">
        {sessions.map((session) => {
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
              className={`group relative bg-white/50 dark:bg-white/5 border border-transparent hover:border-primary/20 rounded-xl p-4 transition-all ${isDeleting ? 'opacity-50 pointer-events-none' : ''
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
                        onChange={e => setEditForm({ ...editForm, start: e.target.value })}
                        className="w-full text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">End Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.end}
                        onChange={e => setEditForm({ ...editForm, end: e.target.value })}
                        className="w-full text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Note</label>
                    <input
                      type="text"
                      value={editForm.note}
                      onChange={e => setEditForm({ ...editForm, note: e.target.value })}
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
                      className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm transition-colors disabled:opacity-50"
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
      <AddSessionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchSessions}
      />
    </div>
  )
}
