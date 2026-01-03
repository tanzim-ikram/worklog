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

  let elapsedSeconds = 0
  let currentSession = undefined
  let currentSegment = undefined

  if (runningSegment) {
    const startAt = new Date(runningSegment.start_at)
    elapsedSeconds = Math.floor((now.getTime() - startAt.getTime()) / 1000)
    currentSegment = {
      id: runningSegment.id,
      startAt: runningSegment.start_at,
      sessionId: runningSegment.session_id,
    }
    if (runningSegment.work_sessions) {
      currentSession = {
        id: runningSegment.work_sessions.id,
        localDate: runningSegment.work_sessions.local_date,
        note: runningSegment.work_sessions.note || undefined,
        projectId: runningSegment.work_sessions.project_id || undefined,
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

