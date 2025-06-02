import { AccessWrapper } from "@/components/recruiter/access-wrapper"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { Calendar } from "lucide-react"

export default function RecruiterCalendarPage() {
  return (
    <AccessWrapper>
      <div className="container mx-auto max-w-7xl">
        <FadeIn delay={100}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
            <p className="text-gray-400">Schedule and manage interviews</p>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <AnimatedCard variant="hover-glow" className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Calendar Coming Soon</h3>
            <p className="text-gray-400">
              Interview scheduling features are currently under development.
            </p>
          </AnimatedCard>
        </FadeIn>
      </div>
    </AccessWrapper>
  )
} 