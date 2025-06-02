import { createServerSupabaseClient } from "@/lib/supabase/server"
import { AccessWrapper } from "@/components/recruiter/access-wrapper"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { ApplicantsList } from "./applicants-list"

export default async function ApplicantsPage({ params }: { params: { id: string } }) {
  const jobId = parseInt(params.id)
  const supabase = await createServerSupabaseClient()
  
  // Fetch job data
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("id", jobId)
    .single()

  if (jobError || !job) {
    return (
      <AccessWrapper>
        <div className="container mx-auto max-w-7xl">
          <FadeIn delay={100}>
            <AnimatedCard variant="hover-glow" className="p-8 text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Job not found</h2>
              <p className="text-gray-400">This job doesn't exist or you don't have permission to view it.</p>
            </AnimatedCard>
          </FadeIn>
        </div>
      </AccessWrapper>
    )
  }

  // Fetch applicants
  const { data: applicants, error: applicantsError } = await supabase
    .from("applicants")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })

  if (applicantsError) {
    console.error("Error fetching applicants:", applicantsError)
  }

  return (
    <AccessWrapper>
      <div className="container mx-auto max-w-7xl">
        <FadeIn delay={100}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Applicants for {job.title}</h1>
            <p className="text-gray-400">Manage applicants who have applied to this position</p>
          </div>
        </FadeIn>

        <ApplicantsList 
          applicants={applicants || []} 
          jobId={jobId}
          jobTitle={job.title}
        />
      </div>
    </AccessWrapper>
  )
}
