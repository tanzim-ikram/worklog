import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { ensureProfile } from '@/lib/utils/profile'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    if (!dateParam) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 })
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

    const timezone = profile.timezone
    const localDate = dateParam // Expected format: YYYY-MM-DD

    // Get sessions for this date
    const { data: sessions, error: sessionsError } = await supabase
      .from('work_sessions')
      .select('id, local_date, note, project_id, created_at')
      .eq('user_id', user.id)
      .eq('local_date', localDate)
      .order('created_at', { ascending: true })

    if (sessionsError) {
      return NextResponse.json(
        { error: `Failed to get sessions: ${sessionsError.message}` },
        { status: 500 }
      )
    }

    // Get segments for these sessions
    const sessionIds = sessions?.map((s) => s.id) || []
    let segments: any[] = []
    let totalSeconds = 0

    if (sessionIds.length > 0) {
      const { data: segmentsData, error: segmentsError } = await supabase
        .from('work_segments')
        .select('id, session_id, start_at, end_at')
        .eq('user_id', user.id)
        .in('session_id', sessionIds)
        .order('start_at', { ascending: true })

      if (segmentsError) {
        return NextResponse.json(
          { error: `Failed to get segments: ${segmentsError.message}` },
          { status: 500 }
        )
      }

      segments = segmentsData || []

      // Calculate total
      const now = new Date()
      totalSeconds = segments.reduce((total, seg) => {
        const start = new Date(seg.start_at)
        const end = seg.end_at ? new Date(seg.end_at) : now
        return total + Math.floor((end.getTime() - start.getTime()) / 1000)
      }, 0)
    }

    // Group segments by session
    const sessionsWithSegments = sessions?.map((session) => ({
      ...session,
      segments: segments.filter((seg) => seg.session_id === session.id),
    })) || []

    return NextResponse.json({
      date: localDate,
      totalSeconds,
      sessions: sessionsWithSegments,
    })
  } catch (error: any) {
    console.error('Day summary error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

