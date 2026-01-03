import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
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
    const monthParam = searchParams.get('month')
    if (!monthParam) {
      return NextResponse.json({ error: 'Month parameter required (YYYY-MM)' }, { status: 400 })
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

    const monthStart = startOfMonth(parseISO(monthParam + '-01'))
    const monthEnd = endOfMonth(monthStart)
    const startDateStr = format(monthStart, 'yyyy-MM-dd')
    const endDateStr = format(monthEnd, 'yyyy-MM-dd')

    // Get all sessions in the month
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
    const days: Record<string, { totalSeconds: number; sessionCount: number }> = {}
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    allDays.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      days[dateStr] = { totalSeconds: 0, sessionCount: 0 }
    })

    // Group sessions by day
    sessions?.forEach((session) => {
      if (days[session.local_date]) {
        days[session.local_date].sessionCount++
      }
    })

    // Calculate totals per day
    const now = new Date()
    let monthTotalSeconds = 0

    Object.keys(days).forEach((dateStr) => {
      const daySessions = sessions?.filter((s) => s.local_date === dateStr) || []
      const daySessionIds = daySessions.map((s) => s.id)
      const daySegments = segments.filter((seg) => daySessionIds.includes(seg.session_id))

      const dayTotal = daySegments.reduce((total, seg) => {
        const start = new Date(seg.start_at)
        const end = seg.end_at ? new Date(seg.end_at) : now
        return total + Math.floor((end.getTime() - start.getTime()) / 1000)
      }, 0)

      days[dateStr].totalSeconds = dayTotal
      monthTotalSeconds += dayTotal
    })

    return NextResponse.json({
      month: monthParam,
      days,
      totalSeconds: monthTotalSeconds,
    })
  } catch (error: any) {
    console.error('Month summary error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

