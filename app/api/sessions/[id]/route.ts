import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
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
    const body = await request.json()

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('work_sessions')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Update session fields
    const updateData: any = {}
    if (body.note !== undefined) updateData.note = body.note
    if (body.project_id !== undefined) updateData.project_id = body.project_id

    const { data: updatedSession, error: updateError } = await supabase
      .from('work_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update session: ${updateError.message}` },
        { status: 500 }
      )
    }

    // If start/end times are provided, update segments
    if (body.start_at || body.end_at) {
      // Get current segments
      const { data: segments, error: segmentsError } = await supabase
        .from('work_segments')
        .select('id')
        .eq('session_id', id)
        .eq('user_id', user.id)
        .order('start_at', { ascending: true })

      if (segmentsError) {
        return NextResponse.json(
          { error: `Failed to get segments: ${segmentsError.message}` },
          { status: 500 }
        )
      }

      if (segments && segments.length > 0) {
        // For simplicity, replace all segments with a single corrected segment
        // Delete existing segments
        await supabase
          .from('work_segments')
          .delete()
          .eq('session_id', id)
          .eq('user_id', user.id)

        // Create new single segment
        const startAt = body.start_at || segments[0].start_at
        const endAt = body.end_at || null

        const { error: createError } = await supabase
          .from('work_segments')
          .insert({
            session_id: id,
            user_id: user.id,
            start_at: startAt,
            end_at: endAt,
          })

        if (createError) {
          return NextResponse.json(
            { error: `Failed to update segments: ${createError.message}` },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json(updatedSession)
  } catch (error: any) {
    console.error('Session update error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

