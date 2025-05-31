// OAuth configuration management for scaling with multiple client IDs
export interface OAuthConfig {
  clientId: string
  clientSecret: string
  name: string
  maxUsers: number
  currentUsers?: number
}

// Store OAuth configurations (in production, these would come from a secure config service)
const OAUTH_CONFIGS: OAuthConfig[] = [
  {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    name: 'primary',
    maxUsers: 100, // Google's default quota
  },
  // Add more configurations as needed for scaling
  ...(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_2 ? [{
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_2,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET_2!,
    name: 'secondary',
    maxUsers: 100,
  }] : []),
]

// Get the least loaded OAuth configuration
export const getAvailableOAuthConfig = async (): Promise<OAuthConfig> => {
  // In production, you'd query the database to get current user counts
  // For now, we'll use round-robin or the first available
  
  // Simple implementation: return the first config
  // In production, implement load balancing logic
  return OAUTH_CONFIGS[0]
}

// Get OAuth config by client ID (for callbacks)
export const getOAuthConfigByClientId = (clientId: string): OAuthConfig | undefined => {
  return OAUTH_CONFIGS.find(config => config.clientId === clientId)
}

// Generate a unique state parameter with OAuth config info
export const generateOAuthState = (userId: string, configName: string): string => {
  const stateData = {
    userId,
    configName,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(7),
  }
  
  // Encode as base64 for URL safety
  return Buffer.from(JSON.stringify(stateData)).toString('base64url')
}

// Parse OAuth state parameter
export const parseOAuthState = (state: string): { userId: string; configName: string } | null => {
  try {
    const decoded = Buffer.from(state, 'base64url').toString()
    const data = JSON.parse(decoded)
    
    // Validate timestamp (expire after 10 minutes)
    if (Date.now() - data.timestamp > 10 * 60 * 1000) {
      return null
    }
    
    return {
      userId: data.userId,
      configName: data.configName,
    }
  } catch {
    return null
  }
} 