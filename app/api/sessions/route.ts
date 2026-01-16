import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { local_date, start_at, end_at, note, project_id } = await request.json()

        if (!local_date || !start_at) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Create session
        const { data: session, error: sessionError } = await supabase
            .from('work_sessions')
            .insert({
                user_id: user.id,
                local_date,
                note,
                project_id: project_id || null,
                status: 'stopped'
            })
            .select()
            .single()

        if (sessionError) {
            console.error('Session creation error:', sessionError)
            return NextResponse.json({ error: `Failed to create session: ${sessionError.message}` }, { status: 500 })
        }

        // 2. Create segment
        const { error: segmentError } = await supabase
            .from('work_segments')
            .insert({
                session_id: session.id,
                user_id: user.id,
                start_at: new Date(start_at).toISOString(),
                end_at: end_at ? new Date(end_at).toISOString() : null
            })

        if (segmentError) {
            console.error('Segment creation error:', segmentError)
            // Cleanup session if segment fails? For now just return error.
            return NextResponse.json({ error: `Failed to create segment: ${segmentError.message}` }, { status: 500 })
        }

        return NextResponse.json(session)
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
