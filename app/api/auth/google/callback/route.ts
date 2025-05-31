import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTokensFromCode } from '@/lib/google-calendar'
import { parseOAuthState } from '@/lib/oauth-config'
import { saveUserTokens, TokenData } from '@/lib/token-manager'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL('/dashboard/calendar?error=auth_failed', request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard/calendar?error=invalid_request', request.url))
  }

  try {
    // Parse the enhanced state parameter
    const stateData = parseOAuthState(state)
    
    if (!stateData) {
      console.error('Invalid or expired state parameter')
      return NextResponse.redirect(new URL('/dashboard/calendar?error=invalid_state', request.url))
    }

    const { userId, configName } = stateData
    const supabase = await createServerSupabaseClient()
    
    // Get the client_id from the callback (Google includes it)
    const clientId = searchParams.get('client_id') || undefined
    
    // Exchange code for tokens using the appropriate client
    const tokens = await getTokensFromCode(code, clientId)
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Missing tokens in response')
    }

    // Prepare token data for secure storage
    const tokenData: TokenData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date || Date.now() + (60 * 60 * 1000), // 1 hour default
      encrypted: true,
    }

    // First, check if connection exists
    const { data: existingConnection } = await (supabase as any)
      .from('calendar_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single()

    if (existingConnection) {
      // Update existing connection
      await saveUserTokens(userId, tokenData)
    } else {
      // Create new connection with encrypted tokens
      const { error: dbError } = await (supabase as any)
        .from('calendar_connections')
        .insert({
          user_id: userId,
          provider: 'google',
          access_token: Buffer.from(tokens.access_token).toString('base64'),
          refresh_token: Buffer.from(tokens.refresh_token).toString('base64'),
          token_expiry: new Date(tokenData.expiryDate).toISOString(),
          encrypted: true,
          oauth_config: configName, // Store which OAuth config was used
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (dbError) {
        console.error('Error saving calendar connection:', dbError)
        return NextResponse.redirect(new URL('/dashboard/calendar?error=save_failed', request.url))
      }
    }

    // Log successful connection for monitoring
    console.log(`Calendar connected for user ${userId} using config ${configName}`)

    // Redirect back to calendar settings with success
    return NextResponse.redirect(new URL('/dashboard/calendar?success=connected', request.url))
  } catch (error) {
    console.error('Error in Google OAuth callback:', error)
    return NextResponse.redirect(new URL('/dashboard/calendar?error=callback_failed', request.url))
  }
} 