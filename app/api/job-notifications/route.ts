import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { sendJobNotificationEmail } from "@/lib/email/resend"

export async function POST(req: Request) {
  try {
    console.log('🔔 Job notification API called');
    const { jobId } = await req.json()
    console.log('📋 Job ID:', jobId);
    
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
      console.error('❌ Job not found:', jobError);
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    console.log('✅ Found job:', job.title);

    // Get sales professionals with immediate notifications
    // First get all sales professionals
    const { data: salesUsers, error: salesError } = await supabaseAdmin
      .from("users")
      .select("id, email, name")
      .eq("role", "sales-professional")

    if (salesError) {
      console.error('❌ Error fetching sales users:', salesError);
      throw salesError
    }

    console.log('👥 Found sales professionals:', salesUsers?.length || 0);

    // Get their notification preferences
    const { data: preferences, error: prefsError } = await supabaseAdmin
      .from("email_notification_preferences")
      .select("*")
      .eq("job_notifications_enabled", true)
      .eq("notification_frequency", "immediate")
      .in("user_id", salesUsers?.map(u => u.id) || [])

    if (prefsError) {
      console.error('❌ Error fetching preferences:', prefsError);
      throw prefsError
    }

    console.log('⚙️ Found immediate notification preferences:', preferences?.length || 0);

    // Combine users with their preferences
    const eligibleUsers = salesUsers?.filter(user => 
      preferences?.some(pref => pref.user_id === user.id)
    ).map(user => ({
      ...user,
      preferences: preferences?.find(pref => pref.user_id === user.id)
    })) || []

    console.log('✅ Eligible users for notifications:', eligibleUsers.length);

    // Send notifications to each eligible user
    const notifications = await Promise.all(
      eligibleUsers.map(async (user) => {
        try {
          // Check if user received notification recently
          const lastNotification = user.preferences?.last_notification_sent
          if (lastNotification && typeof lastNotification === 'string') {
            const hoursSinceLastNotification = (Date.now() - new Date(lastNotification).getTime()) / (1000 * 60 * 60)
            if (hoursSinceLastNotification < 1) {
              console.log(`⏰ Skipping ${user.email} - notified ${hoursSinceLastNotification.toFixed(2)}h ago`);
              return { userId: user.id, status: "skipped", reason: "too_recent" }
            }
          }

          console.log(`📧 Sending email notification to: ${user.email}`);
          
          // Send actual email using Resend
          const emailResult = await sendJobNotificationEmail({
            to: user.email as string,
            name: (user.name as string) || (user.email as string).split('@')[0],
            jobTitle: job.title,
            jobId: job.id,
            industry: job.industry || '',
            priceRange: job.price_range || '',
            teamSize: job.team_size || '',
            companyOverview: job.company_overview || undefined
          });

          console.log(`✅ Email sent successfully to ${user.email}, Message ID: ${emailResult.messageId}`);

          // Record the notification as sent
          const { error: recordError } = await supabaseAdmin.rpc("record_notification_sent", {
            p_user_id: user.id,
            p_job_id: jobId,
            p_status: "sent",
          })

          if (recordError) {
            console.error('❌ Error recording notification:', recordError);
            throw recordError
          }

          console.log(`✅ Notification recorded for ${user.email}`);
          return { 
            userId: user.id, 
            status: "sent", 
            email: user.email,
            messageId: emailResult.messageId
          }

        } catch (error: any) {
          console.error(`❌ Failed to notify ${user.email}:`, error);
          
          // Record failed notification
          await supabaseAdmin.rpc("record_notification_sent", {
            p_user_id: user.id,
            p_job_id: jobId,
            p_status: "failed",
            p_error_message: error.message,
          })

          return { userId: user.id, status: "failed", error: error.message, email: user.email }
        }
      })
    )

    const successCount = notifications.filter(n => n.status === "sent").length
    const failedCount = notifications.filter(n => n.status === "failed").length
    const skippedCount = notifications.filter(n => n.status === "skipped").length

    console.log(`📊 Notification summary: ${successCount} sent, ${failedCount} failed, ${skippedCount} skipped`);

    return NextResponse.json({
      success: true,
      summary: {
        total: notifications.length,
        sent: successCount,
        failed: failedCount,
        skipped: skippedCount
      },
      notifications: notifications,
      jobTitle: job.title
    })

  } catch (err: any) {
    console.error("💥 Job notification error:", err)
    return NextResponse.json({ 
      error: err.message || "Server error",
      details: err
    }, { status: 500 })
  }
} 