import { AccessWrapper } from "@/components/recruiter/access-wrapper"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { EditJobForm } from "./edit-job-form"

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const jobId = parseInt(params.id)
  const supabase = await createServerSupabaseClient()
  
  // Fetch job data
  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single()

  if (error || !job) {
    return (
      <AccessWrapper>
        <div className="container mx-auto max-w-4xl">
          <FadeIn delay={100}>
            <AnimatedCard variant="hover-glow" className="p-8 text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Job not found</h2>
              <p className="text-gray-400">This job doesn't exist or you don't have permission to edit it.</p>
            </AnimatedCard>
          </FadeIn>
        </div>
      </AccessWrapper>
    )
  }

  return <EditJobForm job={job} />
}
