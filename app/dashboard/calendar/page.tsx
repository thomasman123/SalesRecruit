"use client"

import { useState, useEffect } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { FadeIn } from "@/components/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Link as LinkIcon,
  Settings,
  Loader2,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { useSearchParams, useRouter } from "next/navigation"

export default function CalendarPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [availability, setAvailability] = useState({
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "09:00", end: "17:00" },
    sunday: { enabled: false, start: "09:00", end: "17:00" },
  })

  const supabase = getSupabaseClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Check for OAuth callback params
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'connected') {
      toast({
        title: "Calendar connected!",
        description: "Your Google Calendar has been successfully connected.",
      })
      // Clear query params
      router.replace('/dashboard/calendar')
    } else if (error) {
      const errorMessages: Record<string, string> = {
        auth_failed: "Google authentication failed. Please try again.",
        invalid_request: "Invalid request. Please try again.",
        save_failed: "Failed to save calendar connection. Please try again.",
        callback_failed: "Something went wrong. Please try again.",
      }
      
      toast({
        title: "Connection failed",
        description: errorMessages[error] || "Failed to connect calendar. Please try again.",
        variant: "destructive",
      })
      // Clear query params
      router.replace('/dashboard/calendar')
    }

    checkCalendarConnection()
  }, [searchParams, router])

  const checkCalendarConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user has connected their calendar
      const { data: connection } = await (supabase as any)
        .from("calendar_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "google")
        .single()

      setIsConnected(!!connection)

      // Load availability settings
      const { data: availabilityData } = await (supabase as any)
        .from("calendar_availability")
        .select("*")
        .eq("user_id", user.id)

      if (availabilityData && availabilityData.length > 0) {
        const newAvailability = { ...availability }
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        
        availabilityData.forEach((day: any) => {
          const dayName = days[day.day_of_week] as keyof typeof availability
          newAvailability[dayName] = {
            enabled: day.is_available,
            start: day.start_time.slice(0, 5),
            end: day.end_time.slice(0, 5),
          }
        })
        
        setAvailability(newAvailability)
      }
    } catch (error) {
      console.error("Error checking calendar connection:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectCalendar = async () => {
    setConnecting(true)
    try {
      const response = await fetch('/api/auth/google')
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Failed to get auth URL')
      }
    } catch (error) {
      console.error('Error connecting calendar:', error)
      toast({
        title: "Connection failed",
        description: "Failed to connect to Google Calendar. Please try again.",
        variant: "destructive",
      })
      setConnecting(false)
    }
  }

  const handleDisconnectCalendar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await (supabase as any)
        .from("calendar_connections")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", "google")

      if (error) throw error

      setIsConnected(false)
      toast({
        title: "Calendar disconnected",
        description: "Your Google Calendar has been disconnected.",
      })
    } catch (error: any) {
      console.error("Error disconnecting calendar:", error)
      toast({
        title: "Error",
        description: "Failed to disconnect calendar. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveAvailability = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      
      // Delete existing availability
      await (supabase as any)
        .from("calendar_availability")
        .delete()
        .eq("user_id", user.id)

      // Insert new availability
      const availabilityData = Object.entries(availability).map(([day, settings], index) => ({
        user_id: user.id,
        day_of_week: days.indexOf(day),
        start_time: settings.start + ':00',
        end_time: settings.end + ':00',
        is_available: settings.enabled,
      }))

      const { error } = await (supabase as any)
        .from("calendar_availability")
        .insert(availabilityData)

      if (error) throw error

      toast({
        title: "Availability saved",
        description: "Your calendar availability has been updated.",
      })
    } catch (error: any) {
      console.error("Error saving availability:", error)
      toast({
        title: "Error",
        description: "Failed to save availability. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="h-4 bg-dark-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <FadeIn delay={100}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Calendar Settings</h1>
          <p className="text-gray-400">Connect your calendar and manage your availability</p>
        </div>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar Connection */}
        <FadeIn delay={200}>
          <AnimatedCard variant="hover-glow" className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Google Calendar
                </h2>
                <p className="text-sm text-gray-400">
                  Connect your Google Calendar to sync interviews
                </p>
              </div>
              {isConnected ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-dark-700 rounded-lg">
                <h3 className="text-sm font-medium text-white mb-2">Features</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    Automatic calendar event creation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    Email invites sent to all participants
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    Google Meet links automatically added
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    Two-way sync with Google Calendar
                  </li>
                </ul>
              </div>

              {!isConnected && (
                <AnimatedButton
                  variant="purple"
                  className="w-full"
                  onClick={handleConnectCalendar}
                  disabled={connecting}
                  icon={connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                >
                  {connecting ? "Connecting..." : "Connect Google Calendar"}
                </AnimatedButton>
              )}

              {isConnected && (
                <AnimatedButton
                  variant="outline"
                  className="w-full"
                  onClick={handleDisconnectCalendar}
                >
                  Disconnect Calendar
                </AnimatedButton>
              )}
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Quick Stats */}
        <FadeIn delay={300}>
          <AnimatedCard variant="hover-glow" className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Interview Stats
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-dark-700 rounded-lg">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">This Week</div>
              </div>
              <div className="p-4 bg-dark-700 rounded-lg">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">This Month</div>
              </div>
              <div className="p-4 bg-dark-700 rounded-lg">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">Total Scheduled</div>
              </div>
              <div className="p-4 bg-dark-700 rounded-lg">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
            </div>
          </AnimatedCard>
        </FadeIn>
      </div>

      {/* Availability Settings */}
      <FadeIn delay={400}>
        <AnimatedCard variant="hover-glow" className="p-6 mt-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Weekly Availability
          </h2>

          <div className="space-y-4">
            {Object.entries(availability).map(([day, settings]) => (
              <div key={day} className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) =>
                      setAvailability((prev) => ({
                        ...prev,
                        [day]: { ...prev[day as keyof typeof prev], enabled: checked },
                      }))
                    }
                  />
                  <Label className="text-white capitalize font-medium w-24">{day}</Label>
                </div>

                {settings.enabled && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-400 text-sm">From</Label>
                      <input
                        type="time"
                        value={settings.start}
                        onChange={(e) =>
                          setAvailability((prev) => ({
                            ...prev,
                            [day]: { ...prev[day as keyof typeof prev], start: e.target.value },
                          }))
                        }
                        className="bg-dark-800 border border-dark-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-400 text-sm">To</Label>
                      <input
                        type="time"
                        value={settings.end}
                        onChange={(e) =>
                          setAvailability((prev) => ({
                            ...prev,
                            [day]: { ...prev[day as keyof typeof prev], end: e.target.value },
                          }))
                        }
                        className="bg-dark-800 border border-dark-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <AnimatedButton variant="purple" onClick={handleSaveAvailability}>
              Save Availability
            </AnimatedButton>
          </div>
        </AnimatedCard>
      </FadeIn>
    </div>
  )
} 