import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { formatDurationHours } from '@/lib/utils/timezone'
import { ensureProfile } from '@/lib/utils/profile'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

    // Get user profile (create if missing, then fetch full_name)
    let profile
    try {
      profile = await ensureProfile(supabase, user.id)
      // Fetch full_name separately if needed
      const { data: profileWithName } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      if (profileWithName) {
        profile = { ...profile, full_name: profileWithName.full_name }
      }
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

    // Create PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20

    // Title
    doc.setFontSize(20)
    doc.text(`Work Report — ${monthParam}`, margin, 30)

    // User info
    // User info
    if ((profile as any).full_name) {
      doc.setFontSize(12)
      doc.text(`User: ${(profile as any).full_name}`, margin, 40)
    }

    let yPos = 50

    // Daily totals table
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const dailyData: any[] = []
    const now = new Date()
    let monthTotalSeconds = 0

    allDays.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const daySessions = sessions?.filter((s) => s.local_date === dateStr) || []
      const daySessionIds = daySessions.map((s) => s.id)
      const daySegments = segments.filter((seg) => daySessionIds.includes(seg.session_id))

      const dayTotal = daySegments.reduce((total, seg) => {
        const start = new Date(seg.start_at)
        const end = seg.end_at ? new Date(seg.end_at) : now
        return total + Math.floor((end.getTime() - start.getTime()) / 1000)
      }, 0)

      monthTotalSeconds += dayTotal

      if (dayTotal > 0) {
        dailyData.push([
          format(day, 'MMM d'),
          format(day, 'EEEE'),
          formatDurationHours(dayTotal),
          daySessions.length.toString(),
        ])
      }
    })

    if (dailyData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Day', 'Duration', 'Sessions']],
        body: dailyData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15
    }

    // Detailed sessions
    if (sessions && sessions.length > 0) {
      doc.setFontSize(16)
      doc.text('Session Details', margin, yPos)
      yPos += 10

      const sessionData: any[] = []
      sessions.forEach((session) => {
        const sessionSegments = segments.filter((seg) => seg.session_id === session.id)
        if (sessionSegments.length === 0) return

        const firstStart = sessionSegments[0].start_at
        const lastEnd = sessionSegments[sessionSegments.length - 1].end_at

        const totalSeconds = sessionSegments.reduce((total, seg) => {
          const start = new Date(seg.start_at)
          const end = seg.end_at ? new Date(seg.end_at) : now
          return total + Math.floor((end.getTime() - start.getTime()) / 1000)
        }, 0)

        sessionData.push([
          session.local_date,
          format(parseISO(firstStart), 'HH:mm'),
          lastEnd ? format(parseISO(lastEnd), 'HH:mm') : 'Running',
          formatDurationHours(totalSeconds),
          session.note || '',
        ])
      })

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Start', 'End', 'Duration', 'Note']],
        body: sessionData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15
    }

    // Month total
    doc.setFontSize(14)
    doc.text(
      `Month Total: ${formatDurationHours(monthTotalSeconds)}`,
      margin,
      yPos
    )

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="worklog-${monthParam}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

