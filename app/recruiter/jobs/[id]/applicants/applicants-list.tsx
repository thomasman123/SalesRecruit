"use client"

import { useState } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { FadeIn } from "@/components/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, MapPin, Calendar, Search, Filter, ChevronDown, ChevronUp, ExternalLink, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
}

interface ApplicantsListProps {
  applicants: Applicant[]
  jobId: number
  jobTitle: string
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  reviewing: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  interviewing: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  hired: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
}

export function ApplicantsList({ applicants: initialApplicants, jobId, jobTitle }: ApplicantsListProps) {
  const router = useRouter()
  const [applicants, setApplicants] = useState(initialApplicants)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [expandedApplicant, setExpandedApplicant] = useState<number | null>(null)
  const [notes, setNotes] = useState<{ [key: number]: string }>({})
  const [isUpdating, setIsUpdating] = useState<{ [key: number]: boolean }>({})

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = 
      applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || applicant.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const updateApplicantStatus = async (applicantId: number, newStatus: string) => {
    setIsUpdating({ ...isUpdating, [applicantId]: true })
    
    try {
      const response = await fetch(`/api/applicants/${applicantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      setApplicants(applicants.map(a => 
        a.id === applicantId ? { ...a, status: newStatus as any } : a
      ))
      
      toast.success("Status updated successfully")
    } catch (error) {
      toast.error("Failed to update status")
    } finally {
      setIsUpdating({ ...isUpdating, [applicantId]: false })
    }
  }

  const toggleStar = async (applicantId: number, currentStarred: boolean) => {
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

  const saveNotes = async (applicantId: number) => {
    setIsUpdating({ ...isUpdating, [applicantId]: true })
    
    try {
      const response = await fetch(`/api/applicants/${applicantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes[applicantId] || "" }),
      })

      if (!response.ok) throw new Error("Failed to save notes")

      setApplicants(applicants.map(a => 
        a.id === applicantId ? { ...a, notes: notes[applicantId] || "" } : a
      ))
      
      toast.success("Notes saved successfully")
    } catch (error) {
      toast.error("Failed to save notes")
    } finally {
      setIsUpdating({ ...isUpdating, [applicantId]: false })
    }
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  return (
    <FadeIn delay={200}>
      <div className="space-y-6">
        {/* Filters */}
        <AnimatedCard variant="hover-glow" className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name, email, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </AnimatedCard>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <AnimatedCard variant="hover-glow" className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{applicants.length}</div>
            <div className="text-sm text-gray-400">Total</div>
          </AnimatedCard>
          <AnimatedCard variant="hover-glow" className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {applicants.filter(a => a.status === "new").length}
            </div>
            <div className="text-sm text-gray-400">New</div>
          </AnimatedCard>
          <AnimatedCard variant="hover-glow" className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {applicants.filter(a => a.status === "reviewing").length}
            </div>
            <div className="text-sm text-gray-400">Reviewing</div>
          </AnimatedCard>
          <AnimatedCard variant="hover-glow" className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">
              {applicants.filter(a => a.status === "interviewing").length}
            </div>
            <div className="text-sm text-gray-400">Interviewing</div>
          </AnimatedCard>
          <AnimatedCard variant="hover-glow" className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {applicants.filter(a => a.status === "hired").length}
            </div>
            <div className="text-sm text-gray-400">Hired</div>
          </AnimatedCard>
        </div>

        {/* Applicants List */}
        <div className="space-y-4">
          {filteredApplicants.length === 0 ? (
            <AnimatedCard variant="hover-glow" className="p-12 text-center">
              <p className="text-gray-400">
                {searchQuery || statusFilter !== "all" 
                  ? "No applicants found matching your criteria"
                  : "No applicants yet for this position"}
              </p>
            </AnimatedCard>
          ) : (
            filteredApplicants.map((applicant) => (
              <AnimatedCard key={applicant.id} variant="hover-glow" className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={applicant.avatar_url} />
                        <AvatarFallback>{getInitials(applicant.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">{applicant.name}</h3>
                          <button
                            onClick={() => toggleStar(applicant.id, applicant.starred)}
                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                          >
                            <Star className={`h-4 w-4 ${applicant.starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-400">{applicant.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {applicant.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Applied {formatDistanceToNow(new Date(applicant.applied_date), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={applicant.status} 
                        onValueChange={(value) => updateApplicantStatus(applicant.id, value)}
                        disabled={isUpdating[applicant.id]}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="reviewing">Reviewing</SelectItem>
                          <SelectItem value="interviewing">Interviewing</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedApplicant(
                          expandedApplicant === applicant.id ? null : applicant.id
                        )}
                      >
                        {expandedApplicant === applicant.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Experience:</span>{" "}
                      <span className="text-white">{applicant.experience}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Highest Ticket:</span>{" "}
                      <span className="text-white">{applicant.highest_ticket}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sales Style:</span>{" "}
                      <span className="text-white">{applicant.sales_style}</span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedApplicant === applicant.id && (
                    <div className="pt-4 border-t border-dark-600 space-y-4">
                      <div>
                        <Label className="text-gray-400">Tools Used</Label>
                        <p className="text-white mt-1">{applicant.tools}</p>
                      </div>

                      {applicant.video_url && (
                        <div>
                          <Label className="text-gray-400">Video Introduction</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1"
                            onClick={() => window.open(applicant.video_url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Watch Video
                          </Button>
                        </div>
                      )}

                      <div>
                        <Label className="text-gray-400">Notes</Label>
                        <Textarea
                          placeholder="Add notes about this applicant..."
                          value={notes[applicant.id] || applicant.notes || ""}
                          onChange={(e) => setNotes({ ...notes, [applicant.id]: e.target.value })}
                          className="mt-1"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => saveNotes(applicant.id)}
                            disabled={isUpdating[applicant.id]}
                          >
                            Save Notes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/recruiter/messages?applicant=${applicant.id}`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            ))
          )}
        </div>
      </div>
    </FadeIn>
  )
} 