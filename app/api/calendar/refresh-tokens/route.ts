import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { batchRefreshTokens } from '@/lib/token-manager'

// This endpoint should be called by a cron job every hour
// to refresh tokens that are about to expire
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    
    // Get all calendar connections that might need refresh
    const { data: connections, error } = await (supabase as any)
      .from('calendar_connections')
      .select('user_id, token_expiry')
      .eq('provider', 'google')
      .not('refresh_token', 'is', null)

    if (error) {
      throw error
    }

    // Filter connections that need refresh (expiring in next 2 hours)
    const twoHoursFromNow = Date.now() + (2 * 60 * 60 * 1000)
    const userIdsToRefresh = connections
      .filter((conn: any) => {
        if (!conn.token_expiry) return true // No expiry, refresh to be safe
        const expiry = new Date(conn.token_expiry).getTime()
        return expiry < twoHoursFromNow
      })
      .map((conn: any) => conn.user_id)

    if (userIdsToRefresh.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No tokens need refresh',
        checked: connections.length,
      })
    }

    // Batch refresh tokens
    await batchRefreshTokens(userIdsToRefresh)

    // Log the operation
    console.log(`Refreshed tokens for ${userIdsToRefresh.length} users`)

    return NextResponse.json({ 
      success: true,
      refreshed: userIdsToRefresh.length,
      checked: connections.length,
    })

  } catch (error) {
    console.error('Error in batch token refresh:', error)
    return NextResponse.json({ 
      error: 'Failed to refresh tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to check the status (for monitoring)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    
    // Get statistics about token expiration
    const { data: connections } = await (supabase as any)
      .from('calendar_connections')
      .select('token_expiry')
      .eq('provider', 'google')

    if (!connections) {
      return NextResponse.json({ 
        total: 0,
        expired: 0,
        expiringIn1Hour: 0,
        expiringIn24Hours: 0,
      })
    }

    const now = Date.now()
    const oneHourFromNow = now + (60 * 60 * 1000)
    const oneDayFromNow = now + (24 * 60 * 60 * 1000)

    const stats = {
      total: connections.length,
      expired: 0,
      expiringIn1Hour: 0,
      expiringIn24Hours: 0,
    }

    connections.forEach((conn: any) => {
      if (!conn.token_expiry) return
      
      const expiry = new Date(conn.token_expiry).getTime()
      if (expiry < now) {
        stats.expired++
      } else if (expiry < oneHourFromNow) {
        stats.expiringIn1Hour++
      } else if (expiry < oneDayFromNow) {
        stats.expiringIn24Hours++
      }
    })

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error getting token stats:', error)
    return NextResponse.json({ 
      error: 'Failed to get token statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 