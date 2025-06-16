import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendInvitationEmail } from "@/lib/email/resend"

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
• Company: ${jobDetails?.company || jobDetails?.company_overview || 'N/A'}
• Price Range: ${jobDetails?.priceRange || jobDetails?.price_range || 'Not specified'}
• Industry: ${jobDetails?.industry || 'Not specified'}
• Location: ${jobDetails?.remote || jobDetails?.remote_compatible ? 'Remote' : 'On-site'}
• Commission: ${jobDetails?.commission || jobDetails?.commission_structure || 'Not specified'}

Click here to schedule your interview at a time that works for you.
`

    // Get recruiter details
    const { data: recruiter } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    // Create the notification with metadata
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: repId,
      title: `Interview Invitation: ${jobDetails?.title}`,
      body: notificationBody.trim(),
      href: `/dashboard/invites`,
      metadata: {
        type: 'interview_invitation',
        jobId: jobId,
        jobTitle: jobDetails?.title || 'Unknown Position',
        company: jobDetails?.company || jobDetails?.company_overview || 'Unknown Company',
        priceRange: jobDetails?.priceRange || jobDetails?.price_range || 'Not specified',
        industry: jobDetails?.industry || 'Not specified',
        remote: jobDetails?.remote || jobDetails?.remote_compatible || false,
        commission: jobDetails?.commission || jobDetails?.commission_structure || 'Not specified',
        recruiterName: recruiter?.name || 'Recruiter',
        recruiterId: user.id,
        applicantId: applicant.id
      }
    })

    if (notifError) {
      console.error("Error creating notification:", notifError)
      throw notifError
    }

    // Send email notification to the sales professional
    if (salesRep.email) {
      try {
        await sendInvitationEmail({
          to: salesRep.email,
          salesProfessionalName: salesRep.name || 'Sales Professional',
          jobTitle: jobDetails?.title || 'Unknown Position',
          company: jobDetails?.company || jobDetails?.company_overview || 'Unknown Company',
          industry: jobDetails?.industry || 'Not specified',
          priceRange: jobDetails?.priceRange || jobDetails?.price_range || 'Not specified',
          commission: jobDetails?.commission || jobDetails?.commission_structure || 'Not specified',
          remote: jobDetails?.remote || jobDetails?.remote_compatible || false,
          recruiterName: recruiter?.name || 'Recruiter',
          message: body.message // Optional message from recruiter
        })
        console.log(`Invitation email sent to ${salesRep.email}`)
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError)
        // Don't throw error - email is supplementary to the notification
      }
    }

    // Notify recruiter as confirmation
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Invitation sent",
      body: `Interview invitation sent to ${salesRep.name} for ${jobDetails?.title}`,
      href: `/recruiter/jobs/${jobId}/applicants`,
    })

    // Update the applicant record so the invitation state persists
    const { error: applicantUpdateError } = await supabase
      .from("applicants")
      .update({ invited: true })
      .eq("id", applicant.id)

    if (applicantUpdateError) {
      console.error("Error updating applicant invited status:", applicantUpdateError)
      // Not throwing here so that the invitation flow continues, 
      // but logging the error allows for troubleshooting if RLS prevents the update.
    }

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