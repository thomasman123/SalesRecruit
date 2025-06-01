import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { recruiterId, salesRepId, date } = await request.json()
    
    if (!recruiterId || !salesRepId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get both users' availability settings
    const { data: recruiterAvailability } = await supabase
      .from('calendar_availability')
      .select('*')
      .eq('user_id', recruiterId)
      .eq('day_of_week', new Date(date).getDay())
      .single()

    const { data: salesRepAvailability } = await supabase
      .from('calendar_availability')
      .select('*')
      .eq('user_id', salesRepId)
      .eq('day_of_week', new Date(date).getDay())
      .single()

    // If either user has no availability for this day, return empty slots
    if (!recruiterAvailability?.is_available || !salesRepAvailability?.is_available) {
      return NextResponse.json({ availableSlots: [] })
    }

    // Get existing interviews for both users on this date
    const { data: existingInterviews } = await supabase
      .from('scheduled_interviews')
      .select('scheduled_time, duration_minutes')
      .eq('scheduled_date', date)
      .or(`recruiter_id.eq.${recruiterId},sales_rep_id.eq.${salesRepId}`)
      .eq('status', 'scheduled')

    // Calculate overlapping availability
    const recruiterStart = parseTime(recruiterAvailability.start_time)
    const recruiterEnd = parseTime(recruiterAvailability.end_time)
    const salesRepStart = parseTime(salesRepAvailability.start_time)
    const salesRepEnd = parseTime(salesRepAvailability.end_time)

    const overlapStart = Math.max(recruiterStart, salesRepStart)
    const overlapEnd = Math.min(recruiterEnd, salesRepEnd)

    if (overlapStart >= overlapEnd) {
      return NextResponse.json({ availableSlots: [] })
    }

    // Generate 30-minute slots
    const slots = []
    const slotDuration = 30 // minutes

    for (let time = overlapStart; time + slotDuration <= overlapEnd; time += slotDuration) {
      const slotTime = formatTime(time)
      
      // Check if this slot conflicts with any existing interview
      const isConflict = existingInterviews?.some(interview => {
        const interviewStart = parseTime(interview.scheduled_time)
        const interviewEnd = interviewStart + (interview.duration_minutes || 30)
        const slotEnd = time + slotDuration
        
        // Check for overlap
        return (time < interviewEnd && slotEnd > interviewStart)
      })

      if (!isConflict) {
        slots.push(slotTime)
      }
    }

    // Also check Google Calendar if users have connected calendars
    const finalSlots = await checkGoogleCalendarAvailability(
      supabase,
      recruiterId,
      salesRepId,
      date,
      slots
    )

    return NextResponse.json({ availableSlots: finalSlots })
  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
  }
}

// Helper function to parse time string to minutes
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper function to format minutes to time string
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Check Google Calendar for additional busy times
async function checkGoogleCalendarAvailability(
  supabase: any,
  recruiterId: string,
  salesRepId: string,
  date: string,
  slots: string[]
): Promise<string[]> {
  try {
    // Check if users have calendar connections
    const { data: connections } = await supabase
      .from('calendar_connections')
      .select('user_id')
      .in('user_id', [recruiterId, salesRepId])
      .eq('provider', 'google')

    if (!connections || connections.length === 0) {
      // No calendar connections, return original slots
      return slots
    }

    // Call the calendar busy times API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/busy-times`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds: connections.map((c: any) => c.user_id),
        date,
        slots
      })
    })

    if (!response.ok) {
      console.error('Failed to check Google Calendar availability')
      return slots
    }

    const { availableSlots } = await response.json()
    return availableSlots || slots
  } catch (error) {
    console.error('Error checking Google Calendar:', error)
    return slots // Return original slots if error
  }
} 