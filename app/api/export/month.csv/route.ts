import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { formatDuration, formatDurationHours } from '@/lib/utils/timezone'
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
      .select('id, local_date, note, project_id, created_at')
      .eq('user_id', user.id)
      .gte('local_date', startDateStr)
      .lte('local_date', endDateStr)
      .order('local_date, created_at', { ascending: true })

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

    // Build CSV
    const csvRows: string[] = []
    csvRows.push('Date,Session Start,Session End,Duration (hh:mm),Duration (seconds),Note,Project')

    const now = new Date()
    sessions?.forEach((session) => {
      const sessionSegments = segments.filter((seg) => seg.session_id === session.id)
      if (sessionSegments.length === 0) return

      const firstStart = sessionSegments[0].start_at
      const lastEnd = sessionSegments[sessionSegments.length - 1].end_at

      const totalSeconds = sessionSegments.reduce((total, seg) => {
        const start = new Date(seg.start_at)
        const end = seg.end_at ? new Date(seg.end_at) : now
        return total + Math.floor((end.getTime() - start.getTime()) / 1000)
      }, 0)

      const sessionStart = format(parseISO(firstStart), 'yyyy-MM-dd HH:mm:ss')
      const sessionEnd = lastEnd ? format(parseISO(lastEnd), 'yyyy-MM-dd HH:mm:ss') : ''
      const duration = formatDurationHours(totalSeconds)
      const note = session.note || ''
      const project = '' // Could fetch project name if needed

      csvRows.push(
        [
          session.local_date,
          sessionStart,
          sessionEnd,
          duration,
          totalSeconds.toString(),
          `"${note.replace(/"/g, '""')}"`,
          project,
        ].join(',')
      )
    })

    const csv = csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="worklog-${monthParam}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

