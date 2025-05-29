"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { FadeIn } from "@/components/ui/fade-in"

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState({
    job_notifications_enabled: true,
    notification_frequency: "immediate",
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("email_notification_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (error) {
          if (error.code === "PGRST116") {
            // No preferences found, use defaults
            return
          }
          throw error
        }

        if (data) {
          setPreferences({
            job_notifications_enabled: data.job_notifications_enabled,
            notification_frequency: data.notification_frequency,
          })
        }
      } catch (err: any) {
        console.error("Error fetching preferences:", err)
        toast({
          title: "Error",
          description: "Failed to load notification preferences",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.rpc("update_notification_preferences", {
        p_user_id: user.id,
        p_job_notifications_enabled: preferences.job_notifications_enabled,
        p_notification_frequency: preferences.notification_frequency,
      })

      if (error) throw error

      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      })
    } catch (err: any) {
      console.error("Error saving preferences:", err)
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <AnimatedCard variant="hover-glow" className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-purple-400">Loading preferences...</div>
          </div>
        </AnimatedCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <FadeIn>
        <h1 className="text-3xl font-bold text-white mb-8">Notification Settings</h1>

        <AnimatedCard variant="hover-glow" className="p-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Job Notifications</h2>
                <p className="text-gray-400">
                  Receive notifications about new job opportunities that match your profile
                </p>
              </div>
              <Switch
                checked={preferences.job_notifications_enabled}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, job_notifications_enabled: checked }))
                }
              />
            </div>

            {preferences.job_notifications_enabled && (
              <div className="space-y-4">
                <Label htmlFor="frequency" className="text-white">
                  Notification Frequency
                </Label>
                <Select
                  value={preferences.notification_frequency}
                  onValueChange={(value) =>
                    setPreferences((prev) => ({ ...prev, notification_frequency: value }))
                  }
                >
                  <SelectTrigger className="bg-dark-700 border-dark-600 text-white">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-400">
                  {preferences.notification_frequency === "immediate" && (
                    "You'll receive notifications as soon as new jobs are posted"
                  )}
                  {preferences.notification_frequency === "daily" && (
                    "You'll receive a daily summary of new job opportunities"
                  )}
                  {preferences.notification_frequency === "weekly" && (
                    "You'll receive a weekly summary of new job opportunities"
                  )}
                </p>
              </div>
            )}

            <div className="pt-4">
              <AnimatedButton
                variant="purple"
                onClick={handleSave}
                isLoading={saving}
                className="w-full sm:w-auto"
              >
                Save Preferences
              </AnimatedButton>
            </div>
          </div>
        </AnimatedCard>
      </FadeIn>
    </div>
  )
} 