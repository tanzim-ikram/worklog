import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get session with segments
    const { data: session, error: sessionError } = await supabase
      .from('work_sessions')
      .select('id, local_date, note, project_id, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get segments
    const { data: segments, error: segmentsError } = await supabase
      .from('work_segments')
      .select('id, start_at, end_at')
      .eq('session_id', id)
      .eq('user_id', user.id)
      .order('start_at', { ascending: true })

    if (segmentsError) {
      return NextResponse.json(
        { error: `Failed to get segments: ${segmentsError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...session,
      segments: segments || [],
    })
  } catch (error: any) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

