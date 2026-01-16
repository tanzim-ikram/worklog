'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface AddSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialDate?: string
}

export default function AddSessionModal({ isOpen, onClose, onSuccess, initialDate }: AddSessionModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    note: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          local_date: form.date,
          start_at: form.start,
          end_at: form.end,
          note: form.note
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create session')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
          <h2 className="text-xl font-bold text-foreground">Add New Session</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Work Date</label>
            <input 
              type="date" 
              required
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
              className="w-full text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Time</label>
              <input 
                type="datetime-local" 
                required
                value={form.start}
                onChange={e => setForm({...form, start: e.target.value})}
                className="w-full text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">End Time</label>
              <input 
                type="datetime-local" 
                required
                value={form.end}
                onChange={e => setForm({...form, end: e.target.value})}
                className="w-full text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Note</label>
            <input 
              type="text" 
              value={form.note}
              onChange={e => setForm({...form, note: e.target.value})}
              className="w-full text-sm bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 outline-none focus:border-primary transition-colors"
              placeholder="What were you working on?"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Add Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
