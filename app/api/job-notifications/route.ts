import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json()
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const supabaseAdmin = getSupabaseAdmin()

    // Get the job details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Get all sales professionals with immediate notifications enabled
    const { data: salesProfessionals, error: usersError } = await supabaseAdmin
      .from("users")
      .select(`
        id,
        email,
        name,
        email_notification_preferences (
          job_notifications_enabled,
          notification_frequency,
          last_notification_sent
        )
      `)
      .eq("role", "sales-professional")
      .eq("email_notification_preferences.job_notifications_enabled", true)
      .eq("email_notification_preferences.notification_frequency", "immediate")

    if (usersError) {
      throw usersError
    }

    // Send notifications to each eligible sales professional
    const notifications = await Promise.all(
      salesProfessionals.map(async (user) => {
        try {
          // Skip if user has received a notification in the last hour
          const lastNotification = user.email_notification_preferences?.last_notification_sent
          if (lastNotification) {
            const hoursSinceLastNotification = (Date.now() - new Date(lastNotification).getTime()) / (1000 * 60 * 60)
            if (hoursSinceLastNotification < 1) {
              return null
            }
          }

          // Send email using Supabase's email service
          const { error: emailError } = await supabaseAdmin.auth.admin.sendRawEmail({
            to: user.email,
            subject: `New Job Opportunity: ${job.title}`,
            html: `
              <p>Hi ${user.name},</p>
              <p>A new job opportunity that matches your profile has been posted:</p>
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin: 0 0 10px 0;">${job.title}</h2>
                <div style="color: #4b5563; font-size: 14px; margin-bottom: 15px;">
                  <span style="margin-right: 15px;">💰 ${job.price_range}</span>
                  <span style="margin-right: 15px;">🏢 ${job.industry}</span>
                  <span>👥 ${job.team_size}</span>
                </div>
                <p>${job.company_overview || ""}</p>
              </div>
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/opportunities/${job.id}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #9333ea; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0;">
                  View Job Details
                </a>
              </div>
              <p>This opportunity was selected for you based on your profile and preferences. If you're interested, click the button above to learn more and apply.</p>
              <div style="font-size: 12px; color: #6b7280; margin-top: 20px; text-align: center;">
                <p>You're receiving this email because you're subscribed to job notifications. 
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/notifications" style="color: #9333ea;">Manage your notification preferences</a></p>
              </div>
            `,
          })

          if (emailError) {
            throw emailError
          }

          // Record the notification
          await supabaseAdmin.rpc("record_notification_sent", {
            p_user_id: user.id,
            p_job_id: jobId,
            p_status: "sent",
          })

          return { userId: user.id, status: "sent" }
        } catch (error: any) {
          // Record failed notification
          await supabaseAdmin.rpc("record_notification_sent", {
            p_user_id: user.id,
            p_job_id: jobId,
            p_status: "failed",
            p_error_message: error.message,
          })

          return { userId: user.id, status: "failed", error: error.message }
        }
      })
    )

    return NextResponse.json({
      success: true,
      notifications: notifications.filter(Boolean),
    })
  } catch (err: any) {
    console.error("Job notification error:", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
} 