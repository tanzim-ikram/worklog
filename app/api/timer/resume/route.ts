import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTimerStatus } from '@/lib/utils/timer'
import { ensureProfile } from '@/lib/utils/profile'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for timezone (create if missing)
    let profile
    try {
      profile = await ensureProfile(supabase, user.id)
    } catch (error: any) {
      console.error('Profile error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to get user profile' },
        { status: 500 }
      )
    }

    // Check if already running
    const status = await getTimerStatus(user.id, profile.timezone)
    if (status.isRunning) {
      return NextResponse.json(
        { error: 'Timer is already running', status },
        { status: 409 }
      )
    }

    if (!status.currentSession) {
      return NextResponse.json(
        { error: 'No active session to resume' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Create new segment for the existing session
    const { error: segmentError } = await supabase
      .from('work_segments')
      .insert({
        session_id: status.currentSession.id,
        user_id: user.id,
        start_at: now.toISOString(),
        end_at: null,
      })

    if (segmentError) {
      return NextResponse.json(
        { error: `Failed to resume timer: ${segmentError.message}` },
        { status: 500 }
      )
    }

    const newStatus = await getTimerStatus(user.id, profile.timezone)

    return NextResponse.json(newStatus)
  } catch (error: any) {
    console.error('Timer resume error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

