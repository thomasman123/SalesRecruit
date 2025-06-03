import { NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const applicantId = parseInt(params.id)

    // Get applicant details
    const { data: applicant, error: applicantError } = await supabase
      .from("applicants")
      .select("*")
      .eq("id", applicantId)
      .single()

    if (applicantError || !applicant) {
      return Response.json({ error: "Applicant not found" }, { status: 404 })
    }

    // Verify the recruiter owns the job that this applicant applied to
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("recruiter_id")
      .eq("id", applicant.job_id)
      .single()

    if (jobError || !job || job.recruiter_id !== user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // If applicant has a user_id, fetch their profile from auth metadata using service role
    let userMetadata = {}
    if (applicant.user_id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Create admin client to access user metadata
        const adminSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )

        const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(applicant.user_id)
        
        if (!userError && userData?.user?.user_metadata) {
          userMetadata = userData.user.user_metadata
        }
      } catch (error) {
        console.log("Could not fetch user metadata:", error)
      }
    }

    return Response.json({
      ...applicant,
      ...userMetadata
    })
  } catch (error) {
    console.error("Error in GET /api/applicants/[id]:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const applicantId = parseInt(params.id)
    const updates = await request.json()

    // Verify the recruiter owns the job that this applicant applied to
    const { data: applicant, error: applicantError } = await supabase
      .from("applicants")
      .select("job_id")
      .eq("id", applicantId)
      .single()

    if (applicantError || !applicant) {
      return Response.json({ error: "Applicant not found" }, { status: 404 })
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("recruiter_id")
      .eq("id", applicant.job_id)
      .single()

    if (jobError || !job || job.recruiter_id !== user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update the applicant
    const { data, error } = await supabase
      .from("applicants")
      .update(updates)
      .eq("id", applicantId)
      .select()
      .single()

    if (error) {
      console.error("Error updating applicant:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json(data)
  } catch (error) {
    console.error("Error in PATCH /api/applicants/[id]:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 