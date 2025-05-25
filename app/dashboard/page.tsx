"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { Target, Zap, TrendingUp, Users } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-7xl">
      <FadeIn delay={100}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome, John</h1>
          <p className="text-gray-400">Your sales opportunities dashboard</p>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnimatedCard variant="hover-lift" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Opportunities</p>
                <h3 className="text-2xl font-bold text-white">
                  <span className="font-mono">12</span>
                </h3>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+3 this week</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <AnimatedIcon variant="scale" size="sm" color="purple">
                  <Target className="h-5 w-5" />
                </AnimatedIcon>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard variant="hover-lift" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Profile Views</p>
                <h3 className="text-2xl font-bold text-white">
                  <span className="font-mono">48</span>
                </h3>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+12 this week</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <AnimatedIcon variant="scale" size="sm" color="purple">
                  <Users className="h-5 w-5" />
                </AnimatedIcon>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard variant="hover-lift" className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Match Score</p>
                <h3 className="text-2xl font-bold text-white">
                  <span className="font-mono">92%</span>
                </h3>
                <p className="text-xs text-purple-400 mt-1 flex items-center">
                  <Zap className="h-3 w-3 mr-1" />
                  <span>Top 10%</span>
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <AnimatedIcon variant="scale" size="sm" color="purple">
                  <Zap className="h-5 w-5" />
                </AnimatedIcon>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </FadeIn>

      <FadeIn delay={300}>
        <AnimatedCard variant="hover-glow" className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AnimatedIcon variant="pulse" size="lg" color="purple">
                <Target className="h-8 w-8" />
              </AnimatedIcon>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Your dashboard is ready</h2>
            <p className="text-gray-400 mb-6">
              This is where you'll track opportunities, manage connections, and grow your sales career.
            </p>
            <div className="text-sm text-purple-400 font-mono">Coming soon: AI-powered opportunity matching</div>
          </div>
        </AnimatedCard>
      </FadeIn>
    </div>
  )
}
