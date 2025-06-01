import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { recruiterId, salesRepId, date } = await request.json()
    
    if (!recruiterId || !salesRepId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get both users' timezone information
    const [recruiterUser, salesRepUser] = await Promise.all([
      supabase
        .from('users')
        .select('timezone')
        .eq('id', recruiterId)
        .single(),
      supabase
        .from('users')
        .select('timezone')
        .eq('id', salesRepId)
        .single()
    ])

    const recruiterTimezone = recruiterUser.data?.timezone || 'America/New_York'
    const salesRepTimezone = salesRepUser.data?.timezone || 'America/New_York'

    const dayOfWeek = new Date(date).getDay()

    // Fetch both users' availability in parallel
    const [recruiterResult, salesRepResult] = await Promise.all([
      supabase
        .from('calendar_availability')
        .select('*')
        .eq('user_id', recruiterId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)
        .single(),
      supabase
        .from('calendar_availability')
        .select('*')
        .eq('user_id', salesRepId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true)
        .single()
    ])

    const recruiterAvailability = recruiterResult.data
    const salesRepAvailability = salesRepResult.data

    // If either user is not available on this day, return empty slots
    if (!recruiterAvailability || !salesRepAvailability) {
      return NextResponse.json({ 
        availableSlots: [],
        message: !recruiterAvailability ? 'Recruiter not available on this day' : 
                 'Sales rep not available on this day',
        recruiterTimezone,
        salesRepTimezone
      })
    }

    // Get existing interviews for both users on this date
    const { data: existingInterviews } = await supabase
      .from('scheduled_interviews')
      .select('scheduled_time, duration_minutes')
      .eq('scheduled_date', date)
      .or(`recruiter_id.eq.${recruiterId},sales_rep_id.eq.${salesRepId}`)
      .eq('status', 'scheduled')

    // Convert times to minutes since midnight in each user's timezone
    // For simplicity, we'll work with the date as if both users are in the same day
    // In production, you'd want to handle cases where users are in very different timezones
    
    // Calculate overlapping availability in UTC minutes
    const recruiterStart = parseTime(recruiterAvailability.start_time)
    const recruiterEnd = parseTime(recruiterAvailability.end_time)
    const salesRepStart = parseTime(salesRepAvailability.start_time)
    const salesRepEnd = parseTime(salesRepAvailability.end_time)

    // If timezones are different, we need to convert one user's availability to the other's timezone
    // For now, we'll work in the sales rep's timezone (the person booking)
    let adjustedRecruiterStart = recruiterStart
    let adjustedRecruiterEnd = recruiterEnd
    
    if (recruiterTimezone !== salesRepTimezone) {
      // Calculate timezone offset difference
      const dateStr = new Date(date).toISOString().split('T')[0]
      const recruiterDate = new Date(`${dateStr}T00:00:00`)
      const salesRepDate = new Date(`${dateStr}T00:00:00`)
      
      // Get timezone offsets for the specific date (handles DST)
      const recruiterOffset = getTimezoneOffset(recruiterDate, recruiterTimezone)
      const salesRepOffset = getTimezoneOffset(salesRepDate, salesRepTimezone)
      const offsetDiff = (recruiterOffset - salesRepOffset) / 60 // Convert to minutes
      
      // Adjust recruiter's availability to sales rep's timezone
      adjustedRecruiterStart = recruiterStart - offsetDiff
      adjustedRecruiterEnd = recruiterEnd - offsetDiff
      
      // Handle day boundary crossing
      if (adjustedRecruiterStart < 0) adjustedRecruiterStart += 24 * 60
      if (adjustedRecruiterEnd <= adjustedRecruiterStart) adjustedRecruiterEnd += 24 * 60
    }

    const overlapStart = Math.max(adjustedRecruiterStart, salesRepStart)
    const overlapEnd = Math.min(adjustedRecruiterEnd, salesRepEnd)

    if (overlapStart >= overlapEnd) {
      return NextResponse.json({ 
        availableSlots: [],
        message: 'No overlapping availability between users',
        recruiterTimezone,
        salesRepTimezone
      })
    }

    // Generate 30-minute slots
    const slots = []
    const slotDuration = 30 // minutes

    for (let time = overlapStart; time + slotDuration <= overlapEnd; time += slotDuration) {
      const slotTime = formatTime(time % (24 * 60)) // Handle times that go past midnight
      
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

    return NextResponse.json({ 
      availableSlots: slots,
      recruiterTimezone,
      salesRepTimezone,
      timezoneNote: recruiterTimezone !== salesRepTimezone 
        ? `Times shown in your timezone. Recruiter is in ${recruiterTimezone}.`
        : null
    })
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

// Helper function to get timezone offset for a specific date
function getTimezoneOffset(date: Date, timezone: string): number {
  try {
    // Create date strings in both UTC and target timezone
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
    
    // Return difference in milliseconds
    return utcDate.getTime() - tzDate.getTime()
  } catch (error) {
    console.error(`Error calculating timezone offset for ${timezone}:`, error)
    return 0 // Default to no offset if timezone is invalid
  }
} 