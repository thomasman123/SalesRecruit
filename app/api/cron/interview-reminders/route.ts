import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verify this is being called by a cron job (you can add authentication here)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const now = new Date()
    
    // Find interviews that need reminders
    // 1. 24 hours before (1 day reminder)
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const oneDayWindow = new Date(oneDayFromNow.getTime() + 30 * 60 * 1000) // 30 min window
    
    // 2. 2 hours before
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const twoHourWindow = new Date(twoHoursFromNow.getTime() + 30 * 60 * 1000) // 30 min window

    // Get interviews needing 24-hour reminder
    const { data: dayReminders } = await supabase
      .from('scheduled_interviews')
      .select(`
        *,
        recruiter:users!scheduled_interviews_recruiter_id_fkey(id, email, name),
        sales_rep:users!scheduled_interviews_sales_rep_id_fkey(id, email, name),
        job:jobs!scheduled_interviews_job_id_fkey(title, industry)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_date', oneDayFromNow.toISOString().split('T')[0])
      .lte('scheduled_date', oneDayWindow.toISOString().split('T')[0])
      .is('day_reminder_sent', null)

    // Get interviews needing 2-hour reminder
    const { data: hourReminders } = await supabase
      .from('scheduled_interviews')
      .select(`
        *,
        recruiter:users!scheduled_interviews_recruiter_id_fkey(id, email, name),
        sales_rep:users!scheduled_interviews_sales_rep_id_fkey(id, email, name),
        job:jobs!scheduled_interviews_job_id_fkey(title, industry)
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_date', twoHoursFromNow.toISOString().split('T')[0])
      .lte('scheduled_date', twoHourWindow.toISOString().split('T')[0])
      .is('hour_reminder_sent', null)

    const remindersSent = []

    // Send 24-hour reminders
    for (const interview of dayReminders || []) {
      const emailPromises = [
        // To recruiter
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/interview-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'reminder',
            hoursUntil: 24,
            interviewId: interview.id,
            recipientEmail: interview.recruiter.email,
            recipientName: interview.recruiter.name,
            jobTitle: interview.job.title,
            company: interview.job.industry, // Using industry as company name
            scheduledDate: interview.scheduled_date,
            scheduledTime: interview.scheduled_time,
            meetingLink: interview.meeting_link,
            recruiterName: interview.recruiter.name,
            salesRepName: interview.sales_rep.name,
          }),
        }),
        // To sales rep
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/interview-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'reminder',
            hoursUntil: 24,
            interviewId: interview.id,
            recipientEmail: interview.sales_rep.email,
            recipientName: interview.sales_rep.name,
            jobTitle: interview.job.title,
            company: interview.job.industry, // Using industry as company name
            scheduledDate: interview.scheduled_date,
            scheduledTime: interview.scheduled_time,
            meetingLink: interview.meeting_link,
            recruiterName: interview.recruiter.name,
            salesRepName: interview.sales_rep.name,
          }),
        }),
      ]

      await Promise.all(emailPromises)
      
      // Mark as sent
      await (supabase as any)
        .from('scheduled_interviews')
        .update({ day_reminder_sent: now.toISOString() })
        .eq('id', interview.id)
      
      remindersSent.push({
        interviewId: interview.id,
        type: '24-hour',
        recipients: [interview.recruiter.email, interview.sales_rep.email]
      })
    }

    // Send 2-hour reminders
    for (const interview of hourReminders || []) {
      const emailPromises = [
        // To recruiter
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/interview-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'reminder',
            hoursUntil: 2,
            interviewId: interview.id,
            recipientEmail: interview.recruiter.email,
            recipientName: interview.recruiter.name,
            jobTitle: interview.job.title,
            company: interview.job.industry, // Using industry as company name
            scheduledDate: interview.scheduled_date,
            scheduledTime: interview.scheduled_time,
            meetingLink: interview.meeting_link,
            recruiterName: interview.recruiter.name,
            salesRepName: interview.sales_rep.name,
          }),
        }),
        // To sales rep
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/interview-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'reminder',
            hoursUntil: 2,
            interviewId: interview.id,
            recipientEmail: interview.sales_rep.email,
            recipientName: interview.sales_rep.name,
            jobTitle: interview.job.title,
            company: interview.job.industry, // Using industry as company name
            scheduledDate: interview.scheduled_date,
            scheduledTime: interview.scheduled_time,
            meetingLink: interview.meeting_link,
            recruiterName: interview.recruiter.name,
            salesRepName: interview.sales_rep.name,
          }),
        }),
      ]

      await Promise.all(emailPromises)
      
      // Mark as sent
      await (supabase as any)
        .from('scheduled_interviews')
        .update({ hour_reminder_sent: now.toISOString() })
        .eq('id', interview.id)
      
      remindersSent.push({
        interviewId: interview.id,
        type: '2-hour',
        recipients: [interview.recruiter.email, interview.sales_rep.email]
      })
    }

    return NextResponse.json({
      success: true,
      remindersSent: remindersSent.length,
      details: remindersSent
    })

  } catch (error) {
    console.error('Error in interview reminders cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 