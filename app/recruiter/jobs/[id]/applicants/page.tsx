"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { FadeIn } from "@/components/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  ArrowLeft,
  Users,
  Eye,
  Clock,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  Briefcase,
  DollarSign,
  Target,
  Wrench,
  Brain,
  Video,
  MoreHorizontal,
  Mail,
  Play,
  Send,
  MapPin,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

export default function ApplicantsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = Number(params.id)
  const supabase = getSupabaseClient()
  const [applicants, setApplicants] = useState<any[]>([])
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortByScore, setSortByScore] = useState(false)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [scoringInProgress, setScoringInProgress] = useState<number | null>(null)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [jobDetails, setJobDetails] = useState<any>(null)

  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true)
      try {
        // Fetch applicants for this job
        const { data, error } = await supabase
          .from("applicants")
          .select("*")
          .eq("job_id", jobId)
        if (error) throw error
        setApplicants(data || [])

        // Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId)
          .single()
        if (jobError) throw jobError
        setJobDetails(jobData)
      } catch (err: any) {
        setError(err.message || "Failed to load applicants")
      } finally {
        setLoading(false)
      }
    }
    fetchApplicants()
  }, [jobId, supabase])

  const filteredApplicants = applicants.filter((applicant) => {
    const name = applicant.user?.name || applicant.name || ""
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sortByScore) {
      // Sort by score descending (highest first)
      const scoreA = a.score ?? 0
      const scoreB = b.score ?? 0
      return scoreB - scoreA
    }
    // Default: sort by date (most recent first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from("applicants")
        .update({ status })
        .eq("id", id)
      
      if (error) throw error
      
      setApplicants((prev) =>
        prev.map((applicant) => (applicant.id === id ? { ...applicant, status: status as any } : applicant)),
      )
    } catch (err: any) {
      console.error("Failed to update status:", err)
    }
  }

  const handleSaveNotes = async () => {
    if (selectedApplicant) {
      try {
        const { error } = await supabase
          .from("applicants")
          .update({ notes })
          .eq("id", selectedApplicant.id)
        
        if (error) throw error
        
        setApplicants((prev) =>
          prev.map((applicant) => (applicant.id === selectedApplicant.id ? { ...applicant, notes } : applicant)),
        )
      } catch (err: any) {
        console.error("Failed to save notes:", err)
      }
    }
  }

  const handleScoreApplicant = async (applicantId: number) => {
    try {
      setScoringInProgress(applicantId)
      const res = await fetch("/api/score-applicant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Scoring failed")
      
      // Update the applicant in state with the new score
      setApplicants((prev) =>
        prev.map((applicant) => 
          applicant.id === applicantId 
            ? { ...applicant, score: data.score, score_reasons: data.reasons }
            : applicant
        )
      )
      
      // If this is the selected applicant, update it too
      if (selectedApplicant?.id === applicantId) {
        setSelectedApplicant((prev: any) => ({ ...prev, score: data.score, score_reasons: data.reasons }))
      }
    } catch (err: any) {
      console.error("Failed to score applicant:", err)
    } finally {
      setScoringInProgress(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            New
          </Badge>
        )
      case "reviewing":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Reviewing
          </Badge>
        )
      case "interviewing":
        return (
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Interviewing
          </Badge>
        )
      case "hired":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Hired
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const getScoreBadge = (score: number | null | undefined) => {
    if (score === null || score === undefined) return null
    let color = score >= 75 ? "green" : score >= 40 ? "yellow" : "red"
    const cls =
      color === "green"
        ? "bg-green-500/20 text-green-400 border-green-500/30"
        : color === "yellow"
          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          : "bg-red-500/20 text-red-400 border-red-500/30"
    return (
      <Badge className={`${cls} flex items-center gap-1`}>
        {score}%
      </Badge>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl h-screen overflow-hidden flex flex-col">
      <FadeIn delay={100}>
        <div className="flex items-center mb-8">
          <Link
            href="/recruiter/jobs"
            className="mr-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors duration-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">Applicants</h1>
            <p className="text-gray-400 truncate">{jobDetails?.title}</p>
          </div>
        </div>
      </FadeIn>

      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left Panel - Applicant List */}
        <FadeIn delay={200}>
          <div className="w-96 flex flex-col flex-shrink-0">
            <div className="mb-4 flex-shrink-0">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search applicants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-400">Recent Applicants ({filteredApplicants.length})</h3>
                <AnimatedButton
                  variant={sortByScore ? "purple" : "outline"}
                  size="sm"
                  onClick={() => setSortByScore(!sortByScore)}
                  icon={<Brain className="w-4 h-4" />}
                >
                  {sortByScore ? "Top Rated" : "Sort by AI Score"}
                </AnimatedButton>
              </div>
            </div>

            <AnimatedCard variant="hover-glow" className="flex-1 min-h-0 flex flex-col">
              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-2">
                  {filteredApplicants.length > 0 ? (
                    filteredApplicants.map((applicant) => (
                      <div
                        key={applicant.id}
                        className={cn(
                          "p-4 rounded-lg cursor-pointer transition-all duration-300 mb-2",
                          selectedApplicant?.id === applicant.id ? "bg-purple-500/20" : "hover:bg-dark-700 bg-dark-800",
                        )}
                        onClick={() => {
                          setSelectedApplicant(applicant)
                          setNotes(applicant.notes)
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 min-w-0 flex-1">
                            <Avatar className="h-10 w-10 border border-dark-600 flex-shrink-0">
                              <AvatarImage src={applicant.user?.avatar_url ?? applicant.avatar_url ?? "/placeholder.svg"} />
                              <AvatarFallback className="bg-purple-500/20 text-purple-400">
                                {(applicant.user?.name ?? applicant.name)
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-white font-medium truncate">{applicant.user?.name ?? applicant.name}</h3>
                                  <div className="flex items-center text-xs text-gray-400 mt-1">
                                    <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">Applied {applicant.applied_date ? new Date(applicant.applied_date).toLocaleDateString() : 'Recently'}</span>
                                  </div>
                                </div>
                                {applicant.score !== undefined && applicant.score !== null && (
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-white">{applicant.score}%</div>
                                    <div className="text-xs text-gray-400">AI Score</div>
                                  </div>
                                )}
                                {(applicant.score === undefined || applicant.score === null) && (
                                  <AnimatedButton
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleScoreApplicant(applicant.id)
                                    }}
                                    isLoading={scoringInProgress === applicant.id}
                                    icon={<Brain className="w-3 h-3" />}
                                  >
                                    Score
                                  </AnimatedButton>
                                )}
                              </div>
                              {applicant.score_reasons && applicant.score_reasons.length > 0 && (
                                <div className="mt-2 text-xs text-gray-400">
                                  <div className="line-clamp-2">
                                    {applicant.score_reasons[0]}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No applicants found</h3>
                      <p className="text-gray-400 mb-6">
                        {searchQuery
                          ? "No applicants match your search criteria"
                          : "You don't have any applicants yet"}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </AnimatedCard>
          </div>
        </FadeIn>

        {/* Right Panel - Applicant Details */}
        <FadeIn delay={300}>
          <div className="flex-1 min-w-0">
            {selectedApplicant ? (
              <AnimatedCard variant="hover-glow" className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-dark-600 flex-shrink-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <Avatar className="h-16 w-16 border-2 border-dark-600 flex-shrink-0">
                        <AvatarImage src={selectedApplicant.user?.avatar_url ?? selectedApplicant.avatar_url ?? "/placeholder.svg"} />
                        <AvatarFallback className="bg-purple-500/20 text-purple-400 text-xl">
                          {(selectedApplicant.user?.name ?? selectedApplicant.name)
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-white truncate">{selectedApplicant.user?.name ?? selectedApplicant.name}</h2>
                        </div>
                        <p className="text-gray-400 truncate">{selectedApplicant.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <AnimatedButton
                        variant="purple"
                        size="sm"
                        onClick={() => setInviteDialogOpen(true)}
                        icon={<Send className="w-4 h-4" />}
                      >
                        Invite
                      </AnimatedButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-dark-700 border-dark-600 text-white">
                          <DropdownMenuItem
                            className="hover:bg-dark-600 cursor-pointer"
                            onClick={() => handleStatusChange(selectedApplicant.id, "new")}
                          >
                            <Clock className="mr-2 h-4 w-4 text-blue-400" />
                            <span>Mark as New</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-dark-600 cursor-pointer"
                            onClick={() => handleStatusChange(selectedApplicant.id, "reviewing")}
                          >
                            <Eye className="mr-2 h-4 w-4 text-yellow-400" />
                            <span>Mark as Reviewing</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-dark-600 cursor-pointer"
                            onClick={() => handleStatusChange(selectedApplicant.id, "interviewing")}
                          >
                            <Calendar className="mr-2 h-4 w-4 text-purple-400" />
                            <span>Mark as Interviewing</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-dark-600 cursor-pointer"
                            onClick={() => handleStatusChange(selectedApplicant.id, "hired")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                            <span>Mark as Hired</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-dark-600 cursor-pointer"
                            onClick={() => handleStatusChange(selectedApplicant.id, "rejected")}
                          >
                            <XCircle className="mr-2 h-4 w-4 text-red-400" />
                            <span>Mark as Rejected</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center text-sm text-gray-400 min-w-0">
                      <Briefcase className="w-4 h-4 mr-2 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{selectedApplicant.experience}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400 min-w-0">
                      <DollarSign className="w-4 h-4 mr-2 text-purple-400 flex-shrink-0" />
                      <span className="truncate">Highest ticket: {selectedApplicant.highestTicket}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400 min-w-0">
                      <Target className="w-4 h-4 mr-2 text-purple-400 flex-shrink-0" />
                      <span className="truncate">Style: {selectedApplicant.salesStyle}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-400 min-w-0">
                      <Wrench className="w-4 h-4 mr-2 text-purple-400 flex-shrink-0" />
                      <span className="truncate">Tools: {selectedApplicant.tools}</span>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-6 space-y-6">
                    {/* Fit Score */}
                    {selectedApplicant.score !== null && selectedApplicant.score !== undefined ? (
                      <AnimatedCard className="p-6 bg-gradient-to-r from-purple-900/20 to-purple-800/20 border-purple-500/30">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
                              <Brain className="w-6 h-6 text-purple-400" /> AI Match Score
                            </h3>
                            <p className="text-sm text-gray-400">Automated fit assessment for this role</p>
                          </div>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-white">{selectedApplicant.score}%</div>
                            <div className={cn(
                              "text-sm font-medium mt-1",
                              selectedApplicant.score >= 75 ? "text-green-400" :
                              selectedApplicant.score >= 50 ? "text-yellow-400" : "text-red-400"
                            )}>
                              {selectedApplicant.score >= 75 ? "Excellent Match" :
                               selectedApplicant.score >= 50 ? "Good Match" : "Fair Match"}
                            </div>
                          </div>
                        </div>
                        {selectedApplicant.score_reasons?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Factors:</h4>
                            <div className="space-y-2">
                              {selectedApplicant.score_reasons.map((r: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                                  <p className="text-sm text-gray-300">{r}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </AnimatedCard>
                    ) : (
                      <AnimatedCard className="p-6 bg-dark-800 border-dark-600">
                        <div className="text-center">
                          <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                          <h3 className="text-lg font-semibold text-white mb-2">No AI Score Yet</h3>
                          <p className="text-sm text-gray-400 mb-4">Generate an AI assessment for this applicant</p>
                          <AnimatedButton
                            variant="purple"
                            onClick={() => handleScoreApplicant(selectedApplicant.id)}
                            isLoading={scoringInProgress === selectedApplicant.id}
                            icon={<Brain className="w-4 h-4" />}
                          >
                            Generate AI Score
                          </AnimatedButton>
                        </div>
                      </AnimatedCard>
                    )}

                    {/* Video Introduction */}
                    {selectedApplicant.videoUrl && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                          <Video className="w-5 h-5 mr-2 text-purple-400" />
                          Video Introduction
                        </h3>
                        <div className="aspect-video bg-dark-700 rounded-lg flex items-center justify-center group cursor-pointer hover:bg-dark-600 transition-colors">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-500/30 transition-colors">
                              <Play className="w-6 h-6 text-purple-400" />
                            </div>
                            <p className="text-sm text-gray-400">Watch video introduction</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Background and Performance */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <Briefcase className="w-5 h-5 mr-2 text-purple-400" />
                        Background and Performance
                      </h3>
                      <AnimatedCard className="p-4 bg-dark-800 border-dark-600">
                        <p className="text-gray-300 text-sm leading-relaxed break-words">
                          {selectedApplicant.experience}. Highest ticket sale was {selectedApplicant.highestTicket}.
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                          labore et dolore magna aliqua.
                        </p>
                      </AnimatedCard>
                    </div>

                    {/* Sales Style */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-purple-400" />
                        Sales Style and Approach
                      </h3>
                      <AnimatedCard className="p-4 bg-dark-800 border-dark-600">
                        <p className="text-gray-300 text-sm leading-relaxed break-words">
                          {selectedApplicant.salesStyle}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                          do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                          nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        </p>
                      </AnimatedCard>
                    </div>

                    {/* Tools and Self-Management */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <Wrench className="w-5 h-5 mr-2 text-purple-400" />
                        Tools and Self-Management
                      </h3>
                      <AnimatedCard className="p-4 bg-dark-800 border-dark-600">
                        <p className="text-gray-300 text-sm leading-relaxed break-words">
                          Proficient with {selectedApplicant.tools}. Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                        </p>
                      </AnimatedCard>
                    </div>

                    {/* Drive and Mindset */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <Brain className="w-5 h-5 mr-2 text-purple-400" />
                        Drive and Mindset
                      </h3>
                      <AnimatedCard className="p-4 bg-dark-800 border-dark-600">
                        <p className="text-gray-300 text-sm leading-relaxed break-words">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                          laboris nisi ut aliquip ex ea commodo consequat.
                        </p>
                      </AnimatedCard>
                    </div>

                    {/* Notes */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
                        Recruiter Notes
                      </h3>
                      <AnimatedCard className="p-4 bg-dark-800 border-dark-600">
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add notes about this candidate..."
                          className="w-full bg-dark-700 border border-dark-600 rounded-lg p-3 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300 min-h-[100px] resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <AnimatedButton variant="outline" size="sm" onClick={handleSaveNotes}>
                            Save Notes
                          </AnimatedButton>
                        </div>
                      </AnimatedCard>
                    </div>
                  </div>
                </ScrollArea>

                <div className="p-6 border-t border-dark-600 flex-shrink-0">
                  <div className="flex justify-center">
                    <AnimatedButton
                      variant="purple"
                      size="lg"
                      onClick={() => setInviteDialogOpen(true)}
                      icon={<Send className="w-5 h-5" />}
                    >
                      Invite Candidate
                    </AnimatedButton>
                  </div>
                </div>
              </AnimatedCard>
            ) : (
              <AnimatedCard variant="hover-glow" className="flex-1 flex items-center justify-center">
                <div className="text-center p-12">
                  <Users className="h-16 w-16 text-gray-500 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-4">Select an Applicant</h2>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Click on an applicant from the list to view their details, update their status, or add notes.
                  </p>
                </div>
              </AnimatedCard>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-lg bg-dark-800 border-dark-600">
          <DialogHeader>
            <DialogTitle className="text-white">Send Interview Invitation</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send an invitation to {selectedApplicant?.name} to schedule an interview
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Job Details Summary */}
            <AnimatedCard className="p-4 bg-dark-700 border-dark-600">
              <h4 className="text-white font-medium mb-3">{jobDetails?.title}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-gray-400">
                  <DollarSign className="w-4 h-4 mr-2 text-purple-400" />
                  <span>{jobDetails?.price_range}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Briefcase className="w-4 h-4 mr-2 text-purple-400" />
                  <span>{jobDetails?.industry}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                  <span>{jobDetails?.remote_compatible ? "Remote" : "On-site"}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <Target className="w-4 h-4 mr-2 text-purple-400" />
                  <span>{jobDetails?.commission_structure}</span>
                </div>
              </div>
            </AnimatedCard>

            <div className="p-4 bg-dark-700/50 rounded-lg">
              <p className="text-sm text-gray-300">
                The candidate will receive an invitation to view this opportunity and book an interview time based on your availability settings.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <AnimatedButton variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </AnimatedButton>
            <AnimatedButton
              variant="purple"
              onClick={async () => {
                try {
                  const inviteData = {
                    repId: selectedApplicant?.user?.id || selectedApplicant?.user_id,
                    jobId,
                    jobDetails: {
                      title: jobDetails?.title,
                      company: jobDetails?.company_overview,
                      priceRange: jobDetails?.price_range,
                      industry: jobDetails?.industry,
                      remote: jobDetails?.remote_compatible,
                      commission: jobDetails?.commission_structure,
                    }
                  }

                  await fetch("/api/invite", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(inviteData),
                  })

                  toast({
                    title: "Invitation sent",
                    description: "The candidate will be notified and can schedule their interview.",
                  })
                  setInviteDialogOpen(false)
                } catch (err) {
                  console.error(err)
                  toast({
                    title: "Failed to send invitation",
                    description: "Please try again later.",
                    variant: "destructive",
                  })
                }
              }}
              icon={<Send className="w-4 h-4" />}
            >
              Send Invitation
            </AnimatedButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
