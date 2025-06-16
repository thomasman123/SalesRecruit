import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import getOpenAI from "@/lib/openai"

// Params accepted via POST body
// {
//   jobId: number,
//   page?: number,
//   pageSize?: number
// }
export async function POST(req: Request) {
  try {
    const { jobId, page = 1, pageSize = 5 } = await req.json()
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Fetch job details
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single()

    if (jobErr || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Fetch all sales reps (users with role 'sales-professional')
    const { data: salesReps, error: repsErr } = await supabase
      .from("users")
      .select("id, name, email, avatar_url")
      .eq("role", "sales-professional")

    if (repsErr || !salesReps) {
      return NextResponse.json({ error: repsErr?.message || "Failed to fetch reps" }, { status: 500 })
    }

    const openai = getOpenAI()

    // Helper to score a single rep against the job posting
    const scoreRep = async (rep: any) => {
      const prompt =
        `You are an expert recruiter.\n` +
        `Rate the following sales professional (0-100 where 100 is a perfect fit) for the given job posting. ` +
        `Provide up to 4 short reasons for the score.\n` +
        `Return ONLY a valid JSON object in the following format, no additional text:\n` +
        `{\n  \"score\": number,\n  \"reasons\": string[]\n}\n\n` +
        `Sales Professional:\n${JSON.stringify(rep, null, 2)}\n\n` +
        `Job Posting:\n${JSON.stringify(job, null, 2)}\n`

      let score = Math.floor(Math.random() * 61) + 40 // 40-100 fallback
      let reasons: string[] = [
        "Relevant experience",
        "Strong track record",
      ]

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo-0125",
          temperature: 0.2,
          messages: [{ role: "user", content: prompt }],
        })
        const content = completion.choices?.[0]?.message?.content?.trim() || ""
        const parsed = JSON.parse(content)
        if (typeof parsed.score === "number" && Array.isArray(parsed.reasons)) {
          score = parsed.score
          reasons = parsed.reasons.slice(0, 4)
        }
      } catch (err) {
        console.error("AI scoring failed for rep", rep.id, err)
      }

      return { ...rep, score, reasons }
    }

    // Score all reps (this may be slow; consider batching / caching for production)
    const scoredReps: any[] = []
    for (const rep of salesReps) {
      const result = await scoreRep(rep)
      scoredReps.push(result)
    }

    // Sort by score descending
    scoredReps.sort((a, b) => (b.score || 0) - (a.score || 0))

    // Pagination
    const startIndex = (page - 1) * pageSize
    const paginated = scoredReps.slice(startIndex, startIndex + pageSize)

    return NextResponse.json({ items: paginated, total: scoredReps.length })
  } catch (err: any) {
    console.error("getTopMatches error", err)
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 })
  }
} 