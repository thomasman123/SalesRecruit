"use client"

import { useEffect, useState } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedIcon } from "@/components/ui/animated-icon"
import { FadeIn } from "@/components/ui/fade-in"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Calendar, User, Mail, Building, Edit2, Save, X, Globe } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

// Timezone options (reuse from dashboard profile)
const TIMEZONES = [
  { value: "Australia/Sydney", label: "Australian Eastern Time (Sydney)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Chicago", label: "Central Time (Chicago)" },
  { value: "America/Denver", label: "Mountain Time (Denver)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "Europe/London", label: "GMT (London)" },
  { value: "Europe/Paris", label: "Central European Time (Paris)" },
  { value: "Asia/Tokyo", label: "Japan Time (Tokyo)" },
  { value: "Asia/Singapore", label: "Singapore Time" },
]

export default function RecruiterProfilePage() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [saving, setSaving] = useState(false)

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
        setEditData({
          name: data?.name || '',
          email: data?.email || '',
          company: data?.company || '',
          timezone: data?.timezone || 'Australia/Sydney'
        })
      }
      setLoading(false)
    }

    fetchUserData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error("No user found")

      const { error } = await supabase
        .from('users')
        .update({
          name: editData.name,
          company: editData.company,
          timezone: editData.timezone
        })
        .eq('id', user.id)

      if (error) throw error

      setUserData((prev: any) => ({
        ...prev,
        name: editData.name,
        company: editData.company,
        timezone: editData.timezone
      }))
      setEditing(false)
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setEditData({
      name: userData?.name || '',
      email: userData?.email || '',
      company: userData?.company || '',
      timezone: userData?.timezone || 'Australia/Sydney'
    })
  }

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

  const hasFullAccess = userData?.full_access === true

  return (
    <div className="container mx-auto max-w-4xl">
      {/* Access Restricted Banner - Only show if NO full access */}
      {!hasFullAccess && (
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
      )}

      <FadeIn delay={100}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-gray-400">
            {hasFullAccess ? "View and manage your account information" : "View your account information"}
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        <AnimatedCard variant="hover-glow" className="p-8">
          <div className="flex items-start gap-6 mb-8">
            <Avatar className="h-24 w-24 border-2 border-dark-600">
              <AvatarImage src={userData?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-purple-500/20 text-purple-400 text-2xl">
                {userData?.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Full Name</Label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="mt-1"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Email</Label>
                    <Input
                      value={editData.email}
                      disabled
                      className="mt-1 opacity-60"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Company</Label>
                    <Input
                      value={editData.company}
                      onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                      className="mt-1"
                      placeholder="Enter your company name"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Timezone</Label>
                    <Select value={editData.timezone} onValueChange={(v)=>setEditData({...editData, timezone: v})}>
                      <SelectTrigger className="w-full bg-dark-700 border-dark-600 text-white">
                        <Globe className="h-4 w-4 mr-2 text-purple-400" />
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-700 border-dark-600">
                        {TIMEZONES.map(tz=> (
                          <SelectItem key={tz.value} value={tz.value} className="text-gray-300 hover:bg-dark-600 hover:text-white">
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <AnimatedButton
                      variant="purple"
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                      icon={<Save className="w-4 h-4" />}
                    >
                      {saving ? "Saving..." : "Save"}
                    </AnimatedButton>
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={saving}
                      icon={<X className="w-4 h-4" />}
                    >
                      Cancel
                    </AnimatedButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-white">{userData?.name || 'Unknown User'}</h2>
                    {hasFullAccess && (
                      <AnimatedButton
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(true)}
                        icon={<Edit2 className="w-4 h-4" />}
                      >
                        Edit
                      </AnimatedButton>
                    )}
                  </div>
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
                      <span>Company: {userData?.company || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <Globe className="w-4 h-4 text-purple-400" />
                      <span>Timezone: {userData?.timezone || 'Not set'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-dark-600 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Account Type</span>
                <span className="text-white font-medium">
                  {hasFullAccess ? "Full Access" : "Free Trial"}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Status</span>
                <span className={`font-medium ${hasFullAccess ? 'text-green-400' : 'text-yellow-400'}`}>
                  {hasFullAccess ? "Active" : "Pending Activation"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Member Since</span>
                <span className="text-white font-medium">
                  {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {!hasFullAccess && (
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
          )}
        </AnimatedCard>
      </FadeIn>
    </div>
  )
} 