'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'

interface Session {
  id: string
  local_date: string
  note?: string
  project_id?: string
  segments: Array<{
    id: string
    start_at: string
    end_at: string | null
  }>
}

export default function EditSessionPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/get`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch session')
      }
      const foundSession: Session = await res.json()
      setSession(foundSession)
      setNote(foundSession.note || '')
      
      if (foundSession.segments && foundSession.segments.length > 0) {
        const firstStart = foundSession.segments[0].start_at
        const lastEnd = foundSession.segments[foundSession.segments.length - 1]?.end_at
        setStartAt(format(parseISO(firstStart), "yyyy-MM-dd'T'HH:mm"))
        if (lastEnd) {
          setEndAt(format(parseISO(lastEnd), "yyyy-MM-dd'T'HH:mm"))
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const updateData: any = { note }
      if (startAt) {
        updateData.start_at = new Date(startAt).toISOString()
      }
      if (endAt) {
        updateData.end_at = new Date(endAt).toISOString()
      }

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update session')
      }

      router.back()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error && !session) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Session</h1>
        <p className="mt-1 text-sm text-gray-500">Edit session details</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              id="date"
              type="text"
              value={session.local_date}
              disabled
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="startAt" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              id="startAt"
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>

          <div>
            <label htmlFor="endAt" className="block text-sm font-medium text-gray-700 mb-2">
              End Time (leave empty if still running)
            </label>
            <input
              id="endAt"
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

