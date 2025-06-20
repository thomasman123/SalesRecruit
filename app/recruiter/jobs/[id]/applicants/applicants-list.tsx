"use client"

import { useState } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ApplicantDialog } from "@/components/recruiter/applicant-dialog"
import { Brain, Star, MapPin, Calendar, UserPlus, Clock, CheckCircle, Mail } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface Applicant {
  id: number
  name: string
  email: string
  location: string
  applied_date: string
  status: "new" | "reviewing" | "interviewing" | "hired" | "rejected"
  starred: boolean
  experience: string
  highest_ticket: string
  sales_style: string
  tools: string
  video_url?: string
  notes?: string
  avatar_url?: string
  user_id?: string | null
  score?: number | null
  score_reasons?: string[] | null
  invited?: boolean
  hasScheduledInterview?: boolean
  scheduledInterview?: {
    scheduled_date: string
    scheduled_time: string
  }
}

interface ApplicantsListProps {
  applicants: Applicant[]
  jobId: number
  jobTitle: string
}

type SortOption = "score-high" | "score-low" | "date-new" | "date-old"

export function ApplicantsList({ applicants: initialApplicants, jobId, jobTitle }: ApplicantsListProps) {
  const [applicants, setApplicants] = useState(initialApplicants)
  const [sortBy, setSortBy] = useState<SortOption>("date-new")
  const [isScoring, setIsScoring] = useState<{ [key: number]: boolean }>({})
  const [isInviting, setIsInviting] = useState<{ [key: number]: boolean }>({})
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // Categorize applicants
  const categorizedApplicants = {
    new: applicants.filter(a => !a.invited && !a.hasScheduledInterview && a.status !== "rejected" && a.status !== "hired"),
    invited: applicants.filter(a => a.invited && !a.hasScheduledInterview && a.status !== "rejected" && a.status !== "hired"),
    interviewed: applicants.filter(a => a.hasScheduledInterview && a.status !== "rejected" && a.status !== "hired")
  }

  // Sort function
  const sortApplicants = (applicantsList: Applicant[]) => {
    const sorted = [...applicantsList]
    switch (sortBy) {
      case "score-high":
        return sorted.sort((a, b) => (b.score || 0) - (a.score || 0))
      case "score-low":
        return sorted.sort((a, b) => (a.score || 0) - (b.score || 0))
      case "date-new":
        return sorted.sort((a, b) => new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime())
      case "date-old":
        return sorted.sort((a, b) => new Date(a.applied_date).getTime() - new Date(b.applied_date).getTime())
      default:
        return sorted
    }
  }

  const toggleStar = async (applicantId: number, currentStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening the profile
    try {
      const response = await fetch(`/api/applicants/${applicantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: !currentStarred }),
      })

      if (!response.ok) throw new Error("Failed to update star")

      setApplicants(applicants.map(a => 
        a.id === applicantId ? { ...a, starred: !currentStarred } : a
      ))
    } catch (error) {
      toast.error("Failed to update star")
    }
  }

  const scoreApplicant = async (applicantId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening the profile
    setIsScoring({ ...isScoring, [applicantId]: true })
    
    try {
      const response = await fetch("/api/score-applicant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId }),
      })

      if (!response.ok) throw new Error("Failed to score applicant")

      const { score, reasons } = await response.json()
      
      setApplicants(applicants.map(a => 
        a.id === applicantId ? { ...a, score, score_reasons: reasons } : a
      ))
      
      toast.success(`AI Score: ${score}/100`)
    } catch (error) {
      toast.error("Failed to generate AI score")
    } finally {
      setIsScoring({ ...isScoring, [applicantId]: false })
    }
  }

  const inviteApplicant = async (applicant: Applicant, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening the profile
    if (isInviting[applicant.id]) return

    if (!applicant.user_id) {
      toast.error("Cannot invite applicant without a user account")
      return
    }

    setIsInviting(prev => ({ ...prev, [applicant.id]: true }))

    try {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repId: applicant.user_id,
          jobId: jobId,
          jobDetails: { title: jobTitle }
        }),
      })

      if (!response.ok) throw new Error("Failed to send invitation")

      setApplicants(applicants.map(a => 
        a.id === applicant.id ? { ...a, invited: true } : a
      ))
      
      setIsInviting(prev => {
        const updated = { ...prev }
        delete updated[applicant.id]
        return updated
      })
      
      toast.success("Invitation sent successfully")
      // Automatically close the profile modal after sending the invite
      setProfileModalOpen(false)
    } catch (error) {
      toast.error("Failed to send invitation")
      setIsInviting(prev => ({ ...prev, [applicant.id]: false }))
    }
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20"
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20"
    if (score >= 40) return "bg-orange-500/10 border-orange-500/20"
    return "bg-red-500/10 border-red-500/20"
  }

  const openProfile = (applicant: Applicant) => {
    setSelectedApplicant(applicant)
    setProfileModalOpen(true)
  }

  const renderApplicant = (applicant: Applicant) => (
    <AnimatedCard 
      key={applicant.id} 
      variant="hover-glow" 
      className="p-6 cursor-pointer transition-all hover:border-purple-500/50"
      onClick={() => openProfile(applicant)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Avatar className="h-12 w-12">
            <AvatarImage src={applicant.avatar_url} />
            <AvatarFallback>{getInitials(applicant.name)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-white">{applicant.name}</h3>
              <button
                onClick={(e) => toggleStar(applicant.id, applicant.starred, e)}
                className="text-gray-400 hover:text-yellow-500 transition-colors"
              >
                <Star className={`h-4 w-4 ${applicant.starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-2">{applicant.email}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {applicant.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Applied {formatDistanceToNow(new Date(applicant.applied_date), { addSuffix: true })}
              </span>
            </div>

            {/* Scheduled Interview Info */}
            {applicant.hasScheduledInterview && applicant.scheduledInterview && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Interview scheduled for {new Date(applicant.scheduledInterview.scheduled_date).toLocaleDateString()} 
                    at {applicant.scheduledInterview.scheduled_time}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* AI Score Display */}
          <div className="text-right">
            {applicant.score !== null && applicant.score !== undefined ? (
              <div>
                <div className={`text-2xl font-bold ${getScoreColor(applicant.score)}`}>
                  {applicant.score}%
                </div>
                <Badge className={`${getScoreBgColor(applicant.score)} mb-2`}>
                  AI Score
                </Badge>
                {applicant.score_reasons && applicant.score_reasons.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-400 text-right max-w-[200px] list-disc list-inside space-y-1 break-all">
                    {applicant.score_reasons.slice(0, 2).map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => scoreApplicant(applicant.id, e)}
                disabled={isScoring[applicant.id]}
                className="mb-2"
              >
                {isScoring[applicant.id] ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Get AI Score
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          {!applicant.invited && !applicant.hasScheduledInterview && (
            <Button
              size="sm"
              onClick={(e) => inviteApplicant(applicant, e)}
              disabled={!applicant.user_id || isInviting[applicant.id]}
              title={!applicant.user_id ? "Applicant must have a user account to invite" : ""}
            >
              {isInviting[applicant.id] ? (
                <>
                  <Clock className="h-4 w-4 mr-1 animate-spin" />
                  Inviting...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </AnimatedCard>
  )

  const renderCategory = (title: string, icon: React.ReactNode, applicants: Applicant[], color: string) => {
    const sortedApplicants = sortApplicants(applicants)
    
    if (sortedApplicants.length === 0) return null

    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <Badge variant="secondary" className="ml-2">{sortedApplicants.length}</Badge>
        </div>
        <div className="space-y-4">
          {sortedApplicants.map(renderApplicant)}
        </div>
      </div>
    )
  }

  return (
    <>
      <FadeIn delay={200}>
        <div className="space-y-6">
          {/* Sorting Controls */}
          <AnimatedCard variant="hover-glow" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="date-new">Newest First</option>
                  <option value="date-old">Oldest First</option>
                  <option value="score-high">Highest AI Score</option>
                  <option value="score-low">Lowest AI Score</option>
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Brain className="h-4 w-4" />
                AI-Powered Scoring
              </div>
            </div>
          </AnimatedCard>

          {/* Categories */}
          {renderCategory(
            "New Applicants",
            <UserPlus className="h-5 w-5 text-blue-400" />,
            categorizedApplicants.new,
            "bg-blue-500/10 border border-blue-500/20"
          )}

          {renderCategory(
            "Invited to Interview",
            <Clock className="h-5 w-5 text-yellow-400" />,
            categorizedApplicants.invited,
            "bg-yellow-500/10 border border-yellow-500/20"
          )}

          {renderCategory(
            "Interview Scheduled",
            <CheckCircle className="h-5 w-5 text-green-400" />,
            categorizedApplicants.interviewed,
            "bg-green-500/10 border border-green-500/20"
          )}

          {/* Empty State */}
          {applicants.length === 0 && (
            <AnimatedCard variant="hover-glow" className="p-12 text-center">
              <p className="text-gray-400">No applicants yet for this position</p>
            </AnimatedCard>
          )}
        </div>
      </FadeIn>

      {/* Profile Modal */}
      {selectedApplicant && (
        <ApplicantDialog
          applicant={selectedApplicant}
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          isInviting={isInviting[selectedApplicant.id]}
          onInvite={(applicant) => {
            const fakeEvent = { stopPropagation: () => {} } as React.MouseEvent
            inviteApplicant(applicant as any, fakeEvent)
          }}
        />
      )}
    </>
  )
} 