import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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

    // Check calendar connections for all users
    const connectionChecks = await Promise.all(
      userIds.map(async (userId) => {
        const { data: connection } = await (supabase as any)
          .from('calendar_connections')
          .select('id, user_id, connected_at')
          .eq('user_id', userId)
          .eq('provider', 'google')
          .single()
        
        return {
          userId,
          hasConnection: !!connection,
          connectedAt: connection?.connected_at
        }
      })
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