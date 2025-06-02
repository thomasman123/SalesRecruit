import { AccessWrapper } from "@/components/recruiter/access-wrapper"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { Edit } from "lucide-react"

export default function EditJobPage() {
  return (
    <AccessWrapper>
      <div className="container mx-auto max-w-7xl">
        <FadeIn delay={100}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Edit Job</h1>
            <p className="text-gray-400">Update your job listing details</p>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <AnimatedCard variant="hover-glow" className="p-12 text-center">
            <Edit className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Job Editing Coming Soon</h3>
            <p className="text-gray-400">
              This feature is currently under development.
            </p>
          </AnimatedCard>
        </FadeIn>
      </div>
    </AccessWrapper>
  )
}
