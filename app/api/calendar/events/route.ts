import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createCalendarEvent, CalendarEventData } from '@/lib/google-calendar'
import { withFreshTokens } from '@/lib/token-manager'

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
    
    // Create calendar events for each connected user
    const results = []
    let hasAnyError = false
    
    for (const userId of userIds) {
      try {
        // Get user's timezone
        const userTimezone = userTimezones[userId]
        
        // Prepare event data with timezone-aware dates
        const startDateTime = new Date(`${scheduledDate} ${scheduledTime}`)
        const endDateTime = new Date(startDateTime)
        endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes)

        const eventData: CalendarEventData = {
          summary: `heliosrecruit.com interview with ${applicantName} and ${recruiterName}`,
          description: `Interview for ${jobTitle} position at ${company}.\n\nAttendees:\n- ${applicantName} (Candidate)\n- ${recruiterName} (Recruiter)\n- Sales Representative\n\nMeeting Link: Google Meet will be automatically generated`,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          timeZone: userTimezone, // Use the user's timezone
          attendees: [
            { email: recruiterEmail, displayName: recruiterName },
            { email: salesRepEmail, displayName: 'Sales Representative' },
          ],
          conferenceData: {
            createRequest: {
              requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
              conferenceSolutionKey: {
                type: 'hangoutsMeet'
              }
            }
          }
        }

        // Use withFreshTokens to handle automatic token refresh
        const event = await withFreshTokens(userId, async (oauth2Client) => {
          return await createCalendarEvent(oauth2Client, eventData)
        })

        if (event) {
          results.push({
            userId,
            eventId: event.id,
            meetingLink: event.hangoutLink,
            status: 'success',
          })
        } else {
          // This shouldn't happen since we checked connections above, but handle it
          hasAnyError = true
          results.push({
            userId,
            status: 'error',
            error: 'Failed to create calendar event',
          })
        }

      } catch (error) {
        console.error(`Error creating calendar event for user ${userId}:`, error)
        hasAnyError = true
        results.push({
          userId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // If any calendar creation failed, return error
    if (hasAnyError) {
      return NextResponse.json({
        error: 'Failed to create calendar events',
        details: 'Unable to create calendar events for all participants. Please ensure all users have properly connected their Google Calendar.',
        results
      }, { status: 500 })
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