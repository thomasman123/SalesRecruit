import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { 
      repId, 
      jobId,
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

    // Create notification for the sales rep with invitation
    const notificationBody = `
You've been invited to interview for ${jobDetails?.title}!

Job Details:
• Company: ${jobDetails?.company}
• Price Range: ${jobDetails?.priceRange}
• Industry: ${jobDetails?.industry}
• Location: ${jobDetails?.remote ? 'Remote' : 'On-site'}
• Commission: ${jobDetails?.commission}

Click here to schedule your interview at a time that works for you.
`

    // Get recruiter details
    const { data: recruiter } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    await supabase.from("notifications").insert({
      user_id: repId,
      title: `Interview Invitation: ${jobDetails?.title}`,
      body: notificationBody.trim(),
      href: `/dashboard/invites`,
      metadata: {
        type: 'interview_invitation',
        jobId: jobId,
        recruiterName: recruiter?.name || 'Recruiter',
        recruiterId: user.id
      }
    })

    // Notify recruiter as confirmation
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Invitation sent",
      body: `Interview invitation sent to ${salesRep.name} for ${jobDetails?.title}`,
      href: `/recruiter/jobs/${jobId}/applicants`,
    })

    return NextResponse.json({ 
      success: true, 
      message: "Invitation sent successfully" 
    })

  } catch (error: any) {
    console.error("Failed to send invitation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send invitation" },
      { status: 500 }
    )
  }
} 