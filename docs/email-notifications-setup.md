# Email Notifications Setup

## Overview

The interview scheduling system now includes:
1. **Google Calendar Integration** - Automatic calendar invites with Google Meet links
2. **Custom Email Notifications** - Invitation emails to both participants
3. **Automated Reminders** - 24-hour and 2-hour reminder emails

## What's Included

### 1. Google Calendar Events
When interviews are scheduled, the system automatically:
- Creates calendar events for both participants
- Adds Google Meet links
- Sends calendar invites via Google
- Sets up reminders (1 day and 2 hours before)

### 2. Custom Email Notifications
In addition to Google Calendar invites, the system sends:
- **Invitation Email** - Sent immediately when interview is scheduled
- **24-Hour Reminder** - Sent 1 day before the interview
- **2-Hour Reminder** - Sent 2 hours before the interview

## Setup Instructions

### 1. Email Service Provider (Resend)

To enable custom email notifications, you need to set up Resend:

1. Sign up for [Resend](https://resend.com)
2. Add your domain and verify it
3. Get your API key
4. Add to your `.env` file:
   ```
   RESEND_API_KEY=your-resend-api-key
   ```

### 2. Database Migration

Run the migration to add reminder tracking columns:
```bash
npx supabase db push
```

### 3. Cron Job for Reminders

The reminder emails need a cron job to run periodically. You have several options:

#### Option A: Vercel Cron (Recommended for Vercel deployments)
Add to your `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/interview-reminders",
    "schedule": "0 * * * *"  // Every hour
  }]
}
```

#### Option B: External Cron Service
Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):
- URL: `https://your-domain.com/api/cron/interview-reminders`
- Schedule: Every hour
- Method: GET
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`

#### Option C: Supabase Edge Functions
Create a Supabase Edge Function that calls your API endpoint on a schedule.

### 4. Environment Variables

Add these to your `.env` file:
```
# Email notifications
RESEND_API_KEY=your-resend-api-key

# Cron job security
CRON_SECRET=generate-a-random-secret-here

# Your app URL (needed for cron jobs)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 5. Update Email From Address

In `/api/notifications/interview-email/route.ts`, update the from address:
```typescript
from: 'Your Company <notifications@yourdomain.com>',
```

## How It Works

1. **When Interview is Scheduled:**
   - Google Calendar events are created (if calendars connected)
   - Custom invitation emails are sent to both participants
   - Interview is saved to database

2. **Automated Reminders:**
   - Cron job runs every hour
   - Checks for interviews 24 hours away (sends day reminder)
   - Checks for interviews 2 hours away (sends hour reminder)
   - Tracks which reminders have been sent

3. **Email Content:**
   - Professional HTML emails with interview details
   - Meeting link prominently displayed
   - Preparation tips in reminder emails
   - Mobile-responsive design

## Testing

1. **Test Email Sending:**
   ```bash
   curl -X POST http://localhost:3000/api/notifications/interview-email \
     -H "Content-Type: application/json" \
     -d '{
       "type": "invitation",
       "recipientEmail": "test@example.com",
       "recipientName": "Test User",
       "jobTitle": "Sales Representative",
       "company": "Tech Corp",
       "scheduledDate": "2024-01-15",
       "scheduledTime": "14:00",
       "recruiterName": "John Recruiter",
       "salesRepName": "Jane Sales"
     }'
   ```

2. **Test Cron Job:**
   ```bash
   curl http://localhost:3000/api/cron/interview-reminders \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

## Customization

You can customize the email templates in `/api/notifications/interview-email/route.ts`:
- Update colors to match your brand
- Add your logo
- Modify the content and layout
- Add additional information

## Troubleshooting

1. **Emails not sending:**
   - Check RESEND_API_KEY is set correctly
   - Verify domain is configured in Resend
   - Check API logs for errors

2. **Reminders not working:**
   - Verify cron job is running
   - Check CRON_SECRET matches
   - Look for errors in cron job logs

3. **Calendar invites not appearing:**
   - Ensure both users have connected Google Calendar
   - Check Google OAuth is properly configured
   - Verify calendar permissions 