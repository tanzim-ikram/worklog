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

    // Check if running
    const status = await getTimerStatus(user.id, profile.timezone)
    if (status.isRunning && status.currentSegment) {
      const now = new Date()

      // Update segment to set end_at
      const { error: updateError } = await supabase
        .from('work_segments')
        .update({ end_at: now.toISOString() })
        .eq('id', status.currentSegment.id)
        .eq('user_id', user.id)
        .is('end_at', null)

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to stop timer: ${updateError.message}` },
          { status: 500 }
        )
      }
    }

    // Mark session as stopped if it exists
    if (status.currentSession) {
      await supabase
        .from('work_sessions')
        .update({ status: 'stopped' })
        .eq('id', status.currentSession.id)
        .eq('user_id', user.id)
    }

    const newStatus = await getTimerStatus(user.id, profile.timezone)

    return NextResponse.json(newStatus)
  } catch (error: any) {
    console.error('Timer stop error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

