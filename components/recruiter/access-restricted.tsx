"use client"

import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { FadeIn } from "@/components/ui/fade-in"
import { Lock, Calendar, ArrowRight } from "lucide-react"

export function AccessRestricted() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-6 py-12">
      <FadeIn delay={0}>
        <AnimatedCard variant="hover-glow" className="max-w-2xl w-full p-8 lg:p-12 text-center border-dark-600 bg-dark-800/50 backdrop-blur-sm">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center">
              <AnimatedIcon variant="scale" size="lg" className="text-purple-400">
                <Lock className="h-10 w-10" />
              </AnimatedIcon>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            Access Restricted
          </h2>

          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            You're not authorized to access this feature yet. To unlock the full potential of Helios Recruit and start building your dream sales team, schedule a demo with our team for a personalized walkthrough.
          </p>

          <div className="space-y-4">
            <AnimatedButton
              variant="purple"
              size="lg"
              icon={<Calendar className="w-5 h-5" />}
              className="w-full sm:w-auto mx-auto text-lg px-8 py-6"
              onClick={() => window.open('https://crm.heliosscale.com/widget/booking/GnOVek2QrDEWUx7vngVh', '_blank')}
            >
              Book Your Demo
            </AnimatedButton>

            <p className="text-sm text-gray-400 mt-4">
              Our team will show you how Helios Recruit can transform your hiring process
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-dark-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              What you'll get with full access:
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm">AI-powered candidate matching</span>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm">Direct messaging with candidates</span>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm">Unlimited job postings</span>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm">Advanced analytics & insights</span>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </FadeIn>
    </div>
  )
} 