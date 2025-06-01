"use client"

import { useState, useEffect } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { FadeIn } from "@/components/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Briefcase,
  Users,
  Send,
  CheckCircle,
  Video,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

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
  
  const supabase = getSupabaseClient()
  const router = useRouter()

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
    setSelectedInvite(invite)
    setBookingDialogOpen(true)
    
    // Fetch real availability from the API
    if (invite.recruiterId && selectedDate) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const response = await fetch('/api/calendar/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recruiterId: invite.recruiterId,
            salesRepId: user.id,
            date: selectedDate.toISOString().split('T')[0]
          })
        })

        if (response.ok) {
          const { availableSlots } = await response.json()
          setAvailableSlots(availableSlots)
        } else {
          // Fallback to default slots if API fails
          generateAvailableSlots()
        }
      } catch (error) {
        console.error('Error fetching availability:', error)
        generateAvailableSlots()
      }
    } else {
      generateAvailableSlots()
    }
  }

  // Update availability when date changes
  useEffect(() => {
    if (selectedInvite && selectedDate && bookingDialogOpen) {
      fetchAvailableSlots()
    }
  }, [selectedDate, selectedInvite, bookingDialogOpen])

  const fetchAvailableSlots = async () => {
    if (!selectedInvite?.recruiterId || !selectedDate) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/calendar/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterId: selectedInvite.recruiterId,
          salesRepId: user.id,
          date: selectedDate.toISOString().split('T')[0]
        })
      })

      if (response.ok) {
        const { availableSlots } = await response.json()
        setAvailableSlots(availableSlots)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    }
  }

  const generateAvailableSlots = () => {
    // For now, generate some mock available slots
    const slots = []
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${hour}:00`)
      slots.push(`${hour}:30`)
    }
    setAvailableSlots(slots)
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
          
          if (calendarResult.meetingLink) {
            // Update the interview with the meeting link
            await supabase
              .from("scheduled_interviews")
              .update({ meeting_link: calendarResult.meetingLink })
              .eq("id", interview.id)

            toast({
              title: "Interview booked!",
              description: (
                <div className="space-y-2">
                  <p>Your interview is scheduled for {selectedDate.toLocaleDateString()} at {selectedTime}</p>
                  <p className="text-sm">Calendar invites have been sent to all participants.</p>
                </div>
              ) as any, // Type workaround for custom ReactNode content
            })
          } else {
            toast({
              title: "Interview booked!",
              description: `Your interview is scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
            })
          }
        } catch (calendarError) {
          console.error("Error creating calendar events:", calendarError)
          // Still show success even if calendar events fail
          toast({
            title: "Interview booked!",
            description: `Your interview is scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
          })
        }
      } else {
        // No email data available, just show basic success
        toast({
          title: "Interview booked!",
          description: `Your interview is scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
        })
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
                        icon={<Calendar className="w-4 h-4" />}
                      >
                        Book Interview Time
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
                    {availableSlots.map((slot) => (
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
                    ))}
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