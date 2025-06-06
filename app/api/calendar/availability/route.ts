import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { withFreshTokens } from '@/lib/token-manager'
import { getAvailability as gCalBusy } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const admin = getSupabaseAdmin()
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

    const recruiterTimezone = recruiterUser.data?.timezone || 'Australia/Sydney'
    const salesRepTimezone = salesRepUser.data?.timezone || 'Australia/Sydney'

    // Helper to get day-of-week (0-6) in a specific timezone for the given date string (YYYY-MM-DD)
    const getDayOfWeekInTimezone = (dateStr: string, tz: string): number => {
      try {
        // Use noon UTC to avoid DST edge cases
        const baseDate = new Date(dateStr + 'T12:00:00Z')
        const weekdayStr = baseDate.toLocaleString('en-US', { weekday: 'short', timeZone: tz })
        const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
        return map[weekdayStr] ?? baseDate.getUTCDay()
      } catch (err) {
        return new Date(dateStr).getUTCDay()
      }
    }

    const recruiterDayOfWeek = getDayOfWeekInTimezone(date, recruiterTimezone)
    const salesRepDayOfWeek = getDayOfWeekInTimezone(date, salesRepTimezone)

    // Default working window 08:00 - 18:00 sales rep timezone
    const WORK_START = '08:00'
    const WORK_END = '18:00'

    const recruiterAvail = { start_time: WORK_START, end_time: WORK_END }
    const salesRepAvail = { start_time: WORK_START, end_time: WORK_END }

    // Pull busy blocks directly from Google Calendar
    const dayStartISO = new Date(`${date}T00:00:00${salesRepTimezone.startsWith('Etc/') ? 'Z' : ''}`).toISOString()
    const dayEndISO = new Date(`${date}T23:59:59${salesRepTimezone.startsWith('Etc/') ? 'Z' : ''}`).toISOString()

    const [recruiterBusy, salesRepBusy] = await Promise.all([
      withFreshTokens(recruiterId, async (client)=>{
        return await gCalBusy(client, dayStartISO, dayEndISO)
      }),
      withFreshTokens(salesRepId, async (client)=>{
        return await gCalBusy(client, dayStartISO, dayEndISO)
      })
    ])

    const busyToBlocks = (busy:any[])=> busy.map((b:any)=>({ start: new Date(b.start).toISOString(), end: new Date(b.end).toISOString() }))

    const existingBusy: any[] = [...busyToBlocks(recruiterBusy||[]), ...busyToBlocks(salesRepBusy||[])]

    // Convert times to minutes since midnight in salesrep TZ 
    // For simplicity, we'll work with the date as if both users are in the same day
    // In production, you'd want to handle cases where users are in very different timezones

    // Calculate overlapping availability in UTC minutes
    const recruiterStart = parseTime(recruiterAvail.start_time)
    const recruiterEnd = parseTime(recruiterAvail.end_time)
    const salesRepStart = parseTime(salesRepAvail.start_time)
    const salesRepEnd = parseTime(salesRepAvail.end_time)

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
      
      // Check if slot conflicts with busy periods
      const isConflict = existingBusy.some(b=>{
        const busyStart = new Date(b.start)
        const busyMinutes = busyStart.getHours()*60+busyStart.getMinutes()
        const busyEnd = new Date(b.end)
        const busyEndMin = busyEnd.getHours()*60+busyEnd.getMinutes()
        const slotEnd = time + slotDuration
        return (time < busyEndMin && slotEnd > busyMinutes)
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