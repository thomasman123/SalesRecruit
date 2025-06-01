import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { recruiterId, salesRepId, date } = await request.json()
    
    if (!recruiterId || !salesRepId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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
                 'Sales rep not available on this day'
      })
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
      return NextResponse.json({ 
        availableSlots: [],
        message: 'No overlapping availability between users'
      })
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

    return NextResponse.json({ availableSlots: slots })
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