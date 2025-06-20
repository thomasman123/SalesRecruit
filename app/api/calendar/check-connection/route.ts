import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userIds } = await request.json()
    
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Use the service-role client so we can safely read other users' rows while still
    // respecting any policies that prevent front-end users from doing so.
    const admin = getSupabaseAdmin()

    const connectionChecks = await Promise.all(
      userIds.map(async (userId) => {
        // Some workspaces might not have the `provider` column yet (legacy schema).
        // Query without filtering by provider to prevent 400 errors when the column is missing.
        const { data: connection, error: connError } = await admin
          .from('calendar_connections')
          .select('id, user_id, created_at')
          .eq('user_id', userId)
          .limit(1)
          .single()

        if (connError) {
          console.error('Error querying calendar_connections for', userId, connError.message)
        }

        return {
          userId,
          hasConnection: !!connection,
          connectedAt: connection?.created_at ?? null,
        }
      }),
    )
    
    const allConnected = connectionChecks.every(check => check.hasConnection)
    const usersWithoutConnection = connectionChecks
      .filter(check => !check.hasConnection)
      .map(check => check.userId)

    return NextResponse.json({
      allConnected,
      connectionChecks,
      usersWithoutConnection,
      message: allConnected 
        ? 'All users have Google Calendar connected' 
        : 'Some users need to connect their Google Calendar'
    })

  } catch (error) {
    console.error('Error checking calendar connections:', error)
    return NextResponse.json({ 
      error: 'Failed to check calendar connections',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 