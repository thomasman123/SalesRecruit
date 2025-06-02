"use client"

import { useEffect, useState } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { FadeIn } from "@/components/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  Lock, 
  Unlock, 
  Calendar,
  Mail,
  Building,
  CheckCircle,
  XCircle,
  Search
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { AnimatedInput } from "@/components/ui/animated-input"

interface Recruiter {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
  full_access: boolean
}

export default function AdminRecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRecruiters()
  }, [])

  const fetchRecruiters = async () => {
    const supabase = getSupabaseClient()
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, avatar_url, created_at, full_access')
        .eq('role', 'recruiter')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching recruiters:', error)
        // If full_access column doesn't exist, fetch without it
        const { data: fallbackData } = await supabase
          .from('users')
          .select('id, email, name, avatar_url, created_at')
          .eq('role', 'recruiter')
          .order('created_at', { ascending: false })
        
        setRecruiters((fallbackData || []).map(r => ({ ...r, full_access: false })))
      } else {
        setRecruiters(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAccess = async (recruiterId: string, currentAccess: boolean) => {
    setUpdatingId(recruiterId)
    const supabase = getSupabaseClient()
    
    try {
      // Try to update with full_access column
      const { error } = await supabase
        .from('users')
        .update({ full_access: !currentAccess })
        .eq('id', recruiterId)

      if (error) {
        // If column doesn't exist, show appropriate message
        if (error.code === '42703') { // Column doesn't exist error
          toast({
            title: "Database Update Required",
            description: "Please run the migration to add the full_access column to the users table.",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      // Update local state
      setRecruiters(prev => 
        prev.map(r => 
          r.id === recruiterId ? { ...r, full_access: !currentAccess } : r
        )
      )

      toast({
        title: currentAccess ? "Access Revoked" : "Access Granted",
        description: `Successfully ${currentAccess ? 'revoked' : 'granted'} full access for this recruiter.`,
      })
    } catch (error: any) {
      console.error('Error updating access:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update recruiter access",
        variant: "destructive",
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredRecruiters = recruiters.filter(recruiter =>
    recruiter.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recruiter.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="h-4 bg-dark-700 rounded w-1/2"></div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-dark-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <FadeIn delay={0}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Manage Recruiters</h1>
          <p className="text-gray-400">Grant or revoke full access for recruiter accounts</p>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <AnimatedInput
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              variant="glow"
            />
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <div className="grid gap-4">
          {filteredRecruiters.length === 0 ? (
            <AnimatedCard variant="hover-glow" className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Recruiters Found</h3>
              <p className="text-gray-400">
                {searchQuery ? "No recruiters match your search criteria" : "No recruiters have signed up yet"}
              </p>
            </AnimatedCard>
          ) : (
            filteredRecruiters.map((recruiter, index) => (
              <FadeIn key={recruiter.id} delay={200 + index * 50}>
                <AnimatedCard variant="hover-glow" className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border border-dark-600">
                        <AvatarImage src={recruiter.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-purple-500/20 text-purple-400">
                          {recruiter.name?.split(" ").map(n => n[0]).join("") || "R"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-white">{recruiter.name || 'Unknown'}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{recruiter.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Joined {new Date(recruiter.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={recruiter.full_access 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }>
                        {recruiter.full_access ? (
                          <>
                            <Unlock className="w-3 h-3 mr-1" />
                            Full Access
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            Limited Access
                          </>
                        )}
                      </Badge>

                      <div className="flex items-center gap-2">
                        <Label htmlFor={`access-${recruiter.id}`} className="text-sm text-gray-400">
                          Grant Access
                        </Label>
                        <Switch
                          id={`access-${recruiter.id}`}
                          checked={recruiter.full_access}
                          onCheckedChange={() => handleToggleAccess(recruiter.id, recruiter.full_access)}
                          disabled={updatingId === recruiter.id}
                          className="data-[state=checked]:bg-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {!recruiter.full_access && (
                    <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <p className="text-sm text-yellow-400 flex items-start gap-2">
                        <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        This recruiter can only view their profile. Grant full access to unlock all features.
                      </p>
                    </div>
                  )}
                </AnimatedCard>
              </FadeIn>
            ))
          )}
        </div>
      </FadeIn>

      {/* Info Card */}
      <FadeIn delay={400}>
        <AnimatedCard variant="hover-glow" className="mt-8 p-6 border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-purple-600/10">
          <h3 className="text-lg font-semibold text-white mb-2">About Recruiter Access</h3>
          <p className="text-sm text-gray-300 mb-4">
            When you grant full access to a recruiter, they can:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Post and manage job listings</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">View and contact applicants</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Send messages to candidates</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">Manage calendar and interviews</span>
            </div>
          </div>
        </AnimatedCard>
      </FadeIn>
    </div>
  )
} 