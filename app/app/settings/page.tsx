'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [timezone, setTimezone] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('timezone, full_name')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      if (profile) {
        setTimezone(profile.timezone || 'UTC')
        setFullName(profile.full_name || '')
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
    setSuccess(false)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          timezone,
          full_name: fullName || null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Common timezones including UTC+6 options
  // Format: { value: timezone, label: display name with UTC offset }
  const timezones = [
    { value: 'UTC', label: 'UTC (UTC+0)' },
    { value: 'America/New_York', label: 'Eastern Time (UTC-5/-4)' },
    { value: 'America/Chicago', label: 'Central Time (UTC-6/-5)' },
    { value: 'America/Denver', label: 'Mountain Time (UTC-7/-6)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8/-7)' },
    { value: 'Europe/London', label: 'London (UTC+0/+1)' },
    { value: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
    { value: 'Europe/Berlin', label: 'Berlin (UTC+1/+2)' },
    { value: 'Asia/Dhaka', label: 'Dhaka, Bangladesh (UTC+6)' },
    { value: 'Asia/Almaty', label: 'Almaty, Kazakhstan (UTC+6)' },
    { value: 'Asia/Bishkek', label: 'Bishkek, Kyrgyzstan (UTC+6)' },
    { value: 'Asia/Omsk', label: 'Omsk, Russia (UTC+6)' },
    { value: 'Asia/Thimphu', label: 'Thimphu, Bhutan (UTC+6)' },
    { value: 'Asia/Urumqi', label: 'Urumqi, China (UTC+6)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
    { value: 'Asia/Kolkata', label: 'Kolkata, India (UTC+5:30)' },
    { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
    { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
    { value: 'Australia/Sydney', label: 'Sydney (UTC+10/+11)' },
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account settings</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Settings saved successfully!
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Your timezone is used to group work sessions by day
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

