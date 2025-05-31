import { createServerSupabaseClient } from '@/lib/supabase/server'
import { refreshAccessToken, createAuthorizedClient } from './google-calendar'
import { OAuth2Client } from 'google-auth-library'

// Token encryption (in production, use a proper encryption library)
const encryptToken = (token: string): string => {
  // In production, use proper encryption with a key management service
  // For now, we'll use base64 encoding as a placeholder
  return Buffer.from(token).toString('base64')
}

const decryptToken = (encrypted: string): string => {
  // In production, use proper decryption
  return Buffer.from(encrypted, 'base64').toString()
}

export interface TokenData {
  accessToken: string
  refreshToken: string
  expiryDate: number
  encrypted?: boolean
}

// Get tokens for a user with automatic refresh
export const getUserTokens = async (userId: string): Promise<TokenData | null> => {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data: connection } = await (supabase as any)
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single()

    if (!connection) return null

    // Decrypt tokens
    const accessToken = connection.encrypted 
      ? decryptToken(connection.access_token)
      : connection.access_token
    
    const refreshToken = connection.encrypted
      ? decryptToken(connection.refresh_token)
      : connection.refresh_token

    const tokenData: TokenData = {
      accessToken,
      refreshToken,
      expiryDate: connection.token_expiry ? new Date(connection.token_expiry).getTime() : 0,
      encrypted: connection.encrypted || false,
    }

    // Check if token is expired or will expire in the next 5 minutes
    const now = Date.now()
    const fiveMinutesFromNow = now + (5 * 60 * 1000)
    
    if (tokenData.expiryDate && tokenData.expiryDate < fiveMinutesFromNow) {
      // Token is expired or about to expire, refresh it
      const newTokens = await refreshTokenForUser(userId, refreshToken)
      if (newTokens) {
        return newTokens
      }
    }

    return tokenData
  } catch (error) {
    console.error('Error getting user tokens:', error)
    return null
  }
}

// Refresh token for a user and save to database
export const refreshTokenForUser = async (
  userId: string, 
  refreshToken: string
): Promise<TokenData | null> => {
  try {
    const newCredentials = await refreshAccessToken(refreshToken)
    
    if (!newCredentials.access_token) {
      throw new Error('No access token received from refresh')
    }

    const tokenData: TokenData = {
      accessToken: newCredentials.access_token,
      refreshToken: newCredentials.refresh_token || refreshToken,
      expiryDate: newCredentials.expiry_date || Date.now() + (60 * 60 * 1000), // 1 hour default
      encrypted: true,
    }

    // Save encrypted tokens to database
    await saveUserTokens(userId, tokenData)
    
    return tokenData
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

// Save user tokens securely
export const saveUserTokens = async (userId: string, tokens: TokenData): Promise<void> => {
  const supabase = await createServerSupabaseClient()
  
  // Encrypt tokens before saving
  const encryptedAccessToken = encryptToken(tokens.accessToken)
  const encryptedRefreshToken = encryptToken(tokens.refreshToken)

  const { error } = await (supabase as any)
    .from('calendar_connections')
    .update({
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expiry: new Date(tokens.expiryDate).toISOString(),
      encrypted: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google')

  if (error) {
    throw new Error(`Failed to save tokens: ${error.message}`)
  }
}

// Create an authorized OAuth client with automatic token refresh
export const createAuthorizedClientForUser = async (
  userId: string
): Promise<OAuth2Client | null> => {
  const tokens = await getUserTokens(userId)
  
  if (!tokens) return null

  return createAuthorizedClient(tokens.accessToken, tokens.refreshToken)
}

// Middleware function to ensure tokens are fresh before making API calls
export const withFreshTokens = async <T>(
  userId: string,
  callback: (client: OAuth2Client) => Promise<T>
): Promise<T | null> => {
  try {
    const client = await createAuthorizedClientForUser(userId)
    if (!client) {
      throw new Error('No OAuth client available')
    }

    return await callback(client)
  } catch (error: any) {
    // If the error is due to invalid tokens, try refreshing once
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      console.log('Token expired, attempting refresh...')
      
      const tokens = await getUserTokens(userId)
      if (tokens && tokens.refreshToken) {
        const newTokens = await refreshTokenForUser(userId, tokens.refreshToken)
        if (newTokens) {
          const newClient = createAuthorizedClient(newTokens.accessToken, newTokens.refreshToken)
          return await callback(newClient)
        }
      }
    }
    
    console.error('Error in withFreshTokens:', error)
    return null
  }
}

// Batch token refresh for multiple users (useful for scheduled jobs)
export const batchRefreshTokens = async (userIds: string[]): Promise<void> => {
  const results = await Promise.allSettled(
    userIds.map(async (userId) => {
      const tokens = await getUserTokens(userId)
      if (!tokens) return

      // Check if token needs refresh (expires in next hour)
      const oneHourFromNow = Date.now() + (60 * 60 * 1000)
      if (tokens.expiryDate && tokens.expiryDate < oneHourFromNow) {
        await refreshTokenForUser(userId, tokens.refreshToken)
      }
    })
  )

  const failures = results.filter(r => r.status === 'rejected')
  if (failures.length > 0) {
    console.error(`Failed to refresh tokens for ${failures.length} users`)
  }
} 