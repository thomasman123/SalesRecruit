"use server"

import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const jobSchema = z.object({
  title: z.string().min(3),
  status: z.enum(["active", "draft", "paused", "closed"]).default("draft"),
  industry: z.string(),
  role: z.enum(["SDR/Appointment Setter", "AE/Closer"]),
  country: z.string(),
  price_range: z.string(),
  lead_source: z.string(),
  commission_structure: z.string(),
  team_size: z.string(),
  remote_compatible: z.boolean().optional(),
  company_overview: z.string().optional().nullable(),
  what_you_sell: z.string().optional().nullable(),
  sales_process: z.string().optional().nullable(),
  whats_provided: z.array(z.string()).optional().nullable(),
  not_for: z.string().optional().nullable(),
  commission_breakdown: z.string().optional().nullable(),
  ramp_time: z.string().optional().nullable(),
  working_hours: z.string().optional().nullable(),
  video_url: z.union([z.string().url(), z.literal("")]).optional().nullable(),
})

type JobInput = z.infer<typeof jobSchema>

export async function createJob(form: JobInput) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("Unauthorized")
  }

  const validation = jobSchema.safeParse(form)
  if (!validation.success) {
    throw new Error(validation.error.message)
  }

  // Ensure user exists in public.users (handles existing accounts created before trigger)
  const { error: upsertError } = await supabase.from("users").upsert({
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.full_name ?? user.email!.split("@")[0],
    role: "recruiter",
  })
  if (upsertError) {
    throw new Error(upsertError.message)
  }

  const { error, data } = await supabase.from("jobs").insert({
    ...validation.data,
    recruiter_id: user.id,
  } as any).select().single()

  if (error) {
    throw new Error(error.message)
  }

  // If job is published (status is 'active'), trigger notifications
  if (data.status === 'active') {
    console.log('🚀 Job published with active status, triggering notifications for job:', data.id);
    try {
      // Build an absolute URL for the internal API – Node.js `fetch` requires one.
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
        (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
        "http://localhost:3000"

      const response = await fetch(`${baseUrl}/api/job-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: data.id }),
      })
      
      const contentType = response.headers.get('content-type') || ''
      let payload: any = null
      if (contentType.includes('application/json')) {
        payload = await response.json()
      } else {
        payload = await response.text()
      }

      console.log('📧 Notification API response:', payload)

      if (!response.ok) {
        console.error('❌ Notification API failed:', payload)
      } else {
        console.log('✅ Notifications triggered successfully')
      }
    } catch (err) {
      console.error('💥 Failed to trigger job notifications:', err)
      // Don't throw error here - we don't want to fail job creation if notifications fail
    }
  } else {
    console.log('📝 Job created with status:', data.status, '- notifications not triggered');
  }

  return data
}

export async function updateJob(id: number, updates: Partial<JobInput>) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("Unauthorized")

  const { error, data } = await supabase.from("jobs")
    .update(updates as any)
    .eq("id", id)
    .eq("recruiter_id", user.id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteJob(id: number) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("Unauthorized")

  const { error } = await supabase.from("jobs")
    .delete()
    .eq("id", id)
    .eq("recruiter_id", user.id)
  if (error) throw new Error(error.message)
}

export async function duplicateJob(id: number) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("Unauthorized")

  const { data: existing, error: fetchError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single()
  if (fetchError) throw new Error(fetchError.message)

  // Remove id and timestamps
  const { id: _oldId, created_at: _c, updated_at: _u, ...rest } = existing as any
  const { error, data } = await supabase
    .from("jobs")
    .insert({
      ...rest,
      title: `${existing!.title} (Copy)`,
      status: "draft",
      recruiter_id: user.id,
      views: 0,
      applicants_count: 0,
    } as any)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
} 