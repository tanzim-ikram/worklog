import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Ensures a user profile exists, creating it with default values if missing
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @returns Profile object with timezone
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ timezone: string }> {
  // Try to get existing profile
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single()

  // If profile exists, return it
  if (profile && !fetchError) {
    return profile
  }

  // Profile doesn't exist, try to create it with default timezone
  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      timezone: 'UTC', // Default timezone
    })
    .select('timezone')
    .single()

  // If we get a duplicate key error, the profile was created between our check and insert
  // (e.g., by the trigger or another concurrent request)
  if (createError) {
    // Check if it's a duplicate key error (PostgreSQL error code 23505)
    const isDuplicateKeyError =
      createError.code === '23505' ||
      createError.message?.includes('duplicate key') ||
      createError.message?.includes('unique constraint') ||
      createError.message?.includes('profiles_pkey')

    if (isDuplicateKeyError) {
      // Profile was created by another process (trigger or concurrent request)
      // Fetch it again - it should exist now
      const { data: existingProfile, error: retryError } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', userId)
        .single()

      if (existingProfile && !retryError) {
        return existingProfile
      }

      // If we still can't fetch it after duplicate error, there might be an RLS issue
      // Return a default profile object to prevent complete failure
      console.warn(
        `Profile exists but cannot be fetched for user ${userId}. Using default timezone.`
      )
      return { timezone: 'UTC' }
    }

    // For other errors, throw them
    throw new Error(
      `Failed to create profile: ${createError.message || 'Unknown error'}`
    )
  }

  if (!newProfile) {
    throw new Error('Failed to create profile: No data returned')
  }

  return newProfile
}

