import { createClient } from '@/lib/supabase/server'
import { getLocalDate } from './timezone'

export interface TimerStatus {
  isRunning: boolean
  currentSegment?: {
    id: string
    startAt: string
    sessionId: string
  }
  currentSession?: {
    id: string
    localDate: string
    note?: string
    projectId?: string
  }
  elapsedSeconds: number
  todayTotalSeconds: number
}

export async function getTimerStatus(userId: string, timezone: string): Promise<TimerStatus> {
  const supabase = await createClient()
  const now = new Date()
  const today = getLocalDate(now, timezone)

  let elapsedSeconds = 0
  let currentSession = undefined
  let currentSegment = undefined

  // Find running segment
  const { data: runningSegment, error: segmentError } = await supabase
    .from('work_segments')
    .select('id, start_at, session_id, work_sessions(*)')
    .eq('user_id', userId)
    .is('end_at', null)
    .maybeSingle()

  if (segmentError && segmentError.code !== 'PGRST116') {
    throw new Error(`Failed to get running segment: ${segmentError.message}`)
  }

  if (runningSegment) {
    currentSegment = {
      id: runningSegment.id,
      startAt: runningSegment.start_at,
      sessionId: runningSegment.session_id,
    }

    const session = Array.isArray(runningSegment.work_sessions)
      ? runningSegment.work_sessions[0]
      : runningSegment.work_sessions

    if (session) {
      currentSession = {
        id: session.id,
        localDate: session.local_date,
        note: session.note || undefined,
        projectId: session.project_id || undefined,
      }

      // Calculate total elapsed seconds for all segments in this session
      const { data: sessionSegments, error: sessionSegmentsError } = await supabase
        .from('work_segments')
        .select('start_at, end_at')
        .eq('session_id', session.id)

      if (!sessionSegmentsError && sessionSegments) {
        elapsedSeconds = sessionSegments.reduce((total, seg) => {
          const start = new Date(seg.start_at)
          const end = seg.end_at ? new Date(seg.end_at) : now
          return total + Math.floor((end.getTime() - start.getTime()) / 1000)
        }, 0)
      }
    }
  } else {
    // If no segment is running, check if there's a recently active session (for the pause state display)
    const { data: lastSession, error: lastSessionError } = await supabase
      .from('work_sessions')
      .select('id, local_date, note, project_id')
      .eq('user_id', userId)
      .eq('local_date', today)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastSessionError && lastSession) {
      currentSession = {
        id: lastSession.id,
        localDate: lastSession.local_date,
        note: lastSession.note || undefined,
        projectId: lastSession.project_id || undefined,
      }

      const { data: sessionSegments, error: sessionSegmentsError } = await supabase
        .from('work_segments')
        .select('start_at, end_at')
        .eq('session_id', lastSession.id)

      if (!sessionSegmentsError && sessionSegments) {
        elapsedSeconds = sessionSegments.reduce((total, seg) => {
          const start = new Date(seg.start_at)
          const end = seg.end_at ? new Date(seg.end_at) : now
          return total + Math.floor((end.getTime() - start.getTime()) / 1000)
        }, 0)
      }
    }
  }

  // Calculate today's total
  const { data: todaySessions, error: sessionsError } = await supabase
    .from('work_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('local_date', today)

  if (sessionsError) {
    throw new Error(`Failed to get today's sessions: ${sessionsError.message}`)
  }

  let todayTotalSeconds = 0
  if (todaySessions && todaySessions.length > 0) {
    const sessionIds = todaySessions.map((s) => s.id)
    const { data: segments, error: segmentsError } = await supabase
      .from('work_segments')
      .select('start_at, end_at')
      .eq('user_id', userId)
      .in('session_id', sessionIds)

    if (segmentsError) {
      throw new Error(`Failed to get today's segments: ${segmentsError.message}`)
    }

    if (segments) {
      todayTotalSeconds = segments.reduce((total, seg) => {
        const start = new Date(seg.start_at)
        const end = seg.end_at ? new Date(seg.end_at) : now
        return total + Math.floor((end.getTime() - start.getTime()) / 1000)
      }, 0)
    }
  }

  return {
    isRunning: !!runningSegment,
    currentSegment,
    currentSession,
    elapsedSeconds,
    todayTotalSeconds,
  }
}

