import { AccessWrapper } from "@/components/recruiter/access-wrapper"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { Users } from "lucide-react"

export default function ApplicantsPage() {
  return (
    <AccessWrapper>
      <div className="container mx-auto max-w-7xl">
        <FadeIn delay={100}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Job Applicants</h1>
            <p className="text-gray-400">Review and manage applicants for this position</p>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <AnimatedCard variant="hover-glow" className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Applicant Management Coming Soon</h3>
            <p className="text-gray-400">
              This feature is currently under development.
            </p>
          </AnimatedCard>
        </FadeIn>
      </div>
    </AccessWrapper>
  )
}
