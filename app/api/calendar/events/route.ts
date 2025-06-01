import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
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
    
    // Create calendar events for each connected user
    const results = []
    
    for (const userId of userIds) {
      try {
        // Prepare event data
        const startDateTime = new Date(`${scheduledDate} ${scheduledTime}`)
        const endDateTime = new Date(startDateTime)
        endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes)

        const eventData: CalendarEventData = {
          summary: `heliosrecruit.com interview with ${applicantName} and ${recruiterName}`,
          description: `Interview for ${jobTitle} position at ${company}.\n\nAttendees:\n- ${applicantName} (Candidate)\n- ${recruiterName} (Recruiter)\n- Sales Representative\n\nMeeting Link: Google Meet will be automatically generated`,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
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
          // User doesn't have calendar connected or token refresh failed
          results.push({
            userId,
            status: 'no_connection',
            error: 'No calendar connection or token refresh failed',
          })
        }

      } catch (error) {
        console.error(`Error creating calendar event for user ${userId}:`, error)
        results.push({
          userId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Update scheduled interview with meeting link if we got one
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

    // Return detailed results for transparency
    const summary = {
      success: true,
      totalUsers: userIds.length,
      successful: successfulResults.length,
      failed: results.filter(r => r.status === 'error').length,
      noConnection: results.filter(r => r.status === 'no_connection').length,
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