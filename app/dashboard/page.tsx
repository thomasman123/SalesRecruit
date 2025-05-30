"use client"

import { useState, useEffect } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { FadeIn } from "@/components/ui/fade-in"
import { ArrowRight, User } from "lucide-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function DashboardPage() {
  const [showProfileTooltip, setShowProfileTooltip] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function checkProfileCompletion() {
      try {
        const supabase = getSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        
        if (user) {
          // Check if user has completed their profile
          const isProfileComplete = Object.values(user.user_metadata || {}).some(value => 
            value && typeof value === 'string' && value.length > 0
          )
          
          // Show tooltip if profile is incomplete
          setShowProfileTooltip(!isProfileComplete)
        }
      } catch (err: any) {
        console.error(err)
        toast({ title: "Error", description: err.message, variant: "destructive" })
      }
    }

    checkProfileCompletion()
  }, [toast])

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <FadeIn delay={100}>
        <h1 className="text-3xl font-bold text-white mb-8">Welcome to Helios Recruit</h1>
      </FadeIn>

      <FadeIn delay={200}>
        <div className="grid gap-6">
          <TooltipProvider>
            <Tooltip open={showProfileTooltip}>
              <TooltipTrigger asChild>
                <Link href="/dashboard/profile">
                  <AnimatedCard variant="hover-glow" className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                          <User className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-white">Complete Your Profile</h2>
                          <p className="text-gray-400">Add your experience and preferences to find the best opportunities</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-purple-400" />
                    </div>
                  </AnimatedCard>
                </Link>
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                className="bg-purple-500/90 text-white border-none p-4 max-w-[300px]"
                sideOffset={5}
              >
                <div className="flex flex-col gap-2">
                  <p className="font-semibold">Welcome to Helios Recruit! 👋</p>
                  <p>Let's get your profile set up to help you find the perfect sales opportunities.</p>
                  <p>Click here to add your experience, preferences, and showcase your skills.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Add more dashboard cards here */}
        </div>
      </FadeIn>
    </div>
  )
}
