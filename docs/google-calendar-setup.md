# Google Calendar Integration Setup

This guide explains how to set up Google Calendar integration for the Helios platform with enhanced security and scaling features.

## Prerequisites

1. A Google Cloud Console account
2. A project in Google Cloud Console
3. OAuth 2.0 credentials

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to APIs & Services > Library
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

### 2. Configure OAuth Consent Screen

1. Go to APIs & Services > OAuth consent screen
2. Choose "External" user type
3. Fill in the required information:
   - App name: Helios
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `.../auth/calendar`
   - `.../auth/calendar.events`
   - `.../auth/userinfo.email`
5. Add test users if in development

### 3. Create OAuth Credentials

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
5. Copy the Client ID and Client Secret

### 4. Configure Environment Variables

Add these to your `.env.local` file:

```env
# App URL (for OAuth callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Primary Google Calendar OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Secondary Google Calendar OAuth (optional, for scaling)
NEXT_PUBLIC_GOOGLE_CLIENT_ID_2=your_second_google_client_id_here
GOOGLE_CLIENT_SECRET_2=your_second_google_client_secret_here

# Cron job secret for token refresh
CRON_SECRET=your_secure_cron_secret_here
```

### 5. Database Setup

Run the migrations to set up the required tables:
- `calendar_connections` - Stores encrypted OAuth tokens
- `calendar_availability` - Stores user availability
- `scheduled_interviews` - Stores interview details with calendar event IDs
- `oauth_client_usage` - Tracks OAuth client usage for load balancing

## Enhanced Security Features

### Token Encryption
- All refresh tokens are encrypted before storage
- Access tokens are encrypted at rest in the database
- Automatic token refresh before expiration

### Secure OAuth Flow
- State parameters include timestamp validation
- Nonce for CSRF protection
- 10-minute expiration on state parameters

### Backend Token Management
- Automatic token refresh 5 minutes before expiration
- Silent token refresh on API calls
- Batch token refresh via cron job

## Scaling with Multiple OAuth Clients

### Why Multiple Client IDs?
Google OAuth has rate limits per client ID. To scale beyond these limits:
1. Create multiple OAuth client IDs in Google Console
2. Configure them in environment variables
3. The system automatically load balances across them

### Load Balancing
- Automatic selection of least-loaded OAuth client
- Tracks usage per client ID
- Database-driven load balancing

### Adding More OAuth Clients
1. Create additional OAuth credentials in Google Console
2. Add to environment variables:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID_3=...
   GOOGLE_CLIENT_SECRET_3=...
   ```
3. Update `lib/oauth-config.ts` to include new configs

## Automatic Token Refresh

### Note for Vercel Hobby Plan Users
The Vercel hobby plan only supports daily cron jobs. You have several options:

1. **Manual Refresh (Recommended for Hobby)**
   - Tokens are automatically refreshed when users access the calendar
   - The system refreshes tokens 5 minutes before expiration
   - No cron job needed for small user bases

2. **Daily Cron Job**
   - Add this to `vercel.json` for daily refresh:
   ```json
   {
     "crons": [{
       "path": "/api/calendar/refresh-tokens",
       "schedule": "0 0 * * *"
     }]
   }
   ```

3. **External Cron Service**
   - Use services like Cron-job.org or EasyCron
   - Call your refresh endpoint with the auth header

4. **Upgrade to Vercel Pro**
   - Enables hourly cron jobs as originally designed

### Manual Token Refresh
You can manually trigger token refresh anytime:

```bash
curl -X POST https://yourdomain.com/api/calendar/refresh-tokens \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Cron Job Setup (Pro Plan)
For Vercel Pro plans, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/calendar/refresh-tokens",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Monitoring Token Health
Check token statistics:
```bash
curl https://yourdomain.com/api/calendar/refresh-tokens \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Response:
```json
{
  "total": 150,
  "expired": 0,
  "expiringIn1Hour": 5,
  "expiringIn24Hours": 20
}
```

## How It Works

1. **Connect Calendar**: Users go to Dashboard > Calendar and click "Connect Google Calendar"
2. **Load Balanced OAuth**: System selects the least-loaded OAuth client
3. **Secure Token Storage**: Tokens are encrypted and stored in database
4. **Event Creation**: Calendar events created with automatic token refresh
5. **Email Invites**: Sent to all participants with Google Meet links

## Features

- ✅ Per-user OAuth flow with secure state management
- ✅ Encrypted token storage
- ✅ Automatic silent token refresh
- ✅ Multiple OAuth client support for scaling
- ✅ Load balancing across OAuth clients
- ✅ Batch token refresh via cron
- ✅ Token health monitoring
- ✅ Google Meet links automatically added

## Troubleshooting

### Common Issues

1. **"Failed to connect calendar"**
   - Check all environment variables are set correctly
   - Ensure redirect URI matches exactly in Google Console
   - Verify OAuth client is not at quota limit

2. **"Invalid state"**
   - State parameter expired (>10 minutes old)
   - Try connecting again

3. **Token refresh failures**
   - Check cron job is running
   - Verify CRON_SECRET is set correctly
   - Check logs for specific user errors

4. **Rate limiting**
   - Add more OAuth client IDs
   - Check oauth_client_usage table for usage stats

### Debug Mode

To debug calendar issues:
1. Check browser console for client-side errors
2. Check server logs for token refresh issues
3. Monitor `/api/calendar/refresh-tokens` endpoint

## Security Best Practices

1. **Environment Variables**
   - Never commit OAuth secrets to version control
   - Use different secrets for each environment
   - Rotate CRON_SECRET regularly

2. **Token Storage**
   - Enable Supabase encryption at rest
   - Consider additional encryption for sensitive environments
   - Regular token cleanup for disconnected users

3. **Monitoring**
   - Set up alerts for failed token refreshes
   - Monitor OAuth client usage
   - Track calendar event creation success rates

## Production Checklist

- [ ] Set up multiple OAuth client IDs for scaling
- [ ] Configure cron job for token refresh (or use alternatives on Hobby plan)
- [ ] Enable monitoring for token health
- [ ] Set up error alerting
- [ ] Test token refresh flow
- [ ] Verify encryption is working
- [ ] Load test with expected user volume 