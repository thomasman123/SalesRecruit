import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { repId, jobId } = await req.json()
    if (!repId || !jobId) {
      return NextResponse.json({ error: "repId and jobId are required" }, { status: 400 })
    }

    // Ensure the caller is an authenticated recruiter
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Notify the rep
    await (supabaseAdmin as any).from("notifications").insert({
      user_id: repId,
      title: "You've been pinged!",
      body: "A recruiter would like you to review an opportunity.",
      href: `/dashboard/opportunities/${jobId}`,
      read: false,
    })

    // Notify the recruiter (confirmation)
    await (supabaseAdmin as any).from("notifications").insert({
      user_id: user.id,
      title: "Ping sent",
      body: "The sales professional has been notified.",
      href: `/recruiter/jobs/${jobId}/applicants`,
      read: false,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Ping error", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
} 