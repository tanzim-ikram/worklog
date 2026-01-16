'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [timezone, setTimezone] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Password Reset State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      setPasswordLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      setPasswordLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Common timezones
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
      <div className="glass-panel p-6 rounded-2xl animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-xl"></div>
          <div className="h-12 bg-gray-100 dark:bg-white/5 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl space-y-8">
        {/* Profile Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-primary">Profile Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
                Profile updated successfully!
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-surface-foreground mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-surface-foreground mb-1">
                Timezone
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Typically used for daily stats grouping
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>

        <hr className="border-gray-200 dark:border-white/10" />

        {/* Security Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-primary">Security</h2>
          <form onSubmit={handlePasswordReset} className="space-y-5">
            {passwordError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
                Password updated successfully!
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-surface-foreground mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-foreground mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
