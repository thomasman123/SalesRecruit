"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { Target } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-7xl">
      <FadeIn delay={150}>
        <AnimatedCard variant="hover-glow" className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <AnimatedIcon variant="pulse" size="lg" color="purple">
                <Target className="h-10 w-10" />
              </AnimatedIcon>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Coming Soon</h1>
            <p className="text-gray-400">
              We&apos;re putting the finishing touches on your dashboard. In the meantime, head over to the
              <span className="text-purple-400 font-semibold"> Opportunities </span>
              tab and apply to jobs that excite you.
            </p>
          </div>
        </AnimatedCard>
      </FadeIn>
    </div>
  )
}
