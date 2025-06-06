"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { FadeIn } from "@/components/ui/fade-in"
import { Calendar, Clock, Users, Briefcase, MapPin, DollarSign, CheckCircle, Video, Send, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

// Custom debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

interface Invite {
  id: string
  jobId: number
  jobTitle: string
  company: string
  priceRange: string
  industry: string
  remote: boolean
  commission: string
  recruiterName: string
  scheduledDate?: string
  scheduledTime?: string
  message?: string
  notificationId: string
  applicantId?: string
  recruiterId?: string
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState("")
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [recruiterAvailability, setRecruiterAvailability] = useState<any>(null)
  const [booking, setBooking] = useState(false)
  const [availabilityMessage, setAvailabilityMessage] = useState<string>("")
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [availabilityCache] = useState<Map<string, string[]>>(new Map())
  const [checkingConnection, setCheckingConnection] = useState<string | null>(null)
  const [timezoneInfo, setTimezoneInfo] = useState<{
    recruiterTimezone?: string
    salesRepTimezone?: string
    timezoneNote?: string
  }>({})
  const [currentTime, setCurrentTime] = useState(new Date())
  
  const supabase = getSupabaseClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch notifications that contain interview invitations
      const { data: notifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .like("title", "%Interview Invitation%")
        .order("created_at", { ascending: false })

      if (notifications) {
        // Parse invites from notifications
        const parsedInvites = notifications.map((notif: any) => {
          // Extract job details from the notification body
          const body = notif.body || ""
          const title = notif.title || ""
          const metadata = notif.metadata || {}
          
          // Extract job title from notification title
          const titleMatch = title.match(/Interview Invitation: (.+)/)
          const jobTitle = metadata.jobTitle || (titleMatch ? titleMatch[1] : "Unknown Position")
          
          // If we have complete metadata, use it (newer notifications)
          if (metadata.type === 'interview_invitation' && metadata.company) {
            return {
              id: notif.id,
              jobId: metadata.jobId || 0,
              jobTitle,
              company: metadata.company || "Unknown Company",
              priceRange: metadata.priceRange || "Not specified",
              industry: metadata.industry || "Not specified",
              remote: metadata.remote || false,
              commission: metadata.commission || "Not specified",
              recruiterName: metadata.recruiterName || "Recruiter",
              scheduledDate: undefined,
              scheduledTime: undefined,
              message: undefined,
              notificationId: notif.id,
              applicantId: metadata.applicantId,
              recruiterId: metadata.recruiterId
            }
          }
          
          // Otherwise, parse the body for all notifications to get job details (older notifications)
          const lines = body.split('\n').map((line: string) => line.trim())
          
          let company = "Unknown Company"
          let priceRange = "Not specified"
          let industry = "Not specified"
          let remote = false
          let commission = "Not specified"
          
          lines.forEach((line: string) => {
            if (line.includes('Company:')) {
              company = line.split('Company:')[1]?.trim() || "Unknown Company"
            } else if (line.includes('Price Range:')) {
              priceRange = line.split('Price Range:')[1]?.trim() || "Not specified"
            } else if (line.includes('Industry:')) {
              industry = line.split('Industry:')[1]?.trim() || "Not specified"
            } else if (line.includes('Location:')) {
              const location = line.split('Location:')[1]?.trim() || ""
              remote = location.toLowerCase().includes('remote')
            } else if (line.includes('Commission:')) {
              commission = line.split('Commission:')[1]?.trim() || "Not specified"
            }
          })

          return {
            id: notif.id,
            jobId: metadata.jobId || 0,
            jobTitle,
            company,
            priceRange,
            industry,
            remote,
            commission,
            recruiterName: metadata.recruiterName || "Recruiter",
            scheduledDate: undefined,
            scheduledTime: undefined,
            message: undefined,
            notificationId: notif.id,
            applicantId: metadata.applicantId,
            recruiterId: metadata.recruiterId
          }
        })

        setInvites(parsedInvites)
      }
    } catch (error) {
      console.error("Error fetching invites:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookTime = async (invite: Invite) => {
    // First check if both users have calendar connected
    setCheckingConnection(invite.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const checkResponse = await fetch('/api/calendar/check-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [invite.recruiterId, user.id]
        })
      })

      // Handle non-200 responses explicitly
      if (!checkResponse.ok) {
        const errorBody = await checkResponse.json().catch(() => ({})) as { error?: string; details?: string }
        toast({
          title: 'Connection check failed',
          description: errorBody?.error || errorBody?.details || 'Unable to verify Google Calendar connections. Please try again later.',
          variant: 'destructive'
        })
        return
      }

      const checkResult = await checkResponse.json()

      if (!checkResult.allConnected) {
        // Determine which user needs to connect
        const currentUserNeedsConnection = checkResult.usersWithoutConnection?.includes(user.id)
        const recruiterNeedsConnection = checkResult.usersWithoutConnection?.includes(invite.recruiterId)

        let message = ''
        if (currentUserNeedsConnection && recruiterNeedsConnection) {
          message = 'Both you and the recruiter need to connect Google Calendar to schedule interviews.'
        } else if (currentUserNeedsConnection) {
          message = 'You need to connect your Google Calendar to schedule interviews. Please go to Calendar Settings.'
        } else if (recruiterNeedsConnection) {
          message = 'The recruiter needs to connect their Google Calendar before interviews can be scheduled.'
        }

        toast({
          title: "Google Calendar Required",
          description: message,
          variant: "destructive",
          action: currentUserNeedsConnection ? (
            <AnimatedButton
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/dashboard/calendar'}
            >
              Go to Settings
            </AnimatedButton>
          ) : undefined
        })
        return
      }

      // If both have calendar connected, proceed to show the dialog
      setSelectedInvite(invite)
      setBookingDialogOpen(true)
      setLoadingSlots(false)
      // Clear cache when opening a new booking dialog
      availabilityCache.clear()
    } catch (error) {
      console.error("Error checking calendar connections:", error)
      toast({
        title: "Error",
        description: "Failed to check calendar connections. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCheckingConnection(null)
    }
  }

  // Debounced availability fetching
  const fetchAvailableSlots = useCallback(
    debounce(async (invite: Invite, date: Date) => {
      if (!invite?.recruiterId || !date) return

      const dateKey = `${invite.recruiterId}-${date.toISOString().split('T')[0]}`
      
      // Check cache first
      if (availabilityCache.has(dateKey)) {
        setAvailableSlots(availabilityCache.get(dateKey) || [])
        setLoadingSlots(false)
        return
      }

      setLoadingSlots(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const response = await fetch('/api/calendar/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recruiterId: invite.recruiterId,
            salesRepId: user.id,
            date: date.toISOString().split('T')[0]
          })
        })

        if (response.ok) {
          const data = await response.json()
          const slots = data.availableSlots || []
          
          // Cache the result
          availabilityCache.set(dateKey, slots)
          
          setAvailableSlots(slots)
          setAvailabilityMessage(data.message || "")
          
          // Store timezone information
          if (data.recruiterTimezone || data.salesRepTimezone) {
            setTimezoneInfo({
              recruiterTimezone: data.recruiterTimezone,
              salesRepTimezone: data.salesRepTimezone,
              timezoneNote: data.timezoneNote
            })
          }
        } else {
          console.error('Failed to fetch availability:', response.status)
          setAvailabilityMessage("Failed to fetch availability. Please try again.")
          setAvailableSlots([])
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
        setAvailabilityMessage("Error checking availability. Please try again.")
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }, 300), // 300ms debounce
    [availabilityCache]
  )

  // Update availability when date changes
  useEffect(() => {
    if (selectedInvite && selectedDate && bookingDialogOpen) {
      fetchAvailableSlots(selectedInvite, selectedDate)
    }
  }, [selectedDate, selectedInvite, bookingDialogOpen, fetchAvailableSlots])

  // Update current time every second when booking dialog is open
  useEffect(() => {
    if (bookingDialogOpen) {
      const interval = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [bookingDialogOpen])

  // Helper function to format time in a specific timezone
  const formatTimeInTimezone = (date: Date, timezone: string) => {
    try {
      return date.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    } catch (error) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedInvite || !selectedDate || !selectedTime) return

    setBooking(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error("Auth error:", authError)
        toast({
          title: "Authentication error",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        })
        setBooking(false)
        return
      }

      // Check required fields
      if (!selectedInvite.applicantId || !selectedInvite.recruiterId) {
        toast({
          title: "Missing information",
          description: "This invitation is missing required details. Please contact the recruiter for assistance.",
          variant: "destructive",
        })
        setBooking(false)
        return
      }

      // Get user emails for calendar invites
      const { data: recruiterData } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", selectedInvite.recruiterId)
        .single()

      const { data: salesRepData } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", user.id)
        .single()

      const { data: applicantData } = await supabase
        .from("applicants")
        .select("name")
        .eq("id", parseInt(selectedInvite.applicantId as string))
        .single()

      // Create scheduled interview record
      const scheduledDateTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(':')
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes))

      // Use the proper types for scheduled_interviews table
      const { data: interview, error: scheduleError } = await supabase
        .from("scheduled_interviews")
        .insert({
          job_id: selectedInvite.jobId,
          applicant_id: parseInt(selectedInvite.applicantId as string),
          recruiter_id: selectedInvite.recruiterId,
          sales_rep_id: user.id,
          scheduled_date: selectedDate.toISOString().split('T')[0],
          scheduled_time: selectedTime + ':00',
          duration_minutes: 30,
          status: 'scheduled'
        })
        .select()
        .single()

      if (scheduleError) {
        console.error("Error scheduling interview:", scheduleError)
        throw scheduleError
      }

      // Create calendar events if users have connected calendars
      if (recruiterData && salesRepData && recruiterData.email && salesRepData.email) {
        try {
          const response = await fetch('/api/calendar/events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recruiterId: selectedInvite.recruiterId,
              salesRepId: user.id,
              jobTitle: selectedInvite.jobTitle,
              company: selectedInvite.company,
              scheduledDate: selectedDate.toISOString().split('T')[0],
              scheduledTime: selectedTime,
              durationMinutes: 30,
              applicantName: applicantData?.name || 'Applicant',
              recruiterName: recruiterData.name || selectedInvite.recruiterName,
              recruiterEmail: recruiterData.email,
              salesRepEmail: salesRepData.email,
            }),
          })

          const calendarResult = await response.json()
          
          // Check if calendar creation actually succeeded
          if (!response.ok) {
            // Handle specific error cases
            if (calendarResult.requiresConnection) {
              // Delete the scheduled interview since we can't create calendar events
              await supabase
                .from("scheduled_interviews")
                .delete()
                .eq("id", interview.id)

              toast({
                title: "Booking Failed",
                description: calendarResult.details || "All participants must have their Google Calendar connected to schedule interviews.",
                variant: "destructive",
                action: (
                  <AnimatedButton
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/dashboard/calendar'}
                  >
                    Connect Calendar
                  </AnimatedButton>
                )
              })
              setBookingDialogOpen(false)
              return
            } else {
              // Other calendar errors - still delete the interview
              await supabase
                .from("scheduled_interviews")
                .delete()
                .eq("id", interview.id)

              throw new Error(calendarResult.details || 'Failed to create calendar events')
            }
          }
          
          if (calendarResult.meetingLink) {
            // Update the interview with the meeting link
            await supabase
              .from("scheduled_interviews")
              .update({ meeting_link: calendarResult.meetingLink })
              .eq("id", interview.id)
          }

          // Send custom email notifications to both participants
          const emailPromises = [
            // Email to recruiter
            fetch('/api/notifications/interview-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'invitation',
                interviewId: interview.id,
                recipientEmail: recruiterData.email,
                recipientName: recruiterData.name || 'Recruiter',
                jobTitle: selectedInvite.jobTitle,
                company: selectedInvite.company,
                scheduledDate: selectedDate.toISOString().split('T')[0],
                scheduledTime: selectedTime,
                meetingLink: calendarResult.meetingLink,
                recruiterName: recruiterData.name || 'Recruiter',
                salesRepName: salesRepData.name || 'Sales Representative',
              }),
            }),
            // Email to sales rep
            fetch('/api/notifications/interview-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'invitation',
                interviewId: interview.id,
                recipientEmail: salesRepData.email,
                recipientName: salesRepData.name || 'Sales Representative',
                jobTitle: selectedInvite.jobTitle,
                company: selectedInvite.company,
                scheduledDate: selectedDate.toISOString().split('T')[0],
                scheduledTime: selectedTime,
                meetingLink: calendarResult.meetingLink,
                recruiterName: recruiterData.name || 'Recruiter',
                salesRepName: salesRepData.name || 'Sales Representative',
              }),
            }),
            // Booking confirmation email to recruiter
            fetch('/api/notifications/booking-confirmation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recruiterEmail: recruiterData.email,
                recruiterName: recruiterData.name || 'Recruiter',
                salesProfessionalName: salesRepData.name || 'Sales Representative',
                jobTitle: selectedInvite.jobTitle,
                company: selectedInvite.company,
                scheduledDate: selectedDate.toISOString().split('T')[0],
                scheduledTime: selectedTime,
                meetingLink: calendarResult.meetingLink,
              }),
            }),
          ]

          // Send emails in parallel
          await Promise.all(emailPromises)

          // Only show success if calendar events were actually created
          toast({
            title: "Interview booked successfully!",
            description: (
              <div className="space-y-2">
                <p>Your interview is scheduled for {selectedDate.toLocaleDateString()} at {selectedTime}</p>
                <p className="text-sm">✅ Calendar invites sent</p>
                <p className="text-sm">✅ Email notifications sent</p>
                {calendarResult.meetingLink && <p className="text-sm">✅ Google Meet link created</p>}
              </div>
            ) as any,
          })
        } catch (calendarError) {
          console.error("Error creating calendar events:", calendarError)
          
          // Delete the scheduled interview since calendar creation failed
          await supabase
            .from("scheduled_interviews")
            .delete()
            .eq("id", interview.id)

          toast({
            title: "Booking failed",
            description: calendarError instanceof Error ? calendarError.message : "Failed to create calendar events. Please ensure both you and the recruiter have connected Google Calendar.",
            variant: "destructive",
          })
          setBookingDialogOpen(false)
          return
        }
      } else {
        // This shouldn't happen since we check connections upfront, but handle it
        await supabase
          .from("scheduled_interviews")
          .delete()
          .eq("id", interview.id)

        toast({
          title: "Booking failed",
          description: "Unable to retrieve user information. Please try again.",
          variant: "destructive",
        })
        setBookingDialogOpen(false)
        return
      }

      // Mark notification as read
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", selectedInvite.notificationId)

      // Send notification to recruiter
      if (selectedInvite.recruiterId) {
        await supabase.from("notifications").insert({
          user_id: selectedInvite.recruiterId,
          title: "Interview Scheduled",
          body: `${user.user_metadata?.full_name || salesRepData?.name || 'Sales rep'} has scheduled an interview for ${selectedInvite.jobTitle} on ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
          href: `/recruiter/jobs/${selectedInvite.jobId}/applicants`
        })
      }

      setBookingDialogOpen(false)
      fetchInvites() // Refresh the list
    } catch (error) {
      console.error("Error booking interview:", error)
      toast({
        title: "Booking failed",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-700 rounded w-1/4"></div>
          <div className="h-4 bg-dark-700 rounded w-1/2"></div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-dark-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl">
      <FadeIn delay={100}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Interview Invitations</h1>
          <p className="text-gray-400">Review and schedule your interview opportunities</p>
        </div>
      </FadeIn>

      <FadeIn delay={200}>
        {invites.length === 0 ? (
          <AnimatedCard variant="hover-glow" className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No interview invitations</h2>
            <p className="text-gray-400">When recruiters invite you to interview, they'll appear here.</p>
          </AnimatedCard>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <AnimatedCard key={invite.id} variant="hover-glow" className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{invite.jobTitle}</h3>
                        <p className="text-gray-400">{invite.company}</p>
                      </div>
                      {invite.scheduledDate && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div className="flex items-center text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2 text-purple-400" />
                        <span>{invite.priceRange}</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Briefcase className="w-4 h-4 mr-2 text-purple-400" />
                        <span>{invite.industry}</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                        <span>{invite.remote ? "Remote" : "On-site"}</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2 text-purple-400" />
                        <span>{invite.commission}</span>
                      </div>
                    </div>

                    {invite.message && (
                      <div className="mb-4 p-3 bg-dark-700 rounded-lg">
                        <p className="text-sm text-gray-300 italic">"{invite.message}"</p>
                        <p className="text-xs text-gray-500 mt-1">- {invite.recruiterName}</p>
                      </div>
                    )}

                    {invite.scheduledDate && invite.scheduledTime ? (
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                          <span>{invite.scheduledDate}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-purple-400" />
                          <span>{invite.scheduledTime}</span>
                        </div>
                        <div className="flex items-center">
                          <Video className="w-4 h-4 mr-2 text-purple-400" />
                          <span>Google Meet</span>
                        </div>
                      </div>
                    ) : (
                      <AnimatedButton
                        variant="purple"
                        onClick={() => handleBookTime(invite)}
                        disabled={checkingConnection === invite.id}
                        icon={checkingConnection === invite.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                      >
                        {checkingConnection === invite.id ? "Checking..." : "Book Interview Time"}
                      </AnimatedButton>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}
      </FadeIn>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-2xl bg-dark-800 border-dark-600">
          <DialogHeader>
            <DialogTitle className="text-white">Schedule Your Interview</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select a date and time for your interview with {selectedInvite?.company}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Timezone comparison banner removed as timezone info is deprecated */}
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-300 mb-2">Select Date</Label>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border border-dark-600"
                  disabled={(date) => {
                    const day = date.getDay()
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date < today || day === 0 || day === 6
                  }}
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2">Available Times</Label>
                <ScrollArea className="h-[300px] border border-dark-600 rounded-lg p-2">
                  <div className="space-y-2">
                    {loadingSlots ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                        <p className="text-sm">Checking availability...</p>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`w-full p-3 rounded-lg text-sm transition-all ${
                            selectedTime === slot
                              ? "bg-purple-500 text-white"
                              : "bg-dark-700 text-gray-300 hover:bg-dark-600"
                          }`}
                        >
                          {slot}
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Clock className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm text-center">No available time slots for this date.</p>
                        {availabilityMessage && (
                          <p className="text-xs text-center mt-2 text-yellow-400">{availabilityMessage}</p>
                        )}
                        <p className="text-xs text-center mt-1">
                          Make sure both users have set their availability in Calendar settings.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="p-4 bg-dark-700 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2">What happens next?</h4>
              <ul className="space-y-1 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>Calendar invites will be sent to all participants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>A Google Meet link will be automatically created</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>The recruiter will be notified of your selection</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <AnimatedButton variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </AnimatedButton>
            <AnimatedButton
              variant="purple"
              onClick={handleConfirmBooking}
              disabled={!selectedDate || !selectedTime || booking}
              icon={<Send className="w-4 h-4" />}
            >
              {booking ? "Scheduling..." : "Confirm Booking"}
            </AnimatedButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 