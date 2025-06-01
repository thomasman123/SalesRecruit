# Calendar Integration Guide

This guide explains the complete calendar integration system for Helios Recruit.

## Features

1. **Google Calendar Integration** - Both sales reps and recruiters can connect their Google Calendar
2. **Availability Management** - Users can set their weekly availability
3. **Conflict Prevention** - The system prevents double-booking by checking both users' calendars
4. **Automatic Google Meet** - Interview invitations automatically include Google Meet links
5. **Proper Title Format** - Calendar events use the format: "heliosrecruit.com interview with [Sales Rep] and [Recruiter]"

## Setup

### 1. Database Tables

The system uses these tables:
- `calendar_connections` - Stores OAuth tokens for Google Calendar
- `calendar_availability` - Stores user availability preferences  
- `scheduled_interviews` - Stores booked interview details

### 2. Navigation

Both sales reps and recruiters have a "Calendar" section in their navigation:
- Sales Reps: `/dashboard/calendar`
- Recruiters: `/recruiter/calendar`

### 3. Booking Flow

1. **Sales rep receives invite** in `/dashboard/invites`
2. **Clicks "Book Interview Time"** 
3. **System fetches available slots** that work for both users:
   - Checks both users' availability settings
   - Checks existing scheduled interviews
   - Checks Google Calendar if connected
4. **Sales rep selects date/time**
5. **System creates**:
   - Database record in `scheduled_interviews`
   - Google Calendar events for both users (if calendars connected)
   - Google Meet link automatically included

## API Endpoints

- `POST /api/calendar/availability` - Get available time slots
- `POST /api/calendar/events` - Create Google Calendar events
- `GET /api/auth/google` - Start Google OAuth flow
- `POST /api/auth/google/callback` - Handle OAuth callback

## Troubleshooting

### "Sales rep not found" Error
Run the SQL script `fix_users_table_rls.sql` to allow API access to user data.

### Logout Issues
The system now properly handles authentication errors without logging users out.

### No Available Slots
Check that:
1. Both users have set their availability in Calendar settings
2. There are overlapping available times
3. The selected date isn't fully booked

## Google Calendar Setup

1. User clicks "Connect Google Calendar" 
2. Authorizes the app to access their calendar
3. System stores OAuth tokens securely
4. Future bookings automatically sync to Google Calendar

## Security

- OAuth tokens are encrypted in the database
- Row Level Security (RLS) ensures users can only see their own data
- Calendar connections are user-specific 