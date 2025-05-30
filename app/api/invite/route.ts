import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { 
      repId, 
      jobId, 
      scheduledDate, 
      scheduledTime, 
      duration,
      message,
      jobDetails 
    } = body

    // Get current user (recruiter)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get sales rep details
    const { data: salesRep } = await supabase
      .from("users")
      .select("*")
      .eq("id", repId)
      .single()

    if (!salesRep) {
      return NextResponse.json({ error: "Sales rep not found" }, { status: 404 })
    }

    // Get applicant details
    const { data: applicant } = await supabase
      .from("applicants")
      .select("*")
      .eq("user_id", repId)
      .eq("job_id", jobId)
      .single()

    if (!applicant) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 })
    }

    // For now, we'll store the interview details in the notification
    // until the scheduled_interviews table is available in production
    const interviewDetails = {
      job_id: jobId,
      applicant_id: applicant.id,
      recruiter_id: user.id,
      sales_rep_id: repId,
      scheduled_date: new Date(scheduledDate).toISOString().split('T')[0],
      scheduled_time: scheduledTime,
      duration_minutes: parseInt(duration),
      additional_message: message,
      meeting_link: jobDetails?.video_url || 'https://meet.google.com/new',
    }

    // Create notification for the sales rep with interview details
    const notificationBody = `
You've been invited to interview for ${jobDetails?.title}!

📅 Date: ${new Date(scheduledDate).toLocaleDateString()}
⏰ Time: ${scheduledTime}
⏱️ Duration: ${duration} minutes

Job Details:
• Company: ${jobDetails?.company}
• Price Range: ${jobDetails?.priceRange}
• Industry: ${jobDetails?.industry}
• Location: ${jobDetails?.remote ? 'Remote' : 'On-site'}
• Commission: ${jobDetails?.commission}

${message ? `Message from recruiter:\n${message}` : ''}

Meeting Link: ${interviewDetails.meeting_link}
`

    await supabase.from("notifications").insert({
      user_id: repId,
      title: `Interview Invitation: ${jobDetails?.title}`,
      body: notificationBody.trim(),
      href: interviewDetails.meeting_link,
    })

    // Notify recruiter as confirmation
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Interview scheduled",
      body: `Interview scheduled with ${salesRep.name} for ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}`,
      href: `/recruiter/jobs/${jobId}/applicants`,
    })

    return NextResponse.json({ 
      success: true, 
      message: "Interview scheduled successfully" 
    })

  } catch (error: any) {
    console.error("Failed to schedule interview:", error)
    return NextResponse.json(
      { error: error.message || "Failed to schedule interview" },
      { status: 500 }
    )
  }
} 