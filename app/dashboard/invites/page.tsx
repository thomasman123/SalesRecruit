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
          const jobTitle = titleMatch ? titleMatch[1] : "Unknown Position"
          
          // If we have metadata, use it (newer notifications)
          if (metadata.type === 'interview_invitation') {
            return {
              id: notif.id,
              jobId: metadata.jobId || 0,
              jobTitle,
              company: "Unknown Company", // We'll parse from body
              priceRange: "Not specified",
              industry: "Not specified",
              remote: false,
              commission: "Not specified",
              recruiterName: metadata.recruiterName || "Recruiter",
              scheduledDate: undefined,
              scheduledTime: undefined,
              message: undefined,
              notificationId: notif.id,
              applicantId: metadata.applicantId,
              recruiterId: metadata.recruiterId
            }
          }
          
          // Parse the body for all notifications to get job details
          const lines = body.split('\n').map((line: string) => line.trim())
          
          let company = "Unknown Company"
          let priceRange = "Not specified"
          let industry = "Not specified"
          let remote = false
          let commission = "Not specified"
          
          lines.forEach((line: string) => {
            if (line.startsWith('• Company:')) {
              company = line.replace('• Company:', '').trim()
            } else if (line.startsWith('• Price Range:')) {
              priceRange = line.replace('• Price Range:', '').trim()
            } else if (line.startsWith('• Industry:')) {
              industry = line.replace('• Industry:', '').trim()
            } else if (line.startsWith('• Location:')) {
              const location = line.replace('• Location:', '').trim()
              remote = location.includes('Remote')
            } else if (line.startsWith('• Commission:')) {
              commission = line.replace('• Commission:', '').trim()
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

  const handleBookTime = (invite: Invite) => {
    setSelectedInvite(invite)
    setBookingDialogOpen(true)
    // TODO: Fetch recruiter's availability from calendar_availability table
    generateAvailableSlots()
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

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check required fields
      if (!selectedInvite.applicantId || !selectedInvite.recruiterId) {
        toast({
          title: "Missing information",
          description: "This invitation is missing required details. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Create scheduled interview record
      const scheduledDateTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(':')
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes))

      // Use type assertion for the table that's not in the types yet
      const { error: scheduleError } = await (supabase as any)
        .from("scheduled_interviews")
        .insert({
          job_id: selectedInvite.jobId,
          applicant_id: selectedInvite.applicantId,
          recruiter_id: selectedInvite.recruiterId,
          sales_rep_id: user.id,
          scheduled_date: selectedDate.toISOString().split('T')[0],
          scheduled_time: selectedTime + ':00',
          duration_minutes: 30,
          status: 'scheduled'
        })

      if (scheduleError) {
        console.error("Error scheduling interview:", scheduleError)
        throw scheduleError
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
          body: `${user.user_metadata?.full_name || 'Sales rep'} has scheduled an interview for ${selectedInvite.jobTitle} on ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
          href: `/recruiter/jobs/${selectedInvite.jobId}/applicants`
        })
      }

      toast({
        title: "Interview booked!",
        description: `Your interview is scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
      })

      setBookingDialogOpen(false)
      fetchInvites() // Refresh the list
    } catch (error) {
      console.error("Error booking interview:", error)
      toast({
        title: "Booking failed",
        description: "Please try again later",
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
          </div>

          <div className="flex justify-end gap-3">
            <AnimatedButton variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </AnimatedButton>
            <AnimatedButton
              variant="purple"
              onClick={handleConfirmBooking}
              disabled={!selectedDate || !selectedTime}
              icon={<Send className="w-4 h-4" />}
            >
              Confirm Booking
            </AnimatedButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 