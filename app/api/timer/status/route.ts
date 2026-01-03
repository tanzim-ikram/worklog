import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTimerStatus } from '@/lib/utils/timer'
import { ensureProfile } from '@/lib/utils/profile'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const status = await getTimerStatus(user.id, profile.timezone)

    return NextResponse.json(status)
  } catch (error: any) {
    console.error('Timer status error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

