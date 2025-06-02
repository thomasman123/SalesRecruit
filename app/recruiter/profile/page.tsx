"use client"

import { useEffect, useState } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { FadeIn } from "@/components/ui/fade-in"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Lock, Calendar, User, Mail, Building } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function RecruiterProfilePage() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setUserData(data)
      }
      setLoading(false)
    }

    fetchUserData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="h-4 bg-dark-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      {/* Access Restricted Banner */}
      <FadeIn delay={0}>
        <AnimatedCard variant="hover-glow" className="mb-8 p-4 border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-purple-600/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AnimatedIcon variant="pulse" size="sm" className="text-purple-400">
                <Lock className="h-5 w-5" />
              </AnimatedIcon>
              <div>
                <h3 className="text-white font-semibold">Limited Access</h3>
                <p className="text-sm text-gray-300">To unlock full features, schedule a demo with our team</p>
              </div>
            </div>
            <AnimatedButton
              variant="purple"
              size="sm"
              icon={<Calendar className="w-4 h-4" />}
              onClick={() => window.open('https://crm.heliosscale.com/widget/booking/GnOVek2QrDEWUx7vngVh', '_blank')}
            >
              Book Demo
            </AnimatedButton>
          </div>
        </AnimatedCard>
      </FadeIn>

      <FadeIn delay={100}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400">View your account information</p>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <AnimatedCard variant="hover-glow" className="p-8">
          <div className="flex items-start gap-6 mb-8">
            <Avatar className="h-24 w-24 border-2 border-dark-600">
              <AvatarImage src={userData?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-purple-500/20 text-purple-400 text-2xl">
                {userData?.full_name?.split(" ").map((n: string) => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{userData?.full_name || 'Unknown User'}</h2>
              <p className="text-gray-400 mb-4">Recruiter Account</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>{userData?.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Role: {userData?.role || 'Recruiter'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span>Company: Not specified</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-dark-600 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Account Type</span>
                <span className="text-white font-medium">Free Trial</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Status</span>
                <span className="text-yellow-400 font-medium">Pending Activation</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Member Since</span>
                <span className="text-white font-medium">
                  {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <p className="text-sm text-gray-300 text-center">
              To edit your profile and access all features, please{' '}
              <button
                onClick={() => window.open('https://crm.heliosscale.com/widget/booking/GnOVek2QrDEWUx7vngVh', '_blank')}
                className="text-purple-400 hover:text-purple-300 underline transition-colors"
              >
                schedule a demo
              </button>
              {' '}with our team.
            </p>
          </div>
        </AnimatedCard>
      </FadeIn>
    </div>
  )
} 