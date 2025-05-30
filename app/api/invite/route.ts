import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { repId, jobId } = await req.json()
    if (!repId || !jobId) {
      return NextResponse.json({ error: "repId and jobId are required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Fetch job to get booking link (use video_url for now)
    const { data: job } = await (supabaseAdmin as any)
      .from("jobs")
      .select("title, video_url")
      .eq("id", jobId)
      .single()

    const bookingLink = job?.video_url || "" // placeholder

    // Create notification for rep
    await (supabaseAdmin as any).from("notifications").insert({
      user_id: repId,
      title: "Interview Invitation",
      body: bookingLink
        ? `You've been invited to interview. Book a time here: ${bookingLink}`
        : "You've been invited to interview. Please check your messages for scheduling.",
      href: bookingLink || null,
      read: false,
    })

    // Notify recruiter as confirmation
    await (supabaseAdmin as any).from("notifications").insert({
      user_id: user.id,
      title: "Invite sent",
      body: "The sales professional has been invited.",
      href: `/recruiter/jobs/${jobId}/applicants`,
      read: false,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Invite error", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
} 