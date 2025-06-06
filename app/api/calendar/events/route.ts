import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createCalendarEvent, CalendarEventData } from '@/lib/google-calendar'
import { withFreshTokens } from '@/lib/token-manager'

// Utility to convert sales rep local date/time to UTC Date using timezone string
const toUtc = (dateStr: string, timeStr: string, tz: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  // Create date assuming it's in the target timezone, then find equivalent UTC
  const asLocal = new Date(Date.UTC(year, month - 1, day, hour, minute))
  const localInTarget = new Date(asLocal.toLocaleString('en-US', { timeZone: tz }))
  const offset = asLocal.getTime() - localInTarget.getTime()
  return new Date(asLocal.getTime() + offset)
}

const formatForTz = (utc: Date, tz: string): string => {
  const zoned = new Date(utc.toLocaleString('en-US', { timeZone: tz }))
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${zoned.getFullYear()}-${pad(zoned.getMonth() + 1)}-${pad(zoned.getDate())}T${pad(zoned.getHours())}:${pad(zoned.getMinutes())}:00`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      recruiterId,
      salesRepId,
      jobTitle,
      company,
      scheduledDate,
      scheduledTime,
      durationMinutes = 30,
      applicantName,
      recruiterName,
      recruiterEmail,
      salesRepEmail,
    } = body

    // Get user IDs to create events for
    const userIds = [recruiterId, salesRepId].filter(Boolean)
    
    // First, check if ALL users have calendar connections AND get their timezones
    const admin = getSupabaseAdmin()

    const connectionAndTimezoneChecks = await Promise.all(
      userIds.map(async (userId) => {
        const [connectionResult, userResult] = await Promise.all([
          (admin as any)
            .from('calendar_connections')
            .select('id, user_id')
            .eq('user_id', userId)
            .eq('provider', 'google')
            .limit(1)
            .single(),
          (admin as any)
            .from('users')
            .select('timezone')
            .eq('id', userId)
            .limit(1)
            .single(),
        ])
        
        return {
          userId,
          hasConnection: !!connectionResult.data,
          timezone: userResult.data?.timezone || 'Australia/Sydney'
        }
      })
    )
    
    // Check if any user doesn't have a connection
    const usersWithoutConnection = connectionAndTimezoneChecks.filter(check => !check.hasConnection)
    
    if (usersWithoutConnection.length > 0) {
      // Return error with details about which users need to connect
      return NextResponse.json({
        error: 'Google Calendar not connected',
        details: 'All participants must have their Google Calendar connected to schedule interviews.',
        usersWithoutConnection: usersWithoutConnection.map(u => u.userId),
        requiresConnection: true
      }, { status: 400 })
    }
    
    // Get timezone for each user
    const userTimezones = connectionAndTimezoneChecks.reduce((acc, check) => {
      acc[check.userId] = check.timezone
      return acc
    }, {} as Record<string, string>)
    
    // Use sales rep's timezone as anchor instant
    const salesRepTz = userTimezones[salesRepId]
    const startUtc = toUtc(scheduledDate, scheduledTime, salesRepTz)
    const endUtc = new Date(startUtc.getTime() + durationMinutes * 60 * 1000)

    // Create calendar event only on recruiter calendar (as the authoritative source)
    const results = []
    let hasAnyError = false

    const ownerId = recruiterId || userIds[0]
    try {
      const userTimezone = userTimezones[ownerId]

      const startDateTimeStr = formatForTz(startUtc, userTimezone)
      const endDateTimeStr = formatForTz(endUtc, userTimezone)

      const eventData: CalendarEventData = {
        summary: `heliosrecruit.com interview with ${applicantName} and ${recruiterName}`,
        description: `Interview for ${jobTitle} position at ${company}.

Attendees:\n- ${applicantName} (Candidate)\n- ${recruiterName} (Recruiter)\n- Sales Representative\n\nMeeting Link: Google Meet will be automatically generated`,
        startDateTime: startDateTimeStr,
        endDateTime: endDateTimeStr,
        timeZone: userTimezone,
        attendees: [
          { email: recruiterEmail, displayName: recruiterName },
          { email: salesRepEmail, displayName: 'Sales Representative' },
        ],
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      }

      const event = await withFreshTokens(ownerId, async (client) => {
        return await createCalendarEvent(client, eventData)
      })

      if (event) {
        results.push({ userId: ownerId, eventId: event.id, meetingLink: event.hangoutLink, status: 'success' })
      } else {
        hasAnyError = true
        results.push({ userId: ownerId, status: 'error', error: 'Failed to create calendar event' })
      }
    } catch (error) {
      console.error(`Error creating calendar event:`, error)
      hasAnyError = true
      results.push({ userId: ownerId, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
    }

    // Update scheduled interview with meeting link
    const successfulResults = results.filter(r => r.status === 'success')
    const meetingLink = successfulResults.find(r => r.meetingLink)?.meetingLink
    const calendarEventId = successfulResults.find(r => r.eventId)?.eventId

    if (meetingLink || calendarEventId) {
      const updateData: any = {}
      if (meetingLink) updateData.meeting_link = meetingLink
      if (calendarEventId) updateData.calendar_event_id = calendarEventId

      await (supabase as any)
        .from('scheduled_interviews')
        .update(updateData)
        .eq('recruiter_id', recruiterId)
        .eq('sales_rep_id', salesRepId)
        .eq('scheduled_date', scheduledDate)
        .eq('scheduled_time', scheduledTime)
    }

    // Return success only if ALL events were created successfully
    const summary = {
      success: true,
      totalUsers: userIds.length,
      successful: successfulResults.length,
      results,
      meetingLink,
    }

    return NextResponse.json(summary)

  } catch (error) {
    console.error('Error creating calendar events:', error)
    return NextResponse.json({ 
      error: 'Failed to create calendar events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 