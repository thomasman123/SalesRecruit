"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { MessageSquare } from "lucide-react"

export function RecruiterMessagesContent() {
  return (
    <div className="container mx-auto max-w-7xl">
      <FadeIn delay={100}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
          <p className="text-gray-400">Communicate with candidates and manage conversations</p>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <AnimatedCard variant="hover-glow" className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Messages Coming Soon</h3>
          <p className="text-gray-400">
            This feature is currently under development. You'll be able to message candidates directly once it's ready.
          </p>
        </AnimatedCard>
      </FadeIn>
    </div>
  )
} 