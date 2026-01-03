import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, addDays, startOfWeek, endOfWeek, parseISO } from 'date-fns'
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
    const startParam = searchParams.get('start')
    if (!startParam) {
      return NextResponse.json({ error: 'Start date parameter required' }, { status: 400 })
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
    const startDate = parseISO(startParam)
    const endDate = addDays(startDate, 6)

    // Get all sessions in the date range
    const startDateStr = format(startDate, 'yyyy-MM-dd')
    const endDateStr = format(endDate, 'yyyy-MM-dd')

    const { data: sessions, error: sessionsError } = await supabase
      .from('work_sessions')
      .select('id, local_date, note, project_id')
      .eq('user_id', user.id)
      .gte('local_date', startDateStr)
      .lte('local_date', endDateStr)
      .order('local_date', { ascending: true })

    if (sessionsError) {
      return NextResponse.json(
        { error: `Failed to get sessions: ${sessionsError.message}` },
        { status: 500 }
      )
    }

    // Get segments for these sessions
    const sessionIds = sessions?.map((s) => s.id) || []
    let segments: any[] = []

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
    }

    // Group by day
    const days: Record<string, { totalSeconds: number; sessions: any[] }> = {}
    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      days[dateStr] = { totalSeconds: 0, sessions: [] }
    }

    // Group sessions by day
    sessions?.forEach((session) => {
      if (days[session.local_date]) {
        days[session.local_date].sessions.push(session)
      }
    })

    // Calculate totals per day
    const now = new Date()
    let weekTotalSeconds = 0

    Object.keys(days).forEach((dateStr) => {
      const daySessions = days[dateStr].sessions
      const daySessionIds = daySessions.map((s) => s.id)
      const daySegments = segments.filter((seg) => daySessionIds.includes(seg.session_id))

      const dayTotal = daySegments.reduce((total, seg) => {
        const start = new Date(seg.start_at)
        const end = seg.end_at ? new Date(seg.end_at) : now
        return total + Math.floor((end.getTime() - start.getTime()) / 1000)
      }, 0)

      days[dateStr].totalSeconds = dayTotal
      weekTotalSeconds += dayTotal
    })

    return NextResponse.json({
      start: startDateStr,
      end: endDateStr,
      days,
      totalSeconds: weekTotalSeconds,
    })
  } catch (error: any) {
    console.error('Week summary error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

