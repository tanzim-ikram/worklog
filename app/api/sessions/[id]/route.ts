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

    let updatedSession = session
    if (Object.keys(updateData).length > 0) {
      const { data: result, error: updateError } = await supabase
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
      updatedSession = result
    }

    // If start/end times are provided, update segments
    if (body.start_at || body.end_at) {
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

      if (segments && segments.length > 0) {
        // Update the FIRST segment's start_at if provided
        if (body.start_at) {
          const { error: startError } = await supabase
            .from('work_segments')
            .update({ start_at: body.start_at })
            .eq('id', segments[0].id)

          if (startError) throw new Error(`Start time update failed: ${startError.message}`)
        }

        // Update the LAST segment's end_at if provided
        if (body.end_at !== undefined) {
          const lastIdx = segments.length - 1
          const { error: endError } = await supabase
            .from('work_segments')
            .update({ end_at: body.end_at })
            .eq('id', segments[lastIdx].id)

          if (endError) throw new Error(`End time update failed: ${endError.message}`)
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

export async function DELETE(
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

    // Verify session belongs to user and delete (Cascade should handle segments if configured, but let's be safe)
    // Actually standard supabase deletion constraints usually require manual segment deletion unless Cascade is set.
    // Assuming cascade is set given standard setup. If not, we might need to delete segments first.
    // Let's delete segments first just in case.
    await supabase.from('work_segments').delete().eq('session_id', id).eq('user_id', user.id)

    const { error } = await supabase
      .from('work_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
