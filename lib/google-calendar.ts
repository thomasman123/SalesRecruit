import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { getAvailableOAuthConfig, getOAuthConfigByClientId, OAuthConfig } from './oauth-config'

// Create OAuth2 client with specific configuration
export const createOAuth2ClientWithConfig = (config: OAuthConfig) => {
  const redirectUri = process.env.NEXT_PUBLIC_APP_URL + '/api/auth/google/callback'
  
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    redirectUri
  )
}

// Create OAuth2 client (legacy - uses first available config)
export const createOAuth2Client = () => {
  const config = {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    name: 'default',
    maxUsers: 100,
  }
  return createOAuth2ClientWithConfig(config)
}

// Generate Google OAuth URL with load balancing
export const generateAuthUrl = async (userId: string) => {
  const config = await getAvailableOAuthConfig()
  const oauth2Client = createOAuth2ClientWithConfig(config)
  
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
  ]

  // Import after to avoid circular dependency
  const { generateOAuthState } = await import('./oauth-config')
  const state = generateOAuthState(userId, config.name)

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent', // Force consent to get refresh token
    // Include the client_id in auth params for callback identification
    client_id: config.clientId,
  })

  return url
}

// Exchange authorization code for tokens with the correct client
export const getTokensFromCode = async (code: string, clientId?: string) => {
  let oauth2Client: OAuth2Client
  
  if (clientId) {
    const config = getOAuthConfigByClientId(clientId)
    if (!config) {
      throw new Error('Invalid client ID')
    }
    oauth2Client = createOAuth2ClientWithConfig(config)
  } else {
    // Fallback to default client
    oauth2Client = createOAuth2Client()
  }
  
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

// Create OAuth client with tokens
export const createAuthorizedClient = (accessToken: string, refreshToken?: string, clientId?: string) => {
  let oauth2Client: OAuth2Client
  
  if (clientId) {
    const config = getOAuthConfigByClientId(clientId)
    if (!config) {
      throw new Error('Invalid client ID')
    }
    oauth2Client = createOAuth2ClientWithConfig(config)
  } else {
    oauth2Client = createOAuth2Client()
  }
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  
  return oauth2Client
}

// Create calendar event
export interface CalendarEventData {
  summary: string
  description: string
  startDateTime: string
  endDateTime: string
  attendees: { email: string; displayName?: string }[]
  location?: string
  timeZone?: string  // Add timezone parameter
  conferenceData?: {
    createRequest: {
      requestId: string
      conferenceSolutionKey: {
        type: string
      }
    }
  }
}

export const createCalendarEvent = async (
  oauth2Client: OAuth2Client,
  eventData: CalendarEventData
) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  // Use provided timezone or default to user's timezone
  const timeZone = eventData.timeZone || 'Australia/Sydney'

  const event = {
    summary: eventData.summary,
    description: eventData.description + '\n\n📅 Please accept this calendar invite to confirm your attendance.\n\n' +
                 '💡 You will receive reminder emails:\n' +
                 '• 1 day before the interview\n' +
                 '• 2 hours before the interview\n\n' +
                 '🔗 A Google Meet link will be automatically added to this event.',
    start: {
      dateTime: eventData.startDateTime,
      timeZone: timeZone,
    },
    end: {
      dateTime: eventData.endDateTime,
      timeZone: timeZone,
    },
    attendees: eventData.attendees,
    location: eventData.location,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'email', minutes: 2 * 60 },  // 2 hours before
        { method: 'popup', minutes: 30 },      // 30 minutes before
      ],
    },
    conferenceData: eventData.conferenceData,
    // Ensure guests can see other guests and modify the event
    guestsCanSeeOtherGuests: true,
    guestsCanModify: false,
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: eventData.conferenceData ? 1 : 0,
    sendUpdates: 'all', // Send email invites to all attendees
    sendNotifications: true, // Ensure notifications are sent
  })

  return response.data
}

// Check if tokens are expired and refresh if needed
export const refreshAccessToken = async (refreshToken: string, clientId?: string) => {
  let oauth2Client: OAuth2Client
  
  if (clientId) {
    const config = getOAuthConfigByClientId(clientId)
    if (!config) {
      throw new Error('Invalid client ID')
    }
    oauth2Client = createOAuth2ClientWithConfig(config)
  } else {
    oauth2Client = createOAuth2Client()
  }
  
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  })

  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

// Get user's calendar list
export const getCalendarList = async (oauth2Client: OAuth2Client) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  const response = await calendar.calendarList.list()
  return response.data.items || []
}

// Get user's availability (busy times)
export const getAvailability = async (
  oauth2Client: OAuth2Client,
  timeMin: string,
  timeMax: string,
  calendarId: string = 'primary'
) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    },
  })

  return response.data.calendars?.[calendarId]?.busy || []
} 