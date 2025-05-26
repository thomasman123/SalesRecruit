"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { FadeIn } from "@/components/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input" // Correct import for Input
import {
  Search,
  ArrowLeft,
  Star,
  Users,
  Eye,
  Clock,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  User,
  Briefcase,
  DollarSign,
  Target,
  Wrench,
  Brain,
  Video,
  MoreHorizontal,
  Mail,
  Play,
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

export default function ApplicantsPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = Number(params.id)
  const supabase = getSupabaseClient()
  const [applicants, setApplicants] = useState<any[]>([])
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchApplicants = async () => {
      setLoading(true)
      try {
        // Fetch applicants for this job (after ensuring client has auth context)
        const { data, error } = await supabase
          .from("applicants")
          .select("*")
          .eq("job_id", jobId)
        if (error) throw error
        setApplicants(data || [])
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
    if (activeTab === "new" && applicant.status !== "new") return false
    if (activeTab === "reviewing" && applicant.status !== "reviewing") return false
    if (activeTab === "interviewing" && applicant.status !== "interviewing") return false
    if (activeTab === "hired" && applicant.status !== "hired") return false
    if (activeTab === "rejected" && applicant.status !== "rejected") return false
    if (activeTab === "starred" && !applicant.starred) return false
    return true
  })

  const handleStarToggle = async (id: number) => {
    try {
      const applicant = applicants.find(a => a.id === id)
      if (!applicant) return
      
      const { error } = await supabase
        .from("applicants")
        .update({ starred: !applicant.starred })
        .eq("id", id)
      
      if (error) throw error
      
      setApplicants((prev) =>
        prev.map((applicant) => (applicant.id === id ? { ...applicant, starred: !applicant.starred } : applicant)),
      )
    } catch (err: any) {
      console.error("Failed to update starred status:", err)
    }
  }

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

  return (
    <div className="container mx-auto max-w-7xl h-full overflow-hidden">
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
            <p className="text-gray-400 truncate">{applicants[0]?.job?.title}</p>
          </div>
        </div>
      </FadeIn>

      <div className="flex gap-4 min-h-0 overflow-hidden">
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

              <Tabs defaultValue="all" onValueChange={setActiveTab}>
                <TabsList className="bg-dark-700 p-1 w-full grid grid-cols-3 mb-4">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="starred"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                  >
                    Starred
                  </TabsTrigger>
                  <TabsTrigger
                    value="new"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                  >
                    New
                  </TabsTrigger>
                </TabsList>

                <TabsList className="bg-dark-700 p-1 w-full grid grid-cols-3">
                  <TabsTrigger
                    value="reviewing"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                  >
                    Reviewing
                  </TabsTrigger>
                  <TabsTrigger
                    value="interviewing"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                  >
                    Interviewing
                  </TabsTrigger>
                  <TabsTrigger
                    value="hired"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25"
                  >
                    Hired
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <AnimatedCard variant="hover-glow" className="flex-1 min-h-0">
              <ScrollArea className="h-[calc(100vh-24rem)]">
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
                              <h3 className="text-white font-medium truncate">{applicant.user?.name ?? applicant.name}</h3>
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">Applied {applicant.appliedDate}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStarToggle(applicant.id)
                            }}
                            className={cn(
                              "p-1 rounded-lg transition-all duration-300 flex-shrink-0",
                              applicant.starred
                                ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20"
                                : "text-gray-400 hover:text-yellow-400 hover:bg-dark-700",
                            )}
                          >
                            <Star className={cn("w-4 h-4", applicant.starred && "fill-current")} />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-400 min-w-0 flex-1">
                            <User className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{applicant.location}</span>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {getStatusBadge(applicant.status)}
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
                          : activeTab === "all"
                            ? "You don't have any applicants yet"
                            : `You don't have any ${activeTab} applicants`}
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
              <AnimatedCard variant="hover-glow" className="h-[calc(100vh-12rem)] min-h-0 overflow-hidden flex flex-col">
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
                          {selectedApplicant.starred && <Star className="w-5 h-5 text-yellow-400 fill-current flex-shrink-0" />}
                        </div>
                        <p className="text-gray-400 truncate">{selectedApplicant.location}</p>
                        <div className="flex items-center mt-2">{getStatusBadge(selectedApplicant.status)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <AnimatedButton variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </AnimatedButton>
                      <Link href={`/recruiter/messages?user=${selectedApplicant.user?.id}`}>
                        <AnimatedButton variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </AnimatedButton>
                      </Link>
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
                          <DropdownMenuSeparator className="bg-dark-600" />
                          <DropdownMenuItem
                            className="hover:bg-dark-600 cursor-pointer"
                            onClick={() => handleStarToggle(selectedApplicant.id)}
                          >
                            <Star
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedApplicant.starred ? "text-yellow-400 fill-current" : "text-gray-400",
                              )}
                            />
                            <span>{selectedApplicant.starred ? "Remove Star" : "Add Star"}</span>
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
                  <div className="flex justify-between">
                    <AnimatedButton
                      variant="outline"
                      onClick={() => handleStatusChange(selectedApplicant.id, "rejected")}
                    >
                      <XCircle className="w-4 h-4 mr-2 text-red-400" />
                      Reject
                    </AnimatedButton>
                    <div className="space-x-2">
                      <Link href={`/recruiter/messages?user=${selectedApplicant.user?.id}`}>
                        <AnimatedButton variant="outline">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </AnimatedButton>
                      </Link>
                      <AnimatedButton
                        variant="purple"
                        onClick={() => handleStatusChange(selectedApplicant.id, "hired")}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Hire Candidate
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </AnimatedCard>
            ) : (
              <AnimatedCard variant="hover-glow" className="h-[calc(100vh-12rem)] flex items-center justify-center">
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
    </div>
  )
}
