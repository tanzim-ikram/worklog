import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLocalDate } from '@/lib/utils/timezone'
import { getTimerStatus } from '@/lib/utils/timer'
import { ensureProfile } from '@/lib/utils/profile'

export async function POST(request: Request) {
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

    const now = new Date()
    const localDate = getLocalDate(now, profile.timezone)

    // Create session and segment in a transaction
    const { data: session, error: sessionError } = await supabase
      .from('work_sessions')
      .insert({
        user_id: user.id,
        local_date: localDate,
        status: 'active',
      })
      .select()
      .single()

    if (sessionError) {
      return NextResponse.json(
        { error: `Failed to create session: ${sessionError.message}` },
        { status: 500 }
      )
    }

    const { data: segment, error: segmentError } = await supabase
      .from('work_segments')
      .insert({
        session_id: session.id,
        user_id: user.id,
        start_at: now.toISOString(),
        end_at: null,
      })
      .select()
      .single()

    if (segmentError) {
      // Clean up session if segment creation fails
      await supabase.from('work_sessions').delete().eq('id', session.id)
      return NextResponse.json(
        { error: `Failed to create segment: ${segmentError.message}` },
        { status: 500 }
      )
    }

    const newStatus = await getTimerStatus(user.id, profile.timezone)

    return NextResponse.json(newStatus)
  } catch (error: any) {
    console.error('Timer start error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

