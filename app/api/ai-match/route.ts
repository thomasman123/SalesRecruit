import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import getOpenAI from "@/lib/openai"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { jobId } = await req.json()
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Authenticated recruiter
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the job posting
    const {
      data: job,
      error: jobError,
    } = await supabase.from("jobs").select("*", { head: false }).eq("id", jobId).single()
    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Use admin client to bypass RLS and fetch all sales professionals
    const supabaseAdmin = getSupabaseAdmin()
    const { data: reps, error: repsError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("role", "sales-professional")
    if (repsError) throw repsError

    const repsArray: any[] = reps || []

    // Build prompt for OpenAI
    const openai = getOpenAI()
    const prompt = `You are an expert recruiter.\n` +
      `Given the following job posting JSON and a list of sales professionals, choose the 5 best user IDs for the job.\n` +
      `Return ONLY a JSON array of user IDs, nothing else.\n` +
      `Job Posting:\n${JSON.stringify(job)}\n\n` +
      `Sales Professionals:\n${JSON.stringify(repsArray)}`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    })

    const content = completion.choices?.[0]?.message?.content?.trim() || "[]"

    let matchedIds: string[] = []
    try {
      matchedIds = JSON.parse(content)
    } catch {
      // fallback – if parsing failed, just return empty list
      matchedIds = []
    }

    // Filter to existing reps and limit to 5 just in case
    matchedIds = matchedIds.filter((id) => repsArray.some((r) => r.id === id)).slice(0, 5)

    const matchedReps = repsArray.filter((r) => matchedIds.includes(r.id))

    return NextResponse.json({ matches: matchedReps })
  } catch (err: any) {
    console.error("AI-match error", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
}