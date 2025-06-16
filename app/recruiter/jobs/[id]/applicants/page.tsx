import { createServerSupabaseClient } from "@/lib/supabase/server"
import { AccessWrapper } from "@/components/recruiter/access-wrapper"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { ApplicantsList } from "./applicants-list"
import { TopMatchesPanel } from "@/components/recruiter/top-matches-panel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

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

  // Fetch applicants with AI scores
  const { data: applicants, error: applicantsError } = await supabase
    .from("applicants")
    .select(`
      *,
      score,
      score_reasons
    `)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })

  if (applicantsError) {
    console.error("Error fetching applicants:", applicantsError)
  }

  // Fetch invitation data from notifications for these applicants
  const applicantUserIds = applicants?.filter(a => a.user_id).map(a => a.user_id) || []
  
  const { data: invitations } = await supabase
    .from("notifications")
    .select("user_id, created_at")
    .like("title", "%Interview Invitation%")
    .eq("metadata->>jobId", jobId.toString())
    .in("user_id", applicantUserIds)

  // Fetch scheduled interviews for these applicants
  const applicantIds = applicants?.map(a => a.id) || []
  
  const { data: scheduledInterviews } = await supabase
    .from("scheduled_interviews")
    .select("applicant_id, scheduled_date, scheduled_time")
    .eq("job_id", jobId)
    .in("applicant_id", applicantIds)

  // Create a map of invitations and scheduled interviews for quick lookup
  const invitationMap = new Map(invitations?.map(inv => [inv.user_id, inv]) || [])
  const scheduledMap = new Map(scheduledInterviews?.map(si => [si.applicant_id, si]) || [])

  // Enhance applicants with invitation and interview data
  const enhancedApplicants = applicants?.map(applicant => ({
    ...applicant,
    invited: applicant.invited || (applicant.user_id ? invitationMap.has(applicant.user_id) : false),
    hasScheduledInterview: scheduledMap.has(applicant.id),
    scheduledInterview: scheduledMap.get(applicant.id)
  })) || []

  return (
    <AccessWrapper>
      <div className="container mx-auto max-w-7xl">
        <FadeIn delay={100}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Applicants for {job.title}</h1>
            <p className="text-gray-400">Manage applicants who have applied to this position</p>
          </div>
          <Tabs defaultValue="applicants" className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="applicants">Applicants ({enhancedApplicants.length})</TabsTrigger>
              <TabsTrigger value="matches">Top Matches</TabsTrigger>
            </TabsList>
            <TabsContent value="applicants">
              <ApplicantsList 
                applicants={enhancedApplicants} 
                jobId={jobId}
                jobTitle={job.title}
              />
            </TabsContent>
            <TabsContent value="matches">
              <TopMatchesPanel jobId={jobId} jobTitle={job.title} />
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </AccessWrapper>
  )
}
