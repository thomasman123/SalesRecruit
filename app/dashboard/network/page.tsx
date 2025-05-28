"use client"

import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { Users, Calendar, BookOpen, Users2, MapPin, ArrowRight } from "lucide-react"

export default function NetworkPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <FadeIn delay={0}>
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">
            Sales Professional <span className="font-mono text-purple-400">Network</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join our community of high-performing sales professionals and accelerate your career growth
          </p>
        </div>
      </FadeIn>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FadeIn delay={200}>
          <AnimatedCard variant="interactive" className="p-6 group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-all duration-300">
              <AnimatedIcon variant="scale" size="md">
                <Calendar className="h-6 w-6" />
              </AnimatedIcon>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-400 transition-colors duration-300">
              3x Weekly Trainings
            </h4>
            <p className="text-gray-400 leading-relaxed mb-4">
              Access our exclusive training sessions focused on advanced sales techniques, objection handling, and closing strategies.
            </p>
          </AnimatedCard>
        </FadeIn>

        <FadeIn delay={300}>
          <AnimatedCard variant="interactive" className="p-6 group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-all duration-300">
              <AnimatedIcon variant="scale" size="md">
                <BookOpen className="h-6 w-6" />
              </AnimatedIcon>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-400 transition-colors duration-300">
              Scripting & Resources
            </h4>
            <p className="text-gray-400 leading-relaxed mb-4">
              Get access to proven sales scripts, templates, and resources to help you close more deals effectively.
            </p>
          </AnimatedCard>
        </FadeIn>

        <FadeIn delay={400}>
          <AnimatedCard variant="interactive" className="p-6 group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-all duration-300">
              <AnimatedIcon variant="scale" size="md">
                <Users2 className="h-6 w-6" />
              </AnimatedIcon>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-400 transition-colors duration-300">
              Meet Like-Minded Reps
            </h4>
            <p className="text-gray-400 leading-relaxed mb-4">
              Connect with other high-performing sales professionals, share experiences, and grow your network.
            </p>
          </AnimatedCard>
        </FadeIn>

        <FadeIn delay={500}>
          <AnimatedCard variant="interactive" className="p-6 group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-all duration-300">
              <AnimatedIcon variant="scale" size="md">
                <MapPin className="h-6 w-6" />
              </AnimatedIcon>
            </div>
            <h4 className="text-xl font-semibold mb-3 text-white group-hover:text-purple-400 transition-colors duration-300">
              In-Person Events
            </h4>
            <p className="text-gray-400 leading-relaxed mb-4">
              Join our exclusive networking events and workshops to learn from industry leaders and expand your connections.
            </p>
          </AnimatedCard>
        </FadeIn>
      </div>

      <FadeIn delay={600}>
        <div className="text-center mt-12">
          <a href="https://discord.gg/48ZSAd9djF" target="_blank" rel="noopener noreferrer">
            <AnimatedButton variant="purple" size="lg" className="group">
              Access Our Free Community
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </AnimatedButton>
          </a>
        </div>
      </FadeIn>
    </div>
  )
} 