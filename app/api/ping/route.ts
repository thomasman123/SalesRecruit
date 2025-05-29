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

    // Ensure a conversation exists between recruiter and rep for this job
    const { data: existingConv } = await (supabaseAdmin as any)
      .from("conversations")
      .select("id")
      .eq("recruiter_id", user.id)
      .eq("applicant_user_id", repId)
      .eq("job_id", jobId)
      .maybeSingle()

    let conversationId = existingConv?.id
    if (!conversationId) {
      const { data: convAgain } = await (supabaseAdmin as any)
        .from("conversations")
        .select("id")
        .eq("recruiter_id", user.id)
        .eq("applicant_user_id", repId)
        .eq("job_id", jobId)
        .single()
      conversationId = convAgain?.id
    }

    // Notify the rep with link to messages page (opens and highlights conversation)
    await (supabaseAdmin as any).from("notifications").insert({
      user_id: repId,
      title: "You've been pinged!",
      body: "A recruiter would like to chat about an opportunity.",
      href: `/dashboard/messages?c=${conversationId}`,
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

    return NextResponse.json({ success: true, conversationId })
  } catch (err: any) {
    console.error("Ping error", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
} 