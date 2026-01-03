import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'

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
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: 'From and to date parameters required' },
        { status: 400 }
      )
    }

    // Get all sessions in the date range
    const { data: sessions, error: sessionsError } = await supabase
      .from('work_sessions')
      .select('id, local_date')
      .eq('user_id', user.id)
      .gte('local_date', fromParam)
      .lte('local_date', toParam)

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

      if (segmentsError) {
        return NextResponse.json(
          { error: `Failed to get segments: ${segmentsError.message}` },
          { status: 500 }
        )
      }

      segments = segmentsData || []
    }

    // Group by date and calculate totals
    const calendar: Record<string, number> = {}
    const now = new Date()

    sessions?.forEach((session) => {
      if (!calendar[session.local_date]) {
        calendar[session.local_date] = 0
      }
    })

    // Calculate totals per date
    Object.keys(calendar).forEach((dateStr) => {
      const daySessions = sessions?.filter((s) => s.local_date === dateStr) || []
      const daySessionIds = daySessions.map((s) => s.id)
      const daySegments = segments.filter((seg) => daySessionIds.includes(seg.session_id))

      const dayTotal = daySegments.reduce((total, seg) => {
        const start = new Date(seg.start_at)
        const end = seg.end_at ? new Date(seg.end_at) : now
        return total + Math.floor((end.getTime() - start.getTime()) / 1000)
      }, 0)

      calendar[dateStr] = dayTotal
    })

    return NextResponse.json({ calendar })
  } catch (error: any) {
    console.error('Calendar error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

