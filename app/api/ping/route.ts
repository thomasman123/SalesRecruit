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
    const supabase = await createServerSupabaseClient()
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

    // If no conversation yet, create one now
    if (!conversationId) {
      // Try to look up an applicant record for this user & job (may not exist yet)
      const { data: applicantRecord } = await (supabaseAdmin as any)
        .from("applicants")
        .select("id")
        .eq("user_id", repId)
        .eq("job_id", jobId)
        .maybeSingle()

      // If the applicant row doesn't exist, create a minimal placeholder
      let applicantId: number | undefined = applicantRecord?.id
      if (!applicantId) {
        // Fetch rep basic details to populate applicant record
        const { data: repProfile } = await (supabaseAdmin as any)
          .from("users")
          .select("name, email, avatar_url")
          .eq("id", repId)
          .single()

        const { data: newApplicant, error: applicantErr } = await (supabaseAdmin as any)
          .from("applicants")
          .insert({
            user_id: repId,
            job_id: jobId,
            name: repProfile?.name ?? "",
            email: repProfile?.email ?? "",
            avatar_url: repProfile?.avatar_url ?? null,
            location: "",
            experience: "",
            highest_ticket: "",
            sales_style: "",
            tools: "",
            applied_date: new Date().toISOString(),
            status: "new",
          })
          .select("id")
          .single()

        if (applicantErr || !newApplicant) {
          console.error("Applicant creation failed", applicantErr)
          return NextResponse.json({ error: "Unable to create applicant" }, { status: 500 })
        }

        applicantId = newApplicant.id
      }

      if (!applicantId) {
        return NextResponse.json({ error: "Unable to resolve applicant ID" }, { status: 500 })
      }

      const conversationPayload: any = {
        recruiter_id: user.id,
        applicant_user_id: repId,
        applicant_id: applicantId,
        job_id: jobId,
      }

      const { data: newConv, error: convErr } = await (supabaseAdmin as any)
        .from("conversations")
        .insert(conversationPayload)
        .select("id")
        .single()

      if (convErr || !newConv) {
        console.error("Conversation creation failed", convErr)
        return NextResponse.json({ error: "Unable to create conversation" }, { status: 500 })
      }

      conversationId = newConv.id
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